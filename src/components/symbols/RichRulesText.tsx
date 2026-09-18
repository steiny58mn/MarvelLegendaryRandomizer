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
  '\\b(?:Ambush|Fight|Escape|Master Strike|Command Strike|Scheme Twist|Plot Twist|When Recruited|Berserk|Wall[ -]?Crawl|Teleport|Versatile(?:\\s+\\d+)?|Focus|Phasing|Microscopic\\s+Size[ -]?Changing|Size[ -]?Changing|Smash(?:\\s+\\d+)?|Elusive(?:\\s+\\d+)?|Excessive\\s+(?:Violence|Kindness)|X[ -]?Treme\\s+Attack|X-Gene|(?:Double\\s+)?Dark\\s+Memories|Hyperspeed|Thrown\\s+Artifacts?|Ritual\\s+Artifacts?|Triggered\\s+Artifacts?|Artifacts?|Undercover|Transforms?|Transformed|Transforming|Haunt|Heist|Patrol|Explore|Digest|Indigestion|Bribe|Bribery|Demolish|Dodge|(?:Double|Triple|Quadruple\\s+)?Empowered(?:\\s+by)?|Soaring\\s+Flight|Soulbind|Spectrum|(?:Double|Triple\\s+)?Striker|Sunlight|Moonlight|Switcheroo|Symbiote\\s+Bonds|Tactical\\s+Formation|Piercing\\s+Energy|Worthy|Wounded\\s+Fury|Wound\\s+a\\s+Villain|Cosmic\\s+Threat|Coordinate|Clone|(?:[A-Za-z-]+[ -])?Conqueror(?:\\s+\\d+)?|Cross-Dimensional\\s+[A-Za-z0-9\'\\s-]+Rampage|Cross-Dimensional\\s+Rampage|Cyber-Mod|Danger\\s+Sense|Demonic\\s+Bargain|Dominate|Double-Cross|Endgame|Fated\\s+Future|Fateful\\s+Resurrection|Feast|Fortify|Hidden\\s+Witnesses?|Human\\s+Shields?|Hunt\\s+for\\s+Victims|HYDRA\\s+Level|Investigate|(?:Double\\s+)?Last\\s+Stand|Liberate(?:\\s+\\d+|\\s+X)?|Lightshow|(?:Man|Woman)\\s+Out\\s+of\\s+Time|(?:Mass\\s+)?Momentum(?:\\s+\\d+)?|Outwit|Prey|Revenge|Rise\\s+of\\s+the\\s+Living\\s+Dead|Sacrifice|Savior|(?:Cosmic\\s+)?Shards?|Shatter|S\\.H\\.I\\.E\\.L\\.D\\.\\s+Clearance|S\\.H\\.I\\.E\\.L\\.D\\.\\s+Level|Throne[\'’]s\\s+Favor|Uru[ -]?Enchanted\\s+Weapons?|Villainous\\s+Weapons?|Waking\\s+Nightmare|(?:Doubled\\s+)?Weapon\\s+X\\s+Sequence|What\\s+If(?:\\.\\.\\.\\?)?|\\d+(?:st|nd|rd|th)?\\s+Circle\\s+of\\s+(?:Kung-Fu|Quack-Fu)|Circle\\s+of\\s+(?:Kung-Fu|Quack-Fu)|Abomination|Antics|Astral\\s+Plane|Blood\\s+Frenzy|Burrow|Celestial\\s+Boon|Charge|Cheering\\s+Crowds|Chivalrous\\s+Duel|Contest\\s+of\\s+Champions|Unveiled|Veiled|Adapting(?:\\s+Masterminds?)?|Acid\\s+Blood|Facehugger|Chestburster|Bullet\\s+Time|Gadget|Valyrian\\s+Steel|Wildfire|Trophy|Black\\s+Oil|Hellmouth|Danger\\s+Level|Ascend)\\b';

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
          <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-950/70 text-amber-400 border border-amber-800/60 mr-1.5 tracking-wider">
            {b}
          </span>
        );
      }
      if (/^Twist/i.test(b)) {
        return (
          <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 mr-1.5 tracking-wider">
            {b}
          </span>
        );
      }
      if (/^Evil Wins$/i.test(b)) {
        return (
          <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-950/70 text-red-400 border border-red-800/60 mr-1.5 tracking-wider">
            EVIL WINS
          </span>
        );
      }
      if (/^Special Rules$/i.test(b)) {
        return (
          <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-800/90 text-cyan-300 border border-cyan-700/50 mr-1.5 tracking-wider">
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
        <span key={key} className="font-bold text-indigo-300">
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
      <div className={`space-y-2 text-xs sm:text-sm leading-relaxed text-slate-300 ${className}`}>
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
    <div className={`space-y-2 text-xs sm:text-sm leading-relaxed text-slate-300 ${className}`}>
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();

        // Check for section markers
        const setupMatch = trimmed.match(/^(Setup|When revealed):/i);
        if (setupMatch) {
          const rest = trimmed.slice(setupMatch[0].length);
          return (
            <div key={idx} className="leading-relaxed break-words">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-950/70 text-amber-400 border border-amber-800/60 mr-1.5 tracking-wider">
                {setupMatch[1]}
              </span>
              <span>{renderInlineTokens(rest, `setup-${idx}`)}</span>
            </div>
          );
        }

        const twistMatch = trimmed.match(/^(Twist(?:\s+[\d-]+)?):/i);
        if (twistMatch) {
          const rest = trimmed.slice(twistMatch[0].length);
          return (
            <div key={idx} className="leading-relaxed break-words">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 mr-1.5 tracking-wider">
                {twistMatch[1]}
              </span>
              <span>{renderInlineTokens(rest, `twist-${idx}`)}</span>
            </div>
          );
        }

        const evilWinsMatch = trimmed.match(/^(Evil Wins):/i);
        if (evilWinsMatch) {
          const rest = trimmed.slice(evilWinsMatch[0].length);
          return (
            <div key={idx} className="leading-relaxed break-words">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-950/70 text-red-400 border border-red-800/60 mr-1.5 tracking-wider">
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
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-800/90 text-cyan-300 border border-cyan-700/50 mr-1.5 tracking-wider">
                SPECIAL RULES
              </span>
              <span>{renderInlineTokens(rest, `special-${idx}`)}</span>
            </div>
          );
        }

        // Bullet point lines
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const bulletLines = trimmed.split('\n').filter(l => l.trim());
          return (
            <ul key={idx} className="list-disc list-inside space-y-1 my-1 pl-2 text-slate-300">
              {bulletLines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[•-]\s*/, '');
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
