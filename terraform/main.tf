terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_app" "exitojuntos" {
  spec {
    name   = var.app_name
    region = var.region

    # ── Backend: NestJS ──────────────────────────────────────────────────────
    service {
      name               = "api"
      instance_count     = 1
      instance_size_slug = var.backend_instance_size

      github {
        repo           = var.backend_github_repo
        branch         = "main"
        deploy_on_push = true
      }

      dockerfile_path = "Dockerfile"
      http_port       = 3000

      routes {
        path                 = "/api"
        preserve_path_prefix = true
      }

      health_check {
        http_path             = "/api/docs"
        initial_delay_seconds = 60
        period_seconds        = 30
        failure_threshold     = 3
      }

      # Runtime
      env { key = "NODE_ENV"       value = "production" scope = "RUN_TIME" }
      env { key = "PORT"           value = "3000"       scope = "RUN_TIME" }
      env { key = "FRONTEND_URL"   value = "$${APP_URL}" scope = "RUN_TIME" }

      # PostgreSQL – inyectado desde el componente "db"
      env { key = "DB_HOST"     value = "$${db.HOSTNAME}" scope = "RUN_TIME" type = "SECRET" }
      env { key = "DB_PORT"     value = "$${db.PORT}"     scope = "RUN_TIME" }
      env { key = "DB_USERNAME" value = "$${db.USERNAME}" scope = "RUN_TIME" type = "SECRET" }
      env { key = "DB_PASSWORD" value = "$${db.PASSWORD}" scope = "RUN_TIME" type = "SECRET" }
      env { key = "DB_DATABASE" value = "$${db.DATABASE}" scope = "RUN_TIME" }

      # Secrets de aplicación
      env { key = "JWT_SECRET"            value = var.jwt_secret            scope = "RUN_TIME" type = "SECRET" }
      env { key = "JWT_EXPIRES_IN"        value = var.jwt_expires_in        scope = "RUN_TIME" }
      env { key = "BREVO_API_KEY"         value = var.brevo_api_key         scope = "RUN_TIME" type = "SECRET" }
      env { key = "AWS_ACCESS_KEY_ID"     value = var.aws_access_key_id     scope = "RUN_TIME" type = "SECRET" }
      env { key = "AWS_SECRET_ACCESS_KEY" value = var.aws_secret_access_key scope = "RUN_TIME" type = "SECRET" }
      env { key = "AWS_REGION"            value = var.aws_region            scope = "RUN_TIME" }
      env { key = "AWS_BUCKET_NAME"       value = var.aws_bucket_name       scope = "RUN_TIME" }
    }

    # ── Frontend: Angular SPA ─────────────────────────────────────────────────
    # App Platform construye desde el source y sirve los archivos estáticos.
    # deploy_on_push = true activa el redeploy automático en cada push a main.
    static_site {
      name = "frontend"

      github {
        repo           = var.frontend_github_repo
        branch         = "main"
        deploy_on_push = true
      }

      build_command     = "npm run build:prod"
      output_dir        = "dist/main"
      environment_slug  = "node-js"
      catchall_document = "index.html"
    }

    # ── PostgreSQL administrado ───────────────────────────────────────────────
    database {
      name      = "db"
      engine    = "PG"
      version   = "16"
      size      = var.db_size
      num_nodes = 1
      production = false
    }

  }
}
