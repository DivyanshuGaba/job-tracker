# AWS build notes

Running record of every AWS resource and setting, used to rebuild it in Terraform later.
Region for everything: eu-north-1 (Stockholm). Tag on all resources: Project = job-tracker.

## Account decisions

- Free plan account with prepaid credits, so credits are the safety limit and hourly services matter.
- IAM Identity Center is not used (it would convert the account to a paid plan and end the credits).
- Terminal sign in: `aws login` with console credentials, short lived, region set to eu-north-1.
- Plan A: build, prove it works, then destroy the paid resources. Render and Vercel stay the live links.

## Checked limits (eu-north-1)

- Fargate on demand vCPU: 12
- Application Load Balancers per region: 50

## Budgets

- credit-burn-watch: monthly 60 USD, excludes Credit and Refund charge types, alerts at 80 percent actual and 100 percent forecast.

## Cost reminder

The load balancer, database, Fargate task and public IPs bill by the hour even with no traffic, roughly 1.70 USD a day together.
Destroy them when not testing, and check Credits remaining on the console home page.

## Resources created

### Network (console, free)

- VPC jobtracker-vpc: 10.20.0.0/16, DNS hostnames and resolution on, no IPv6, no NAT gateway, no VPC endpoints.
- Public subnets: 10.20.0.0/24 (eu-north-1a), 10.20.1.0/24 (eu-north-1b), route to the internet gateway.
- Private subnets: 10.20.10.0/24 (1a), 10.20.11.0/24 (1b), no internet route, used for the database.
- Containers go in the public subnets with a public IP, locked by their security group (no NAT, saves about 33 USD a month).

### Security groups (created and verified from the CLI)

- jobtracker-alb-sg: inbound HTTP 80 from the CloudFront managed prefix list, outbound 8000 to jobtracker-app-sg.
- jobtracker-app-sg: inbound 8000 from jobtracker-alb-sg only.
- jobtracker-db-sg: inbound 5432 from jobtracker-app-sg only, no outbound.

The app group outbound is open on purpose, so the task can reach ECR, Secrets Manager and CloudWatch.

### ECR

- Repository jobtracker-backend (private): immutable tags, scan on push, AES-256, lifecycle rule keeps the last 10 images, tag Project = job-tracker.
- Images are tagged with the git commit id and built for arm64 (Fargate Graviton).

### Build order (plan A)

Free pieces first: network, ECR, IAM roles, S3 and CloudFront. The hourly paid pieces (RDS, load balancer, Fargate) are created together in one sitting, tested, then destroyed.

### Image scan (basic scan on push, image 570276e)

- Result: 3 HIGH, 9 MEDIUM, 3 LOW. The HIGH findings are Debian system libraries in the base image (zlib and glibc), not application code.
- Debian marks the glibc one as minor with no fix yet for Debian 13. Accepted for the short test stack, re-scan before any long running deploy and rebuild with a fresh base image.


### Frontend (S3 and CloudFront)

