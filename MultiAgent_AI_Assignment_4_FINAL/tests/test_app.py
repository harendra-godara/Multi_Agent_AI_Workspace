import sys, os, pytest
sys.path.insert(0,os.path.dirname(os.path.dirname(__file__)))
from app import app, store

@pytest.fixture(autouse=True)
def clean():
    store.tasks.clear(); store.idempotency.clear()
    yield
    store.tasks.clear(); store.idempotency.clear()

@pytest.fixture
def client():
    app.config["TESTING"]=True
    return app.test_client()

def data():
    return {"workspace_id":"ws-1","title":"Research","description":"Study agents","priority":"high"}

def test_create(client):
    r=client.post("/tasks",json=data(),headers={"Idempotency-Key":"k1"})
    assert r.status_code==201
    assert r.headers["Location"].startswith("/tasks/")
    assert "internal_note" not in r.json

def test_idempotent_repeat(client):
    h={"Idempotency-Key":"same"}
    a=client.post("/tasks",json=data(),headers=h)
    b=client.post("/tasks",json=data(),headers=h)
    assert a.status_code==b.status_code==201
    assert a.json["id"]==b.json["id"]

def test_failure_shape(client):
    r=client.post("/tasks",json={"workspace_id":"ws-1"})
    assert r.status_code==400
    assert set(r.json)=={"type","title","status","detail"}

def test_unknown_404(client):
    r=client.get("/tasks/no-such-id")
    assert r.status_code==404

def test_conflict(client):
    a=client.post("/tasks",json=data())
    tid=a.json["id"]
    assert client.post(f"/tasks/{tid}/cancellation").status_code==202
    assert client.post(f"/tasks/{tid}/cancellation").status_code==409
