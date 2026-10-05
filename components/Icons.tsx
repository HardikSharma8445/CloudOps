type IconProps = {
  className?: string;
};

const base = "h-4 w-4";

function Svg({
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? base}
    >
      {children}
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Svg>
  );
}

export function ServerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="6.5" rx="2" />
      <rect x="3" y="13.5" width="18" height="6.5" rx="2" />
      <path d="M7 7.25h.01M7 16.75h.01" />
    </Svg>
  );
}

export function DatabaseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path d="M4 5.5v13c0 1.66 3.58 3 8 3s8-1.34 8-3v-13" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </Svg>
  );
}

export function CubeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5l8 4.5v9l-8 4.5-8-4.5v-9z" />
      <path d="M4 7l8 4.5L20 7M12 11.5v9" />
    </Svg>
  );
}

export function BalancerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v5" />
      <path d="M5 21v-3.5a2 2 0 012-2h10a2 2 0 012 2V21" />
      <path d="M12 8v7.5" />
      <circle cx="12" cy="3" r="1.4" />
      <circle cx="5" cy="21" r="1.4" />
      <circle cx="19" cy="21" r="1.4" />
    </Svg>
  );
}

export function BucketIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6.5h16l-1.6 12a2 2 0 01-2 1.75H7.6a2 2 0 01-2-1.75z" />
      <path d="M8.5 6.5a3.5 3.5 0 017 0" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2.2" />
      <path d="M15 5.8A2.3 2.3 0 0012.7 3.5H5.8A2.3 2.3 0 003.5 5.8v6.9A2.3 2.3 0 005.8 15" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12.8l4.6 4.6L19.5 7" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.2A8.2 8.2 0 019.8 4a8.5 8.5 0 1010.2 10.2z" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 5.5l7 6.5-7 6.5" />
    </Svg>
  );
}

export function PulseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12.5h4l2.5-6 3.5 11 2.5-5h6.5" />
    </Svg>
  );
}

export function PowerOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5v6" />
      <path d="M17.8 7a8 8 0 11-11.6 0" />
    </Svg>
  );
}

export function StackIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l9 4.5-9 4.5L3 7.5z" />
      <path d="M3 12.5L12 17l9-4.5M3 17L12 21.5 21 17" />
    </Svg>
  );
}

export function NetworkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3.5" width="7" height="6" rx="1.6" />
      <rect x="14" y="14.5" width="7" height="6" rx="1.6" />
      <path d="M6.5 9.5v4a3 3 0 003 3h4.5" />
    </Svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </Svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11.2 3.5H4.5a1 1 0 00-1 1v6.7a2 2 0 00.59 1.42l7.3 7.3a2 2 0 002.82 0l5.9-5.9a2 2 0 000-2.82l-7.3-7.3a2 2 0 00-1.41-.59z" />
      <path d="M7.6 7.6h.01" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 11.5a8 8 0 10-2.6 6.4" />
      <path d="M20.5 4.5v5h-5" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.8l7.5 3v6c0 4.6-3.2 8.2-7.5 9.4-4.3-1.2-7.5-4.8-7.5-9.4v-6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </Svg>
  );
}

export function DriveIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="13.5" width="19" height="7" rx="2" />
      <path d="M5.5 13.5l2.4-8a2 2 0 011.9-1.4h4.4a2 2 0 011.9 1.4l2.4 8" />
      <path d="M6 17h.01M9 17h.01" />
    </Svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.4 3.8 5.5 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3z" />
    </Svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" />
      <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" />
    </Svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.11a1.7 1.7 0 00-2.9-1.2l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 003 15a2 2 0 010-4 1.7 1.7 0 001.28-2.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 0110 4.11V4a2 2 0 014 0v.11a1.7 1.7 0 002.9 1.2l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0021 11a2 2 0 010 4z" />
    </Svg>
  );
}

export function HeartbeatIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 12.5h2L11 10l2 5 1.5-2.5h2" />
    </Svg>
  );
}


export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5L2.5 19.5h19L12 2.5z" />
      <path d="M12 9.5v4M12 16h.01" />
    </Svg>
  );
}

export function DollarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5v11M15 9.5c0-1.4-1.3-2-3-2s-3 .6-3 2 1.3 2 3 2 3 .6 3 2-1.3 2-3 2" />
    </Svg>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Svg>
  );
}

export function BackupIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v12M12 15l-4-4M12 15l4-4" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </Svg>
  );
}

export function ComplianceIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 11l3 3 8-8" />
      <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
    </Svg>
  );
}

export function InventoryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </Svg>
  );
}

export function LambdaIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20l5.5-16h2l3.5 10 3.5-10h2L14 20h-2l-3.5-10L6 20H4z" />
    </Svg>
  );
}

export function VpcIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
      <path d="M8 9.5v5M16 9.5v5M9.5 8h5M9.5 16h5" />
    </Svg>
  );
}

export function CloudFrontIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-2.5 2.5-4 6-4 9s1.5 6.5 4 9" />
      <path d="M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9" />
      <path d="M3 12h18" />
    </Svg>
  );
}

export function Route53Icon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </Svg>
  );
}

export function EcrIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h4M7 12h10M7 16h6" />
    </Svg>
  );
}

export function IamIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      <path d="M15 5l2 2-2 2" />
    </Svg>
  );
}

export function BotIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 2v6" />
      <circle cx="8" cy="14" r="1.5" />
      <circle cx="16" cy="14" r="1.5" />
      <path d="M9 18h6" />
    </Svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </Svg>
  );
}

export function CommandIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M13 6l7 7-3 3-7-7v-2a3 3 0 013-1z" />
    </Svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 3v4a1 1 0 001 1h4" />
      <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
    </Svg>
  );
}

export function GroupIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="7" r="3" />
      <circle cx="15" cy="7" r="3" />
      <path d="M3 18c0-2.2 2-4 4.5-4h3c2.5 0 4.5 1.8 4.5 4" />
      <path d="M13.5 14h3c2.5 0 4.5 1.8 4.5 4" />
    </Svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5L2.5 19.5h19L12 2.5z" />
      <path d="M12 9.5v4M12 16h.01" />
    </Svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6l-12 12" />
    </Svg>
  );
}
