export type InstanceStatus = "running" | "stopped";

export type SecurityGroupInfo = {
  id: string;
  name: string;
};

export type EbsVolumeInfo = {
  volumeId: string;
  deviceName: string;
  size: number; // GB
  volumeType: string;
  encrypted: boolean;
  deleteOnTermination: boolean;
};

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
  
  // Enhanced fields
  /** AMI ID used to launch the instance */
  amiId: string;
  /** IAM instance profile/role name */
  iamRole: string | null;
  /** Security groups attached to the instance */
  securityGroups: SecurityGroupInfo[];
  /** EBS volumes attached to the instance */
  ebsVolumes: EbsVolumeInfo[];
  /** Platform (Linux/Windows) */
  platform: string;
  /** Architecture (x86_64, arm64) */
  architecture: string;
  /** Core count */
  coreCount: number | null;
  /** Key pair name */
  keyName: string | null;
  /** Monitoring state (enabled/disabled) */
  monitoring: string;
  /** All tags as key-value pairs */
  tags: Record<string, string>;
};

export const ec2Instances: Ec2Instance[] = [];
