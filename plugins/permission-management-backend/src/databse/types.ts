export type AccessRequestDatabaseModel = {
  id: string;
  userName: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  group: string;
  role: 'member' | 'owner';
  reason: string;
  reviewer?: string;
  rejectionReason?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
