import { useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronRight, Users } from 'lucide-react';
import {
  formatCurrencyCompact,
  formatEmployees,
  formatMultiplier,
  formatPercent,
  getMultiplier,
  getRankDelta,
  getWealthCreated,
  getWealthRank,
  roleBadgeClasses,
} from '../utils/format';
import type { AttributionMode, PersonEntry } from '../types/wealth';

interface LeaderboardTableProps {
  people: PersonEntry[];
  attributionMode: AttributionMode;
  onSelectPerson: (person: PersonEntry) => void;
}

function PortraitAvatar({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return null;

  return (
    <img
      src={url}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-11 w-11 shrink-0 rounded-full border border-[#D4D4CE] object-cover bg-[#F8F7F4]"
    />
  );
}

function RankDeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span
        className="inline-flex items-center rounded-xs bg-[#0B7A5C]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#075942] tabular-nums"
        title={`Ranked ${delta} spots higher on Wealth Created than on Forbes Net Worth`}
      >
        ▲ +{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span
        className="inline-flex items-center rounded-xs bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#5C5C58] tabular-nums"
        title={`Ranked ${Math.abs(delta)} spots lower than Forbes Net Worth`}
      >
        ▼ {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-xs bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-[#787872]">
      —
    </span>
  );
}

export function LeaderboardTable({
  people,
  attributionMode,
  onSelectPerson,
}: LeaderboardTableProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? people : people.slice(0, 25);

  if (people.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-8">
          <ArrowUpDown className="mx-auto h-7 w-7 text-[#787872]" />
          <h4 className="mt-3 font-serif text-xl font-bold text-[#111111]">
            No Matching Builders Found
          </h4>
          <p className="mt-1.5 text-sm text-[#5C5C58]">
            Try clearing your search filter or switching to &ldquo;All Index Billionaires&rdquo;.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-[#E5E5E0] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="font-serif text-2xl font-bold tracking-tight text-[#111111]">
              The Counter-Forbes Leaderboard
            </h3>
            <p className="mt-0.5 text-xs text-[#5C5C58]">
              Click any row to inspect the full equity formula, company fundamentals, and ripple
              effects.
            </p>
          </div>
          <div className="text-xs text-[#5C5C58]">
            Rank delta compares <strong className="text-[#111111]">Wealth Created Rank</strong> vs.{' '}
            <strong className="text-[#111111]">Forbes Net Worth Rank</strong>
          </div>
        </div>

        {/* Desktop Editorial Table */}
        <div className="hidden overflow-x-auto rounded-sm border border-[#E5E5E0] lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-[#111111] bg-[#F8F7F4] text-[11px] font-semibold uppercase tracking-wider text-[#5C5C58]">
                <th className="py-3 pl-3 pr-2 w-24">Rank</th>
                <th className="py-3 px-2.5">Builder</th>
                <th className="py-3 px-2.5">Public Company(ies)</th>
                <th className="py-3 px-2.5 text-right">Wealth Created</th>
                <th className="py-3 px-2.5 text-right">Personal Stake</th>
                <th className="py-3 px-2.5 text-right">Multiplier</th>
                <th className="py-3 pl-2.5 pr-3 text-right">Direct Jobs</th>
                <th className="w-7 pr-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {visible.map((person, idx) => {
                const created = getWealthCreated(person, attributionMode);
                const stake =
                  attributionMode === 'full'
                    ? person.totalPersonalStakeUsd
                    : person.attributions.reduce((acc, a) => acc + a.coFounderSplitStakeUsd, 0);
                const total = Math.max(created + stake, 1);
                const othersPct = (created / total) * 100;
                const keptPct = 100 - othersPct;
                const mult = getMultiplier(person, attributionMode);
                const overallRank = getWealthRank(person, attributionMode);
                const rankDelta = getRankDelta(person, attributionMode);
                const primaryAttr = person.attributions[0];
                const avgOwnership =
                  primaryAttr && person.attributions.length === 1
                    ? formatPercent(primaryAttr.ownershipPct)
                    : `${person.attributions.length} stakes`;

                return (
                  <tr
                    key={person.uri}
                    onClick={() => onSelectPerson(person)}
                    className="group cursor-pointer transition-colors hover:bg-[#F8F7F4]"
                  >
                    {/* Rank + Forbes Delta */}
                    <td className="py-3.5 pl-4 pr-2 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#111111] tabular-nums w-6">
                          {idx + 1}
                        </span>
                        <RankDeltaBadge delta={rankDelta} />
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-[#787872] tabular-nums">
                        Forbes #{person.forbesRank} · All #{overallRank}
                      </div>
                    </td>

                    {/* Builder Name & Optional Forbes/Wikimedia Portrait */}
                    <td className="py-3.5 px-3 align-middle">
                      <div className="flex items-center gap-3">
                        <PortraitAvatar url={person.portraitUrl} name={person.name} />
                        <div className="min-w-0">
                          <div className="font-serif text-[15px] font-bold text-[#111111] group-hover:text-[#0B7A5C] transition-colors truncate">
                            {person.name}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClasses(
                                person.primaryRole,
                              )}`}
                            >
                              {person.primaryRole}
                            </span>
                            {person.country && (
                              <span className="text-[11px] text-[#5C5C58] truncate">
                                {person.country}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Public Company(ies) */}
                    <td className="py-3.5 px-3 align-middle">
                      <div className="space-y-1">
                        {person.attributions.slice(0, 2).map((a) => (
                          <div key={a.ticker} className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-medium text-[#111111]">
                              {a.companyName}
                            </span>
                            <span className="rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#111111]">
                              {a.ticker}
                            </span>
                            {a.inBoth ? (
                              <span className="rounded-sm bg-[#111111] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                                S&amp;P + NDX
                              </span>
                            ) : (
                              <span className="rounded-sm bg-neutral-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#5C5C58]">
                                {a.indices[0]}
                              </span>
                            )}
                          </div>
                        ))}
                        {person.attributions.length > 2 && (
                          <div className="text-[11px] text-[#5C5C58]">
                            +{person.attributions.length - 2} more attributed companies
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Wealth Created + Mini Proportional Bar */}
                    <td className="py-3.5 px-3 text-right align-middle">
                      <div className="font-mono text-base font-bold text-[#0B7A5C] tabular-nums">
                        {formatCurrencyCompact(created)}
                      </div>
                      <div className="ml-auto mt-1.5 flex h-1.5 w-32 overflow-hidden rounded-full bg-[#EAEAE4]">
                        <div
                          className="h-full bg-[#B45309]"
                          style={{ width: `${Math.max(keptPct, stake > 0 ? 2 : 0)}%` }}
                        />
                        <div className="h-full bg-[#0B7A5C]" style={{ width: `${othersPct}%` }} />
                      </div>
                    </td>

                    {/* Personal Stake */}
                    <td className="py-3.5 px-3 text-right align-middle">
                      <div className="font-mono text-sm font-semibold text-[#111111] tabular-nums">
                        {formatCurrencyCompact(stake)}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-[#5C5C58] tabular-nums">
                        {avgOwnership}
                      </div>
                    </td>

                    {/* Multiplier */}
                    <td className="py-3.5 px-3 text-right align-middle">
                      <span className="inline-flex items-center rounded-sm bg-[#0B7A5C]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#075942] tabular-nums">
                        {formatMultiplier(mult)}
                      </span>
                    </td>

                    {/* Direct Jobs */}
                    <td className="py-3.5 pl-3 pr-4 text-right align-middle font-mono text-sm text-[#111111] tabular-nums">
                      {formatEmployees(person.totalEmployees)}
                    </td>

                    <td className="pr-3 align-middle text-[#888882] group-hover:text-[#111111]">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Editorial Cards */}
        <div className="space-y-3 lg:hidden">
          {visible.map((person, idx) => {
            const created = getWealthCreated(person, attributionMode);
            const stake =
              attributionMode === 'full'
                ? person.totalPersonalStakeUsd
                : person.attributions.reduce((acc, a) => acc + a.coFounderSplitStakeUsd, 0);
            const mult = getMultiplier(person, attributionMode);
            const rankDelta = getRankDelta(person, attributionMode);

            return (
              <button
                key={person.uri}
                type="button"
                onClick={() => onSelectPerson(person)}
                className="block w-full rounded-sm border border-[#E5E5E0] bg-white p-4 text-left hover:border-[#111111] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-sm font-bold text-[#5C5C58] tabular-nums">
                      #{idx + 1}
                    </span>
                    <PortraitAvatar url={person.portraitUrl} name={person.name} />
                    <div className="min-w-0">
                      <div className="font-serif text-base font-bold text-[#111111] truncate">
                        {person.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${roleBadgeClasses(
                            person.primaryRole,
                          )}`}
                        >
                          {person.primaryRole}
                        </span>
                        <RankDeltaBadge delta={rankDelta} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-base font-bold text-[#0B7A5C] tabular-nums">
                      {formatCurrencyCompact(created)}
                    </div>
                    <div className="font-mono text-[11px] font-semibold text-[#075942]">
                      {formatMultiplier(mult)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EFEA] pt-2.5 text-xs text-[#5C5C58]">
                  <span className="font-medium text-[#111111]">
                    {person.attributions.map((a) => `${a.companyName} (${a.ticker})`).join(', ')}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
                    <span>Kept: {formatCurrencyCompact(stake)}</span>
                    {person.totalEmployees > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatEmployees(person.totalEmployees)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Show All / Collapse Control */}
        {people.length > 25 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-sm border border-[#111111] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#111111] hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
            >
              {showAll ? (
                <>Show Top 25 Only</>
              ) : (
                <>
                  Show All {people.length} Builders
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
