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

(none yet)
