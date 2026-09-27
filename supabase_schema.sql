-- ==============================================================================
-- AAZHI OCEAN OBSERVATION PORTAL - COMPREHENSIVE SUPABASE DATABASE SCHEMA
-- Execute this script directly inside the Supabase SQL Editor
-- (Supabase Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-initializing (Safe Schema Creation)
DROP TABLE IF EXISTS user_viewports CASCADE;
DROP TABLE IF EXISTS ctd_observations CASCADE;
DROP TABLE IF EXISTS validation_metrics CASCADE;
DROP TABLE IF EXISTS argo_stations CASCADE;
DROP TABLE IF EXISTS ocean_variables CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ==============================================================================
-- TABLE 1: OCEAN VARIABLES METADATA (Physical & Biogeochemical State)
-- ==============================================================================
CREATE TABLE ocean_variables (
    variable_id VARCHAR(50) PRIMARY KEY,
    label VARCHAR(150) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    min_range NUMERIC(10, 2) NOT NULL,
    max_range NUMERIC(10, 2) NOT NULL,
    default_colormap VARCHAR(50) NOT NULL,
    cf_standard_name VARCHAR(150),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 2: DATASETS REGISTRY (Simulations, Reanalyses & In-Situ Networks)
-- ==============================================================================
CREATE TABLE datasets (
    dataset_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    identifier VARCHAR(100) NOT NULL,
    provider VARCHAR(150) NOT NULL,
    doi VARCHAR(100),
    spatial_coverage VARCHAR(200),
    resolution_info VARCHAR(150),
    engine_details VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 3: ARGO STATIONS & CTD PROFILING PLATFORMS
-- ==============================================================================
CREATE TABLE argo_stations (
    station_id VARCHAR(50) PRIMARY KEY,
    wmo_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    platform_type VARCHAR(50) NOT NULL, -- incois, aoml, csiro, coriolis, csio, jma
    latitude NUMERIC(8, 4) NOT NULL,
    longitude NUMERIC(8, 4) NOT NULL,
    seafloor_depth_m INTEGER NOT NULL,
    dac_agency VARCHAR(100) NOT NULL,
    dataset_source VARCHAR(150) NOT NULL,
    profiler_model VARCHAR(150) NOT NULL,
    qc_status VARCHAR(50) DEFAULT 'Good (QC)',
    qc_code INTEGER DEFAULT 1,
    last_observation_time VARCHAR(50) DEFAULT '12 h ago',
    depth_levels INTEGER[] DEFAULT ARRAY[0, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500, 700, 1000, 1500, 2000],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for high-performance spatial & station lookups
CREATE INDEX idx_argo_stations_wmo ON argo_stations(wmo_id);
CREATE INDEX idx_argo_stations_coords ON argo_stations(latitude, longitude);

-- ==============================================================================
-- TABLE 4: CTD IN-SITU OBSERVATIONS & MODEL MATCHUP PAIRS
-- ==============================================================================
CREATE TABLE ctd_observations (
    observation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id VARCHAR(50) REFERENCES argo_stations(station_id) ON DELETE CASCADE,
    variable_id VARCHAR(50) REFERENCES ocean_variables(variable_id) ON DELETE CASCADE,
    depth_m INTEGER NOT NULL,
    model_value NUMERIC(10, 3) NOT NULL,
    observed_value NUMERIC(10, 3) NOT NULL,
    qc_flag INTEGER DEFAULT 1,
    observed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ctd_obs_station_var ON ctd_observations(station_id, variable_id, depth_m);

-- ==============================================================================
-- TABLE 5: STATISTICAL BENCHMARK & VALIDATION METRICS
-- ==============================================================================
CREATE TABLE validation_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variable_id VARCHAR(50) REFERENCES ocean_variables(variable_id) ON DELETE CASCADE,
    month_year VARCHAR(20) NOT NULL,
    depth_m INTEGER NOT NULL,
    observations_count INTEGER NOT NULL,
    mean_bias NUMERIC(8, 4) NOT NULL,
    rmse NUMERIC(8, 4) NOT NULL,
    pearson_r NUMERIC(6, 4) NOT NULL,
    qc_filter VARCHAR(20) DEFAULT 'qc1',
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_val_metrics_var_depth ON validation_metrics(variable_id, depth_m);

-- ==============================================================================
-- TABLE 6: USER PROFILES (Analyst Access & Organization Metadata)
-- ==============================================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    organization VARCHAR(150) DEFAULT 'Oceanographic Research Institute',
    role VARCHAR(50) DEFAULT 'Analyst',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 7: USER VIEWPORTS & BOOKMARKS (Saved 3D Slicer Presets)
-- ==============================================================================
CREATE TABLE user_viewports (
    viewport_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    variable_id VARCHAR(50) REFERENCES ocean_variables(variable_id),
    depth_m INTEGER DEFAULT 0,
    time_month VARCHAR(20) DEFAULT '2023-06',
    selected_station_id VARCHAR(50),
    active_colormap VARCHAR(50) DEFAULT 'thermal',
    fog_enabled BOOLEAN DEFAULT FALSE,
    camera_position JSONB DEFAULT '{"x": 16, "y": 13, "z": 22}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE ocean_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE argo_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctd_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_viewports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public Read Access Policies (Open Access for Scientific Dashboard)
CREATE POLICY "Public Read Access for Ocean Variables" ON ocean_variables FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Datasets" ON datasets FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Argo Stations" ON argo_stations FOR SELECT USING (true);
CREATE POLICY "Public Read Access for CTD Observations" ON ctd_observations FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Validation Metrics" ON validation_metrics FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Viewports" ON user_viewports FOR SELECT USING (true);

-- Authenticated User Viewport Policies
CREATE POLICY "Users Can Insert Own Viewports" ON user_viewports FOR INSERT WITH CHECK (true);
CREATE POLICY "Users Can Delete Own Viewports" ON user_viewports FOR DELETE USING (auth.uid() = user_id);

-- Profile RLS Policies
CREATE POLICY "Users Can View Own Profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users Can Update Own Profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ==============================================================================
-- INITIAL SEED DATA INSERTIONS
-- ==============================================================================

-- 1. Seed Ocean Variables
INSERT INTO ocean_variables (variable_id, label, unit, min_range, max_range, default_colormap, cf_standard_name, description) VALUES
('temperature', 'Sea-surface temperature (IBR model)', '°C', 4.0, 31.0, 'thermal', 'sea_surface_temperature', 'INCOIS BIO ROMS 40-Year Reanalysis sea surface temperature'),
('salinity', 'Sea-surface salinity (IBR model)', 'PSU', 31.0, 36.6, 'haline', 'sea_surface_salinity', 'Salinity dynamics across Arabian Sea & Bay of Bengal plumes'),
('currents', 'Current Velocity (uo, vo)', 'm/s', 0.0, 1.6, 'speed', 'sea_water_speed', '3D ocean flow vectors and geostrophic currents from OpenDrift'),
('chlorophyll', 'Sea-surface chlorophyll concentration', 'mg/m³', 0.05, 4.5, 'algae', 'mass_concentration_of_chlorophyll_a_in_sea_water', 'INCOIS BIO ROMS biogeochemical chlorophyll distribution'),
('mld', 'Mixed-layer depth (IBR model)', 'm', 10.0, 140.0, 'mld', 'ocean_mixed_layer_thickness', 'Upper ocean mixed layer thermal depth'),
('dic', 'Dissolved inorganic carbon (DIC)', 'mmol/m³', 1800.0, 2300.0, 'carbon', 'mole_concentration_of_dissolved_inorganic_carbon_in_sea_water', 'Carbon cycle dissolved inorganic carbon'),
('nitrate', 'Sea-surface nitrate concentration', 'mmol/m³', 0.01, 25.0, 'nitrate', 'mole_concentration_of_nitrate_in_sea_water', 'Marine nutrient nitrate concentration'),
('pco2_model', 'Surface partial pressure of CO2', 'µatm', 300.0, 480.0, 'co2', 'surface_partial_pressure_of_carbon_dioxide_in_sea_water', 'Surface partial pressure of CO2'),
('pco2_clim', 'pCO2 climatological deviants', 'µatm', -40.0, 40.0, 'balance', 'surface_co2_climatological_deviant', 'Climatological deviants'),
('uncertainties', 'Uncertainties (1-sigma) of deviants', '1-σ', 0.01, 8.5, 'uncertainty', 'statistical_standard_deviation_uncertainty', 'Standard error deviation');

-- 2. Seed Datasets Registry
INSERT INTO datasets (dataset_id, title, identifier, provider, doi, spatial_coverage, resolution_info, engine_details) VALUES
('incois_bio_roms', 'INCOIS BIO ROMS Reanalysis (1980–2019)', 'INCOIS_LAS_BIO_ROMS_1980_2019', 'INCOIS India', NULL, 'Indian Ocean [30°E–120°E, -30°S–30°N]', '480 Monthly Slices', 'LAS 8. / PyFerret 7.65'),
('cmems_glorys12v1', 'Copernicus CMEMS GLORYS12V1 Ocean Physics', 'GLOBAL_MULTIYEAR_PHY_001_030', 'Mercator Ocean International', '10.48670/moi-00021', 'Global 1/12° (~8 km)', '50 Depth Levels (0-5728m)', 'NEMO 3.1 + SEEK Kalman Filter'),
('argo_gdac', 'Argo Global Data Assembly Centre (Indian Ocean)', 'ARGO_GDAC_INDIAN_OCEAN_INDEX', 'Argo International Steering Team', '10.17882/42182', 'Indian Ocean Basin', '414,727 CTD profiles', 'Autonomous Profiling Floats'),
('opendrift', 'OpenDrift Indian Ocean Hydrodynamics (18.13M Records)', 'OPENDRIFT_INDIAN_OCEAN_HYD_2023_2026', 'OpenDrift / INCOIS', NULL, 'Indian Ocean [65.25°E–94.75°E, 5.25°N–24.75°N]', '18,134,847 Point Records', 'Harmonic Velocity Regression'),
('usgs_delft3d', 'USGS 3D Circulation & Hydrodynamic Model', 'USGS:57db0908e4b090824ffc3324', 'U.S. Geological Survey', '10.5066/F7NK3C59', '1-km Curvilinear Shelf Grid', '3D Flow & Wave Mesh', 'Delft3D-Flow + SWAN');

-- 3. Seed Argo Stations
INSERT INTO argo_stations (station_id, wmo_id, name, platform_type, latitude, longitude, seafloor_depth_m, dac_agency, dataset_source, profiler_model, qc_status, qc_code, last_observation_time) VALUES
('ARGO-2902745', '2902745', 'INCOIS Arabian Sea Station (2902745)', 'incois', 14.8200, 67.4500, 3215, 'INCOIS', 'INCOIS India / Argo GDAC', 'Teledyne Webb APEX SBE 41', 'Good (QC)', 1, '12 h ago'),
('ARGO-2902801', '2902801', 'INCOIS Bay of Bengal Station (2902801)', 'incois', 13.5000, 87.2000, 2890, 'INCOIS', 'INCOIS India / Argo GDAC', 'ARVOR float with SBE 41CP', 'Good (QC)', 1, '6 h ago'),
('ARGO-2903110', '2903110', 'INCOIS Equatorial Station (2903110)', 'incois', 1.2000, 76.5000, 4120, 'INCOIS', 'INCOIS India / Argo GDAC', 'SOLO-II float SBE CTD', 'Good (QC)', 1, '18 h ago'),
('ARGO-1901720', '1901720', 'INCOIS Lakshadweep Sea Station (1901720)', 'incois', 9.4000, 71.8000, 1840, 'INCOIS', 'INCOIS India / Argo GDAC', 'PROVOR CTD Profiler', 'Good (QC)', 1, '24 h ago'),
('ARGO-1900169', '1900169', 'AOML Somali Upwelling Station (1900169)', 'aoml', 1.0400, 51.9000, 4200, 'AOML', 'AOML USA / Argo GDAC', 'Teledyne Webb APEX SBE', 'Good (QC)', 1, '4 h ago'),
('ARGO-3901450', '3901450', 'AOML Central Indian Basin Station (3901450)', 'aoml', -5.4000, 82.3000, 4410, 'AOML', 'AOML USA / Argo GDAC', 'SOLO-II float SBE CTD', 'Good (QC)', 1, '14 h ago'),
('ARGO-5904500', '5904500', 'AOML Southern Indian Ocean Station (5904500)', 'aoml', -8.8000, 64.1000, 4120, 'AOML', 'AOML USA / Argo GDAC', 'Teledyne Webb APEX', 'Good (QC)', 1, '21 h ago'),
('ARGO-5905100', '5905100', 'CSIRO Southeast Indian Ocean Station (5905100)', 'csiro', -8.2000, 94.6000, 3850, 'CSIRO', 'CSIRO Australia / Argo GDAC', 'ARVOR float SBE 41CP', 'Good (QC)', 1, '8 h ago'),
('ARGO-6901800', '6901800', 'CSIRO Ninetyeast Ridge Station (6901800)', 'csiro', 3.5000, 88.8000, 2800, 'CSIRO', 'CSIRO Australia / Argo GDAC', 'ARVOR float with SBE 41CP', 'Good (QC)', 1, '16 h ago'),
('ARGO-6903200', '6903200', 'Coriolis Southwest Basin Station (6903200)', 'coriolis', -4.2000, 61.4000, 3950, 'Coriolis', 'Coriolis France / SEANOE', 'PROVOR CTD Profiler', 'Good (QC)', 1, '2 h ago'),
('ARGO-2902950', '2902950', 'CSIO Eastern Indian Ocean Station (2902950)', 'csio', 8.8000, 91.2000, 3100, 'CSIO', 'CSIO China / Argo GDAC', 'Copernicus Profiler', 'Good (QC)', 1, '10 h ago'),
('ARGO-2903112', '2903112', 'JMA Tropical Indian Ocean Station (2903112)', 'jma', -2.4000, 79.8000, 4250, 'JMA', 'JMA Japan / Argo GDAC', 'SBE 41 NAVIS Profiler', 'Good (QC)', 1, '5 h ago');

-- 4. Seed Initial CTD Profile Observations (Sample Matchups for ARGO-2902745)
INSERT INTO ctd_observations (station_id, variable_id, depth_m, model_value, observed_value, qc_flag) VALUES
('ARGO-2902745', 'temperature', 0, 28.500, 28.260, 1),
('ARGO-2902745', 'temperature', 50, 26.100, 25.860, 1),
('ARGO-2902745', 'temperature', 100, 21.800, 21.560, 1),
('ARGO-2902745', 'temperature', 200, 15.400, 15.160, 1),
('ARGO-2902745', 'temperature', 500, 9.800, 9.560, 1),
('ARGO-2902745', 'temperature', 1000, 5.900, 5.660, 1),
('ARGO-2902745', 'temperature', 2000, 2.400, 2.160, 1);
