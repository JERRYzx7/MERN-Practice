variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-east1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "asia-east1-a"
}

variable "credentials_file" {
  description = "Path to GCP service account key"
  type        = string
  default     = "../terraform-sa-key.json"
}

variable "gke_cluster_name" {
  description = "GKE Cluster name"
  type        = string
  default     = "splitquest-cluster"
}

variable "gke_node_machine_type" {
  description = "GKE node machine type"
  type        = string
  default     = "e2-small" # 2 vCPU, 2GB RAM, ~$15/月
}

variable "gke_node_count" {
  description = "Number of GKE nodes"
  type        = number
  default     = 1 # 單節點省錢
}

# MongoDB Atlas (選填，也可手動建立)
variable "mongodb_atlas_public_key" {
  description = "MongoDB Atlas API Public Key"
  type        = string
  default     = ""
}

variable "mongodb_atlas_private_key" {
  description = "MongoDB Atlas API Private Key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mongodb_atlas_org_id" {
  description = "MongoDB Atlas Organization ID"
  type        = string
  default     = ""
}