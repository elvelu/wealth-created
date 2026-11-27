import { ArrowUpRight, Users } from 'lucide-react';
import {
  formatCurrencyCompact,
  formatEmployees,
  formatMultiplier,
  getMultiplier,
  getWealthCreated,
  roleBadgeClasses,
} from '../utils/format';
import type { AttributionMode, PersonEntry } from '../types/wealth';

interface TopBuildersVisualProps {
  people: PersonEntry[];
  attributionMode: AttributionMode;
  onSelectPerson: (person: PersonEntry) => void;
}

export function TopBuildersVisual({
  people,
  attributionMode,
  onSelectPerson,
}: TopBuildersVisualProps) {
  const top = people.slice(0, 8);
  if (top.length === 0) return null;

  const maxTotal = Math.max(
    ...top.map((p) => {
      const created = getWealthCreated(p, attributionMode);
      const stake =
        attributionMode === 'full'
          ? p.totalPersonalStakeUsd
          : p.attributions.reduce((acc, a) => acc + a.coFounderSplitStakeUsd, 0);
      return created + stake;
    }),
    1,
  );

  return (
    <section className="border-b border-[#E5E5E0] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B7A5C]">
              Visual Comparison · Top {top.length} in Current View
            </div>
            <h3 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#111111]">
              Personal Stake Kept vs. Public Wealth Created
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#5C5C58]">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-xs bg-[#B45309]" />
              Personal Stake Kept
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-xs bg-[#0B7A5C]" />
              Public Wealth Created for Others
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {top.map((person, index) => {
            const created = getWealthCreated(person, attributionMode);
            const stake =
              attributionMode === 'full'
                ? person.totalPersonalStakeUsd
                : person.attributions.reduce((acc, a) => acc + a.coFounderSplitStakeUsd, 0);
            const total = Math.max(created + stake, 1);
            const barWidthPct = Math.max((total / maxTotal) * 100, 3);
            const keptSharePct = (stake / total) * 100;
            const othersSharePct = 100 - keptSharePct;
            const mult = getMultiplier(person, attributionMode);
            const tickers = person.attributions.map((a) => a.ticker).join(', ');

            return (
              <button
                key={person.uri}
                type="button"
                onClick={() => onSelectPerson(person)}
                className="group block w-full rounded-sm border border-[#E5E5E0] bg-[#F8F7F4]/60 p-3 text-left transition-all hover:border-[#111111] hover:bg-white cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[#5C5C58] w-5 tabular-nums">
                      {index + 1}.
                    </span>
                    <span className="font-serif text-base font-bold text-[#111111] group-hover:text-[#0B7A5C] transition-colors truncate">
                      {person.name}
                    </span>
                    <span
                      className={`hidden sm:inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClasses(
                        person.primaryRole,
                      )}`}
                    >
                      {person.primaryRole}
                    </span>
                    <span className="font-mono text-[11px] font-medium text-[#5C5C58] bg-white border border-[#E5E5E0] rounded-sm px-1.5 py-0.5">
                      {tickers}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs tabular-nums">
                    {person.totalEmployees > 0 && (
                      <span className="hidden md:inline-flex items-center gap-1 text-[#5C5C58]">
                        <Users className="h-3 w-3" />
                        {formatEmployees(person.totalEmployees)} jobs
                      </span>
                    )}
                    <span className="rounded-sm bg-[#0B7A5C]/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#075942]">
                      {formatMultiplier(mult)}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#0B7A5C]">
                      {formatCurrencyCompact(created)}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#888882] group-hover:text-[#111111]" />
                  </div>
                </div>

                {/* Stacked Proportional Bar */}
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="h-3.5 flex-1 overflow-hidden rounded-xs bg-[#EAEAE4]">
                    <div
                      className="flex h-full overflow-hidden rounded-xs transition-all duration-500"
                      style={{ width: `${barWidthPct}%` }}
                    >
                      <div
                        className="h-full bg-[#B45309] shrink-0"
                        style={{ width: `${Math.max(keptSharePct, stake > 0 ? 1.5 : 0)}%` }}
                        title={`Personal stake kept: ${formatCurrencyCompact(stake)}`}
                      />
                      <div
                        className="h-full bg-[#0B7A5C]"
                        style={{ width: `${othersSharePct}%` }}
                        title={`Public wealth created for others: ${formatCurrencyCompact(created)}`}
                      />
                    </div>
                  </div>
                  <span className="hidden sm:inline font-mono text-[11px] text-[#5C5C58] w-28 text-right tabular-nums">
                    Kept: {formatCurrencyCompact(stake)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
