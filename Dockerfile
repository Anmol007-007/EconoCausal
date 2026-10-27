# ==============================================================================
# Stage 1: Frontend Build Environment
# ==============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies first for optimal Docker layer caching
COPY frontend/package.json ./
RUN npm install --no-audit --prefer-offline || npm install

# Copy frontend source and build static distribution
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Production Python Backend & Runtime Environment
# ==============================================================================
FROM python:3.12-slim AS runtime

# Set environment variables for production performance
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000 \
    HOST=0.0.0.0

WORKDIR /app

# Install necessary OS libraries for C-extensions and numerical libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY api/ ./api/
COPY src/ ./src/
COPY benchmarks/ ./benchmarks/
COPY data/ ./data/

# Copy compiled frontend production assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create a secure non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Container healthcheck querying the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch production ASGI server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
