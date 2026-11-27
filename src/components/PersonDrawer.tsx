import { useEffect, useState } from 'react';
import {
  X,
  Users,
  Building2,
  TrendingUp,
  ShoppingBag,
  Info,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import {
  formatCurrencyCompact,
  formatMultiplier,
  formatNumber,
  formatPercent,
  getMultiplier,
  getRankDelta,
  getWealthCreated,
  getWealthRank,
  roleBadgeClasses,
} from '../utils/format';
import type { AttributionMode, PersonEntry } from '../types/wealth';

interface PersonDrawerProps {
  person: PersonEntry | null;
  attributionMode: AttributionMode;
  onClose: () => void;
}

export function PersonDrawer({ person, attributionMode, onClose }: PersonDrawerProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [person?.uri]);

  useEffect(() => {
    if (!person) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [person, onClose]);

  if (!person) return null;

  const created = getWealthCreated(person, attributionMode);
  const stake =
    attributionMode === 'full'
      ? person.totalPersonalStakeUsd
      : person.attributions.reduce((acc, a) => acc + a.coFounderSplitStakeUsd, 0);
  const total = Math.max(created + stake, 1);
  const othersPct = (created / total) * 100;
  const keptPct = 100 - othersPct;
  const mult = getMultiplier(person, attributionMode);
  const wealthRank = getWealthRank(person, attributionMode);
  const rankDelta = getRankDelta(person, attributionMode);

  // Illustrative annual direct payroll ripple (~$85K conservative global blended compensation)
  const illustrativeAnnualPayroll = person.totalEmployees * 85_000;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]" onClick={onClose}>
      <aside
        className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl border-l border-[#111111]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${person.name} Wealth Created Profile`}
      >
        {/* Top Sticky Header Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E5E0] bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0B7A5C]">
            <span>Builder Profile</span>
            <span className="text-[#D4D4CE]">/</span>
            <span className="text-[#5C5C58]">
              {attributionMode === 'split' ? 'Co-Founder Split' : 'Full Company'}
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
            {person.portraitUrl && !imgFailed && (
              <img
                src={person.portraitUrl}
                alt={person.name}
                onError={() => setImgFailed(true)}
                className="h-24 w-24 shrink-0 rounded-sm border border-[#D4D4CE] object-cover bg-[#F8F7F4]"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleBadgeClasses(
                    person.primaryRole,
                  )}`}
                >
                  {person.primaryRole}
                </span>
                {person.country && (
                  <span className="text-xs text-[#5C5C58]">
                    {person.city ? `${person.city}, ` : ''}
                    {person.country}
                  </span>
                )}
              </div>

              <h2 className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-[#111111]">
                {person.name}
              </h2>
              <p className="mt-1 text-xs text-[#5C5C58]">
                Forbes Primary Source: <strong className="text-[#111111]">{person.sourceLabel}</strong>
                {person.portraitSource === 'wikimedia' && ' · Portrait via Wikimedia Commons'}
                {person.portraitSource === 'forbes' && ' · Portrait via Forbes'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={`https://www.forbes.com/profile/${person.uri}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#0B7A5C] hover:underline"
                >
                  View Forbes Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Rank Comparison Strip */}
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
                Personal Stake
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-[#111111] tabular-nums">
                {formatCurrencyCompact(stake)}
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
                vs Forbes #{person.forbesRank}
              </div>
            </div>

            <div className="rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5C5C58]">
                Forbes Rank
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-[#111111] tabular-nums">
                #{person.forbesRank}
              </div>
              <div className="font-mono text-[10px] text-[#5C5C58]">
                NW {formatCurrencyCompact(person.forbesNetWorthUsd)}
              </div>
            </div>
          </div>

          {/* Proportional Split Bar */}
          <div className="rounded-sm border border-[#E5E5E0] p-4">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#B45309]">
                Kept: {formatPercent(keptPct)} ({formatCurrencyCompact(stake)})
              </span>
              <span className="font-semibold text-[#0B7A5C]">
                Created for Others: {formatPercent(othersPct)} ({formatMultiplier(mult)})
              </span>
            </div>
            <div className="mt-2 flex h-4 w-full overflow-hidden rounded-xs bg-[#EAEAE4]">
              <div
                className="h-full bg-[#B45309]"
                style={{ width: `${Math.max(keptPct, stake > 0 ? 2 : 0)}%` }}
              />
              <div className="h-full bg-[#0B7A5C]" style={{ width: `${othersPct}%` }} />
            </div>
          </div>

          {/* Attributed Company Math Breakdowns */}
          <div>
            <h3 className="font-serif text-lg font-bold text-[#111111]">
              Public Company Attribution &amp; Math
            </h3>
            <div className="mt-3 space-y-4">
              {person.attributions.map((attr) => {
                const attrCreated =
                  attributionMode === 'full'
                    ? attr.wealthCreatedForOthersUsd
                    : attr.coFounderSplitWealthUsd;
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
                          {attr.roleDetail} · {attr.sector}
                          {attr.foundedYear ? ` · Founded ${attr.foundedYear}` : ''}
                        </div>
                      </div>
                      <span className="rounded-sm bg-[#0B7A5C]/10 px-2 py-1 font-mono text-xs font-bold text-[#075942]">
                        {formatMultiplier(attr.wealthMultiplier)} multiplier
                      </span>
                    </div>

                    {/* Equation Breakdown */}
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-sm border border-[#E5E5E0] bg-white p-3 text-center font-mono">
                      <div>
                        <div className="font-sans text-[10px] font-semibold uppercase text-[#5C5C58]">
                          Market Cap
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-[#111111] tabular-nums">
                          {formatCurrencyCompact(attr.marketCapUsd)}
                        </div>
                      </div>
                      <div className="border-x border-[#E5E5E0]">
                        <div className="font-sans text-[10px] font-semibold uppercase text-[#B45309]">
                          − Personal Stake ({formatPercent(attr.ownershipPct)})
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-[#B45309] tabular-nums">
                          {formatCurrencyCompact(attr.personalStakeUsd)}
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

                    {/* Fundamentals row */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#5C5C58]">
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
                      {attr.personalShares && (
                        <span>
                          Shares Held:{' '}
                          <strong className="font-mono text-[#111111]">
                            {(attr.personalShares / 1e6).toFixed(1)}M
                          </strong>
                        </span>
                      )}
                    </div>

                    {attributionMode === 'split' && attr.coFounderDivisor > 1 && (
                      <div className="mt-2.5 flex items-start gap-1.5 rounded-sm bg-white px-2.5 py-2 text-[11px] text-[#5C5C58] border border-[#E5E5E0]">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B7A5C]" />
                        <span>
                          Co-Founder Split divides total outside equity equally across{' '}
                          <strong>{attr.coFounderDivisor}</strong> co-founders (
                          {attr.coFoundersNamed.join(', ')}).
                        </span>
                      </div>
                    )}

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
              Ecosystem Impact Around {person.attributions[0]?.companyName}
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
                  {person.totalEmployees > 0
                    ? `${formatNumber(person.totalEmployees)} jobs`
                    : 'Public headcount N/A'}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5C5C58]">
                  {person.totalEmployees > 0
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
                  {person.totalRevenueUsd > 0
                    ? `${formatCurrencyCompact(person.totalRevenueUsd)} / yr`
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
          {(person.bios.length > 0 || person.abouts.length > 0) && (
            <div>
              <h4 className="font-serif text-base font-bold text-[#111111]">
                Forbes Biography Highlights
              </h4>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#3F3F3C]">
                {[...person.bios, ...person.abouts].slice(0, 4).map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#0B7A5C]">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Excluded Holdings Transparency Box */}
          {person.excludedHoldings.length > 0 && (
            <div className="rounded-sm border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900">
                <AlertCircle className="h-4 w-4" />
                Excluded Holdings (Not Counted Above)
              </div>
              <p className="mt-1 text-xs text-amber-900/80">
                To preserve attribution integrity, passive investments, M&amp;A share rollovers, and
                non-index holdings are excluded from the Wealth Created total:
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {person.excludedHoldings.map((ex, i) => (
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
