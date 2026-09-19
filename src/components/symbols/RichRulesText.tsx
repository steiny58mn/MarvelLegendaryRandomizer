import React from 'react';
import { SymbolIcon } from './SymbolIcon';
import { findSymbol } from './symbolDefinitions';
import { translateVillainsText, translateAbilities } from '../../utils/terminologyTranslator';
import { useData } from '../../contexts/DataContext';

export interface RichRulesTextProps {
  text?: string;
  abilities?: any[];
  className?: string;
  /** Explicit override for terminology translation. If undefined, inherits global context. */
  translated?: boolean;
}

const KEYWORD_PATTERN =
  '\\b(?:Master Strike|Command Strike|Scheme Twist|Plot Twist|When Recruited|Ambush Schemes|Ambush(?:es|ed|ing)?|Fight|Escape|Rescue|Strike|Bystander Rescue|Wound(?:s|ed|ing)?\\s+a\\s+Villain|Wounded Fury|Wound|Brib(?:e|es|ed|ing|ery)|Berserk(?:s|ed|ing|er|ers)?(?:\\s+\\d+)?|Wall[ -]?Crawl(?:ing)?|Teleport(?:s|ed|ing|ation)?|Versatile(?:\\s+\\d+)?|Focus(?:es|ed|ing)?(?:\\s+\\d+)?|Phasing|Phas(?:e|es|ed)|Microscopic\\s+Size[ -]?Changing|Size[ -]?Changing|Smash(?:es|ed|ing|er|ers)?(?:\\s+\\d+)?|Elusive(?:\\s+\\d+)?|Excessive\\s+(?:Violence|Kindness)|X[ -]?Treme\\s+Attacks?|X-Gene|(?:Double\\s+)?Dark\\s+Memories|Hyperspeed(?:\\s+\\d+)?|Thrown\\s+Artifacts?|Ritual\\s+Artifacts?|Triggered\\s+Artifacts?|Artifacts?|Undercover|Send\\s+Undercover|Unleash\\s+from\\s+Undercover|Transforms?|Transformed|Transforming|Transformation(?:s)?|Transforming\\s+(?:Heroes|Masterminds|Schemes)|Haunt(?:s|ed|ing)?|Heists?|Patrol(?:s|led|ling)?|Explor(?:e|es|ed|ing)|Digests?|Digested|Digesting|Indigestion|Demolish(?:es|ed|ing)?|Dodg(?:e|es|ed|ing)|(?:Double|Triple|Quadruple\\s+)?(?:Empowered|Empowering|Empower|Empowers)(?:\\s+by)?|Soaring\\s+Flight|Soulbind(?:s|ing)?|Soulbound|Spectrum|(?:Double|Triple\\s+)?Strikers?|Sunlight|Moonlight|Switcheroos?(?:\\s+\\d+)?|Symbiote\\s+Bonds?|Tactical\\s+Formation|Piercing\\s+Energy|Unworthy|Worthy|Cosmic\\s+Threat|Coordinat(?:e|es|ed|ing)|Clon(?:e|es|ed|ing)|(?:[A-Za-z-]+[ -])?(?:Conqueror|Conquerors|Conquer|Conquered|Conquering)(?:\\s+\\d+)?|Cross[ -]?Dimensional\\s+[A-Za-z0-9\\\'\\s-]+Rampage|Cross[ -]?Dimensional\\s+Rampage|Cyber[ -]?Mods?|Danger\\s+Sense(?:\\s+\\d+)?|Demonic\\s+Bargains?|Dominate(?:s|d|ing)?|Domination(?:s)?|Double[ -]?Cross(?:es|ed|ing)?|Endgame|Fated\\s+Future|Fateful\\s+Resurrection|Feast(?:s|ed|ing)?|Fortif(?:y|ies|ied|ying)|Fortification(?:s)?|Hidden\\s+Witness(?:es)?|Human\\s+Shields?|Hunt(?:s|ed|ing)?\\s+for\\s+Victims|HYDRA\\s+Levels?|Investigat(?:e|es|ed|ing)|Investigation(?:s)?|Investigator(?:s)?|(?:Double\\s+)?Last\\s+Stand|Liberat(?:e|es|ed|ing)|Liberation|Liberator(?:\\s+\\d+|\\s+X)?|Lightshow|(?:Man|Woman)\\s+Out\\s+of\\s+Time|(?:Mass\\s+)?Momentum(?:\\s+\\d+)?|Outwit(?:s|ted|ting)?|Prey(?:s|ed|ing)?|Revenges?|Rise\\s+of\\s+the\\s+Living\\s+Dead|Sacrific(?:e|es|ed|ing)|Saviors?|(?:Cosmic\\s+)?Shards?|Shatter(?:s|ed|ing)?|S\\.H\\.I\\.E\\.L\\.D\\.\\s+Clearance|S\\.?H\\.?I\\.?E\\.?L\\.?D\\.?\\s+Levels?|Throne[\\\'\\u2019]s\\s+Favor|Uru[ -]?Enchanted\\s+Weapons?|Villainous\\s+Weapons?|Waking\\s+Nightmare|(?:Doubled\\s+)?Weapon\\s+X\\s+Sequence|What\\s+If(?:\\.\\.\\.\\?)?|\\d+(?:st|nd|rd|th)?\\s+Circle\\s+of\\s+(?:Kung-Fu|Quack-Fu)|Circle\\s+of\\s+(?:Kung-Fu|Quack-Fu)|Abominations?|Antics?|Astral\\s+Plane|Blood\\s+Frenzy|Burrow(?:s|ed|ing)?|Celestial\\s+Boons?|Charg(?:e|es|ed|ing)|Cheering\\s+Crowds?|Chivalrous\\s+Duels?|Contest\\s+of\\s+Champions|Unveil(?:s|ed|ing)?|Veil(?:s|ed|ing)?|Adapting(?:\\s+Masterminds?)?|Adapt(?:s|ed|ive)?|Adaptation(?:s)?|Acid\\s+Blood|Facehuggers?|Chestbursters?|Bullet\\s+Time|Gadgets?|Valyrian\\s+Steel|Wildfire|Troph(?:y|ies)|Black\\s+Oil|Hellmouths?|Dust(?:s|ed|ing)?|Jobs?|Scan(?:s|ned|ning)?|Hope|Fear|Support(?:\\s+Hero(?:es)?)?|Danger\\s+Levels?|Missions?|Ascend(?:s|ed|ing)?|Ascension|Divided(?:\\s+Cards?)?|Special\\s+S\\.?H\\.?I\\.?E\\.?L\\.?D\\.?\\s+Officers?|Sidekicks?|Locations?|Traps?|Command(?:s|ed|ing|er)?(?!\\s+Strike))\\b';

