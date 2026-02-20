variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "austin-bus-go"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "github_repo" {
  description = "GitHub repository in owner/repo format"
  type        = string
  default     = "gges5110/austinbusgo"
}

variable "db_password" {
  description = "Cloud SQL postgres user password"
  type        = string
  sensitive   = true
}
