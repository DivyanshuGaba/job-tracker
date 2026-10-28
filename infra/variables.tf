variable "region" {
  type    = string
  default = "eu-north-1"
}

variable "name" {
  description = "Prefix used in resource names."
  type        = string
  default     = "jobtracker"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "azs" {
  type    = list(string)
  default = ["eu-north-1a", "eu-north-1b"]
}

variable "frontend_bucket_name" {
  type    = string
  default = "jobtracker-dg-frontend-2026"
}

variable "image_tag" {
  description = "Image tag in ECR that the API task runs."
  type        = string
  default     = "latest-not-set"
}

variable "api_desired_count" {
  description = "0 until an image exists in ECR, then 1."
  type        = number
  default     = 0
}

variable "alerts_topic_name" {
  description = "Existing SNS topic created by hand and confirmed by email."
  type        = string
  default     = "jobtracker-alerts"
}
