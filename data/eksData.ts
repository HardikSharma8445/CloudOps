export type EksStatus = "active" | "updating";

export type EksCluster = {
  id: string;
  name: string;
  status: EksStatus;
  version: string;
  platformVersion: string;
  region: string;
  regionName: string;
  nodeGroups: number;
  nodeCount: number;
  desiredNodes: number;
  nodeInstanceType: string;
  endpoint: string;
  vpcId: string;
  serviceRole: string;
  logging: string;
  environment: string;
  createdAt: string;
};

export const eksClusters: EksCluster[] = [];
