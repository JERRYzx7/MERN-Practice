# terraform/main.tf

# ============================================
# VPC Network
# ============================================

resource "google_compute_network" "vpc" {
  name                    = "splitquest-vpc"
  auto_create_subnetworks = false
  description             = "VPC for SplitQuest GKE cluster"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "splitquest-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id

  # GKE 需要的次要 IP 範圍
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/20"
  }
}

# ============================================
# GKE Cluster
# ============================================

resource "google_container_cluster" "primary" {
  name     = var.gke_cluster_name
  location = var.zone # Zonal cluster 比 Regional 便宜

  # 移除預設 node pool，自己建立
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  # 使用 VPC-native (alias IP)
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Workload Identity (推薦的 GCP 服務認證方式)
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # 停用 Cloud Logging/Monitoring 省錢 (學習用)
  logging_service    = "none"
  monitoring_service = "none"
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = var.gke_node_count

  node_config {
    machine_type = var.gke_node_machine_type
    disk_size_gb = 30 # 最小磁碟，省錢
    disk_type    = "pd-standard"

    # Spot VM 可以更省，但可能被中斷
    # spot = true

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = "prod"
    }

    # 啟用 Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}

# ============================================
# Artifact Registry (Docker Images)
# ============================================

resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = "splitquest"
  description   = "Docker images for SplitQuest"
  format        = "DOCKER"

  # 清理政策：保留最近 5 個版本
  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 5
    }
  }
}

# ============================================
# Cloud Storage (Terraform State)
# ============================================

resource "google_storage_bucket" "terraform_state" {
  name     = "${var.project_id}-terraform-state"
  location = var.region

  # 版本控制，防止誤刪
  versioning {
    enabled = true
  }

  # 生命週期：非當前版本 30 天後刪除
  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }

  # 防止意外刪除
  force_destroy = false
}

# ============================================
# Firewall Rules
# ============================================

resource "google_compute_firewall" "allow_internal" {
  name    = "allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  source_ranges = ["10.0.0.0/8"]
}