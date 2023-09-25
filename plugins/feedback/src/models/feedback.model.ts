export enum FeedbackCategory {
  BUG = 'BUG',
  FEEDBACK = 'FEEDBACK',
}

export type FeedbackModel = {
  feedbackId: string;
  summary: string;
  projectId: string;
  description: string;
  url: string;
  userAgent: string;
  tag: string;
  ticketUrl: string;
  feedbackType: FeedbackCategory;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};