const KEYWORD_REGEX = new RegExp(`(${KEYWORD_PATTERN})`, 'gi');
const KEYWORD_TEST_REGEX = new RegExp(`^${KEYWORD_PATTERN}$`, 'i');

/**
 * Highlights game keywords in yellow/amber within a plain text string.
 */
export function highlightKeywordsInText(text: string, prefix: string = 'kw'): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(KEYWORD_REGEX);
  return parts.map((part, i) => {
    if (KEYWORD_TEST_REGEX.test(part)) {
      return (
        <span key={`${prefix}-${i}`} className="font-bold text-amber-400">
          {part}
        </span>
      );
    }
    return <React.Fragment key={`${prefix}-${i}`}>{part}</React.Fragment>;
  });
}

/**
 * Parses inline string tokens like [Attack], [Recruit], [Cost], [VP], [Covert], etc.
 * and converts them to React elements with SymbolIcon, while highlighting game keywords in yellow.
 */
export function renderInlineTokens(str: string, prefix: string = 'tok'): React.ReactNode[] {
  if (!str) return [];

  // Also replace angle bracket <icon> with [Token] or similar
  const normalizedStr = str.replace(/<icon>/gi, '[Token]');

  // Match bracketed tokens like [Attack], [Recruit], [Tech], etc.
  const regex = /(\[(?:Attack|Recruit|Cost|VP|Piercing|Token|Covert|Instinct|Ranged|Strength|Tech|Avengers|S\.H\.I\.E\.L\.D\.|Spider-Friends|X-Men|Fantastic Four|Marvel Knights|X-Force|Guardians of the Galaxy|Inhumans|Heroes of Wakanda|Heroes of Asgard|Midnight Sons|HYDRA|Brotherhood|Cabal|Sinister Six|[\w\s.-]+)\])/gi;

  const parts = normalizedStr.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const token = part.slice(1, -1).trim();
      const symbolDef = findSymbol(token);
      if (symbolDef) {
        return <SymbolIcon key={`${prefix}-${i}`} symbol={symbolDef.id} size="sm" />;
      }
      // Fallback symbol icon for unmapped tokens (like Ally or unknown icons)
      return <SymbolIcon key={`${prefix}-${i}`} symbol="token" size="sm" />;
    }
    return (
      <React.Fragment key={`${prefix}-${i}`}>
        {highlightKeywordsInText(part, `${prefix}-p${i}`)}
      </React.Fragment>
    );
  });
}

