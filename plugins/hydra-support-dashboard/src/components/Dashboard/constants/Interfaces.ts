export interface ISankeyData {
  from: string;
  to: string;
  flow: number;
}

export interface IProgressData {
  [key: string]: string;
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

export interface IEpics {
  [key: string]: string;
}

export interface IJiraCustomFields {
  [key: string]: string;
}

export interface IHlgDetail {
  [key: string]: string;
}

export interface IEpicConfig {
  Epics: IEpics;
  JiraCustomFields: IJiraCustomFields;
  HLG_EPICS: string[];
  HLG_DETAILS: IHlgDetail[];
  SUPPORT_JIRAS: string[];
  NEW_WORK_JIRAS: string[];
}