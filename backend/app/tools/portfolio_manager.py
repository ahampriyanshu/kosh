from typing import List, Dict, Any
import pandas as pd
from dataclasses import dataclass

@dataclass
class PortfolioPosition:
    ticker: str
    quantity: float
    average_price: float
    current_price: float = 0.0
    sector: str = "Unknown"

class PortfolioManager:
    def __init__(self):
        self.positions: List[PortfolioPosition] = []

    def ingest_csv(self, file_path: str) -> List[PortfolioPosition]:
        """
        Ingest portfolio from a CSV file.
        CSS Format: Ticker, Quantity, AveragePrice, Sector
        """
        try:
            df = pd.read_csv(file_path)
            self.positions = [
                PortfolioPosition(
                    ticker=row['Ticker'],
                    quantity=row['Quantity'],
                    average_price=row['AveragePrice'],
                    sector=row.get('Sector', 'Unknown')
                )
                for _, row in df.iterrows()
            ]
            return self.positions
        except Exception as e:
            print(f"Error ingesting portfolio: {e}")
            return []

    def calculate_portfolio_value(self) -> float:
        """
        Calculate total portfolio value based on current prices (placeholder).
        In production, this would call MarketDataAggregator.
        """
        total_value = sum(pos.quantity * pos.current_price for pos in self.positions)
        return total_value

    def check_drift(self, target_allocation: Dict[str, float]) -> Dict[str, float]:
        """
        Check for sector drift against a target allocation.
        target_allocation: {'Technology': 0.3, 'Healthcare': 0.2, ...}
        """
        total_value = self.calculate_portfolio_value()
        if total_value == 0:
            return {}

        current_allocation = {}
        for pos in self.positions:
            sector_value = pos.quantity * pos.current_price
            current_allocation[pos.sector] = current_allocation.get(pos.sector, 0) + sector_value

        drift = {}
        for sector, value in current_allocation.items():
            current_weight = value / total_value
            target_weight = target_allocation.get(sector, 0)
            drift[sector] = current_weight - target_weight

        return drift

# Example usage
if __name__ == "__main__":
    pm = PortfolioManager()
    # pm.ingest_csv("portfolio.csv")
