from typing import Dict, Any, List
import pandas as pd
import pandas_ta as ta
from app.tools.market_data import MarketDataAggregator
from langchain_core.messages import SystemMessage

class TechnicalAnalysisAgent:
    def __init__(self):
        self.market_data = MarketDataAggregator()

    def analyze(self, ticker: str) -> Dict[str, Any]:
        """
        Perform technical analysis on a given ticker.
        """
        try:
            # Fetch historical data
            df = self.market_data.get_historical_data(ticker, period="6mo")
            if df is None or df.empty:
                return {"error": "No historical data found"}

            # Calculate indicators (using pandas as a fallback if pandas_ta has issues, but here assuming standard pandas calculation for robustness)
            # RSI
            delta = df['Close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df['RSI'] = 100 - (100 / (1 + rs))

            # MACD
            exp1 = df['Close'].ewm(span=12, adjust=False).mean()
            exp2 = df['Close'].ewm(span=26, adjust=False).mean()
            macd = exp1 - exp2
            signal = macd.ewm(span=9, adjust=False).mean()
            df['MACD'] = macd
            df['Signal'] = signal

            # SMA
            df['SMA_50'] = df['Close'].rolling(window=50).mean()
            df['SMA_200'] = df['Close'].rolling(window=200).mean()

            latest = df.iloc[-1]
            
            analysis = {
                "current_price": latest['Close'],
                "RSI": latest['RSI'],
                "MACD": latest['MACD'],
                "MACD_Signal": latest['Signal'],
                "SMA_50": latest['SMA_50'],
                "SMA_200": latest['SMA_200'],
                "trend": "Bullish" if latest['Close'] > latest['SMA_200'] else "Bearish"
            }
            
            return analysis
        except Exception as e:
            return {"error": f"Analysis failed: {str(e)}"}

    def generate_message(self, ticker: str) -> SystemMessage:
        result = self.analyze(ticker)
        return SystemMessage(content=f"Technical Analysis for {ticker}:\n{result}")
