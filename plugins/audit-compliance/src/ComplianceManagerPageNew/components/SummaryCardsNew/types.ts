export interface ComplianceSummary {
  totalApplications: number;
  compliant: number;
  nonCompliant: number;
  inProgress: number;
  pending: number;
}

export interface SummaryCardsNewProps {
  summary: ComplianceSummary;
}
