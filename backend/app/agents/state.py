from typing import TypedDict, Annotated, List, Union
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    # Messages history
    messages: Annotated[List[BaseMessage], add_messages]
    
    # Financial context
    ticker: str
    portfolio: dict
    
    # Analysis results
    technical_indicators: dict
    fundamental_analysis: str
    sentiment_score: float
    
    # Decisions
    recommendation: str  # "buy", "sell", "hold"
    confidence: float
    reasoning: str
