import type { IndexSummary } from '../types/wealth';
import { formatCurrencyCompact, formatEmployees, formatSnapshotDate } from '../utils/format';

interface MethodologySectionProps {
  summary: IndexSummary | null;
}

export function MethodologySection({ summary }: MethodologySectionProps) {
  const spOnly = summary ? summary.sp500Count - summary.overlapCount : 415;
  const ndxOnly = summary ? summary.nasdaq100Count - summary.overlapCount : 15;
  const overlap = summary ? summary.overlapCount : 85;

  return (
    <section id="methodology" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B7A5C]">
            Methodology, Index Overlap &amp; Scope
          </div>
          <h3 className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-[#111111]">
            How This Index Is Constructed
          </h3>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Left Column: Universe & Rules */}
          <div className="space-y-6 lg:col-span-7">
            {/* Index Overlap Visual Card */}
            <div className="rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#111111]">
                1. Public Equity Universe (S&amp;P 500 ∪ Nasdaq-100)
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5C5C58]">
                Dual-class share listings (e.g., <code className="font-mono">GOOGL/GOOG</code>,{' '}
                <code className="font-mono">BRK.B/BRK.A</code>,{' '}
                <code className="font-mono">FOXA/FOX</code>,{' '}
                <code className="font-mono">NWSA/NWS</code>) are merged into single unified
                companies so market capitalization is never double-counted.
              </p>

              {/* Visual Venn / Overlap Bar */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-sm border border-[#E5E5E0] bg-white p-3">
                  <div className="font-mono text-xl font-bold text-[#111111] tabular-nums">
                    {spOnly}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-[#5C5C58]">S&amp;P 500 Only</div>
                </div>
                <div className="rounded-sm border border-[#0B7A5C]/40 bg-[#0B7A5C]/10 p-3">
                  <div className="font-mono text-xl font-bold text-[#075942] tabular-nums">
                    {overlap}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-[#075942]">
                    In Both Indices
                  </div>
                </div>
                <div className="rounded-sm border border-[#E5E5E0] bg-white p-3">
                  <div className="font-mono text-xl font-bold text-[#111111] tabular-nums">
                    {ndxOnly}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-[#5C5C58]">
                    Nasdaq-100 Only
                  </div>
                </div>
              </div>

              {summary && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C5C58] border-t border-[#E5E5E0] pt-3">
                  <span>
                    Total unique companies:{' '}
                    <strong className="font-mono text-[#111111]">
                      {summary.uniqueCompaniesCount}
                    </strong>
                  </span>
                  <span>
                    Matched to Forbes billionaires:{' '}
                    <strong className="font-mono text-[#111111]">
                      {summary.matchedCompaniesCount} companies ({summary.matchedPeopleCount} people)
                    </strong>
                  </span>
                  <span>
                    Matched Market Cap:{' '}
                    <strong className="font-mono text-[#0B7A5C]">
                      {formatCurrencyCompact(summary.totalUniqueMarketCapUsd)}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-[#E5E5E0] p-4">
                <h4 className="font-serif text-base font-bold text-[#111111]">
                  2. Total Net Worth vs. Direct Equity
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[#5C5C58]">
                  A founder who sells stock and parks proceeds in a family office (e.g., Bill Gates
                  diversifying Microsoft shares via Cascade Investment) did not transfer that wealth
                  to society. Subtracting <strong>Total Forbes Net Worth</strong> keeps diversified
                  proceeds inside &ldquo;kept&rdquo; wealth (making Gates ~29× instead of ~243×).
                  Switch to <strong>Direct Equity</strong> anytime to inspect the raw cap-table
                  split.
                </p>
              </div>

              <div className="rounded-sm border border-[#E5E5E0] p-4">
                <h4 className="font-serif text-base font-bold text-[#111111]">
                  3. Founding Team Bucketing
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[#5C5C58]">
                  In <strong>Founding Teams</strong> mode, co-founders of the same company (e.g.,
                  Mark Zuckerberg, Eduardo Saverin &amp; Dustin Moskovitz at Meta) are pooled into
                  one team bucket led by the primary founder — zero arbitrary credit weights, zero
                  inflated 800× multipliers, and zero double-counting. In{' '}
                  <strong>Individuals</strong> mode, each team&apos;s outside wealth is weighted
                  proportionally by personal net worth/stake.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Private Companies & Historical Note */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">
                Why Public Companies Only?
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#3F3F3C]">
                Private ventures like <strong>Stripe</strong>, <strong>OpenAI</strong>,{' '}
                <strong>ByteDance</strong>, or <strong>Anthropic</strong> have undoubtedly created
                enormous value for employees and early backers, but lack continuous daily
                mark-to-market liquidity and audited public float disclosures. We record major
                private stakes in individual drawers for context while keeping the leaderboard
                strictly grounded in audited public S&amp;P 500 &amp; Nasdaq-100 market caps.
              </p>
            </div>

            <div className="rounded-sm border border-[#E5E5E0] bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#111111]">
                Notable Historical Builders (Not on Live List)
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#5C5C58]">
                Because this index cross-references the live <strong>Forbes Real-Time
                Billionaires</strong> list, deceased founders whose wealth passed to foundations or
                heirs are absent as founders:
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs text-[#3F3F3C]">
                <li>
                  • <strong>Steve Jobs</strong> (Apple — $5T+ public wealth created;{' '}
                  <em>Laurene Powell Jobs</em> appears via inherited stake)
                </li>
                <li>
                  • <strong>Sam Walton</strong> (Walmart — ~$800B+ public wealth created;{' '}
                  <em>Walton heirs</em> appear under Family / Heir)
                </li>
                <li>
                  • <strong>Gordon Moore &amp; Robert Noyce</strong> (Intel),{' '}
                  <strong>Bill Hewlett &amp; Dave Packard</strong>, <strong>Henry Ford</strong>
                </li>
              </ul>
            </div>

            {summary && (
              <div className="rounded-sm border border-[#E5E5E0] px-4 py-3 text-xs text-[#5C5C58]">
                Matched firms employ{' '}
                <strong className="font-mono text-[#111111]">
                  {formatEmployees(summary.totalUniqueEmployees)}
                </strong>{' '}
                people directly · Refreshed{' '}
                <strong className="font-mono text-[#111111]">
                  {formatSnapshotDate(summary.generatedAt)}
                </strong>
                .
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
