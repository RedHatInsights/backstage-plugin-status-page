import { AuditEvent } from '../../../AuditCompliancePage/audit-components/AuditDetailsSection/AuditActivityStream/types';

export interface CollapsibleActivityStreamProps {
  auditHistory: AuditEvent[];
  onRefresh: () => void;
  getStatusChipStyle: (status: string) => any;
}
