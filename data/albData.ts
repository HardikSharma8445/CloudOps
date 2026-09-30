export type LoadBalancerStatus = "active" | "provisioning";

export type LoadBalancer = {
  id: string;
  name: string;
  status: LoadBalancerStatus;
  type: string;
  scheme: string;
  region: string;
  regionName: string;
  availabilityZones: string;
  dnsName: string;
  listeners: string;
  targetGroups: number;
  healthyTargets: number;
  totalTargets: number;
  vpcId: string;
  securityGroup: string;
  environment: string;
  createdAt: string;
};

export const loadBalancers: LoadBalancer[] = [
  {
    id: "prod-api-alb",
    name: "prod-api-alb",
    status: "active",
    type: "application",
    scheme: "internet-facing",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZones: "ap-south-1a, ap-south-1b",
    dnsName: "prod-api-alb-1284930571.ap-south-1.elb.amazonaws.com",
    listeners: "HTTPS:443, HTTP:80",
    targetGroups: 3,
    healthyTargets: 6,
    totalTargets: 6,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    securityGroup: "sg-0a91c4e7b2d58f036",
    environment: "Production",
    createdAt: "08 Jan 2026, 10:44 AM",
  },
  {
    id: "prod-internal-nlb",
    name: "prod-internal-nlb",
    status: "active",
    type: "network",
    scheme: "internal",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZones: "ap-south-1a, ap-south-1b",
    dnsName: "prod-internal-nlb-7b3c92de41af5608.elb.ap-south-1.amazonaws.com",
    listeners: "TCP:6379, TCP:9092",
    targetGroups: 2,
    healthyTargets: 4,
    totalTargets: 4,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    securityGroup: "sg-06d3b8f1a7c24e590",
    environment: "Production",
    createdAt: "08 Jan 2026, 11:02 AM",
  },
  {
    id: "prod-admin-alb",
    name: "prod-admin-alb",
    status: "active",
    type: "application",
    scheme: "internal",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZones: "ap-south-1a",
    dnsName: "internal-prod-admin-alb-903417265.ap-south-1.elb.amazonaws.com",
    listeners: "HTTPS:443",
    targetGroups: 1,
    healthyTargets: 1,
    totalTargets: 2,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    securityGroup: "sg-0a91c4e7b2d58f036",
    environment: "Production",
    createdAt: "19 Mar 2026, 03:58 PM",
  },
  {
    id: "staging-api-alb",
    name: "staging-api-alb",
    status: "provisioning",
    type: "application",
    scheme: "internet-facing",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZones: "ap-south-1a, ap-south-1b",
    dnsName: "staging-api-alb-556201984.ap-south-1.elb.amazonaws.com",
    listeners: "HTTPS:443",
    targetGroups: 1,
    healthyTargets: 0,
    totalTargets: 2,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    securityGroup: "sg-03f7d9a2c6b15e847",
    environment: "Staging",
    createdAt: "27 Sep 2026, 06:15 PM",
  },
  {
    id: "qa-api-alb",
    name: "qa-api-alb",
    status: "active",
    type: "application",
    scheme: "internet-facing",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZones: "ap-south-1a",
    dnsName: "qa-api-alb-412873690.ap-south-1.elb.amazonaws.com",
    listeners: "HTTP:80",
    targetGroups: 1,
    healthyTargets: 2,
    totalTargets: 2,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    securityGroup: "sg-03f7d9a2c6b15e847",
    environment: "QA",
    createdAt: "05 May 2026, 01:23 PM",
  },
  {
    id: "dev-api-alb",
    name: "dev-api-alb",
    status: "active",
    type: "application",
    scheme: "internet-facing",
    region: "ap-south-2",
    regionName: "Hyderabad",
    availabilityZones: "ap-south-2a",
    dnsName: "dev-api-alb-730598214.ap-south-2.elb.amazonaws.com",
    listeners: "HTTP:80",
    targetGroups: 1,
    healthyTargets: 1,
    totalTargets: 1,
    vpcId: "vpc-04e7a1c9b2f6d8350",
    securityGroup: "sg-0c82e5b4d9f36a170",
    environment: "Development",
    createdAt: "21 Aug 2026, 11:09 AM",
  },
];
