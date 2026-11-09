import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_websocket_pipeline_connection():
    with client.websocket_connect("/api/ws/pipeline") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "connected"
        assert "EconoCausal" in data["message"]

        websocket.send_text("ping")
        pong = websocket.receive_text()
        assert pong == "pong"

def test_websocket_pipeline_run_stream():
    with client.websocket_connect("/api/ws/pipeline") as websocket:
        websocket.receive_json()
        websocket.send_text("run")

        first_event = websocket.receive_json()
        assert first_event["type"] == "progress"
        assert "stage" in first_event
        assert first_event["percent"] > 0
