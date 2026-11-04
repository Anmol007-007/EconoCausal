from __future__ import annotations
import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("econocausal.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket) -> None:
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.warning(f"Failed to send message to websocket: {e}")

    async def broadcast(self, message: Dict[str, Any]) -> None:
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.warning(f"WebSocket broadcast error: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

    async def broadcast_progress(self, stage: str, percent: int, detail: str, is_completed: bool = False) -> None:
        payload = {
            "type": "progress",
            "stage": stage,
            "percent": percent,
            "detail": detail,
            "is_completed": is_completed,
        }
        await self.broadcast(payload)

ws_manager = ConnectionManager()

