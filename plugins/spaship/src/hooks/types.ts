export type ApiResponse<T extends unknown> = {
  data: T;
};

export type TDeploymentHistoryByMonth = Record<
  string,
  Array<{
    count: number;
    endDate: string;
    env: string;
    startDate: string;
  }>
>;

export type TDeploymentEnv = {
  count: number;
  env: string;
};

export type TDeploymentProperty = {
  action: string;
  propertyIdentifier: string;
  count: string;
};

export type TDeploymentTime = {
  averageTime: number;
  totalTime: number;
  count: number;
  deploymentDetails: TDeploymentDetail[];
  days: string;
};

export type TDeploymentDetail = {
  propertyIdentifier: string;
  count: number;
  totalTime: number;
  averageTime: number;
};

export type TActivityStream = {
  _id: string;
  propertyIdentifier: string;
  action: string;
  props: {
    applicationIdentifier: string;
    env: string;
  };
  message: string;
  payload: string;
  source: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type TApiFilter = {
  propertyIdentifier?: string;
  applicationIdentifier?: string;
};
