data "aws_sns_topic" "alerts" {
  name = var.alerts_topic_name
}

resource "aws_cloudwatch_metric_alarm" "no_healthy_target" {
  alarm_name          = "${var.name}-no-healthy-target"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HealthyHostCount"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 3
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [data.aws_sns_topic.alerts.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.api.arn_suffix
    LoadBalancer = aws_lb.api.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.name}-api-5xx"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [data.aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.api.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "db_low_storage" {
  alarm_name          = "${var.name}-db-low-storage"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  statistic           = "Minimum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 2147483648
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [data.aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
}
