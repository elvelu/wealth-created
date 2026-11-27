import { useEffect, useMemo, useRef, useState } from 'react';
import { Masthead } from './components/Masthead';
import { HeroThesis } from './components/HeroThesis';
import { TopBuildersVisual } from './components/TopBuildersVisual';
import { FilterBar } from './components/FilterBar';
import { LeaderboardTable } from './components/LeaderboardTable';
import { RippleEffectExplainer } from './components/RippleEffectExplainer';
import { MethodologySection } from './components/MethodologySection';
import { PersonDrawer } from './components/PersonDrawer';
import { Footer } from './components/Footer';
import { buildDisplayEntries } from './utils/aggregation';
import {
  getEntryKept,
  getEntryMultiplier,
  getEntryRankDelta,
  getEntryWealthCreated,
} from './utils/format';
import type {
  CaptureBasis,
  DisplayEntry,
  GroupingMode,
  IndexFilter,
  RoleFilter,
  SortKey,
  WealthIndexData,
} from './types/wealth';

export function App() {
  const [data, setData] = useState<WealthIndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('founders');
  const [indexFilter, setIndexFilter] = useState<IndexFilter>('all');
  const [captureBasis, setCaptureBasis] = useState<CaptureBasis>('netWorth');
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('teams');
  const [sortKey, setSortKey] = useState<SortKey>('wealthCreated');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch('./data/wealth-index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<WealthIndexData>;
      })
      .then((json) => {
        if (!active) return;
        setData(json);
        setLoading(false);

        // Deep link support (#person/jeff-bezos or #person/team-META)
        const hash = window.location.hash;
        if (hash.startsWith('#person/')) {
          const target = decodeURIComponent(hash.slice('#person/'.length));
          setSelectedId(target);
        }
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Keyboard shortcut `/` to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const allEntries = useMemo(() => {
    if (!data) return [];
    return buildDisplayEntries(data.people, groupingMode);
  }, [data, groupingMode]);

  const selectedEntry = useMemo(() => {
    if (!selectedId) return null;
    return (
      allEntries.find(
        (e) => e.id === selectedId || e.members.some((m) => m.uri === selectedId),
      ) ?? null
    );
  }, [allEntries, selectedId]);

  const handleSelectEntry = (entry: DisplayEntry | null) => {
    if (entry) {
      setSelectedId(entry.id);
      window.history.replaceState(null, '', `#person/${encodeURIComponent(entry.id)}`);
    } else {
      setSelectedId(null);
      if (window.location.hash.startsWith('#person/')) {
        window.history.replaceState(null, '', '#leaderboard');
      }
    }
  };

  const countsByRole = useMemo(() => {
    return {
      founders: allEntries.filter((e) => e.isFounder).length,
      builders: allEntries.filter((e) => e.isBuilder).length,
      all: allEntries.length,
    };
  }, [allEntries]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = allEntries.filter((entry) => {
      if (roleFilter === 'founders' && !entry.isFounder) return false;
      if (roleFilter === 'builders' && !entry.isBuilder) return false;

      if (
        indexFilter === 'sp500' &&
        !entry.attributions.some((a) => a.indices.includes('S&P 500'))
      ) {
        return false;
      }
      if (
        indexFilter === 'nasdaq100' &&
        !entry.attributions.some((a) => a.indices.includes('Nasdaq-100'))
      ) {
        return false;
      }
      if (indexFilter === 'both' && !entry.attributions.some((a) => a.inBoth)) {
        return false;
      }

      if (q) {
        const hay = [
          entry.displayName,
          entry.subtitle ?? '',
          ...entry.members.flatMap((m) => [m.name, m.country, m.sourceLabel]),
          ...entry.attributions.flatMap((a) => [a.companyName, a.ticker, a.sector, a.subIndustry]),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      switch (sortKey) {
        case 'wealthCreated':
          return (
            getEntryWealthCreated(b, captureBasis) - getEntryWealthCreated(a, captureBasis)
          );
        case 'multiplier':
          return getEntryMultiplier(b, captureBasis) - getEntryMultiplier(a, captureBasis);
        case 'employees':
          return b.totalEmployees - a.totalEmployees;
        case 'netWorth':
          return getEntryKept(b, captureBasis) - getEntryKept(a, captureBasis);
        case 'rankDelta':
          return getEntryRankDelta(b, captureBasis) - getEntryRankDelta(a, captureBasis);
      }
    });

    return list;
  }, [allEntries, searchQuery, roleFilter, indexFilter, captureBasis, sortKey]);

  // Deduplicated company-level KPI totals for the active filtered view
  const kpis = useMemo(() => {
    const companyMap = new Map<string, { marketCap: number; employees: number }>();
    const seenPeople = new Map<string, { nw: number; stake: number }>();

    for (const entry of filteredEntries) {
      for (const a of entry.attributions) {
        if (!companyMap.has(a.ticker)) {
          companyMap.set(a.ticker, {
            marketCap: a.marketCapUsd,
            employees: a.employees ?? 0,
          });
        }
      }
      for (const m of entry.members) {
        if (!seenPeople.has(m.uri)) {
          seenPeople.set(m.uri, {
            nw: m.forbesNetWorthUsd,
            stake: m.totalPersonalStakeUsd,
          });
        }
      }
    }

    let totalMarketCap = 0;
    let totalEmployees = 0;
    for (const c of companyMap.values()) {
      totalMarketCap += c.marketCap;
      totalEmployees += c.employees;
    }

    let rawKept = 0;
    for (const p of seenPeople.values()) {
      rawKept += captureBasis === 'netWorth' ? p.nw : p.stake;
    }

    const totalKept = Math.min(rawKept, totalMarketCap);
    const totalWealthCreated = Math.max(0, totalMarketCap - totalKept);
    const aggregateMultiplier = totalKept > 0 ? totalWealthCreated / totalKept : 0;

    return {
      totalWealthCreated,
      totalKept,
      aggregateMultiplier,
      totalEmployees,
    };
  }, [filteredEntries, captureBasis]);

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Masthead
        summary={data?.summary ?? null}
        onFocusSearch={() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {loading && (
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B7A5C] border-t-transparent" />
          <p className="mt-3 text-sm text-[#5C5C58]">
            Loading S&amp;P 500, Nasdaq-100 &amp; Forbes wealth dataset...
          </p>
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="rounded-sm border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            Could not load wealth index data ({error}). Please run{' '}
            <code className="font-mono font-semibold">python scripts/fetch_data.py</code>.
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <HeroThesis
            totalWealthCreated={kpis.totalWealthCreated}
            totalKept={kpis.totalKept}
            aggregateMultiplier={kpis.aggregateMultiplier}
            totalEmployees={kpis.totalEmployees}
            visibleCount={filteredEntries.length}
            roleFilter={roleFilter}
            captureBasis={captureBasis}
            groupingMode={groupingMode}
          />

          <TopBuildersVisual
            entries={filteredEntries}
            captureBasis={captureBasis}
            onSelectEntry={handleSelectEntry}
          />

          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchInputRef={searchInputRef}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            indexFilter={indexFilter}
            onIndexFilterChange={setIndexFilter}
            captureBasis={captureBasis}
            onCaptureBasisChange={setCaptureBasis}
            groupingMode={groupingMode}
            onGroupingModeChange={setGroupingMode}
            sortKey={sortKey}
            onSortKeyChange={setSortKey}
            resultCount={filteredEntries.length}
            countsByRole={countsByRole}
          />

          <LeaderboardTable
            entries={filteredEntries}
            captureBasis={captureBasis}
            onSelectEntry={handleSelectEntry}
          />

          <RippleEffectExplainer />
          <MethodologySection summary={data.summary} />
        </>
      )}

      <Footer summary={data?.summary ?? null} />

      <PersonDrawer
        entry={selectedEntry}
        captureBasis={captureBasis}
        groupingMode={groupingMode}
        onClose={() => handleSelectEntry(null)}
      />
    </div>
  );
}

export default App;
