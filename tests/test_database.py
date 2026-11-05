import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from database.base import Base
from database.repositories.experiment_repo import ExperimentRepository
from database.repositories.run_repo import PipelineRunRepository
from database.repositories.user_repo import UserRepository
from database.repositories.audit_repo import AuditRepository

@pytest_asyncio.fixture
async def async_session():
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await test_engine.dispose()

@pytest.mark.asyncio
async def test_experiment_crud(async_session: AsyncSession):
    repo = ExperimentRepository(async_session)
    exp = await repo.create(
        name="Test Experiment",
        description="Testing causal models",
        row_count=1000,
        meta_info={"model": "dml"},
    )
    assert exp.id is not None
    assert exp.name == "Test Experiment"

    fetched = await repo.get_by_id(exp.id)
    assert fetched is not None
    assert fetched.row_count == 1000

    all_exps = await repo.list_all()
    assert len(all_exps) >= 1

    deleted = await repo.delete(exp.id)
    assert deleted is True
    assert await repo.get_by_id(exp.id) is None

@pytest.mark.asyncio
async def test_pipeline_run_crud(async_session: AsyncSession):
    exp_repo = ExperimentRepository(async_session)
    run_repo = PipelineRunRepository(async_session)

    exp = await exp_repo.create(name="Run Test Experiment")
    run = await run_repo.create(
        experiment_id=exp.id,
        run_type="causal_forest",
        params={"cv": 2},
        results={"ate": 1.5},
        duration_ms=120.5,
    )
    assert run.id is not None
    assert run.experiment_id == exp.id

    runs = await run_repo.list_for_experiment(exp.id)
    assert len(runs) == 1
    assert runs[0].duration_ms == 120.5

@pytest.mark.asyncio
async def test_user_crud(async_session: AsyncSession):
    repo = UserRepository(async_session)
    user = await repo.create(
        email="test_user@econocausal.ai",
        hashed_password="hashed_pw_xyz",
        full_name="Test User",
        role="analyst",
    )
    assert user.id is not None

    by_email = await repo.get_by_email("test_user@econocausal.ai")
    assert by_email is not None
    assert by_email.full_name == "Test User"

    await repo.update_api_key_hash(user.id, "hash_api_key_123")
    by_key = await repo.get_by_api_key_hash("hash_api_key_123")
    assert by_key is not None
    assert by_key.id == user.id

@pytest.mark.asyncio
async def test_audit_crud(async_session: AsyncSession):
    repo = AuditRepository(async_session)
    log = await repo.log_action(
        action="TEST_ACTION",
        resource="/api/test",
        user_id="usr_001",
        status_code=200,
        extra={"param": "value"},
    )
    assert log.id is not None
    assert log.action == "TEST_ACTION"

    logs = await repo.list_logs(action="TEST_ACTION")
    assert len(logs) == 1
    assert logs[0].resource == "/api/test"
