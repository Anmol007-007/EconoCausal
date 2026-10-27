# 🚢 EconoCausal Production Deployment & Operations Guide

This guide details how to build, containerize, deploy, and monitor the **EconoCausal Platform** across local, containerized, and cloud Kubernetes environments.

---

## 1. Architecture Overview

EconoCausal is engineered as a **unified, high-performance containerized service**:
- **Frontend**: Single-Page Application (SPA) built with React 19, Vite, TailwindCSS, and Motion.
- **Backend**: Python 3.12 ASGI microservice powered by FastAPI, EconML, DoWhy, LightGBM, and SciPy HiGHS.
- **Unified Delivery**: The multi-stage build compiles the React application and embeds it into the FastAPI runtime. FastAPI serves both the REST API at `/api/*` and the static single-page application at `/` with automatic SPA client routing.

```
                      ┌──────────────────────────────────────┐
                      │            Client Browser            │
                      └──────────────────┬───────────────────┘
                                         │ HTTP / HTTPS (Port 8000)
                      ┌──────────────────▼───────────────────┐
                      │       FastAPI ASGI Server (Uvicorn)   │
                      │                                      │
                      │  /api/* ─────────► Causal ML Pipeline │
                      │  /health ────────► Health Probe      │
                      │  /* ─────────────► React SPA Bundle  │
                      └──────────────────────────────────────┘
```

---

## 2. Quickstart with Docker Compose

The simplest way to run EconoCausal locally or on a single production VM is via Docker Compose:

```bash
# 1. Clone repository
git clone https://github.com/Anmol007-007/EconoCausal.git
cd EconoCausal

# 2. Copy environment configuration
cp .env.example .env

# 3. Build and launch the containerized platform
docker-compose up --build -d

# 4. View real-time container logs
docker-compose logs -f
```

The application will be live at:
- **Interactive UI Dashboard**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **System Healthcheck Probe**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 3. Standalone Docker Build & Run

If deploying without Docker Compose:

```bash
# Build multi-stage production image
docker build -t econocausal:latest .

# Run with 2GB memory allocation and port 8000 exposed
docker run -d \
  --name econocausal-app \
  -p 8000:8000 \
  --memory="2g" \
  --cpus="2.0" \
  --restart=unless-stopped \
  econocausal:latest
```

---

## 4. Environment Variables Reference

Configure environment options in `.env` or inject them directly via your container orchestrator:

| Variable | Default | Purpose |
|:---|:---:|:---|
| `PORT` | `8000` | Port on which the FastAPI application binds. |
| `HOST` | `0.0.0.0` | Bind address (`0.0.0.0` for all container interfaces). |
| `WORKERS` | `2` | Number of Uvicorn worker processes. Recommended: `(2 * CPU_CORES) + 1` or `2` for memory-constrained containers. |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warning`, `error`). |
| `ENVIRONMENT` | `production` | Deployment mode (`development`, `staging`, `production`). |
| `CORS_ORIGINS` | `*` | Allowed CORS origins (comma-separated list for restricted enterprise setups). |
| `DEFAULT_CAMPAIGN_BUDGET` | `5000.0` | Default budget ceiling for prescriptive MILP solver. |
| `DEFAULT_UNIT_MARGIN` | `45.0` | Default gross margin per incremental purchase ($). |
| `DRIFT_PSI_THRESHOLD` | `0.20` | Critical Population Stability Index threshold triggering retraining alerts. |

---

## 5. Cloud Deployment Patterns

### A. Google Cloud Run (Serverless Container)
```bash
# 1. Build and push image to Google Artifact Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/econocausal:latest

# 2. Deploy with 2 GiB memory and 2 vCPUs
gcloud run deploy econocausal \
  --image gcr.io/PROJECT_ID/econocausal:latest \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --port 8000 \
  --allow-unauthenticated
```

### B. AWS ECS with Fargate
1. Create an ECR repository and push `econocausal:latest`.
2. Define a Task Definition:
   - **CPU**: 2048 (2 vCPUs)
   - **Memory**: 4096 (4 GB)
   - **Container Port**: 8000
   - **Healthcheck**: `["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]`
3. Attach an Application Load Balancer (ALB) pointing to target group on port 8000.

### C. Kubernetes Manifest (Deployment + Service)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: econocausal-deployment
  labels:
    app: econocausal
spec:
  replicas: 2
  selector:
    matchLabels:
      app: econocausal
  template:
    metadata:
      labels:
        app: econocausal
    spec:
      containers:
      - name: econocausal
        image: econocausal:latest
        ports:
        - containerPort: 8000
        resources:
          limits:
            cpu: "2.0"
            memory: "3Gi"
          requests:
            cpu: "500m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: econocausal-service
spec:
  type: ClusterIP
  selector:
    app: econocausal
  ports:
  - port: 80
    targetPort: 8000
```

---

## 6. Reverse Proxy Configuration (Nginx)

When deploying behind an Nginx reverse proxy with TLS/SSL:

```nginx
server {
    listen 80;
    server_name econocausal.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name econocausal.example.com;

    ssl_certificate /etc/letsencrypt/live/econocausal.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/econocausal.example.com/privkey.pem;

    client_max_body_size 50M;

    # Gzip compression for high-throughput responses
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
        proxy_connect_timeout 60s;
    }
}
```

---

## 7. Healthchecks & Operational Monitoring

Verify service status using the standalone Python healthcheck script:

```bash
# Run local container healthcheck
python scripts/healthcheck.py --url http://localhost:8000/health
```

Sample JSON response from `/health`:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": 1792150000.0,
  "service": "EconoCausal Platform API",
  "active_records": 10000,
  "cached_models": {
    "dml_trained": true,
    "allocated": true,
    "drift_evaluated": true
  }
}
```
