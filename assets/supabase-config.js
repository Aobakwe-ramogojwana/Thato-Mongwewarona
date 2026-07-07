// ============================================================
// Mongwewarona Visuals — Supabase connection config
// ============================================================
window.MV_SUPABASE_URL = "https://przmpemxslhuydvhurgf.supabase.co";
window.MV_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByem1wZW14c2xodXlkdmh1cmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTkwMzMsImV4cCI6MjA5NzQzNTAzM30.z1g9O489dqG2Ua_0bgxrl3qf7hrrVXtSGAwS9rYU-Ls";

window.mvSupabase = supabase.createClient(window.MV_SUPABASE_URL, window.MV_SUPABASE_ANON_KEY);
