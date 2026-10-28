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

