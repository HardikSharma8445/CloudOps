import {
  ActivityIcon,
  BackupIcon,
  BalancerIcon,
  BellIcon,
  BotIcon,
  BucketIcon,
  ComplianceIcon,
  CubeIcon,
  DatabaseIcon,
  DollarIcon,
  GearIcon,
  GridIcon,
  HeartbeatIcon,
  IamIcon,
  InventoryIcon,
  LambdaIcon,
  ServerIcon,
  ShieldIcon,
  VpcIcon,
} from "./Icons";
import type { IconComponent } from "./types";

export type NavItem = {
  label: string;
  href: string;
  Icon: IconComponent;
  /** Show count badge if provided, null to hide */
  count?: number | null;
  /** Section divider above this item */
  section?: string;
  /** Is this a placeholder page (not yet implemented with live data) */
  placeholder?: boolean;
};

export type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
  /** Whether section is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
};

/**
 * Navigation sections for the CloudOps platform.
 * Organized into logical groups for easy navigation.
 */
export const navSections: NavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      { label: "Command Center", href: "/overview", Icon: GridIcon },
    ],
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    collapsible: true,
    items: [
      { label: "EC2 Instances", href: "/ec2", Icon: ServerIcon },
      { label: "RDS Databases", href: "/rds", Icon: DatabaseIcon },
      { label: "EKS Clusters", href: "/eks", Icon: CubeIcon, placeholder: true },
      { label: "S3 Storage", href: "/s3", Icon: BucketIcon },
      { label: "Load Balancers", href: "/alb", Icon: BalancerIcon, placeholder: true },
      { label: "Lambda", href: "/lambda", Icon: LambdaIcon, placeholder: true },
      { label: "VPC & Networking", href: "/vpc", Icon: VpcIcon, placeholder: true },
    ],
  },
  {
    id: "monitoring",
    title: "Monitoring",
    collapsible: true,
    items: [
      { label: "CloudWatch", href: "/cloudwatch", Icon: HeartbeatIcon, placeholder: true },
      { label: "Alarms", href: "/alarms", Icon: BellIcon, placeholder: true },
    ],
  },
  {
    id: "security",
    title: "Security",
    collapsible: true,
    items: [
      { label: "Security Center", href: "/security", Icon: ShieldIcon, placeholder: true },
      { label: "IAM", href: "/iam", Icon: IamIcon, placeholder: true },
    ],
  },
  {
    id: "finops",
    title: "Cost & FinOps",
    collapsible: true,
    items: [
      { label: "Cost Explorer", href: "/cost", Icon: DollarIcon, placeholder: true },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { label: "Backups", href: "/backups", Icon: BackupIcon, placeholder: true },
      { label: "Compliance", href: "/compliance", Icon: ComplianceIcon, placeholder: true },
      { label: "Activity", href: "/activity", Icon: ActivityIcon, placeholder: true },
      { label: "Inventory", href: "/inventory", Icon: InventoryIcon, placeholder: true },
    ],
  },
  {
    id: "ai",
    title: "AI Assistant",
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { label: "CloudOps AI", href: "/ai", Icon: BotIcon, placeholder: true },
    ],
  },
  {
    id: "configuration",
    title: "Configuration",
    items: [
      { label: "Settings", href: "/settings", Icon: GearIcon },
    ],
  },
];

/**
 * Flattened navigation items for backward compatibility.
 * Used by the mobile navigation.
 */
export const navItems: NavItem[] = navSections.flatMap((section) =>
  section.items.map((item, index) => ({
    ...item,
    section: index === 0 ? section.title : undefined,
  }))
);

/**
 * Get the primary navigation items for mobile bottom nav.
 * Limited to 5 items for space constraints.
 */
export const mobileNavItems: NavItem[] = [
  { label: "Overview", href: "/overview", Icon: GridIcon },
  { label: "EC2", href: "/ec2", Icon: ServerIcon },
  { label: "S3", href: "/s3", Icon: BucketIcon },
  { label: "Security", href: "/security", Icon: ShieldIcon },
  { label: "Settings", href: "/settings", Icon: GearIcon },
];
