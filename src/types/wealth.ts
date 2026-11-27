export type RoleCategory =
  | 'Founder'
  | 'Co-Founder'
  | 'Executive / Builder'
  | 'Family / Heir';

export type RoleFilter = 'founders' | 'builders' | 'all';
export type IndexFilter = 'all' | 'sp500' | 'nasdaq100' | 'both';
export type CaptureBasis = 'netWorth' | 'directEquity';
export type GroupingMode = 'teams' | 'individuals';
export type SortKey =
  | 'wealthCreated'
  | 'multiplier'
  | 'employees'
  | 'netWorth'
  | 'rankDelta';

export interface CompanyAttribution {
  ticker: string;
  companyName: string;
  indices: ('S&P 500' | 'Nasdaq-100')[];
  inBoth: boolean;
  sector: string;
  subIndustry: string;
  headquarters: string;
  foundedYear: number | null;
  role: RoleCategory;
  roleDetail: string;
  coFounderDivisor: number;
  coFoundersNamed: string[];
  marketCapUsd: number;
  revenueUsd: number | null;
  employees: number | null;
  sharePriceUsd: number | null;
  personalShares: number | null;
  personalStakeUsd: number;
  ownershipPct: number;
  wealthCreatedForOthersUsd: number;
  coFounderSplitWealthUsd: number;
  coFounderSplitStakeUsd: number;
  wealthMultiplier: number;
  dataSources: string[];
  note: string | null;
}

export interface ExcludedHolding {
  companyName: string;
  ticker: string | null;
  estimatedValueUsd: number;
  reason: 'private_company' | 'non_index_public' | 'passive_investment';
  explanation: string;
}

export interface PersonEntry {
  uri: string;
  name: string;
  forbesRank: number;
  wealthRankFull: number;
  wealthRankSplit: number;
  rankDeltaFull: number;
  rankDeltaSplit: number;
  forbesNetWorthUsd: number;
  portraitUrl: string | null;
  portraitSource: 'forbes' | 'wikimedia' | null;
  country: string;
  city: string;
  sourceLabel: string;
  industries: string[];
  selfMade: boolean | null;
  selfMadeRank: number | null;
  philanthropyScore: number | null;
  bios: string[];
  abouts: string[];
  primaryRole: RoleCategory;
  isFounder: boolean;
  isBuilder: boolean;
  attributions: CompanyAttribution[];
  totalMarketCapAttributedUsd: number;
  totalPersonalStakeUsd: number;
  totalWealthCreatedFullUsd: number;
  totalWealthCreatedSplitUsd: number;
  aggregateMultiplierFull: number;
  aggregateMultiplierSplit: number;
  totalEmployees: number;
  totalRevenueUsd: number;
  excludedHoldings: ExcludedHolding[];
}

export interface DisplayEntry {
  id: string;
  isTeam: boolean;
  displayName: string;
  subtitle: string | null;
  leadPerson: PersonEntry;
  members: PersonEntry[];
  primaryRole: RoleCategory;
  isFounder: boolean;
  isBuilder: boolean;
  attributions: CompanyAttribution[];
  marketCapUsd: number;
  keptNetWorthUsd: number;
  keptDirectEquityUsd: number;
  wealthCreatedNetWorthUsd: number;
  wealthCreatedDirectEquityUsd: number;
  multiplierNetWorth: number;
  multiplierDirectEquity: number;
  teamWeightPct: number | null;
  teamMembersCount: number;
  totalEmployees: number;
  totalRevenueUsd: number;
  forbesRank: number;
  forbesNetWorthUsd: number;
  wealthRankNetWorth: number;
  wealthRankDirectEquity: number;
  rankDeltaNetWorth: number;
  rankDeltaDirectEquity: number;
  excludedHoldings: ExcludedHolding[];
}

export interface IndexSummary {
  sp500Count: number;
  nasdaq100Count: number;
  overlapCount: number;
  uniqueCompaniesCount: number;
  forbesBillionairesScanned: number;
  matchedPeopleCount: number;
  foundersCount: number;
  buildersCount: number;
  matchedCompaniesCount: number;
  totalUniqueMarketCapUsd: number;
  totalUniqueEmployees: number;
  generatedAt: string;
  forbesTimestamp: string | null;
}

export interface WealthIndexData {
  summary: IndexSummary;
  people: PersonEntry[];
}
