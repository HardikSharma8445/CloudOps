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

export const eksClusters: EksCluster[] = [
  {
    id: "prod-eks-01",
    name: "prod-eks-01",
    status: "active",
    version: "1.31",
    platformVersion: "eks.12",
    region: "ap-south-1",
    regionName: "Mumbai",
    nodeGroups: 3,
    nodeCount: 9,
    desiredNodes: 9,
    nodeInstanceType: "m6i.xlarge",
    endpoint: "https://A1B2C3D4E5F6G7H8.gr7.ap-south-1.eks.amazonaws.com",
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    serviceRole: "arn:aws:iam::210987654321:role/eksClusterRole",
    logging: "api, audit, authenticator",
    environment: "Production",
    createdAt: "15 Dec 2025, 02:30 PM",
  },
  {
    id: "prod-data-eks-01",
    name: "prod-data-eks-01",
    status: "active",
    version: "1.30",
    platformVersion: "eks.18",
    region: "ap-south-1",
    regionName: "Mumbai",
    nodeGroups: 2,
    nodeCount: 6,
    desiredNodes: 6,
    nodeInstanceType: "r6i.2xlarge",
    endpoint: "https://B2C3D4E5F6G7H8I9.gr7.ap-south-1.eks.amazonaws.com",
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    serviceRole: "arn:aws:iam::210987654321:role/eksClusterRole",
    logging: "api, audit",
    environment: "Production",
    createdAt: "22 Feb 2026, 10:15 AM",
  },
  {
    id: "staging-eks-01",
    name: "staging-eks-01",
    status: "updating",
    version: "1.30",
    platformVersion: "eks.15",
    region: "ap-south-1",
    regionName: "Mumbai",
    nodeGroups: 1,
    nodeCount: 3,
    desiredNodes: 4,
    nodeInstanceType: "t3.large",
    endpoint: "https://C3D4E5F6G7H8I9J0.gr7.ap-south-1.eks.amazonaws.com",
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    serviceRole: "arn:aws:iam::210987654321:role/eksClusterRole",
    logging: "api",
    environment: "Staging",
    createdAt: "11 Apr 2026, 05:48 PM",
  },
  {
    id: "qa-eks-01",
    name: "qa-eks-01",
    status: "active",
    version: "1.29",
    platformVersion: "eks.24",
    region: "ap-south-1",
    regionName: "Mumbai",
    nodeGroups: 1,
    nodeCount: 2,
    desiredNodes: 2,
    nodeInstanceType: "t3.medium",
    endpoint: "https://D4E5F6G7H8I9J0K1.gr7.ap-south-1.eks.amazonaws.com",
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    serviceRole: "arn:aws:iam::210987654321:role/eksClusterRole",
    logging: "api",
    environment: "QA",
    createdAt: "30 Jun 2026, 12:02 PM",
  },
  {
    id: "dev-eks-01",
    name: "dev-eks-01",
    status: "active",
    version: "1.31",
    platformVersion: "eks.12",
    region: "ap-south-2",
    regionName: "Hyderabad",
    nodeGroups: 1,
    nodeCount: 2,
    desiredNodes: 2,
    nodeInstanceType: "t3.small",
    endpoint: "https://E5F6G7H8I9J0K1L2.gr7.ap-south-2.eks.amazonaws.com",
    vpcId: "vpc-04e7a1c9b2f6d8350",
    serviceRole: "arn:aws:iam::210987654321:role/eksClusterRole",
    logging: "Disabled",
    environment: "Development",
    createdAt: "14 Aug 2026, 09:37 AM",
  },
];
