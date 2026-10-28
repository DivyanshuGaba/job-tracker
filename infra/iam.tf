locals {
  ecs_trust = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role" "execution" {
  name               = "${var.name}-ecs-execution"
  assume_role_policy = local.ecs_trust
}

resource "aws_iam_role_policy" "execution" {
  name = "${var.name}-execution-access"
  role = aws_iam_role.execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EcrToken"
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Sid      = "EcrPull"
        Effect   = "Allow"
        Action   = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"]
        Resource = aws_ecr_repository.backend.arn
      },
      {
        Sid      = "Logs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.api.arn}:*"
      },
      {
        Sid    = "ReadSecrets"
        Effect = "Allow"
        Action = "secretsmanager:GetSecretValue"
        Resource = [
          aws_secretsmanager_secret.app.arn,
          aws_db_instance.main.master_user_secret[0].secret_arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "task" {
  name               = "${var.name}-ecs-task"
  assume_role_policy = local.ecs_trust
}
