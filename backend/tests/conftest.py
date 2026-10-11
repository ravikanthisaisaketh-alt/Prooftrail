import pytest
from fastapi.testclient import TestClient
from backend import config, db


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "t.db"))
    monkeypatch.setattr(config, "LLM_API_KEY", "")   # tests never call the real model
    monkeypatch.setattr(config, "DEMO_MODE", True)   # old tests send no token
    from backend import auth
    auth.clear_failures()
    from backend.main import app
    db.reset()
    app.state.llm = None
    with TestClient(app) as c:
        c.app = app
        yield c
