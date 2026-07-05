const { requireSupabase } = require("../utils/supabase-guard");

async function trackMetricEvent(metricName, payload = {}) {
  try {
    const supabase = requireSupabase();
    await supabase.from("platform_metrics_events").insert({
      metric_name: metricName,
      payload,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Metrics are non-blocking by design.
  }
}

module.exports = {
  trackMetricEvent,
};
