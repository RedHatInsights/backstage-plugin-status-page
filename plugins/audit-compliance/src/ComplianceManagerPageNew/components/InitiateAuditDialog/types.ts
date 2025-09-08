export interface Application {
  id: string;
  app_name: string;
  app_owner: string;
  cmdb_id: string;
}

export interface InitiateAuditDialogProps {
  open: boolean;
  onClose: () => void;
  applications: Application[];
  selectedApplications: string[];
  frequency: 'quarterly' | 'yearly' | '';
  selectedQuarter: string;
  selectedYear: number;
  onFrequencyChange: (frequency: 'quarterly' | 'yearly' | '') => void;
  onQuarterChange: (quarter: string) => void;
  onYearChange: (year: number) => void;
  onApplicationsChange: (applicationIds: string[]) => void;
  onInitiate: () => void;
  initiating: boolean;
  getQuarterOptions: () => Array<{ value: string; label: string }>;
  getYearOptions: () => number[];
}
