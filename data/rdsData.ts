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

export const rdsInstances: RdsInstance[] = [
  {
    id: "db-PROD7MYSQL4KX2QA9",
    name: "prod-mysql-01",
    status: "available",
    engine: "MySQL",
    engineVersion: "8.0.35",
    instanceClass: "db.r6g.large",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZone: "ap-south-1a",
    multiAz: "Yes",
    storage: "200 GiB",
    storageType: "gp3",
    endpoint: "prod-mysql-01.c9x8kd2lmn4p.ap-south-1.rds.amazonaws.com",
    port: 3306,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    subnetGroup: "prod-db-subnet-group",
    backupRetention: "14 days",
    environment: "Production",
    createdAt: "04 Mar 2026, 11:20 AM",
  },
  {
    id: "db-PRODPGSQL8MN3TB1",
    name: "prod-postgres-01",
    status: "available",
    engine: "PostgreSQL",
    engineVersion: "16.3",
    instanceClass: "db.m6g.xlarge",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZone: "ap-south-1b",
    multiAz: "Yes",
    storage: "500 GiB",
    storageType: "gp3",
    endpoint: "prod-postgres-01.c9x8kd2lmn4p.ap-south-1.rds.amazonaws.com",
    port: 5432,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    subnetGroup: "prod-db-subnet-group",
    backupRetention: "14 days",
    environment: "Production",
    createdAt: "18 Jan 2026, 09:05 AM",
  },
  {
    id: "db-ANALYTICSAUR5QZ7",
    name: "analytics-aurora-01",
    status: "available",
    engine: "Aurora MySQL",
    engineVersion: "3.05.2",
    instanceClass: "db.r6g.2xlarge",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZone: "ap-south-1a",
    multiAz: "Yes",
    storage: "Aurora managed",
    storageType: "aurora",
    endpoint:
      "analytics-aurora-01.cluster-c9x8kd2lmn4p.ap-south-1.rds.amazonaws.com",
    port: 3306,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    subnetGroup: "prod-db-subnet-group",
    backupRetention: "30 days",
    environment: "Production",
    createdAt: "27 Feb 2026, 03:41 PM",
  },
  {
    id: "db-STAGINGMYSQL2WR6",
    name: "staging-mysql-01",
    status: "modifying",
    engine: "MySQL",
    engineVersion: "8.0.35",
    instanceClass: "db.t4g.medium",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZone: "ap-south-1b",
    multiAz: "No",
    storage: "100 GiB",
    storageType: "gp3",
    endpoint: "staging-mysql-01.c9x8kd2lmn4p.ap-south-1.rds.amazonaws.com",
    port: 3306,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    subnetGroup: "staging-db-subnet-group",
    backupRetention: "7 days",
    environment: "Staging",
    createdAt: "09 Jun 2026, 01:12 PM",
  },
  {
    id: "db-QAMYSQL6LP9DV3",
    name: "qa-mysql-01",
    status: "stopped",
    engine: "MySQL",
    engineVersion: "8.0.35",
    instanceClass: "db.t4g.medium",
    region: "ap-south-1",
    regionName: "Mumbai",
    availabilityZone: "ap-south-1a",
    multiAz: "No",
    storage: "50 GiB",
    storageType: "gp2",
    endpoint: "qa-mysql-01.c9x8kd2lmn4p.ap-south-1.rds.amazonaws.com",
    port: 3306,
    vpcId: "vpc-0b12d4f8a9c3e7f60",
    subnetGroup: "qa-db-subnet-group",
    backupRetention: "3 days",
    environment: "QA",
    createdAt: "21 May 2026, 10:54 AM",
  },
  {
    id: "db-DEVPGSQL1HT4XC8",
    name: "dev-postgres-01",
    status: "available",
    engine: "PostgreSQL",
    engineVersion: "15.7",
    instanceClass: "db.t4g.small",
    region: "ap-south-2",
    regionName: "Hyderabad",
    availabilityZone: "ap-south-2a",
    multiAz: "No",
    storage: "30 GiB",
    storageType: "gp3",
    endpoint: "dev-postgres-01.d4m2nb8kq1zt.ap-south-2.rds.amazonaws.com",
    port: 5432,
    vpcId: "vpc-04e7a1c9b2f6d8350",
    subnetGroup: "dev-db-subnet-group",
    backupRetention: "1 day",
    environment: "Development",
    createdAt: "02 Aug 2026, 04:26 PM",
  },
];
