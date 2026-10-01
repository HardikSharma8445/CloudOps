/**
 * AWS Region information and utilities
 */

export type AwsRegion = {
  code: string;
  name: string;
  shortName: string;
};

/**
 * All commonly used AWS regions
 */
export const AWS_REGIONS: AwsRegion[] = [
  { code: "us-east-1", name: "US East (N. Virginia)", shortName: "N. Virginia" },
  { code: "us-east-2", name: "US East (Ohio)", shortName: "Ohio" },
  { code: "us-west-1", name: "US West (N. California)", shortName: "N. California" },
  { code: "us-west-2", name: "US West (Oregon)", shortName: "Oregon" },
  { code: "ap-south-1", name: "Asia Pacific (Mumbai)", shortName: "Mumbai" },
  { code: "ap-northeast-1", name: "Asia Pacific (Tokyo)", shortName: "Tokyo" },
  { code: "ap-northeast-2", name: "Asia Pacific (Seoul)", shortName: "Seoul" },
  { code: "ap-northeast-3", name: "Asia Pacific (Osaka)", shortName: "Osaka" },
  { code: "ap-southeast-1", name: "Asia Pacific (Singapore)", shortName: "Singapore" },
  { code: "ap-southeast-2", name: "Asia Pacific (Sydney)", shortName: "Sydney" },
  { code: "eu-west-1", name: "Europe (Ireland)", shortName: "Ireland" },
  { code: "eu-west-2", name: "Europe (London)", shortName: "London" },
  { code: "eu-west-3", name: "Europe (Paris)", shortName: "Paris" },
  { code: "eu-central-1", name: "Europe (Frankfurt)", shortName: "Frankfurt" },
  { code: "eu-north-1", name: "Europe (Stockholm)", shortName: "Stockholm" },
  { code: "sa-east-1", name: "South America (São Paulo)", shortName: "São Paulo" },
  { code: "ca-central-1", name: "Canada (Central)", shortName: "Canada" },
  { code: "me-south-1", name: "Middle East (Bahrain)", shortName: "Bahrain" },
  { code: "af-south-1", name: "Africa (Cape Town)", shortName: "Cape Town" },
];

/**
 * Get region info by code
 */
export function getRegionInfo(code: string): AwsRegion | undefined {
  return AWS_REGIONS.find((r) => r.code === code);
}

/**
 * Get region short name by code
 */
export function getRegionShortName(code: string): string {
  return getRegionInfo(code)?.shortName || code;
}

/**
 * Get region full name by code
 */
export function getRegionFullName(code: string): string {
  return getRegionInfo(code)?.name || code;
}

/**
 * Group regions by geographic area
 */
export const REGION_GROUPS = {
  "North America": ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "ca-central-1"],
  "Europe": ["eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-north-1"],
  "Asia Pacific": [
    "ap-south-1",
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-northeast-3",
    "ap-southeast-1",
    "ap-southeast-2",
  ],
  "South America": ["sa-east-1"],
  "Middle East & Africa": ["me-south-1", "af-south-1"],
};

/**
 * Get regions grouped by area for dropdown display
 */
export function getGroupedRegions(): { group: string; regions: AwsRegion[] }[] {
  return Object.entries(REGION_GROUPS).map(([group, codes]) => ({
    group,
    regions: codes.map((code) => getRegionInfo(code)!).filter(Boolean),
  }));
}
