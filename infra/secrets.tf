resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "random_password" "origin_header" {
  length  = 48
  special = false
}

resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.name}/app"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id     = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({ SECRET_KEY = random_password.jwt.result })
}
