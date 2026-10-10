import pytest
from fastapi.testclient import TestClient
from backend import config, db


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "t.db"))
    from backend.main import app
    db.reset()
    app.state.llm = None
    with TestClient(app) as c:
        c.app = app
        yield c
