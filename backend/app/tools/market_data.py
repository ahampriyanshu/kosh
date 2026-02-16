import os
import yfinance as yf
from alpha_vantage.timeseries import TimeSeries
from dotenv import load_dotenv
from typing import Dict, Any, Optional

load_dotenv()

class MarketDataAggregator:
    def __init__(self):
        self.alpha_vantage_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.ts = TimeSeries(key=self.alpha_vantage_key, output_format='pandas') if self.alpha_vantage_key else None

    def get_stock_price(self, ticker: str) -> float:
        """
        Get the latest stock price for a given ticker using YFinance (fallback) or Alpha Vantage.
        """
        try:
            # Try YFinance first for speed/reliability without limits
            ticker_obj = yf.Ticker(ticker)
            # data = ticker_obj.history(period="1d")
            # if not data.empty:
            #     return data["Close"].iloc[-1]
            
            # Using fast_info for current price
            return ticker_obj.fast_info.last_price
            
        except Exception as e:
            print(f"YFinance failed for {ticker}: {e}")
            if self.ts:
                try:
                    data, _ = self.ts.get_quote_endpoint(symbol=ticker)
                    return float(data['05. price'][0])
                except Exception as av_e:
                    print(f"Alpha Vantage failed for {ticker}: {av_e}")
                    return None
            return None

    def get_historical_data(self, ticker: str, period: str = "1mo") -> Optional[Any]:
        """
        Get historical data for a ticker using YFinance.
        """
        try:
            ticker_obj = yf.Ticker(ticker)
            data = ticker_obj.history(period=period)
            if data.empty:
                return None
            return data
        except Exception as e:
            print(f"Error fetching history for {ticker}: {e}")
            return None

    def get_company_info(self, ticker: str) -> Dict[str, Any]:
        """
        Get fundamental company info.
        """
        try:
            ticker_obj = yf.Ticker(ticker)
            return ticker_obj.info
        except Exception as e:
            print(f"Error fetching info for {ticker}: {e}")
            return {}

if __name__ == "__main__":
    # Simple test
    aggregator = MarketDataAggregator()
    print(f"AAPL Price: {aggregator.get_stock_price('AAPL')}")
    print(f"AAPL Info Keys: {list(aggregator.get_company_info('AAPL').keys())[:5]}")
