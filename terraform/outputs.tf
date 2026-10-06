output "cloud_run_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "workload_identity_provider" {
  description = "Workload Identity Provider resource name (for GitHub Actions)"
  value       = google_iam_workload_identity_pool_provider.github_provider.name
}
