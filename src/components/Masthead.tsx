import { Search, ArrowUpRight } from 'lucide-react';
import { formatSnapshotDate } from '../utils/format';
import type { IndexSummary } from '../types/wealth';

interface MastheadProps {
  summary: IndexSummary | null;
  onFocusSearch: () => void;
}

export function Masthead({ summary, onFocusSearch }: MastheadProps) {
  return (
    <header className="border-b-2 border-[#111111] bg-white">
      {/* Top Forbes-style utility edition bar */}
      <div className="border-b border-[#E5E5E0] bg-[#111111] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-neutral-300">
            <span className="font-semibold uppercase tracking-wider text-white">
              The Counter-Forbes Index
            </span>
            <span className="hidden text-neutral-500 sm:inline">|</span>
            <span>
              Snapshot: <strong className="text-white">{formatSnapshotDate(summary?.generatedAt)}</strong>
            </span>
            {summary && (
              <>
                <span className="hidden text-neutral-500 md:inline">|</span>
                <span className="hidden md:inline">
                  Universe: <strong className="text-white">{summary.uniqueCompaniesCount}</strong> Public Companies
                  (S&amp;P 500 ∪ Nasdaq-100, {summary.overlapCount} overlap)
                </span>
              </>
            )}
          </div>
          <nav className="flex items-center gap-4 text-neutral-300">
            <a href="#leaderboard" className="hover:text-white transition-colors">
              Rankings
            </a>
            <a href="#ripple-effects" className="hover:text-white transition-colors">
              Ripple Effects
            </a>
            <a href="#methodology" className="hover:text-white transition-colors">
              Methodology
            </a>
            <a
              href="https://github.com/elvelu/wealth-created"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-neutral-200 hover:text-white transition-colors"
            >
              GitHub
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </nav>
        </div>
      </div>

      {/* Main Editorial Masthead */}
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0B7A5C]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#0B7A5C]" />
            Public Market Wealth Attribution
          </div>
          <h1 className="mt-1 font-serif text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl lg:text-[2.65rem] leading-none">
            WEALTH CREATED
          </h1>
          <p className="mt-1.5 text-xs font-medium tracking-wide text-[#5C5C58] uppercase">
            For Others · Public Equity Market Capitalization Minus Builder&apos;s Personal Stake
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onFocusSearch}
            className="inline-flex items-center gap-2 rounded-sm border border-[#D4D4CE] bg-[#F8F7F4] px-3.5 py-2 text-xs font-medium text-[#111111] hover:border-[#111111] hover:bg-white transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 text-[#5C5C58]" />
            <span>Search person or ticker</span>
            <kbd className="ml-1 hidden rounded border border-[#D4D4CE] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#5C5C58] sm:inline">
              /
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
}
