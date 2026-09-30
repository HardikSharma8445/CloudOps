import { ec2Instances } from "@/data/ec2Data";
import { rdsInstances } from "@/data/rdsData";
import { eksClusters } from "@/data/eksData";
import { loadBalancers } from "@/data/albData";
import { s3Buckets } from "@/data/s3Data";
import {
  BalancerIcon,
  BucketIcon,
  CubeIcon,
  DatabaseIcon,
  GridIcon,
  ServerIcon,
} from "./Icons";
import type { IconComponent } from "./types";

export type NavItem = {
  label: string;
  href: string;
  Icon: IconComponent;
  count: number | null;
};

/** EC2 stays on "/" so the root URL still opens the EC2 dashboard. */
export const navItems: NavItem[] = [
  { label: "Overview", href: "/overview", Icon: GridIcon, count: null },
  { label: "EC2", href: "/", Icon: ServerIcon, count: ec2Instances.length },
  { label: "RDS", href: "/rds", Icon: DatabaseIcon, count: rdsInstances.length },
  { label: "EKS", href: "/eks", Icon: CubeIcon, count: eksClusters.length },
  {
    label: "ALB",
    href: "/alb",
    Icon: BalancerIcon,
    count: loadBalancers.length,
  },
  { label: "S3", href: "/s3", Icon: BucketIcon, count: s3Buckets.length },
];
