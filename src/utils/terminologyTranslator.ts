/**
 * Utility for translating Marvel Legendary: Villains and Fear Itself
 * terminology to Standard Marvel Legendary (Base Game) terminology.
 */

export interface GlossaryEntry {
  villainsTerm: string;
  standardTerm: string;
  category: 'Core Terms' | 'Starter & Special Cards' | 'Board Spaces' | 'Keywords & Mechanics';
  description: string;
}

export const VILLAINS_GLOSSARY: GlossaryEntry[] = [
  {
    villainsTerm: 'Ally / Allies',
    standardTerm: 'Hero / Heroes',
    category: 'Core Terms',
    description: 'Cards recruited by players from the recruitment row into their decks.',
  },
  {
    villainsTerm: 'Ally Deck',
    standardTerm: 'Hero Deck',
    category: 'Core Terms',
    description: 'The deck of recruitable cards.',
  },
  {
    villainsTerm: 'Commander',
    standardTerm: 'Mastermind',
    category: 'Core Terms',
    description: 'The primary leader/boss opposing the players.',
  },
  {
    villainsTerm: 'Command Strike',
    standardTerm: 'Master Strike',
    category: 'Core Terms',
    description: 'Strike cards triggered from the encounter deck.',
  },
  {
    villainsTerm: 'Adversary / Adversaries',
    standardTerm: 'Villain / Villains',
    category: 'Core Terms',
    description: 'Encounter cards entering the board track.',
  },
  {
    villainsTerm: 'Adversary Deck',
    standardTerm: 'Villain Deck',
    category: 'Core Terms',
    description: 'The main encounter deck.',
  },
  {
    villainsTerm: 'Henchman Adversary',
    standardTerm: 'Henchman / Henchmen',
    category: 'Core Terms',
    description: 'Weaker minion groups in the encounter deck.',
  },
  {
    villainsTerm: 'Plot / Plot Twist',
    standardTerm: 'Scheme / Scheme Twist',
    category: 'Core Terms',
    description: 'The villainous scenario and its twist triggers.',
  },
  {
    villainsTerm: 'Lair',
    standardTerm: 'City',
    category: 'Core Terms',
    description: 'The 5-space board track where enemies move.',
  },
  {
    villainsTerm: 'Overrun / Overruns',
    standardTerm: 'Escape / Escapes',
    category: 'Core Terms',
    description: 'When an enemy pushes beyond the final space of the board track.',
  },
  {
    villainsTerm: 'Kidnapped Bystander',
    standardTerm: 'Rescued Bystander',
    category: 'Core Terms',
    description: 'Civilians captured by enemies or rescued by players.',
  },
  {
    villainsTerm: 'Madame HYDRA',
    standardTerm: 'S.H.I.E.L.D. Officer',
    category: 'Starter & Special Cards',
    description: 'Fixed 3-cost recruit card in the recruitment row.',
  },
  {
    villainsTerm: 'HYDRA Operative',
    standardTerm: 'S.H.I.E.L.D. Agent',
    category: 'Starter & Special Cards',
    description: '0-cost starter cards that provide +1 Recruit.',
  },
  {
    villainsTerm: 'HYDRA Soldier',
    standardTerm: 'S.H.I.E.L.D. Trooper',
    category: 'Starter & Special Cards',
    description: '0-cost starter cards that provide +1 Attack.',
  },
  {
    villainsTerm: 'New Recruits',
    standardTerm: 'Sidekicks',
    category: 'Starter & Special Cards',
    description: '2-cost utility draw cards.',
  },
  {
    villainsTerm: 'Dungeon',
    standardTerm: 'Sewers',
    category: 'Board Spaces',
    description: '1st space of the board track (entry space).',
  },
  {
    villainsTerm: 'Laboratory',
    standardTerm: 'Bank',
    category: 'Board Spaces',
    description: '2nd space of the board track.',
  },
  {
    villainsTerm: 'Armory',
    standardTerm: 'Rooftops',
    category: 'Board Spaces',
    description: '3rd space of the board track.',
  },
  {
    villainsTerm: 'Treasury',
    standardTerm: 'Streets',
    category: 'Board Spaces',
    description: '4th space of the board track.',
  },
  {
    villainsTerm: 'Throne Room',
    standardTerm: 'Bridge',
    category: 'Board Spaces',
    description: '5th space of the board track (final space before Escape).',
  },
  {
    villainsTerm: 'Bind',
    standardTerm: 'KO',
    category: 'Keywords & Mechanics',
    description: 'Mechanic in Villains where cards are bound/captured under other cards.',
  },
];

