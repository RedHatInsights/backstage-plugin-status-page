export type TLhProject = {
  id: string;
  name: string;
  slug: string;
  externalUrl: string;
  token: string;
  baseBranch: string;
  adminToken: string;
  createdAt: string;
  updatedAt: string;
};

export type TLhProjectBuild = {
  id: string;
  projectId: string;
  lifecycle: string;
  hash: string;
  branch: string;
  commitMessage: string;
  author: string;
  avatarUrl: string;
  ancestorHash: string;
  externalBuildUrl: string;
  runAt: string;
  committedAt: string;
  ancestorCommittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TLhProjectBuildRun = {};

export type TLighthouseScoreType = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
};