- Bucket jobtracker-dg-frontend-2026 (eu-north-1): all public access blocked, built with `npm run build:aws` on Node 22 and uploaded with `aws s3 sync`.
- Pages are uploaded with no-cache, the hashed files under assets/ with a one year immutable cache.
- CloudFront distribution jobtracker-frontend: S3 origin with origin access control (OAC), default root object index.html, 403 and 404 return /index.html with 200 for the single page app, no WAF.
- Later: swap the error page rule for a CloudFront Function when /api/* is added, so API errors are not rewritten.

### Logs and alerts

- Log group /ecs/jobtracker-api, 14 day retention.
- SNS topic jobtracker-alerts with one confirmed email subscription. A test alert was delivered.
- Budget credit-burn-watch emails at 80 percent actual and 100 percent forecast. It sends nothing until a threshold is crossed, which is normal.

### IAM roles

- jobtracker-ecs-execution: pull only the jobtracker-backend image, write only to the /ecs/jobtracker-api log group, read only the secret jobtracker/app. The database secret is added after RDS exists.
- jobtracker-ecs-task: no permissions yet. Add only when a feature needs them.
- zsh note: write `${VAR}` when a variable is followed by a colon, because `$VAR:r` is a zsh modifier.

### Secrets

- jobtracker/app holds one JSON key, SECRET_KEY (random 64 characters, never displayed). About 0.40 USD a month, so delete with no recovery window when destroying the stack.

### Database (RDS)

- jobtracker-db: PostgreSQL 16 on db.t4g.micro, single zone, 20 GB gp3, encrypted, private subnets, master password managed by RDS in Secrets Manager (not set by hand).
- The free plan caps backup retention at 1 day, so 7 days was refused (FreeTierRestrictionError). Upgrading the plan would end the credits, so it stays at 1.
- The app connects with the master user for now. A smaller app-only user is a later improvement.

### API on ECS Fargate

- Cluster jobtracker, task definition jobtracker-api (0.25 vCPU, 512 MB, ARM64), service jobtracker-api with the deployment circuit breaker and rollback.
- Secrets come from Secrets Manager (SECRET_KEY, DB_USER, DB_PASSWORD). Other settings are plain environment values in the task definition.
- Migration runs as a one-off task with the command override `alembic upgrade head`. A second one-off task listed the tables to prove it (alembic_version, users, applications).
- Alembic is quiet on success, so empty logs for a migration are normal.

### Load balancer and CloudFront API route

- jobtracker-alb in the public subnets, listener on port 80. Default answer is 403, and a rule forwards to jobtracker-tg only when the header X-Origin-Verify matches a secret kept in a private file outside the repo.
- CloudFront has a second origin for the load balancer (HTTP only) and a /api/* behavior: caching disabled, all methods, origin request policy AllViewerExceptHostHeader.
- Known limit: the hop from CloudFront to the load balancer is plain HTTP. Encrypting it needs a custom domain and a certificate.
- The header value was partly shown in a screenshot, so replace it with a fresh value in the Terraform rebuild.
- A CloudFront Function (jobtracker-spa-rewrite, viewer request on the default behavior) sends paths without a file extension to /index.html. The old 403 and 404 error page rules were removed so API errors pass through.

### Alarms

- jobtracker-no-healthy-target, jobtracker-api-5xx and jobtracker-db-low-storage all notify the jobtracker-alerts topic.

### Test result

- Full path proven on the CloudFront address: sign up, sign in, add a job, refresh, sign out and in again.

### Teardown after the first full test (28 Oct 2026)

- Deleted by hand: ECS service jobtracker-api, load balancer jobtracker-alb (listener and rule with it), database jobtracker-db (no final snapshot, test data only, its managed secret with it).
- Kept: VPC and security groups, ECR and the image, S3 and CloudFront with the function, IAM roles, secret jobtracker/app, log group, target group, cluster, task definition, alarms (actions switched off).
- Checked afterwards: no running tasks, no Elastic IPs, no jobtracker database left.
- The CloudFront /api/* origin now points at a deleted load balancer, so the API is down on the AWS site until the rebuild.
- Rebuild from Terraform: new database and secret, new load balancer and header value, update the secrets policy and the CloudFront origin, switch the alarm actions back on.

### Terraform rebuild (28 Oct 2026)

- The whole stack is now defined in infra/ (13 files, 46 resources plus the ECR pair) with remote state in a private versioned S3 bucket and native S3 locking. The state bucket and the jobtracker-alerts topic stay hand-made on purpose, because the email subscription needs a manual confirmation.
- The hand-built pieces with clashing names were deleted first with a one-time script, then Terraform built everything fresh.
- Two stage apply: stage 1 created only the ECR repository, then the image was pushed, then stage 2 created the rest with image_tag and api_desired_count=1.
- The ECS service ignores task_definition changes, so deploys register a new revision and update the service from the pipeline instead of from Terraform.
- Gotchas: zsh treats `$VAR:r` as a modifier, so use `${VAR}`; the free plan caps RDS backups at 1 day; the CloudFront header value is generated by Terraform and stored in state.
- Proven on the new address: health check, sign up, add a job, refresh. The old hand-built VPC is still there and should be deleted from the console.

### Deploys without OIDC

- The preferred design was GitHub Actions with OIDC, so no stored AWS keys. The account sits inside an AWS Organization whose service control policy explicitly denies the OpenID Connect provider actions (Get and List both returned an explicit deny), so the provider cannot be used here.
- Instead, scripts/deploy.sh does the same steps from a signed in terminal: build and push the image, register a new task definition revision, run migrations as a one-off task, update the service and check it did not roll back, then build the frontend, sync it to S3 and invalidate CloudFront.
- GitHub Actions still runs the backend tests on every push and pull request. Permanent access keys in GitHub secrets were rejected on purpose.
- Usage: from the repo root on a clean tree, `scripts/deploy.sh` (all), or `scripts/deploy.sh backend` or `scripts/deploy.sh frontend`. Needs Node 22 for the frontend build and Docker running.
