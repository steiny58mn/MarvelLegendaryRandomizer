import { GAME_KEYWORDS, getKeywordRule } from '../data/keywords';

export interface SplitHalfDetail {
  name: string;
  subtitle?: string;
  cost?: string | number | null;
  recruit?: string | number | null;
  attack?: string | number | null;
  piercing?: string | number | null;
  heroClass?: string;
  team?: string;
  rulesText?: string;
  sideLabel: string;
  keywords?: string[];
}

export interface SplitCardParsed {
  isDivided: boolean;
  left: SplitHalfDetail;
  right: SplitHalfDetail;
}

const CLASS_NAMES: string[] = ['Covert', 'Instinct', 'Ranged', 'Strength', 'Tech'];

const IGNORED_KEYWORDS: string[] = [
  'Ambush',
  'Fight',
  'Escape',
  'Rescue',
  'Strike',
  'Master Strike',
  'Command Strike',
  'Scheme Twist',
  'Plot Twist',
  'Wound',
  'Bribe',
  'Bystander Rescue'
];

export function extractSplitKeywords(text?: string): string[] {
  if (!text) return [];
  const found = new Set<string>();

  for (const kw of GAME_KEYWORDS) {
    if (IGNORED_KEYWORDS.includes(kw.name)) continue;

    let matched = false;
    if (kw.matchPattern) {
      try {
        const regex = new RegExp(kw.matchPattern, 'i');
        if (regex.test(text)) matched = true;
      } catch {
        // ignore regex error
      }
    } else {
      const nameRegex = new RegExp(`\\b${kw.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (nameRegex.test(text)) matched = true;

      if (!matched && kw.aliases) {
        for (const alias of kw.aliases) {
          const aliasRegex = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
          if (aliasRegex.test(text)) {
            matched = true;
            break;
          }
        }
      }
    }

    if (matched) {
      found.add(kw.name);
    }
  }

  return Array.from(found).filter((kw: string) => !getKeywordRule(kw).includes('thematic tag'));
}

export function sanitizeRulesText(raw: string = ''): string {
  if (!raw) return '';
  let lines = raw.split('\n').filter((l: string) => !/^\s*={2,}\s*[^=]+\s*={2,}\s*$/.test(l.trim()));
  lines = lines.map((line: string) => {
    line = line.replace(/\[url=[^\]]*\](.*?)\[\/url\]/gi, '$1');
    line = line.replace(/\[\/?url[^\]]*\]/gi, '');
    line = line.replace(/\[\/?(BGCOLOR|COLOR)[^\]]*\]/gi, '');
    line = line.replace(/\[\/?(b|i)\]/gi, '');
    line = line.replace(/\s*={2,}\s*[^=]+\s*={2,}\s*/g, '');
    return line;
  });

  return lines.join('\n').trim().replace(/\n{3,}/g, '\n\n');
}

/**
 * Checks if a card is a divided/split card and parses it into two distinct halves (left and right),
 * each with its own independent name, subtitle, cost, attack, recruit, heroClass, and rules text.
 */
export function parseSplitCard(card: any): SplitCardParsed | null {
  if (!card) return null;

  const rawName: string = card.name || '';
  const rawRules: string = card.rulesText || '';
  const isSplit: boolean =
    card.isDivided === true ||
    card.divided === true ||
    rawName.includes(' / ') ||
    rawName.includes(' // ') ||
    rawRules.includes('---');

  if (!isSplit) return null;

  // Split name
  const nameParts: string[] = rawName.split(/\s*\/\/?\s*/).map((s: string) => s.trim());
  const leftNameRaw: string = nameParts[0] || rawName;
  const rightNameRaw: string = nameParts[1] || '';

  // Split rules text by separator
  const ruleParts: string[] = rawRules.split(/\n*---+\n*/);
  const leftRulesRaw: string = ruleParts[0] || '';
  const rightRaw: string = ruleParts[1] || '';

  // Parse right half lines
  const rightLines: string[] = rightRaw.split('\n').map((l: string) => l.trim()).filter(Boolean);
  let rName: string = rightNameRaw;
  let rSubtitle: string = '';
  let rCost: string | number | null | undefined = card.cost ?? null;
  let rAttack: string | number | null = null;
  let rRecruit: string | number | null = null;
  let rPiercing: string | number | null = null;
  let rHeroClass: string = '';
  let rTeam: string = '';
  const rRuleLines: string[] = [];

  for (let i = 0; i < rightLines.length; i++) {
    const line: string = rightLines[i];
    // Check if line 0 is a header line e.g. "Inspire a Man (Battlestar)" or "Fight (Dagger)"
    if (i === 0 && line && !line.includes(':') && (line.includes('(') || (rightNameRaw && line.toLowerCase().includes(rightNameRaw.toLowerCase())))) {
      const m = line.match(/^(.*?)(?:\\s*\\((.*?)\\))?$/);
      if (m) {
        if (m[1]) rName = m[1].trim();
        if (m[2]) rSubtitle = m[2].trim();
      }
      continue;
    }

    const attackMatch = line.match(/^attack:\s*(.+)$/i);
    const recruitMatch = line.match(/^recruit:\s*(.+)$/i);
    const costMatch = line.match(/^cost:\s*(.+)$/i);
    const piercingMatch = line.match(/^piercing:\s*(.+)$/i);
    const teamMatch = line.match(/^team:\s*(.+)$/i);

    if (attackMatch) {
      rAttack = attackMatch[1].trim();
      continue;
    }
    if (recruitMatch) {
      rRecruit = recruitMatch[1].trim();
      continue;
    }
    if (costMatch) {
      rCost = costMatch[1].trim();
      continue;
    }
    if (piercingMatch) {
      rPiercing = piercingMatch[1].trim();
      continue;
    }
    if (teamMatch) {
      rTeam = teamMatch[1].trim();
      continue;
    }

    // Check for hero class on right side (single or comma-separated)
    const classTokens: string[] = line.split(/[\s,]+/).filter(Boolean);
    if (classTokens.length > 0 && classTokens.every((t: string) => CLASS_NAMES.some((c: string) => c.toLowerCase() === t.toLowerCase()))) {
      rHeroClass = classTokens
        .map((t: string) => {
          const found = CLASS_NAMES.find((c: string) => c.toLowerCase() === t.toLowerCase());
          return found || t;
        })
        .join(', ');
      continue;
    }

    rRuleLines.push(line);
  }

  // Left side extraction
  let leftSubtitle: string = card.subtitle || '';
  let lFinalName: string = leftNameRaw;
  const leftNameMatch = leftNameRaw.match(/^(.*?)(?:\\s*\\((.*?)\\))?$/);
  if (leftNameMatch && leftNameMatch[2]) {
    lFinalName = leftNameMatch[1].trim();
    if (!leftSubtitle) leftSubtitle = leftNameMatch[2].trim();
  }

  let lHeroClass: string = card.hc || card.heroClass || '';
  if (lHeroClass) {
    lHeroClass = lHeroClass.replace(/\[\/?(BGCOLOR|COLOR|b|i)[^\]]*\]/gi, '').trim().replace(/\s*,\s*/g, ', ');
  }

  const leftLines: string[] = leftRulesRaw.split('\n');
  if (leftLines.length > 0) {
    const firstLine: string = leftLines[0].trim();
    if (!firstLine.includes(':')) {
      const tokens: string[] = firstLine.split(/[\s,]+/).filter(Boolean);
      if (tokens.length > 0 && tokens.every((t: string) => CLASS_NAMES.some((c: string) => c.toLowerCase() === t.toLowerCase()))) {
        if (!lHeroClass) {
          lHeroClass = tokens
            .map((t: string) => CLASS_NAMES.find((c: string) => c.toLowerCase() === t.toLowerCase()) || t)
            .join(', ');
        }
        leftLines.shift();
      }
    }
  }

  const leftRulesCleaned: string = sanitizeRulesText(leftLines.join('\n'));
  const rightRulesCleaned: string = sanitizeRulesText(rRuleLines.join('\n'));

  const leftKeywords: string[] = extractSplitKeywords(leftRulesCleaned);
  const rightKeywords: string[] = extractSplitKeywords(rightRulesCleaned);

  return {
    isDivided: true,
    left: {
      name: lFinalName,
      subtitle: leftSubtitle,
      cost: card.cost ?? null,
      attack: card.attack ?? null,
      recruit: card.recruit ?? null,
      piercing: card.piercing ?? null,
      heroClass: lHeroClass,
      team: card.team || '',
      rulesText: leftRulesCleaned,
      sideLabel: 'Side A',
      keywords: leftKeywords
    },
    right: {
      name: rName || rightNameRaw || 'Side B',
      subtitle: rSubtitle,
      cost: rCost ?? null,
      attack: rAttack ?? null,
      recruit: rRecruit ?? null,
      piercing: rPiercing ?? null,
      heroClass: rHeroClass,
      team: rTeam,
      rulesText: rightRulesCleaned,
      sideLabel: 'Side B',
      keywords: rightKeywords
    }
  };
}
