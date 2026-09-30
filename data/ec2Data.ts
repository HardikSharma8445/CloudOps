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
};

export const ec2Instances: Ec2Instance[] = [
  {
    id: "i-0a3f9c21b74e5d810",
    name: "prod-api-01",
    status: "running",
    instanceType: "t3.large",
    region: "ap-south-1",
    regionName: "Mumbai",
    privateIp: "10.0.1.25",
    publicIp: "13.233.10.20",
    environment: "Production",
    availabilityZone: "ap-south-1a",
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    subnetId: "subnet-07c1e9b3d5a2f4088",
    launchTime: "28 Sep 2026, 10:32 AM",
  },
  {
    id: "i-0c7d15e8f2b904a33",
    name: "prod-db-01",
    status: "running",
    instanceType: "m5.large",
    region: "ap-south-1",
    regionName: "Mumbai",
    privateIp: "10.0.2.14",
    publicIp: null,
    environment: "Production",
    availabilityZone: "ap-south-1b",
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    subnetId: "subnet-0d94a7c1f6b83e255",
    launchTime: "12 Aug 2026, 04:18 PM",
  },
  {
    id: "i-0f24b6a93c81d7e04",
    name: "prod-worker-01",
    status: "running",
    instanceType: "c5.xlarge",
    region: "ap-south-1",
    regionName: "Mumbai",
    privateIp: "10.0.2.61",
    publicIp: null,
    environment: "Production",
    availabilityZone: "ap-south-1b",
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    subnetId: "subnet-0d94a7c1f6b83e255",
    launchTime: "19 Sep 2026, 09:05 AM",
  },
  {
    id: "i-0b58e3d7a4f12c096",
    name: "qa-server-01",
    status: "stopped",
    instanceType: "t3.medium",
    region: "ap-south-1",
    regionName: "Mumbai",
    privateIp: "10.0.3.42",
    publicIp: null,
    environment: "QA",
    availabilityZone: "ap-south-1a",
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    subnetId: "subnet-0a6f2b8e1c47d9033",
    launchTime: "02 Jul 2026, 11:47 AM",
  },
  {
    id: "i-0e91c45b2d8a3f677",
    name: "dev-server-01",
    status: "running",
    instanceType: "t3.small",
    region: "ap-south-2",
    regionName: "Hyderabad",
    privateIp: "10.1.1.18",
    publicIp: "3.108.42.91",
    environment: "Development",
    availabilityZone: "ap-south-2a",
    vpcId: "vpc-04e7a1c9b2f6d8350",
    subnetId: "subnet-092d5f7a3b1c4e688",
    launchTime: "26 Sep 2026, 08:21 AM",
  },
  {
    id: "i-0d46a8f1e5c92b704",
    name: "staging-api-01",
    status: "stopped",
    instanceType: "t3.medium",
    region: "ap-south-2",
    regionName: "Hyderabad",
    privateIp: "10.1.2.37",
    publicIp: null,
    environment: "Staging",
    availabilityZone: "ap-south-2b",
    vpcId: "vpc-04e7a1c9b2f6d8350",
    subnetId: "subnet-01b8c3d6e9f27a544",
    launchTime: "15 Sep 2026, 02:09 PM",
  },
];
