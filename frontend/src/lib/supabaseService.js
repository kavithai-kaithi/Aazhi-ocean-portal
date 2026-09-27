import { supabase, isSupabaseConfigured } from './supabase.js';
import { PLATFORMS, sample, observed, profilePairs, stats } from './ocean.js';

/**
 * Fetch all Argo Float & CTD stations from Supabase (or fallback to local dataset)
 */
export async function fetchArgoStations() {
  if (!isSupabaseConfigured || !supabase) {
    return PLATFORMS;
  }

  try {
    const { data, error } = await supabase
      .from('argo_stations')
      .select('*')
      .order('station_id', { ascending: true });

    if (error) {
      console.error('Error fetching stations from Supabase:', error.message);
      return PLATFORMS;
    }

    if (data && data.length > 0) {
      return data.map((row) => ({
        id: row.station_id,
        wmo: row.wmo_id,
        name: row.name,
        type: row.dac_agency || 'incois',
        lon: parseFloat(row.longitude),
        lat: parseFloat(row.latitude),
        depths: row.depth_levels || [0, 50, 100, 150, 200, 300, 500, 750, 1000, 1250, 1500, 1750, 2000],
        lastSeen: row.last_observation_time || '12 h ago',
        qc: row.qc_status || 'good',
        qcCode: row.qc_code || 1,
        dac: row.dac_agency || 'INCOIS',
        datasetSource: row.dataset_source || 'INCOIS / Argo GDAC',
        profiler: row.profiler_model || 'Teledyne Webb APEX SBE 41'
      }));
    }

    return PLATFORMS;
  } catch (err) {
    console.error('Supabase station query exception:', err);
    return PLATFORMS;
  }
}

/**
 * Save / Bookmark a user's 3D Ocean Viewport state
 */
export async function saveUserViewport(viewportData) {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[Supabase Mock] Viewport saved locally:', viewportData);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await supabase
      .from('user_viewports')
      .insert([
        {
          title: viewportData.title || `Saved View - ${new Date().toLocaleDateString()}`,
          variable_id: viewportData.variable,
          depth_m: viewportData.depth,
          time_month: viewportData.month,
          selected_station_id: viewportData.selectedStationId,
          active_colormap: viewportData.activeColormap,
          fog_enabled: viewportData.fogEnabled,
          camera_position: viewportData.cameraPosition || { x: 16, y: 13, z: 22 }
        }
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to save viewport to Supabase:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch saved user viewports / bookmarks
 */
export async function fetchUserViewports() {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_viewports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to fetch viewports:', err);
    return [];
  }
}

/**
 * Save Validation Benchmark Run to Supabase
 */
export async function recordValidationRun(benchmarkData) {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('validation_metrics')
      .insert([
        {
          variable_id: benchmarkData.variable,
          month_year: benchmarkData.month,
          depth_m: benchmarkData.depth,
          observations_count: benchmarkData.n,
          mean_bias: benchmarkData.bias,
          rmse: benchmarkData.rmse,
          pearson_r: benchmarkData.corr,
          qc_filter: benchmarkData.qcFilter || 'qc1'
        }
      ]);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to record validation metric:', err);
    return null;
  }
}
