export interface ISankeyData {
  from: string;
  to: string;
  flow: number;
}

export interface IProgressData {
  ['string']: string;
}

export interface ITableData {
  id: number;
  key: string;
  summary: string;
  status: string;
  criticality: string;
  epic: string;
}

export interface ICMDBResult {
  business_criticality: string;
  name: string;
  u_application_id: string;
}
