from __future__ import annotations
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.base import AsyncSessionLocal, init_db
from database.repositories.user_repo import UserRepository
from database.repositories.experiment_repo import ExperimentRepository
from database.repositories.run_repo import PipelineRunRepository
from api.auth import hash_password, hash_api_key

async def seed_database() -> None:
    print("Initializing database tables...")
    await init_db()

    async with AsyncSessionLocal() as session:
        user_repo = UserRepository(session)
        exp_repo = ExperimentRepository(session)
        run_repo = PipelineRunRepository(session)

        admin = await user_repo.get_by_email("admin@econocausal.ai")
        if not admin:
            print("Seeding admin user: admin@econocausal.ai")
            admin = await user_repo.create(
                email="admin@econocausal.ai",
                hashed_password=hash_password("AdminSecure2026!"),
                full_name="Lead Causal Scientist",
                role="admin",
                api_key_hash=hash_api_key("ec_live_k8s_cluster_key_007a"),
            )
        else:
            print("Admin user already present.")

        analyst = await user_repo.get_by_email("analyst@econocausal.ai")
        if not analyst:
            print("Seeding analyst user: analyst@econocausal.ai")
            analyst = await user_repo.create(
                email="analyst@econocausal.ai",
                hashed_password=hash_password("AnalystPass2026!"),
                full_name="Quantitative Marketing Analyst",
                role="analyst",
            )

        experiments = await exp_repo.list_all(limit=5)
        if not experiments:
            print("Seeding sample baseline experiment...")
            sample_exp = await exp_repo.create(
                name="Q4 Enterprise Promotion Causal Evaluation",
                description="Double Machine Learning heterogeneous treatment effects on retail coupon responsiveness.",
                dataset_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                row_count=2000,
                meta_info={"domain": "ecommerce", "primary_metric": "incremental_revenue"},
            )

            await run_repo.create(
                experiment_id=sample_exp.id,
                run_type="causal_forest_dml",
                status="completed",
                params={"n_estimators": 48, "cv": 3, "subforest_size": 4},
                results={"ate": 2.45, "cate_mean": 2.39, "pehe": 0.18, "qini_auc": 0.74},
                duration_ms=1450.2,
            )
            print("Seeded sample experiment and benchmark run.")

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())

