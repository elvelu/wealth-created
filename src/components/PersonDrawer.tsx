import { useEffect, useState } from 'react';
import {
  X,
  Users,
  Building2,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
  AlertCircle,
  Scale,
} from 'lucide-react';
import {
  formatCurrencyCompact,
  formatMultiplier,
  formatNumber,
  formatPercent,
  getEntryKept,
  getEntryMultiplier,
  getEntryRank,
  getEntryRankDelta,
  getEntryWealthCreated,
  roleBadgeClasses,
} from '../utils/format';
import type { CaptureBasis, DisplayEntry, GroupingMode, PersonEntry } from '../types/wealth';

interface PersonDrawerProps {
  entry: DisplayEntry | null;
  captureBasis: CaptureBasis;
  groupingMode: GroupingMode;
  onClose: () => void;
}

function DrawerPortrait({ person, large = false }: { person: PersonEntry; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [person.uri]);
  if (!person.portraitUrl || failed) return null;

  return (
    <img
      src={person.portraitUrl}
      alt={person.name}
      onError={() => setFailed(true)}
      className={
        large
          ? 'h-20 w-20 shrink-0 rounded-sm border border-[#D4D4CE] object-cover bg-[#F8F7F4]'
          : 'h-10 w-10 shrink-0 rounded-full border border-[#D4D4CE] object-cover bg-[#F8F7F4]'
      }
    />
  );
}

