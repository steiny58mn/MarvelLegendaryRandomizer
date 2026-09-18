export interface GameSymbol {
  id: string;
  name: string;
  category: 'core' | 'class' | 'team';
  iconSrc: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
  aliases: string[];
}

export const SYMBOL_DEFINITIONS: Record<string, GameSymbol> = {
  // Core Game Stats / Icons
  attack: {
    id: 'attack',
    name: 'Attack',
    category: 'core',
    iconSrc: '/icons/attack.svg',
    color: '#ef4444',
    badgeBg: 'bg-red-950/60',
    badgeBorder: 'border-red-600/40',
    description: 'Attack power used to fight Villains and Masterminds. Displayed as red claw slashes.',
    aliases: ['attack', 'atk', 'slashes', 'red slashes', 'icon:1', 'icon1', '1']
  },
  recruit: {
    id: 'recruit',
    name: 'Recruit',
    category: 'core',
    iconSrc: '/icons/recruit.svg',
    color: '#eab308',
    badgeBg: 'bg-amber-950/60',
    badgeBorder: 'border-amber-500/40',
    description: 'Recruit points used to recruit Heroes from the HQ or S.H.I.E.L.D. Officers. Displayed as a gold star.',
    aliases: ['recruit', 'rec', 'star', 'gold star', 'icon:2', 'icon2', '2']
  },
  cost: {
    id: 'cost',
    name: 'Cost',
    category: 'core',
    iconSrc: '/icons/cost.svg',
    color: '#94a3b8',
    badgeBg: 'bg-slate-800/60',
    badgeBorder: 'border-slate-600/40',
    description: 'The recruit cost required to recruit this Hero card or fight a target. Displayed as a silver coin.',
    aliases: ['cost', 'coin', 'silver coin', 'icon:3', 'icon3', '3']
  },
  vp: {
    id: 'vp',
    name: 'Victory Points',
    category: 'core',
    iconSrc: '/icons/vp.svg',
    color: '#f59e0b',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/30',
    description: 'Victory Points awarded for defeating this enemy or saving Bystanders.',
    aliases: ['vp', 'victory points', 'victory point', 'icon:4', 'icon4', '4']
  },
  piercing: {
    id: 'piercing',
    name: 'Piercing Energy',
    category: 'core',
    iconSrc: '/icons/piercing.svg',
    color: '#38bdf8',
    badgeBg: 'bg-sky-950/60',
    badgeBorder: 'border-sky-500/40',
    description: 'Piercing Energy directly damages enemies bypassing normal defense values or armor.',
    aliases: ['piercing', 'piercing energy', 'icon:6', 'icon6', '6']
  },
  token: {
    id: 'token',
    name: 'Token Card',
    category: 'core',
    iconSrc: '/icons/token.svg',
    color: '#a855f7',
    badgeBg: 'bg-purple-950/60',
    badgeBorder: 'border-purple-500/40',
    description: 'Token card representing temporary or summoned game elements.',
    aliases: ['token', 'token card', 'icon:7', 'icon7', '7']
  },

  // Hero Classes
  covert: {
    id: 'covert',
    name: 'Covert',
    category: 'class',
    iconSrc: '/icons/covert.svg',
    color: '#f87171',
    badgeBg: 'bg-red-950/50',
    badgeBorder: 'border-red-500/30',
    description: 'Covert Class (Red) focuses on stealth, assassination, manipulation, and espionage.',
    aliases: ['covert', 'hc:1', 'hc1']
  },
  instinct: {
    id: 'instinct',
    name: 'Instinct',
    category: 'class',
    iconSrc: '/icons/instinct.svg',
    color: '#facc15',
    badgeBg: 'bg-yellow-950/50',
    badgeBorder: 'border-yellow-500/30',
    description: 'Instinct Class (Yellow) focuses on primal reflexes, wild combat, and drawing extra cards.',
    aliases: ['instinct', 'hc:2', 'hc2']
  },
  ranged: {
    id: 'ranged',
    name: 'Ranged',
    category: 'class',
    iconSrc: '/icons/ranged.svg',
    color: '#60a5fa',
    badgeBg: 'bg-blue-950/50',
    badgeBorder: 'border-blue-500/30',
    description: 'Ranged Class (Blue) focuses on energy blasts, distance attacks, and versatile strikes.',
    aliases: ['ranged', 'hc:3', 'hc3']
  },
  strength: {
    id: 'strength',
    name: 'Strength',
    category: 'class',
    iconSrc: '/icons/strength.svg',
    color: '#4ade80',
    badgeBg: 'bg-green-950/50',
    badgeBorder: 'border-green-500/30',
    description: 'Strength Class (Green) focuses on brute force, immense damage, and smashing through obstacles.',
    aliases: ['strength', 'hc:4', 'hc4']
  },
  tech: {
    id: 'tech',
    name: 'Tech',
    category: 'class',
    iconSrc: '/icons/tech.svg',
    color: '#94a3b8',
    badgeBg: 'bg-slate-800/60',
    badgeBorder: 'border-slate-500/30',
    description: 'Tech Class (Silver/Grey) focuses on gadgets, armors, preparation, and deck consistency.',
    aliases: ['tech', 'hc:5', 'hc5']
  },

  // Teams & Affiliations
  avengers: {
    id: 'avengers',
    name: 'Avengers',
    category: 'team',
    iconSrc: '/icons/avengers.svg',
    color: '#38bdf8',
    badgeBg: 'bg-sky-900/80',
    badgeBorder: 'border-sky-400/50',
    description: 'Earth’s Mightiest Heroes.',
    aliases: ['avengers', 'team:1', 'team1', '1']
  },
  shield: {
    id: 'shield',
    name: 'S.H.I.E.L.D.',
    category: 'team',
    iconSrc: '/icons/shield.svg',
    color: '#60a5fa',
    badgeBg: 'bg-slate-700/85',
    badgeBorder: 'border-slate-400/60',
    description: 'Strategic Homeland Intervention, Enforcement and Logistics Division.',
    aliases: ['s.h.i.e.l.d.', 'shield', 'team:2', 'team2', '2', 'agents of shield', 'agents-of-shield']
  },
  'spider-friends': {
    id: 'spider-friends',
    name: 'Spider-Friends',
    category: 'team',
    iconSrc: '/icons/spider-friends.svg',
    color: '#ef4444',
    badgeBg: 'bg-red-900/80',
    badgeBorder: 'border-red-400/50',
    description: 'Spider-Man, Spider-Woman, and friendly neighborhood allies.',
    aliases: ['spider-friends', 'spider friends', 'spiderfriends', 'team:3', 'team3', '3']
  },
  'x-men': {
    id: 'x-men',
    name: 'X-Men',
    category: 'team',
    iconSrc: '/icons/x-men.svg',
    color: '#eab308',
    badgeBg: 'bg-amber-900/80',
    badgeBorder: 'border-amber-400/50',
    description: 'Mutant heroes fighting to protect a world that fears and hates them.',
    aliases: ['x-men', 'xmen', 'team:4', 'team4', '4']
  },
  'fantastic-four': {
    id: 'fantastic-four',
    name: 'Fantastic Four',
    category: 'team',
    iconSrc: '/icons/fantastic-four.svg',
    color: '#3b82f6',
    badgeBg: 'bg-blue-900/80',
    badgeBorder: 'border-blue-400/50',
    description: 'Marvel’s First Family of cosmic explorers and heroic pioneers.',
    aliases: ['fantastic four', 'fantastic-four', 'ff', 'team:5', 'team5', '5', 'team:9', 'team9', '9']
  },
  'marvel-knights': {
    id: 'marvel-knights',
    name: 'Marvel Knights',
    category: 'team',
    iconSrc: '/icons/marvel-knights.svg',
    color: '#c084fc',
    badgeBg: 'bg-purple-800/80',
    badgeBorder: 'border-purple-400/60',
    description: 'Street-level vigilantes defending the city against urban crime.',
    aliases: ['marvel knights', 'marvel-knights', 'marvelknights', 'team:6', 'team6', '6']
  },
  'x-force': {
    id: 'x-force',
    name: 'X-Force',
    category: 'team',
    iconSrc: '/icons/x-force.svg',
    color: '#94a3b8',
    badgeBg: 'bg-slate-700/85',
    badgeBorder: 'border-slate-400/60',
    description: 'Proactive black-ops strike team confronting existential mutant threats.',
    aliases: ['x-force', 'xforce', 'team:7', 'team7', '7']
  },
  'guardians-of-the-galaxy': {
    id: 'guardians-of-the-galaxy',
    name: 'Guardians of the Galaxy',
    category: 'team',
    iconSrc: '/icons/guardians-of-the-galaxy.svg',
    color: '#ec4899',
    badgeBg: 'bg-pink-900/80',
    badgeBorder: 'border-pink-400/50',
    description: 'Intergalactic misfits and defenders of deep cosmic space.',
    aliases: ['guardians of the galaxy', 'guardians-of-the-galaxy', 'gotg', 'team:8', 'team8', '8']
  },
  inhumans: {
    id: 'inhumans',
    name: 'Inhumans',
    category: 'team',
    iconSrc: '/icons/inhumans.svg',
    color: '#818cf8',
    badgeBg: 'bg-indigo-700/85',
    badgeBorder: 'border-indigo-400/60',
    description: 'The Royal Family of Attilan altered by the Terrigen Mists.',
    aliases: ['inhumans', 'team:17', 'team17', '17']
  },
  'heroes-of-wakanda': {
    id: 'heroes-of-wakanda',
    name: 'Heroes of Wakanda',
    category: 'team',
    iconSrc: '/icons/heroes-of-wakanda.svg',
    color: '#a78bfa',
    badgeBg: 'bg-purple-800/80',
    badgeBorder: 'border-purple-400/60',
    description: 'Protectors and champions of the sovereign African kingdom of Wakanda.',
    aliases: ['heroes of wakanda', 'heroes-of-wakanda', 'wakanda', 'team:22', 'team22', '22']
  },
  'heroes-of-asgard': {
    id: 'heroes-of-asgard',
    name: 'Heroes of Asgard',
    category: 'team',
    iconSrc: '/icons/heroes-of-asgard.svg',
    color: '#f59e0b',
    badgeBg: 'bg-amber-900/80',
    badgeBorder: 'border-amber-400/50',
    description: 'Gods and warriors defending the Golden Realm of Asgard.',
    aliases: ['heroes of asgard', 'heroes-of-asgard', 'heroesofasgard', 'asgard', 'asgardian', 'team:21', 'team21', '21']
  },
  'midnight-sons': {
    id: 'midnight-sons',
    name: 'Midnight Sons',
    category: 'team',
    iconSrc: '/icons/midnight-sons.svg',
    color: '#f97316',
    badgeBg: 'bg-orange-900/80',
    badgeBorder: 'border-orange-400/50',
    description: 'Occult and supernatural protectors battling eldritch horrors.',
    aliases: ['midnight sons', 'midnight-sons', 'midnightsons']
  },
  hydra: {
    id: 'hydra',
    name: 'HYDRA',
    category: 'team',
    iconSrc: '/icons/hydra.svg',
    color: '#22c55e',
    badgeBg: 'bg-emerald-900/80',
    badgeBorder: 'border-emerald-400/50',
    description: 'Cut off one head, two more shall take its place.',
    aliases: ['hydra', 'team:12', 'team12', '12']
  },
  brotherhood: {
    id: 'brotherhood',
    name: 'Brotherhood',
    category: 'team',
    iconSrc: '/icons/brotherhood.svg',
    color: '#ef4444',
    badgeBg: 'bg-red-900/80',
    badgeBorder: 'border-red-400/50',
    description: 'Brotherhood of Mutants fighting for mutant supremacy.',
    aliases: ['brotherhood', 'team:10', 'team10', '10']
  },
  cabal: {
    id: 'cabal',
    name: 'Cabal',
    category: 'team',
    iconSrc: '/icons/cabal.svg',
    color: '#a855f7',
    badgeBg: 'bg-purple-800/80',
    badgeBorder: 'border-purple-400/50',
    description: 'Secret alliance of supervillains and dark conspirators.',
    aliases: ['cabal', 'team:11', 'team11', '11']
  },
  'sinister-six': {
    id: 'sinister-six',
    name: 'Sinister Six',
    category: 'team',
    iconSrc: '/icons/sinister-six.svg',
    color: '#10b981',
    badgeBg: 'bg-emerald-900/80',
    badgeBorder: 'border-emerald-400/50',
    description: 'A deadly coalition of Spider-Man’s greatest adversaries.',
    aliases: ['sinister six', 'sinister-six', 'team:14', 'team14', '14']
  },
  'mercs-for-money': {
    id: 'mercs-for-money',
    name: 'Mercs for Money',
    category: 'team',
    iconSrc: '/icons/mercs-for-money.svg',
    color: '#ef4444',
    badgeBg: 'bg-rose-900/80',
    badgeBorder: 'border-rose-400/50',
    description: 'Deadpool’s crew of mercenary heroes and eccentric guns-for-hire.',
    aliases: ['mercs for money', 'mercs-for-money', 'team:23', 'team23', '23']
  },
  warbound: {
    id: 'warbound',
    name: 'Warbound',
    category: 'team',
    iconSrc: '/icons/warbound.svg',
    color: '#4ade80',
    badgeBg: 'bg-emerald-800/80',
    badgeBorder: 'border-emerald-400/60',
    description: 'Gladiators of Sakaar sworn by oath to fight alongside the Hulk.',
    aliases: ['warbound', 'team:19', 'team19', '19']
  },
  'new-warriors': {
    id: 'new-warriors',
    name: 'New Warriors',
    category: 'team',
    iconSrc: '/icons/new-warriors.svg',
    color: '#38bdf8',
    badgeBg: 'bg-sky-900/80',
    badgeBorder: 'border-sky-400/50',
    description: 'Youthful superhero team dedicated to proving themselves.',
    aliases: ['new warriors', 'new-warriors']
  },
  'x-factor-investigations': {
    id: 'x-factor-investigations',
    name: 'X-Factor Investigations',
    category: 'team',
    iconSrc: '/icons/x-factor-investigations.svg',
    color: '#c084fc',
    badgeBg: 'bg-purple-800/80',
    badgeBorder: 'border-purple-400/60',
    description: 'Private detective agency investigating mutant affairs and mysterious crimes.',
    aliases: ['x-factor investigations', 'x-factor-investigations', 'x-factor', 'xfactor']
  },
  'foes-of-asgard': {
    id: 'foes-of-asgard',
    name: 'Foes of Asgard',
    category: 'team',
    iconSrc: '/icons/foes-of-asgard.svg',
    color: '#ef4444',
    badgeBg: 'bg-red-900/80',
    badgeBorder: 'border-red-400/50',
    description: 'Frost Giants, Dark Elves, and enemies of the Realm of Asgard.',
    aliases: ['foes of asgard', 'foes-of-asgard']
  },
  'guardians-of-the-multiverse': {
    id: 'guardians-of-the-multiverse',
    name: 'Guardians of the Multiverse',
    category: 'team',
    iconSrc: '/icons/guardians-of-the-multiverse.svg',
    color: '#ec4899',
    badgeBg: 'bg-pink-900/80',
    badgeBorder: 'border-pink-400/50',
    description: 'Multiversal alliance gathered by the Watcher to protect reality.',
    aliases: ['guardians of the multiverse', 'guardians-of-the-multiverse']
  },
  illuminati: {
    id: 'illuminati',
    name: 'Illuminati',
    category: 'team',
    iconSrc: '/icons/illuminati.svg',
    color: '#fbbf24',
    badgeBg: 'bg-amber-900/80',
    badgeBorder: 'border-amber-400/50',
    description: 'Secret council of influential leaders shaping the fate of the Marvel universe.',
    aliases: ['illuminati', 'team:13', 'team13', '13']
  },
  champions: {
    id: 'champions',
    name: 'Champions',
    category: 'team',
    iconSrc: '/icons/champions.svg',
    color: '#fb923c',
    badgeBg: 'bg-orange-900/80',
    badgeBorder: 'border-orange-400/50',
    description: 'Next-generation teenage heroes dedicated to building a better world.',
    aliases: ['champions']
  },
  'crime-syndicate': {
    id: 'crime-syndicate',
    name: 'Crime Syndicate',
    category: 'team',
    iconSrc: '/icons/crime-syndicate.svg',
    color: '#94a3b8',
    badgeBg: 'bg-slate-700/85',
    badgeBorder: 'border-slate-400/60',
    description: 'Organized mobsters and underground criminal cartels.',
    aliases: ['crime syndicate', 'crime-syndicate']
  },
  venomverse: {
    id: 'venomverse',
    name: 'Venomverse',
    category: 'team',
    iconSrc: '/icons/venomverse.svg',
    color: '#cbd5e1',
    badgeBg: 'bg-slate-700/85',
    badgeBorder: 'border-slate-400/60',
    description: 'Symbiote-bonded heroes and villains across the multiverse.',
    aliases: ['venomverse', 'symbiote']
  },
  'unaffiliated': {
    id: 'unaffiliated',
    name: 'Unaffiliated',
    category: 'team',
    iconSrc: '/icons/unaffiliated.svg',
    color: '#94a3b8',
    badgeBg: 'bg-slate-800/80',
    badgeBorder: 'border-slate-500/50',
    description: 'No team affiliation.',
    aliases: ['unaffiliated', 'none', 'neutral', 'block']
  }
};

