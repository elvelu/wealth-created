import { Quote, TrendingUp, Users, Layers, ShieldCheck } from 'lucide-react';
import { formatCurrencyCompact, formatEmployees, formatMultiplier } from '../utils/format';
import type { AttributionMode, RoleFilter } from '../types/wealth';

interface HeroThesisProps {
  totalWealthCreated: number;
  totalPersonalStake: number;
  aggregateMultiplier: number;
  totalEmployees: number;
  visibleCount: number;
  roleFilter: RoleFilter;
  attributionMode: AttributionMode;
}

export function HeroThesis({
  totalWealthCreated,
  totalPersonalStake,
  aggregateMultiplier,
  totalEmployees,
  visibleCount,
  roleFilter,
  attributionMode,
}: HeroThesisProps) {
  const scopeLabel =
    roleFilter === 'founders'
      ? 'Founders & Co-Founders'
      : roleFilter === 'builders'
        ? 'Founders & Key Builders'
        : 'All Index Billionaires';

  return (
    <section className="border-b border-[#E5E5E0] bg-[#F8F7F4]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Editorial Thesis */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-sm border border-[#0B7A5C]/25 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0B7A5C]">
              Inspired by Jeff Bezos &amp; David Senra&apos;s Founders Podcast
            </div>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-[1.12] tracking-tight text-[#111111] sm:text-4xl lg:text-[2.6rem]">
              Not what they kept.
              <br />
              <span className="text-[#0B7A5C]">What they built for everyone else.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#3F3F3C]">
              Standard rich lists rank founders solely by the fraction of equity sitting in their own
              accounts. As Jeff Bezos explained — and as David Senra &amp; Tobi Lütke highlighted on{' '}
              <em className="font-medium text-[#111111]">Founders</em> — a public company worth
              trillions where the founder owns ~10% represents far more wealth unlocked for pension
              funds, 401(k)s, employees, and public shareholders than the founder ever kept.
            </p>

            {/* Formula Strip */}
            <div className="mt-5 rounded-sm border border-[#E5E5E0] bg-white p-3.5 sm:p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5C58]">
                Core Public Equity Formula
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs sm:text-sm">
                <span className="rounded bg-[#F8F7F4] px-2.5 py-1 font-semibold text-[#111111] border border-[#E5E5E0]">
                  Company Market Cap
                </span>
                <span className="font-bold text-[#5C5C58]">−</span>
                <span className="rounded bg-amber-50 px-2.5 py-1 font-semibold text-[#B45309] border border-amber-200">
                  Personal Stake Kept
                </span>
                <span className="font-bold text-[#5C5C58]">=</span>
                <span className="rounded bg-[#0B7A5C]/10 px-2.5 py-1 font-bold text-[#075942] border border-[#0B7A5C]/30">
                  Public Wealth Created for Others
                </span>
              </div>
            </div>
          </div>

          {/* Right Quote Callout Card */}
          <div className="lg:col-span-5">
            <div className="rounded-sm border border-[#E5E5E0] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="flex items-start gap-3">
                <Quote className="mt-0.5 h-5 w-5 shrink-0 text-[#0B7A5C]" />
                <div>
                  <p className="font-serif text-base italic leading-relaxed text-[#111111]">
                    &ldquo;If Amazon is worth ~$2.6 trillion and Jeff Bezos owns ~$220 billion, the
                    real headline isn&apos;t the $220 billion he owns — it&apos;s the ~$2.4 trillion
                    created for everyone else.&rdquo;
                  </p>
                  <p className="mt-2.5 text-xs text-[#5C5C58]">
                    Paraphrasing Jeff Bezos&apos;s rich-list thesis, discussed by{' '}
                    <strong className="text-[#111111]">David Senra</strong> &amp;{' '}
                    <strong className="text-[#111111]">Tobi Lütke</strong>
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-[#E5E5E0] pt-3.5 text-xs text-[#5C5C58] flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0B7A5C]" />
                <span>
                  Measured strictly on <strong className="text-[#111111]">S&amp;P 500</strong> and{' '}
                  <strong className="text-[#111111]">Nasdaq-100</strong> public equities matched
                  against the live Forbes Real-Time Billionaires list — excluding passive portfolio
                  stocks and unpriced private ventures.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Aggregate Dynamic KPI Cards */}
        <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-sm border border-[#0B7A5C]/30 bg-white p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#0B7A5C]">
              <span>Public Wealth Created</span>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-[#0B7A5C] tabular-nums sm:text-[1.75rem]">
              {formatCurrencyCompact(totalWealthCreated)}
            </div>
            <div className="mt-1 text-xs text-[#5C5C58]">
              Across {visibleCount} {scopeLabel.toLowerCase()} ({attributionMode === 'split' ? 'co-founder split' : 'company view'})
            </div>
          </div>

          <div className="rounded-sm border border-[#E5E5E0] bg-white p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#B45309]">
              <span>Personal Stake Kept</span>
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-[#111111] tabular-nums sm:text-[1.75rem]">
              {formatCurrencyCompact(totalPersonalStake)}
            </div>
            <div className="mt-1 text-xs text-[#5C5C58]">
              Equity held personally in matched public firms
            </div>
          </div>

          <div className="rounded-sm border border-[#E5E5E0] bg-white p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#5C5C58]">
              <span>Aggregate Multiplier</span>
              <span className="font-mono text-[10px] text-[#0B7A5C]">OTHERS / $1 KEPT</span>
            </div>
            <div className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-[#111111] tabular-nums sm:text-[1.75rem]">
              {formatMultiplier(aggregateMultiplier)}
            </div>
            <div className="mt-1 text-xs text-[#5C5C58]">
              Created for outside shareholders per $1 kept
            </div>
          </div>

          <div className="rounded-sm border border-[#E5E5E0] bg-white p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#5C5C58]">
              <span>Direct Jobs Created</span>
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-[#111111] tabular-nums sm:text-[1.75rem]">
              {formatEmployees(totalEmployees)}
            </div>
            <div className="mt-1 text-xs text-[#5C5C58]">
              Full-time employees at attributed companies
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
