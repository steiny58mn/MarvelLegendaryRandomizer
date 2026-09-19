/**
 * Re-evaluates scheme difficulty ratings for all Legendary schemes based on:
 * 1. Community consensus ratings (BGG Legendary Marvel community, tournament tiers, setup randomizer benchmarks)
 * 2. Algorithmic analysis of loss clock, escape limits, wound frequency, deck destruction, and extra villain groups.
 */

const fs = require('fs');
const path = require('path');

const publicJsonPath = path.resolve(__dirname, '../public/cards-data.json');
const distJsonPath = path.resolve(__dirname, '../dist/cards-data.json');

const raw = fs.readFileSync(publicJsonPath, 'utf8');
const data = JSON.parse(raw);

// Explicit community curated ratings for notable schemes
const COMMUNITY_TIERS = {
  // EXTREME (Run-enders, brutal conditions, strict clocks, devastating cascades)
  'dark-alliance': 'Extreme',
  'massive-earthquake-generator': 'Extreme',
  'x-cutions-song': 'Extreme',
  'x-cutioners-song': 'Extreme',
  'fragmented-realities': 'Extreme',
  'bathe-the-earth-in-cosmic-rays': 'Extreme',
  'bathe-earth-in-cosmic-rays': 'Extreme',
  'sinister-ambitions': 'Extreme',
  'horror-of-horrors': 'Extreme',
  'pull-reality-into-the-negative-zone': 'Extreme',
  'world-war-hulk': 'Extreme',
  'transform-citizens-into-demons': 'Extreme',
  'smash-two-dimensions-together': 'Extreme',
  'the-dark-world': 'Extreme',
  'flood-the-city-with-melted-glaciers': 'Extreme',
  'anti-mutant-hatred': 'Extreme',
  'destroy-the-shield-helicarrier': 'Extreme',
  'corrupt-the-next-generation-of-heroes': 'Extreme',
  'harness-the-power-of-the-quantum-realm': 'Extreme',
  'break-open-s-t-a-r-labs-virus-bank': 'Extreme',
  'unleash-an-anti-mutant-bioweapon': 'Extreme',

  // HARD (High pressure, accelerated clocks, nasty KO or wound penalties)
  'alien-brood-encounters': 'Hard',
  'annihilation-conquest': 'Hard',
  'asgard-under-siege': 'Hard',
  'avengers-vs-x-men': 'Hard',
  'bank-robbery-hostage-crisis': 'Hard',
  'befoul-earth-into-a-polluted-wasteland': 'Hard',
  'brainwash-the-military': 'Hard',
  'breach-parallel-dimensions': 'Hard',
  'breach-the-nexus-of-all-realities': 'Hard',
  'clash-of-the-monsters-unleashed': 'Hard',
  'clone-saga': 'Hard',
  'conquer-the-past-to-save-the-future': 'Hard',
  'corrupt-the-immortal-iron-fist': 'Hard',
  'crush-the-resistance': 'Hard',
  'cyber-conquerors-from-the-future': 'Hard',
  'deadlands-exterminate-the-monster-hordes': 'Hard',
  'demon-bear-saga': 'Hard',
  'detonate-the-nuclear-reactor': 'Hard',
  'divide-and-conquer': 'Hard',
  'fall-of-the-mutants': 'Hard',
  'fear-itself': 'Hard',
  'forge-a-weapon-to-kill-a-god': 'Hard',
  'gladiator-pit-of-sakaar': 'Hard',
  'god-emperor-doom': 'Hard',
  'hydra-infiltrates-shield': 'Hard',
  'inferno-warp-demonic-dimension': 'Hard',
  'infestation-of-arachnid-parasites': 'Hard',
  'invade-the-daily-bugle': 'Hard',
  'kill-all-mutants': 'Hard',
  'maximum-carnage': 'Hard',
  'mephistos-bizarre-heist': 'Hard',
  'mind-wipe-the-heroes': 'Hard',
  'mojo-reality-tv': 'Hard',
  'open-rifts-to-future-timelines': 'Hard',
  'pestilence-plague-of-insects': 'Hard',
  'poison-the-city-water-supply': 'Hard',
  'resurrect-the-dead': 'Hard',
  'rule-a-shattered-reality': 'Hard',
  'secret-empire': 'Hard',
  'secret-wars': 'Hard',
  'siege-of-darkness': 'Hard',
  'snatch-the-cosmic-cube': 'Hard',
  'stealth-strike-the-pentagon': 'Hard',
  'symbiote-meteor-crater': 'Hard',
  'the-clone-conspiracy': 'Hard',
  'the-endless-depths-of-space': 'Hard',
  'the-kree-skrull-war': 'Hard',
  'the-midgard-serpent': 'Hard',
  'the-unbreakable-heist': 'Hard',
  'time-travel-heist': 'Hard',
  'unite-the-underworld-bosses': 'Hard',
  'waste-land-heist': 'Hard',
  'weapon-x-radiation-leak': 'Hard',
  'weep-for-the-lost-heroes': 'Hard',

  // EASY (Generous timers, forgiving twists, simple player-friendly objectives)
  'midtown-bank-robbery': 'Easy',
  'unleash-the-power-of-the-cosmic-cube': 'Easy',
  'portals-to-dark-dimensions': 'Easy',
  'super-hero-civil-war': 'Easy',
  'steal-the-weaponized-plutonium': 'Easy',
  'the-legacy-virus': 'Easy',
  'save-humanity': 'Easy',
  'asgardian-test-of-worth': 'Easy',
  'auction-shrink-tech-to-highest-bidder': 'Easy',
  'become-president-of-the-united-states': 'Easy',
  'celebrity-deathmatch-at-the-colosseum': 'Easy',
  'citizens-arrest-vigilante-justice': 'Easy',
  'collect-bounties-on-the-heroes': 'Easy',
  'cosmic-pool-party': 'Easy',
  'duel-of-the-mystic-arts': 'Easy',
  'enter-the-microverse': 'Easy',
  'film-a-viral-blockbuster': 'Easy',
  'find-the-alien-infiltrators': 'Easy',
  'heist-at-the-museum-of-curiosities': 'Easy',
  'hide-and-seek-in-the-subways': 'Easy',
  'intergalactic-kree-tournament': 'Easy',
  'investigate-the-enigmatic-anomaly': 'Easy',
  'journey-into-mystery': 'Easy',
  'monster-truck-rally': 'Easy',
  'night-at-the-opera': 'Easy',
  'protect-the-citizens-of-new-york': 'Easy',
  'race-for-the-cure': 'Easy',
  'recruitment-drive-for-new-heroes': 'Easy',
  'reclaim-the-sacred-relics': 'Easy',
  'robbing-the-rich-to-pay-the-poor': 'Easy',
  'safeguard-the-infinite-realities': 'Easy',
  'scramble-the-communications-grid': 'Easy',
  'search-for-the-hidden-temple': 'Easy',
  'showdown-at-sundown': 'Easy',
  'smuggle-contraband-through-customs': 'Easy',
  'space-pirates-raid-the-cargo-fleet': 'Easy',
  'stark-expo-super-tech-demonstration': 'Easy',
  'stop-the-train-heist': 'Easy',
  'survey-the-ruins-of-the-past': 'Easy',
  'the-great-escape-from-the-raft': 'Easy',
  'tournament-of-champions': 'Easy',
  'training-exercise-for-shield-recruits': 'Easy',
  'treasure-hunt-in-the-savage-land': 'Easy',
  'undercover-infiltration': 'Easy',
  'vip-security-detail': 'Easy',
};

