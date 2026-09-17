import { GAME_KEYWORDS, getKeywordRule } from '../data/keywords';

export interface SplitHalfDetail {
  name: string;
  subtitle?: string;
  cost?: string | number;
  recruit?: string | number;
  attack?: string | number;
  piercing?: string | number;
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

const CLASS_NAMES = ['Covert', 'Instinct', 'Ranged', 'Strength', 'Tech'];

export function extractSplitKeywords(text?: string): string[] {
  if (!text) return [];
  const found = new Set<string>();

  for (const kw of GAME_KEYWORDS) {
    if (['Ambush', 'Fight', 'Escape', 'Rescue', 'Strike', 'Scheme Twist', 'Wound', 'Bribe'].includes(kw.name)) continue;

    let matched = false;
    if (kw.matchPattern) {
      try {
        const regex = new RegExp(kw.matchPattern, 'i');
        if (regex.test(text)) matched = true;
      } catch (e) {
        // ignore regex error
      }
    } else {
      const nameRegex = new RegExp(`\\b${kw.name.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`, 'i');
      if (nameRegex.test(text)) matched = true;

      if (!matched && kw.aliases) {
        for (const alias of kw.aliases) {
          const aliasRegex = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`, 'i');
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

  return Array.from(found).filter(kw => !getKeywordRule(kw).includes('thematic tag'));
}

export function isStandaloneKeywordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const norm = trimmed.toLowerCase().replace(/[-_]/g, ' ').replace(/[.:;!]/g, '').trim();
  const withoutNumber = norm.replace(/\s+\d+$/, '').trim();

  for (const kw of GAME_KEYWORDS) {
    if (['Ambush', 'Fight', 'Escape', 'Rescue', 'Strike', 'Scheme Twist', 'Wound', 'Bribe'].includes(kw.name)) continue;
    const kwNorm = kw.name.toLowerCase().replace(/[-_]/g, ' ');
    if (norm === kwNorm || withoutNumber === kwNorm) return true;

    const parts = norm.split(/[,\s]+/).filter(Boolean);
    if (parts.length > 1 && parts.every(p => p === kwNorm || p === kw.name.toLowerCase())) return true;
  }
  return false;
}

export function sanitizeRulesText(raw: string = ''): string {
  let lines = raw.split('\n').filter((l: string) => !/^\s*={2,}\s*[^=]+\s*={2,}\s*$/.test(l.trim()));
  lines = lines.map((line: string) => {
    line = line.replace(/\[url=[^\]]*\](.*?)\[\/url\]/gi, '$1');
    line = line.replace(/\[\/?url[^\]]*\]/gi, '');
    line = line.replace(/\[\/?(BGCOLOR|COLOR)[^\]]*\]/gi, '');
    line = line.replace(/\[\/?(b|i)\]/gi, '');
    line = line.replace(/\s*={2,}\s*[^=]+\s*={2,}\s*/g, '');
    return line;
  });

  const filteredLines = lines.filter((l: string) => !isStandaloneKeywordLine(l));
  return filteredLines.join('\n').trim().replace(/\n{3,}/g, '\n\n');
}

/**
 * Checks if a card is a divided/split card and parses it into two distinct halves (left and right),
 * each with its own independent name, subtitle, cost, attack, recruit, heroClass, and rules text.
 */
export function parseSplitCard(card: any): SplitCardParsed | null {
  if (!card) return null;

  const rawName = card.name || '';
  const rawRules = card.rulesText || '';
  const isSplit = rawName.includes(' / ') || rawName.includes(' // ') || rawRules.includes('---');
  if (!isSplit) return null;

  // Split name
  const nameParts = rawName.split(/\s*\/\/?\s*/).map(s => s.trim());
  const leftNameRaw = nameParts[0] || rawName;
  const rightNameRaw = nameParts[1] || '';

  // Split rules text by separator
  const ruleParts = rawRules.split(/\n*---+\n*/);
  const leftRulesRaw = ruleParts[0] || '';
  const rightRaw = ruleParts[1] || '';

  // Parse right half lines
  const rightLines = rightRaw.split('\n').map(l => l.trim()).filter(Boolean);
  let rName = rightNameRaw;
  let rSubtitle = '';
  let rCost = card.cost;
  let rAttack = null;
  let rRecruit = null;
  let rPiercing = null;
  let rHeroClass = '';
  let rTeam = '';
  const rRuleLines: string[] = [];

  for (let i = 0; i < rightLines.length; i++) {
    const line = rightLines[i];
    // Check if line 0 is a header line e.g. "Inspire a Man (Battlestar)" or "Fight (Dagger)"
    if (i === 0 && line && !line.includes(':') && (line.includes('(') || (rightNameRaw && line.toLowerCase().includes(rightNameRaw.toLowerCase())))) {
      const m = line.match(/^(.*?)(?:\s*\((.*?)\))?$/);
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
    const classMatch = line.match(/^(Strength|Instinct|Covert|Tech|Ranged)$/i);
    const teamMatch = line.match(/^team:\s*(.+)$/i);

    if (attackMatch) {
      rAttack = attackMatch[1].trim();
    } else if (recruitMatch) {
      rRecruit = recruitMatch[1].trim();
    } else if (costMatch) {
      rCost = costMatch[1].trim();
    } else if (piercingMatch) {
      rPiercing = piercingMatch[1].trim();
    } else if (classMatch) {
      rHeroClass = classMatch[1].trim();
    } else if (teamMatch) {
      rTeam = teamMatch[1].trim();
    } else {
      rRuleLines.push(line);
    }
  }

  // Left side extraction
  let leftSubtitle = card.subtitle || '';
  let lFinalName = leftNameRaw;
  const leftNameMatch = leftNameRaw.match(/^(.*?)(?:\s*\((.*?)\))?$/);
  if (leftNameMatch && leftNameMatch[2]) {
    lFinalName = leftNameMatch[1].trim();
    if (!leftSubtitle) leftSubtitle = leftNameMatch[2].trim();
  }

  const leftRulesCleaned = sanitizeRulesText(leftRulesRaw);
  const rightRulesCleaned = sanitizeRulesText(rRuleLines.join('\n'));

  const leftKeywords = extractSplitKeywords(leftRulesCleaned);
  const rightKeywords = extractSplitKeywords(rightRulesCleaned);

  return {
    isDivided: true,
    left: {
      name: lFinalName,
      subtitle: leftSubtitle,
      cost: card.cost,
      attack: card.attack,
      recruit: card.recruit,
      piercing: card.piercing,
      heroClass: card.hc || card.heroClass || '',
      team: card.team || '',
      rulesText: leftRulesCleaned,
      sideLabel: 'Side A',
      keywords: leftKeywords
    },
    right: {
      name: rName || rightNameRaw || 'Side B',
      subtitle: rSubtitle,
      cost: rCost,
      attack: rAttack,
      recruit: rRecruit,
      piercing: rPiercing,
      heroClass: rHeroClass,
      team: rTeam,
      rulesText: rightRulesCleaned,
      sideLabel: 'Side B',
      keywords: rightKeywords
    }
  };
}
