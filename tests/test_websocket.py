import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_websocket_pipeline_connection():
    with client.websocket_connect("/api/ws/pipeline") as websocket:
        # First message should be connection acknowledgment
        data = websocket.receive_json()
        assert data["type"] == "connected"
        assert "EconoCausal" in data["message"]

        # Test heartbeat ping
        websocket.send_text("ping")
        pong = websocket.receive_text()
        assert pong == "pong"

def test_websocket_pipeline_run_stream():
    with client.websocket_connect("/api/ws/pipeline") as websocket:
        # Initial greeting
        websocket.receive_json()

        # Trigger run stream
        websocket.send_text("run")

        # Receive streamed progress events
        first_event = websocket.receive_json()
        assert first_event["type"] == "progress"
        assert "stage" in first_event
        assert first_event["percent"] > 0

