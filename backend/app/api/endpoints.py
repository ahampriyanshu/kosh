from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from app.agents.graph import graph
from app.tools.portfolio_manager import PortfolioManager

router = APIRouter()
pm = PortfolioManager()

class AnalysisRequest(BaseModel):
    ticker: str

class AnalysisResponse(BaseModel):
    ticker: str
    recommendation: Dict[str, Any]

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_stock(request: AnalysisRequest):
    """
    Run the multi-agent analysis for a given ticker.
    """
    try:
        initial_state = {
            "ticker": request.ticker,
            "messages": []
        }
        
        # Invoke the LangGraph workflow
        result = await graph.ainvoke(initial_state)
        
        # Parse the final recommendation from the synthesizer node
        # Note: In a real implementation, we'd have structured output.
        # Here we extract from the last message or state.
        recommendation = result.get("reasoning", "No recommendation generated.")
        
        return {
            "ticker": request.ticker,
            "recommendation": {"details": recommendation}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio")
async def get_portfolio():
    """
    Get current portfolio status.
    """
    return {"positions": [p.__dict__ for p in pm.positions]}

@router.post("/portfolio/upload")
async def upload_portfolio(file_path: str): # Simplified for prototype
    """
    Upload portfolio CSV.
    """
    positions = pm.ingest_csv(file_path)
    return {"status": "success", "positions_count": len(positions)}
