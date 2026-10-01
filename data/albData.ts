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

export const loadBalancers: LoadBalancer[] = [];
