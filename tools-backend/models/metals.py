"""
Metals spot prices model for historical price data
"""

from sqlalchemy import Column, Date, Float
from database import Base


class MetalsPriceSpot(Base):
    """
    Historical spot prices for metals (gold, silver, platinum, palladium)
    with USD and INR prices.

    Data sourced from metals.dev API and converted using USD/INR exchange rates.
    """

    __tablename__ = "metals_prices_spot"
    __table_args__ = {"schema": "tradeflix_tools"}

    # Primary key is the date
    date = Column(Date, primary_key=True, index=True)

    # Exchange rate
    usd_inr_rate = Column(Float, nullable=True)

    # Gold prices
    gold_usd = Column(Float, nullable=True)
    gold_inr = Column(Float, nullable=True)

    # Palladium prices
    palladium_usd = Column(Float, nullable=True)
    palladium_inr = Column(Float, nullable=True)

    # Platinum prices
    platinum_usd = Column(Float, nullable=True)
    platinum_inr = Column(Float, nullable=True)

    # Silver prices
    silver_usd = Column(Float, nullable=True)
    silver_inr = Column(Float, nullable=True)

    def __repr__(self):
        return f"<MetalsPriceSpot(date={self.date}, gold_usd={self.gold_usd}, gold_inr={self.gold_inr})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "date": self.date.isoformat() if self.date else None,
            "usd_inr_rate": self.usd_inr_rate,
            "gold_usd": self.gold_usd,
            "gold_inr": self.gold_inr,
            "palladium_usd": self.palladium_usd,
            "palladium_inr": self.palladium_inr,
            "platinum_usd": self.platinum_usd,
            "platinum_inr": self.platinum_inr,
            "silver_usd": self.silver_usd,
            "silver_inr": self.silver_inr,
        }
