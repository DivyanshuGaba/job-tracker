resource "aws_db_subnet_group" "main" {
  name       = "${var.name}-db-subnets"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier                  = "${var.name}-db"
  engine                      = "postgres"
  engine_version              = "16"
  instance_class              = "db.t4g.micro"
  allocated_storage           = 20
  storage_type                = "gp3"
  storage_encrypted           = true
  db_name                     = "jobtracker"
  username                    = "jtadmin"
  manage_master_user_password = true
  db_subnet_group_name        = aws_db_subnet_group.main.name
  vpc_security_group_ids      = [aws_security_group.db.id]
  publicly_accessible         = false
  multi_az                    = false
  backup_retention_period     = 1
  copy_tags_to_snapshot       = true
  skip_final_snapshot         = true
  deletion_protection         = false
  auto_minor_version_upgrade  = true
  apply_immediately           = true
}