interface ReplacementRule {
  pattern: RegExp;
  replace: string | ((substring: string, ...args: any[]) => string);
}

const RULES: ReplacementRule[] = [
  // Decks & Specific Phrases
  { pattern: /\bAlly Deck\b/g, replace: 'Hero Deck' },
  { pattern: /\bally deck\b/g, replace: 'hero deck' },
  { pattern: /\bAdversary Deck\b/g, replace: 'Villain Deck' },
  { pattern: /\badversary deck\b/g, replace: 'villain deck' },
  { pattern: /\bHenchm[ae]n Adversar(ies|y)\b/gi, replace: 'Henchmen' },
  { pattern: /\bCommand Strikes?\b/g, replace: (m) => m.toLowerCase().endsWith('s') ? 'Master Strikes' : 'Master Strike' },
  { pattern: /\bcommand strikes?\b/g, replace: (m) => m.endsWith('s') ? 'master strikes' : 'master strike' },
  { pattern: /\bPlot Twists?\b/g, replace: (m) => m.toLowerCase().endsWith('s') ? 'Scheme Twists' : 'Scheme Twist' },
  { pattern: /\bplot twists?\b/g, replace: (m) => m.endsWith('s') ? 'scheme twists' : 'scheme twist' },
  { pattern: /\bKidnapped Bystanders?\b/gi, replace: 'Bystander' },
  { pattern: /\bKidnap(s|ping|ped)?(\s+(?:a|\d+)?\s*Bystanders?)/gi, replace: (_m, p1, p2) => `Capture${p1 === 's' ? 's' : p1 === 'ping' ? 'ing' : p1 === 'ped' ? 'd' : ''}${p2}` },

  // Board spaces
  { pattern: /\bThrone Room\b/g, replace: 'Bridge' },
  { pattern: /\bthrone room\b/g, replace: 'bridge' },
  { pattern: /\bTreasury\b/g, replace: 'Streets' },
  { pattern: /\btreasury\b/g, replace: 'streets' },
  { pattern: /\bArmory\b/g, replace: 'Rooftops' },
  { pattern: /\barmory\b/g, replace: 'rooftops' },
  { pattern: /\bLaboratory\b/g, replace: 'Bank' },
  { pattern: /\blaboratory\b/g, replace: 'bank' },
  { pattern: /\bDungeon\b/g, replace: 'Sewers' },
  { pattern: /\bdungeon\b/g, replace: 'sewers' },

  // Starters
  { pattern: /\bMadame HYDRAs?\b/g, replace: (m) => m.endsWith('s') ? 'S.H.I.E.L.D. Officers' : 'S.H.I.E.L.D. Officer' },
  { pattern: /\bHYDRA Operatives?\b/g, replace: (m) => m.endsWith('s') ? 'S.H.I.E.L.D. Agents' : 'S.H.I.E.L.D. Agent' },
  { pattern: /\bHYDRA Soldiers?\b/g, replace: (m) => m.endsWith('s') ? 'S.H.I.E.L.D. Troopers' : 'S.H.I.E.L.D. Trooper' },

  // Overrun / Escape
  { pattern: /\bOverruns\b/g, replace: 'Escapes' },
  { pattern: /\boverruns\b/g, replace: 'escapes' },
  { pattern: /\bOverrunning\b/g, replace: 'Escaping' },
  { pattern: /\boverrunning\b/g, replace: 'escaping' },
  { pattern: /\bOverran\b/g, replace: 'Escaped' },
  { pattern: /\boverran\b/g, replace: 'escaped' },
  { pattern: /\bOverrun\b/g, replace: 'Escape' },
  { pattern: /\boverrun\b/g, replace: 'escape' },

  // Lair / City
  { pattern: /\bLair spaces?\b/g, replace: (m) => m.endsWith('s') ? 'City spaces' : 'City space' },
  { pattern: /\blair spaces?\b/g, replace: (m) => m.endsWith('s') ? 'city spaces' : 'city space' },
  { pattern: /\bLairs\b/g, replace: 'Cities' },
  { pattern: /\blairs\b/g, replace: 'cities' },
  { pattern: /\bLair\b/g, replace: 'City' },
  { pattern: /\blair\b/g, replace: 'city' },

  // Commander / Mastermind
  { pattern: /\bCommanders\b/g, replace: 'Masterminds' },
  { pattern: /\bcommanders\b/g, replace: 'masterminds' },
  { pattern: /\bCommander\b/g, replace: 'Mastermind' },
  { pattern: /\bcommander\b/g, replace: 'mastermind' },

  // Adversary / Villain
  { pattern: /\bAdversaries\b/g, replace: 'Villains' },
  { pattern: /\badversaries\b/g, replace: 'villains' },
  { pattern: /\bAdversary\b/g, replace: 'Villain' },
  { pattern: /\badversary\b/g, replace: 'villain' },

  // Ally / Hero (careful with capitalizations and plurals)
  { pattern: /\bAllies\b/g, replace: 'Heroes' },
  { pattern: /\ballies\b/g, replace: 'heroes' },
  { pattern: /\bAlly\b/g, replace: 'Hero' },
  { pattern: /\bally\b/g, replace: 'hero' },

  // Plot / Scheme
  { pattern: /\bPlots\b/g, replace: 'Schemes' },
  { pattern: /\bplots\b/g, replace: 'schemes' },
  { pattern: /\bPlot\b/g, replace: 'Scheme' },
  { pattern: /\bplot\b/g, replace: 'scheme' },
];

