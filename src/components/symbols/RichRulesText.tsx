import React from 'react';
import { SymbolIcon } from './SymbolIcon';
import { findSymbol } from './symbolDefinitions';

export interface RichRulesTextProps {
  text?: string;
  abilities?: any[];
  className?: string;
}

/**
 * Parses inline string tokens like [Attack], [Recruit], [Cost], [VP], [Covert], etc.
 * and converts them to React elements with SymbolIcon.
 */
export function renderInlineTokens(str: string): React.ReactNode[] {
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
        return <SymbolIcon key={i} symbol={symbolDef.id} size="sm" />;
      }
      // Fallback symbol icon for unmapped tokens (like Ally or unknown icons)
      return <SymbolIcon key={i} symbol="token" size="sm" />;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/**
 * Renders an ability item from Master Strike's structured ability JSON
 */
function renderAbilityItem(item: any, key: string | number): React.ReactNode {
  if (item === null || item === undefined) return null;
  if (typeof item === 'string') {
    return renderInlineTokens(item);
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
            {b}
          </span>
        );
      }
      if (/^Special Rules$/i.test(b)) {
        return (
          <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-800/90 text-cyan-300 border border-cyan-700/50 mr-1.5 tracking-wider">
            {b}
          </span>
        );
      }
      return <strong key={key} className="font-bold text-slate-100">{b}</strong>;
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
}) => {
  // If structured abilities array is present and non-empty, render it!
  if (abilities && Array.isArray(abilities) && abilities.length > 0) {
    return (
      <div className={`space-y-2 text-xs sm:text-sm leading-relaxed text-slate-300 ${className}`}>
        {abilities.map((ab, idx) => (
          <div key={idx} className="leading-relaxed break-words">
            {renderAbilityItem(ab, idx)}
          </div>
        ))}
      </div>
    );
  }

  // Otherwise, render text with parsed tokens
  if (!text) return null;

  const paragraphs = text.split('\n\n').filter(p => p.trim());

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
              <span>{renderInlineTokens(rest)}</span>
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
              <span>{renderInlineTokens(rest)}</span>
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
              <span>{renderInlineTokens(rest)}</span>
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
              <span>{renderInlineTokens(rest)}</span>
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
                    {renderInlineTokens(cleanLine)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard text paragraph
        return (
          <p key={idx} className="leading-relaxed break-words">
            {renderInlineTokens(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
