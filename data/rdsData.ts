export type RdsStatus = "available" | "stopped" | "modifying";

export type RdsInstance = {
  id: string;
  name: string;
  status: RdsStatus;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  region: string;
  regionName: string;
  availabilityZone: string;
  multiAz: string;
  storage: string;
  storageType: string;
  endpoint: string;
  port: number;
  vpcId: string;
  subnetGroup: string;
  backupRetention: string;
  environment: string;
  createdAt: string;
};

export const rdsInstances: RdsInstance[] = [];
