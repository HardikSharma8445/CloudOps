export type InstanceStatus = "running" | "stopped";

export type Ec2Instance = {
  id: string;
  name: string;
  status: InstanceStatus;
  instanceType: string;
  region: string;
  regionName: string;
  privateIp: string;
  publicIp: string | null;
  environment: string;
  availabilityZone: string;
  vpcId: string;
  subnetId: string;
  launchTime: string;
  /** Owning AWS account ID, attached by /api/ec2 so the UI can filter per account. */
  accountId?: string;
};

export const ec2Instances: Ec2Instance[] = [];
