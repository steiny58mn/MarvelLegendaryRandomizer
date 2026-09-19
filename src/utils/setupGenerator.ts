import {
  ActiveSetup,
  GeneratorSettings,
  MastermindCard,
  SchemeCard,
  HeroCard,
  VillainGroup,
  HenchmanGroup,
  DeckBreakdown,
} from '../types';

// Helper for random selection
function pickRandom<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getDefaultGeneratorSettings(expansions: import("../types").Expansion[]): GeneratorSettings {
  const safeExpansions = expansions || [];
  return {
    playerCount: 2,
    soloVariant: 'standard',
    alwaysLeadsRule: 'guarantee',
    enabledExpansions: safeExpansions.filter(e => (e.universe || 'Marvel') === 'Marvel').map((e) => e.id),
    excludedCardIds: [],
    includedCardIds: [],
    maxDifficulty: 'Any',
    universeMode: 'selected',
    selectedUniverses: ['Marvel'],
    translateVillainsTerms: false,
  };
}

export function calculateBaseRequirements(
  playerCount: number,
  scheme?: SchemeCard
): {
  heroCount: number;
  villainGroupsCount: number;
  henchmanGroupsCount: number;
  bystandersCount: number;
  masterStrikes: number;
} {
  let heroCount = 5;
  let villainGroupsCount = 2;
  let henchmanGroupsCount = 1;
  let bystandersCount = 2;
  const masterStrikes = 5;

  switch (playerCount) {
    case 1:
      heroCount = 3;
      villainGroupsCount = 1;
      henchmanGroupsCount = 1;
      bystandersCount = 1;
      break;
    case 2:
      heroCount = 5;
      villainGroupsCount = 2;
      henchmanGroupsCount = 1;
      bystandersCount = 2;
      break;
    case 3:
      heroCount = 5;
      villainGroupsCount = 3;
      henchmanGroupsCount = 1;
      bystandersCount = 2;
      break;
    case 4:
      heroCount = 5;
      villainGroupsCount = 3;
      henchmanGroupsCount = 2;
      bystandersCount = 8;
      break;
    case 5:
      heroCount = 5;
      villainGroupsCount = 4;
      henchmanGroupsCount = 2;
      bystandersCount = 12;
      break;
  }

  // Scheme modifiers
  if (scheme) {
    if (scheme.name.includes("Super Hero Civil War")) {
      heroCount = playerCount <= 3 ? 4 : 5;
    } else if (scheme.extraHeroes) {
      heroCount += scheme.extraHeroes;
    }
    
    if (scheme.extraVillains) villainGroupsCount += scheme.extraVillains;
    if (scheme.extraHenchmen) henchmanGroupsCount += scheme.extraHenchmen;
    if (scheme.customBystanders !== undefined) {
      bystandersCount = scheme.customBystanders;
    }
  }

  return {
    heroCount,
    villainGroupsCount,
    henchmanGroupsCount,
    bystandersCount,
    masterStrikes,
  };
}

