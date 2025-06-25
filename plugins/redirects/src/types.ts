export type RedirectsConfig = {
  rules: RedirectionRule[];
};
export type RedirectionRule = {
  type: 'url' | 'entity';
  from: string;
  to: string;
  message?: string;
}
