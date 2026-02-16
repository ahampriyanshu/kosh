# Kosh System Walkthrough

## Overview
Kosh is an autonomous financial intelligence system utilizing multi-agent architecture for market analysis. This walkthrough details the vital components and how to run the system.

## Components Implemented

### 1. Perception Layer
- **Market Data**: `MarketDataAggregator` connects to Alpha Vantage and YFinance.
- **News Analysis**: `NewsScraper` fetches financial news and performs sentiment analysis.
- **Document Intelligence**: `PDFParser` uses LlamaParse to convert complex financial PDFs into Markdown.

### 2. Cognitive Layer
- **Technical Analyst**: Computes RSI, MACD, and SMAs to determine trend direction.
- **Fundamental Analyst**: Synthesizes news and text data using GPT-4.
- **Manager Agent**: Orchestrates the workflow using **LangGraph**, combining insights into a final recommendation.

### 3. Portfolio & Risk
- **Portfolio Manager**: Ingests portfolios and calculates sector drift.
- **Risk Manager**: Calculates Value at Risk (VaR) and Maximum Drawdown.

### 4. User Interface
- **Dashboard**: A Next.js application allows users to input tickers for analysis and view recommendations.

## How to Run

### Prerequisites
- Python 3.11+
- Node.js v18+
- Docker (optional)

### Environment Setup
1. Navigate to `backend/` and rename `.env.example` to `.env`.
2. Fill in your API keys (Alpha Vantage, Finnhub, OpenAI, LlamaCloud).

### Running Locally
**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API will be available at `http://localhost:8000/docs`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Dashboard will be available at `http://localhost:3000`.

### Running with Docker
```bash
docker-compose up --build
```

## Verification
- **Backtesting**: Run the example strategy:
  ```bash
  python backend/tests/backtest_example.py
  ```
- **API Test**: Open `http://localhost:8000/docs` and try the `/api/v1/analyze` endpoint.