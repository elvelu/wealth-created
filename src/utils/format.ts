import type { AttributionMode, PersonEntry, RoleCategory } from '../types/wealth';

export function formatCurrencyCompact(value: number | null | undefined, decimals = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) {
    return `${sign}$${(abs / 1e12).toFixed(decimals)}T`;
  }
  if (abs >= 1e9) {
    const d = abs >= 100e9 ? 1 : decimals === 2 ? 1 : decimals;
    return `${sign}$${(abs / 1e9).toFixed(d)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  }
  if (abs >= 1e3) {
    return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatEmployees(count: number | null | undefined): string {
  if (count == null || !Number.isFinite(count) || count <= 0) return '—';
  if (count >= 1e6) return `${(count / 1e6).toFixed(2)}M`;
  if (count >= 1e3) return `${Math.round(count / 1e3).toLocaleString()}K`;
  return count.toLocaleString();
}

export function formatNumber(count: number | null | undefined): string {
  if (count == null || !Number.isFinite(count)) return '—';
  return Math.round(count).toLocaleString();
}

export function formatMultiplier(mult: number | null | undefined): string {
  if (mult == null || !Number.isFinite(mult) || mult <= 0) return '—';
  if (mult >= 100) return `${Math.round(mult).toLocaleString()}×`;
  if (mult >= 10) return `${mult.toFixed(1)}×`;
  return `${mult.toFixed(1)}×`;
}

export function formatPercent(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return '—';
  if (pct < 0.1 && pct > 0) return `${pct.toFixed(2)}%`;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(1)}%`;
}

export function getWealthCreated(person: PersonEntry, mode: AttributionMode): number {
  return mode === 'full' ? person.totalWealthCreatedFullUsd : person.totalWealthCreatedSplitUsd;
}

export function getMultiplier(person: PersonEntry, mode: AttributionMode): number {
  return mode === 'full' ? person.aggregateMultiplierFull : person.aggregateMultiplierSplit;
}

export function getWealthRank(person: PersonEntry, mode: AttributionMode): number {
  return mode === 'full' ? person.wealthRankFull : person.wealthRankSplit;
}

export function getRankDelta(person: PersonEntry, mode: AttributionMode): number {
  return mode === 'full' ? person.rankDeltaFull : person.rankDeltaSplit;
}

export function roleBadgeClasses(role: RoleCategory): string {
  switch (role) {
    case 'Founder':
      return 'bg-[#0B7A5C]/10 text-[#075942] border-[#0B7A5C]/25';
    case 'Co-Founder':
      return 'bg-[#0B7A5C]/10 text-[#075942] border-[#0B7A5C]/25';
    case 'Executive / Builder':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'Family / Heir':
      return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

export function formatSnapshotDate(isoString: string | null | undefined): string {
  if (!isoString) return 'Live Market Snapshot';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Live Market Snapshot';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
