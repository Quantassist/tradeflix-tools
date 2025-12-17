-- Populate Economic Events for Deep Analysis
-- This script adds historical FOMC meetings, India Budget, RBI Policy, and Macro releases

-- Clear existing economic events (keep festivals)
DELETE FROM tradeflix_tools.seasonal_events 
WHERE event_type IN ('fomc_meeting', 'budget_india', 'policy_event', 'macro_release');

-- ============================================================================
-- FOMC MEETINGS (Federal Reserve) - 8 meetings per year
-- ============================================================================

-- 2024 FOMC Meetings
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, affects_gold, affects_silver, is_active, is_verified)
VALUES 
('FOMC Meeting Jan 2024', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2024-01-31', '2024-01-31', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Mar 2024', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2024-03-20', '2024-03-20', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting May 2024', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2024-05-01', '2024-05-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jun 2024', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2024-06-12', '2024-06-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jul 2024', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2024-07-31', '2024-07-31', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Sep 2024', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2024-09-18', '2024-09-18', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Nov 2024', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2024-11-07', '2024-11-07', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Dec 2024', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2024-12-18', '2024-12-18', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- 2023 FOMC Meetings
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('FOMC Meeting Feb 2023', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2023-02-01', '2023-02-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Mar 2023', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2023-03-22', '2023-03-22', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting May 2023', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2023-05-03', '2023-05-03', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jun 2023', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2023-06-14', '2023-06-14', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jul 2023', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2023-07-26', '2023-07-26', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Sep 2023', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2023-09-20', '2023-09-20', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Nov 2023', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2023-11-01', '2023-11-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Dec 2023', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2023-12-13', '2023-12-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- 2022 FOMC Meetings
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('FOMC Meeting Jan 2022', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2022-01-26', '2022-01-26', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Mar 2022', 'fomc_meeting', 'Federal Reserve monetary policy decision - Rate hike cycle begins', 'USA', '2022-03-16', '2022-03-16', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting May 2022', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2022-05-04', '2022-05-04', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jun 2022', 'fomc_meeting', 'Federal Reserve monetary policy decision - 75bp hike', 'USA', '2022-06-15', '2022-06-15', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jul 2022', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2022-07-27', '2022-07-27', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Sep 2022', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2022-09-21', '2022-09-21', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Nov 2022', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2022-11-02', '2022-11-02', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Dec 2022', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2022-12-14', '2022-12-14', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- 2021 FOMC Meetings
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('FOMC Meeting Jan 2021', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2021-01-27', '2021-01-27', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Mar 2021', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2021-03-17', '2021-03-17', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Apr 2021', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2021-04-28', '2021-04-28', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jun 2021', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2021-06-16', '2021-06-16', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jul 2021', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2021-07-28', '2021-07-28', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Sep 2021', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2021-09-22', '2021-09-22', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Nov 2021', 'fomc_meeting', 'Federal Reserve monetary policy decision - Taper announcement', 'USA', '2021-11-03', '2021-11-03', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Dec 2021', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2021-12-15', '2021-12-15', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- 2020 FOMC Meetings
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('FOMC Meeting Jan 2020', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2020-01-29', '2020-01-29', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Emergency Mar 2020', 'fomc_meeting', 'Emergency rate cut - COVID-19 pandemic response', 'USA', '2020-03-03', '2020-03-03', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Emergency Mar 2020 II', 'fomc_meeting', 'Emergency rate cut to near zero - COVID-19', 'USA', '2020-03-15', '2020-03-15', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Apr 2020', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2020-04-29', '2020-04-29', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jun 2020', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2020-06-10', '2020-06-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jul 2020', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2020-07-29', '2020-07-29', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Sep 2020', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2020-09-16', '2020-09-16', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Nov 2020', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2020-11-05', '2020-11-05', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Dec 2020', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2020-12-16', '2020-12-16', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- 2019 FOMC Meetings
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('FOMC Meeting Jan 2019', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2019-01-30', '2019-01-30', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Mar 2019', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2019-03-20', '2019-03-20', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting May 2019', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2019-05-01', '2019-05-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jun 2019', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2019-06-19', '2019-06-19', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jul 2019', 'fomc_meeting', 'Federal Reserve rate cut - First since 2008', 'USA', '2019-07-31', '2019-07-31', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Sep 2019', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2019-09-18', '2019-09-18', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Oct 2019', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2019-10-30', '2019-10-30', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Dec 2019', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2019-12-11', '2019-12-11', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- 2018 FOMC Meetings
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('FOMC Meeting Jan 2018', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2018-01-31', '2018-01-31', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Mar 2018', 'fomc_meeting', 'Federal Reserve rate hike', 'USA', '2018-03-21', '2018-03-21', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting May 2018', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2018-05-02', '2018-05-02', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Jun 2018', 'fomc_meeting', 'Federal Reserve rate hike', 'USA', '2018-06-13', '2018-06-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Aug 2018', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2018-08-01', '2018-08-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Sep 2018', 'fomc_meeting', 'Federal Reserve rate hike', 'USA', '2018-09-26', '2018-09-26', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Nov 2018', 'fomc_meeting', 'Federal Reserve monetary policy decision', 'USA', '2018-11-08', '2018-11-08', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('FOMC Meeting Dec 2018', 'fomc_meeting', 'Federal Reserve rate hike', 'USA', '2018-12-19', '2018-12-19', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- ============================================================================
-- INDIA UNION BUDGET
-- ============================================================================

INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('Union Budget 2024-25', 'budget_india', 'India Union Budget presentation - Full Budget', 'India', '2024-07-23', '2024-07-23', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Interim Budget 2024-25', 'budget_india', 'India Interim Budget presentation', 'India', '2024-02-01', '2024-02-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Union Budget 2023-24', 'budget_india', 'India Union Budget presentation', 'India', '2023-02-01', '2023-02-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Union Budget 2022-23', 'budget_india', 'India Union Budget presentation', 'India', '2022-02-01', '2022-02-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Union Budget 2021-22', 'budget_india', 'India Union Budget presentation', 'India', '2021-02-01', '2021-02-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Union Budget 2020-21', 'budget_india', 'India Union Budget presentation', 'India', '2020-02-01', '2020-02-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Union Budget 2019-20 Full', 'budget_india', 'India Union Budget presentation - Full Budget', 'India', '2019-07-05', '2019-07-05', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Interim Budget 2019-20', 'budget_india', 'India Interim Budget presentation', 'India', '2019-02-01', '2019-02-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Union Budget 2018-19', 'budget_india', 'India Union Budget presentation', 'India', '2018-02-01', '2018-02-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Union Budget 2017-18', 'budget_india', 'India Union Budget presentation - First combined budget', 'India', '2017-02-01', '2017-02-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Union Budget 2016-17', 'budget_india', 'India Union Budget presentation', 'India', '2016-02-29', '2016-02-29', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('Union Budget 2015-16', 'budget_india', 'India Union Budget presentation', 'India', '2015-02-28', '2015-02-28', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- ============================================================================
-- RBI MONETARY POLICY (Policy Events)
-- ============================================================================

-- 2024 RBI Policy
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('RBI MPC Feb 2024', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2024-02-08', '2024-02-08', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Apr 2024', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2024-04-05', '2024-04-05', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Jun 2024', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2024-06-07', '2024-06-07', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Aug 2024', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2024-08-08', '2024-08-08', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Oct 2024', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2024-10-09', '2024-10-09', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Dec 2024', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2024-12-06', '2024-12-06', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true);

-- 2023 RBI Policy
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('RBI MPC Feb 2023', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2023-02-08', '2023-02-08', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Apr 2023', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2023-04-06', '2023-04-06', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Jun 2023', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2023-06-08', '2023-06-08', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Aug 2023', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2023-08-10', '2023-08-10', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Oct 2023', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2023-10-06', '2023-10-06', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Dec 2023', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2023-12-08', '2023-12-08', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true);

-- 2022 RBI Policy
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('RBI MPC Feb 2022', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2022-02-10', '2022-02-10', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Apr 2022', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2022-04-08', '2022-04-08', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI Emergency May 2022', 'policy_event', 'RBI Emergency rate hike - Inflation control', 'India', '2022-05-04', '2022-05-04', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('RBI MPC Jun 2022', 'policy_event', 'RBI Monetary Policy Committee decision - Rate hike', 'India', '2022-06-08', '2022-06-08', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Aug 2022', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2022-08-05', '2022-08-05', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Sep 2022', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2022-09-30', '2022-09-30', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Dec 2022', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2022-12-07', '2022-12-07', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true);

-- 2021 RBI Policy
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('RBI MPC Feb 2021', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2021-02-05', '2021-02-05', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Apr 2021', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2021-04-07', '2021-04-07', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Jun 2021', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2021-06-04', '2021-06-04', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Aug 2021', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2021-08-06', '2021-08-06', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Oct 2021', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2021-10-08', '2021-10-08', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Dec 2021', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2021-12-08', '2021-12-08', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true);

-- 2020 RBI Policy
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('RBI MPC Feb 2020', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2020-02-06', '2020-02-06', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI Emergency Mar 2020', 'policy_event', 'RBI Emergency rate cut - COVID-19 response', 'India', '2020-03-27', '2020-03-27', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('RBI MPC May 2020', 'policy_event', 'RBI Monetary Policy Committee decision - COVID response', 'India', '2020-05-22', '2020-05-22', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Aug 2020', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2020-08-06', '2020-08-06', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Oct 2020', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2020-10-09', '2020-10-09', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('RBI MPC Dec 2020', 'policy_event', 'RBI Monetary Policy Committee decision', 'India', '2020-12-04', '2020-12-04', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true);

-- ============================================================================
-- MACRO RELEASES (US CPI, NFP, GDP)
-- ============================================================================

-- US CPI Releases 2024
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('US CPI Jan 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-01-11', '2024-01-11', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Feb 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-02-13', '2024-02-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Mar 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-03-12', '2024-03-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Apr 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-04-10', '2024-04-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI May 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-05-15', '2024-05-15', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Jun 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-06-12', '2024-06-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Jul 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-07-11', '2024-07-11', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Aug 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-08-14', '2024-08-14', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Sep 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-09-11', '2024-09-11', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Oct 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-10-10', '2024-10-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Nov 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-11-13', '2024-11-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Dec 2024', 'macro_release', 'US Consumer Price Index release', 'USA', '2024-12-11', '2024-12-11', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- US CPI Releases 2023
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('US CPI Jan 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-01-12', '2023-01-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Feb 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-02-14', '2023-02-14', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Mar 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-03-14', '2023-03-14', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Apr 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-04-12', '2023-04-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI May 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-05-10', '2023-05-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Jun 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-06-13', '2023-06-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Jul 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-07-12', '2023-07-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Aug 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-08-10', '2023-08-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Sep 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-09-13', '2023-09-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Oct 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-10-12', '2023-10-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Nov 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-11-14', '2023-11-14', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Dec 2023', 'macro_release', 'US Consumer Price Index release', 'USA', '2023-12-12', '2023-12-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- US CPI Releases 2022
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('US CPI Jan 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-01-12', '2022-01-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Feb 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-02-10', '2022-02-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Mar 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-03-10', '2022-03-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Apr 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-04-12', '2022-04-12', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI May 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-05-11', '2022-05-11', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Jun 2022', 'macro_release', 'US Consumer Price Index release - Peak inflation', 'USA', '2022-06-10', '2022-06-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Jul 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-07-13', '2022-07-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Aug 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-08-10', '2022-08-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Sep 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-09-13', '2022-09-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Oct 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-10-13', '2022-10-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Nov 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-11-10', '2022-11-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US CPI Dec 2022', 'macro_release', 'US Consumer Price Index release', 'USA', '2022-12-13', '2022-12-13', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- US Non-Farm Payrolls (NFP) - Major releases
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('US NFP Jan 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-01-05', '2024-01-05', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Feb 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-02-02', '2024-02-02', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Mar 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-03-08', '2024-03-08', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Apr 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-04-05', '2024-04-05', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP May 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-05-03', '2024-05-03', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Jun 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-06-07', '2024-06-07', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Jul 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-07-05', '2024-07-05', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Aug 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-08-02', '2024-08-02', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Sep 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-09-06', '2024-09-06', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Oct 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-10-04', '2024-10-04', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Nov 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-11-01', '2024-11-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Dec 2024', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2024-12-06', '2024-12-06', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- US NFP 2023
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('US NFP Jan 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-01-06', '2023-01-06', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Feb 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-02-03', '2023-02-03', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Mar 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-03-10', '2023-03-10', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Apr 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-04-07', '2023-04-07', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP May 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-05-05', '2023-05-05', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Jun 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-06-02', '2023-06-02', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Jul 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-07-07', '2023-07-07', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Aug 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-08-04', '2023-08-04', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Sep 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-09-01', '2023-09-01', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Oct 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-10-06', '2023-10-06', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Nov 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-11-03', '2023-11-03', 'none', false, '["GOLD", "SILVER"]', 'high', true, true),
('US NFP Dec 2023', 'macro_release', 'US Non-Farm Payrolls employment report', 'USA', '2023-12-08', '2023-12-08', 'none', false, '["GOLD", "SILVER"]', 'high', true, true);

-- US GDP Releases (Quarterly)
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('US GDP Q4 2023', 'macro_release', 'US GDP Advance Estimate Q4 2023', 'USA', '2024-01-25', '2024-01-25', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('US GDP Q1 2024', 'macro_release', 'US GDP Advance Estimate Q1 2024', 'USA', '2024-04-25', '2024-04-25', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('US GDP Q2 2024', 'macro_release', 'US GDP Advance Estimate Q2 2024', 'USA', '2024-07-25', '2024-07-25', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('US GDP Q3 2024', 'macro_release', 'US GDP Advance Estimate Q3 2024', 'USA', '2024-10-30', '2024-10-30', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('US GDP Q3 2023', 'macro_release', 'US GDP Advance Estimate Q3 2023', 'USA', '2023-10-26', '2023-10-26', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('US GDP Q2 2023', 'macro_release', 'US GDP Advance Estimate Q2 2023', 'USA', '2023-07-27', '2023-07-27', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('US GDP Q1 2023', 'macro_release', 'US GDP Advance Estimate Q1 2023', 'USA', '2023-04-27', '2023-04-27', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('US GDP Q4 2022', 'macro_release', 'US GDP Advance Estimate Q4 2022', 'USA', '2023-01-26', '2023-01-26', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true);

-- Gold Import Duty Changes (India) - Major policy events
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('Gold Import Duty Cut 2024', 'policy_event', 'India reduces gold import duty from 15% to 6%', 'India', '2024-07-23', '2024-07-23', 'none', false, '["GOLD"]', 'high', true, true),
('Gold Import Duty Hike 2019', 'policy_event', 'India increases gold import duty to 12.5%', 'India', '2019-07-05', '2019-07-05', 'none', false, '["GOLD"]', 'high', true, true),
('Gold Import Duty Hike 2022', 'policy_event', 'India increases gold import duty to 15%', 'India', '2022-06-30', '2022-06-30', 'none', false, '["GOLD"]', 'high', true, true);

-- India GDP Releases
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('India GDP Q2 FY25', 'macro_release', 'India GDP growth rate Q2 FY2024-25', 'India', '2024-11-29', '2024-11-29', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India GDP Q1 FY25', 'macro_release', 'India GDP growth rate Q1 FY2024-25', 'India', '2024-08-30', '2024-08-30', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India GDP Q4 FY24', 'macro_release', 'India GDP growth rate Q4 FY2023-24', 'India', '2024-05-31', '2024-05-31', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India GDP Q3 FY24', 'macro_release', 'India GDP growth rate Q3 FY2023-24', 'India', '2024-02-29', '2024-02-29', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India GDP Q2 FY24', 'macro_release', 'India GDP growth rate Q2 FY2023-24', 'India', '2023-11-30', '2023-11-30', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India GDP Q1 FY24', 'macro_release', 'India GDP growth rate Q1 FY2023-24', 'India', '2023-08-31', '2023-08-31', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true);

-- India CPI Releases (Monthly)
INSERT INTO tradeflix_tools.seasonal_events (name, event_type, description, country, start_date, end_date, recurrence, is_lunar_based, commodities_affected, expected_impact, is_active, is_verified)
VALUES 
('India CPI Jan 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-02-12', '2024-02-12', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI Feb 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-03-12', '2024-03-12', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI Mar 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-04-12', '2024-04-12', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI Apr 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-05-13', '2024-05-13', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI May 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-06-12', '2024-06-12', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI Jun 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-07-12', '2024-07-12', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI Jul 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-08-12', '2024-08-12', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI Aug 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-09-12', '2024-09-12', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI Sep 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-10-14', '2024-10-14', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI Oct 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-11-12', '2024-11-12', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true),
('India CPI Nov 2024', 'macro_release', 'India Consumer Price Index release', 'India', '2024-12-12', '2024-12-12', 'none', false, '["GOLD", "SILVER"]', 'medium', true, true);

-- Verify count
SELECT event_type, COUNT(*) as count FROM tradeflix_tools.seasonal_events GROUP BY event_type ORDER BY count DESC;
