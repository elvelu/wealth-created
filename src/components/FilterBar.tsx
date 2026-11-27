import type { RefObject } from 'react';
import { Search, X, HelpCircle } from 'lucide-react';
import type {
  CaptureBasis,
  GroupingMode,
  IndexFilter,
  RoleFilter,
  SortKey,
} from '../types/wealth';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  roleFilter: RoleFilter;
  onRoleFilterChange: (r: RoleFilter) => void;
  indexFilter: IndexFilter;
  onIndexFilterChange: (i: IndexFilter) => void;
  captureBasis: CaptureBasis;
  onCaptureBasisChange: (b: CaptureBasis) => void;
  groupingMode: GroupingMode;
  onGroupingModeChange: (g: GroupingMode) => void;
  sortKey: SortKey;
  onSortKeyChange: (s: SortKey) => void;
  resultCount: number;
  countsByRole: { founders: number; builders: number; all: number };
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchInputRef,
  roleFilter,
  onRoleFilterChange,
  indexFilter,
  onIndexFilterChange,
  captureBasis,
  onCaptureBasisChange,
  groupingMode,
  onGroupingModeChange,
  sortKey,
  onSortKeyChange,
  resultCount,
  countsByRole,
}: FilterBarProps) {
  return (
    <div id="leaderboard" className="sticky top-0 z-20 border-b border-[#E5E5E0] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Top Row: Search + Role Tabs */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5C58]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search person, co-founder, company, or ticker..."
              className="w-full rounded-sm border border-[#D4D4CE] bg-[#F8F7F4] py-2 pl-9 pr-9 text-sm text-[#111111] placeholder:text-[#787872] focus:border-[#0B7A5C] focus:bg-white focus:outline-none"
              aria-label="Search builders, companies, or tickers"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#5C5C58] hover:text-[#111111] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-1">
            {(
              [
                { id: 'founders', label: 'Founders', count: countsByRole.founders },
                { id: 'builders', label: 'Founders & Builders', count: countsByRole.builders },
                { id: 'all', label: 'All Index Billionaires', count: countsByRole.all },
              ] as const
            ).map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onRoleFilterChange(tab.id)}
                  className={`rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#5C5C58] hover:text-[#111111]'
                  }`}
                >
                  {tab.label}{' '}
                  <span
                    className={`ml-1 font-mono text-[11px] ${
                      active ? 'text-neutral-300' : 'text-[#888882]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Row: Index Filters + Basis Toggle + Grouping Toggle + Sort */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#F0EFEA] pt-3">
          {/* Index Universe Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#5C5C58]">
              Index:
            </span>
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'sp500', label: 'S&P 500' },
                { id: 'nasdaq100', label: 'Nasdaq-100' },
                { id: 'both', label: 'Overlap (Both)' },
              ] as const
            ).map((pill) => {
              const active = indexFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => onIndexFilterChange(pill.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'border-[#0B7A5C] bg-[#0B7A5C]/10 text-[#075942]'
                      : 'border-[#E5E5E0] bg-white text-[#5C5C58] hover:border-[#111111] hover:text-[#111111]'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Capture Basis Toggle */}
            <div className="flex items-center gap-1">
              <div className="group relative flex items-center">
                <HelpCircle className="h-3.5 w-3.5 text-[#787872]" />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-72 -translate-x-1/2 rounded-sm border border-[#E5E5E0] bg-[#111111] p-2.5 text-[11px] leading-relaxed text-white shadow-lg group-hover:block">
                  <strong>Total Net Worth</strong> (recommended) subtracts the founder&apos;s entire
                  Forbes net worth — preventing stock sales &amp; diversification (like Cascade
                  Investment) from inflating multipliers. <strong>Direct Equity</strong> subtracts
                  only their remaining shares in that company.
                </div>
              </div>
              <div className="inline-flex rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => onCaptureBasisChange('netWorth')}
                  className={`rounded-sm px-2 py-1 font-medium transition-colors cursor-pointer ${
                    captureBasis === 'netWorth'
                      ? 'bg-white text-[#111111] shadow-xs'
                      : 'text-[#5C5C58] hover:text-[#111111]'
                  }`}
                >
                  Total Net Worth
                </button>
                <button
                  type="button"
                  onClick={() => onCaptureBasisChange('directEquity')}
                  className={`rounded-sm px-2 py-1 font-medium transition-colors cursor-pointer ${
                    captureBasis === 'directEquity'
                      ? 'bg-white text-[#111111] shadow-xs'
                      : 'text-[#5C5C58] hover:text-[#111111]'
                  }`}
                >
                  Direct Equity
                </button>
              </div>
            </div>

            {/* Grouping Mode Toggle */}
            <div className="flex items-center gap-1">
              <div className="group relative flex items-center">
                <HelpCircle className="h-3.5 w-3.5 text-[#787872]" />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-72 -translate-x-1/2 rounded-sm border border-[#E5E5E0] bg-[#111111] p-2.5 text-[11px] leading-relaxed text-white shadow-lg group-hover:block">
                  <strong>Founding Teams</strong> groups co-founders of the same company into one
                  bucket led by the primary founder. <strong>Individuals</strong> splits each
                  team&apos;s wealth proportionally by personal net worth/stake so minor co-founders
                  never show inflated multipliers.
                </div>
              </div>
              <div className="inline-flex rounded-sm border border-[#E5E5E0] bg-[#F8F7F4] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => onGroupingModeChange('teams')}
                  className={`rounded-sm px-2 py-1 font-medium transition-colors cursor-pointer ${
                    groupingMode === 'teams'
                      ? 'bg-white text-[#111111] shadow-xs'
                      : 'text-[#5C5C58] hover:text-[#111111]'
                  }`}
                >
                  Founding Teams
                </button>
                <button
                  type="button"
                  onClick={() => onGroupingModeChange('individuals')}
                  className={`rounded-sm px-2 py-1 font-medium transition-colors cursor-pointer ${
                    groupingMode === 'individuals'
                      ? 'bg-white text-[#111111] shadow-xs'
                      : 'text-[#5C5C58] hover:text-[#111111]'
                  }`}
                >
                  Individuals
                </button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="sort-select"
                className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5C58]"
              >
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortKey}
                onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
                className="rounded-sm border border-[#D4D4CE] bg-white px-2 py-1 text-xs font-medium text-[#111111] focus:border-[#0B7A5C] focus:outline-none cursor-pointer"
              >
                <option value="wealthCreated">Wealth Created</option>
                <option value="multiplier">Multiplier</option>
                <option value="employees">Direct Jobs</option>
                <option value="netWorth">Net Worth Kept</option>
                <option value="rankDelta">Rank Jump vs Forbes</option>
              </select>
            </div>

            <span className="font-mono text-xs text-[#5C5C58] tabular-nums">
              {resultCount} {resultCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
