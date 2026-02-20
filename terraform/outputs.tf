output "cloud_run_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.austinbusgo_db.connection_name
}

output "cloud_sql_public_ip" {
  description = "Cloud SQL public IP"
  value       = google_sql_database_instance.austinbusgo_db.public_ip_address
}

output "workload_identity_provider" {
  description = "Workload Identity Provider resource name (for GitHub Actions)"
  value       = google_iam_workload_identity_pool_provider.github_provider.name
}
