"""
COT (Commitment of Traders) Disaggregated Futures Only Report Model

This model represents the CFTC Disaggregated Futures Only COT report which breaks down
reportable open interest positions into four classifications:
- Producer/Merchant/Processor/User (Commercials): Classic commercial hedgers
- Swap Dealers: Dealer/bank and commodity index flow proxy
- Managed Money: Funds/CTAs/hedge funds (speculative "big money")
- Other Reportables: Remaining large traders (proprietary trading, family offices)
"""

from sqlalchemy import Column, BigInteger, Float, Text
from database import Base


class COTReportDisaggFuturesOnly(Base):
    """
    Disaggregated Futures Only COT Report from CFTC.

    Contains weekly positioning data for different trader categories
    in commodity futures markets.
    """

    __tablename__ = "cot_report_disagg_futures_only"
    __table_args__ = {"schema": "tradeflix_tools"}

    # Primary key
    ID = Column("ID", Text, primary_key=True)

    # Market identification
    Market_and_Exchange_Names = Column("Market_and_Exchange_Names", Text, nullable=True)
    Report_Date_as_YYYY_MM_DD = Column("Report_Date_as_YYYY_MM_DD", Text, nullable=True)
    YYYY_Report_Week_WW = Column("YYYY Report Week WW", Text, nullable=True)
    Contract_Market_Name = Column("Contract_Market_Name", Text, nullable=True)
    CFTC_Contract_Market_Code = Column(
        "CFTC_Contract_Market_Code", BigInteger, nullable=True
    )
    CFTC_Market_Code = Column("CFTC_Market_Code", Text, nullable=True)
    CFTC_Region_Code = Column("CFTC_Region_Code", Text, nullable=True)
    CFTC_Commodity_Code = Column("CFTC_Commodity_Code", BigInteger, nullable=True)
    Commodity_Name = Column("Commodity Name", Text, nullable=True)

    # Open Interest - All
    Open_Interest_All = Column("Open_Interest_All", Text, nullable=True)

    # Producer/Merchant Positions - All
    Prod_Merc_Positions_Long_All = Column(
        "Prod_Merc_Positions_Long_All", Text, nullable=True
    )
    Prod_Merc_Positions_Short_All = Column(
        "Prod_Merc_Positions_Short_All", Text, nullable=True
    )

    # Swap Dealer Positions - All
    Swap_Positions_Long_All = Column("Swap_Positions_Long_All", Text, nullable=True)
    Swap_Positions_Short_All = Column("Swap__Positions_Short_All", Text, nullable=True)
    Swap_Positions_Spread_All = Column(
        "Swap__Positions_Spread_All", Text, nullable=True
    )

    # Managed Money Positions - All
    M_Money_Positions_Long_All = Column(
        "M_Money_Positions_Long_All", Text, nullable=True
    )
    M_Money_Positions_Short_All = Column(
        "M_Money_Positions_Short_All", Text, nullable=True
    )
    M_Money_Positions_Spread_All = Column(
        "M_Money_Positions_Spread_All", Text, nullable=True
    )

    # Other Reportables Positions - All
    Other_Rept_Positions_Long_All = Column(
        "Other_Rept_Positions_Long_All", Text, nullable=True
    )
    Other_Rept_Positions_Short_All = Column(
        "Other_Rept_Positions_Short_All", Text, nullable=True
    )
    Other_Rept_Positions_Spread_All = Column(
        "Other_Rept_Positions_Spread_All", Text, nullable=True
    )

    # Total Reportable Positions - All
    Tot_Rept_Positions_Long_All = Column(
        "Tot_Rept_Positions_Long_All", Text, nullable=True
    )
    Tot_Rept_Positions_Short_All = Column(
        "Tot_Rept_Positions_Short_All", Text, nullable=True
    )

    # Non-Reportable Positions - All (Small Traders)
    NonRept_Positions_Long_All = Column(
        "NonRept_Positions_Long_All", Text, nullable=True
    )
    NonRept_Positions_Short_All = Column(
        "NonRept_Positions_Short_All", Text, nullable=True
    )

    # Open Interest - Old
    Open_Interest_Old = Column("Open_Interest_Old", Text, nullable=True)

    # Producer/Merchant Positions - Old
    Prod_Merc_Positions_Long_Old = Column(
        "Prod_Merc_Positions_Long_Old", Text, nullable=True
    )
    Prod_Merc_Positions_Short_Old = Column(
        "Prod_Merc_Positions_Short_Old", Text, nullable=True
    )

    # Swap Dealer Positions - Old
    Swap_Positions_Long_Old = Column("Swap_Positions_Long_Old", Text, nullable=True)
    Swap_Positions_Short_Old = Column("Swap__Positions_Short_Old", Text, nullable=True)
    Swap_Positions_Spread_Old = Column(
        "Swap__Positions_Spread_Old", Text, nullable=True
    )

    # Managed Money Positions - Old
    M_Money_Positions_Long_Old = Column(
        "M_Money_Positions_Long_Old", Text, nullable=True
    )
    M_Money_Positions_Short_Old = Column(
        "M_Money_Positions_Short_Old", Text, nullable=True
    )
    M_Money_Positions_Spread_Old = Column(
        "M_Money_Positions_Spread_Old", Text, nullable=True
    )

    # Other Reportables Positions - Old
    Other_Rept_Positions_Long_Old = Column(
        "Other_Rept_Positions_Long_Old", Text, nullable=True
    )
    Other_Rept_Positions_Short_Old = Column(
        "Other_Rept_Positions_Short_Old", Text, nullable=True
    )
    Other_Rept_Positions_Spread_Old = Column(
        "Other_Rept_Positions_Spread_Old", Text, nullable=True
    )

    # Total Reportable Positions - Old
    Tot_Rept_Positions_Long_Old = Column(
        "Tot_Rept_Positions_Long_Old", Text, nullable=True
    )
    Tot_Rept_Positions_Short_Old = Column(
        "Tot_Rept_Positions_Short_Old", Text, nullable=True
    )

    # Non-Reportable Positions - Old
    NonRept_Positions_Long_Old = Column(
        "NonRept_Positions_Long_Old", Text, nullable=True
    )
    NonRept_Positions_Short_Old = Column(
        "NonRept_Positions_Short_Old", Text, nullable=True
    )

    # Open Interest - Other
    Open_Interest_Other = Column("Open_Interest_Other", Text, nullable=True)

    # Producer/Merchant Positions - Other
    Prod_Merc_Positions_Long_Other = Column(
        "Prod_Merc_Positions_Long_Other", Text, nullable=True
    )
    Prod_Merc_Positions_Short_Other = Column(
        "Prod_Merc_Positions_Short_Other", Text, nullable=True
    )

    # Swap Dealer Positions - Other
    Swap_Positions_Long_Other = Column("Swap_Positions_Long_Other", Text, nullable=True)
    Swap_Positions_Short_Other = Column(
        "Swap__Positions_Short_Other", Text, nullable=True
    )
    Swap_Positions_Spread_Other = Column(
        "Swap__Positions_Spread_Other", Text, nullable=True
    )

    # Managed Money Positions - Other
    M_Money_Positions_Long_Other = Column(
        "M_Money_Positions_Long_Other", Text, nullable=True
    )
    M_Money_Positions_Short_Other = Column(
        "M_Money_Positions_Short_Other", Text, nullable=True
    )
    M_Money_Positions_Spread_Other = Column(
        "M_Money_Positions_Spread_Other", Text, nullable=True
    )

    # Other Reportables Positions - Other
    Other_Rept_Positions_Long_Other = Column(
        "Other_Rept_Positions_Long_Other", Text, nullable=True
    )
    Other_Rept_Positions_Short_Other = Column(
        "Other_Rept_Positions_Short_Other", Text, nullable=True
    )
    Other_Rept_Positions_Spread_Other = Column(
        "Other_Rept_Positions_Spread_Other", Text, nullable=True
    )

    # Total Reportable Positions - Other
    Tot_Rept_Positions_Long_Other = Column(
        "Tot_Rept_Positions_Long_Other", Text, nullable=True
    )
    Tot_Rept_Positions_Short_Other = Column(
        "Tot_Rept_Positions_Short_Other", Text, nullable=True
    )

    # Non-Reportable Positions - Other
    NonRept_Positions_Long_Other = Column(
        "NonRept_Positions_Long_Other", Text, nullable=True
    )
    NonRept_Positions_Short_Other = Column(
        "NonRept_Positions_Short_Other", Text, nullable=True
    )

    # Changes in Positions - All
    Change_in_Open_Interest_All = Column(
        "Change_in_Open_Interest_All", Text, nullable=True
    )
    Change_in_Prod_Merc_Long_All = Column(
        "Change_in_Prod_Merc_Long_All", Text, nullable=True
    )
    Change_in_Prod_Merc_Short_All = Column(
        "Change_in_Prod_Merc_Short_All", Text, nullable=True
    )
    Change_in_Swap_Long_All = Column("Change_in_Swap_Long_All", Text, nullable=True)
    Change_in_Swap_Short_All = Column("Change_in_Swap_Short_All", Text, nullable=True)
    Change_in_Swap_Spread_All = Column("Change_in_Swap_Spread_All", Text, nullable=True)
    Change_in_M_Money_Long_All = Column(
        "Change_in_M_Money_Long_All", Text, nullable=True
    )
    Change_in_M_Money_Short_All = Column(
        "Change_in_M_Money_Short_All", Text, nullable=True
    )
    Change_in_M_Money_Spread_All = Column(
        "Change_in_M_Money_Spread_All", Text, nullable=True
    )
    Change_in_Other_Rept_Long_All = Column(
        "Change_in_Other_Rept_Long_All", Text, nullable=True
    )
    Change_in_Other_Rept_Short_All = Column(
        "Change_in_Other_Rept_Short_All", Text, nullable=True
    )
    Change_in_Other_Rept_Spread_All = Column(
        "Change_in_Other_Rept_Spread_All", Text, nullable=True
    )
    Change_in_Tot_Rept_Long_All = Column(
        "Change_in_Tot_Rept_Long_All", Text, nullable=True
    )
    Change_in_Tot_Rept_Short_All = Column(
        "Change_in_Tot_Rept_Short_All", Text, nullable=True
    )
    Change_in_NonRept_Long_All = Column(
        "Change_in_NonRept_Long_All", Text, nullable=True
    )
    Change_in_NonRept_Short_All = Column(
        "Change_in_NonRept_Short_All", Text, nullable=True
    )

    # Percentage of Open Interest - All
    Pct_of_Open_Interest_All = Column(
        "Pct_of_Open_Interest_All", BigInteger, nullable=True
    )
    Pct_of_OI_Prod_Merc_Long_All = Column(
        "Pct_of_OI_Prod_Merc_Long_All", Float, nullable=True
    )
    Pct_of_OI_Prod_Merc_Short_All = Column(
        "Pct_of_OI_Prod_Merc_Short_All", Float, nullable=True
    )
    Pct_of_OI_Swap_Long_All = Column("Pct_of_OI_Swap_Long_All", Float, nullable=True)
    Pct_of_OI_Swap_Short_All = Column("Pct_of_OI_Swap_Short_All", Float, nullable=True)
    Pct_of_OI_Swap_Spread_All = Column(
        "Pct_of_OI_Swap_Spread_All", Float, nullable=True
    )
    Pct_of_OI_M_Money_Long_All = Column(
        "Pct_of_OI_M_Money_Long_All", Float, nullable=True
    )
    Pct_of_OI_M_Money_Short_All = Column(
        "Pct_of_OI_M_Money_Short_All", Float, nullable=True
    )
    Pct_of_OI_M_Money_Spread_All = Column(
        "Pct_of_OI_M_Money_Spread_All", Float, nullable=True
    )
    Pct_of_OI_Other_Rept_Long_All = Column(
        "Pct_of_OI_Other_Rept_Long_All", Float, nullable=True
    )
    Pct_of_OI_Other_Rept_Short_All = Column(
        "Pct_of_OI_Other_Rept_Short_All", Float, nullable=True
    )
    Pct_of_OI_Other_Rept_Spread_All = Column(
        "Pct_of_OI_Other_Rept_Spread_All", Float, nullable=True
    )
    Pct_of_OI_Tot_Rept_Long_All = Column(
        "Pct_of_OI_Tot_Rept_Long_All", Float, nullable=True
    )
    Pct_of_OI_Tot_Rept_Short_All = Column(
        "Pct_of_OI_Tot_Rept_Short_All", Float, nullable=True
    )
    Pct_of_OI_NonRept_Long_All = Column(
        "Pct_of_OI_NonRept_Long_All", Float, nullable=True
    )
    Pct_of_OI_NonRept_Short_All = Column(
        "Pct_of_OI_NonRept_Short_All", Float, nullable=True
    )

    # Percentage of Open Interest - Old
    Pct_of_Open_Interest_Old = Column(
        "Pct_of_Open_Interest_Old", BigInteger, nullable=True
    )
    Pct_of_OI_Prod_Merc_Long_Old = Column(
        "Pct_of_OI_Prod_Merc_Long_Old", Float, nullable=True
    )
    Pct_of_OI_Prod_Merc_Short_Old = Column(
        "Pct_of_OI_Prod_Merc_Short_Old", Float, nullable=True
    )
    Pct_of_OI_Swap_Long_Old = Column("Pct_of_OI_Swap_Long_Old", Float, nullable=True)
    Pct_of_OI_Swap_Short_Old = Column("Pct_of_OI_Swap_Short_Old", Float, nullable=True)
    Pct_of_OI_Swap_Spread_Old = Column(
        "Pct_of_OI_Swap_Spread_Old", Float, nullable=True
    )
    Pct_of_OI_M_Money_Long_Old = Column(
        "Pct_of_OI_M_Money_Long_Old", Float, nullable=True
    )
    Pct_of_OI_M_Money_Short_Old = Column(
        "Pct_of_OI_M_Money_Short_Old", Float, nullable=True
    )
    Pct_of_OI_M_Money_Spread_Old = Column(
        "Pct_of_OI_M_Money_Spread_Old", Float, nullable=True
    )
    Pct_of_OI_Other_Rept_Long_Old = Column(
        "Pct_of_OI_Other_Rept_Long_Old", Float, nullable=True
    )
    Pct_of_OI_Other_Rept_Short_Old = Column(
        "Pct_of_OI_Other_Rept_Short_Old", Float, nullable=True
    )
    Pct_of_OI_Other_Rept_Spread_Old = Column(
        "Pct_of_OI_Other_Rept_Spread_Old", Float, nullable=True
    )
    Pct_of_OI_Tot_Rept_Long_Old = Column(
        "Pct_of_OI_Tot_Rept_Long_Old", Float, nullable=True
    )
    Pct_of_OI_Tot_Rept_Short_Old = Column(
        "Pct_of_OI_Tot_Rept_Short_Old", Float, nullable=True
    )
    Pct_of_OI_NonRept_Long_Old = Column(
        "Pct_of_OI_NonRept_Long_Old", Float, nullable=True
    )
    Pct_of_OI_NonRept_Short_Old = Column(
        "Pct_of_OI_NonRept_Short_Old", Float, nullable=True
    )

    # Percentage of Open Interest - Other
    Pct_of_Open_Interest_Other = Column(
        "Pct_of_Open_Interest_Other", BigInteger, nullable=True
    )
    Pct_of_OI_Prod_Merc_Long_Other = Column(
        "Pct_of_OI_Prod_Merc_Long_Other", Text, nullable=True
    )
    Pct_of_OI_Prod_Merc_Short_Other = Column(
        "Pct_of_OI_Prod_Merc_Short_Other", Text, nullable=True
    )
    Pct_of_OI_Swap_Long_Other = Column("Pct_of_OI_Swap_Long_Other", Text, nullable=True)
    Pct_of_OI_Swap_Short_Other = Column(
        "Pct_of_OI_Swap_Short_Other", Text, nullable=True
    )
    Pct_of_OI_Swap_Spread_Other = Column(
        "Pct_of_OI_Swap_Spread_Other", Text, nullable=True
    )
    Pct_of_OI_M_Money_Long_Other = Column(
        "Pct_of_OI_M_Money_Long_Other", Text, nullable=True
    )
    Pct_of_OI_M_Money_Short_Other = Column(
        "Pct_of_OI_M_Money_Short_Other", Text, nullable=True
    )
    Pct_of_OI_M_Money_Spread_Other = Column(
        "Pct_of_OI_M_Money_Spread_Other", Text, nullable=True
    )
    Pct_of_OI_Other_Rept_Long_Other = Column(
        "Pct_of_OI_Other_Rept_Long_Other", Text, nullable=True
    )
    Pct_of_OI_Other_Rept_Short_Other = Column(
        "Pct_of_OI_Other_Rept_Short_Other", Text, nullable=True
    )
    Pct_of_OI_Other_Rept_Spread_Other = Column(
        "Pct_of_OI_Other_Rept_Spread_Other", Text, nullable=True
    )
    Pct_of_OI_Tot_Rept_Long_Other = Column(
        "Pct_of_OI_Tot_Rept_Long_Other", Text, nullable=True
    )
    Pct_of_OI_Tot_Rept_Short_Other = Column(
        "Pct_of_OI_Tot_Rept_Short_Other", Text, nullable=True
    )
    Pct_of_OI_NonRept_Long_Other = Column(
        "Pct_of_OI_NonRept_Long_Other", Text, nullable=True
    )
    Pct_of_OI_NonRept_Short_Other = Column(
        "Pct_of_OI_NonRept_Short_Other", Text, nullable=True
    )

    # Number of Traders - All
    Traders_Tot_All = Column("Traders_Tot_All", BigInteger, nullable=True)
    Traders_Prod_Merc_Long_All = Column(
        "Traders_Prod_Merc_Long_All", BigInteger, nullable=True
    )
    Traders_Prod_Merc_Short_All = Column(
        "Traders_Prod_Merc_Short_All", BigInteger, nullable=True
    )
    Traders_Swap_Long_All = Column("Traders_Swap_Long_All", BigInteger, nullable=True)
    Traders_Swap_Short_All = Column("Traders_Swap_Short_All", BigInteger, nullable=True)
    Traders_Swap_Spread_All = Column(
        "Traders_Swap_Spread_All", BigInteger, nullable=True
    )
    Traders_M_Money_Long_All = Column(
        "Traders_M_Money_Long_All", BigInteger, nullable=True
    )
    Traders_M_Money_Short_All = Column(
        "Traders_M_Money_Short_All", BigInteger, nullable=True
    )
    Traders_M_Money_Spread_All = Column(
        "Traders_M_Money_Spread_All", BigInteger, nullable=True
    )
    Traders_Other_Rept_Long_All = Column(
        "Traders_Other_Rept_Long_All", BigInteger, nullable=True
    )
    Traders_Other_Rept_Short_All = Column(
        "Traders_Other_Rept_Short_All", BigInteger, nullable=True
    )
    Traders_Other_Rept_Spread_All = Column(
        "Traders_Other_Rept_Spread_All", BigInteger, nullable=True
    )
    Traders_Tot_Rept_Long_All = Column(
        "Traders_Tot_Rept_Long_All", BigInteger, nullable=True
    )
    Traders_Tot_Rept_Short_All = Column(
        "Traders_Tot_Rept_Short_All", BigInteger, nullable=True
    )

    # Number of Traders - Old
    Traders_Tot_Old = Column("Traders_Tot_Old", BigInteger, nullable=True)
    Traders_Prod_Merc_Long_Old = Column(
        "Traders_Prod_Merc_Long_Old", BigInteger, nullable=True
    )
    Traders_Prod_Merc_Short_Old = Column(
        "Traders_Prod_Merc_Short_Old", BigInteger, nullable=True
    )
    Traders_Swap_Long_Old = Column("Traders_Swap_Long_Old", BigInteger, nullable=True)
    Traders_Swap_Short_Old = Column("Traders_Swap_Short_Old", BigInteger, nullable=True)
    Traders_Swap_Spread_Old = Column(
        "Traders_Swap_Spread_Old", BigInteger, nullable=True
    )
    Traders_M_Money_Long_Old = Column(
        "Traders_M_Money_Long_Old", BigInteger, nullable=True
    )
    Traders_M_Money_Short_Old = Column(
        "Traders_M_Money_Short_Old", BigInteger, nullable=True
    )
    Traders_M_Money_Spread_Old = Column(
        "Traders_M_Money_Spread_Old", BigInteger, nullable=True
    )
    Traders_Other_Rept_Long_Old = Column(
        "Traders_Other_Rept_Long_Old", BigInteger, nullable=True
    )
    Traders_Other_Rept_Short_Old = Column(
        "Traders_Other_Rept_Short_Old", BigInteger, nullable=True
    )
    Traders_Other_Rept_Spread_Old = Column(
        "Traders_Other_Rept_Spread_Old", BigInteger, nullable=True
    )
    Traders_Tot_Rept_Long_Old = Column(
        "Traders_Tot_Rept_Long_Old", BigInteger, nullable=True
    )
    Traders_Tot_Rept_Short_Old = Column(
        "Traders_Tot_Rept_Short_Old", BigInteger, nullable=True
    )

    # Number of Traders - Other
    Traders_Tot_Other = Column("Traders_Tot_Other", Text, nullable=True)
    Traders_Prod_Merc_Long_Other = Column(
        "Traders_Prod_Merc_Long_Other", Text, nullable=True
    )
    Traders_Prod_Merc_Short_Other = Column(
        "Traders_Prod_Merc_Short_Other", Text, nullable=True
    )
    Traders_Swap_Long_Other = Column("Traders_Swap_Long_Other", Text, nullable=True)
    Traders_Swap_Short_Other = Column("Traders_Swap_Short_Other", Text, nullable=True)
    Traders_Swap_Spread_Other = Column("Traders_Swap_Spread_Other", Text, nullable=True)
    Traders_M_Money_Long_Other = Column(
        "Traders_M_Money_Long_Other", Text, nullable=True
    )
    Traders_M_Money_Short_Other = Column(
        "Traders_M_Money_Short_Other", Text, nullable=True
    )
    Traders_M_Money_Spread_Other = Column(
        "Traders_M_Money_Spread_Other", Text, nullable=True
    )
    Traders_Other_Rept_Long_Other = Column(
        "Traders_Other_Rept_Long_Other", Text, nullable=True
    )
    Traders_Other_Rept_Short_Other = Column(
        "Traders_Other_Rept_Short_Other", Text, nullable=True
    )
    Traders_Other_Rept_Spread_Other = Column(
        "Traders_Other_Rept_Spread_Other", Text, nullable=True
    )
    Traders_Tot_Rept_Long_Other = Column(
        "Traders_Tot_Rept_Long_Other", Text, nullable=True
    )
    Traders_Tot_Rept_Short_Other = Column(
        "Traders_Tot_Rept_Short_Other", Text, nullable=True
    )

    # Concentration Ratios - All
    Conc_Gross_LE_4_TDR_Long_All = Column(
        "Conc_Gross_LE_4_TDR_Long_All", Float, nullable=True
    )
    Conc_Gross_LE_4_TDR_Short_All = Column(
        "Conc_Gross_LE_4_TDR_Short_All", Float, nullable=True
    )
    Conc_Gross_LE_8_TDR_Long_All = Column(
        "Conc_Gross_LE_8_TDR_Long_All", Float, nullable=True
    )
    Conc_Gross_LE_8_TDR_Short_All = Column(
        "Conc_Gross_LE_8_TDR_Short_All", Float, nullable=True
    )
    Conc_Net_LE_4_TDR_Long_All = Column(
        "Conc_Net_LE_4_TDR_Long_All", Float, nullable=True
    )
    Conc_Net_LE_4_TDR_Short_All = Column(
        "Conc_Net_LE_4_TDR_Short_All", Float, nullable=True
    )
    Conc_Net_LE_8_TDR_Long_All = Column(
        "Conc_Net_LE_8_TDR_Long_All", Float, nullable=True
    )
    Conc_Net_LE_8_TDR_Short_All = Column(
        "Conc_Net_LE_8_TDR_Short_All", Float, nullable=True
    )

    # Concentration Ratios - Old
    Conc_Gross_LE_4_TDR_Long_Old = Column(
        "Conc_Gross_LE_4_TDR_Long_Old", Float, nullable=True
    )
    Conc_Gross_LE_4_TDR_Short_Old = Column(
        "Conc_Gross_LE_4_TDR_Short_Old", Float, nullable=True
    )
    Conc_Gross_LE_8_TDR_Long_Old = Column(
        "Conc_Gross_LE_8_TDR_Long_Old", Float, nullable=True
    )
    Conc_Gross_LE_8_TDR_Short_Old = Column(
        "Conc_Gross_LE_8_TDR_Short_Old", Float, nullable=True
    )
    Conc_Net_LE_4_TDR_Long_Old = Column(
        "Conc_Net_LE_4_TDR_Long_Old", Float, nullable=True
    )
    Conc_Net_LE_4_TDR_Short_Old = Column(
        "Conc_Net_LE_4_TDR_Short_Old", Float, nullable=True
    )
    Conc_Net_LE_8_TDR_Long_Old = Column(
        "Conc_Net_LE_8_TDR_Long_Old", Float, nullable=True
    )
    Conc_Net_LE_8_TDR_Short_Old = Column(
        "Conc_Net_LE_8_TDR_Short_Old", Float, nullable=True
    )

    # Concentration Ratios - Other
    Conc_Gross_LE_4_TDR_Long_Other = Column(
        "Conc_Gross_LE_4_TDR_Long_Other", Text, nullable=True
    )
    Conc_Gross_LE_4_TDR_Short_Other = Column(
        "Conc_Gross_LE_4_TDR_Short_Other", Text, nullable=True
    )
    Conc_Gross_LE_8_TDR_Long_Other = Column(
        "Conc_Gross_LE_8_TDR_Long_Other", Text, nullable=True
    )
    Conc_Gross_LE_8_TDR_Short_Other = Column(
        "Conc_Gross_LE_8_TDR_Short_Other", Text, nullable=True
    )
    Conc_Net_LE_4_TDR_Long_Other = Column(
        "Conc_Net_LE_4_TDR_Long_Other", Text, nullable=True
    )
    Conc_Net_LE_4_TDR_Short_Other = Column(
        "Conc_Net_LE_4_TDR_Short_Other", Text, nullable=True
    )
    Conc_Net_LE_8_TDR_Long_Other = Column(
        "Conc_Net_LE_8_TDR_Long_Other", Text, nullable=True
    )
    Conc_Net_LE_8_TDR_Short_Other = Column(
        "Conc_Net_LE_8_TDR_Short_Other", Text, nullable=True
    )

    # Contract and Commodity Info
    Contract_Units = Column("Contract_Units", Text, nullable=True)
    CFTC_SubGroup_Code = Column("CFTC_SubGroup_Code", Text, nullable=True)
    COMMODITY_NAME_UPPER = Column("COMMODITY_NAME", Text, nullable=True)
    COMMODITY_SUBGROUP_NAME = Column("COMMODITY_SUBGROUP_NAME", Text, nullable=True)
    COMMODITY_GROUP_NAME = Column("COMMODITY_GROUP_NAME", Text, nullable=True)

    def __repr__(self):
        return f"<COTReportDisaggFuturesOnly(ID={self.ID}, Market={self.Market_and_Exchange_Names}, Date={self.Report_Date_as_YYYY_MM_DD})>"

    def get_int_value(self, value) -> int:
        """Safely convert text value to int, handling commas"""
        if value is None:
            return 0
        try:
            # Remove commas from formatted numbers like "472,421"
            if isinstance(value, str):
                value = value.replace(",", "")
            return int(value)
        except (ValueError, TypeError):
            return 0

    def get_float_value(self, value) -> float:
        """Safely convert text value to float, handling commas"""
        if value is None:
            return 0.0
        try:
            # Remove commas from formatted numbers
            if isinstance(value, str):
                value = value.replace(",", "")
            return float(value)
        except (ValueError, TypeError):
            return 0.0

    @property
    def producer_merchant_net(self) -> int:
        """Net position for Producer/Merchant (Commercials)"""
        long_val = self.get_int_value(self.Prod_Merc_Positions_Long_All)
        short_val = self.get_int_value(self.Prod_Merc_Positions_Short_All)
        return long_val - short_val

    @property
    def swap_dealer_net(self) -> int:
        """Net position for Swap Dealers"""
        long_val = self.get_int_value(self.Swap_Positions_Long_All)
        short_val = self.get_int_value(self.Swap_Positions_Short_All)
        return long_val - short_val

    @property
    def managed_money_net(self) -> int:
        """Net position for Managed Money (Funds/CTAs)"""
        long_val = self.get_int_value(self.M_Money_Positions_Long_All)
        short_val = self.get_int_value(self.M_Money_Positions_Short_All)
        return long_val - short_val

    @property
    def other_reportables_net(self) -> int:
        """Net position for Other Reportables"""
        long_val = self.get_int_value(self.Other_Rept_Positions_Long_All)
        short_val = self.get_int_value(self.Other_Rept_Positions_Short_All)
        return long_val - short_val

    @property
    def non_reportables_net(self) -> int:
        """Net position for Non-Reportables (Small Traders)"""
        long_val = self.get_int_value(self.NonRept_Positions_Long_All)
        short_val = self.get_int_value(self.NonRept_Positions_Short_All)
        return long_val - short_val

    @property
    def open_interest(self) -> int:
        """Total open interest"""
        return self.get_int_value(self.Open_Interest_All)

    def to_dict(self):
        """Convert to dictionary with computed net positions"""
        return {
            "id": self.ID,
            "report_date": self.Report_Date_as_YYYY_MM_DD,
            "market_name": self.Market_and_Exchange_Names,
            "commodity_name": self.Commodity_Name or self.COMMODITY_NAME_UPPER,
            "commodity_group": self.COMMODITY_GROUP_NAME,
            "commodity_subgroup": self.COMMODITY_SUBGROUP_NAME,
            "contract_units": self.Contract_Units,
            "open_interest": self.open_interest,
            # Producer/Merchant (Commercials)
            "producer_merchant_long": self.get_int_value(
                self.Prod_Merc_Positions_Long_All
            ),
            "producer_merchant_short": self.get_int_value(
                self.Prod_Merc_Positions_Short_All
            ),
            "producer_merchant_net": self.producer_merchant_net,
            "producer_merchant_pct_long": self.Pct_of_OI_Prod_Merc_Long_All,
            "producer_merchant_pct_short": self.Pct_of_OI_Prod_Merc_Short_All,
            # Swap Dealers
            "swap_dealer_long": self.get_int_value(self.Swap_Positions_Long_All),
            "swap_dealer_short": self.get_int_value(self.Swap_Positions_Short_All),
            "swap_dealer_spread": self.get_int_value(self.Swap_Positions_Spread_All),
            "swap_dealer_net": self.swap_dealer_net,
            "swap_dealer_pct_long": self.Pct_of_OI_Swap_Long_All,
            "swap_dealer_pct_short": self.Pct_of_OI_Swap_Short_All,
            # Managed Money
            "managed_money_long": self.get_int_value(self.M_Money_Positions_Long_All),
            "managed_money_short": self.get_int_value(self.M_Money_Positions_Short_All),
            "managed_money_spread": self.get_int_value(
                self.M_Money_Positions_Spread_All
            ),
            "managed_money_net": self.managed_money_net,
            "managed_money_pct_long": self.Pct_of_OI_M_Money_Long_All,
            "managed_money_pct_short": self.Pct_of_OI_M_Money_Short_All,
            # Other Reportables
            "other_reportables_long": self.get_int_value(
                self.Other_Rept_Positions_Long_All
            ),
            "other_reportables_short": self.get_int_value(
                self.Other_Rept_Positions_Short_All
            ),
            "other_reportables_spread": self.get_int_value(
                self.Other_Rept_Positions_Spread_All
            ),
            "other_reportables_net": self.other_reportables_net,
            "other_reportables_pct_long": self.Pct_of_OI_Other_Rept_Long_All,
            "other_reportables_pct_short": self.Pct_of_OI_Other_Rept_Short_All,
            # Non-Reportables (Small Traders)
            "non_reportables_long": self.get_int_value(self.NonRept_Positions_Long_All),
            "non_reportables_short": self.get_int_value(
                self.NonRept_Positions_Short_All
            ),
            "non_reportables_net": self.non_reportables_net,
            "non_reportables_pct_long": self.Pct_of_OI_NonRept_Long_All,
            "non_reportables_pct_short": self.Pct_of_OI_NonRept_Short_All,
            # Changes
            "change_open_interest": self.get_int_value(
                self.Change_in_Open_Interest_All
            ),
            "change_prod_merc_long": self.get_int_value(
                self.Change_in_Prod_Merc_Long_All
            ),
            "change_prod_merc_short": self.get_int_value(
                self.Change_in_Prod_Merc_Short_All
            ),
            "change_swap_long": self.get_int_value(self.Change_in_Swap_Long_All),
            "change_swap_short": self.get_int_value(self.Change_in_Swap_Short_All),
            "change_m_money_long": self.get_int_value(self.Change_in_M_Money_Long_All),
            "change_m_money_short": self.get_int_value(
                self.Change_in_M_Money_Short_All
            ),
            "change_other_rept_long": self.get_int_value(
                self.Change_in_Other_Rept_Long_All
            ),
            "change_other_rept_short": self.get_int_value(
                self.Change_in_Other_Rept_Short_All
            ),
            "change_nonrept_long": self.get_int_value(self.Change_in_NonRept_Long_All),
            "change_nonrept_short": self.get_int_value(
                self.Change_in_NonRept_Short_All
            ),
            # Concentration Ratios
            "conc_gross_4_long": self.Conc_Gross_LE_4_TDR_Long_All,
            "conc_gross_4_short": self.Conc_Gross_LE_4_TDR_Short_All,
            "conc_gross_8_long": self.Conc_Gross_LE_8_TDR_Long_All,
            "conc_gross_8_short": self.Conc_Gross_LE_8_TDR_Short_All,
            # Trader counts
            "traders_total": self.Traders_Tot_All,
            "traders_prod_merc_long": self.Traders_Prod_Merc_Long_All,
            "traders_prod_merc_short": self.Traders_Prod_Merc_Short_All,
            "traders_swap_long": self.Traders_Swap_Long_All,
            "traders_swap_short": self.Traders_Swap_Short_All,
            "traders_m_money_long": self.Traders_M_Money_Long_All,
            "traders_m_money_short": self.Traders_M_Money_Short_All,
        }
