import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  User,
  Shield,
  ShieldAlert,
  Swords,
  AlertTriangle,
  Info,
  CheckCircle2,
  Table,
  Scroll,
  Zap,
  Skull,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export type RuleFilter = 'all' | 'twists-strikes' | 'escapes' | 'solo' | '2-3' | '4-5' | 'city';

export const GameRulesSection: React.FC<{ initialFilter?: RuleFilter }> = ({ initialFilter = 'all' }) => {
  const [selectedFilter, setSelectedFilter] = useState<RuleFilter>(initialFilter);

  return (
    <div className="space-y-6">
      {/* Filter Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl">
        {[
          { id: 'all' as RuleFilter, label: 'All Rules Overview', icon: Table },
          { id: 'twists-strikes' as RuleFilter, label: 'Scheme Twists & Strikes', icon: Zap },
          { id: 'escapes' as RuleFilter, label: 'Villain & Henchman Escapes', icon: Skull },
          { id: 'solo' as RuleFilter, label: 'Solo (1 Player)', icon: User },
          { id: '2-3' as RuleFilter, label: '2 & 3 Players', icon: Users },
          { id: '4-5' as RuleFilter, label: '4 & 5 Players', icon: Users },
          { id: 'city' as RuleFilter, label: 'City & Turn Flow', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all min-h-[38px] active:scale-95 touch-manipulation ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. SCHEME TWISTS & MASTER STRIKES IN ALL PLAYER COUNTS */}
      {/* ========================================================================= */}
      {(selectedFilter === 'all' || selectedFilter === 'twists-strikes') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>When a Scheme Twist or Master Strike is Drawn</span>
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              Crucial Turn Mechanics
            </span>
          </div>

          {/* Key Universal Rule: Do they enter the city? */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-200 text-sm block">
                Do Scheme Twists or Master Strikes enter the City?
              </span>
              <p className="text-slate-300 leading-relaxed">
                <strong>NO.</strong> Neither Scheme Twists nor Master Strikes enter the City spaces, and neither pushes existing Villains forward! When revealed during the Villain Phase, resolve their written effect immediately, then place them into their designated pile (Twists go next to the Scheme or in the KO pile as dictated by the Scheme; Master Strikes go to the KO pile).
              </p>
            </div>
          </div>

          {/* Side by side: Scheme Twist vs Master Strike */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* SCHEME TWISTS */}
            <div className="p-4 bg-slate-950/70 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wide">
                  <Scroll className="w-4 h-4" />
                  <span>Scheme Twist Drawn</span>
                </div>
                <span className="text-[11px] text-amber-300 font-semibold px-2 py-0.5 bg-amber-500/10 rounded">
                  Typically 8 in deck
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>1. Immediate Resolution:</strong> Read the Scheme card and immediately resolve the rule listed under <em>"Twist:"</em> (or the specific number of this Twist, e.g., <em>"Twist 1–7:"</em> vs <em>"Twist 8:"</em>).
                </p>
                <p>
                  <strong>2. Twist Counting:</strong> Many Schemes track total Twists revealed to trigger escalation or evil victory (e.g. <em>"Evil Wins on the 8th Twist"</em>). Stack resolved Twists face-up next to the Scheme card so all players can clearly see how many have occurred.
                </p>
                <p>
                  <strong>3. Destination:</strong> Once resolved, unless the Scheme specifically says to stack the Twist on the Scheme or under a Villain/Mastermind, the Twist card remains next to the Scheme or enters the KO pile.
                </p>
              </div>

              {/* Player Count Impact for Twists */}
              <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wider block text-amber-400">
                  Scheme Twist Effects by Player Count:
                </span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                  <li>
                    <strong className="text-amber-300">Solo (1P):</strong> Any effect referring to <em>"each player"</em> hits <strong>YOU</strong> alone every time. Because the solo Villain Deck is only ~24 cards, Twists appear much more frequently per turn than in larger games!
                  </li>
                  <li>
                    <strong className="text-sky-300">2 & 3 Players:</strong> Effects targeting <em>"each player"</em> hit all 2 or 3 players simultaneously. If a Twist asks <em>"the player with the most..."</em>, compare values among active players; ties usually mean all tied players suffer the effect.
                  </li>
                  <li>
                    <strong className="text-purple-300">4 & 5 Players:</strong> Wide-table impact. Any Twist requiring <em>"each player to discard"</em> or <em>"KO a card"</em> drains massive table tempo simultaneously.
                  </li>
                </ul>
              </div>
            </div>

            {/* MASTER STRIKES */}
            <div className="p-4 bg-slate-950/70 border border-rose-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wide">
                  <Zap className="w-4 h-4" />
                  <span>Master Strike Drawn</span>
                </div>
                <span className="text-[11px] text-rose-300 font-semibold px-2 py-0.5 bg-rose-500/10 rounded">
                  Always exactly 5 in deck
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>1. Immediate Resolution:</strong> Read the Mastermind card and immediately resolve the ability printed after <em>"Master Strike:"</em>.
                </p>
                <p>
                  <strong>2. Target:</strong> Most Master Strikes target <em>"Each player"</em> (e.g. Red Skull: KOs a Bystander; Magneto: Discard 2 cards; Dr. Doom: Discard down). Follow the exact card phrasing.
                </p>
                <p>
                  <strong>3. Destination:</strong> After resolving the text, place the Master Strike into the <strong>KO pile</strong> (unless a Mastermind ability specifically captures or attaches it).
                </p>
              </div>

              {/* Player Count Impact for Strikes */}
              <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wider block text-rose-400">
                  Master Strike Effects by Player Count:
                </span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                  <li>
                    <strong className="text-amber-300">Solo (1P):</strong> You have 5 Master Strikes in a ~24 card deck (over <strong>20% of the deck!</strong>). You face all 5 strikes personally. Any strike that forces card discards directly dismantles your next hand.
                  </li>
                  <li>
                    <strong className="text-sky-300">2 & 3 Players:</strong> Both or all three players are hit by <em>"each player"</em> strikes. Teammates must coordinate to prevent compounding hand disruptions.
                  </li>
                  <li>
                    <strong className="text-purple-300">4 & 5 Players:</strong> Still exactly 5 Master Strikes in the deck. While individual players see fewer strikes on their own specific turns, when a strike triggers it hits all 4 or 5 players at once!
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VILLAIN ESCAPES: WITH VS WITHOUT CAPTURED BYSTANDER */}
      {/* ========================================================================= */}
      {(selectedFilter === 'all' || selectedFilter === 'escapes') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Skull className="w-5 h-5 text-rose-400" />
              <span>When a Villain or Henchman Escapes</span>
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              With vs. Without Captured Bystanders
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            When a new Villain card is played from the Villain Deck into the Sewers, existing enemies push one space forward. If an enemy on the <strong>Bridge</strong> is pushed off the end of the city, it <strong>Escapes</strong>!
          </p>

          {/* Escape Comparison Cards: Without Bystander vs With Bystander */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Case A: WITHOUT Captured Bystander */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 text-sm uppercase flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Case 1: Escape WITHOUT Bystanders</span>
                </span>
                <span className="text-[11px] text-amber-300 font-semibold px-2 py-0.5 bg-amber-500/10 rounded">
                  Standard Escape
                </span>
              </div>

              <p className="text-xs text-slate-400">
                The escaping enemy is pushed off the Bridge and is holding <strong>zero</strong> Bystanders:
              </p>

              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                <li>
                  <strong>Move to Escaped Pile:</strong> Place the card into the Escaped pile next to the Villain Deck.
                </li>
                <li>
                  <strong className="text-rose-400">KO 1 Hero from the HQ:</strong> The active player <strong>MUST</strong> choose one Hero from the Headquarters that costs <strong>6 or less</strong> and put it into the KO pile.
                  <span className="block text-[11px] text-slate-400 ml-4 mt-0.5">
                    * If all 5 Heroes in the HQ cost 7 or more, no Hero is KO'd. Refill the empty HQ space immediately from the Hero Deck.
                  </span>
                </li>
                <li>
                  <strong>Resolve "Escape:" Ability:</strong> If the card has an <em>"Escape:"</em> ability printed on it, resolve it immediately.
                </li>
                <li>
                  <strong>Hand Discard:</strong> <span className="text-emerald-400 font-semibold">NO extra hand discard!</span> Players do not discard cards because no Bystanders escaped.
                </li>
              </ol>
            </div>

            {/* Case B: WITH Captured Bystander(s) */}
            <div className="p-4 bg-slate-950/70 border border-rose-500/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-rose-300 text-sm uppercase flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Case 2: Escape WITH Captured Bystander(s)</span>
                </span>
                <span className="text-[11px] text-rose-300 font-semibold px-2 py-0.5 bg-rose-500/10 rounded">
                  Severe Penalty!
                </span>
              </div>

              <p className="text-xs text-rose-200/90 font-medium">
                The escaping enemy is pushed off the Bridge carrying <strong>one or more</strong> captured Bystanders:
              </p>

              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                <li>
                  <strong>Move to Escaped Pile:</strong> The card goes to the Escaped pile.
                </li>
                <li>
                  <strong className="text-rose-400">Bystanders are KO'd:</strong> All Bystanders that were captured by that enemy are placed into the <strong>KO pile</strong> (not rescued).
                </li>
                <li>
                  <strong className="text-rose-400 bg-rose-950/50 px-1 py-0.5 rounded border border-rose-500/30">
                    EVERY Player Must Discard 1 Card!
                  </strong>{' '}
                  Because an innocent bystander was lost, <strong>EVERY player</strong> (in turn order, starting with the active player) must choose and discard <strong>1 card from their hand</strong>!
                  <span className="block text-[11px] text-rose-300 ml-4 mt-0.5">
                    * If an enemy escapes with multiple bystanders, each player must discard 1 card for each escaping bystander!
                  </span>
                </li>
                <li>
                  <strong className="text-amber-400">KO 1 Hero from the HQ:</strong> The active player still chooses 1 Hero from the HQ costing 6 or less and puts it into the KO pile. Refill the HQ space immediately.
                </li>
                <li>
                  <strong>Resolve "Escape:" Ability:</strong> Resolve any printed <em>"Escape:"</em> ability on the escaping enemy.
                </li>
              </ol>
            </div>
          </div>

          {/* SCHEME LOSS CONDITIONS NOTE */}
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Scheme Loss Condition Reminder: </span>
              Many Schemes have an instant loss trigger tied to escapes (e.g. <em>"Evil Wins if 4 Villains escape"</em> or <em>"Evil Wins if 8 Bystanders are carried away"</em>). Always check the Scheme card whenever any enemy reaches the Bridge!
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COMPARISON MATRIX */}
      {/* ========================================================================= */}
      {(selectedFilter === 'all' || selectedFilter === 'solo' || selectedFilter === '2-3' || selectedFilter === '4-5') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Table className="w-4 h-4 text-amber-400" />
              <span>Setup Comparison Matrix</span>
            </h4>
            <span className="text-xs text-slate-400">Official Marvel Legendary Core & Expansion Setup Rules</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                  <th className="p-3">Players</th>
                  <th className="p-3">Heroes</th>
                  <th className="p-3">Hero Deck Cards</th>
                  <th className="p-3">Villain Groups</th>
                  <th className="p-3">Henchmen Groups</th>
                  <th className="p-3">Henchmen in Deck</th>
                  <th className="p-3">Bystanders</th>
                  <th className="p-3">Master Strikes</th>
                  <th className="p-3">Approx. Deck Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr className={`hover:bg-slate-800/30 transition-colors ${selectedFilter === 'solo' ? 'bg-amber-500/10' : ''}`}>
                  <td className="p-3 font-bold text-amber-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> 1 Player (Solo)
                  </td>
                  <td className="p-3 font-semibold text-slate-200">3 Heroes</td>
                  <td className="p-3">42 cards</td>
                  <td className="p-3">1 Group (8 cards)</td>
                  <td className="p-3">1 Group (4 used)</td>
                  <td className="p-3 text-amber-300 font-medium">2 in deck (+2 in City, 6 in box)</td>
                  <td className="p-3">1 Bystander</td>
                  <td className="p-3">5 Strikes</td>
                  <td className="p-3 font-bold text-slate-100">~24 cards</td>
                </tr>
                <tr className={`hover:bg-slate-800/30 transition-colors ${selectedFilter === '2-3' ? 'bg-amber-500/10' : ''}`}>
                  <td className="p-3 font-bold text-sky-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> 2 Players
                  </td>
                  <td className="p-3 font-semibold text-slate-200">5 Heroes</td>
                  <td className="p-3">70 cards</td>
                  <td className="p-3">2 Groups (16 cards)</td>
                  <td className="p-3">1 Group</td>
                  <td className="p-3">10 cards</td>
                  <td className="p-3">2 Bystanders</td>
                  <td className="p-3">5 Strikes</td>
                  <td className="p-3 font-bold text-slate-100">~41 cards</td>
                </tr>
                <tr className={`hover:bg-slate-800/30 transition-colors ${selectedFilter === '2-3' ? 'bg-amber-500/10' : ''}`}>
                  <td className="p-3 font-bold text-cyan-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> 3 Players
                  </td>
                  <td className="p-3 font-semibold text-slate-200">5 Heroes</td>
                  <td className="p-3">70 cards</td>
                  <td className="p-3">3 Groups (24 cards)</td>
                  <td className="p-3">1 Group</td>
                  <td className="p-3">10 cards</td>
                  <td className="p-3">8 Bystanders</td>
                  <td className="p-3">5 Strikes</td>
                  <td className="p-3 font-bold text-slate-100">~55 cards</td>
                </tr>
                <tr className={`hover:bg-slate-800/30 transition-colors ${selectedFilter === '4-5' ? 'bg-amber-500/10' : ''}`}>
                  <td className="p-3 font-bold text-indigo-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> 4 Players
                  </td>
                  <td className="p-3 font-semibold text-slate-200">5 Heroes</td>
                  <td className="p-3">70 cards</td>
                  <td className="p-3">3 Groups (24 cards)</td>
                  <td className="p-3">2 Groups</td>
                  <td className="p-3">20 cards</td>
                  <td className="p-3">8 Bystanders</td>
                  <td className="p-3">5 Strikes</td>
                  <td className="p-3 font-bold text-slate-100">~65 cards</td>
                </tr>
                <tr className={`hover:bg-slate-800/30 transition-colors ${selectedFilter === '4-5' ? 'bg-amber-500/10' : ''}`}>
                  <td className="p-3 font-bold text-purple-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> 5 Players
                  </td>
                  <td className="p-3 font-bold text-amber-300">6 Heroes (Special!)</td>
                  <td className="p-3 font-semibold text-amber-300">84 cards</td>
                  <td className="p-3">4 Groups (32 cards)</td>
                  <td className="p-3">2 Groups</td>
                  <td className="p-3">20 cards</td>
                  <td className="p-3">12 Bystanders</td>
                  <td className="p-3">5 Strikes</td>
                  <td className="p-3 font-bold text-slate-100">~77 cards</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            * Note: All setups include the Scheme and its required Scheme Twists (typically 8 twists, unless modified by the scheme card). Total villain deck size includes 8 twists.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SOLO (1 PLAYER) SECTION */}
      {/* ========================================================================= */}
      {(selectedFilter === 'all' || selectedFilter === 'solo') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span>Solo Mode (1 Player) Rules</span>
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              Solo Specifics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hero Deck */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm uppercase tracking-wide">
                <Shield className="w-4 h-4" />
                <span>Hero Deck (42 Cards)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Choose exactly <strong>3 Heroes</strong> (instead of 5).</li>
                <li>Shuffle all 14 cards of each chosen hero together (42 cards total).</li>
                <li>Deal 5 face-up cards to create the <strong>Headquarters (HQ)</strong>.</li>
              </ul>
            </div>

            {/* Starting Deck */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
                <span>Starting Hand & Supplies</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Starting deck: <strong>8 S.H.I.E.L.D. Agents</strong> (+1 Recruit) & <strong>4 S.H.I.E.L.D. Troopers</strong> (+1 Attack).</li>
                <li>Draw <strong>6 cards</strong> for your hand at the start and end of every turn.</li>
                <li>Place the S.H.I.E.L.D. Officers stack (30 cards), Wounds stack (30 cards), and Bystanders stack nearby.</li>
              </ul>
            </div>
          </div>

          {/* Henchmen & City Callout */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Henchmen Rule in Solo Mode: 4 Cards Total</span>
            </div>
            <p className="leading-relaxed">
              Take 1 Henchman group (10 cards). You only use <strong>4 Henchmen cards in total</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-medium">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/20 text-center">
                <span className="text-slate-400 block text-[10px] uppercase">Villain Deck</span>
                <span className="font-bold text-amber-300 text-sm">2 Henchmen</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Shuffled into deck</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/20 text-center">
                <span className="text-slate-400 block text-[10px] uppercase">Starting City</span>
                <span className="font-bold text-amber-300 text-sm">2 Henchmen</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Start on Sewers & Bank</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/20 text-center">
                <span className="text-slate-400 block text-[10px] uppercase">Game Box</span>
                <span className="font-bold text-amber-300 text-sm">6 Henchmen</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Returned to the box</span>
              </div>
            </div>
          </div>

          {/* Villain Deck Breakdown */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wide">
              <Swords className="w-4 h-4" />
              <span>Solo Villain Deck Composition (~24 Cards)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Villains</span>
                <span className="font-bold text-slate-100">8 cards (1 group)</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Henchmen in Deck</span>
                <span className="font-bold text-amber-300">2 cards</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Bystanders</span>
                <span className="font-bold text-slate-100">1 card</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Master Strikes</span>
                <span className="font-bold text-slate-100">5 cards</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Scheme Twists</span>
                <span className="font-bold text-slate-100">Usually 8 cards</span>
              </div>
            </div>
          </div>

          {/* Win / Loss */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wide block">Solo Win Condition:</span>
              <p className="text-emerald-200/90">
                Defeat the Mastermind <strong>4 times</strong> (clearing all 4 Tactics) before the Scheme completes or the Villain Deck runs out.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1">
              <span className="font-bold text-rose-400 uppercase tracking-wide block">Solo Loss Conditions:</span>
              <p className="text-rose-200/90">
                The Scheme completes its Evil Wins condition, or the Villain Deck runs out before the Mastermind is defeated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. 2 & 3 PLAYER SECTION */}
      {/* ========================================================================= */}
      {(selectedFilter === 'all' || selectedFilter === '2-3') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>2 & 3 Player Setup Rules</span>
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
              Standard Co-op
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2 Players */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-400 text-sm uppercase">2 Players Setup</span>
                <span className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 font-semibold">~41 card Villain Deck</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong>Hero Deck</strong>: 5 Heroes (70 cards).</li>
                <li><strong>Villains</strong>: 2 Villain Groups (16 cards).</li>
                <li><strong>Henchmen</strong>: 1 Henchman Group (all 10 cards in deck).</li>
                <li><strong>Bystanders</strong>: <strong>2 Bystanders</strong> in the Villain Deck.</li>
                <li><strong>Master Strikes</strong>: 5 Master Strikes.</li>
                <li><strong>Scheme Twists</strong>: As dictated by the Scheme (usually 8).</li>
              </ul>
            </div>

            {/* 3 Players */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 text-sm uppercase">3 Players Setup</span>
                <span className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 font-semibold">~55 card Villain Deck</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong>Hero Deck</strong>: 5 Heroes (70 cards).</li>
                <li><strong>Villains</strong>: <strong>3 Villain Groups</strong> (24 cards total).</li>
                <li><strong>Henchmen</strong>: 1 Henchman Group (all 10 cards in deck).</li>
                <li><strong>Bystanders</strong>: <strong>8 Bystanders</strong> in the Villain Deck (jump from 2 to 8!).</li>
                <li><strong>Master Strikes</strong>: 5 Master Strikes.</li>
                <li><strong>Scheme Twists</strong>: As dictated by the Scheme (usually 8).</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block uppercase">Key Difference Between 2P and 3P:</span>
            <p>
              Moving from 2 to 3 players adds <strong>1 additional Villain Group (+8 cards)</strong> and jumps from <strong>2 to 8 Bystanders (+6 cards)</strong> in the Villain Deck. Both 2P and 3P use 5 Heroes and 1 Henchman Group.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. 4 & 5 PLAYER SECTION */}
      {/* ========================================================================= */}
      {(selectedFilter === 'all' || selectedFilter === '4-5') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>4 & 5 Player Setup Rules</span>
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
              Large Group Co-op
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 4 Players */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-400 text-sm uppercase">4 Players Setup</span>
                <span className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 font-semibold">~65 card Villain Deck</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong>Hero Deck</strong>: 5 Heroes (70 cards).</li>
                <li><strong>Villains</strong>: 3 Villain Groups (24 cards total).</li>
                <li><strong>Henchmen</strong>: <strong>2 Henchman Groups</strong> (20 cards total in deck).</li>
                <li><strong>Bystanders</strong>: 8 Bystanders in the Villain Deck.</li>
                <li><strong>Master Strikes</strong>: 5 Master Strikes.</li>
                <li><strong>Scheme Twists</strong>: Usually 8 (per Scheme).</li>
              </ul>
            </div>

            {/* 5 Players */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-400 text-sm uppercase">5 Players Setup</span>
                <span className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 font-semibold">~77 card Villain Deck</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li className="text-amber-300 font-semibold">
                  <strong>Hero Deck: 6 Heroes (84 cards)</strong> — *Uses 6 distinct Heroes instead of 5!*
                </li>
                <li><strong>Villains</strong>: <strong>4 Villain Groups</strong> (32 cards total).</li>
                <li><strong>Henchmen</strong>: <strong>2 Henchman Groups</strong> (20 cards total in deck).</li>
                <li><strong>Bystanders</strong>: <strong>12 Bystanders</strong> in the Villain Deck.</li>
                <li><strong>Master Strikes</strong>: 5 Master Strikes.</li>
                <li><strong>Scheme Twists</strong>: Usually 8 (per Scheme).</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 space-y-1">
            <span className="font-bold text-amber-300 block uppercase">Critical 5-Player Rule:</span>
            <p>
              In a 5-player game, you must select <strong>6 Heroes</strong> to create an 84-card Hero Deck. Additionally, the Villain Deck expands to <strong>4 Villain Groups</strong> and <strong>12 Bystanders</strong>, creating a fast-paced game where 4 Villain cards enter between any player's consecutive turns!
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CITY & TURN FLOW SECTION */}
      {/* ========================================================================= */}
      {(selectedFilter === 'all' || selectedFilter === 'city') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>The City & Core Turn Flow</span>
            </h4>
            <span className="text-xs text-slate-400">Board Rules & Escape Sequence</span>
          </div>

          {/* City Path Diagram */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase block">City Track (5 Spaces):</span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
                <span className="text-slate-400 text-[10px]">1. Enter Here</span>
                <span className="font-bold text-slate-200">Sewers</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
                <span className="text-slate-400 text-[10px]">2. Move Forward</span>
                <span className="font-bold text-slate-200">Bank</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
                <span className="text-slate-400 text-[10px]">3. Center Space</span>
                <span className="font-bold text-slate-200">Rooftops</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
                <span className="text-slate-400 text-[10px]">4. High Alert</span>
                <span className="font-bold text-slate-200">Streets</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/40 bg-amber-500/5 flex flex-col items-center justify-center">
                <span className="text-amber-400 text-[10px]">5. Final Space</span>
                <span className="font-bold text-amber-300">Bridge</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 flex flex-col items-center justify-center">
                <span className="text-rose-400 text-[10px]">Off Board</span>
                <span className="font-bold text-rose-300">Escaped!</span>
              </div>
            </div>
          </div>

          {/* 3 Step Turn Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-amber-400 uppercase tracking-wide block">1. Villain Phase</span>
              <p className="text-slate-300">
                Play the top card of the Villain Deck into the Sewers (pushing enemies forward). Resolve any Master Strikes or Scheme Twists immediately.
              </p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-sky-400 uppercase tracking-wide block">2. Main Phase</span>
              <p className="text-slate-300">
                Play cards from hand to generate <strong>Recruit</strong> and <strong>Attack</strong>. Spend Recruit to recruit Heroes from the HQ or S.H.I.E.L.D. Officers. Spend Attack to fight Villains or strike the Mastermind.
              </p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wide block">3. End Phase</span>
              <p className="text-slate-300">
                Discard all played and unplayed cards to your personal discard pile. Refill empty HQ spaces from the Hero Deck. Draw <strong>6 new cards</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
