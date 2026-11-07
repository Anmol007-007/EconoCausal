import json
import random
from locust import HttpUser, task, between, tag

class EconoCausalUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "admin@econocausal.ai", "password": "AdminPass123!"},
        )
        if login_res.status_code == 200:
            self.token = login_res.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}

    @task(5)
    @tag("health")
    def check_health(self):
        self.client.get("/health")

    @task(4)
    @tag("read")
    def get_diagnostics(self):
        self.client.get("/api/diagnostics", headers=self.headers)

    @task(4)
    @tag("read")
    def get_summary(self):
        self.client.get("/api/summary", headers=self.headers)

    @task(3)
    @tag("read")
    def get_model_comparison(self):
        self.client.get("/api/model-comparison", headers=self.headers)

    @task(2)
    @tag("experiments")
    def list_experiments(self):
        self.client.get("/api/experiments?offset=0&limit=10", headers=self.headers)

    @task(1)
    @tag("optimizer")
    def run_allocation(self):
        payload = {
            "total_budget": float(random.randint(3000, 10000)),
            "unit_margin": 45.0,
            "min_margin_floor": 0.0,
        }
        self.client.post("/api/allocate", json=payload, headers=self.headers)
