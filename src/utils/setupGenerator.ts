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

  if (shouldIncludeAlwaysLeads && mastermind.alwaysLeads) {
    let ledGroup = villainPool.find(
      (v) =>
        v.name.toLowerCase() === mastermind.alwaysLeads!.toLowerCase() ||
        v.name.toLowerCase().includes(mastermind.alwaysLeads!.toLowerCase())
    );
    if (!ledGroup) {
      ledGroup = data.VILLAINS.find(
        (v) =>
          v.name.toLowerCase() === mastermind.alwaysLeads!.toLowerCase() ||
          v.name.toLowerCase().includes(mastermind.alwaysLeads!.toLowerCase())
      );
    }
    if (ledGroup && !alreadySelectedIds.has(ledGroup.id)) {
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
             if (mastermind.alwaysLeads && v.name.toLowerCase().includes(mastermind.alwaysLeads.toLowerCase())) {
               return false; // don't overwrite mastermind's group
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
      selectedHenchmen[i] =
        remainingHenchmen[hIndex++] || pickRandom(henchmanPool);
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
    const isPresent = selectedVillains.some((v) =>
      v.name.toLowerCase().includes(mastermind.alwaysLeads.toLowerCase())
    );
    if (isPresent) {
      specialNotes.push(
        `Mastermind ${mastermind.name} leads villain group: ${mastermind.alwaysLeads} (Included).`
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