/**
 * Intelligently resolves the Villain and/or Henchman group led by a Mastermind.
 * Handles flexible clauses (e.g. Any “Sinister“ Villain Group, Any “Hydra“ Villain Group),
 * compound rules (e.g. Purifiers + Sentinel Henchmen), Henchmen-leading Masterminds,
 * and trailing extra-card text.
 */
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
  const normalizedQuotes = raw.replace(/[“”"’’']/g, '"');
  const quotedMatches = [...normalizedQuotes.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());

  let ledVillain: VillainGroup | undefined;
  let ledHenchman: HenchmanGroup | undefined;

  // 1. Quoted patterns like: Any “Sinister“ Villain Group, Any “Hydra“ Villain Group, Any “Brotherhood“ or “X-Men“ Villain Group, Any “Alchemax“ or “Sinister“ Villain Group
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
  if (!ledVillain && /^any villain group/i.test(lower)) {
    ledVillain = pickRandom(villainPool.length > 0 ? villainPool : allVillains);
  }

  // 3. Check for specific henchmen clauses in combo text (e.g. Bastion: "Purifiers and any Sentinel Henchmen Group." or Deathbird: "Shi'ar Imperial Guard and a Shi'ar Henchmen Group.")
  if (/and\s+(?:any|a)\s+sentinel\s+henchm/i.test(lower)) {
    const sentinelPool = henchmanPool.filter((h) => h.name.toLowerCase().includes('sentinel'));
    if (sentinelPool.length > 0) {
      ledHenchman = pickRandom(sentinelPool);
    } else {
      const sentinelAll = allHenchmen.filter((h) => h.name.toLowerCase().includes('sentinel'));
      if (sentinelAll.length > 0) {
        ledHenchman = pickRandom(sentinelAll);
      }
    }
  } else if (/and\s+(?:any|a)\s+shi['’]?ar\s+henchm/i.test(lower)) {
    const shiarPool = henchmanPool.filter((h) => h.name.toLowerCase().includes("shi'ar") || h.name.toLowerCase().includes('shiar'));
    if (shiarPool.length > 0) {
      ledHenchman = pickRandom(shiarPool);
    } else {
      const shiarAll = allHenchmen.filter((h) => h.name.toLowerCase().includes("shi'ar") || h.name.toLowerCase().includes('shiar'));
      if (shiarAll.length > 0) {
        ledHenchman = pickRandom(shiarAll);
      }
    }
  }

  // 4. Primary group name extraction (strip trailing sentences like ". Add an extra...", " and any...", etc.)
  if (!ledVillain) {
    let cleanName = raw.split(/[.,]|\band\s+any\b|\band\s+a\b/i)[0].trim().toLowerCase();
    // Alias shorthand
    if (cleanName === 'mlf') cleanName = 'mutant liberation front';

    // Check in Villains first
    ledVillain = villainPool.find((v) => v.name.toLowerCase() === cleanName || v.name.toLowerCase().includes(cleanName));
    if (!ledVillain) {
      ledVillain = allVillains.find((v) => v.name.toLowerCase() === cleanName || v.name.toLowerCase().includes(cleanName));
    }
    if (!ledVillain) {
      ledVillain = villainPool.find((v) => cleanName.includes(v.name.toLowerCase()));
      if (!ledVillain) {
        ledVillain = allVillains.find((v) => cleanName.includes(v.name.toLowerCase()));
      }
    }

    // If not found in Villains, check if it's a Henchmen group! (Doctor Doom -> Doombot Legion, Mandarin -> Mandarin's Rings, Magus -> Universal Church of Truth, Ultron Infinity -> Ultron Sentries, Odin -> Asgardian Warriors, Killmonger -> Vibranium Liberator Drones, J. Jonah Jameson -> Spider-Slayers)
    if (!ledVillain && !ledHenchman) {
      const cleanHenchName = cleanName.replace(/s$/, ''); // e.g. Spider-Slayers -> Spider-Slayer, Doombot Legions -> Doombot Legion
      ledHenchman = henchmanPool.find((h) => h.name.toLowerCase() === cleanName || h.name.toLowerCase().includes(cleanName) || h.name.toLowerCase().includes(cleanHenchName));
      if (!ledHenchman) {
        ledHenchman = allHenchmen.find((h) => h.name.toLowerCase() === cleanName || h.name.toLowerCase().includes(cleanName) || h.name.toLowerCase().includes(cleanHenchName));
      }
    }
  }

  return {
    ledVillain,
    ledHenchman,
    description: raw,
  };
}

/**
 * Checks if a specific villain group is led by the setup's Mastermind.
 */
export function isVillainLedByMastermind(
  villain: VillainGroup,
  idx: number,
  mastermind: MastermindCard | undefined,
  allVillains: VillainGroup[]
): boolean {
  if (!mastermind || !mastermind.alwaysLeads) return false;
  const raw = mastermind.alwaysLeads.trim();
  const lower = raw.toLowerCase();
  const vName = villain.name.toLowerCase();

  // 1. Quoted tags e.g. Any “Brotherhood“ or “X-Men“ Villain Group, Any “Sinister“ Villain Group, Any “Hydra“ Villain Group
  const normalizedQuotes = raw.replace(/[“”"’’']/g, '"');
  const quotedMatches = [...normalizedQuotes.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());
  if (quotedMatches.length > 0 && lower.startsWith('any')) {
    return quotedMatches.some((q) => vName.includes(q));
  }

  // 2. "Any Villain Group" (e.g. Omega Red, Hank Pym Yellowjacket, Ego)
  if (/^any villain group/i.test(lower)) {
    const specificPart = lower.split(/\bor any villain group\b/i)[0].trim();
    if (specificPart && (vName.includes(specificPart) || specificPart.includes(vName))) {
      return true;
    }
    // Highlight the first villain in setup
    const firstIdx = allVillains.findIndex(Boolean);
    return idx === firstIdx;
  }

  // 3. Primary group name or compound clause (e.g. "Purifiers and any Sentinel Henchmen Group.", "Shi'ar Imperial Guard and a Shi'ar Henchmen Group.", "Armada of Kang. Set aside...")
  const primaryName = lower.split(/[.,]|\band\s+(?:any|a)\b/i)[0].trim();
  if (primaryName === 'mlf' && vName.includes('mutant liberation front')) {
    return true;
  }
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

  // 1. Compound clause for Sentinel Henchmen (Bastion: "Purifiers and any Sentinel Henchmen Group.")
  if (/and\s+(?:any|a)\s+sentinel\s+henchm/i.test(lower)) {
    if (hName.includes('sentinel')) return true;
  }

  // 2. Compound clause for Shi'ar Henchmen (Deathbird: "Shi'ar Imperial Guard and a Shi'ar Henchmen Group.")
  if (/and\s+(?:any|a)\s+shi['’]?ar\s+henchm/i.test(lower)) {
    if (hName.includes("shi'ar") || hName.includes('shiar')) return true;
  }

  // 3. Masterminds directly leading Henchmen (Doctor Doom -> "Doombot Legions", Mandarin -> "Mandarin's Rings", Magus -> "Universal Church of Truth", etc.)
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
    }
    return true; // 'mix' or unset allows all
  }).map((e) => e.id);

  const rawEnabledSet = new Set(
    settings.enabledExpansions.length > 0
      ? settings.enabledExpansions
      : ['base']
  );

  // Final enabled expansion set respects both user checkbox AND selected universe
  const allowedExpSet = new Set(allowedExpansions);
  const effectiveEnabledExpansions = [...rawEnabledSet].filter((id) => allowedExpSet.has(id));
  const enabledExpSet = new Set(
    effectiveEnabledExpansions.length > 0
      ? effectiveEnabledExpansions
      : (allowedExpansions.length > 0 ? allowedExpansions : ['base'])
  );

  const excludedSet = new Set(settings.excludedCardIds);
  const includedSet = new Set(settings.includedCardIds);

  // 1. Available Pools
  const availableSchemes = data.SCHEMES.filter(
    (s) =>
      enabledExpSet.has(s.expansion) &&
      !excludedSet.has(s.id) &&
      (settings.maxDifficulty === 'Any' ||
        !settings.maxDifficulty ||
        s.difficulty === settings.maxDifficulty)
  );
  const fallbackSchemes = data.SCHEMES.filter((s) => !excludedSet.has(s.id));
  const schemePool = availableSchemes.length > 0 ? availableSchemes : fallbackSchemes;

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
    // Check if any scheme is force-included
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
  const selectedVillains: VillainGroup[] = [];
  const existingVillains = existingSetup?.villains || [];

  // Carry over locked villains
  for (let i = 0; i < reqs.villainGroupsCount; i++) {
    if (locked.villains?.[i] && existingVillains[i]) {
      selectedVillains[i] = existingVillains[i];
    }
  }

  // Handle "Always Leads" requirement/preference
  let shouldIncludeAlwaysLeads = false;
  if (settings.playerCount > 1) { // Do not enforce for Solo
    if (settings.alwaysLeadsRule === 'guarantee') {
      shouldIncludeAlwaysLeads = true;
    } else if (settings.alwaysLeadsRule === 'prioritize') {
      shouldIncludeAlwaysLeads = Math.random() < 0.8;
    }
  }

  const alreadySelectedIds = new Set(
    selectedVillains.filter(Boolean).map((v) => v.id)
  );

  const leadsResolution = resolveAlwaysLeads(
    mastermind.alwaysLeads,
    villainPool,
    data.VILLAINS,
    henchmanPool,
    data.HENCHMEN
  );

  if (shouldIncludeAlwaysLeads && leadsResolution.ledVillain) {
    const ledGroup = leadsResolution.ledVillain;
    if (!alreadySelectedIds.has(ledGroup.id)) {
      let emptyIdx = Array.from(
        { length: reqs.villainGroupsCount },
        (_, i) => i
      ).find((i) => !selectedVillains[i]);
      if (emptyIdx === undefined) {
        emptyIdx = reqs.villainGroupsCount - 1; // Overwrite last slot if full
      }
      if (emptyIdx !== undefined && emptyIdx >= 0) {
        selectedVillains[emptyIdx] = ledGroup;
        alreadySelectedIds.add(ledGroup.id);
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

      if (reqVillain && !alreadySelectedIds.has(reqVillain.id)) {
        let emptyIdx = Array.from(
          { length: reqs.villainGroupsCount },
          (_, i) => i
        ).find((i) => !selectedVillains[i]);
        
        if (emptyIdx === undefined) {
          emptyIdx = Array.from({ length: reqs.villainGroupsCount }, (_, i) => i).find((i) => {
             const v = selectedVillains[i];
             if (!v) return true;
             if (leadsResolution.ledVillain && v.id === leadsResolution.ledVillain.id) {
               return false; // don't overwrite mastermind's led group
             }
             return true;
          });
          if (emptyIdx === undefined) emptyIdx = reqs.villainGroupsCount - 1;
        }

        if (emptyIdx !== undefined && emptyIdx >= 0) {
          selectedVillains[emptyIdx] = reqVillain;
          alreadySelectedIds.add(reqVillain.id);
        }
      }
    }
  }

  // Fill remaining villain slots
  const remainingVillains = shuffle(
    villainPool.filter((v) => !alreadySelectedIds.has(v.id))
  );
  let vIndex = 0;
  for (let i = 0; i < reqs.villainGroupsCount; i++) {
    if (!selectedVillains[i]) {
      const nextV = remainingVillains[vIndex++] || pickRandom(villainPool);
      selectedVillains[i] = nextV;
    }
  }

  // 5. Select Henchmen
  const selectedHenchmen: HenchmanGroup[] = [];
  const existingHenchmen = existingSetup?.henchmen || [];

  for (let i = 0; i < reqs.henchmanGroupsCount; i++) {
    if (locked.henchmen?.[i] && existingHenchmen[i]) {
      selectedHenchmen[i] = existingHenchmen[i];
    }
  }

  const alreadySelectedHenchIds = new Set(
    selectedHenchmen.filter(Boolean).map((h) => h.id)
  );

  // Check if Mastermind always leads a Henchman group (or combo rule)
  if (shouldIncludeAlwaysLeads && leadsResolution.ledHenchman) {
    const ledHench = leadsResolution.ledHenchman;
    if (!alreadySelectedHenchIds.has(ledHench.id)) {
      let emptyIdx = Array.from(
        { length: reqs.henchmanGroupsCount },
        (_, i) => i
      ).find((i) => !selectedHenchmen[i]);
      if (emptyIdx === undefined) {
        emptyIdx = reqs.henchmanGroupsCount - 1;
      }
      if (emptyIdx !== undefined && emptyIdx >= 0) {
        selectedHenchmen[emptyIdx] = ledHench;
        alreadySelectedHenchIds.add(ledHench.id);
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

      if (reqHench && !alreadySelectedHenchIds.has(reqHench.id)) {
        let emptyIdx = Array.from(
          { length: reqs.henchmanGroupsCount },
          (_, i) => i
        ).find((i) => !selectedHenchmen[i]);
        
        if (emptyIdx === undefined) {
          emptyIdx = reqs.henchmanGroupsCount - 1;
        }

        if (emptyIdx !== undefined && emptyIdx >= 0) {
          selectedHenchmen[emptyIdx] = reqHench;
          alreadySelectedHenchIds.add(reqHench.id);
        }
      }
    }
  }

  for (let i = 0; i < reqs.henchmanGroupsCount; i++) {
    if (locked.henchmen?.[i] && existingHenchmen[i]) {
      selectedHenchmen[i] = existingHenchmen[i];
    }
  }

  const selectedHenchIds = new Set(
    selectedHenchmen.filter(Boolean).map((h) => h.id)
  );
  const remainingHenchmen = shuffle(
    henchmanPool.filter((h) => !selectedHenchIds.has(h.id))
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

  // Prioritize any force-included heroes not yet added
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

  // 7. Calculate deck breakdown and setup notes
  const villainCardsTotal = selectedVillains.length * 8;
  const henchmenCardsTotal =
    settings.playerCount === 1 ? 2 : selectedHenchmen.length * 10;
  const villainDeckTotal =
    villainCardsTotal +
    henchmenCardsTotal +
    reqs.bystandersCount +
    reqs.masterStrikes +
    scheme.twists;

  const heroDeckCount = selectedHeroes.length * 14;

  const specialNotes: string[] = [];

  if (mastermind.alwaysLeads) {
    const includedGroups: string[] = [];
    if (leadsResolution.ledVillain && selectedVillains.some((v) => v.id === leadsResolution.ledVillain!.id)) {
      includedGroups.push(leadsResolution.ledVillain.name);
    }
    if (leadsResolution.ledHenchman && selectedHenchmen.some((h) => h.id === leadsResolution.ledHenchman!.id)) {
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
      'Solo Mode (1P): 4 Henchmen total — 2 are shuffled into the Villain Deck and 2 start on the first two city spaces (Sewers and Bank). Return the remaining 6 Henchmen to the box.'
    );
  }

  const deckBreakdown: DeckBreakdown = {
    heroDeckCount,
    heroCount: selectedHeroes.length,
    villainDeckTotal,
    villainCards: villainCardsTotal,
    henchmenCards: henchmenCardsTotal,
    bystanders: reqs.bystandersCount,
    masterStrikes: reqs.masterStrikes,
    schemeTwists: scheme.twists,
    extraCards: [],
    cityHenchmen: settings.playerCount === 1 ? 2 : 0,
  };

  return {
    id: `setup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    playerCount: settings.playerCount,
    soloVariant: settings.soloVariant,
    mastermind,
    scheme,
    heroes: selectedHeroes,
    villains: selectedVillains,
    henchmen: selectedHenchmen,
    bystandersCount: reqs.bystandersCount,
    masterStrikesCount: reqs.masterStrikes,
    twistsCount: scheme.twists,
    lockedSlots: locked,
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
  // Official Marvel Legendary Scoring Formula:
  // Total VP = Defeated Mastermind VP (tactics) + Defeated Villains VP + 1 per Rescued Bystander
  // Penalties:
  // - 4 points for each Escaped Villain in the Escaped pile
  // - 1 point for each Bystander carried off by Escaped Villains
  // - 3 points for each Scheme Twist in the Escaped pile
  const tacticsVP = params.mastermindTacticsDefeated * 5; // average 5 VP per tactic or direct count
  const positives =
    tacticsVP +
    params.villainCardsVPTotal +
    params.rescuedBystandersCount * 1 +
    params.bonusPoints;

  const penalties =
    params.escapedVillainsPenaltyCount * 4 +
    params.carriedOffBystandersPenaltyCount * 1 +
    params.schemeTwistsInEscapePenaltyCount * 3;

  return Math.max(0, positives - penalties);
}
