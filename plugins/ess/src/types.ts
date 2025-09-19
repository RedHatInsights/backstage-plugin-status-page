export interface Platform {
  name: string;
  description?: string;
  owner?: string;
  metadata: Record<string, any>;
  spec?: Record<string, any>;
  kind: string;
  namespace: string;
}
