from fastapi import FastAPI, HTTPException, Body
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
from contextlib import asynccontextmanager

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = "TestMetricsDB"


class InteractionEvent(BaseModel):
    timestamp: int
    type: str
    elementId: Optional[str] = None
    elementTag: Optional[str] = None
    elementClasses: Optional[str] = None
    value: Optional[Any] = None

class DeviceOrientation(BaseModel):
    timestamp: int
    alpha: Optional[float] = None
    beta: Optional[float] = None
    gamma: Optional[float] = None

class ArTrackingData(BaseModel):
    timestamp: int
    modelIsVisible: Optional[bool] = None
    modelWorldPosition: Optional[Dict[str, float]] = None
    modelInitialScale: Optional[Dict[str, float]] = None
    cameraFov: Optional[float] = None
    cameraAspect: Optional[float] = None
    viewerPosition: Optional[Dict[str, float]] = None
    viewerOrientation: Optional[Dict[str, float]] = None

class MetricsLog(BaseModel):
    interactions: List[InteractionEvent]
    deviceOrientations: List[DeviceOrientation]
    arTrackingData: List[ArTrackingData]

class TestLog(BaseModel):
    testName: str
    interactions: List[InteractionEvent]
    deviceOrientations: List[DeviceOrientation]
    arTrackingData: List[ArTrackingData]

class DeviceInformation(BaseModel):
    screenWidth: int
    screenHeight: int
    devicePixelRatio: float
    userAgent: str

class MetricsPayload(BaseModel):
    deviceId: str
    deviceInfo: DeviceInformation
    testLogs: List[TestLog]
    formData: Optional[Dict[str, Any]] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Connecting to the database...")
    app.mongodb_client = AsyncIOMotorClient(MONGO_URL)
    app.mongodb = app.mongodb_client[DB_NAME]
    print(f"Successfully connected to MongoDB at {MONGO_URL}")
    yield
    print("Closing database connection...")
    app.mongodb_client.close()
    print("Database connection closed.")

app = FastAPI(title="Metrics Tracker API", lifespan=lifespan)

@app.post("/api/log")
async def log_metrics(payload: MetricsPayload = Body(...)):
    """
    Receives a batch of test logs and saves each one to a
    MongoDB collection named after its respective test.
    """
    inserted_ids = []
    for test_log in payload.testLogs:
        collection = app.mongodb[test_log.testName]

        record = {
            "submittedAt": datetime.utcnow(),
            "deviceId": payload.deviceId,
            "deviceInfo": payload.deviceInfo.dict(),
            "metrics": {
                "interactions": [i.dict() for i in test_log.interactions],
                "deviceOrientations": [d.dict() for d in test_log.deviceOrientations],
                "arTrackingData": [a.dict() for a in test_log.arTrackingData]
            }
        }

        if payload.formData:
            record["formData"] = payload.formData

        try:
            result = await collection.insert_one(record)
            inserted_ids.append(str(result.inserted_id))
            print(f"Inserted log for test '{test_log.testName}' with ID: {result.inserted_id}")
        except Exception as e:
            print(f"Error inserting record for test '{test_log.testName}': {e}")
            raise HTTPException(status_code=500, detail=f"Failed to log data for test: {test_log.testName}")

    return {"status": "success", "insertedIds": inserted_ids}

@app.get("/")
async def root():
    """
    Root endpoint to confirm the server is running.
    """
    return {"message": "Metrics backend is running."}