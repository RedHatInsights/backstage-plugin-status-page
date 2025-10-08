export type Contributor = {
  userRef: string;
  commonWs: {
    workstreamRef: string;
    role?: string;
  }[];
};
