-- Populate Recession & Crisis Periods
-- These were previously hardcoded in metals_prices.py

-- First, add the new enum value if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'recession_crisis' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_type_enum')) THEN
        ALTER TYPE tradeflix_tools.event_type_enum ADD VALUE 'recession_crisis';
    END IF;
END $$;

-- Clear existing recession/crisis events to avoid duplicates
DELETE FROM tradeflix_tools.seasonal_events WHERE event_type = 'recession_crisis';

-- Insert recession and crisis periods
-- Note: region field is used to store the crisis type (global, us, regional, commodity, financial, trade, inflation)
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, region, start_date, end_date, recurrence, is_lunar_based, affects_gold, affects_silver, is_active, is_verified)
VALUES 
-- US Recessions
('Dot-com Bubble', 'recession_crisis', 'Tech bubble burst and subsequent US recession', 'USA', 'us', '2001-03-01', '2001-11-30', 'none', false, true, true, true, true),

-- Global Crises
('Global Financial Crisis', 'recession_crisis', 'Subprime mortgage crisis leading to global financial meltdown', 'Global', 'global', '2007-12-01', '2009-06-30', 'none', false, true, true, true, true),
('COVID-19 Recession', 'recession_crisis', 'Global pandemic-induced economic shutdown', 'Global', 'global', '2020-02-01', '2020-04-30', 'none', false, true, true, true, true),

-- Regional Crises
('European Debt Crisis', 'recession_crisis', 'Sovereign debt crisis in Eurozone countries', 'Europe', 'regional', '2011-07-01', '2012-06-30', 'none', false, true, true, true, true),
('China Stock Market Crash', 'recession_crisis', 'Chinese stock market bubble burst', 'China', 'regional', '2015-06-01', '2016-02-29', 'none', false, true, true, true, true),
('Brexit Vote', 'recession_crisis', 'UK referendum to leave European Union', 'UK', 'regional', '2016-06-01', '2016-07-31', 'none', false, true, true, true, true),

-- Commodity Crises
('Oil Price Collapse', 'recession_crisis', 'Crude oil price crash from oversupply', 'Global', 'commodity', '2014-06-01', '2016-01-31', 'none', false, true, true, true, true),

-- Financial Events
('Taper Tantrum', 'recession_crisis', 'Market reaction to Fed tapering announcement', 'USA', 'financial', '2013-05-01', '2013-09-30', 'none', false, true, true, true, true),

-- Trade Wars
('US-China Trade War', 'recession_crisis', 'Escalating tariffs between US and China', 'Global', 'trade', '2018-03-01', '2019-12-31', 'none', false, true, true, true, true),

-- Inflation Crises
('2022 Inflation Crisis', 'recession_crisis', 'Post-pandemic inflation surge and aggressive rate hikes', 'Global', 'inflation', '2022-01-01', '2022-12-31', 'none', false, true, true, true, true);

-- Verify the inserted data
SELECT name, region as crisis_type, start_date, end_date FROM tradeflix_tools.seasonal_events WHERE event_type = 'recession_crisis' ORDER BY start_date;
