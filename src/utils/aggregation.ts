import type {
  CompanyAttribution,
  DisplayEntry,
  ExcludedHolding,
  GroupingMode,
  PersonEntry,
} from '../types/wealth';

function sortTeamMembers(members: PersonEntry[]): PersonEntry[] {
  return [...members].sort((a, b) => {
    const aPrimary = a.primaryRole === 'Founder' ? 1 : 0;
    const bPrimary = b.primaryRole === 'Founder' ? 1 : 0;
    if (aPrimary !== bPrimary) return bPrimary - aPrimary;

    const aCeo = a.attributions.some((x) => x.roleDetail.toLowerCase().includes('ceo')) ? 1 : 0;
    const bCeo = b.attributions.some((x) => x.roleDetail.toLowerCase().includes('ceo')) ? 1 : 0;
    if (aCeo !== bCeo) return bCeo - aCeo;

    return b.forbesNetWorthUsd - a.forbesNetWorthUsd;
  });
}

function mergeAttributions(members: PersonEntry[]): CompanyAttribution[] {
  const byTicker = new Map<string, CompanyAttribution>();
  for (const m of members) {
    for (const a of m.attributions) {
      const existing = byTicker.get(a.ticker);
      if (!existing) {
        byTicker.set(a.ticker, { ...a });
      } else {
        const combinedStake = Math.min(
          existing.personalStakeUsd + a.personalStakeUsd,
          existing.marketCapUsd,
        );
        const combinedShares =
          existing.personalShares != null || a.personalShares != null
            ? (existing.personalShares ?? 0) + (a.personalShares ?? 0)
            : null;
        const created = Math.max(0, existing.marketCapUsd - combinedStake);
        byTicker.set(a.ticker, {
          ...existing,
          personalShares: combinedShares,
          personalStakeUsd: combinedStake,
          ownershipPct:
            existing.marketCapUsd > 0
              ? Number(((combinedStake / existing.marketCapUsd) * 100).toFixed(2))
              : 0,
          wealthCreatedForOthersUsd: created,
          wealthMultiplier:
            combinedStake > 0 ? Number((created / combinedStake).toFixed(2)) : 0,
        });
      }
    }
  }
  return Array.from(byTicker.values()).sort((a, b) => b.marketCapUsd - a.marketCapUsd);
}