/**
 * Helper to look up a symbol definition by any identifier, alias, or numeric code
 */
export function findSymbol(query: string | number): GameSymbol | undefined {
  if (query === undefined || query === null) return undefined;
  const q = String(query).toLowerCase().trim().replace(/[[\]:]/g, '');

  // Direct ID check
  if (SYMBOL_DEFINITIONS[q]) return SYMBOL_DEFINITIONS[q];

  // Number / numeric ID check
  if (q === '1' || q === 'icon1') return SYMBOL_DEFINITIONS.attack;
  if (q === '2' || q === 'icon2') return SYMBOL_DEFINITIONS.recruit;
  if (q === '3' || q === 'icon3') return SYMBOL_DEFINITIONS.cost;
  if (q === '4' || q === 'icon4') return SYMBOL_DEFINITIONS.vp;
  if (q === '6' || q === 'icon6') return SYMBOL_DEFINITIONS.piercing;
  if (q === '7' || q === 'icon7') return SYMBOL_DEFINITIONS.token;

  if (q === 'hc1') return SYMBOL_DEFINITIONS.covert;
  if (q === 'hc2') return SYMBOL_DEFINITIONS.instinct;
  if (q === 'hc3') return SYMBOL_DEFINITIONS.ranged;
  if (q === 'hc4') return SYMBOL_DEFINITIONS.strength;
  if (q === 'hc5') return SYMBOL_DEFINITIONS.tech;

  // Search aliases
  for (const def of Object.values(SYMBOL_DEFINITIONS)) {
    if (def.aliases.some(a => a.toLowerCase().replace(/[:\s-]/g, '') === q.replace(/[:\s-]/g, ''))) {
      return def;
    }
  }

  return undefined;
}
