export type AccessRequest = {
  id: string;
  username: string;
  userId: string;
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
