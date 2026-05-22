variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "app_name" {
  description = "Nombre de la App en App Platform"
  type        = string
  default     = "exitojuntos"
}

variable "region" {
  description = "Región de App Platform (nyc, fra, ams, sgp, syd, lon, tor, blr, sfo)"
  type        = string
  default     = "nyc"
}

variable "backend_github_repo" {
  description = "Repositorio GitHub del backend (formato: usuario-u-org/nombre-repo)"
  type        = string
}

variable "frontend_github_repo" {
  description = "Repositorio GitHub del frontend (formato: usuario-u-org/nombre-repo)"
  type        = string
}

variable "backend_instance_size" {
  description = "Tamaño de instancia del backend (apps-s-1vcpu-0.5gb ~$5/mes, apps-s-1vcpu-1gb ~$10/mes)"
  type        = string
  default     = "apps-s-1vcpu-0.5gb"
}

variable "db_size" {
  description = "Tamaño del cluster PostgreSQL (db-s-1vcpu-1gb ~$15/mes)"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "jwt_secret" {
  description = "Secret para firmar JWT"
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "Tiempo de expiración del JWT"
  type        = string
  default     = "1d"
}

variable "brevo_api_key" {
  description = "API Key de Brevo para envío de emails"
  type        = string
  sensitive   = true
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID para S3"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key para S3"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_region" {
  description = "Región de AWS S3"
  type        = string
  default     = ""
}

variable "aws_bucket_name" {
  description = "Nombre del bucket S3"
  type        = string
  default     = ""
}
