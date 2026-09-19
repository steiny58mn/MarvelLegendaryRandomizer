import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, Loader2, Split } from 'lucide-react';
import { ClassBadge, extractCardClasses } from './CardBadges';
import { KeywordBadge } from './KeywordBadge';
import { SymbolIcon } from './symbols/SymbolIcon';
import { RichRulesText } from './symbols/RichRulesText';
import { SplitCardParsed, SplitHalfDetail } from '../utils/splitCardParser';
import { getOptimizedImageUrl, prefetchImageUrl, isImagePrecached } from '../utils/imageOptimizer';

interface SplitCardItemProps {
  card: any;
  idx: number;
  splitData: SplitCardParsed;
}

const HalfCardView: React.FC<{ half: SplitHalfDetail; badgeColor: 'cyan' | 'purple' }> = ({ half, badgeColor }) => {
  const isCyan = badgeColor === 'cyan';
  const halfClasses = extractCardClasses(half);

  return (
    <div className={`flex-1 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between border transition-all ${
      isCyan 
        ? 'bg-slate-900/90 border-cyan-500/30 shadow-sm shadow-cyan-950/20' 
        : 'bg-slate-900/90 border-purple-500/30 shadow-sm shadow-purple-950/20'
    }`}>
      <div className="flex flex-col gap-2">
        {/* Header with Half Name, Subtitle, and Class */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-750/60 pb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border ${
              isCyan 
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-700/50' 
                : 'bg-purple-950/90 text-purple-300 border-purple-700/50'
            }`}>
              {half.sideLabel}
            </span>
            <span className="font-bold text-slate-100 text-sm sm:text-base">{half.name}</span>
            {half.subtitle && (
              <span className="text-xs text-slate-400 italic">
                ({half.subtitle})
              </span>
            )}
            {halfClasses.map((cls: string, cIdx: number) => (
              <ClassBadge key={cIdx} heroClass={cls} showLabel={false} />
            ))}
            {half.team && (
              <span className="inline-flex items-center">
                <SymbolIcon symbol={half.team} size="md" />
              </span>
            )}
          </div>

          {/* Half Specific Stats */}
          <div className="flex items-center gap-1.5 text-xs font-bold shrink-0 self-start sm:self-auto">
            {half.cost !== undefined && half.cost !== null && half.cost !== '' && (
              <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/40 inline-flex items-center gap-1 font-bold">
                <SymbolIcon symbol="cost" size="sm" /> <span>{half.cost}</span>
              </span>
            )}
            {half.recruit !== undefined && half.recruit !== null && half.recruit !== '' && (
              <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 inline-flex items-center gap-1 font-bold">
                <SymbolIcon symbol="recruit" size="sm" /> <span>{half.recruit}</span>
              </span>
            )}
            {half.attack !== undefined && half.attack !== null && half.attack !== '' && (
              <span className="px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-800/40 inline-flex items-center gap-1 font-bold">
                <SymbolIcon symbol="attack" size="sm" /> <span>{half.attack}</span>
              </span>
            )}
          </div>
        </div>

        {/* Half Specific Keywords */}
        {half.keywords && half.keywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {half.keywords.map((kw: string) => (
              <KeywordBadge key={kw} keyword={kw} />
            ))}
          </div>
        )}

        {/* Half Specific Rules Text */}
        {half.rulesText ? (
          <RichRulesText text={half.rulesText} />
        ) : (
          <div className="text-slate-600 text-xs italic">No rules text</div>
        )}
      </div>
    </div>
  );
};

export const SplitCardItem: React.FC<SplitCardItemProps> = ({ card, idx, splitData }) => {
  const [showImage, setShowImage] = useState(false);
  const [imgError, setImgError] = useState(false);

  const optimizedUrl = getOptimizedImageUrl(card.imageUrl, 540, 75);
  const [isLoaded, setIsLoaded] = useState(() => isImagePrecached(card.imageUrl, 540, 75));

  const preloadImage = () => {
    prefetchImageUrl(card.imageUrl, 540, 75);
  };

  return (
    <div key={idx} className="bg-slate-800/50 border border-indigo-500/30 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 select-text shadow-sm shadow-indigo-950/20">
      {/* Top Banner indicating Split Card */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/50 pb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
            <Split className="w-3.5 h-3.5" /> Divided Card
          </span>
          <span className="text-xs text-slate-400 font-medium">
            (Play either half or both)
          </span>
        </div>
        {card.transformed && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
            Transformed Side
          </span>
        )}
      </div>

      {/* Side by Side Halves */}
      <div className="flex flex-col md:flex-row gap-3">
        <HalfCardView half={splitData.left} badgeColor="cyan" />
        <HalfCardView half={splitData.right} badgeColor="purple" />
      </div>

      {/* Artwork accordion if available */}
      {card.imageUrl && (
        <div className="pt-2 border-t border-slate-700/40 flex flex-col gap-2 select-none">
          <button
            type="button"
            onMouseEnter={preloadImage}
            onTouchStart={preloadImage}
            onClick={() => {
              setShowImage(!showImage);
              if (imgError) {
                setImgError(false);
                setIsLoaded(false);
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold self-start py-1 px-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer select-none"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{showImage ? 'Hide Card Artwork' : 'View Divided Card Artwork'}</span>
            {showImage ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showImage && (
            <div 
              className="relative rounded-2xl overflow-hidden border border-slate-700 w-full max-w-sm sm:max-w-md mx-auto shadow-2xl bg-slate-950 mt-2 p-2 aspect-[5/7] flex items-center justify-center select-none cursor-default"
              tabIndex={-1}
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).tagName !== 'A') {
                  e.preventDefault();
                }
              }}
            >
              {!isLoaded && !imgError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 z-10 select-none p-4 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-300 font-medium tracking-wide">Loading card artwork...</span>
                </div>
              )}
              {imgError ? (
                <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-3 select-none">
                  <ImageIcon className="w-10 h-10 text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">Card artwork preview unavailable</p>
                  <a
                    href={card.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-1.5 bg-indigo-950/50 border border-indigo-500/40 px-3.5 py-2 rounded-xl text-xs cursor-pointer select-auto shadow-md"
                  >
                    Open full artwork scan in new tab ↗
                  </a>
                </div>
              ) : (
                <img
                  src={optimizedUrl}
                  alt={card.name}
                  referrerPolicy="no-referrer"
                  decoding="async"
                  loading="eager"
                  onLoad={() => setIsLoaded(true)}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const step = parseInt(target.dataset.fallbackStep || '0', 10);
                    if (step === 0) {
                      target.dataset.fallbackStep = '1';
                      target.src = `https://wsrv.nl/?url=${encodeURIComponent(card.imageUrl!)}&w=540&q=75&output=webp`;
                    } else if (step === 1) {
                      target.dataset.fallbackStep = '2';
                      target.src = `/api/card-image?url=${encodeURIComponent(card.imageUrl!)}`;
                    } else if (step === 2) {
                      target.dataset.fallbackStep = '3';
                      target.src = card.imageUrl!;
                    } else {
                      setImgError(true);
                    }
                  }}
                  className={`w-full h-full object-contain rounded-xl transition-opacity duration-150 select-none pointer-events-none ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
