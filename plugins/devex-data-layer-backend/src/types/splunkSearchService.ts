export interface SplunkSearchServices {
  fetchDTLHistoricalData(): Promise<void>;
  fetchHydraHistoricalData(): Promise<void>;
}
