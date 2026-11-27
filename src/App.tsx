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
import { getMultiplier, getRankDelta, getWealthCreated } from './utils/format';
import type {
  AttributionMode,
  IndexFilter,
  PersonEntry,
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
  const [attributionMode, setAttributionMode] = useState<AttributionMode>('full');
  const [sortKey, setSortKey] = useState<SortKey>('wealthCreated');
  const [selectedPerson, setSelectedPerson] = useState<PersonEntry | null>(null);

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

        // Deep link support (#person/jeff-bezos)
        const hash = window.location.hash;
        if (hash.startsWith('#person/')) {
          const uri = decodeURIComponent(hash.slice('#person/'.length));
          const found = json.people.find((p) => p.uri === uri);
          if (found) setSelectedPerson(found);
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

  const handleSelectPerson = (person: PersonEntry | null) => {
    setSelectedPerson(person);
    if (person) {
      window.history.replaceState(null, '', `#person/${encodeURIComponent(person.uri)}`);
    } else if (window.location.hash.startsWith('#person/')) {
      window.history.replaceState(null, '', '#leaderboard');
    }
  };

  const countsByRole = useMemo(() => {
    if (!data) return { founders: 0, builders: 0, all: 0 };
    return {
      founders: data.people.filter((p) => p.isFounder).length,
      builders: data.people.filter((p) => p.isBuilder).length,
      all: data.people.length,
    };
  }, [data]);

  const filteredPeople = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();

    const list = data.people.filter((p) => {
      if (roleFilter === 'founders' && !p.isFounder) return false;
      if (roleFilter === 'builders' && !p.isBuilder) return false;

      if (indexFilter === 'sp500' && !p.attributions.some((a) => a.indices.includes('S&P 500'))) {
        return false;
      }
      if (
        indexFilter === 'nasdaq100' &&
        !p.attributions.some((a) => a.indices.includes('Nasdaq-100'))
      ) {
        return false;
      }
      if (indexFilter === 'both' && !p.attributions.some((a) => a.inBoth)) {
        return false;
      }

      if (q) {
        const hay = [
          p.name,
          p.country,
          p.sourceLabel,
          ...p.attributions.flatMap((a) => [a.companyName, a.ticker, a.sector, a.subIndustry]),
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
          return getWealthCreated(b, attributionMode) - getWealthCreated(a, attributionMode);
        case 'multiplier':
          return getMultiplier(b, attributionMode) - getMultiplier(a, attributionMode);
        case 'employees':
          return b.totalEmployees - a.totalEmployees;
        case 'netWorth':
          return b.forbesNetWorthUsd - a.forbesNetWorthUsd;
        case 'rankDelta':
          return getRankDelta(b, attributionMode) - getRankDelta(a, attributionMode);
      }
    });

    return list;
  }, [data, searchQuery, roleFilter, indexFilter, attributionMode, sortKey]);

  // Deduplicated company-level KPI totals for the active filter so aggregates never double-count co-founders
  const kpis = useMemo(() => {
    const companyMap = new Map<
      string,
      { marketCap: number; employees: number; stakeSum: number }
    >();

    for (const p of filteredPeople) {
      for (const a of p.attributions) {
        const existing = companyMap.get(a.ticker);
        if (!existing) {
          companyMap.set(a.ticker, {
            marketCap: a.marketCapUsd,
            employees: a.employees ?? 0,
            stakeSum: a.personalStakeUsd,
          });
        } else {
          existing.stakeSum += a.personalStakeUsd;
        }
      }
    }

    let totalWealthCreated = 0;
    let totalPersonalStake = 0;
    let totalEmployees = 0;

    for (const comp of companyMap.values()) {
      const cappedStake = Math.min(comp.stakeSum, comp.marketCap);
      totalPersonalStake += cappedStake;
      totalWealthCreated += Math.max(0, comp.marketCap - cappedStake);
      totalEmployees += comp.employees;
    }

    const aggregateMultiplier =
      totalPersonalStake > 0 ? totalWealthCreated / totalPersonalStake : 0;

    return {
      totalWealthCreated,
      totalPersonalStake,
      aggregateMultiplier,
      totalEmployees,
    };
  }, [filteredPeople]);

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
            totalPersonalStake={kpis.totalPersonalStake}
            aggregateMultiplier={kpis.aggregateMultiplier}
            totalEmployees={kpis.totalEmployees}
            visibleCount={filteredPeople.length}
            roleFilter={roleFilter}
            attributionMode={attributionMode}
          />

          <TopBuildersVisual
            people={filteredPeople}
            attributionMode={attributionMode}
            onSelectPerson={handleSelectPerson}
          />

          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchInputRef={searchInputRef}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            indexFilter={indexFilter}
            onIndexFilterChange={setIndexFilter}
            attributionMode={attributionMode}
            onAttributionModeChange={setAttributionMode}
            sortKey={sortKey}
            onSortKeyChange={setSortKey}
            resultCount={filteredPeople.length}
            countsByRole={countsByRole}
          />

          <LeaderboardTable
            people={filteredPeople}
            attributionMode={attributionMode}
            onSelectPerson={handleSelectPerson}
          />

          <RippleEffectExplainer />
          <MethodologySection summary={data.summary} />
        </>
      )}

      <Footer summary={data?.summary ?? null} />

      <PersonDrawer
        person={selectedPerson}
        attributionMode={attributionMode}
        onClose={() => handleSelectPerson(null)}
      />
    </div>
  );
}

export default App;
