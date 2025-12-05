from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_alerts():
    return {"message": "Get alerts - to be implemented"}

@router.post("/create")
async def create_alert():
    return {"message": "Create alert - to be implemented"}
