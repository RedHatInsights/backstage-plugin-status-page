export interface PluginAnalytics {
  label: string;
  nb_visits: number;
  nb_hits: number;
  avg_time_on_page: string;
  bounce_rate: string;
  exit_rate: string;
}

export interface PluginStats {
  name: string;
  visits: number;
}

export interface PieChartData {
  id: string;
  value: number;
  label: string;
}
