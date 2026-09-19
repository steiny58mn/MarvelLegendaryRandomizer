export type CardType = 'scheme' | 'mastermind' | 'hero' | 'villain' | 'henchman';

export type TeamAffiliation =
  | 'Avengers'
  | 'X-Men'
  | 'Spider-Friends'
  | 'S.H.I.E.L.D.'
  | 'Guardians of the Galaxy'
  | 'Marvel Knights'
  | 'Fantastic Four'
  | 'Champions'
  | 'Inhumans'
  | 'Illuminati'
  | 'Cabal'
  | 'Mercs for Money'
  | 'Heroes of Asgard'
  | 'New Mutants'
  | 'Warbound'
  | 'Midnight Sons'
  | 'Guardians of the Multiverse'
  | 'Spider-Friends 2099'
  | 'Unaffiliated'
  | string;

export type HeroClass = 'Instinct' | 'Strength' | 'Tech' | 'Covert' | 'Ranged';

export type LegendaryUniverse =
  | 'Marvel'
  | 'DC'
  | 'Alien'
  | 'Predator'
  | 'The Matrix'
  | 'James Bond'
  | 'Game of Thrones'
  | 'X-Files'
  | 'Buffy the Vampire Slayer'
  | 'Firefly'
  | 'Big Trouble in Little China'
  | 'Cthulhu';

export interface Expansion {
  id: string;
  name: string;
  boxType: 'Core' | 'Big Box' | 'Small Box';
  releaseYear: number;
  icon?: string;
  description: string;
  universe?: LegendaryUniverse;
  order?: number;
}

export interface CardDetail {
  name: string;
  quantity?: number;
  cost?: string | number;
  recruit?: string | number;
  attack?: string | number;
  rulesText?: string;
  imageUrl?: string;
  transformed?: boolean;
  abilities?: any[];
}

export interface SchemeCard {
  id: string;
  name: string;
  expansion: string;
  twists: number;
  setupRule: string;
  specialRules?: string;
  twistEffect: string;
  evilWins: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  extraVillains?: number;
  extraHenchmen?: number;
  extraHeroes?: number;
  extraBystanders?: number;
  customBystanders?: number;
  extraTwists?: number;
  requiresSpecificGroup?: string;
  requiresSpecificHenchman?: string;
  keywords?: string[];
  cards?: CardDetail[];
  imageUrl?: string;
}

export interface MastermindCard {
  id: string;
  name: string;
  expansion: string;
  attack: number;
  victoryPoints: number;
  vp?: number;
  alwaysLeads: string;
  masterStrikeText: string;
  epicAttack?: number;
  tacticsCount?: number;
  keywords?: string[];
  cards?: CardDetail[];
  imageUrl?: string;
}

export interface HeroCard {
  id: string;
  name: string;
  realName?: string;
  expansion: string;
  team: TeamAffiliation;
  classes: HeroClass[];
  highlightKeywords?: string[];
  keywords?: string[];
  cardsDescription?: string;
  cards?: CardDetail[];
  imageUrl?: string;
}

export interface VillainGroup {
  id: string;
  name: string;
  expansion: string;
  cardsCount: number;
  ledBy?: string[];
  fightEffect?: string;
  escapeEffect?: string;
  keywords?: string[];
  cards?: CardDetail[];
  imageUrl?: string;
}

export interface HenchmanGroup {
  id: string;
  name: string;
  expansion: string;
  cardsCount: number;
  fightEffect?: string;
  keywords?: string[];
  cards?: CardDetail[];
  imageUrl?: string;
}

export type AlwaysLeadsRule = 'guarantee' | 'prioritize' | 'ignore' | 'random' | 'balanced';

export type UniverseMode = 'mix' | 'single' | 'selected';

export interface GeneratorSettings {
  playerCount: number;
  soloVariant: 'standard' | 'advanced';
  alwaysLeadsRule: AlwaysLeadsRule;
  ignoreAlwaysLeadsInSolo?: boolean;
  enabledExpansions: string[];
  excludedCardIds: string[];
  includedCardIds?: string[];
  maxDifficulty?: 'Any' | 'Easy' | 'Moderate' | 'Hard';
  universeMode?: UniverseMode;
  selectedUniverses?: LegendaryUniverse[];
  translateVillainsTerms?: boolean;
}

export interface RandomizerSettings extends GeneratorSettings {
  includeSpecialBystanders?: boolean;
  teamSynergyMode?: string;
}

export interface DeckBreakdown {
  heroDeckCount: number;
  heroCount: number;
  villainDeckTotal: number;
  villainCards: number;
  henchmenCards: number;
  bystanders: number;
  masterStrikes: number;
  schemeTwists: number;
  extraCards: { name: string; count: number; description?: string }[];
  cityHenchmen?: number;
}

export interface ActiveSetup {
  id: string;
  timestamp: number;
  playerCount: number;
  soloVariant: 'standard' | 'advanced';
  mastermind: MastermindCard;
  scheme: SchemeCard;
  heroes: HeroCard[];
  villains: VillainGroup[];
  henchmen: HenchmanGroup[];
  bystandersCount: number;
  masterStrikesCount: number;
  twistsCount: number;
  lockedSlots: {
    mastermind?: boolean;
    scheme?: boolean;
    heroes?: { [index: number]: boolean };
    villains?: { [index: number]: boolean };
    henchmen?: { [index: number]: boolean };
  };
  specialSetupNotes: string[];
  deckBreakdown: DeckBreakdown;
}

export interface GameScoreResult {
  id: string;
  date: string;
  setupId?: string;
  playerCount: number;
  outcome: 'Victory' | 'Defeat';
  mastermindName: string;
  schemeName: string;
  heroesList: string[];
  // Official Score breakdown
  mastermindTacticsDefeated: number;
  villainCardsVPTotal: number;
  rescuedBystandersCount: number;
  escapedVillainsPenaltyCount: number;
  carriedOffBystandersPenaltyCount: number;
  schemeTwistsInEscapePenaltyCount: number;
  bonusPoints: number;
  finalScore: number;
  notes?: string;
}
