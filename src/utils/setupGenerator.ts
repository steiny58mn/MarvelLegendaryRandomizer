import {
  ActiveSetup,
  DeckBreakdown,
  GeneratorSettings,
  HenchmanGroup,
  HeroCard,
  MastermindCard,
  SchemeCard,
  VillainGroup,
} from '../types';

function pickRandom<T>(array: T[]): T | undefined {
  if (!array || array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function calculateBaseRequirements(playerCount: number, scheme?: SchemeCard) {
  let heroCount = 5;
  let villainGroupsCount = 2;
  let henchmanGroupsCount = 1;
  let bystandersCount = 2;
  let masterStrikes = 5;
  let twistsCount = scheme?.twists || 8;
  const extraCards: { name: string; count: number; description: string }[] = [];

  switch (playerCount) {
    case 1:
      // Official Legendary Solo Variant (Base rules + standard expansions)
      heroCount = 3;
      villainGroupsCount = 1;
      henchmanGroupsCount = 1; // 1 group total (2 shuffled into deck, 2 in city)
      bystandersCount = 1; // 1 in deck
      masterStrikes = 5; // 5 Strikes in Villain deck
      twistsCount = scheme?.twists || 8;
      break;
    case 2:
      heroCount = 5;
      villainGroupsCount = 2;
      henchmanGroupsCount = 1;
      bystandersCount = 2;
      masterStrikes = 5;
      break;
    case 3:
      heroCount = 5;
      villainGroupsCount = 3;
      henchmanGroupsCount = 1;
      bystandersCount = 2;
      masterStrikes = 5;
      break;
    case 4:
      heroCount = 5;
      villainGroupsCount = 3;
      henchmanGroupsCount = 2;
      bystandersCount = 8;
      masterStrikes = 5;
      break;
    case 5:
      heroCount = 6;
      villainGroupsCount = 4;
      henchmanGroupsCount = 2;
      bystandersCount = 12;
      masterStrikes = 5;
      break;
    default:
      break;
  }

  // Handle scheme-specific modifications if present
  if (scheme) {
    if (scheme.extraHeroes) {
      heroCount += scheme.extraHeroes;
    }
    if (scheme.extraVillains) {
      villainGroupsCount += scheme.extraVillains;
    }
    if (scheme.extraHenchmen) {
      henchmanGroupsCount += scheme.extraHenchmen;
    }
    if (scheme.extraBystanders) {
      bystandersCount += scheme.extraBystanders;
    }

    // Scheme Rules parsing for special card additions (e.g. Bystanders, Sidekicks, Officers)
    const fullText = [
      scheme.setupRule || '',
      scheme.specialRules || '',
      scheme.twistEffect || '',
      scheme.evilWins || '',
    ].join(' ');

    // Match patterns like "Add 8 Bystanders to the Villain Deck" or "include 5 extra Bystanders"
    const bystanderDeckMatch = fullText.match(
      /(?:add|include|shuffle)\s+(\d+)\s+(?:extra\s+)?(?:special\s+)?bystanders(?:\s+(?:to|into)\s+the\s+villain\s+deck)/i
    );
    if (bystanderDeckMatch) {
      const extraBys = parseInt(bystanderDeckMatch[1], 10);
      if (extraBys > 0 && !scheme.extraBystanders) {
        bystandersCount += extraBys;
      }
    }

    // Match patterns for Officers (e.g., "15 S.H.I.E.L.D. Officers" or "Add 6 Officers")
    const officerMatch = fullText.match(
      /(?:add|shuffle|stack|include)\s+(\d+)\s+(?:s\.h\.i\.e\.l\.d\.\s+)?officers/i
    );
    if (officerMatch) {
      extraCards.push({
        name: 'S.H.I.E.L.D. Officers',
        count: parseInt(officerMatch[1], 10),
        description: 'Added per Scheme Setup',
      });
    }

    // Match Sidekicks (e.g. "Add 8 Sidekicks to the Villain Deck")
    const sidekickMatch = fullText.match(
      /(?:add|shuffle|include)\s+(\d+)\s+sidekicks(?:\s+(?:to|into)\s+the\s+villain\s+deck)?/i
    );
    if (sidekickMatch) {
      extraCards.push({
        name: 'Sidekicks',
        count: parseInt(sidekickMatch[1], 10),
        description: 'Shuffled into Villain Deck',
      });
    }

    // Extra Henchmen groups beyond requirements
    const extraHenchMatch = fullText.match(/add (\d+) extra henchm(?:a|e)n group/i);
    if (extraHenchMatch) {
      henchmanGroupsCount += parseInt(extraHenchMatch[1], 10);
    }

    // Extra Villain groups beyond requirements
    const extraVillainMatch = fullText.match(/add (\d+) extra villain group/i);
    if (extraVillainMatch) {
      villainGroupsCount += parseInt(extraVillainMatch[1], 10);
    }

    // Special setup for 1-2 players (e.g. Breach the Nexus of All Realities)
    const isBreachNexus = /breach the nexus of all realities/i.test(scheme.name);
    const player12VillainMatch = fullText.match(
      /(?:1-2|1 or 2)\s*players?:\s*(?:use|add)\s*(\d+)\s*villain\s*groups?/i
    );
    if ((isBreachNexus || player12VillainMatch) && playerCount <= 2) {
      const targetVillainCount = player12VillainMatch ? parseInt(player12VillainMatch[1], 10) : 3;
      villainGroupsCount = Math.max(villainGroupsCount + 1, targetVillainCount);
    }
  }

  return {
    heroCount,
    villainGroupsCount,
    henchmanGroupsCount,
    bystandersCount,
    masterStrikes,
    twistsCount,
    extraCards,
  };
}

export function normalizeRuleString(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[\u201c\u201d\"\u2018\u2019']/g, '')
    .replace(/[-_.,!:;()&/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ensures a collection of cards (Villains, Henchmen, Heroes) contains strictly UNIQUE entries
 * with no duplicate IDs or identical names, respecting locked slots whenever possible.
 */
export function sanitizeUniqueGroups<T extends { id: string; name: string; expansion?: string }>(
  currentList: (T | undefined)[],
  availablePool: T[],
  fallbackPool: T[],
  lockedMap?: { [idx: number]: boolean }
): T[] {
  const result: (T | undefined)[] = [...currentList];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  // Pass 1: Register locked items first so they have absolute priority
  result.forEach((item, idx) => {
    if (item && lockedMap?.[idx]) {
      const normName = normalizeRuleString(item.name);
      seenIds.add(item.id);
      seenNames.add(normName);
    }
  });

  // Pass 2: Keep valid unlocked unique items, mark duplicates for replacement
  result.forEach((item, idx) => {
    if (!item) return;
    if (lockedMap?.[idx]) return; // already registered

    const normName = normalizeRuleString(item.name);
    if (seenIds.has(item.id) || seenNames.has(normName)) {
      // Duplicate detected! Mark for replacement
      result[idx] = undefined;
    } else {
      seenIds.add(item.id);
      seenNames.add(normName);
    }
  });

  // Candidates for replacement: availablePool first (shuffled), then fallbackPool (shuffled)
  const candidatePool = [
    ...shuffle(availablePool),
    ...shuffle(fallbackPool),
  ];

  let candidateIdx = 0;

  // Pass 3: Fill any undefined slots with strictly unique candidates
  for (let idx = 0; idx < result.length; idx++) {
    if (!result[idx]) {
      while (candidateIdx < candidatePool.length) {
        const candidate = candidatePool[candidateIdx++];
        const normName = normalizeRuleString(candidate.name);
        if (!seenIds.has(candidate.id) && !seenNames.has(normName)) {
          seenIds.add(candidate.id);
          seenNames.add(normName);
          result[idx] = candidate;
          break;
        }
      }
    }
  }

  return result.filter(Boolean) as T[];
}

export function deduplicateGroups<T extends { id: string; name: string }>(groups: T[]): T[] {
  const seen = new Set<string>();
  return groups.filter((g) => {
    const normName = normalizeRuleString(g.name);
    if (seen.has(normName) || seen.has(g.id)) return false;
    seen.add(normName);
    seen.add(g.id);
    return true;
  });
}

function selectMatchingGroup<T extends { id: string; name: string }>(
  enabledPool: T[],
  combinedPool: T[],
  predicate: (item: T) => boolean,
  _contextLabel: string = 'Group'
): T | undefined {
  const rawEnabledMatches = enabledPool.filter(predicate);
  const enabledMatches = deduplicateGroups(rawEnabledMatches);
  const rawCombinedMatches = combinedPool.filter(predicate);
  const allMatches = deduplicateGroups(rawCombinedMatches);

  let selected: T | undefined;
  if (enabledMatches.length > 0) {
    selected = pickRandom(enabledMatches);
  } else if (allMatches.length > 0) {
    selected = pickRandom(allMatches);
  }

  return selected;
}

export function resolveAlwaysLeads(
  alwaysLeadsText: string | undefined,
  villainPool: VillainGroup[],
  henchmanPool: HenchmanGroup[],
  allVillains: VillainGroup[] = [],
  allHenchmen: HenchmanGroup[] = []
): {
  ledVillain?: VillainGroup;
  ledHenchman?: HenchmanGroup;
  description: string;
} {
  if (!alwaysLeadsText) return { description: '' };

  const raw = alwaysLeadsText.trim();
  const lower = raw.toLowerCase();
  const normRaw = normalizeRuleString(raw);
  const isAny = lower.includes('any');

  // Combined pools: search enabled expansions first, fallback to all cards if necessary
  const combinedVillains = [...villainPool, ...allVillains.filter(v => !villainPool.some(vp => vp.id === v.id))];
  const combinedHenchmen = [...henchmanPool, ...allHenchmen.filter(h => !henchmanPool.some(hp => hp.id === h.id))];

  // Normalize quotes (curly, single, double, german quotes)
  const normalizedQuotes = raw.replace(/[\u201c\u201d\"\u2018\u2019'„]/g, '"');
  const quotedMatches = [...normalizedQuotes.matchAll(/"([^"]+)"/g)].map((m) => normalizeRuleString(m[1]));

  let ledVillain: VillainGroup | undefined;
  let ledHenchman: HenchmanGroup | undefined;

  // 1. Explicit Henchman rules & compound clauses:
  // Shi'ar Henchmen (e.g. Deathbird: "Shi'ar Imperial Guard and any Shi'ar Henchmen")
  if ((lower.includes("shi'ar") || lower.includes("shiar")) && lower.includes("henchm")) {
    ledHenchman = selectMatchingGroup(
      henchmanPool,
      combinedHenchmen,
      (h) => {
        const hNorm = normalizeRuleString(h.name);
        return hNorm.includes('shiar') || hNorm.includes("shi'ar");
      },
      `Shi'ar Henchmen for "${raw}"`
    );
  }

  // Sentinel Henchmen (e.g. Onslaught: "Brotherhood and any Sentinel Henchmen")
  if (lower.includes('sentinel') && (lower.includes('henchm') || !lower.includes('sentinel territories'))) {
    ledHenchman = selectMatchingGroup(
      henchmanPool,
      combinedHenchmen,
      (h) => {
        const hNorm = normalizeRuleString(h.name);
        return hNorm.includes('sentinel');
      },
      `Sentinel Henchmen for "${raw}"`
    );
  }

  // Any <keyword> Henchmen / Any <keyword> Henchman Group
  const anyHenchMatch = lower.match(/(?:any\s+)?([a-z0-9'’\-]+)\s+henchm/i);
  if (!ledHenchman && anyHenchMatch) {
    const kw = normalizeRuleString(anyHenchMatch[1]);
    if (kw && kw !== 'any') {
      ledHenchman = selectMatchingGroup(
        henchmanPool,
        combinedHenchmen,
        (h) => {
          const hNorm = normalizeRuleString(h.name);
          return hNorm.includes(kw) || kw.includes(hNorm);
        },
        `"${kw}" Henchmen for "${raw}"`
      );
    }
  }

  // "Any Henchman Group" / "Any Henchmen"
  if (!ledHenchman && (lower.includes('any henchman group') || lower.includes('any henchmen group') || lower === 'any henchmen' || lower === 'any henchman')) {
    ledHenchman = selectMatchingGroup(
      henchmanPool,
      combinedHenchmen,
      () => true,
      `Any Henchman for "${raw}"`
    );
  }

  // 2. MLF alias (Stryfe leads MLF -> Mutant Liberation Front)
  if (lower === 'mlf' || lower.includes('mlf') || normRaw.includes('mutant liberation')) {
    ledVillain = selectMatchingGroup(
      villainPool,
      combinedVillains,
      (v) =>
        normalizeRuleString(v.name).includes('mutant liberation') || v.id.toLowerCase().includes('mlf'),
      `MLF Villain for "${raw}"`
    );
  }

  // 3. Quoted patterns like: Any "Sinister" Group, Any "Hydra" Group, Any "Brotherhood" or "X-Men" Villain Group
  if (quotedMatches.length > 0 && isAny) {
    if (lower.includes('henchm')) {
      if (!ledHenchman) {
        ledHenchman = selectMatchingGroup(
          henchmanPool,
          combinedHenchmen,
          (h) => {
            const hNorm = normalizeRuleString(h.name);
            return quotedMatches.some((q) => hNorm.includes(q));
          },
          `Quoted [${quotedMatches.join(', ')}] Henchmen for "${raw}"`
        );
      }
    } else {
      if (!ledVillain) {
        ledVillain = selectMatchingGroup(
          villainPool,
          combinedVillains,
          (v) => {
            const vNorm = normalizeRuleString(v.name);
            return quotedMatches.some((q) => vNorm.includes(q));
          },
          `Quoted [${quotedMatches.join(', ')}] Villain for "${raw}"`
        );
      }
    }
  }

  // 4. Unquoted "Any <keyword> Group" / "Any <keyword> Villain Group" (e.g. Any Hydra Group, Any Sinister Villain Group, Any Brotherhood Group)
  const anyKeywordMatch = lower.match(/any\s+([a-z0-9'’\-]+)(?:\s+villain)?\s+group/i);
  if (!ledVillain && anyKeywordMatch) {
    const kw = normalizeRuleString(anyKeywordMatch[1]);
    ledVillain = selectMatchingGroup(
      villainPool,
      combinedVillains,
      (v) => {
        const vNorm = normalizeRuleString(v.name);
        return vNorm.includes(kw) || kw.includes(vNorm);
      },
      `Any "${kw}" Villain for "${raw}"`
    );
  }

  // 5. "Any Villain Group" (Omega Red, Hank Pym Yellowjacket, Ego)
  if (!ledVillain && !ledHenchman && (lower.includes('any villain group') || lower === 'any villain')) {
    ledVillain = selectMatchingGroup(
      villainPool,
      combinedVillains,
      () => true,
      `Any Villain for "${raw}"`
    );
  }

  // 6. Match Primary Villain Group (e.g. Red Skull leading "HYDRA", Thanos leading "Infinity Gems", Magneto leading "Brotherhood")
  // For exact non-"Any" leads, match ONLY the exact group name.
  const primaryClause = lower.split(/[.,]|\badd\b|\bplus\b|\band\b/i)[0].trim();
  const normPrimary = normalizeRuleString(primaryClause);
  const cleanPrimary = normPrimary.replace(/s$/, '');

  if (!ledVillain) {
    ledVillain = selectMatchingGroup(
      villainPool,
      combinedVillains,
      (v) => {
        const vNorm = normalizeRuleString(v.name);
        const cleanV = vNorm.replace(/s$/, '');
        if (isAny) {
          return (
            vNorm === normRaw ||
            vNorm === normPrimary ||
            cleanV === cleanPrimary ||
            normRaw.includes(vNorm) ||
            (normPrimary.length > 3 && (vNorm.includes(normPrimary) || normPrimary.includes(vNorm)))
          );
        } else {
          return (
            vNorm === normRaw ||
            vNorm === normPrimary ||
            cleanV === cleanPrimary ||
            cleanV === normRaw.replace(/s$/, '')
          );
        }
      },
      `Primary Villain "${primaryClause}" for "${raw}"`
    );
  }

  // 7. Match Primary Henchman Group:
  // ONLY if ledHenchman was NOT set by compound clause AND NO ledVillain was matched
  if (!ledVillain && !ledHenchman) {
    ledHenchman = selectMatchingGroup(
      henchmanPool,
      combinedHenchmen,
      (h) => {
        const hNorm = normalizeRuleString(h.name);
        const cleanH = hNorm.replace(/s$/, '');
        return (
          hNorm === normRaw ||
          hNorm === normPrimary ||
          cleanH === cleanPrimary ||
          cleanH === normRaw.replace(/s$/, '') ||
          (lower.includes('henchm') && (hNorm.includes(normPrimary) || normPrimary.includes(hNorm)))
        );
      },
      `Primary Henchman "${primaryClause}" for "${raw}"`
    );
  }

  return {
    ledVillain,
    ledHenchman,
    description: raw,
  };
}

/**
 * Checks if a specific villain group is led by or required by the setup's Mastermind.
 */
export function isVillainLedByMastermind(
  villain: VillainGroup,
  _idx: number,
  mastermind: MastermindCard | undefined,
  _allVillains: VillainGroup[]
): boolean {
  if (!mastermind || !mastermind.alwaysLeads) return false;
  const raw = mastermind.alwaysLeads.trim();
  const lower = raw.toLowerCase();
  const isAny = lower.includes('any');
  const normLead = normalizeRuleString(raw);
  const normV = normalizeRuleString(villain.name);
  const cleanV = normV.replace(/s$/, '');

  // Special alias mapping like MLF <-> Mutant Liberation Front
  if ((lower === 'mlf' || lower.includes('mlf') || normLead.includes('mutant liberation')) && (normV.includes('mutant liberation') || villain.id.toLowerCase().includes('mlf'))) {
    return true;
  }

  // 1. Quoted check
  const normalizedQuotes = raw.replace(/[\u201c\u201d\"\u2018\u2019']/g, '"');
  const quotedMatches = [...normalizedQuotes.matchAll(/"([^"]+)"/g)].map((m) => normalizeRuleString(m[1]));
  if (quotedMatches.length > 0 && isAny) {
    if (quotedMatches.some((q) => normV.includes(q) || cleanV.includes(q))) {
      return true;
    }
  }

  // 2. Unquoted "Any <keyword> Group" / "Any <keyword> Villain Group"
  const anyKeywordMatch = lower.match(/any\s+([a-z0-9'’\-]+)(?:\s+villain)?\s+group/i);
  if (anyKeywordMatch) {
    const kw = normalizeRuleString(anyKeywordMatch[1]);
    if (kw && (normV.includes(kw) || kw.includes(normV))) return true;
  }

  // 3. "Any Villain Group"
  if (lower.includes('any villain group') || lower === 'any villain') {
    return true;
  }

  // 4. Exact / Non-"Any" matching:
  // If the card does NOT say "Any", it ONLY matches the exact named group (e.g. Red Skull leads "HYDRA", not "Hydra Elite")
  const primaryName = normalizeRuleString(lower.split(/[.,]|\band\s+(?:any|a)\b|\bplus\b|\badd\b/i)[0]);
  const cleanPrimary = primaryName.replace(/s$/, '');
  const cleanLead = normLead.replace(/s$/, '');

  if (normV === normLead || cleanV === cleanLead || normV === primaryName || cleanV === cleanPrimary) {
    return true;
  }

  // 5. Check villain's ledBy array
  if (villain.ledBy && villain.ledBy.some(m => {
    const normM = normalizeRuleString(m);
    const normMM = normalizeRuleString(mastermind.name);
    return normM === normMM || normMM.includes(normM) || normM.includes(normMM);
  })) {
    return true;
  }

  return false;
}

/**
 * Checks if a specific henchman group is led by or required by the setup's Mastermind.
 */
export function isHenchmanLedByMastermind(
  hench: HenchmanGroup,
  _idx: number,
  mastermind: MastermindCard | undefined,
  _allHenchmen: HenchmanGroup[]
): boolean {
  if (!mastermind || !mastermind.alwaysLeads) return false;
  const raw = mastermind.alwaysLeads.trim();
  const lower = raw.toLowerCase();
  const normH = normalizeRuleString(hench.name);
  const cleanH = normH.replace(/s$/, '');

  // 1. Compound clause for Sentinel Henchmen
  if (/and\s+(?:any|a)?\s*sentinel\s+henchm/i.test(lower) || (lower.includes('sentinel') && !lower.includes('sentinel territories'))) {
    if (normH.includes('sentinel')) return true;
  }

  // 2. Compound clause for Shi'ar Henchmen (e.g. Deathbird)
  if (lower.includes("shi'ar") || lower.includes("shiar")) {
    if (lower.includes("henchm") && (normH.includes("shi'ar") || normH.includes("shiar"))) {
      return true;
    }
  }

  // 3. Any Henchman Group / Any Henchmen
  if (lower.includes('any henchman group') || lower.includes('any henchmen group') || lower === 'any henchmen' || lower === 'any henchman') {
    return true;
  }

  // 4. Any <keyword> Henchmen
  const anyHenchMatch = lower.match(/(?:any\s+)?([a-z0-9'’\-]+)\s+henchm/i);
  if (anyHenchMatch) {
    const kw = normalizeRuleString(anyHenchMatch[1]);
    if (kw && kw !== 'any' && (normH.includes(kw) || kw.includes(normH))) {
      return true;
    }
  }

  // 5. Quoted henchman matches
  const quotedMatches = [...raw.matchAll(/\"([^\"]+)\"/g)].map((m) => normalizeRuleString(m[1]));
  if (quotedMatches.length > 0 && lower.includes('henchm')) {
    if (quotedMatches.some((q) => normH.includes(q))) return true;
  }

  // 6. Doombot Legions / Legion
  if (lower.includes('doombot')) {
    if (normH.includes('doombot')) return true;
  }

  // 7. Hand Ninjas
  if (lower.includes('hand ninjas') || lower.includes('the hand')) {
    if (normH.includes('hand') || normH.includes('ninja')) return true;
  }

  // 8. Direct Henchman exact name match (strictly exact, not loose substring of villain group)
  const primaryName = normalizeRuleString(lower.split(/[.,]|\band\s+(?:any|a)\b|\bplus\b|\badd\b/i)[0]);
  const cleanPrimary = primaryName.replace(/s$/, '');
  const cleanLead = normalizeRuleString(raw).replace(/s$/, '');

  if (primaryName && (normH === primaryName || cleanH === cleanPrimary || normH === normalizeRuleString(raw) || cleanH === cleanLead)) {
    return true;
  }

  return false;
}

export function generateSetup(
  settings: GeneratorSettings,
  data: { SCHEMES: SchemeCard[], MASTERMINDS: MastermindCard[], HEROES: HeroCard[], VILLAINS: VillainGroup[], HENCHMEN: HenchmanGroup[], EXPANSIONS: import("../types").Expansion[] },
  existingSetup?: ActiveSetup
): ActiveSetup {
  if (!settings.enabledExpansions || settings.enabledExpansions.length === 0) {
    throw new Error("Cannot randomize: No expansions are selected. Please select at least one expansion in the Expansions tab.");
  }

  // Build lookup of expansion ID to its universe
  const expUniverseMap = new Map<string, string>();
  data.EXPANSIONS.forEach((e) => {
    expUniverseMap.set(e.id, e.universe || 'Marvel');
  });

  // Filter expansions based on universeMode and selectedUniverses
  const allowedExpansions = data.EXPANSIONS.filter((e) => {
    const universe = e.universe || 'Marvel';
    if (settings.universeMode === 'single' || settings.universeMode === 'selected') {
      if (settings.selectedUniverses && settings.selectedUniverses.length > 0) {
        return settings.selectedUniverses.includes(universe as any);
      }
      return universe === 'Marvel';
    }
    return true;
  });

  const enabledExpSet = new Set(
    settings.enabledExpansions.length > 0
      ? settings.enabledExpansions.filter((id) =>
          allowedExpansions.some((ae) => ae.id === id)
        )
      : allowedExpansions.map((e) => e.id)
  );

  const excludedSet = new Set(settings.excludedCardIds);
  const includedSet = new Set(settings.includedCardIds || []);

  // Filter candidate card pools
  const matchesDifficulty = (s: SchemeCard) => {
    const allowed = settings.allowedDifficulties;
    if (!allowed || allowed.length === 0) return true;
    const sDiff = (s.difficulty || 'Moderate') as any;
    return allowed.includes(sDiff);
  };

  const filteredSchemesByDiff = (list: SchemeCard[]) => {
    return list.filter(matchesDifficulty);
  };

  const availableSchemes = data.SCHEMES.filter(
    (s) => enabledExpSet.has(s.expansion) && !excludedSet.has(s.id)
  );
  const baseSchemePool =
    availableSchemes.length > 0
      ? availableSchemes
      : data.SCHEMES.filter((s) => !excludedSet.has(s.id));
  let schemePool = filteredSchemesByDiff(baseSchemePool);

  if (schemePool.length === 0) {
    schemePool = baseSchemePool;
  }
  if (schemePool.length === 0) {
    const enabledOnly = data.SCHEMES.filter((s) => enabledExpSet.has(s.expansion));
    schemePool = filteredSchemesByDiff(enabledOnly);
  }
  if (schemePool.length === 0) {
    schemePool = data.SCHEMES.filter((s) => enabledExpSet.has(s.expansion));
  }
  if (schemePool.length === 0) {
    schemePool = data.SCHEMES;
  }

  let schemeError: string | undefined = undefined;
  if (schemePool.length === 0 && data.SCHEMES.length === 0) {
    schemeError = `No schemes available in database.`;
  }

  const availableMasterminds = data.MASTERMINDS.filter(
    (m) => enabledExpSet.has(m.expansion) && !excludedSet.has(m.id)
  );
  const mastermindPool =
    availableMasterminds.length > 0
      ? availableMasterminds
      : data.MASTERMINDS.filter((m) => !excludedSet.has(m.id));

  const availableHeroes = data.HEROES.filter(
    (h) => enabledExpSet.has(h.expansion) && !excludedSet.has(h.id)
  );
  const heroPool =
    availableHeroes.length >= 5
      ? availableHeroes
      : data.HEROES.filter((h) => !excludedSet.has(h.id));

  const availableVillains = data.VILLAINS.filter(
    (v) => enabledExpSet.has(v.expansion) && !excludedSet.has(v.id)
  );
  const villainPool =
    availableVillains.length > 0
      ? availableVillains
      : data.VILLAINS.filter((v) => !excludedSet.has(v.id));

  const availableHenchmen = data.HENCHMEN.filter(
    (h) => enabledExpSet.has(h.expansion) && !excludedSet.has(h.id)
  );
  const henchmanPool =
    availableHenchmen.length > 0
      ? availableHenchmen
      : data.HENCHMEN.filter((h) => !excludedSet.has(h.id));

  // Determine locked status
  const locked = existingSetup?.lockedSlots || {};

  // 2. Select Scheme
  let scheme: SchemeCard | null = null;
  if (locked.scheme && existingSetup?.scheme) {
    scheme = existingSetup.scheme;
  } else {
    const forcedScheme = schemePool.find((s) => includedSet.has(s.id));
    scheme = forcedScheme || (schemePool.length > 0 ? pickRandom(schemePool) : null);
  }

  // 3. Select Mastermind
  let mastermind: MastermindCard;
  if (locked.mastermind && existingSetup) {
    mastermind = existingSetup.mastermind;
  } else {
    const forcedMM = mastermindPool.find((m) => includedSet.has(m.id));
    mastermind = forcedMM || pickRandom(mastermindPool);
  }

  // Calculate deck slots needed
  const reqs = calculateBaseRequirements(settings.playerCount, scheme);

  // 4. Select Villains
  const selectedVillains: (VillainGroup | undefined)[] = [];
  const existingVillains = existingSetup?.villains || [];

  for (let i = 0; i < reqs.villainGroupsCount; i++) {
    if (locked.villains?.[i] && existingVillains[i]) {
      selectedVillains[i] = existingVillains[i];
    }
  }

  // Handle "Always Leads" requirement/preference
  // Default to Always Include ('guarantee') if unset
  const effectiveAlwaysLeadsRule = settings.alwaysLeadsRule || 'guarantee';
  let shouldIncludeAlwaysLeads = false;
  if (settings.playerCount > 1) {
    if (effectiveAlwaysLeadsRule === 'ignore' || (effectiveAlwaysLeadsRule as any) === 'random') {
      shouldIncludeAlwaysLeads = false;
    } else if (effectiveAlwaysLeadsRule === 'prioritize') {
      shouldIncludeAlwaysLeads = Math.random() < 0.8;
    } else {
      // 'guarantee', 'balanced', or default -> Always Include
      shouldIncludeAlwaysLeads = true;
    }
  } else {
    // 1-player (solo): check if the user configured not to force Always Leads in Solo play
    if (!settings.ignoreAlwaysLeadsInSolo) {
      if (effectiveAlwaysLeadsRule === 'ignore' || (effectiveAlwaysLeadsRule as any) === 'random') {
        shouldIncludeAlwaysLeads = false;
      } else if (effectiveAlwaysLeadsRule === 'prioritize') {
        shouldIncludeAlwaysLeads = Math.random() < 0.8;
      } else {
        // 'guarantee', 'balanced', or default -> Always Include in Solo
        shouldIncludeAlwaysLeads = true;
      }
    }
  }

  const leadsResolution = resolveAlwaysLeads(
    mastermind.alwaysLeads,
    villainPool,
    henchmanPool,
    data.VILLAINS,
    data.HENCHMEN
  );

  if (shouldIncludeAlwaysLeads && leadsResolution.ledVillain) {
    const ledGroup = leadsResolution.ledVillain;
    const isLockedLedPresent = selectedVillains.some(
      (v, idx) => v && locked.villains?.[idx] && (v.id === ledGroup.id || isVillainLedByMastermind(v, idx, mastermind, selectedVillains.filter(Boolean) as VillainGroup[]))
    );
    const isExactGroupPresent = selectedVillains.some(
      (v) => v && v.id === ledGroup.id
    );

    if (!isLockedLedPresent && !isExactGroupPresent) {
      // 1. Look for an empty slot
      let targetIdx = Array.from(
        { length: reqs.villainGroupsCount },
        (_, i) => i
      ).find((i) => !selectedVillains[i]);

      // 2. Look for an unlocked slot if no empty slot exists
      if (targetIdx === undefined) {
        targetIdx = Array.from(
          { length: reqs.villainGroupsCount },
          (_, i) => i
        ).find((i) => !locked.villains?.[i]);
      }

      // 3. Even if all are locked, cycle one slot (the last slot) to obey Always Leads
      if (targetIdx === undefined) {
        targetIdx = reqs.villainGroupsCount - 1;
      }

      if (targetIdx !== undefined && targetIdx >= 0 && targetIdx < reqs.villainGroupsCount) {
        selectedVillains[targetIdx] = ledGroup;
      }
    }
  }

  // Scheme specific required group (e.g. Skrulls)
  if (scheme && scheme.requiresSpecificGroup) {
    const reqGroups = scheme.requiresSpecificGroup.split(',').map(s => s.trim().toLowerCase());
    
    for (const reqGroup of reqGroups) {
      const reqVillain =
        villainPool.find(v => v.name.toLowerCase().includes(reqGroup)) ||
        data.VILLAINS.find(v => v.name.toLowerCase().includes(reqGroup));

      const alreadySelected = new Set(selectedVillains.filter(Boolean).map(v => v!.id));
      if (reqVillain && reqVillain.id && !alreadySelected.has(reqVillain.id)) {
        let emptyIdx = Array.from(
          { length: reqs.villainGroupsCount },
          (_, i) => i
        ).find((i) => !selectedVillains[i]);
        
        if (emptyIdx === undefined) {
          emptyIdx = Array.from({ length: reqs.villainGroupsCount }, (_, i) => i).find((i) => {
             const v = selectedVillains[i];
             if (!v) return true;
             if (leadsResolution.ledVillain && v.id === leadsResolution.ledVillain.id) {
               return false;
             }
             return !locked.villains?.[i];
          });
          if (emptyIdx === undefined) emptyIdx = reqs.villainGroupsCount - 1;
        }

        if (emptyIdx !== undefined && emptyIdx >= 0 && emptyIdx < reqs.villainGroupsCount) {
          selectedVillains[emptyIdx] = reqVillain;
        }
      }
    }
  }

  // Fill remaining villain slots with STRICT uniqueness
  const finalSelectedVillainIds = new Set(
    selectedVillains.filter(Boolean).map((v) => v!.id)
  );
  const remainingVillains = shuffle(
    villainPool.filter((v) => !finalSelectedVillainIds.has(v.id))
  );
  const fallbackVillains = shuffle(
    data.VILLAINS.filter((v) => !finalSelectedVillainIds.has(v.id))
  );
  let vIndex = 0;
  let fbVIndex = 0;
  for (let i = 0; i < reqs.villainGroupsCount; i++) {
    if (!selectedVillains[i]) {
      let nextV = remainingVillains[vIndex++];
      if (!nextV) {
        nextV = fallbackVillains[fbVIndex++];
      }
      if (nextV) {
        selectedVillains[i] = nextV;
        finalSelectedVillainIds.add(nextV.id);
      }
    }
  }

  // 5. Select Henchmen
  const selectedHenchmen: (HenchmanGroup | undefined)[] = [];
  const existingHenchmen = existingSetup?.henchmen || [];

  for (let i = 0; i < reqs.henchmanGroupsCount; i++) {
    if (locked.henchmen?.[i] && existingHenchmen[i]) {
      selectedHenchmen[i] = existingHenchmen[i];
    }
  }

  if (shouldIncludeAlwaysLeads && leadsResolution.ledHenchman) {
    const ledHench = leadsResolution.ledHenchman;
    const isLockedLedPresent = selectedHenchmen.some(
      (h, idx) => h && locked.henchmen?.[idx] && (h.id === ledHench.id || isHenchmanLedByMastermind(h, idx, mastermind, selectedHenchmen.filter(Boolean) as HenchmanGroup[]))
    );
    const isExactHenchPresent = selectedHenchmen.some(
      (h) => h && h.id === ledHench.id
    );

    if (!isLockedLedPresent && !isExactHenchPresent) {
      // 1. Look for an empty slot
      let targetIdx = Array.from(
        { length: reqs.henchmanGroupsCount },
        (_, i) => i
      ).find((i) => !selectedHenchmen[i]);

      // 2. Look for an unlocked slot if no empty slot exists
      if (targetIdx === undefined) {
        targetIdx = Array.from(
          { length: reqs.henchmanGroupsCount },
          (_, i) => i
        ).find((i) => !locked.henchmen?.[i]);
      }

      // 3. Even if all are locked, cycle one slot (the last slot) to obey Always Leads
      if (targetIdx === undefined) {
        targetIdx = reqs.henchmanGroupsCount - 1;
      }

      if (targetIdx !== undefined && targetIdx >= 0 && targetIdx < reqs.henchmanGroupsCount) {
        selectedHenchmen[targetIdx] = ledHench;
      }
    }
  }

  if (scheme && (scheme as any).requiresSpecificHenchman) {
    const reqGroups = (scheme as any).requiresSpecificHenchman.split(',').map((s: string) => s.trim().toLowerCase());
    
    for (const reqGroup of reqGroups) {
      const reqHench =
        henchmanPool.find(h => h.name.toLowerCase().includes(reqGroup)) ||
        data.HENCHMEN.find(h => h.name.toLowerCase().includes(reqGroup));

      const alreadySelected = new Set(selectedHenchmen.filter(Boolean).map(h => h!.id));
      if (reqHench && reqHench.id && !alreadySelected.has(reqHench.id)) {
        let emptyIdx = Array.from(
          { length: reqs.henchmanGroupsCount },
          (_, i) => i
        ).find((i) => !selectedHenchmen[i]);
        
        if (emptyIdx === undefined) {
          emptyIdx = Array.from({ length: reqs.henchmanGroupsCount }, (_, i) => i).find((i) => {
            const h = selectedHenchmen[i];
            if (!h) return true;
            if (leadsResolution.ledHenchman && h.id === leadsResolution.ledHenchman.id) return false;
            return !locked.henchmen?.[i];
          });
          if (emptyIdx === undefined) emptyIdx = reqs.henchmanGroupsCount - 1;
        }

        if (emptyIdx !== undefined && emptyIdx >= 0 && emptyIdx < reqs.henchmanGroupsCount) {
          selectedHenchmen[emptyIdx] = reqHench;
        }
      }
    }
  }

  // Fill remaining henchmen with STRICT uniqueness
  const finalSelectedHenchIds = new Set(
    selectedHenchmen.filter(Boolean).map((h) => h!.id)
  );
  const remainingHenchmen = shuffle(
    henchmanPool.filter((h) => !finalSelectedHenchIds.has(h.id))
  );
  const fallbackHenchmen = shuffle(
    data.HENCHMEN.filter((h) => !finalSelectedHenchIds.has(h.id))
  );
  let hIndex = 0;
  let fbHIndex = 0;
  for (let i = 0; i < reqs.henchmanGroupsCount; i++) {
    if (!selectedHenchmen[i]) {
      let nextH = remainingHenchmen[hIndex++];
      if (!nextH) {
        nextH = fallbackHenchmen[fbHIndex++];
      }
      if (nextH) {
        selectedHenchmen[i] = nextH;
        finalSelectedHenchIds.add(nextH.id);
      }
    }
  }

  // 6. Select Heroes with STRICT uniqueness
  const selectedHeroes: (HeroCard | undefined)[] = [];
  const existingHeroes = existingSetup?.heroes || [];

  for (let i = 0; i < reqs.heroCount; i++) {
    if (locked.heroes?.[i] && existingHeroes[i]) {
      selectedHeroes[i] = existingHeroes[i];
    }
  }

  const selectedHeroIds = new Set(
    selectedHeroes.filter(Boolean).map((h) => h!.id)
  );

  const forceHeroes = heroPool.filter(
    (h) => includedSet.has(h.id) && !selectedHeroIds.has(h.id)
  );
  let fIdx = 0;

  const remainingHeroes = shuffle(
    heroPool.filter((h) => !selectedHeroIds.has(h.id))
  );
  const fallbackHeroes = shuffle(
    data.HEROES.filter((h) => !selectedHeroIds.has(h.id))
  );
  let heroIdx = 0;
  let fbHeroIdx = 0;

  for (let i = 0; i < reqs.heroCount; i++) {
    if (!selectedHeroes[i]) {
      if (fIdx < forceHeroes.length) {
        const fh = forceHeroes[fIdx++];
        selectedHeroes[i] = fh;
        selectedHeroIds.add(fh.id);
      } else {
        let nextHero = remainingHeroes[heroIdx++];
        if (!nextHero) {
          nextHero = fallbackHeroes[fbHeroIdx++];
        }
        if (nextHero) {
          selectedHeroes[i] = nextHero;
          selectedHeroIds.add(nextHero.id);
        }
      }
    }
  }

  // Strict Uniqueness Sanitization for all groups
  const uniqueVillains = sanitizeUniqueGroups(selectedVillains, villainPool, data.VILLAINS, locked.villains);
  const uniqueHenchmen = sanitizeUniqueGroups(selectedHenchmen, henchmanPool, data.HENCHMEN, locked.henchmen);
  const uniqueHeroes = sanitizeUniqueGroups(selectedHeroes, heroPool, data.HEROES, locked.heroes);

  // 7. Sort only if NO slots are locked, to prevent index drift on locked slots
  const hasLockedHeroes = Object.values(locked.heroes || {}).some(Boolean);
  const hasLockedVillains = Object.values(locked.villains || {}).some(Boolean);
  const hasLockedHenchmen = Object.values(locked.henchmen || {}).some(Boolean);

  const sortedHeroes = hasLockedHeroes
    ? uniqueHeroes
    : [...uniqueHeroes].sort((a, b) => a.name.localeCompare(b.name));

  const sortedVillains = hasLockedVillains
    ? uniqueVillains
    : [...uniqueVillains].sort((a, b) => a.name.localeCompare(b.name));

  const sortedHenchmen = hasLockedHenchmen
    ? uniqueHenchmen
    : [...uniqueHenchmen].sort((a, b) => a.name.localeCompare(b.name));

  // Build final locked slots map.
  // If all existing villains / henchmen / heroes were locked, newly added slots should also be locked.
  const allExistingVillainsLocked =
    existingVillains.length > 0 &&
    existingVillains.every((_, i) => Boolean(locked.villains?.[i]));

  const allExistingHenchLocked =
    existingHenchmen.length > 0 &&
    existingHenchmen.every((_, i) => Boolean(locked.henchmen?.[i]));

  const allExistingHeroesLocked =
    existingHeroes.length > 0 &&
    existingHeroes.every((_, i) => Boolean(locked.heroes?.[i]));

  const finalLockedVillains: { [idx: number]: boolean } = { ...(locked.villains || {}) };
  if (allExistingVillainsLocked) {
    sortedVillains.forEach((_, i) => {
      finalLockedVillains[i] = true;
    });
  }

  const finalLockedHenchmen: { [idx: number]: boolean } = { ...(locked.henchmen || {}) };
  if (allExistingHenchLocked) {
    sortedHenchmen.forEach((_, i) => {
      finalLockedHenchmen[i] = true;
    });
  }

  const finalLockedHeroes: { [idx: number]: boolean } = { ...(locked.heroes || {}) };
  if (allExistingHeroesLocked) {
    sortedHeroes.forEach((_, i) => {
      finalLockedHeroes[i] = true;
    });
  }

  const finalLockedSlots: typeof locked = {
    ...locked,
    villains: finalLockedVillains,
    henchmen: finalLockedHenchmen,
    heroes: finalLockedHeroes,
  };

  // 8. Calculate deck breakdown and setup notes
  const villainCardsTotal = sortedVillains.length * 8;
  const henchmenCardsTotal =
    settings.playerCount === 1 ? 2 : sortedHenchmen.length * 10;
  
  const extraCardsTotal = reqs.extraCards.reduce((acc, c) => acc + c.count, 0);

  const villainDeckTotal =
    villainCardsTotal +
    henchmenCardsTotal +
    reqs.bystandersCount +
    reqs.masterStrikes +
    reqs.twistsCount +
    extraCardsTotal;

  const heroDeckCount = sortedHeroes.length * 14;

  const specialNotes: string[] = [];

  if (mastermind.alwaysLeads) {
    const includedGroups: string[] = [];
    if (leadsResolution.ledVillain && sortedVillains.some((v) => v.id === leadsResolution.ledVillain!.id)) {
      includedGroups.push(leadsResolution.ledVillain.name);
    }
    if (leadsResolution.ledHenchman && sortedHenchmen.some((h) => h.id === leadsResolution.ledHenchman!.id)) {
      includedGroups.push(leadsResolution.ledHenchman.name);
    }

    if (includedGroups.length > 0) {
      specialNotes.push(
        `Mastermind ${mastermind.name} leads: ${mastermind.alwaysLeads} (${includedGroups.join(' & ')} Included).`
      );
    } else {
      specialNotes.push(
        `Mastermind ${mastermind.name} normally leads: ${mastermind.alwaysLeads}.`
      );
    }
  }

  if (scheme) {
    if (scheme.setupRule) {
      specialNotes.push(`Scheme Setup Rule: ${scheme.setupRule}`);
    }

    if (scheme.specialRules) {
      specialNotes.push(`Scheme Special Rules: ${scheme.specialRules}`);
    }
  }

  reqs.extraCards.forEach((ec) => {
    specialNotes.push(`Setup Modification: ${ec.name} (${ec.count} cards) - ${ec.description}`);
  });

  if (scheme) {
    if (scheme.extraHeroes) {
      specialNotes.push(
        `Scheme adds ${scheme.extraHeroes} extra Hero group(s) to the Hero Deck (${heroDeckCount} cards total).`
      );
    }

    if (scheme.extraVillains) {
      specialNotes.push(
        `Scheme adds ${scheme.extraVillains} extra Villain group(s) to the Villain Deck.`
      );
    }

    const isBreachNexus = /breach the nexus of all realities/i.test(scheme.name);
    const player12VillainMatch = [
      scheme.setupRule || '',
      scheme.specialRules || '',
      scheme.twistEffect || '',
      scheme.evilWins || '',
    ].join(' ').match(/(?:1-2|1 or 2)\s*players?:\s*(?:use|add)\s*(\d+)\s*villain\s*groups?/i);

    if ((isBreachNexus || player12VillainMatch) && settings.playerCount <= 2) {
      specialNotes.push(
        `Scheme Special Setup (1-2 Players): Added an additional Villain Group (3 Villain Groups total for separate Realities).`
      );
    }

    if (scheme.extraHenchmen) {
      specialNotes.push(
        `Scheme adds ${scheme.extraHenchmen} extra Henchman group(s) to the Villain Deck.`
      );
    }
  }

  if (settings.playerCount === 1) {
    specialNotes.push(
      'Solo Mode (1P): 1 Bystander in the Villain Deck. Use 4 Henchmen total — 2 are shuffled into the Villain Deck and 2 start on the first two city spaces (Sewers and Bank). Return the remaining 6 Henchmen to the box.'
    );
  }

  const deckBreakdown: DeckBreakdown = {
    heroDeckCount,
    heroCount: sortedHeroes.length,
    villainDeckTotal,
    villainCards: villainCardsTotal,
    henchmenCards: henchmenCardsTotal,
    bystanders: reqs.bystandersCount,
    masterStrikes: reqs.masterStrikes,
    schemeTwists: reqs.twistsCount,
    extraCards: reqs.extraCards,
    cityHenchmen: settings.playerCount === 1 ? 2 : 0,
  };

  return {
    id: `setup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    playerCount: settings.playerCount,
    soloVariant: settings.soloVariant,
    mastermind,
    scheme: scheme ? {
      ...scheme,
      twists: reqs.twistsCount,
    } : null,
    schemeError,
    heroes: sortedHeroes,
    villains: sortedVillains,
    henchmen: sortedHenchmen,
    bystandersCount: reqs.bystandersCount,
    masterStrikesCount: reqs.masterStrikes,
    twistsCount: reqs.twistsCount,
    lockedSlots: finalLockedSlots,
    specialSetupNotes: specialNotes,
    deckBreakdown,
  };
}

export function calculateGameScore(params: {
  mastermindTacticsDefeated: number;
  villainCardsVPTotal: number;
  rescuedBystandersCount: number;
  escapedVillainsPenaltyCount: number;
  carriedOffBystandersPenaltyCount: number;
  schemeTwistsInEscapePenaltyCount: number;
  bonusPoints: number;
}): number {
  const tacticsVP = params.mastermindTacticsDefeated * 5;
  const positives =
    tacticsVP +
    params.villainCardsVPTotal +
    params.rescuedBystandersCount * 1 +
    params.bonusPoints;

  const penalties =
    params.escapedVillainsPenaltyCount * 4 +
    params.carriedOffBystandersPenaltyCount * 1 +
    params.schemeTwistsInEscapePenaltyCount * 3;

  return positives - penalties;
}

/**
 * Updates an active setup when the Mastermind is changed (via reroll or picker).
 * Automatically updates Villains and Henchmen based on the new Mastermind's "Always Leads" requirements,
 * respecting locked slots and refreshing lingering old mastermind requirements when appropriate.
 */
export function updateSetupForMastermind(
  setup: ActiveSetup,
  newMastermind: MastermindCard,
  settings: GeneratorSettings,
  data: {
    SCHEMES: SchemeCard[];
    MASTERMINDS: MastermindCard[];
    HEROES: HeroCard[];
    VILLAINS: VillainGroup[];
    HENCHMEN: HenchmanGroup[];
    EXPANSIONS: import('../types').Expansion[];
  }
): ActiveSetup {
  const oldMastermind = setup.mastermind;
  const updatedVillains = [...setup.villains];
  const updatedHenchmen = [...setup.henchmen];

  // Map allowed expansions based on settings / universe
  const allowedExpansions = data.EXPANSIONS.filter((e) => {
    const universe = e.universe || 'Marvel';
    if (settings.universeMode === 'single' || settings.universeMode === 'selected') {
      if (settings.selectedUniverses && settings.selectedUniverses.length > 0) {
        return settings.selectedUniverses.includes(universe as any);
      }
      return universe === 'Marvel';
    }
    return true;
  });

  const enabledExpSet = new Set(
    settings.enabledExpansions.length > 0
      ? settings.enabledExpansions.filter((id) =>
          allowedExpansions.some((ae) => ae.id === id)
        )
      : allowedExpansions.map((e) => e.id)
  );

  const excludedSet = new Set(settings.excludedCardIds);

  const villainPool = data.VILLAINS.filter(
    (v) => enabledExpSet.has(v.expansion) && !excludedSet.has(v.id)
  );
  const henchmanPool = data.HENCHMEN.filter(
    (h) => enabledExpSet.has(h.expansion) && !excludedSet.has(h.id)
  );

  // Check Always Leads rule
  const effectiveAlwaysLeadsRule = settings.alwaysLeadsRule || 'guarantee';
  let shouldIncludeAlwaysLeads = false;
  if (setup.playerCount > 1) {
    if (effectiveAlwaysLeadsRule === 'ignore' || (effectiveAlwaysLeadsRule as any) === 'random') {
      shouldIncludeAlwaysLeads = false;
    } else if (effectiveAlwaysLeadsRule === 'prioritize') {
      shouldIncludeAlwaysLeads = Math.random() < 0.8;
    } else {
      // 'guarantee', 'balanced', or default -> Always Include
      shouldIncludeAlwaysLeads = true;
    }
  } else {
    // 1-player (solo): check if the user configured not to force Always Leads in Solo play
    if (!settings.ignoreAlwaysLeadsInSolo) {
      if (effectiveAlwaysLeadsRule === 'ignore' || (effectiveAlwaysLeadsRule as any) === 'random') {
        shouldIncludeAlwaysLeads = false;
      } else if (effectiveAlwaysLeadsRule === 'prioritize') {
        shouldIncludeAlwaysLeads = Math.random() < 0.8;
      } else {
        shouldIncludeAlwaysLeads = true;
      }
    }
  }

  const leadsResolution = resolveAlwaysLeads(
    newMastermind.alwaysLeads,
    villainPool,
    henchmanPool,
    data.VILLAINS,
    data.HENCHMEN
  );

  const oldLeadsResolution = resolveAlwaysLeads(
    oldMastermind?.alwaysLeads,
    villainPool,
    henchmanPool,
    data.VILLAINS,
    data.HENCHMEN
  );

  if (shouldIncludeAlwaysLeads) {
    // 1. Update Villains for new Mastermind
    if (leadsResolution.ledVillain) {
      const targetVillain = leadsResolution.ledVillain;
      const isLockedLedPresent = updatedVillains.some(
        (v, idx) =>
          v &&
          setup.lockedSlots?.villains?.[idx] &&
          (v.id === targetVillain.id ||
            isVillainLedByMastermind(v, idx, newMastermind, updatedVillains))
      );
      const isExactGroupPresent = updatedVillains.some(
        (v) => v && v.id === targetVillain.id
      );

      if (!isLockedLedPresent && !isExactGroupPresent) {
        // Priority 1: An unlocked slot that was led by the old Mastermind
        let targetIdx = updatedVillains.findIndex(
          (v, idx) =>
            !setup.lockedSlots?.villains?.[idx] &&
            ((oldMastermind &&
              isVillainLedByMastermind(v, idx, oldMastermind, updatedVillains)) ||
              (oldLeadsResolution.ledVillain &&
                v.id === oldLeadsResolution.ledVillain.id))
        );

        // Priority 2: Any unlocked slot
        if (targetIdx === -1) {
          targetIdx = updatedVillains.findIndex(
            (_, idx) => !setup.lockedSlots?.villains?.[idx]
          );
        }

        // Priority 3: Fallback to last slot if all locked
        if (targetIdx === -1 && updatedVillains.length > 0) {
          targetIdx = updatedVillains.length - 1;
        }

        if (targetIdx !== -1) {
          updatedVillains[targetIdx] = targetVillain;
        }
      }
    } else {
      // If new Mastermind does NOT lead a villain, and an unlocked slot was led by old Mastermind,
      // refresh that slot with another random villain group so the old led group doesn't linger
      if (oldMastermind && (oldLeadsResolution.ledVillain || oldMastermind.alwaysLeads)) {
        const currentVillainIds = new Set(
          updatedVillains.filter(Boolean).map((v) => v.id)
        );
        const availableVillains = villainPool.filter(
          (v) => !currentVillainIds.has(v.id)
        );
        const poolToUse =
          availableVillains.length > 0
            ? availableVillains
            : data.VILLAINS.filter((v) => !currentVillainIds.has(v.id));
        if (poolToUse.length > 0) {
          for (let i = 0; i < updatedVillains.length; i++) {
            if (
              !setup.lockedSlots?.villains?.[i] &&
              (isVillainLedByMastermind(
                updatedVillains[i],
                i,
                oldMastermind,
                updatedVillains
              ) ||
                (oldLeadsResolution.ledVillain &&
                  updatedVillains[i].id === oldLeadsResolution.ledVillain.id))
            ) {
              const replacement =
                poolToUse[Math.floor(Math.random() * poolToUse.length)];
              updatedVillains[i] = replacement;
              currentVillainIds.add(replacement.id);
            }
          }
        }
      }
    }

    // 2. Update Henchmen for new Mastermind
    if (leadsResolution.ledHenchman) {
      const targetHenchman = leadsResolution.ledHenchman;
      const isLockedLedPresent = updatedHenchmen.some(
        (h, idx) =>
          h &&
          setup.lockedSlots?.henchmen?.[idx] &&
          (h.id === targetHenchman.id ||
            isHenchmanLedByMastermind(h, idx, newMastermind, updatedHenchmen))
      );
      const isExactHenchPresent = updatedHenchmen.some(
        (h) => h && h.id === targetHenchman.id
      );

      if (!isLockedLedPresent && !isExactHenchPresent) {
        // Priority 1: An unlocked slot that was led by the old Mastermind
        let targetIdx = updatedHenchmen.findIndex(
          (h, idx) =>
            !setup.lockedSlots?.henchmen?.[idx] &&
            ((oldMastermind &&
              isHenchmanLedByMastermind(h, idx, oldMastermind, updatedHenchmen)) ||
              (oldLeadsResolution.ledHenchman &&
                h.id === oldLeadsResolution.ledHenchman.id))
        );

        // Priority 2: Any unlocked slot
        if (targetIdx === -1) {
          targetIdx = updatedHenchmen.findIndex(
            (_, idx) => !setup.lockedSlots?.henchmen?.[idx]
          );
        }

        // Priority 3: Fallback to last slot if all locked
        if (targetIdx === -1 && updatedHenchmen.length > 0) {
          targetIdx = updatedHenchmen.length - 1;
        }

        if (targetIdx !== -1) {
          updatedHenchmen[targetIdx] = targetHenchman;
        }
      }
    } else {
      // If new Mastermind does NOT lead a henchman, and an unlocked slot was led by old Mastermind,
      // refresh that slot with another random henchman group so the old led group doesn't linger
      if (oldMastermind && (oldLeadsResolution.ledHenchman || oldMastermind.alwaysLeads)) {
        const currentHenchIds = new Set(
          updatedHenchmen.filter(Boolean).map((h) => h.id)
        );
        const availableHenchmen = henchmanPool.filter(
          (h) => !currentHenchIds.has(h.id)
        );
        const poolToUse =
          availableHenchmen.length > 0
            ? availableHenchmen
            : data.HENCHMEN.filter((h) => !currentHenchIds.has(h.id));
        if (poolToUse.length > 0) {
          for (let i = 0; i < updatedHenchmen.length; i++) {
            if (
              !setup.lockedSlots?.henchmen?.[i] &&
              (isHenchmanLedByMastermind(
                updatedHenchmen[i],
                i,
                oldMastermind,
                updatedHenchmen
              ) ||
                (oldLeadsResolution.ledHenchman &&
                  updatedHenchmen[i].id === oldLeadsResolution.ledHenchman.id))
            ) {
              const replacement =
                poolToUse[Math.floor(Math.random() * poolToUse.length)];
              updatedHenchmen[i] = replacement;
              currentHenchIds.add(replacement.id);
            }
          }
        }
      }
    }
  }

  // Recalculate deck breakdown and setup notes
  const reqs = calculateBaseRequirements(setup.playerCount, setup.scheme);
  const villainCardsTotal = updatedVillains.length * 8;
  const henchmenCardsTotal =
    setup.playerCount === 1 ? 2 : updatedHenchmen.length * 10;
  const extraCardsTotal = (
    setup.deckBreakdown?.extraCards || reqs.extraCards
  ).reduce((acc, c) => acc + c.count, 0);

  const villainDeckTotal =
    villainCardsTotal +
    henchmenCardsTotal +
    (setup.deckBreakdown?.bystanders ?? reqs.bystandersCount) +
    (setup.deckBreakdown?.masterStrikes ?? reqs.masterStrikes) +
    (setup.deckBreakdown?.schemeTwists ?? reqs.twistsCount) +
    extraCardsTotal;

  const specialNotes: string[] = [];

  if (newMastermind.alwaysLeads) {
    const includedGroups: string[] = [];
    if (
      leadsResolution.ledVillain &&
      updatedVillains.some((v) => v.id === leadsResolution.ledVillain!.id)
    ) {
      includedGroups.push(leadsResolution.ledVillain.name);
    }
    if (
      leadsResolution.ledHenchman &&
      updatedHenchmen.some((h) => h.id === leadsResolution.ledHenchman!.id)
    ) {
      includedGroups.push(leadsResolution.ledHenchman.name);
    }

    if (includedGroups.length > 0) {
      specialNotes.push(
        `Mastermind ${newMastermind.name} leads: ${newMastermind.alwaysLeads} (${includedGroups.join(
          ' & '
        )} Included).`
      );
    } else {
      specialNotes.push(
        `Mastermind ${newMastermind.name} normally leads: ${newMastermind.alwaysLeads}.`
      );
    }
  }

  if (setup.scheme.setupRule) {
    specialNotes.push(`Scheme Setup Rule: ${setup.scheme.setupRule}`);
  }

  if (setup.scheme.specialRules) {
    specialNotes.push(`Scheme Special Rules: ${setup.scheme.specialRules}`);
  }

  (setup.deckBreakdown?.extraCards || reqs.extraCards).forEach((ec) => {
    specialNotes.push(
      `Setup Modification: ${ec.name} (${ec.count} cards) - ${ec.description}`
    );
  });

  const sanitizedVillains = sanitizeUniqueGroups(updatedVillains, villainPool, data.VILLAINS, setup.lockedSlots?.villains);
  const sanitizedHenchmen = sanitizeUniqueGroups(updatedHenchmen, henchmanPool, data.HENCHMEN, setup.lockedSlots?.henchmen);

  return {
    ...setup,
    mastermind: newMastermind,
    villains: sanitizedVillains,
    henchmen: sanitizedHenchmen,
    specialSetupNotes: specialNotes,
    deckBreakdown: {
      ...setup.deckBreakdown,
      villainCards: villainCardsTotal,
      henchmenCards: henchmenCardsTotal,
      villainDeckTotal,
    },
  };
}

/**
 * Updates an active setup when the Scheme is changed (via reroll or picker).
 * Adjusts required counts, scheme requirements, and deck breakdown.
 */
export function updateSetupForScheme(
  setup: ActiveSetup,
  newScheme: SchemeCard,
  settings: GeneratorSettings,
  data: {
    SCHEMES: SchemeCard[];
    MASTERMINDS: MastermindCard[];
    HEROES: HeroCard[];
    VILLAINS: VillainGroup[];
    HENCHMEN: HenchmanGroup[];
    EXPANSIONS: import('../types').Expansion[];
  }
): ActiveSetup {
  if (!newScheme) return setup;
  const reqs = calculateBaseRequirements(setup.playerCount, newScheme);

  // Map allowed expansions based on settings / universe
  const allowedExpansions = data.EXPANSIONS.filter((e) => {
    const universe = e.universe || 'Marvel';
    if (settings.universeMode === 'single' || settings.universeMode === 'selected') {
      if (settings.selectedUniverses && settings.selectedUniverses.length > 0) {
        return settings.selectedUniverses.includes(universe as any);
      }
      return universe === 'Marvel';
    }
    return true;
  });

  const enabledExpSet = new Set(
    settings.enabledExpansions.length > 0
      ? settings.enabledExpansions.filter((id) =>
          allowedExpansions.some((ae) => ae.id === id)
        )
      : allowedExpansions.map((e) => e.id)
  );

  const excludedSet = new Set(settings.excludedCardIds);

  const heroPool = data.HEROES.filter(
    (h) => enabledExpSet.has(h.expansion) && !excludedSet.has(h.id)
  );
  const villainPool = data.VILLAINS.filter(
    (v) => enabledExpSet.has(v.expansion) && !excludedSet.has(v.id)
  );
  const henchmanPool = data.HENCHMEN.filter(
    (h) => enabledExpSet.has(h.expansion) && !excludedSet.has(h.id)
  );

  const updatedHeroes = [...setup.heroes];
  const updatedVillains = [...setup.villains];
  const updatedHenchmen = [...setup.henchmen];

  // Adjust heroes count if scheme modifies it
  if (updatedHeroes.length < reqs.heroCount) {
    const currentHeroIds = new Set(updatedHeroes.map((h) => h.id));
    const avail = heroPool.filter((h) => !currentHeroIds.has(h.id));
    while (updatedHeroes.length < reqs.heroCount && avail.length > 0) {
      const nextH = avail.pop()!;
      updatedHeroes.push(nextH);
    }
  } else if (updatedHeroes.length > reqs.heroCount) {
    while (updatedHeroes.length > reqs.heroCount) {
      let removeIdx = -1;
      for (let i = updatedHeroes.length - 1; i >= 0; i--) {
        const isLocked = Boolean(setup.lockedSlots?.heroes?.[i]);
        if (!isLocked) {
          removeIdx = i;
          break;
        }
      }
      if (removeIdx === -1) {
        removeIdx = updatedHeroes.length - 1;
      }
      updatedHeroes.splice(removeIdx, 1);
    }
  }

  // Adjust villains count if scheme modifies it (e.g. scheme with +1 Villain Group re-rolled to standard)
  if (updatedVillains.length < reqs.villainGroupsCount) {
    const currentVIds = new Set(updatedVillains.map((v) => v.id));
    const avail = villainPool.filter((v) => !currentVIds.has(v.id));
    while (updatedVillains.length < reqs.villainGroupsCount && avail.length > 0) {
      const nextV = avail.pop()!;
      updatedVillains.push(nextV);
    }
  } else if (updatedVillains.length > reqs.villainGroupsCount) {
    // When reducing villain slots, ensure we NEVER remove a group led by the Mastermind
    while (updatedVillains.length > reqs.villainGroupsCount) {
      // Priority 1: Pick an unlocked item that is NOT led by the Mastermind (from end)
      let removeIdx = -1;
      for (let i = updatedVillains.length - 1; i >= 0; i--) {
        const isLocked = Boolean(setup.lockedSlots?.villains?.[i]);
        const isLed = isVillainLedByMastermind(updatedVillains[i], i, setup.mastermind, updatedVillains);
        if (!isLocked && !isLed) {
          removeIdx = i;
          break;
        }
      }

      // Priority 2: Pick any item that is NOT led by the Mastermind
      if (removeIdx === -1) {
        for (let i = updatedVillains.length - 1; i >= 0; i--) {
          const isLed = isVillainLedByMastermind(updatedVillains[i], i, setup.mastermind, updatedVillains);
          if (!isLed) {
            removeIdx = i;
            break;
          }
        }
      }

      // Priority 3: Pick an unlocked item
      if (removeIdx === -1) {
        for (let i = updatedVillains.length - 1; i >= 0; i--) {
          const isLocked = Boolean(setup.lockedSlots?.villains?.[i]);
          if (!isLocked) {
            removeIdx = i;
            break;
          }
        }
      }

      // Fallback: remove last item
      if (removeIdx === -1) {
        removeIdx = updatedVillains.length - 1;
      }

      updatedVillains.splice(removeIdx, 1);
    }
  }

  // Adjust henchmen count if scheme modifies it (e.g. scheme with +1 Henchman Group re-rolled to standard)
  if (updatedHenchmen.length < reqs.henchmanGroupsCount) {
    const currentHIds = new Set(updatedHenchmen.map((h) => h.id));
    const avail = henchmanPool.filter((h) => !currentHIds.has(h.id));
    while (updatedHenchmen.length < reqs.henchmanGroupsCount && avail.length > 0) {
      const nextH = avail.pop()!;
      updatedHenchmen.push(nextH);
    }
  } else if (updatedHenchmen.length > reqs.henchmanGroupsCount) {
    // When reducing henchman slots, ensure we NEVER remove a group led by the Mastermind
    while (updatedHenchmen.length > reqs.henchmanGroupsCount) {
      // Priority 1: Pick an unlocked item that is NOT led by the Mastermind (from end)
      let removeIdx = -1;
      for (let i = updatedHenchmen.length - 1; i >= 0; i--) {
        const isLocked = Boolean(setup.lockedSlots?.henchmen?.[i]);
        const isLed = isHenchmanLedByMastermind(updatedHenchmen[i], i, setup.mastermind, updatedHenchmen);
        if (!isLocked && !isLed) {
          removeIdx = i;
          break;
        }
      }

      // Priority 2: Pick any item that is NOT led by the Mastermind
      if (removeIdx === -1) {
        for (let i = updatedHenchmen.length - 1; i >= 0; i--) {
          const isLed = isHenchmanLedByMastermind(updatedHenchmen[i], i, setup.mastermind, updatedHenchmen);
          if (!isLed) {
            removeIdx = i;
            break;
          }
        }
      }

      // Priority 3: Pick an unlocked item
      if (removeIdx === -1) {
        for (let i = updatedHenchmen.length - 1; i >= 0; i--) {
          const isLocked = Boolean(setup.lockedSlots?.henchmen?.[i]);
          if (!isLocked) {
            removeIdx = i;
            break;
          }
        }
      }

      // Fallback: remove last item
      if (removeIdx === -1) {
        removeIdx = updatedHenchmen.length - 1;
      }

      updatedHenchmen.splice(removeIdx, 1);
    }
  }

  // Check scheme-specific group requirements
  if (newScheme.requiresSpecificGroup) {
    const reqGroups = newScheme.requiresSpecificGroup
      .split(',')
      .map((s) => s.trim().toLowerCase());
    for (const reqGroup of reqGroups) {
      const reqVillain =
        villainPool.find((v) => v.name.toLowerCase().includes(reqGroup)) ||
        data.VILLAINS.find((v) => v.name.toLowerCase().includes(reqGroup));
      if (reqVillain && !updatedVillains.some((v) => v.id === reqVillain.id)) {
        let unlockIdx = updatedVillains.findIndex(
          (v, idx) => !setup.lockedSlots?.villains?.[idx] && !isVillainLedByMastermind(v, idx, setup.mastermind, updatedVillains)
        );
        if (unlockIdx === -1) {
          unlockIdx = updatedVillains.findIndex(
            (_, idx) => !setup.lockedSlots?.villains?.[idx]
          );
        }
        if (unlockIdx !== -1) {
          updatedVillains[unlockIdx] = reqVillain;
        }
      }
    }
  }

  if (newScheme.requiresSpecificHenchman) {
    const reqGroups = newScheme.requiresSpecificHenchman
      .split(',')
      .map((s) => s.trim().toLowerCase());
    for (const reqGroup of reqGroups) {
      const reqHench =
        henchmanPool.find((h) => h.name.toLowerCase().includes(reqGroup)) ||
        data.HENCHMEN.find((h) => h.name.toLowerCase().includes(reqGroup));
      if (reqHench && !updatedHenchmen.some((h) => h.id === reqHench.id)) {
        let unlockIdx = updatedHenchmen.findIndex(
          (h, idx) => !setup.lockedSlots?.henchmen?.[idx] && !isHenchmanLedByMastermind(h, idx, setup.mastermind, updatedHenchmen)
        );
        if (unlockIdx === -1) {
          unlockIdx = updatedHenchmen.findIndex(
            (_, idx) => !setup.lockedSlots?.henchmen?.[idx]
          );
        }
        if (unlockIdx !== -1) {
          updatedHenchmen[unlockIdx] = reqHench;
        }
      }
    }
  }

  // Uniqueness sanitization
  const sanitizedHeroes = sanitizeUniqueGroups(updatedHeroes, heroPool, data.HEROES, setup.lockedSlots?.heroes);
  const sanitizedVillains = sanitizeUniqueGroups(updatedVillains, villainPool, data.VILLAINS, setup.lockedSlots?.villains);
  const sanitizedHenchmen = sanitizeUniqueGroups(updatedHenchmen, henchmanPool, data.HENCHMEN, setup.lockedSlots?.henchmen);

  // Recalculate deck breakdown and setup notes
  const villainCardsTotal = sanitizedVillains.length * 8;
  const henchmenCardsTotal =
    setup.playerCount === 1 ? 2 : sanitizedHenchmen.length * 10;
  const extraCardsTotal = reqs.extraCards.reduce((acc, c) => acc + c.count, 0);

  const villainDeckTotal =
    villainCardsTotal +
    henchmenCardsTotal +
    reqs.bystandersCount +
    reqs.masterStrikes +
    reqs.twistsCount +
    extraCardsTotal;

  const heroDeckCount = sanitizedHeroes.length * 14;

  const specialNotes: string[] = [];

  const leadsResolution = resolveAlwaysLeads(
    setup.mastermind.alwaysLeads,
    villainPool,
    henchmanPool,
    data.VILLAINS,
    data.HENCHMEN
  );

  if (setup.mastermind.alwaysLeads) {
    const includedGroups: string[] = [];
    if (
      leadsResolution.ledVillain &&
      sanitizedVillains.some((v) => v.id === leadsResolution.ledVillain!.id)
    ) {
      includedGroups.push(leadsResolution.ledVillain.name);
    }
    if (
      leadsResolution.ledHenchman &&
      sanitizedHenchmen.some((h) => h.id === leadsResolution.ledHenchman!.id)
    ) {
      includedGroups.push(leadsResolution.ledHenchman.name);
    }

    if (includedGroups.length > 0) {
      specialNotes.push(
        `Mastermind ${setup.mastermind.name} leads: ${setup.mastermind.alwaysLeads} (${includedGroups.join(
          ' & '
        )} Included).`
      );
    } else {
      specialNotes.push(
        `Mastermind ${setup.mastermind.name} normally leads: ${setup.mastermind.alwaysLeads}.`
      );
    }
  }

  if (newScheme.setupRule) {
    specialNotes.push(`Scheme Setup Rule: ${newScheme.setupRule}`);
  }

  if (newScheme.specialRules) {
    specialNotes.push(`Scheme Special Rules: ${newScheme.specialRules}`);
  }

  reqs.extraCards.forEach((ec) => {
    specialNotes.push(
      `Setup Modification: ${ec.name} (${ec.count} cards) - ${ec.description}`
    );
  });

  return {
    ...setup,
    scheme: {
      ...newScheme,
      twists: reqs.twistsCount,
    },
    heroes: sanitizedHeroes,
    villains: sanitizedVillains,
    henchmen: sanitizedHenchmen,
    bystandersCount: reqs.bystandersCount,
    masterStrikesCount: reqs.masterStrikes,
    twistsCount: reqs.twistsCount,
    specialSetupNotes: specialNotes,
    deckBreakdown: {
      heroDeckCount,
      heroCount: sanitizedHeroes.length,
      villainDeckTotal,
      villainCards: villainCardsTotal,
      henchmenCards: henchmenCardsTotal,
      bystanders: reqs.bystandersCount,
      masterStrikes: reqs.masterStrikes,
      schemeTwists: reqs.twistsCount,
      extraCards: reqs.extraCards,
      cityHenchmen: setup.playerCount === 1 ? 2 : 0,
    },
  };
}
