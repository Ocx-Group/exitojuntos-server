output "app_live_url" {
  description = "URL pública de la aplicación en App Platform"
  value       = digitalocean_app.exitojuntos.live_url
}

output "app_id" {
  description = "ID de la App en DigitalOcean"
  value       = digitalocean_app.exitojuntos.id
}

output "default_ingress" {
  description = "Dominio generado por App Platform"
  value       = digitalocean_app.exitojuntos.default_ingress
}
