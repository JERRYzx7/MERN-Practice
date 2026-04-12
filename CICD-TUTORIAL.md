# SplitQuest CI/CD 完整學習教學

> **目標**：從零開始，使用 GCP $300 免費額度，親手建立完整的 DevOps 工作流
> 
> **預估成本**：~$18-23 USD/月（可撐 13+ 個月）

## 📋 目錄

1. [架構概覽](#架構概覽)
2. [前置準備](#前置準備)
3. [Phase 1: Terraform 基礎設施](#phase-1-terraform-基礎設施)
4. [Phase 2: Docker + Helm Chart](#phase-2-docker--helm-chart)
5. [Phase 3: GitHub Actions CI](#phase-3-github-actions-ci)
6. [Phase 4: Argo CD 持續部署](#phase-4-argo-cd-持續部署)
7. [Phase 5: Argo Workflows 進階](#phase-5-argo-workflows-進階)
8. [Phase 6: 維運與優化](#phase-6-維運與優化)
9. [附錄：成本優化技巧](#附錄成本優化技巧)

---

## 架構概覽

```
┌─────────────────────────────────────────────────────────────────────┐
│                         開發者工作站                                  │
│  ┌─────────────┐                                                    │
│  │ VS Code     │                                                    │
│  │ + Docker    │ ◄── 本機開發 + docker-compose                      │
│  └──────┬──────┘                                                    │
└─────────┼───────────────────────────────────────────────────────────┘
          │ git push
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub                                       │
│  ┌─────────────────┐         ┌─────────────────┐                    │
│  │ mern (App Repo) │         │ mern-gitops     │                    │
│  │                 │         │ (GitOps Repo)   │                    │
│  │ - src/          │         │                 │                    │
│  │ - frontend/     │  ────►  │ - helm/         │                    │
│  │ - Dockerfile    │ Update  │ - apps/         │                    │
│  └────────┬────────┘  Tag    └────────┬────────┘                    │
│           │                           │                              │
│  ┌────────▼────────┐                  │ Argo CD 監聽                 │
│  │ GitHub Actions  │                  │                              │
│  │ - Build Image   │                  │                              │
│  │ - Push to GAR   │                  │                              │
│  │ - Update values │                  │                              │
│  └─────────────────┘                  │                              │
└───────────────────────────────────────┼──────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GCP (asia-east1)                                  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    GKE Cluster                               │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │    │
│  │  │   Argo CD     │  │   Backend     │  │   Frontend    │    │    │
│  │  │   (GitOps)    │  │   (Node.js)   │  │   (Nginx)     │    │    │
│  │  └───────────────┘  └───────┬───────┘  └───────┬───────┘    │    │
│  │                             │                  │             │    │
│  │  ┌──────────────────────────┴──────────────────┴──────────┐ │    │
│  │  │                    Ingress (nginx)                      │ │    │
│  │  │                    + cert-manager TLS                   │ │    │
│  │  └─────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │ Artifact Reg.   │  │ Cloud Storage   │                           │
│  │ (Docker Images) │  │ (Terraform)     │                           │
│  └─────────────────┘  └─────────────────┘                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas (Free M0)                           │
│                    - 512MB Storage                                   │
│                    - Shared Cluster                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 技術選型理由

| 技術 | 選擇理由 |
|------|----------|
| **GKE Standard** | 比 Autopilot 省錢，e2-small 足夠學習 |
| **MongoDB Atlas** | 免費 M0 tier，免維護，Terraform 有 provider |
| **Artifact Registry** | 比 GCR 新，整合更好，有免費額度 |
| **Argo CD** | GitOps 業界標準，UI 直觀，學習資源豐富 |
| **Helm** | K8s 套件管理標準，模板化部署 |
| **cert-manager** | 自動 Let's Encrypt 憑證 |
| **nip.io** | 免費萬用 DNS，無需購買網域 |

---

## 前置準備

### 1. 安裝必要工具

```powershell
# Windows (使用 winget)

# 1. Google Cloud SDK
winget install Google.CloudSDK

# 2. Terraform
winget install Hashicorp.Terraform

# 3. kubectl
winget install Kubernetes.kubectl

# 4. Helm
winget install Helm.Helm

# 5. Argo CD CLI (❌ 不需要安裝，本教學全程用 Web UI)
# 如果你之後想用命令行操作，可以裝：
# winget install argoproj.argocd

# 驗證安裝
gcloud version
terraform version
kubectl version --client
helm version
```

### 2. GCP 帳號設定

```powershell
# 登入 GCP
gcloud auth login

# 建立新專案 (名稱全球唯一)
gcloud projects create splitquest-prod --name="SplitQuest Production"

# 設定預設專案
gcloud config set project splitquest-prod

# 連結帳單帳戶 (在 Console UI 操作較方便)
# https://console.cloud.google.com/billing

# 啟用必要的 API
gcloud services enable `
  container.googleapis.com `
  artifactregistry.googleapis.com `
  compute.googleapis.com `
  iam.googleapis.com `
  cloudresourcemanager.googleapis.com `
  servicenetworking.googleapis.com
```

### 3. 建立服務帳號 (給 Terraform 用)

```powershell
# 建立服務帳號
gcloud iam service-accounts create terraform-sa `
  --display-name="Terraform Service Account"

# 授予權限 (Owner 權限，生產環境要更細緻)
gcloud projects add-iam-policy-binding splitquest-prod `
  --member="serviceAccount:terraform-sa@splitquest-prod.iam.gserviceaccount.com" `
  --role="roles/owner"

# 下載金鑰 (妥善保管！)
gcloud iam service-accounts keys create ./terraform-sa-key.json `
  --iam-account=terraform-sa@splitquest-prod.iam.gserviceaccount.com

# ⚠️ 重要：將金鑰加入 .gitignore
echo "terraform-sa-key.json" >> .gitignore
```

### 4. MongoDB Atlas 帳號

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) 註冊
2. 建立免費 M0 叢集，選擇 `GCP asia-south1` (距離台灣最近的免費選項)
3. 建立資料庫使用者，記下帳密
4. Network Access 設定 `0.0.0.0/0` (學習用，生產環境要限制)
5. 取得連線字串：`mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/splitquest`

### 5. 準備 GitHub Repos

```powershell
# App Repo (你現有的)
# D:\mern → https://github.com/YOUR_USERNAME/mern

# 建立 GitOps Repo
mkdir D:\mern-gitops
cd D:\mern-gitops
git init
# 建立基本結構 (後面會填充)
mkdir -p helm/splitquest apps
echo "# SplitQuest GitOps" > README.md
git add .
git commit -m "Initial commit"
# 在 GitHub 建立 repo 後 push
git remote add origin https://github.com/YOUR_USERNAME/mern-gitops.git
git push -u origin main
```

---

## Phase 1: Terraform 基礎設施

### 目標

使用 Terraform 自動化建立：
- GKE Cluster (1 node, e2-small)
- Artifact Registry (Docker 映像倉庫)
- VPC Network
- Cloud Storage Bucket (Terraform state)

### 1.1 建立 Terraform 專案結構

```powershell
mkdir D:\mern\terraform
cd D:\mern\terraform

# 建立檔案結構
New-Item -ItemType File -Name "main.tf"
New-Item -ItemType File -Name "variables.tf"
New-Item -ItemType File -Name "outputs.tf"
New-Item -ItemType File -Name "versions.tf"
New-Item -ItemType File -Name "terraform.tfvars"
```

### 1.2 versions.tf - Provider 版本鎖定

```hcl
# terraform/versions.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.14"
    }
  }

  # 遠端狀態存儲 (先用 local，GCS bucket 建好後再遷移)
  # backend "gcs" {
  #   bucket = "splitquest-terraform-state"
  #   prefix = "prod"
  # }
}

provider "google" {
  project     = var.project_id
  region      = var.region
  credentials = file(var.credentials_file)
}

# MongoDB Atlas Provider (需要 API Key)
provider "mongodbatlas" {
  public_key  = var.mongodb_atlas_public_key
  private_key = var.mongodb_atlas_private_key
}
```

### 1.3 variables.tf - 變數定義

```hcl
# terraform/variables.tf

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
```

### 1.4 main.tf - 主要資源定義

```hcl
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
```

### 1.5 outputs.tf - 輸出值

```hcl
# terraform/outputs.tf

output "gke_cluster_name" {
  description = "GKE Cluster Name"
  value       = google_container_cluster.primary.name
}

output "gke_cluster_endpoint" {
  description = "GKE Cluster Endpoint"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "artifact_registry_url" {
  description = "Artifact Registry URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/splitquest"
}

output "terraform_state_bucket" {
  description = "Terraform State Bucket"
  value       = google_storage_bucket.terraform_state.name
}

output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --zone ${var.zone} --project ${var.project_id}"
}
```

### 1.6 terraform.tfvars - 變數值

```hcl
# terraform/terraform.tfvars
# ⚠️ 這個檔案應該加入 .gitignore (包含敏感資訊)

project_id       = "splitquest-prod"  # 換成你的專案 ID
region           = "asia-east1"
zone             = "asia-east1-a"
credentials_file = "../terraform-sa-key.json"

# MongoDB Atlas (如果要用 Terraform 管理)
# mongodb_atlas_public_key  = "xxxxxxxx"
# mongodb_atlas_private_key = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# mongodb_atlas_org_id      = "xxxxxxxxxxxxxxxxxxxxxxxx"
```

### 1.7 執行 Terraform

```powershell
cd D:\mern\terraform

# 初始化 (下載 provider)
terraform init

# 預覽變更
terraform plan

# 套用變更 (確認後輸入 yes)
terraform apply

# 輸出會顯示：
# - GKE cluster name
# - Artifact Registry URL
# - kubectl 設定指令
```

### 1.8 設定 kubectl

```powershell
# 使用 Terraform 輸出的指令
gcloud container clusters get-credentials splitquest-cluster `
  --zone asia-east1-a `
  --project splitquest-prod

# 驗證連線
kubectl get nodes
# 應該看到 1 個 node
```

### 1.9 遷移 Terraform State 到 GCS (選做)

```powershell
# 在 versions.tf 取消註解 backend "gcs" 區塊
# 然後重新初始化

terraform init -migrate-state

# Terraform 會問你是否要遷移，輸入 yes
```

---

## Phase 2: Docker + Helm Chart

### 目標

1. 為 Backend 和 Frontend 建立 Dockerfile
2. 建立 Helm Chart 管理 K8s 部署

### 2.1 Backend Dockerfile

```dockerfile
# Dockerfile (放在專案根目錄)

# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package files
COPY package*.json ./
COPY tsconfig.json ./

# 安裝依賴
RUN npm ci

# 複製源碼
COPY src/ ./src/

# 編譯 TypeScript
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# 安全性：使用非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 只複製生產依賴
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 複製編譯後的程式碼
COPY --from=builder /app/dist ./dist

# 切換到非 root 用戶
USER nodejs

# 暴露埠號
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 啟動指令
CMD ["node", "dist/server.js"]
```

### 2.2 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile

# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package files
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製源碼
COPY . .

# 建置參數 (可被覆蓋)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# 建置
RUN npm run build

# ============================================
# Stage 2: Production (Nginx)
# ============================================
FROM nginx:alpine AS production

# 複製自定義 nginx 設定
COPY nginx.conf /etc/nginx/nginx.conf

# 複製建置產物
COPY --from=builder /app/dist /usr/share/nginx/html

# 非 root 用戶
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 Frontend Nginx 設定

```nginx
# frontend/nginx.conf

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 啟用 gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # 健康檢查端點
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # 靜態資源快取
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 安全標頭
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

### 2.4 建立 Helm Chart

```powershell
# 在 mern-gitops repo 建立 Helm Chart
cd D:\mern-gitops

helm create helm/splitquest

# 刪除不需要的範例檔案
Remove-Item -Recurse helm/splitquest/templates/tests
Remove-Item helm/splitquest/templates/hpa.yaml
Remove-Item helm/splitquest/templates/serviceaccount.yaml
```

### 2.5 Helm Chart 結構

```
mern-gitops/
├── helm/
│   └── splitquest/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-prod.yaml
│       └── templates/
│           ├── _helpers.tpl
│           ├── backend-deployment.yaml
│           ├── backend-service.yaml
│           ├── frontend-deployment.yaml
│           ├── frontend-service.yaml
│           ├── ingress.yaml
│           ├── configmap.yaml
│           └── secrets.yaml
└── apps/
    └── splitquest.yaml  # Argo CD Application
```

### 2.6 Chart.yaml

```yaml
# helm/splitquest/Chart.yaml

apiVersion: v2
name: splitquest
description: SplitQuest - A pixel-style expense splitting app
type: application
version: 1.0.0
appVersion: "1.0.0"

keywords:
  - expense
  - splitwise
  - mern

maintainers:
  - name: Your Name
    email: your@email.com
```

### 2.7 values.yaml

```yaml
# helm/splitquest/values.yaml

# 全域設定
global:
  imageRegistry: asia-east1-docker.pkg.dev/splitquest-prod/splitquest
  imagePullPolicy: IfNotPresent

# Backend 設定
backend:
  name: backend
  replicaCount: 1
  
  image:
    repository: backend
    tag: latest  # CI 會更新這個
  
  service:
    type: ClusterIP
    port: 3000
  
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
  
  env:
    NODE_ENV: production
    PORT: "3000"
  
  # 敏感資訊從 Secret 讀取
  secretName: splitquest-secrets

# Frontend 設定
frontend:
  name: frontend
  replicaCount: 1
  
  image:
    repository: frontend
    tag: latest
  
  service:
    type: ClusterIP
    port: 80
  
  resources:
    requests:
      cpu: 50m
      memory: 64Mi
    limits:
      cpu: 200m
      memory: 128Mi

# Ingress 設定
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
  
  # 使用 nip.io (會被 CI 動態設定)
  host: ""  # 例如: 34.56.78.90.nip.io
  
  tls:
    enabled: true
    secretName: splitquest-tls

# MongoDB 連線 (從 Secret 讀取)
mongodb:
  secretKey: MONGODB_URI
```

### 2.8 values-prod.yaml (環境覆蓋)

```yaml
# helm/splitquest/values-prod.yaml

# Production 特定設定
backend:
  replicaCount: 1  # 單節點省錢
  
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

frontend:
  replicaCount: 1
```

### 2.9 templates/backend-deployment.yaml

```yaml
# helm/splitquest/templates/backend-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.backend.name }}
  labels:
    app: {{ .Values.backend.name }}
    app.kubernetes.io/name: {{ .Chart.Name }}
    app.kubernetes.io/instance: {{ .Release.Name }}
spec:
  replicas: {{ .Values.backend.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Values.backend.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.backend.name }}
    spec:
      containers:
        - name: {{ .Values.backend.name }}
          image: "{{ .Values.global.imageRegistry }}/{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
          imagePullPolicy: {{ .Values.global.imagePullPolicy }}
          ports:
            - containerPort: {{ .Values.backend.service.port }}
          env:
            {{- range $key, $value := .Values.backend.env }}
            - name: {{ $key }}
              value: {{ $value | quote }}
            {{- end }}
            # 從 Secret 讀取敏感資訊
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.backend.secretName }}
                  key: {{ .Values.mongodb.secretKey }}
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.backend.secretName }}
                  key: JWT_SECRET
          resources:
            {{- toYaml .Values.backend.resources | nindent 12 }}
          livenessProbe:
            httpGet:
              path: /health
              port: {{ .Values.backend.service.port }}
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: {{ .Values.backend.service.port }}
            initialDelaySeconds: 5
            periodSeconds: 5
```

### 2.10 templates/backend-service.yaml

```yaml
# helm/splitquest/templates/backend-service.yaml

apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.backend.name }}
  labels:
    app: {{ .Values.backend.name }}
spec:
  type: {{ .Values.backend.service.type }}
  ports:
    - port: {{ .Values.backend.service.port }}
      targetPort: {{ .Values.backend.service.port }}
      protocol: TCP
  selector:
    app: {{ .Values.backend.name }}
```

### 2.11 templates/frontend-deployment.yaml

```yaml
# helm/splitquest/templates/frontend-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.frontend.name }}
  labels:
    app: {{ .Values.frontend.name }}
spec:
  replicas: {{ .Values.frontend.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Values.frontend.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.frontend.name }}
    spec:
      containers:
        - name: {{ .Values.frontend.name }}
          image: "{{ .Values.global.imageRegistry }}/{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}"
          imagePullPolicy: {{ .Values.global.imagePullPolicy }}
          ports:
            - containerPort: {{ .Values.frontend.service.port }}
          resources:
            {{- toYaml .Values.frontend.resources | nindent 12 }}
          livenessProbe:
            httpGet:
              path: /health
              port: {{ .Values.frontend.service.port }}
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: {{ .Values.frontend.service.port }}
            initialDelaySeconds: 3
            periodSeconds: 5
```

### 2.12 templates/frontend-service.yaml

```yaml
# helm/splitquest/templates/frontend-service.yaml

apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.frontend.name }}
  labels:
    app: {{ .Values.frontend.name }}
spec:
  type: {{ .Values.frontend.service.type }}
  ports:
    - port: {{ .Values.frontend.service.port }}
      targetPort: {{ .Values.frontend.service.port }}
      protocol: TCP
  selector:
    app: {{ .Values.frontend.name }}
```

### 2.13 templates/ingress.yaml

```yaml
# helm/splitquest/templates/ingress.yaml

{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Chart.Name }}-ingress
  annotations:
    {{- toYaml .Values.ingress.annotations | nindent 4 }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  {{- if .Values.ingress.tls.enabled }}
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Values.ingress.tls.secretName }}
  {{- end }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          # API 路由到 Backend
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: {{ .Values.backend.name }}
                port:
                  number: {{ .Values.backend.service.port }}
          # 其他路由到 Frontend
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Values.frontend.name }}
                port:
                  number: {{ .Values.frontend.service.port }}
{{- end }}
```

### 2.14 templates/secrets.yaml

```yaml
# helm/splitquest/templates/secrets.yaml

apiVersion: v1
kind: Secret
metadata:
  name: {{ .Values.backend.secretName }}
type: Opaque
stringData:
  # 這些值應該從 CI/CD 或手動設定，不要 commit 真實值
  MONGODB_URI: "{{ .Values.secrets.mongodbUri | default "placeholder" }}"
  JWT_SECRET: "{{ .Values.secrets.jwtSecret | default "placeholder" }}"
```

### 2.15 新增健康檢查端點 (Backend)

```typescript
// src/interfaces/routes/healthRoutes.ts

import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

```typescript
// src/interfaces/app.ts - 加入健康檢查路由

import healthRoutes from './routes/healthRoutes.js';

// ... 在其他路由前加入
app.use('/', healthRoutes);
```

---

## Phase 3: GitHub Actions CI

### 目標

建立 CI Pipeline：
1. 程式碼推送時觸發
2. 執行測試
3. 建置 Docker 映像
4. 推送到 Artifact Registry
5. 更新 GitOps repo 的 image tag

### 3.1 建立 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yaml

name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  PROJECT_ID: splitquest-prod
  REGION: asia-east1
  REGISTRY: asia-east1-docker.pkg.dev
  REPOSITORY: splitquest

jobs:
  # ============================================
  # Job 1: Test
  # ============================================
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test

      - name: Frontend install
        working-directory: ./frontend
        run: npm ci

      - name: Frontend type check
        working-directory: ./frontend
        run: npm run type-check

  # ============================================
  # Job 2: Build and Push
  # ============================================
  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      id-token: write
    
    outputs:
      image_tag: ${{ steps.meta.outputs.version }}
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Generate image tag
        id: meta
        run: |
          SHORT_SHA=$(echo ${{ github.sha }} | cut -c1-7)
          echo "version=${SHORT_SHA}" >> $GITHUB_OUTPUT

      # Backend Image
      - name: Build Backend
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/backend:${{ steps.meta.outputs.version }} .
          docker tag ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/backend:${{ steps.meta.outputs.version }} \
                     ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/backend:latest

      - name: Push Backend
        run: |
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/backend:${{ steps.meta.outputs.version }}
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/backend:latest

      # Frontend Image
      - name: Build Frontend
        working-directory: ./frontend
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/frontend:${{ steps.meta.outputs.version }} .
          docker tag ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/frontend:${{ steps.meta.outputs.version }} \
                     ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/frontend:latest

      - name: Push Frontend
        run: |
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/frontend:${{ steps.meta.outputs.version }}
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/frontend:latest

  # ============================================
  # Job 3: Update GitOps Repo
  # ============================================
  update-gitops:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - name: Checkout GitOps repo
        uses: actions/checkout@v4
        with:
          repository: ${{ github.repository_owner }}/mern-gitops
          token: ${{ secrets.GITOPS_PAT }}
          path: gitops

      - name: Update image tags
        run: |
          cd gitops
          
          # 使用 yq 更新 values.yaml
          yq -i '.backend.image.tag = "${{ needs.build.outputs.image_tag }}"' helm/splitquest/values.yaml
          yq -i '.frontend.image.tag = "${{ needs.build.outputs.image_tag }}"' helm/splitquest/values.yaml

      - name: Commit and push
        run: |
          cd gitops
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "Update image tag to ${{ needs.build.outputs.image_tag }}" || echo "No changes"
          git push
```

### 3.2 設定 Workload Identity Federation (無密碼認證)

這是 GCP 推薦的認證方式，比存儲服務帳號金鑰更安全。

```powershell
# 建立 Workload Identity Pool
gcloud iam workload-identity-pools create github-actions `
  --project=splitquest-prod `
  --location=global `
  --display-name="GitHub Actions Pool"

# 建立 OIDC Provider
gcloud iam workload-identity-pools providers create-oidc github `
  --project=splitquest-prod `
  --location=global `
  --workload-identity-pool=github-actions `
  --display-name="GitHub Provider" `
  --issuer-uri="https://token.actions.githubusercontent.com" `
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" `
  --attribute-condition="assertion.repository_owner == 'YOUR_GITHUB_USERNAME'"

# 建立服務帳號給 CI 用
gcloud iam service-accounts create github-actions-sa `
  --display-name="GitHub Actions Service Account"

# 授予權限
gcloud projects add-iam-policy-binding splitquest-prod `
  --member="serviceAccount:github-actions-sa@splitquest-prod.iam.gserviceaccount.com" `
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding splitquest-prod `
  --member="serviceAccount:github-actions-sa@splitquest-prod.iam.gserviceaccount.com" `
  --role="roles/artifactregistry.reader"

# 允許 GitHub 扮演服務帳號
gcloud iam service-accounts add-iam-policy-binding `
  github-actions-sa@splitquest-prod.iam.gserviceaccount.com `
  --project=splitquest-prod `
  --role="roles/iam.workloadIdentityUser" `
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/YOUR_GITHUB_USERNAME/mern"
```

### 3.3 設定 GitHub Secrets

在 GitHub repo 的 Settings > Secrets and variables > Actions 加入：

| Secret Name | Value |
|-------------|-------|
| `WIF_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/providers/github` |
| `WIF_SERVICE_ACCOUNT` | `github-actions-sa@splitquest-prod.iam.gserviceaccount.com` |
| `GITOPS_PAT` | GitHub Personal Access Token (需要 repo 權限) |

---

## Phase 4: Argo CD 持續部署

### 目標

1. 在 GKE 安裝 Argo CD
2. 設定 GitOps repo 監聽
3. 自動同步部署

### 4.1 安裝 Ingress Controller (nginx)

```powershell
# 先安裝 nginx ingress controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx `
  --namespace ingress-nginx `
  --create-namespace `
  --set controller.service.type=LoadBalancer

# 等待 LoadBalancer 取得外部 IP
kubectl get svc -n ingress-nginx -w

# 記下 EXTERNAL-IP，例如 34.56.78.90
```

### 4.2 安裝 cert-manager (TLS 憑證)

```powershell
# 安裝 cert-manager
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager `
  --namespace cert-manager `
  --create-namespace `
  --set installCRDs=true

# 建立 Let's Encrypt ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your@email.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

### 4.3 安裝 Argo CD Server

> **注意**：這裡安裝的是 Argo CD **Server**（部署到 GKE），不是 CLI。
> 
> | 項目 | 說明 | 安裝位置 |
> |------|------|----------|
> | **Argo CD CLI** | 命令行工具，用來和 Server 互動 | 你的電腦（已在前置準備安裝） |
> | **Argo CD Server** | GitOps 控制器 + Web UI | GKE 叢集內 |
> 
> 我們使用**非 HA 版本**（單節點足夠學習用，HA 需要 3+ nodes）。

```powershell
# 建立 namespace
kubectl create namespace argocd

# 安裝 Argo CD Server（非 HA 版本）
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 如果需要 HA 版本（不建議，需要 3+ nodes）：
# kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/ha/install.yaml

# 等待 pods ready
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# 取得初始密碼
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# 建立 Ingress 讓 Argo CD UI 可以從外部存取
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  ingressClassName: nginx
  rules:
    - host: argocd.34.56.78.90.nip.io  # 換成你的 IP
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 443
EOF
```

### 4.4 存取 Argo CD UI

1. 開啟瀏覽器前往 `https://argocd.34.56.78.90.nip.io`
2. 使用者名稱: `admin`
3. 密碼: 剛才取得的初始密碼
4. 登入後記得變更密碼

### 4.5 建立 Application 定義

在 GitOps repo 建立 Argo CD Application：

```yaml
# apps/splitquest.yaml

apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: splitquest
  namespace: argocd
spec:
  project: default
  
  source:
    repoURL: https://github.com/YOUR_USERNAME/mern-gitops.git
    targetRevision: main
    path: helm/splitquest
    helm:
      valueFiles:
        - values.yaml
        - values-prod.yaml
      parameters:
        - name: ingress.host
          value: "34.56.78.90.nip.io"  # 換成你的 IP
  
  destination:
    server: https://kubernetes.default.svc
    namespace: splitquest
  
  syncPolicy:
    automated:
      prune: true       # 自動刪除不存在的資源
      selfHeal: true    # 自動修復漂移
    syncOptions:
      - CreateNamespace=true
```

### 4.6 套用 Application

```powershell
kubectl apply -f apps/splitquest.yaml

# 或透過 Argo CD UI
# 1. 點 New App
# 2. 填入 repo URL, path, cluster
# 3. 點 Create
```

### 4.7 建立 Secrets (手動，敏感資訊)

```powershell
# 在 splitquest namespace 建立 secrets
kubectl create namespace splitquest

kubectl create secret generic splitquest-secrets `
  --namespace splitquest `
  --from-literal=MONGODB_URI="mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/splitquest" `
  --from-literal=JWT_SECRET="your-super-secret-jwt-key"
```

---

## Phase 5: Argo Workflows 進階

### 目標

使用 Argo Workflows 執行：
1. 資料庫 migration
2. 定時備份
3. CI/CD 進階流程

### 5.1 安裝 Argo Workflows

```powershell
kubectl create namespace argo
kubectl apply -n argo -f https://github.com/argoproj/argo-workflows/releases/download/v3.5.0/install.yaml

# 等待 ready
kubectl wait --for=condition=Ready pods --all -n argo --timeout=300s

# 設定 Argo Server 存取
kubectl patch svc argo-server -n argo -p '{"spec": {"type": "LoadBalancer"}}'
```

### 5.2 範例：DB Migration Workflow

```yaml
# workflows/db-migration.yaml

apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: db-migration-
  namespace: argo
spec:
  entrypoint: migrate
  templates:
    - name: migrate
      container:
        image: asia-east1-docker.pkg.dev/splitquest-prod/splitquest/backend:latest
        command: ["node"]
        args: ["dist/migrations/run.js"]
        env:
          - name: MONGODB_URI
            valueFrom:
              secretKeyRef:
                name: splitquest-secrets
                key: MONGODB_URI
```

### 5.3 範例：定時清理 Workflow (CronWorkflow)

```yaml
# workflows/cleanup-cron.yaml

apiVersion: argoproj.io/v1alpha1
kind: CronWorkflow
metadata:
  name: cleanup-expired-invites
  namespace: argo
spec:
  schedule: "0 2 * * *"  # 每天凌晨 2 點
  concurrencyPolicy: Forbid
  workflowSpec:
    entrypoint: cleanup
    templates:
      - name: cleanup
        container:
          image: mongo:7.0
          command: ["mongosh"]
          args:
            - "$(MONGODB_URI)"
            - "--eval"
            - |
              db.groups.updateMany(
                {},
                { $pull: { inviteTokens: { expiresAt: { $lt: new Date() } } } }
              );
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: splitquest-secrets
                  key: MONGODB_URI
```

---

## Phase 6: 維運與優化

### 6.1 安裝 Prometheus + Grafana（推薦）

使用 `kube-prometheus-stack` Helm Chart，一鍵安裝完整監控套件。

> **成本提醒**：Prometheus 會持續收集指標，會消耗一些 CPU/Memory。
> 單節點 e2-small 可能會有點吃緊，建議升級到 e2-medium 或關閉不需要的元件。

```powershell
# 新增 Prometheus 社群 Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 建立 monitoring namespace
kubectl create namespace monitoring

# 安裝 kube-prometheus-stack（包含 Prometheus、Grafana、AlertManager）
helm install prometheus prometheus-community/kube-prometheus-stack `
  --namespace monitoring `
  --set prometheus.prometheusSpec.retention=7d `
  --set prometheus.prometheusSpec.resources.requests.memory=256Mi `
  --set prometheus.prometheusSpec.resources.requests.cpu=100m `
  --set grafana.adminPassword=your-secure-password `
  --set alertmanager.enabled=false

# 等待安裝完成
kubectl wait --for=condition=Ready pods --all -n monitoring --timeout=300s
```

### 6.2 存取 Grafana Dashboard

**方法 1：Port Forward（本機測試）**

```powershell
# 轉發 Grafana 到本機 3001 port
kubectl port-forward svc/prometheus-grafana 3001:80 -n monitoring

# 開啟瀏覽器：http://localhost:3001
# 帳號：admin
# 密碼：your-secure-password（安裝時設定的）
```

**方法 2：建立 Ingress（正式環境）**

```yaml
# monitoring-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: monitoring
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - grafana.34.56.78.90.nip.io  # 換成你的 IP
      secretName: grafana-tls
  rules:
    - host: grafana.34.56.78.90.nip.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus-grafana
                port:
                  number: 80
```

```powershell
kubectl apply -f monitoring-ingress.yaml
```

### 6.3 內建 Dashboard

kube-prometheus-stack 預裝了很多有用的 Dashboard：

| Dashboard | 用途 |
|-----------|------|
| **Kubernetes / Compute Resources / Cluster** | 叢集整體 CPU/Memory |
| **Kubernetes / Compute Resources / Namespace** | 各 Namespace 資源使用 |
| **Kubernetes / Compute Resources / Pod** | Pod 層級詳細指標 |
| **Node Exporter / Nodes** | 節點系統指標 |

在 Grafana 左側選單 → Dashboards → Browse 可以找到。

### 6.4 監控 SplitQuest 應用程式

為了讓 Prometheus 抓取你的 Node.js 應用指標，需要：

**步驟 1：安裝 prom-client（後端）**

```powershell
cd D:\mern
npm install prom-client
```

**步驟 2：新增 /metrics 端點**

```typescript
// src/interfaces/routes/metricsRoutes.ts
import { Router } from 'express';
import client from 'prom-client';

const router = Router();

// 啟用預設指標（CPU、Memory、Event Loop 等）
client.collectDefaultMetrics({ prefix: 'splitquest_' });

// 自訂指標範例
const httpRequestDuration = new client.Histogram({
  name: 'splitquest_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10],
});

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

export { httpRequestDuration };
export default router;
```

**步驟 3：建立 ServiceMonitor（讓 Prometheus 自動發現）**

```yaml
# k8s/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: splitquest-backend
  namespace: monitoring
  labels:
    release: prometheus  # 必須符合 prometheus operator 的 selector
spec:
  namespaceSelector:
    matchNames:
      - splitquest
  selector:
    matchLabels:
      app: backend
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
```

```powershell
kubectl apply -f k8s/servicemonitor.yaml
```

### 6.5 設定告警（可選）

如果啟用了 AlertManager，可以設定告警規則：

```yaml
# alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: splitquest-alerts
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
    - name: splitquest
      rules:
        - alert: HighErrorRate
          expr: |
            sum(rate(splitquest_http_request_duration_seconds_count{status_code=~"5.."}[5m])) 
            / sum(rate(splitquest_http_request_duration_seconds_count[5m])) > 0.05
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High error rate detected"
            description: "Error rate is above 5% for 5 minutes"
        
        - alert: PodRestart
          expr: increase(kube_pod_container_status_restarts_total{namespace="splitquest"}[1h]) > 3
          for: 0m
          labels:
            severity: warning
          annotations:
            summary: "Pod restarting frequently"
            description: "Pod {{ $labels.pod }} restarted more than 3 times in the last hour"
```

### 6.6 清理監控資源（省錢）

如果不需要監控，可以移除：

```powershell
helm uninstall prometheus -n monitoring
kubectl delete namespace monitoring
```

---

### 6.7 日誌查看

```powershell
# 即時日誌
kubectl logs -f deployment/backend -n splitquest

# 使用 GCP Console
# https://console.cloud.google.com/logs
```

### 6.8 成本監控

```powershell
# 查看目前資源使用
kubectl describe nodes

# GCP Console 成本報告
# https://console.cloud.google.com/billing
```

### 6.9 故障排除

```powershell
# 檢查 Pod 狀態
kubectl get pods -n splitquest
kubectl describe pod <pod-name> -n splitquest

# 進入 Pod 除錯
kubectl exec -it deployment/backend -n splitquest -- sh

# 檢查 Service 連通性
kubectl run debug --image=busybox -it --rm -- sh
# 在 debug pod 內
wget -qO- http://backend.splitquest.svc.cluster.local:3000/health
```

---

## 附錄：成本優化技巧

### A1. 使用 Spot/Preemptible VMs

```hcl
# terraform/main.tf - 修改 node_config

node_config {
  machine_type = "e2-small"
  spot         = true  # 可省 60-70%，但可能被中斷
  # ...
}
```

### A2. 關閉 GKE Cluster (不用時)

```powershell
# 縮減到 0 nodes
gcloud container clusters resize splitquest-cluster `
  --zone asia-east1-a `
  --num-nodes 0

# 恢復
gcloud container clusters resize splitquest-cluster `
  --zone asia-east1-a `
  --num-nodes 1
```

### A3. 定時啟停 (Cloud Scheduler)

```powershell
# 建立定時縮減 (例如晚上)
gcloud scheduler jobs create http shutdown-cluster `
  --schedule="0 22 * * *" `
  --uri="https://container.googleapis.com/v1/projects/splitquest-prod/zones/asia-east1-a/clusters/splitquest-cluster/nodePools/primary-pool:setSize" `
  --http-method=POST `
  --message-body='{"nodeCount":0}' `
  --oauth-service-account-email=terraform-sa@splitquest-prod.iam.gserviceaccount.com
```

### A4. 成本估算

| 資源 | 估算月費 |
|------|----------|
| GKE Cluster (e2-small x1) | $12-15 |
| Persistent Disk (30GB) | $1-2 |
| Ingress LB | $18 |
| Egress | ~$1 |
| Artifact Registry | 免費 (5GB) |
| MongoDB Atlas M0 | 免費 |
| **總計** | ~$32-36 |

> **注意**：這超出了原本 $18-23 的估算，主要是 Ingress LoadBalancer 的成本。
> 
> **省錢方案**：使用 NodePort + CloudFlare Tunnel 替代 LoadBalancer，可省 $18/月。

---

## 🎉 完成！

恭喜你完成了完整的 CI/CD 學習！你現在已經掌握：

- ✅ Terraform 基礎設施即程式碼
- ✅ Docker 多階段建置
- ✅ Helm Chart 設計
- ✅ GitHub Actions CI Pipeline
- ✅ Argo CD GitOps 部署
- ✅ Argo Workflows 進階自動化
- ✅ GKE 維運基礎

### 延伸學習

- [ ] Istio Service Mesh
- [ ] Prometheus + Grafana 監控
- [ ] Vault 密鑰管理
- [ ] Chaos Engineering (Litmus)

---

## Phase 6: 前後端對外入口 + TLS 完整收尾

這一節會補齊「服務真正對外可用」的最後一哩路：

1. 確認 frontend/backend 的 Deployment + Service
2. 建立 app Ingress（同網域：`/` 給 frontend、`/api` 給 backend）
3. TLS 使用既有 `ClusterIssuer`：`letsencrypt-prod`
4. 提供驗證指令與成功判準
5. 補充未來切換自有網域的操作

> **重點**：TLS 可以沿用前面建立的 `letsencrypt-prod`，不需要重建一套 issuer。

### 6.1 先確認叢集內服務已存在

```powershell
kubectl get deploy -n splitquest
kubectl get svc -n splitquest
```

應至少看到類似：
- `backend` Deployment/Service
- `frontend` Deployment/Service

---

### 6.2 建立 App Ingress（先用 nip.io）

先取得 ingress-nginx 的外部 IP：

```powershell
kubectl get svc -n ingress-nginx
```

假設外部 IP 是 `130.211.245.78`，可先用：
- `app.130.211.245.78.nip.io`

建立 Ingress（Windows PowerShell 可直接貼）：

```powershell
$yaml = @"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: splitquest-ingress
  namespace: splitquest
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - app.130.211.245.78.nip.io
      secretName: splitquest-tls
  rules:
    - host: app.130.211.245.78.nip.io
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 3001
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
"@
$yaml | kubectl apply -f -
```

> 把上面 `130.211.245.78` 換成你自己的 LoadBalancer IP。

---

### 6.3 驗證 Ingress 與 TLS

```powershell
kubectl get ingress -n splitquest
kubectl describe ingress splitquest-ingress -n splitquest

kubectl get clusterissuer
kubectl describe clusterissuer letsencrypt-prod

kubectl get certificate -n splitquest
kubectl get certificaterequest -n splitquest
kubectl get challenge -n splitquest
```

成功判準：
1. `clusterissuer/letsencrypt-prod` 顯示 `Ready=True`
2. `certificate` 顯示 `Ready=True`
3. Ingress 有 ADDRESS，且 host 可解析
4. `https://app.<LB_IP>.nip.io` 可正常開啟

---

### 6.4 Argo CD 觀測點

在 Argo CD UI 或命令列確認：

```powershell
kubectl get applications -n argocd
kubectl describe application splitquest -n argocd
```

應看到：
- `Synced`
- `Healthy`

---

### 6.5 之後切換成自有網域（重要）

當你準備把 `nip.io` 換成正式 domain（例如 `app.example.com`）：

1. 在 DNS 供應商新增 `A` 記錄：`app.example.com -> <ingress LB IP>`
2. 更新 Ingress 的 `rules.host` 與 `tls.hosts` 為新網域
3. 保留 `cert-manager.io/cluster-issuer: letsencrypt-prod`（不用改）
4. 重新套用 Ingress，等待 cert-manager 重新簽發
5. 用以下指令觀測：

```powershell
kubectl get ingress -n splitquest
kubectl get certificate -n splitquest
kubectl get challenge -n splitquest
```

切換完成判準：
1. 新網域 `https://app.example.com` 可連線
2. 憑證簽發者為 Let's Encrypt，且有效期正常
3. `/` 與 `/api` 路由都可用