/**
 * Renders an ability item from Master Strike's structured ability JSON
 */
function renderAbilityItem(item: any, key: string | number): React.ReactNode {
  if (item === null || item === undefined) return null;
  if (typeof item === 'string') {
    return renderInlineTokens(item, `str-${key}`);
  }
  if (Array.isArray(item)) {
    return (
      <React.Fragment key={key}>
        {item.map((sub, idx) => renderAbilityItem(sub, `${key}-${idx}`))}
      </React.Fragment>
    );
  }
  if (typeof item === 'object') {
    if (item.bold) {
      // Check if bold is a known section marker
      const b = item.bold.trim();
      if (/^(Setup|When revealed)$/i.test(b)) {
        return (
          <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-amber-200 bg-gradient-to-r from-amber-950/90 via-yellow-950/95 to-amber-900/90 border border-amber-500/50 ring-1 ring-white/10 shadow-sm backdrop-blur-md mr-1.5 align-middle">
            {b}
          </span>
        );
      }
      if (/^Twist/i.test(b)) {
        return (
          <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-indigo-900/90 border border-indigo-500/50 ring-1 ring-white/10 shadow-sm backdrop-blur-md mr-1.5 align-middle">
            {b}
          </span>
        );
      }
      if (/^Evil Wins$/i.test(b)) {
        return (
          <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-rose-300 bg-gradient-to-r from-rose-950/95 via-red-900/90 to-rose-950/95 border border-rose-500/60 ring-1 ring-rose-400/20 shadow-sm shadow-rose-950/50 backdrop-blur-md mr-1.5 align-middle">
            EVIL WINS
          </span>
        );
      }
      if (/^Special Rules$/i.test(b)) {
        return (
          <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-cyan-200 bg-gradient-to-r from-cyan-950/90 via-slate-900/95 to-cyan-950/90 border border-cyan-500/50 ring-1 ring-white/10 shadow-sm backdrop-blur-md mr-1.5 align-middle">
            SPECIAL RULES
          </span>
        );
      }
      // Render bold keywords, triggers (Fight, Ambush, Escape, etc.) or ability headers in bold yellow
      return (
        <strong key={key} className="font-bold text-amber-400">
          {b}
        </strong>
      );
    }
    if (item.italic) {
      return <em key={key} className="italic text-slate-300">{item.italic}</em>;
    }
    if (item.icon) {
      return <SymbolIcon key={key} symbol={item.icon} size="sm" />;
    }
    if (item.hc) {
      const hcMap: Record<number, string> = { 1: 'covert', 2: 'instinct', 3: 'ranged', 4: 'strength', 5: 'tech' };
      const sym = hcMap[item.hc] || 'tech';
      return <SymbolIcon key={key} symbol={sym} size="sm" />;
    }
    if (item.team !== undefined) {
      return <SymbolIcon key={key} symbol={`team:${item.team}`} size="sm" />;
    }
    if (item.keyword !== undefined) {
      return (
        <span key={key} className="font-bold text-amber-400">
          {item.text || 'Keyword'}
        </span>
      );
    }
    if (item.rule !== undefined) {
      return (
        <span key={key} className="font-bold text-amber-400">
          {item.text || 'Rule'}
        </span>
      );
    }
    if (item.points && Array.isArray(item.points)) {
      return (
        <ul key={key} className="list-disc list-inside space-y-1 my-1 pl-2 text-slate-300">
          {item.points.map((pt: any, ptIdx: number) => (
            <li key={ptIdx} className="leading-relaxed">
              {renderAbilityItem(pt, `pt-${ptIdx}`)}
            </li>
          ))}
        </ul>
      );
    }
  }
  return null;
}

