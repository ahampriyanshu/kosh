from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.technical_analyst import TechnicalAnalysisAgent
from app.agents.fundamental_analyst import FundamentalAnalysisAgent
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# Initialize Agents
technical_agent = TechnicalAnalysisAgent()
fundamental_agent = FundamentalAnalysisAgent()
llm = ChatOpenAI(model="gpt-4-turbo", temperature=0)

async def technical_analysis_node(state: AgentState):
    ticker = state["ticker"]
    analysis = technical_agent.analyze(ticker)
    return {"technical_indicators": analysis}

async def fundamental_analysis_node(state: AgentState):
    ticker = state["ticker"]
    # In a real app, date range would be dynamic
    analysis = await fundamental_agent.analyze(ticker)
    return {"fundamental_analysis": analysis}

async def synthesizer_node(state: AgentState):
    """
    Synthesize technical and fundamental analysis to make a recommendation.
    """
    tech = state["technical_indicators"]
    fund = state["fundamental_analysis"]
    ticker = state["ticker"]

    prompt = f"""
    You are a Portfolio Manager. Synthesize the following analysis for {ticker} and provide a final recommendation.

    Technical Analysis:
    {tech}

    Fundamental Analysis:
    {fund}

    Your output must be a valid JSON with the following fields:
    - recommendation: "buy", "sell", or "hold"
    - confidence: float between 0 and 1
    - reasoning: string explanation
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    # In production, use JSON output parser
    return {"reasoning": response.content} # Placeholder for simple string return

# Build Graph
builder = StateGraph(AgentState)

builder.add_node("technical_analyst", technical_analysis_node)
builder.add_node("fundamental_analyst", fundamental_analysis_node)
builder.add_node("synthesizer", synthesizer_node)

builder.set_entry_point("technical_analyst")
builder.add_edge("technical_analyst", "fundamental_analyst")
builder.add_edge("fundamental_analyst", "synthesizer")
builder.add_edge("synthesizer", END)

graph = builder.compile()
