import {
  ActiveSetup,
  CardType,
  DeckBreakdown,
  GeneratorSettings,
  HenchmanGroup,
  HeroCard,
  MastermindCard,
  SchemeCard,
  VillainGroup,
} from '../types';

function pickRandom<T>(array: T[]): T {
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
      masterStrikes = 1; // 1 Strike in Villain deck
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

export function resolveAlwaysLeads(
  alwaysLeadsText: string | undefined,
  villainPool: VillainGroup[],
  allVillains: VillainGroup[],
  henchmanPool: HenchmanGroup[],
  allHenchmen: HenchmanGroup[]
): {
  ledVillain?: VillainGroup;
  ledHenchman?: HenchmanGroup;
  description: string;
} {
  if (!alwaysLeadsText) return { description: '' };

  const raw = alwaysLeadsText.trim();
  const lower = raw.toLowerCase();

  // Normalize quotes (curly, single, double)
  const normalizedQuotes = raw.replace(/[\u201c\u201d\"\u2018\u2019']/g, '"');
  const quotedMatches = [...normalizedQuotes.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());

  let ledVillain: VillainGroup | undefined;
  let ledHenchman: HenchmanGroup | undefined;

  // 1. Quoted patterns like: Any "Sinister" Villain Group, Any "Hydra" Villain Group, Any "Brotherhood" or "X-Men" Villain Group
  if (quotedMatches.length > 0 && lower.startsWith('any')) {
    const vMatchesPool = villainPool.filter((v) =>
      quotedMatches.some((q) => v.name.toLowerCase().includes(q))
    );
    if (vMatchesPool.length > 0) {
      ledVillain = pickRandom(vMatchesPool);
    } else {
      const vMatchesAll = allVillains.filter((v) =>
        quotedMatches.some((q) => v.name.toLowerCase().includes(q))
      );
      if (vMatchesAll.length > 0) {
        ledVillain = pickRandom(vMatchesAll);
      }
    }
  }

  // 2. "Any Villain Group" (Omega Red, Hank Pym Yellowjacket, Ego)
  if (!ledVillain && !ledHenchman && (lower === 'any villain group' || lower === 'any villain groups')) {
    ledVillain = pickRandom(villainPool.length > 0 ? villainPool : allVillains);
  }

  // 3. Direct match for Villain Group
  if (!ledVillain) {
    const foundVillain =
      villainPool.find((v) => v.name.toLowerCase() === lower || lower.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(lower)) ||
      allVillains.find((v) => v.name.toLowerCase() === lower || lower.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(lower));

    if (foundVillain) {
      ledVillain = foundVillain;
    }
  }

  // 4. Direct match for Henchman Group
  if (!ledHenchman) {
    const foundHenchman =
      henchmanPool.find((h) => h.name.toLowerCase() === lower || lower.includes(h.name.toLowerCase()) || h.name.toLowerCase().includes(lower)) ||
      allHenchmen.find((h) => h.name.toLowerCase() === lower || lower.includes(h.name.toLowerCase()) || h.name.toLowerCase().includes(lower));

    if (foundHenchman) {
      ledHenchman = foundHenchman;
    }
  }

  // 5. Compound clauses like "Brotherhood and any Sentinel Henchmen" or "Shi'ar Imperial Guard and any Shi'ar Henchmen"
  if (lower.includes('and')) {
    // Check if second part mentions henchmen
    if (lower.includes('sentinel henchm') || lower.includes('sentinel')) {
      const sentinelHench =
        henchmanPool.find((h) => h.name.toLowerCase().includes('sentinel')) ||
        allHenchmen.find((h) => h.name.toLowerCase().includes('sentinel'));
      if (sentinelHench) ledHenchman = sentinelHench;
    } else if (lower.includes('shi\'ar henchm') || lower.includes('shiar henchm')) {
      const shiarHench =
        henchmanPool.find((h) => h.name.toLowerCase().includes('shi\'ar') || h.name.toLowerCase().includes('shiar')) ||
        allHenchmen.find((h) => h.name.toLowerCase().includes('shi\'ar') || h.name.toLowerCase().includes('shiar'));
      if (shiarHench) ledHenchman = shiarHench;
    }
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
  const vName = villain.name.toLowerCase();

  // 1. Quoted check
  const quotedMatches = [...raw.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());
  if (quotedMatches.length > 0) {
    if (quotedMatches.some((q) => vName.includes(q))) return true;
  }

  // 2. Direct name substring / equality
  if (vName === lower || lower.includes(vName) || vName.includes(lower)) {
    return true;
  }

  // 3. Primary token check (e.g. "Brotherhood and any Sentinel Henchmen" -> "Brotherhood")
  const primaryName = lower.split(/[.,]|\band\s+(?:any|a)\b/i)[0].trim();
  if (primaryName && (vName === primaryName || vName.includes(primaryName) || primaryName.includes(vName))) {
    return true;
  }

  // 4. Check villain's ledBy array
  if (villain.ledBy && villain.ledBy.some(m => m.toLowerCase() === mastermind.name.toLowerCase() || mastermind.name.toLowerCase().includes(m.toLowerCase()))) {
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
  const hName = hench.name.toLowerCase();

  // 1. Compound clause for Sentinel Henchmen
  if (/and\s+(?:any|a)\s+sentinel\s+henchm/i.test(lower)) {
    if (hName.includes('sentinel')) return true;
  }

  // 2. Compound clause for Shi'ar Henchmen
  if (/and\s+(?:any|a)\s+shi['\u2019]?ar\s+henchm/i.test(lower)) {
    if (hName.includes("shi'ar") || hName.includes('shiar')) return true;
  }

  // 3. Masterminds directly leading Henchmen
  const primaryName = lower.split(/[.,]|\band\s+(?:any|a)\b/i)[0].trim();
  const cleanHenchName = primaryName.replace(/s$/, '');
  if (primaryName && (hName === primaryName || hName.includes(primaryName) || primaryName.includes(hName) || hName.includes(cleanHenchName))) {
    return true;
  }

  return false;
}

export function generateSetup(
  settings: GeneratorSettings,
  data: { SCHEMES: SchemeCard[], MASTERMINDS: MastermindCard[], HEROES: HeroCard[], VILLAINS: VillainGroup[], HENCHMEN: HenchmanGroup[], EXPANSIONS: import("../types").Expansion[] },
  existingSetup?: ActiveSetup
): ActiveSetup {
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
  const availableSchemes = data.SCHEMES.filter(
    (s) => enabledExpSet.has(s.expansion) && !excludedSet.has(s.id)
  );
  const schemePool =
    availableSchemes.length > 0
      ? availableSchemes
      : data.SCHEMES.filter((s) => !excludedSet.has(s.id));

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
  let scheme: SchemeCard;
  if (locked.scheme && existingSetup) {
    scheme = existingSetup.scheme;
  } else {
    const forcedScheme = schemePool.find((s) => includedSet.has(s.id));
    scheme = forcedScheme || pickRandom(schemePool);
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
  }

  const leadsResolution = resolveAlwaysLeads(
    mastermind.alwaysLeads,
    villainPool,
    data.VILLAINS,
    henchmanPool,
    data.HENCHMEN
  );

  if (shouldIncludeAlwaysLeads && leadsResolution.ledVillain) {
    const ledGroup = leadsResolution.ledVillain;
    const isLedVillainPresent = selectedVillains.some(
      (v, idx) => v && (v.id === ledGroup.id || isVillainLedByMastermind(v, idx, mastermind, selectedVillains.filter(Boolean) as VillainGroup[]))
    );

    if (!isLedVillainPresent) {
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
  if (scheme.requiresSpecificGroup) {
    const reqGroups = scheme.requiresSpecificGroup.split(',').map(s => s.trim().toLowerCase());
    
    for (const reqGroup of reqGroups) {
      let reqVillain = villainPool.find(v => v.name.toLowerCase().includes(reqGroup));
      if (!reqVillain) {
        reqVillain = data.VILLAINS.find(v => v.name.toLowerCase().includes(reqGroup));
      }

      const alreadySelected = new Set(selectedVillains.filter(Boolean).map(v => v!.id));
      if (reqVillain && !alreadySelected.has(reqVillain.id)) {
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

        if (emptyIdx !== undefined && emptyIdx >= 0) {
          selectedVillains[emptyIdx] = reqVillain;
        }
      }
    }
  }

  // Fill remaining villain slots
  const finalSelectedVillainIds = new Set(
    selectedVillains.filter(Boolean).map((v) => v!.id)
  );
  const remainingVillains = shuffle(
    villainPool.filter((v) => !finalSelectedVillainIds.has(v.id))
  );
  let vIndex = 0;
  for (let i = 0; i < reqs.villainGroupsCount; i++) {
    if (!selectedVillains[i]) {
      const nextV = remainingVillains[vIndex++] || pickRandom(villainPool);
      selectedVillains[i] = nextV;
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
    const isLedHenchPresent = selectedHenchmen.some(
      (h, idx) => h && (h.id === ledHench.id || isHenchmanLedByMastermind(h, idx, mastermind, selectedHenchmen.filter(Boolean) as HenchmanGroup[]))
    );

    if (!isLedHenchPresent) {
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

  if ((scheme as any).requiresSpecificHenchman) {
    const reqGroups = (scheme as any).requiresSpecificHenchman.split(',').map((s: string) => s.trim().toLowerCase());
    
    for (const reqGroup of reqGroups) {
      let reqHench = henchmanPool.find(h => h.name.toLowerCase().includes(reqGroup));
      if (!reqHench) {
        reqHench = data.HENCHMEN.find(h => h.name.toLowerCase().includes(reqGroup));
      }

      const alreadySelected = new Set(selectedHenchmen.filter(Boolean).map(h => h!.id));
      if (reqHench && !alreadySelected.has(reqHench.id)) {
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

        if (emptyIdx !== undefined && emptyIdx >= 0) {
          selectedHenchmen[emptyIdx] = reqHench;
        }
      }
    }
  }

  const finalSelectedHenchIds = new Set(
    selectedHenchmen.filter(Boolean).map((h) => h!.id)
  );
  const remainingHenchmen = shuffle(
    henchmanPool.filter((h) => !finalSelectedHenchIds.has(h.id))
  );
  let hIndex = 0;
  for (let i = 0; i < reqs.henchmanGroupsCount; i++) {
    if (!selectedHenchmen[i]) {
      selectedHenchmen[i] = remainingHenchmen[hIndex++] || pickRandom(henchmanPool);
    }
  }

  // 6. Select Heroes
  const selectedHeroes: HeroCard[] = [];
  const existingHeroes = existingSetup?.heroes || [];

  for (let i = 0; i < reqs.heroCount; i++) {
    if (locked.heroes?.[i] && existingHeroes[i]) {
      selectedHeroes[i] = existingHeroes[i];
    }
  }

  const selectedHeroIds = new Set(
    selectedHeroes.filter(Boolean).map((h) => h.id)
  );

  const forceHeroes = heroPool.filter(
    (h) => includedSet.has(h.id) && !selectedHeroIds.has(h.id)
  );
  let fIdx = 0;

  const remainingHeroes = shuffle(
    heroPool.filter((h) => !selectedHeroIds.has(h.id))
  );
  let heroIdx = 0;

  for (let i = 0; i < reqs.heroCount; i++) {
    if (!selectedHeroes[i]) {
      if (fIdx < forceHeroes.length) {
        selectedHeroes[i] = forceHeroes[fIdx++];
      } else {
        selectedHeroes[i] = remainingHeroes[heroIdx++] || pickRandom(heroPool);
      }
    }
  }

  // 7. Sort only if NO slots are locked, to prevent index drift on locked slots
  const hasLockedHeroes = Object.values(locked.heroes || {}).some(Boolean);
  const hasLockedVillains = Object.values(locked.villains || {}).some(Boolean);
  const hasLockedHenchmen = Object.values(locked.henchmen || {}).some(Boolean);

  const sortedHeroes = hasLockedHeroes
    ? (selectedHeroes as HeroCard[])
    : [...selectedHeroes].sort((a, b) => a.name.localeCompare(b.name));

  const sortedVillains = hasLockedVillains
    ? (selectedVillains as VillainGroup[])
    : (selectedVillains as VillainGroup[]).sort((a, b) => a.name.localeCompare(b.name));

  const sortedHenchmen = hasLockedHenchmen
    ? (selectedHenchmen as HenchmanGroup[])
    : (selectedHenchmen as HenchmanGroup[]).sort((a, b) => a.name.localeCompare(b.name));

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

  if (scheme.setupRule) {
    specialNotes.push(`Scheme Setup Rule: ${scheme.setupRule}`);
  }

  if (scheme.specialRules) {
    specialNotes.push(`Scheme Special Rules: ${scheme.specialRules}`);
  }

  reqs.extraCards.forEach((ec) => {
    specialNotes.push(`Setup Modification: ${ec.name} (${ec.count} cards) - ${ec.description}`);
  });

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

  if (scheme.extraHenchmen) {
    specialNotes.push(
      `Scheme adds ${scheme.extraHenchmen} extra Henchman group(s) to the Villain Deck.`
    );
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
    scheme: {
      ...scheme,
      twists: reqs.twistsCount,
    },
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