export function PersonDrawer({
  entry,
  captureBasis,
  groupingMode,
  onClose,
}: PersonDrawerProps) {
  useEffect(() => {
    if (!entry) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [entry, onClose]);

  if (!entry) return null;

  const lead = entry.leadPerson;
  const created = getEntryWealthCreated(entry, captureBasis);
  const kept = getEntryKept(entry, captureBasis);
  const total = Math.max(created + kept, 1);
  const othersPct = (created / total) * 100;
  const keptPct = 100 - othersPct;
  const mult = getEntryMultiplier(entry, captureBasis);
  const wealthRank = getEntryRank(entry, captureBasis);
  const rankDelta = getEntryRankDelta(entry, captureBasis);
  const isNetWorthBasis = captureBasis === 'netWorth';

  // Illustrative annual direct payroll ripple (~$85K conservative global blended compensation)
  const illustrativeAnnualPayroll = entry.totalEmployees * 85_000;
  const totalTeamNw = entry.members.reduce((acc, m) => acc + m.forbesNetWorthUsd, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <aside
        className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl border-l border-[#111111]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.displayName} Wealth Created Profile`}
      >
        {/* Top Sticky Header Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E5E0] bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0B7A5C]">
            <span>{entry.isTeam ? 'Founding Team Profile' : 'Builder Profile'}</span>
            <span className="text-[#D4D4CE]">/</span>
            <span className="text-[#5C5C58]">
              {isNetWorthBasis ? 'Total Net Worth Basis' : 'Direct Equity Basis'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-[#E5E5E0] p-1.5 text-[#5C5C58] hover:border-[#111111] hover:text-[#111111] transition-colors cursor-pointer"
            aria-label="Close profile drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-7 p-6">
          {/* Identity Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 -space-x-2">
              {entry.members.slice(0, 3).map((m) => (
                <DrawerPortrait key={m.uri} person={m} large />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleBadgeClasses(
                    entry.primaryRole,
                  )}`}
                >
                  {entry.isTeam ? `Founding Team · ${entry.teamMembersCount}` : entry.primaryRole}
                </span>
                {lead.country && (
                  <span className="text-xs text-[#5C5C58]">
                    {lead.city ? `${lead.city}, ` : ''}
                    {lead.country}
                  </span>
                )}
              </div>

              <h2 className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-[#111111]">
                {entry.displayName}
              </h2>
              {entry.subtitle && (
                <p className="mt-0.5 text-xs font-medium text-[#5C5C58]">{entry.subtitle}</p>
              )}
              <p className="mt-1 text-xs text-[#5C5C58]">
                Forbes Primary Source: <strong className="text-[#111111]">{lead.sourceLabel}</strong>
                {!entry.isTeam && lead.portraitSource === 'wikimedia' && ' · Portrait via Wikimedia Commons'}
                {!entry.isTeam && lead.portraitSource === 'forbes' && ' · Portrait via Forbes'}
              </p>

              {!entry.isTeam && (
                <div className="mt-2.5">
                  <a
                    href={`https://www.forbes.com/profile/${lead.uri}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0B7A5C] hover:underline"
                  >
                    View Forbes Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Primary KPI Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-sm border border-[#0B7A5C]/30 bg-[#0B7A5C]/5 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#075942]">
                Wealth Created
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-[#0B7A5C] tabular-nums">
                {formatCurrencyCompact(created)}
              </div>
            </div>

            <div className="rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#B45309]">
                {isNetWorthBasis ? 'Net Worth Kept' : 'Direct Stake'}
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-[#111111] tabular-nums">
                {formatCurrencyCompact(kept)}
              </div>
            </div>

            <div className="rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5C5C58]">
                All-Index Rank
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 font-mono text-xl font-bold text-[#111111] tabular-nums">
                #{wealthRank}
                <span className="text-[11px] font-medium text-[#0B7A5C]">
                  {rankDelta > 0 ? `▲+${rankDelta}` : rankDelta < 0 ? `▼${rankDelta}` : '—'}
                </span>
              </div>
              <div className="font-mono text-[10px] text-[#5C5C58]">
                vs Forbes #{entry.forbesRank}
              </div>
            </div>

            <div className="rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5C5C58]">
                Multiplier
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-[#075942] tabular-nums">
                {formatMultiplier(mult)}
              </div>
              <div className="font-mono text-[10px] text-[#5C5C58]">per $1 kept</div>
            </div>
          </div>

          {/* Methodology Comparison Strip (Total Net Worth vs Direct Equity) */}
          <div className="rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#111111]">
              <Scale className="h-3.5 w-3.5 text-[#0B7A5C]" />
              Methodology Comparison (Why Both Numbers Matter)
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div
                className={`rounded-sm border p-3 ${
                  isNetWorthBasis
                    ? 'border-[#0B7A5C] bg-white'
                    : 'border-[#E5E5E0] bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#075942]">
                  <span>Total Net Worth Basis</span>
                  {isNetWorthBasis && <span className="font-mono text-[10px]">ACTIVE</span>}
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="text-base font-bold text-[#0B7A5C]">
                    {formatCurrencyCompact(entry.wealthCreatedNetWorthUsd)}
                  </span>
                  <span className="text-xs font-semibold text-[#111111]">
                    {formatMultiplier(entry.multiplierNetWorth)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[#5C5C58]">
                  Subtracts full Forbes net worth ({formatCurrencyCompact(entry.keptNetWorthUsd)}),
                  capturing diversified proceeds from past stock sales.
                </div>
              </div>

              <div
                className={`rounded-sm border p-3 ${
                  !isNetWorthBasis
                    ? 'border-[#0B7A5C] bg-white'
                    : 'border-[#E5E5E0] bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#5C5C58]">
                  <span>Direct Equity Basis</span>
                  {!isNetWorthBasis && (
                    <span className="font-mono text-[10px] text-[#0B7A5C]">ACTIVE</span>
                  )}
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="text-base font-bold text-[#111111]">
                    {formatCurrencyCompact(entry.wealthCreatedDirectEquityUsd)}
                  </span>
                  <span className="text-xs font-semibold text-[#111111]">
                    {formatMultiplier(entry.multiplierDirectEquity)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[#5C5C58]">
                  Subtracts only remaining direct shares ({formatCurrencyCompact(entry.keptDirectEquityUsd)})
                  currently held in the attributed company.
                </div>
              </div>
            </div>
          </div>

          {/* Founding Team Roster (when grouped as a team) */}
          {entry.isTeam && (
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Founding Team Roster ({entry.teamMembersCount} Forbes-Listed Co-Founders)
              </h3>
              <p className="mt-1 text-xs text-[#5C5C58]">
                Pooling the team prevents minor co-founder stakes from artificially inflating
                multipliers and avoids counting the same company market cap multiple times.
              </p>
              <div className="mt-3 divide-y divide-[#E5E5E0] rounded-sm border border-[#E5E5E0] bg-white">
                {entry.members.map((m, idx) => {
                  const sharePct =
                    totalTeamNw > 0 ? (m.forbesNetWorthUsd / totalTeamNw) * 100 : 0;
                  return (
                    <div
                      key={m.uri}
                      className="flex flex-wrap items-center justify-between gap-3 p-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <DrawerPortrait person={m} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-sm font-bold text-[#111111]">
                              {m.name}
                            </span>
                            {idx === 0 && (
                              <span className="rounded-sm bg-[#111111] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                                Lead
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#5C5C58]">
                            {m.attributions[0]?.roleDetail} · Forbes #{m.forbesRank}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right font-mono text-xs tabular-nums">
                        <div>
                          <div className="text-[10px] font-sans uppercase text-[#5C5C58]">
                            Net Worth
                          </div>
                          <div className="font-semibold text-[#111111]">
                            {formatCurrencyCompact(m.forbesNetWorthUsd)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-sans uppercase text-[#5C5C58]">
                            Direct Stock
                          </div>
                          <div className="text-[#5C5C58]">
                            {formatCurrencyCompact(m.totalPersonalStakeUsd)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-sans uppercase text-[#5C5C58]">
                            Team Share
                          </div>
                          <div className="font-semibold text-[#0B7A5C]">
                            {formatPercent(sharePct)}
                          </div>
                        </div>
                        <a
                          href={`https://www.forbes.com/profile/${m.uri}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0B7A5C] hover:text-[#075942]"
                          aria-label={`${m.name} Forbes profile`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Proportional Split Bar */}
          <div className="rounded-sm border border-[#E5E5E0] p-4">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#B45309]">
                Kept: {formatPercent(keptPct)} ({formatCurrencyCompact(kept)})
              </span>
              <span className="font-semibold text-[#0B7A5C]">
                Created for Others: {formatPercent(othersPct)} ({formatMultiplier(mult)})
              </span>
            </div>
            <div className="mt-2 flex h-4 w-full overflow-hidden rounded-xs bg-[#EAEAE4]">
              <div
                className="h-full bg-[#B45309]"
                style={{ width: `${Math.max(keptPct, kept > 0 ? 2 : 0)}%` }}
              />
              <div className="h-full bg-[#0B7A5C]" style={{ width: `${othersPct}%` }} />
            </div>
          </div>

          {/* Attributed Company Math Breakdowns */}
          <div>
            <h3 className="font-serif text-lg font-bold text-[#111111]">
              Public Company Attribution &amp; Fundamentals
            </h3>
            {groupingMode === 'individuals' && entry.teamWeightPct != null && (
              <p className="mt-1 text-xs text-[#5C5C58]">
                In Individuals mode, {entry.displayName}&apos;s attributed slice reflects their{' '}
                <strong className="text-[#111111]">{formatPercent(entry.teamWeightPct)}</strong>{' '}
                net-worth share of the {entry.teamMembersCount}-founder team.
              </p>
            )}
            <div className="mt-3 space-y-4">
              {entry.attributions.map((attr) => {
                const attrMarketCap =
                  groupingMode === 'individuals' && entry.teamWeightPct != null
                    ? entry.marketCapUsd
                    : attr.marketCapUsd;
                const attrKept = isNetWorthBasis
                  ? Math.min(kept, attrMarketCap)
                  : Math.min(attr.personalStakeUsd, attrMarketCap);
                const attrCreated =
                  entry.attributions.length === 1
                    ? created
                    : Math.max(0, attrMarketCap - attrKept);

                return (
                  <div
                    key={attr.ticker}
                    className="rounded-sm border border-[#E5E5E0] bg-[#F8F7F4]/70 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-serif text-lg font-bold text-[#111111]">
                            {attr.companyName}
                          </span>
                          <span className="rounded-sm border border-[#D4D4CE] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#111111]">
                            {attr.ticker}
                          </span>
                          {attr.indices.map((idxName) => (
                            <span
                              key={idxName}
                              className="rounded-sm bg-[#111111] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                            >
                              {idxName}
                            </span>
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-[#5C5C58]">
                          {attr.sector}
                          {attr.foundedYear ? ` · Founded ${attr.foundedYear}` : ''}
                          {attr.headquarters ? ` · ${attr.headquarters}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Equation Breakdown */}
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-sm border border-[#E5E5E0] bg-white p-3 text-center font-mono">
                      <div>
                        <div className="font-sans text-[10px] font-semibold uppercase text-[#5C5C58]">
                          {groupingMode === 'individuals' && entry.teamWeightPct != null
                            ? `Attributed Cap (${formatPercent(entry.teamWeightPct)})`
                            : 'Market Cap'}
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-[#111111] tabular-nums">
                          {formatCurrencyCompact(attrMarketCap)}
                        </div>
                      </div>
                      <div className="border-x border-[#E5E5E0]">
                        <div className="font-sans text-[10px] font-semibold uppercase text-[#B45309]">
                          − {isNetWorthBasis ? 'Net Worth Kept' : `Direct Stake (${formatPercent(attr.ownershipPct)})`}
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-[#B45309] tabular-nums">
                          {formatCurrencyCompact(attrKept)}
                        </div>
                      </div>
                      <div>
                        <div className="font-sans text-[10px] font-semibold uppercase text-[#0B7A5C]">
                          = For Others
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-[#0B7A5C] tabular-nums">
                          {formatCurrencyCompact(attrCreated)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#5C5C58]">
                      <span>
                        Full Co. Cap:{' '}
                        <strong className="font-mono text-[#111111]">
                          {formatCurrencyCompact(attr.marketCapUsd)}
                        </strong>
                      </span>
                      <span>
                        Employees:{' '}
                        <strong className="font-mono text-[#111111]">
                          {formatNumber(attr.employees)}
                        </strong>
                      </span>
                      <span>
                        Annual Revenue:{' '}
                        <strong className="font-mono text-[#111111]">
                          {formatCurrencyCompact(attr.revenueUsd)}
                        </strong>
                      </span>
                      <span>
                        Direct Insider Stake:{' '}
                        <strong className="font-mono text-[#111111]">
                          {formatCurrencyCompact(attr.personalStakeUsd)} ({formatPercent(attr.ownershipPct)})
                        </strong>
                      </span>
                    </div>

                    {attr.note && (
                      <p className="mt-2.5 text-xs leading-relaxed text-[#5C5C58] italic">
                        Note: {attr.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personalized Incremental Wealth Ripple Effects */}
          <div className="rounded-sm border border-[#0B7A5C]/30 bg-[#F8F7F4] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0B7A5C]">
              Beyond Market Cap · Incremental Ripple Effects
            </div>
            <h4 className="mt-1 font-serif text-lg font-bold text-[#111111]">
              Ecosystem Impact Around {entry.attributions[0]?.companyName}
            </h4>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-sm border border-[#E5E5E0] bg-white p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0B7A5C]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  1. Outside Shareholders (Measured)
                </div>
                <div className="mt-1 font-mono text-base font-bold text-[#111111]">
                  {formatCurrencyCompact(created)}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5C5C58]">
                  Compounding wealth held by pension funds, 401(k) plans, index funds, employees,
                  and individual investors.
                </p>
              </div>

              <div className="rounded-sm border border-[#E5E5E0] bg-white p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0B7A5C]">
                  <Users className="h-3.5 w-3.5" />
                  2. Direct Workforce (Measured)
                </div>
                <div className="mt-1 font-mono text-base font-bold text-[#111111]">
                  {entry.totalEmployees > 0
                    ? `${formatNumber(entry.totalEmployees)} jobs`
                    : 'Public headcount N/A'}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5C5C58]">
                  {entry.totalEmployees > 0
                    ? `Jobs that would not exist otherwise — representing ~${formatCurrencyCompact(
                        illustrativeAnnualPayroll,
                      )}/yr in illustrative payroll ripple (at $85K avg comp).`
                    : 'Direct jobs created across global operations and engineering.'}
                </p>
              </div>

              <div className="rounded-sm border border-[#E5E5E0] bg-white p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                  <Building2 className="h-3.5 w-3.5 text-[#0B7A5C]" />
                  3. Annual Economic Output (Measured)
                </div>
                <div className="mt-1 font-mono text-base font-bold text-[#111111]">
                  {entry.totalRevenueUsd > 0
                    ? `${formatCurrencyCompact(entry.totalRevenueUsd)} / yr`
                    : '—'}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5C5C58]">
                  Annual revenue cycling through suppliers, infrastructure vendors, partners, and
                  R&amp;D ecosystems.
                </p>
              </div>

              <div className="rounded-sm border border-[#E5E5E0] bg-white p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309]">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  4. Consumer &amp; Ecosystem Surplus
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-[#111111]">
                  Unmeasured Floor
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5C5C58]">
                  Lower prices, time saved, third-party seller income, and software/developer
                  economies built atop the platform.
                </p>
              </div>
            </div>
          </div>

          {/* Forbes Bio / Background */}
          {(lead.bios.length > 0 || lead.abouts.length > 0) && (
            <div>
              <h4 className="font-serif text-base font-bold text-[#111111]">
                Forbes Biography Highlights ({lead.name})
              </h4>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#3F3F3C]">
                {[...lead.bios, ...lead.abouts].slice(0, 4).map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#0B7A5C]">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Excluded Holdings Transparency Box */}
          {entry.excludedHoldings.length > 0 && (
            <div className="rounded-sm border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900">
                <AlertCircle className="h-4 w-4" />
                Excluded Holdings (Not Added to Company Market Cap)
              </div>
              <p className="mt-1 text-xs text-amber-900/80">
                Passive investments, M&amp;A share rollovers, and non-index holdings are excluded
                from the numerator (attributed market cap). In <strong>Total Net Worth</strong>{' '}
                mode, diversified personal holdings remain reflected inside Net Worth Kept so selling
                founder stock never inflates the multiplier:
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {entry.excludedHoldings.map((ex, i) => (
                  <li
                    key={`${ex.companyName}-${i}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#111111] border-t border-amber-200/70 pt-1.5"
                  >
                    <div>
                      <strong>{ex.companyName}</strong>
                      {ex.ticker && (
                        <span className="ml-1.5 font-mono text-[10px] text-[#5C5C58]">
                          ({ex.ticker})
                        </span>
                      )}
                      <div className="text-[11px] text-[#5C5C58]">{ex.explanation}</div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-amber-900">
                      {formatCurrencyCompact(ex.estimatedValueUsd)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