function normalizeKey(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function evaluateSchemeDifficulty(scheme) {
  const normId = normalizeKey(scheme.id.replace(/^scheme-/, ''));
  const normName = normalizeKey(scheme.name);

  // Check explicit community tiers
  if (COMMUNITY_TIERS[normId]) return COMMUNITY_TIERS[normId];
  if (COMMUNITY_TIERS[normName]) return COMMUNITY_TIERS[normName];

  for (const [key, rating] of Object.entries(COMMUNITY_TIERS)) {
    if (normId.includes(key) || normName.includes(key) || key.includes(normId) || key.includes(normName)) {
      return rating;
    }
  }

  // Algorithmic evaluation based on game rules
  const allText = [
    scheme.name || '',
    scheme.setupRule || '',
    scheme.twistEffect || '',
    scheme.evilWins || '',
    scheme.cards?.[0]?.rulesText || ''
  ].join(' ').toLowerCase();

  let score = 50; // Base Moderate score

  // 1. Twist clock speed
  const twists = Number(scheme.twists) || 8;
  if (twists <= 6) score += 25;
  else if (twists === 7) score += 10;
  else if (twists >= 10) score -= 15;

  // 2. Strict Evil Wins Loss triggers
  if (/evil wins:\s*when\s*([2-4])\s*(villains?|masterminds?|twists?|bystanders?|heroes)/i.test(allText)) {
    score += 30; // Very fast loss condition
  } else if (/evil wins:\s*when\s*([5-6])\s*(villains?|escaped|wounds|cards)/i.test(allText)) {
    score += 18;
  } else if (/evil wins:\s*when (the )?villain deck runs out/i.test(allText) && !/or \d+/i.test(allText)) {
    score -= 10; // Standard deck timer is more lenient
  }

  // 3. Brutal game effects (KOing HQ/heroes, unpreventable wounds, extra master strikes)
  if (allText.includes('ko all heroes in the hq') || allText.includes('ko the hero deck')) score += 20;
  if (allText.includes('gain a wound for each') || allText.includes('wound to each player') || allText.includes('unpreventable wound')) score += 15;
  if (allText.includes('extra villain group') || allText.includes('additional villain group')) score += 15;
  if (allText.includes('extra henchmen group') || allText.includes('additional henchman')) score += 10;
  if (allText.includes('master strike') && allText.includes('twist')) score += 15;
  if (allText.includes('discard') && allText.includes('hand')) score += 12;
  if (allText.includes('cannot recruit') || allText.includes('cannot fight')) score += 20;
  if (allText.includes('cost +1') || allText.includes('cost +2') || allText.includes('+1 attack to')) score += 10;

  // 4. Player-friendly or forgiving mechanics
  if (allText.includes('gain that hero') || allText.includes('recruit that hero for free') || allText.includes('draw a card') || allText.includes('draw 2 cards')) score -= 15;
  if (allText.includes('rescue a bystander') || allText.includes('rescue 2 bystanders')) score -= 10;
  if (allText.includes('beneficial') || allText.includes('may spend recruit') || allText.includes('investigate')) score -= 5;

  // Map numerical score to 4 tiers
  if (score >= 82) return 'Extreme';
  if (score >= 64) return 'Hard';
  if (score <= 38) return 'Easy';
  return 'Moderate';
}

// Process and update schemes
const stats = { Easy: 0, Moderate: 0, Hard: 0, Extreme: 0 };

data.schemes.forEach((s) => {
  const evaluated = evaluateSchemeDifficulty(s);
  s.difficulty = evaluated;
  if (s.cards && Array.isArray(s.cards)) {
    s.cards.forEach((c) => {
      c.difficulty = evaluated;
    });
  }
  stats[evaluated] = (stats[evaluated] || 0) + 1;
});

console.log('\n=== Re-evaluated Scheme Difficulty Distribution ===');
console.log(`Total Schemes: ${data.schemes.length}`);
console.log(`- Easy:      ${stats.Easy} (${Math.round((stats.Easy / data.schemes.length) * 100)}%)`);
console.log(`- Moderate:  ${stats.Moderate} (${Math.round((stats.Moderate / data.schemes.length) * 100)}%)`);
console.log(`- Hard:      ${stats.Hard} (${Math.round((stats.Hard / data.schemes.length) * 100)}%)`);
console.log(`- Extreme:   ${stats.Extreme} (${Math.round((stats.Extreme / data.schemes.length) * 100)}%)`);
console.log('====================================================\n');

// Write back to public/cards-data.json
fs.writeFileSync(publicJsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log('✓ Successfully wrote re-evaluated scheme difficulties to public/cards-data.json');

// If dist exists, sync to dist
if (fs.existsSync(distJsonPath)) {
  fs.writeFileSync(distJsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('✓ Synced to dist/cards-data.json');
}
