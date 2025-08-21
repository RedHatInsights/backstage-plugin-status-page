export type CustomAuthorizer = {
  authorize: (...args: any[]) => Promise<any[]>;
};

