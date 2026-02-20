# Cloud Run backend service
resource "google_cloud_run_v2_service" "backend" {
  name     = "austinbusgo-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      max_instance_count = 1
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.austinbusgo_db.connection_name]
      }
    }

    containers {
      image = "gcr.io/${var.project_id}/austinbusgo-backend:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
        startup_cpu_boost = true
      }

      env {
        name  = "DATABASE_URL"
        value = "postgresql://postgres:${var.db_password}@/local-db?host=/cloudsql/${google_sql_database_instance.austinbusgo_db.connection_name}&sslmode=disable"
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Allow unauthenticated access to Cloud Run
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