/**
 * Translates Villains & Fear Itself terminology in plain text to Standard Base Game terminology.
 */
export function translateVillainsText(text?: string): string {
  if (!text) return '';
  let result = text;
  for (const rule of RULES) {
    result = result.replace(rule.pattern, rule.replace as any);
  }
  return result;
}

/**
 * Recursively translates structured Master Strike ability objects.
 */
export function translateAbilities(abilities?: any[]): any[] {
  if (!abilities || !Array.isArray(abilities)) return [];
  
  return abilities.map(item => {
    if (item === null || item === undefined) return item;
    if (typeof item === 'string') {
      return translateVillainsText(item);
    }
    if (Array.isArray(item)) {
      return translateAbilities(item);
    }
    if (typeof item === 'object') {
      const copy: any = { ...item };
      if (typeof copy.text === 'string') {
        copy.text = translateVillainsText(copy.text);
      }
      if (typeof copy.bold === 'string') {
        copy.bold = translateVillainsText(copy.bold);
      }
      if (typeof copy.italic === 'string') {
        copy.italic = translateVillainsText(copy.italic);
      }
      if (Array.isArray(copy.points)) {
        copy.points = translateAbilities(copy.points);
      }
      return copy;
    }
    return item;
  });
}

/**
 * Checks whether translating the card would actually produce different text.
 * Returns true ONLY when the original and translated texts would be different.
 */
export function hasVillainsTerminology(text?: string, abilities?: any[], _expansion?: string): boolean {
  if (text) {
    const translated = translateVillainsText(text);
    if (translated !== text) {
      return true;
    }
  }

  if (abilities && Array.isArray(abilities) && abilities.length > 0) {
    const originalJson = JSON.stringify(abilities);
    const translatedJson = JSON.stringify(translateAbilities(abilities));
    if (originalJson !== translatedJson) {
      return true;
    }
  }

  return false;
}