export const RichRulesText: React.FC<RichRulesTextProps> = ({
  text,
  abilities,
  className = '',
  translated,
}) => {
  const data = useData();
  const shouldTranslate = translated !== undefined ? translated : (data?.translateVillainsTerms ?? false);

  const effectiveText = shouldTranslate ? translateVillainsText(text) : text;
  const effectiveAbilities = shouldTranslate ? translateAbilities(abilities) : abilities;

  // If structured abilities array is present and non-empty, render it!
  if (effectiveAbilities && Array.isArray(effectiveAbilities) && effectiveAbilities.length > 0) {
    return (
      <div className={`space-y-2 text-xs sm:text-sm leading-relaxed text-slate-300 whitespace-pre-line ${className}`}>
        {effectiveAbilities.map((ab, idx) => (
          <div key={idx} className="leading-relaxed break-words">
            {renderAbilityItem(ab, idx)}
          </div>
        ))}
      </div>
    );
  }

  // Otherwise, render text with parsed tokens
  if (!effectiveText) return null;

  const paragraphs = effectiveText.split('\n\n').filter(p => p.trim());

  return (
    <div className={`space-y-2 text-xs sm:text-sm leading-relaxed text-slate-300 whitespace-pre-line ${className}`}>
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();

        // Check for section markers
        const setupMatch = trimmed.match(/^(Setup|When revealed):/i);
        if (setupMatch) {
          const rest = trimmed.slice(setupMatch[0].length);
          return (
            <div key={idx} className="leading-relaxed break-words">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-amber-200 bg-gradient-to-r from-amber-950/90 via-yellow-950/95 to-amber-900/90 border border-amber-500/50 ring-1 ring-white/10 shadow-sm backdrop-blur-md mr-1.5 align-middle">
                {setupMatch[1]}
              </span>
              <span>{renderInlineTokens(rest, `setup-${idx}`)}</span>
            </div>
          );
        }

        const twistMatch = trimmed.match(/^(Twist(?:\s+[\d-]+)?):/i);
        if (twistMatch) {
          const rawRest = trimmed.slice(twistMatch[0].length).trim();
          const evilInTwist = rawRest.match(/^Evil Wins(!|:)?/i);
          if (evilInTwist) {
            const afterEvil = rawRest.slice(evilInTwist[0].length).trim();
            return (
              <div key={idx} className="leading-relaxed break-words">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-indigo-900/90 border border-indigo-500/50 ring-1 ring-white/10 shadow-sm backdrop-blur-md mr-1.5 align-middle">
                  {twistMatch[1]}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-rose-300 bg-gradient-to-r from-rose-950/95 via-red-900/90 to-rose-950/95 border border-rose-500/60 ring-1 ring-rose-400/20 shadow-sm shadow-rose-950/50 backdrop-blur-md mr-1.5 align-middle">
                  EVIL WINS
                </span>
                {afterEvil && <span>{renderInlineTokens(afterEvil, `twist-${idx}`)}</span>}
              </div>
            );
          }
          return (
            <div key={idx} className="leading-relaxed break-words">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-indigo-900/90 border border-indigo-500/50 ring-1 ring-white/10 shadow-sm backdrop-blur-md mr-1.5 align-middle">
                {twistMatch[1]}
              </span>
              <span>{renderInlineTokens(rawRest, `twist-${idx}`)}</span>
            </div>
          );
        }

        const evilWinsMatch = trimmed.match(/^(?:Evil Wins:?|Evil Wins!)/i);
        if (evilWinsMatch) {
          const rest = trimmed.slice(evilWinsMatch[0].length).replace(/^:\s*/, '').trim();
          return (
            <div key={idx} className="leading-relaxed break-words">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-rose-300 bg-gradient-to-r from-rose-950/95 via-red-900/90 to-rose-950/95 border border-rose-500/60 ring-1 ring-rose-400/20 shadow-sm shadow-rose-950/50 backdrop-blur-md mr-1.5 align-middle">
                EVIL WINS
              </span>
              <span>{renderInlineTokens(rest, `evil-${idx}`)}</span>
            </div>
          );
        }

        const specialRulesMatch = trimmed.match(/^(Special Rules):/i);
        if (specialRulesMatch) {
          const rest = trimmed.slice(specialRulesMatch[0].length);
          return (
            <div key={idx} className="leading-relaxed break-words">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-cyan-200 bg-gradient-to-r from-cyan-950/90 via-slate-900/95 to-cyan-950/90 border border-cyan-500/50 ring-1 ring-white/10 shadow-sm backdrop-blur-md mr-1.5 align-middle">
                SPECIAL RULES
              </span>
              <span>{renderInlineTokens(rest, `special-${idx}`)}</span>
            </div>
          );
        }

        // Bullet point lines
        if (trimmed.startsWith('\u2022') || trimmed.startsWith('-')) {
          const bulletLines = trimmed.split('\n').filter(l => l.trim());
          return (
            <ul key={idx} className="list-disc list-inside space-y-1 my-1 pl-2 text-slate-300">
              {bulletLines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[\u2022-]\s*/, '');
                return (
                  <li key={lIdx} className="leading-relaxed">
                    {renderInlineTokens(cleanLine, `bullet-${idx}-${lIdx}`)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard text paragraph
        return (
          <p key={idx} className="leading-relaxed break-words">
            {renderInlineTokens(trimmed, `p-${idx}`)}
          </p>
        );
      })}
    </div>
  );
};
