terraform{
    required_version = ">= 1.5.0"

    required_providers {
        google = {
            source = "hashicorp/google"
            version = "~> 5.0"
        }
        mongodbatlas = {
            source = "mongodb/mongodbatlas"
            version = "~> 1.14"
        }
    }

    # 遠端狀態存儲 (GCS)
    backend "gcs" {
      bucket      = "splitquest-prod-terraform-state"
      prefix      = "prod"
      credentials = "../terraform-sa-key.json"
    }
}

provider "google" {
  project = var.project_id
  region  = var.region
  credentials = file(var.credentials_file)
}

# MongoDB Atlas Provider (需要 API Key)
provider "mongodbatlas" {
  public_key  = var.mongodb_atlas_public_key
  private_key = var.mongodb_atlas_private_key
}