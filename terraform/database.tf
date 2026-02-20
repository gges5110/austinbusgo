# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "austinbusgo_db" {
  name             = "austinbusgo-db"
  database_version = "POSTGRES_18"
  region           = var.region

  deletion_protection = true

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    edition           = "ENTERPRISE"
    disk_type         = "PD_SSD"
    disk_size         = 10
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "06:00"
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
      }
    }

    ip_configuration {
      ipv4_enabled = true
      ssl_mode     = "ENCRYPTED_ONLY"

    }

    location_preference {
      zone = "${var.region}-c"
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    password_validation_policy {
      enable_password_policy      = true
      min_length                  = 8
      complexity                  = "COMPLEXITY_DEFAULT"
      disallow_username_substring = true
    }
  }
}

# Application database
resource "google_sql_database" "local_db" {
  name     = "local-db"
  instance = google_sql_database_instance.austinbusgo_db.name
}

# postgres user
resource "google_sql_user" "postgres" {
  name     = "postgres"
  instance = google_sql_database_instance.austinbusgo_db.name
  password = var.db_password
}
