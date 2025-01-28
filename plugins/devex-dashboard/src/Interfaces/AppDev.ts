export interface DataPoint {
    name: string;
    value: number;
}

export interface DataStream {
  workStream: string;
  sourceUrl?: string;
  dataPoints: DataPoint[];
}