function mergeExcludedHoldings(members: PersonEntry[]): ExcludedHolding[] {
  const seen = new Set<string>();
  const out: ExcludedHolding[] = [];
  for (const m of members) {
    for (const ex of m.excludedHoldings) {
      const key = `${ex.ticker ?? ex.companyName}:${ex.estimatedValueUsd}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(ex);
      }
    }
  }
  return out.sort((a, b) => b.estimatedValueUsd - a.estimatedValueUsd).slice(0, 8);
}

function getFoundedKey(person: PersonEntry): string {
  const founded = person.attributions
    .filter((a) => a.role === 'Founder' || a.role === 'Co-Founder')
    .map((a) => a.ticker)
    .sort();
  return founded.join(',');
}

function makeTeamEntry(key: string, membersRaw: PersonEntry[]): DisplayEntry {
  const members = sortTeamMembers(membersRaw);
  const lead = members[0];
  const mergedAtts = mergeAttributions(members);

  const marketCapUsd = mergedAtts.reduce((acc, a) => acc + a.marketCapUsd, 0);
  const totalEmployees = mergedAtts.reduce((acc, a) => acc + (a.employees ?? 0), 0);
  const totalRevenueUsd = mergedAtts.reduce((acc, a) => acc + (a.revenueUsd ?? 0), 0);

  const rawTeamNw = members.reduce((acc, m) => acc + m.forbesNetWorthUsd, 0);
  const rawTeamStake = members.reduce((acc, m) => acc + m.totalPersonalStakeUsd, 0);

  const keptNetWorthUsd = Math.min(rawTeamNw, marketCapUsd);
  const wealthCreatedNetWorthUsd = Math.max(0, marketCapUsd - keptNetWorthUsd);
  const multiplierNetWorth = rawTeamNw > 0 ? wealthCreatedNetWorthUsd / rawTeamNw : 0;

  const keptDirectEquityUsd = Math.min(rawTeamStake, marketCapUsd);
  const wealthCreatedDirectEquityUsd = Math.max(0, marketCapUsd - keptDirectEquityUsd);
  const multiplierDirectEquity =
    rawTeamStake > 0 ? wealthCreatedDirectEquityUsd / rawTeamStake : 0;

  const others = members.slice(1).map((m) => m.name);
  const displayName =
    members.length === 2 ? `${lead.name} & ${others[0]}` : `${lead.name} & Co-Founders`;
  const subtitle =
    members.length === 2
      ? `Founding Team · ${mergedAtts.map((a) => a.companyName).join(', ')}`
      : `Led by ${lead.name} · with ${others.join(', ')}`;

  return {
    id: `team-${key}`,
    isTeam: true,
    displayName,
    subtitle,
    leadPerson: lead,
    members,
    primaryRole: lead.primaryRole,
    isFounder: true,
    isBuilder: true,
    attributions: mergedAtts,
    marketCapUsd,
    keptNetWorthUsd,
    keptDirectEquityUsd,
    wealthCreatedNetWorthUsd,
    wealthCreatedDirectEquityUsd,
    multiplierNetWorth,
    multiplierDirectEquity,
    teamWeightPct: null,
    teamMembersCount: members.length,
    totalEmployees,
    totalRevenueUsd,
    forbesRank: lead.forbesRank,
    forbesNetWorthUsd: rawTeamNw,
    wealthRankNetWorth: 0,
    wealthRankDirectEquity: 0,
    rankDeltaNetWorth: 0,
    rankDeltaDirectEquity: 0,
    excludedHoldings: mergeExcludedHoldings(members),
  };
}

function makeIndividualEntry(
  person: PersonEntry,
  teamMembers?: PersonEntry[],
): DisplayEntry {
  const isWeightedTeamMember = Boolean(teamMembers && teamMembers.length >= 2);
  const mergedTeamAtts = isWeightedTeamMember ? mergeAttributions(teamMembers!) : person.attributions;
  const marketCapTotal = mergedTeamAtts.reduce((acc, a) => acc + a.marketCapUsd, 0);

  if (isWeightedTeamMember && teamMembers) {
    const rawTeamNw = teamMembers.reduce((acc, m) => acc + m.forbesNetWorthUsd, 0);
    const rawTeamStake = teamMembers.reduce((acc, m) => acc + m.totalPersonalStakeUsd, 0);

    const weightNw = rawTeamNw > 0 ? person.forbesNetWorthUsd / rawTeamNw : 1 / teamMembers.length;
    const weightEq =
      rawTeamStake > 0 ? person.totalPersonalStakeUsd / rawTeamStake : weightNw;

    const teamCreatedNw = Math.max(0, marketCapTotal - Math.min(rawTeamNw, marketCapTotal));
    const teamMultNw = rawTeamNw > 0 ? teamCreatedNw / rawTeamNw : 0;

    const teamCreatedEq = Math.max(0, marketCapTotal - Math.min(rawTeamStake, marketCapTotal));
    const teamMultEq = rawTeamStake > 0 ? teamCreatedEq / rawTeamStake : 0;

    return {
      id: person.uri,
      isTeam: false,
      displayName: person.name,
      subtitle: `${Number((weightNw * 100).toFixed(1))}% of ${teamMembers.length}-founder team`,
      leadPerson: person,
      members: [person],
      primaryRole: person.primaryRole,
      isFounder: person.isFounder,
      isBuilder: person.isBuilder,
      attributions: person.attributions,
      marketCapUsd: Math.round(marketCapTotal * weightNw),
      keptNetWorthUsd: Math.min(person.forbesNetWorthUsd, Math.round(marketCapTotal * weightNw)),
      keptDirectEquityUsd: Math.min(
        person.totalPersonalStakeUsd,
        Math.round(marketCapTotal * weightEq),
      ),
      wealthCreatedNetWorthUsd: Math.round(teamCreatedNw * weightNw),
      wealthCreatedDirectEquityUsd: Math.round(teamCreatedEq * weightEq),
      multiplierNetWorth: teamMultNw,
      multiplierDirectEquity: teamMultEq,
      teamWeightPct: Number((weightNw * 100).toFixed(1)),
      teamMembersCount: teamMembers.length,
      totalEmployees: person.totalEmployees,
      totalRevenueUsd: person.totalRevenueUsd,
      forbesRank: person.forbesRank,
      forbesNetWorthUsd: person.forbesNetWorthUsd,
      wealthRankNetWorth: 0,
      wealthRankDirectEquity: 0,
      rankDeltaNetWorth: 0,
      rankDeltaDirectEquity: 0,
      excludedHoldings: person.excludedHoldings,
    };
  }

  const mcap = person.totalMarketCapAttributedUsd;
  const keptNw = Math.min(person.forbesNetWorthUsd, mcap);
  const createdNw = Math.max(0, mcap - keptNw);
  const multNw = person.forbesNetWorthUsd > 0 ? createdNw / person.forbesNetWorthUsd : 0;

  const keptEq = Math.min(person.totalPersonalStakeUsd, mcap);
  const createdEq = Math.max(0, mcap - keptEq);
  const multEq = person.totalPersonalStakeUsd > 0 ? createdEq / person.totalPersonalStakeUsd : 0;

  return {
    id: person.uri,
    isTeam: false,
    displayName: person.name,
    subtitle: null,
    leadPerson: person,
    members: [person],
    primaryRole: person.primaryRole,
    isFounder: person.isFounder,
    isBuilder: person.isBuilder,
    attributions: person.attributions,
    marketCapUsd: mcap,
    keptNetWorthUsd: keptNw,
    keptDirectEquityUsd: keptEq,
    wealthCreatedNetWorthUsd: createdNw,
    wealthCreatedDirectEquityUsd: createdEq,
    multiplierNetWorth: multNw,
    multiplierDirectEquity: multEq,
    teamWeightPct: null,
    teamMembersCount: 1,
    totalEmployees: person.totalEmployees,
    totalRevenueUsd: person.totalRevenueUsd,
    forbesRank: person.forbesRank,
    forbesNetWorthUsd: person.forbesNetWorthUsd,
    wealthRankNetWorth: 0,
    wealthRankDirectEquity: 0,
    rankDeltaNetWorth: 0,
    rankDeltaDirectEquity: 0,
    excludedHoldings: person.excludedHoldings,
  };
}

export function buildDisplayEntries(
  people: PersonEntry[],
  groupingMode: GroupingMode,
): DisplayEntry[] {
  const founderGroups = new Map<string, PersonEntry[]>();
  for (const p of people) {
    if (p.isFounder) {
      const key = getFoundedKey(p);
      if (key) {
        const list = founderGroups.get(key) ?? [];
        list.push(p);
        founderGroups.set(key, list);
      }
    }
  }

  const entries: DisplayEntry[] = [];
  const consumedTeams = new Set<string>();

  for (const p of people) {
    const key = p.isFounder ? getFoundedKey(p) : '';
    const group = key ? founderGroups.get(key) : undefined;

    if (groupingMode === 'teams' && group && group.length >= 2) {
      if (!consumedTeams.has(key)) {
        consumedTeams.add(key);
        entries.push(makeTeamEntry(key, group));
      }
    } else {
      entries.push(makeIndividualEntry(p, group));
    }
  }

  // Assign ranks across both capture bases
  const byNw = [...entries].sort(
    (a, b) => b.wealthCreatedNetWorthUsd - a.wealthCreatedNetWorthUsd,
  );
  byNw.forEach((entry, idx) => {
    entry.wealthRankNetWorth = idx + 1;
    entry.rankDeltaNetWorth = entry.forbesRank - (idx + 1);
  });

  const byEq = [...entries].sort(
    (a, b) => b.wealthCreatedDirectEquityUsd - a.wealthCreatedDirectEquityUsd,
  );
  byEq.forEach((entry, idx) => {
    entry.wealthRankDirectEquity = idx + 1;
    entry.rankDeltaDirectEquity = entry.forbesRank - (idx + 1);
  });

  return entries;
}
