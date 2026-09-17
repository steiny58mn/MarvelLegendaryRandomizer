export const GAME_KEYWORDS = [
  { name: "Abomination", rule: "This villain gets + attack equal to the printed attack value of the hero in the HQ space directly under the villain’s city space. If a city space is listed (e.g. “Sewers Abomination”), it instead uses the HQ space under the listed space. “Highest Abomination” means to use the hero with the highest printed attack value in the HQ. “Double Abomination” means double the bonus. “Ultimate Abomination” means the bonus is the total printed attack of all the heroes in the HQ. Divided cards use the added attack value from both sides of the card.", matchPattern: '\\b([A-Za-z-]+\\s+)?Abominations?\\b' },
  { name: "Ambush", rule: "Villain Ambush effects trigger when the card is played to the city from the villain deck. Hero Ambush effects can be triggered when the card enters the HQ if the current player has a card of the listed class (In hand, played, or controlled)." },
  { name: "Antics", rule: "You can use the ability if you have at least 3 cards (in hand, played, or controlled) with cost 1 or 2 and/or have Size-Changing. The ability must be used at the moment the card is played." },
  { name: "Artifacts (Thrown, Ritual, Triggered)", rule: "Stays in play after your turn (not discarded), and the card’s power may be used again on your future turns. Artifacts in play (or “controlled” by you) count as your heroes for purposes of fulfilling card requirements (like “Reveal” or “Worthy”), but only count as “played” on the turn you first play them (so they may not trigger combo abilities on future turns). Thrown Artifacts must instead be placed on the bottom of your deck when you decide to use their power. If a Thrown Artifact ability is copied by another card/player it is not put on the bottom of the deck. Ritual Artifacts have a condition listed that must be met during a turn to use the artifact effect. Meeting the condition once on the turn allows any number of artifacts to be triggered (even artifacts played after the trigger). If a ritual artifact is copied, the ritual condition does not need to be met, the effect triggers immediately, and the copied card is not discarded. Triggered Artifacts have a trigger condition that can be met multiple times during a turn and allow the artifact effect to be used each time the trigger is met. If a triggered artifact is copied, the trigger does not need to be met and the effect triggers only once (immediately).", aliases: ["Artifacts","Thrown Artifacts","Thrown Artifact","Ritual Artifacts","Ritual Artifact","Triggered Artifacts","Triggered Artifact"] },
  { name: "Astral Plane", rule: "The astral plane is a single space to the right of the villain deck. Villains in this space must be fought with ONLY recruit (equal to their attack total). It is not a city space, not adjacent to any city spaces, and may not be affected by cards unless they specifically reference the astral plane. When a new villain enters this space, any villain already there escapes. Villains do not do ambush effects when entering the astral plane. Any card effect requiring or using attack instead requires only recruit against a villain here (Chivalrous Duel, Excessive Violence, Human Shield, Bribe, etc.). Piercing Energy may not be used here." },
  { name: "Berserk", rule: "Discard the top card of your deck. You get + attack equal to the discarded card’s printed attack value. If Berserk is listed multiple times (“Berserk, Berserk, Berserk”), perform the ability that many times. When you try to fight an enemy with this ability, also discard the top card(s) from your deck. The enemy gains +attack equal to the discarded card’s printed attack values. If you no longer have enough attack to defeat the enemy, you lose all your attack points and can’t fight again (or heal) this turn, and perform any “Fail” effect listed. You may not play any additional cards until the fight is complete, and you may not attempt to fight an enemy unless you have at least enough attack points to match their printed attack value." },
  { name: "Blood Frenzy", rule: "+1 attack for every unique VP value on cards in your victory pile. If a card is given a VP value (like a Master Strike or Undercover card), use that value. Otherwise, if a card has no printed VP value then use the value “0” (which counts toward Blood Frenzy)." },
  { name: "Bribe", rule: "You may fight this villain using any combination of attack AND recruit." },
  { name: "Burrow", rule: "If the Streets space in the city is empty when this villain is defeated, put it back into the streets. Perform the villain’s fight effects and rescue any bystanders before putting it back out. Burrow does not retrigger Ambush effects. Burrow does not trigger when the villain is already in the streets when defeated." },
  { name: "Celestial Boon", rule: "This is a permanent bonus that helps you for the rest of the game, as long as this card is in your victory pile." },
  { name: "Charge", rule: "Move this villain forward the listed amount of extra city spaces." },
  { name: "Cheering Crowds", rule: "You may play this card twice in a row (as though you had 2 copies) if you return a bystander from your victory pile to the bottom of the bystander stack." },
  { name: "Chivalrous Duel", rule: "To fight this enemy you can only use attack from a single hero name. Multiple cards of that single hero may be used. Use the card name if it has no hero name. Artifacts may be used if they match the hero name. Shards may not be used." },
  { name: "Circle of Kung-Fu", rule: "“Nth Circle of Kung-Fu” (or “Quack-Fu”) means that during your turn this villain has +N attack unless you reveal a hero of cost N or more. If a card gains this ability multiple times, only count the highest.", aliases: ["Circle of Quack-Fu", "Kung-Fu", "Quack-Fu"], matchPattern: '\\b(\\d+(?:st|nd|rd|th)?\\s+)?Circle\\s+of\\s+(Kung-Fu|Quack-Fu)\\b' },
  { name: "Clone", rule: "Gain another copy of this card from the HQ (to your discard pile). If not in the HQ, gain from the appropriate deck and shuffle the deck afterwards. If the ability says “When Recruited”, it only happens when you recruit the card (not gain in some other way) immediately after you refill the HQ space. If a villain has this ability - search the villain deck for a copy of this villain and it enters the city (ignoring any further clone effects). Then reshuffle the villain deck. No effect if the card is not found in the villain deck." },
  { name: "Command", rule: "A Villain “Commands” their group if it is the leftmost Villain of that group in the city. (Even if it is the only card of that group.)" },
  { name: "Conqueror", rule: "“X Conqueror N” (for example: “Bridge Conqueror 3”), means +N attack if any villain is in city space X.", matchPattern: '\\b([A-Za-z-]+\\s+)?Conqueror(\\s+\\d+)?\\b' },
  { name: "Contest of Champions", rule: "Each player (in turn order) reveals a single card, either from their hand, cards played this turn, or the top of their deck. The revealed cards printed cost is their “Contest Score”. The score is doubled if the card is of the type specified next to the Contest of Champions ability. After all players have announced their score, reveal the top 2 cards from the hero deck (or more if specified). Evil uses whichever of the 2 cards give the higher score (after doubling). Then put those cards on the bottom of the hero deck. Whichever score is highest (or tied for highest) wins. The card lists the effects for winning or losing." },
  { name: "Coordinate", rule: "During another player’s turn you may discard a Coordinate card from your hand and then draw a new card to replace it. That player may then play a copy of the discarded card. Each player can only coordinate 1 card to another player on each turn, but multiple players may coordinate to the same player. The other player is allowed to decline the coordinate, and coordinate may not be used during the (optional) final showdown." },
  { name: "Cosmic Threat", rule: "Once per turn, for each of the listed card type you reveal, this enemy gets -3 attack this turn. If more than 1 card type is listed, you must choose only 1 of the listed types to reveal." },
  { name: "Cross-Dimensional Rampage", rule: "Each player reveals one of the named cards from their played cards, hand, or victory pile - or gains a wound. (e.g. “Cross-Dimensional Hulk Rampage”) This counts any card that includes the named character (including alternate versions of them), or keyword, in the card or hero name.", aliases: ["Cross-Dimensional Hulk Rampage", "Cross-Dimensional Wolverine Rampage", "Cross-Dimensional Party Rampage", "Cross-Dimensional Zombie Rampage", "Cross-Dimensional Deadpool Rampage", "Cross-Dimensional Demon Rampage", "Cross-Dimensional Thor Rampage", "Cross-Dimensional Illuminati Rampage", "Cross-Dimensional Ultron Rampage", "Cross-Dimensional Void Rampage", "Cross-Dimensional Colossus Rampage", "Cross Dimensional Rampage"], matchPattern: '\\bCross[\\s-]?Dimensional\\s+([A-Za-z0-9\\x27\\x22\\-]+(\\s+[A-Za-z0-9\\x27\\x22\\-]+)?\\s+)?Rampage\\b' },
  { name: "Cyber-Mod", rule: "Heroes gain this effect only if they have the listed card types in their victory pile. Villains gain the effect if the listed card types are in the escape pile (including captured heroes)." },
  { name: "Danger Sense", rule: "Reveal the listed number of cards from the top of the villain deck. +1 attack for each villain you revealed. Put all the revealed cards back on top in any order." },
  { name: "Dark Memories", rule: "+1 attack for each different hero class in your discard pile. Double Dark Memories means double the bonus.", matchPattern: '\\b(Double\\s+)?Dark\\s+Memories\\b' },
  { name: "Demolish", rule: "Reveal the top card of the hero deck. Each player reveals their hand and discards a card with that cost if possible. Then put the revealed card on the bottom of the hero deck." },
  { name: "Demonic Bargain", rule: "Discard the top card of your deck. If the discarded card costs 1 or more, gain a wound (plus any other penalty listed). Gain the listed benefit of the bargain regardless of the card revealed. If choosing another player to bargain, that player may not decline." },
  { name: "Digest", rule: "Use a Digest ability only if you have at least the listed number of cards in your victory pile. Digest abilities only trigger once, regardless of how many extra cards are in your victory pile. Use an Indigestion ability only if you do not meet the condition for the Digest ability (do not have enough cards in your victory pile). You may not choose to use an Indigestion ability if you do have enough cards to trigger Digest.", aliases: ["Indigestion"] },
  { name: "Dodge", rule: "During your turn you may discard this card from your hand to draw another card. Cards discarded to dodge do not count as played and give no other card effects." },
  { name: "Dominate", rule: "Put the specified heroes under this enemy. This enemy gets +1 attack for each hero it’s dominating. When you fight that enemy, put 1 dominated hero into each player’s discard pile (your choice) and KO any remaining." },
  { name: "Double-Cross", rule: "Each player reveals their hand and discards one of their highest cost “doubles” (card that has the same cost as another card in their hand)." },
  { name: "Elusive", rule: "You can only fight this enemy if you have made at least the number of recruit points listed. (e.g. “Elusive 6” means you must have made 6 recruit before fighting.) The recruit points are not spent to fight, you just have to have them.", matchPattern: '\\bElusive(\\s+\\d+)?\\b' },
  { name: "Empowered", rule: "+1 attack for each card of the listed types in the HQ (or other pile if specified). Double or Triple Empowered mean double or triple the bonus. Heroes calculate the empowered bonus when played. Villains evaluate it when fought.", matchPattern: '\\b(Double|Triple|Quadruple\\s+)?Empowered(\\s+by(\\s+\\[[A-Za-z]+\\])?)?\\b' },
  { name: "Endgame", rule: "“Endgame” effects are only triggered when the Villain Deck holds 8 cards per player or fewer." },
  { name: "Excessive Violence", rule: "Once per turn, you can spend 1 attack more than needed to fight a villain/mastermind. If you do, you get to use the “Excessive Violence” abilities on all cards you’ve already played this turn. “Excessive Kindness” abilities work the same way, except they are triggered by spending 1 more recruit than required when recruiting a hero. Specific card clarification: “Gravity Mines” (Rocket & Groot) can be used even if it is the only Excessive Violence card you have.", aliases: ["Kindness", "Excessive Kindness"], matchPattern: '\\bExcessive\\s+(Violence|Kindness)\\b' },
  { name: "Explore", rule: "Put a hero from the HQ on the bottom of the hero deck. Reveal the top 2 cards of the hero deck. Choose 1 to fill the empty space, and put the other on the bottom of the hero deck. The “Found Hero” is the card chosen to enter the HQ." },
  { name: "Fated Future", rule: "When you play this card, put it on the bottom of your deck. You still get its attack and recruit that turn, and it still counts as having been played for combos, but it no longer counts as one of “your heroes” or “a hero you have”." },
  { name: "Fateful Resurrection", rule: "Reveal the top card of the villain deck. If it’s a Scheme Twist or Master Strike, this villain reenters the city. You still perform Fight effects and rescue any bystanders. If a Mastermind Tactic resurrects, shuffle it back into the tactic stack. If an ascended mastermind resurrects, it stays a mastermind instead of reentering the city." },
  { name: "Feast", rule: "KO the top card of your deck." },
  { name: "Focus", rule: "You may pay the cost on the left side of the arrow to use the ability on the right side. Focus abilities can be used multiple times per turn as long as the cost can be paid. You may use Focus and heal wounds." },
  { name: "Fortify", rule: "Put this card next to the listed place. While it’s there, it has the listed effect. May be fought separately to end the fortify effect." },
  { name: "Haunt", rule: "Tuck this Villain beneath the Haunted Hero, so you can see the Villain’s name. Players can’t recruit that Haunted Hero while the Haunting Villain is under it. Spend attack equal to the Haunted Hero’s cost to either KO the hero, or choose any player to gain it. The Haunting villain then enters the city (ignoring Ambush effects). Haunted Heroes are still heroes and are affected normally by anything that affects heroes in the HQ (gained, destroyed, sunlight, etc. - they just can’t be “recruited”). If a Haunted Hero leaves the HQ some other way, the Haunting Villain stays and haunts the next hero to fill the spot. If an HQ space is destroyed, the villain enters the city." },
  { name: "Heist", rule: "Once per turn, you may attempt a heist. Count the number of different non-zero costs among your heroes this turn to determine your Heist count. Then reveal the top card of the Villain Deck and check its printed VP. If your Heist count is greater than the VP value, use all Heist effects you have this turn in any order. If lower, gain a wound. If tied, no effect. Attempting a Heist is optional, and you may not make another attempt if you draw more Heist cards later in the turn." },
  { name: "Hidden Witnesses", rule: "Captured hidden witnesses are taken from the top of the bystander stack and placed face down on the specified card. That card may not be fought/recruited until the hidden witnesses are rescued. During your turn you can pay 2 recruit (any number of times) to rescue a hidden witness. Hidden witnesses still count as bystanders and you get any rescue effects (or escape effects) normally. If an ability allows you to defeat a villain for free, you automatically rescue any hidden witnesses." },
  { name: "Human Shields", rule: "Captured human shields are taken from the top of the bystander stack and placed face down beneath the villain (like regular bystanders). That villain may not be fought until the human shields are rescued. During your turn you can pay attack equal to the villain’s full attack value (including any modifiers) to rescue a human shield. Human shields still count as bystanders and you get any rescue effects (or escape effects) normally. If an ability allows you to defeat a villain for free, you automatically rescue any human shields." },
  { name: "Hunt for Victims", rule: "KO a Bystander that is captured by any Villain or Mastermind or in the Escape Pile. If you can’t, then this captures a Bystander instead." },
  { name: "Hyperspeed", rule: "Reveal the specified number of cards from the top of your deck and get +1 attack for each revealed card with an attack icon." },
  { name: "Hydra Level", rule: "Your HYDRA Level is the number of SHIELD or HYDRA cards in the escape pile. This counts any card with the SHIELD/HYDRA team icons, or with SHIELD or HYDRA in its card name, villain group name, or mastermind name. Effects that put cards directly into the escape pile to increase the HYDRA Level do not count as “escaped” for cards that count escaped villains or require you to KO a hero from the HQ." },
  { name: "Investigate", rule: "Look at the top 2 cards of your deck (or another deck if specified). If the listed card types are found, perform the listed effect - or draw 1 matching card if no effect is specified. Then put the remaining cards back on the top or bottom of your deck in any order." },
  { name: "Last Stand", rule: "+1 attack for each empty space in the city. Double Last Stand means double the bonus." },
  { name: "Liberate X", rule: "You get +X attack , usable only against Villains holding Bystanders or the Mastermind.", aliases: ["Liberate"], matchPattern: '\\bLiberate(\\s+\\d+|\\s+X)?\\b' },
  { name: "Lightshow", rule: "Once per turn, if you played at least 2 Lightshow cards this turn, you can use a single Lightshow ability from 1 of those cards." },
  { name: "Man", rule: "After you use this card’s abilities, set it aside. At the beginning of your next turn (after revealing a villain card and before playing other cards), play this card a second time and then immediately discard it. The “out of time” ability only triggers once so the card may not be played more than 2 times. Doesn’t trigger on copied cards. Counts as played both turns for combos.", aliases: ["Woman Out of Time"] },
  { name: "Microscopic Size Changing", rule: "You can recruit this card (or attack this villain) for 2 less for each card of the listed type you played this turn, up to a max of the number of that type listed. (e.g. 3 tech symbols would allow you to reduce the cost by a max of 6 by playing 3 tech class cards.) This can reduce a card’s recruit cost to negative, in which case you would gain that many recruit (or attack) points.", matchPattern: '\\bMicroscopic\\s+Size[\\s-]?Changing\\b' },
  { name: "Momentum", rule: "Villain gains the listed amount of attack if it entered another city space this turn. (Momentum 3 = +3 attack) Triggers on entering city. “Mass Momentum” = + attack for every villain that entered a new city space this turn.", matchPattern: '\\b(Mass\\s+)?Momentum(\\s+\\d+)?\\b' },
  { name: "Moonlight", rule: "You may only use the listed Moonlight ability if the majority of the heroes in the HQ have an odd-numbered printed cost. Cards may be recruited from the HQ to change the majority trigger during the turn. Divided cards count as just 1 card." },
  { name: "Outwit", rule: "You may only use the listed ability if you reveal Heroes with 3 different costs. You may include the Outwit card itself." },
  { name: "Patrol", rule: "You may only use the listed ability if the specified condition is met at the listed city space or pile." },
  { name: "Phasing", rule: "You may swap this card from your hand with the card on top of your deck (without playing it). This does not count as “drawing a card”, “putting a card on top of your deck”, etc." },
  { name: "Prey", rule: "All players reveal their hands to determine who meets the specified criteria. Current player breaks ties. Put this villain card in front of that player (“preying” on them). Any player may still fight that villain as normal. If it is not defeated by the end of the “prey” player’s turn, use the villain’s “Finish the Prey” ability on that player and it enters the sewers (ignoring Ambush effects). “Finish the Prey” happens after the player has drawn a new hand. A “preying” mastermind goes back to the mastermind stack." },
  { name: "Revenge", rule: "This villain gets +1 attack for each card of the listed type in your victory pile." },
  { name: "Rise of the Living Dead", rule: "Each player checks the top card of their victory pile. If that card is a villain with a “Rise of the Living Dead” ability, that villain reenters the city. Mastermind tactics never return this way. A Villain returning to the city because a Rise of the Living Dead ability can’t bring back additional Villains with its own Rise of the Living Dead ability (no chaining for a single player)." },
  { name: "Sacrifice", rule: "These effects may only be used if you choose to KO the card with the “Sacrifice” keyword at the time you play it. The card still counts as played for recruit/attack/combo purposes." },
  { name: "Savior", rule: "You may only use this ability if you have at least 3 bystanders in your victory pile." },
  { name: "Shard", rule: "When a player gains a shard, they place a shard token in front of themselves. Players may spend shards on their turns for +1 attack. When a villain or mastermind gains a shard, place the shard token on their card. Villains or masterminds get +1 attack for each shard they have. A hero gains 1 shard from a defeated villain/mastermind after fighting them (returning any others to the supply). When a player burns shards, they may return the specified number of shards to the supply to perform the listed ability. Each burn ability can only be used once per turn and burned shards do not also give the +1 attack.", aliases: ["Shards","Cosmic Shard","Cosmic Shards","Gain Shard","Burn Shard"], matchPattern: '\\b(Cosmic\\s+)?Shards?\\b' },
  { name: "Shatter", rule: "Halve the specified enemies current attack value (rounding up) until the end of the turn. May be used multiple times on the same target (halving again each time). “Shatter a Villain” may not be used on a mastermind. “Shatter a Mastermind” only lasts for 1 fight against that mastermind. Shattering a hero in the HQ halves its cost." },
  { name: "SHIELD Clearance", rule: "You must discard a SHIELD or HYDRA team hero before fighting this villain. Double SHIELD Clearance means discard 2 SHIELD/HYDRA heroes." },
  { name: "SHIELD Level", rule: "Your SHIELD Level is the number of SHIELD or HYDRA cards in your victory pile. This counts any card with the SHIELD/HYDRA team icons, or with SHIELD or HYDRA in its card name, villain group name, or mastermind name." },
  { name: "Size-Changing", rule: "Pay 2 less to recruit the card (or to attack the villain) if you played a card of the listed class this turn.", matchPattern: '\\bSize[\\s-]?Changing\\b' },
  { name: "Smash", rule: "You may discard another card from your hand to gain the listed number of attack (e.g. “Smash 3” = +3 attack).", matchPattern: '\\bSmash(\\s+\\d+)?\\b' },
  { name: "Soaring Flight", rule: "When you recruit this hero, set it aside. At the end of this turn, add it to your new hand as an extra card." },
  { name: "Soulbind", rule: "You may choose a face up Villain card from your Victory Pile, turn it face down, and put it on the bottom of your Victory Pile. If you do, then do the listed Soulbind effect. At the end of the game when you are counting Victory Points, turn all those face down cards face up again and you can count their Victory Points. But until the end of the game, the face down cards do not count as being in your Victory Pile at all." },
  { name: "Spectrum", rule: "You may only use the listed Spectrum ability if you have at least 3 classes of heroes. You may include the Spectrum card itself." },
  { name: "Striker", rule: "+1 attack for each Master Strike in the KO pile and/or staked next to the mastermind. Double or Triple Striker means double or triple the bonus.", matchPattern: '\\b(Double|Triple\\s+)?Striker\\b' },
  { name: "Sunlight", rule: "You may only use the listed Sunlight ability if the majority of the heroes in the HQ have an even-numbered printed cost. Cards may be recruited from the HQ to change the majority trigger during the turn. Divided cards count as just 1 card." },
  { name: "Switcheroo", rule: "You can reveal this card from your hand and put it on the bottom of the hero deck. If you do, you may put a hero of the specified printed cost from the HQ into your hand. (e.g. “Switcheroo 4” = take a 4 cost hero from the HQ.)" },
  { name: "Symbiote Bonds", rule: "Stack the specified card onto the specified villain, combining them into a single villain with both card’s attack value and text added together. You must spend the combined total attack to defeat only 1 of the cards (your choice). Only perform Fight effects from the card you choose to defeat, and the other remains and may now be attacked again normally. Only 2 villains may be bonded - ignore any effects that would combine a third. Any other special ability that automatically defeats an enemy (including Piercing Energy equal to the combined VP), still only defeats 1 of the cards." },
  { name: "Tactical Formation", rule: "You can use this ability only if you have heroes of the specified costs. (e.g. 445 = 2 cost 4 and 1 cost 5) You can count cards in your hand or played in front of you (including the Tactical Formation card itself)." },
  { name: "Teleport", rule: "Instead of playing this card, you may set it aside. At the end of your turn, then add it to your new hand as an extra card." },
  { name: "Throne’s Favor", rule: "Use a single nearby object to represent the “Throne’s Favor”. If an ability says to “gain the Throne’s Favor”, you MUST put this object in front of you. If an ability says to “spend the Throne’s Favor”, then you set the object aside to use the ability. Only 1 player may have the Throne’s Favor at any time." },
  { name: "Undercover", rule: "Place the listed card in your victory pile and it becomes worth 1VP (and increases your SHIELD Level). If a card sends itself undercover you still get its attack and recruit that turn, and it still counts as having been played for combos, but it no longer counts as one of “your heroes” or “a hero you have”. Unleash from Undercover: Return the card from your victory pile to your hand. You may then play it as normal and it does not return to your victory pile (unless sent undercover again).. The same trigger may unleash multiple undercover cards. Unleash/Fight effects can be resolved in any order. If a hero has “When Recruited: Send Undercover” and another recruit time ability (like Wall-Crawl), you may choose which one to use." },
  { name: "Uru-Enchanted Weapons", rule: "When you try to fight an enemy with this ability, reveal the listed number of cards from the villain deck. The enemy gains +attack equal to the total victory point value of all the cards revealed. If you no longer have enough attack to defeat the enemy, you lose all your attack points and can’t fight again (or heal) this turn. You may not play any additional cards until the fight is complete. Put all cards revealed on the bottom of the villain deck in random order. Any “Fight or Fail” effect happens regardless of whether or not you defeat the enemy. You may not attempt to fight an enemy unless you have at least enough attack points to match their printed attack value. If there are not enough cards left in the villain deck to reveal, just reveal all you can and reshuffle them (this does not end the game).", matchPattern: '\\bUru[\\s-]?Enchanted\\s+Weapons?\\b' },
  { name: "Versatile", rule: "“Versatile N” means you may either have +N attack or +N recruit.", matchPattern: '\\bVersatile(\\s+\\d+)?\\b' },
  { name: "Villainous Weapon", rule: "When revealed from the villain deck, this card is captured by the closest villain and adds its attack value to that villain. If there are no villains in the city, KO the weapon instead. Villainous Weapons do not count as villains. When a villain with a Villainous Weapon escapes, give the Villainous Weapon to the mastermind. When you defeat a villain or mastermind with Villainous Weapons, put them in your discard pile as Artifacts. Villainous Weapons in player decks do not give their printed attack when played (only their Artifact effect), have 0 cost, have no color or Hero Class, and don’t count as Hero cards or Villain cards." },
  { name: "Waking Nightmare", rule: "Discard a non-grey hero from your hand. If you discard a hero this way, draw a card." },
  { name: "Wall Crawl", rule: "When you recruit this hero, you may put it on top of your deck.", matchPattern: '\\bWall[\\s-]?Crawl\\b' },
  { name: "Weapon X Sequence", rule: "You get + attack equal to the longest consecutive sequence of printed cost numbers on your cards (both played and in your hand). For example: if your cards cost 0,2,3,3,4,7 then your longest sequence would be 2-3-4 and you would get +3 attack. Additional cards drawn later do not extend your sequence and give additional attack. “Doubled Weapon X Sequence” means double the bonus. On enemies, “Weapon X Sequence” gives them + attack equal to the longest sequence of printed cost numbers on cards in the HQ.", aliases: ["Doubled Weapon X Sequence"], matchPattern: '\\b(Doubled\\s+)?Weapon\\s+X\\s+Sequence\\b' },
  { name: "What If", rule: "Choose a Hero Class or Hero Name. Then reveal the top card of your deck, and either put it back on top of your deck or discard it. If the revealed card had the Hero Class or Hero Name you chose, then do the What If effect. You may not choose the names of grey starter cards or partial hero names, but the full hero name can match multiple hero decks with that name in them.", aliases: ["What If...?"], matchPattern: '\\bWhat\\s+If(\\.\\.\\.\\?)?\\b' },
  { name: "Worthy", rule: "You are “Worthy” if you have a hero that costs 5 or more (in your hand, played this turn, or active Artifact)." },
  { name: "Wound a Villain", rule: "Put a wound card onto the villain from the wound stack or from the KO pile. A villain gets -1 attack for each wound on it. When that villain is defeated or leaves the city, return all wounds on it to the wound stack. If a villain is reduced to 0 or less attack, they still require a “Fight” (with 0 attack) to beat. Wounding a villain does not count as a “Fight” (for Fight effects, healing hero wounds, rescuing bystanders, etc.). If a card allows you to wound the Mastermind, the wounds are removed after a fight even if the tactic is shuffled back in." },
  { name: "Wounded Fury", rule: "+1 attack for each wound in your discard pile." },
  { name: "X-Gene", rule: "If you have the listed card type in your discard pile, you get the specified bonus. The X-Gene ability triggers only once, regardless of how many of the listed card type you have in your discard. Cards played on the current turn are not discarded until the end of the turn and so can not trigger X-Gene. Cards recruited on the current turn (into your discard pile) can trigger X-Gene." },
  { name: "X-Treme Attack", rule: "This enemy gets +1 attack for each other enemy in the city with X-Treme Attack.", matchPattern: '\\bX[\\s-]?Treme\\s+Attack\\b' },
  { name: "Adapting", rule: "Has only mastermind tactics cards (and no regular mastermind card). Whichever tactic is currently on top of the stack counts as the current mastermind card. “Adapt” means shuffle the mastermind stack and randomly put one on top. You always fight the card on top.", aliases: ["Adapting Mastermind","Adapting Masterminds"], matchPattern: '\\bAdapting(\\s+Masterminds?)?\\b' },
  { name: "Ambition Cards (A Player is the Mastermind)", rule: "Setup: The mastermind player has a regular starting deck. Put the “Pure Evil” ambition card face up near the mastermind player to start the ambition row, and shuffle the other ambition cards and place them in a deck face down. The mastermind player is not counted when determining card count at the beginning of the game, but is counted for the purpose of any scheme card text. The mastermind player takes the first turn. The mastermind player may optionally choose 3 heroes to form their own 5 space HQ(Lair), or they may recruit from the regular HQ as normal. Play: At the start of the mastermind player’s turn, do not play a card from the villain deck. Instead, place the top card of the ambition deck face up in the ambition row. The mastermind must immediately choose an ambition card to discard if the row is ever larger than 4 cards. The mastermind player may spend the listed number of attack points on their turn to play cards from the ambition row (and then discard them). The mastermind may choose to fight villains from the city if they desire. Master Strikes, Ambush effects, and Escape effects don’t affect the mastermind player. Other effects (like Fight or Scheme effects) still do.", aliases: ["Ambition Cards"] },
  { name: "Ambush Schemes", rule: "When an Ambush Scheme is played from the villain deck, put it next to the normal Scheme and do its Ambush effect. For the rest of the game, when a Scheme Twist is played, do both Scheme’s Twist effects (in any order). If the Ambush Scheme is defeated, put it in your victory pile. If a second Ambush Scheme would be played, KO it and play another card from the villain deck instead." },
  { name: "Destroyed City Spaces", rule: "If a city space is destroyed, act as if that space no longer exists. No cards may enter that space, and any card text referring to it is completely ignored and has no effect. May cover spaces with wounds to mark if necessary." },
  { name: "Divided", rule: "Choose one side of the card when played or recruited and ignore the other. While in hand or HQ, divided cards count as both sides (classes, teams, and names), and its “printed” attack is the total of both sides.", aliases: ["Divided Cards"] },
  { name: "Location", rule: "Play above nearest city space that does not have a location. Locations don’t move, affect villains fought in that space, and can be attacked and defeated independently of the villain. If all city spaces already have a location, KO the location with the lowest attack (including the new location) to make room. Locations do not count as villains and city spaces with only a location still count as empty.", aliases: ["Locations"] },
  { name: "Multiclass Cards", rule: "Multiclass cards count as both classes at all times." },
  { name: "Piercing Energy", rule: "You can fight an enemy by spending piercing energy points equal to that enemy’s printed victory point value. When fighting with piercing energy, completely ignore the enemy’s attack value, attack modifiers, and any special conditions for fighting the enemy (Human shields, etc.). You may not use piercing energy to fight an enemy with no printed victory point value." },
  { name: "Sidekicks", rule: "Only 1 sidekick may be recruited per turn. Cards abilities that let you gain sidekicks do not count against this limit." },
  { name: "Special SHIELD Officers", rule: "Count as SHIELD Officers (like Maria Hill), but are not “grey cards”." },
  { name: "Transforming Heroes", rule: "Keep “Transformed” cards separate (don’t shuffle into the hero deck). When you play a card effect that says to transform into another card, first complete all effects (including gaining attack and recruit) from the original card. Then remove the transforming card from the game and add the new transformed card to your hand (or other location if specified)." },
  { name: "Transforming Masterminds", rule: "Start with the “Always Leads” side face up. When told to “Transform” the mastermind, flip it to its opposite side. Don’t also do the Master Strike ability of the new side on the same turn." },
  { name: "Transforming Schemes", rule: "Start with the side that says “Setup” face up. Flip when instructed to “Transform this Scheme”." },
  { name: "Trap", rule: "When a trap is played from the villain deck it lists a challenge to complete this turn. If you complete the challenge, put the trap in your victory pile. If you fail to complete the challenge by the end of the turn, suffer the listed consequences after drawing your new hand. Traps don’t push villains forward in the city.", aliases: ["Traps"] },
  { name: "Veiled", rule: "Start with the “Veiled” side face up. When the scheme “transforms”, shuffle together all “Unveiled” schemes you own (including the one you started with) and randomly draw one. Place that scheme on the “Unveiled” side.", aliases: ["Unveiled Schemes"] },
  { name: "Fight", rule: "A Fight effect on a Villain or Mastermind triggers when you defeat it." },
  { name: "Escape", rule: "An Escape effect triggers when a Villain leaves the city (usually by moving off the rightmost space)." },
  { name: "Rescue", rule: "When you Rescue a Bystander, take it from the Bystander deck and put it in your Victory Pile." },
  { name: "Strike", rule: "Master Strike effects trigger when drawn from the Villain Deck." },
  { name: "Scheme Twist", rule: "Scheme Twist effects advance the Evil Scheme when drawn from the Villain Deck." },
  { name: "Bystander Rescue", rule: "Rescue a Bystander." },
  { name: "Wound", rule: "A Wound card." },
  { name: "Scan", rule: "Scan allows players to look at face-down cards in the Complex or HQ, revealing hazards and Xenomorphs before they strike." },
  { name: "Acid Blood", rule: "When you fight an Enemy with Acid Blood, it damages you or your equipment upon defeat." },
  { name: "Facehugger", rule: "Facehuggers attach to players and will hatch into a lethal Chestburster if not eliminated in time." },
  { name: "Chestburster", rule: "If a Chestburster is drawn from a player deck, that player is fatally impregnated and eliminated unless saved." },
  { name: "Bullet Time", rule: "Bullet Time allows a player to react at supersonic speeds, negating attacks or dodging Sentinel ambushes." },
  { name: "Gadget", rule: "Gadgets are high-tech spy devices from Q Branch that remain in play to give tactical bonuses." },
  { name: "Valyrian Steel", rule: "Valyrian Steel weapons ignore damage resistance and inflict critical strikes on White Walkers." },
  { name: "Wildfire", rule: "Wildfire burns down city sectors or bridges, wiping out all troops and enemies stationed there." },
  { name: "Trophy", rule: "Predators collect skulls and tech of worthy prey as Trophies, granting them stacking combat prowess." },
  { name: "Black Oil", rule: "The extraterrestrial Black Oil virus infects victims, taking total control of their faculties and spreading colonization." },
  { name: "Hellmouth", rule: "The Hellmouth is an opening between dimensions through which supernatural evil, demons, and vampires surge into the town." },
  { name: "Dust", rule: "Dusting a Vampire completely destroys it with a stake to the heart or sunlight, preventing resurrection." },
  { name: "Job", rule: "Jobs are smuggling or heist contracts taken by the crew for credits and reputation while dodging Alliance patrols." },
  { name: "Transform", rule: "When a card tells you to Transform, remove it from your deck or the game and replace it with its Transformed version.", matchPattern: '\\bTransform(s|ed|ing)?\\b' },
  { name: "Hope", rule: "Increase the Hope side of the Hope and Fear track.", matchPattern: '\\bHope\\b' },
  { name: "Fear", rule: "Increase the Fear side of the Hope and Fear track.", matchPattern: '\\bFear\\b' },
  { name: "Support", rule: "Support Heroes are secondary Heroes that provide additional effects.", matchPattern: '\\bSupport\\b' },
  { name: "Danger Level", rule: "The Danger Level acts as a ticking clock. If a Mission escapes the city or a specific effect triggers it, the Danger Level increases. If it reaches the Scheme's maximum, the players lose the game.", matchPattern: '\\bDanger Level\\b' },
  { name: "Mission", rule: "Missions act similarly to Villains but represent objectives. If a Mission escapes the city, it increases the Danger Level by 1.", matchPattern: '\\bMission(s)?\\b' },
  { name: "Ascend", rule: "Ascend elevates a Hero or Villain to a higher plane of power, turning it into a Cosmic Threat or supreme leader.", matchPattern: '\\bAscend\\b' }
];

export const getKeywordRule = (keyword: string): string => {
  if (!keyword) return "No rule provided.";
  const cleanKeyword = keyword.trim().toLowerCase();
  
  // 1. Exact match on name
  const match = GAME_KEYWORDS.find(k => k.name.toLowerCase() === cleanKeyword);
  if (match) return match.rule;
  
  // 2. Match on aliases
  const aliasMatch = GAME_KEYWORDS.find(k => k.aliases?.some(a => a.toLowerCase() === cleanKeyword));
  if (aliasMatch) return aliasMatch.rule;

  // 3. Match against matchPattern (if regex matches full or partial query)
  for (const kw of GAME_KEYWORDS) {
    if (kw.matchPattern) {
      try {
        const regex = new RegExp(kw.matchPattern, 'i');
        if (regex.test(cleanKeyword)) {
          return kw.rule;
        }
      } catch (e) {
        // ignore regex compilation issues
      }
    }
  }

  // 4. Structural keyword variant resolution
  // "Cross-Dimensional [X] Rampage" -> Cross-Dimensional Rampage
  if (/^cross[\s-]?dimensional\s+.*\s*rampage$/i.test(cleanKeyword) || /cross[\s-]?dimensional\s+rampage/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Cross-Dimensional Rampage");
    if (kw) return kw.rule;
  }

  // "[N]th Circle of [Kung-Fu / Quack-Fu]" -> Circle of Kung-Fu
  if (/\b(?:circle\s+of\s+(?:kung-fu|quack-fu)|\d+(?:st|nd|rd|th)?\s+circle\s+of\s+[\w-]+)\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Circle of Kung-Fu");
    if (kw) return kw.rule;
  }

  // "[Location] Conqueror [N]" -> Conqueror
  if (/\bconqueror(?:\s+\d+)?\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Conqueror");
    if (kw) return kw.rule;
  }

  // "Smash [N]" -> Smash
  if (/\bsmash(?:\s+\d+)?\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Smash");
    if (kw) return kw.rule;
  }

  // "Liberate [N]" -> Liberate X
  if (/\bliberate(?:\s+\d+|\s+x)?\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Liberate X");
    if (kw) return kw.rule;
  }

  // "Elusive [N]" -> Elusive
  if (/\belusive(?:\s+\d+)?\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Elusive");
    if (kw) return kw.rule;
  }

  // "Versatile [N]" -> Versatile
  if (/\bversatile(?:\s+\d+)?\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Versatile");
    if (kw) return kw.rule;
  }

  // "Momentum [N]" / "Mass Momentum [N]" -> Momentum
  if (/\bmomentum(?:\s+\d+)?\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Momentum");
    if (kw) return kw.rule;
  }

  // "Excessive [Kindness / Violence]" -> Excessive Violence
  if (/\bexcessive\s+(?:violence|kindness)\b/i.test(cleanKeyword) || /\bkindness\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Excessive Violence");
    if (kw) return kw.rule;
  }

  // "[X] Abomination" -> Abomination
  if (/\babomination\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Abomination");
    if (kw) return kw.rule;
  }

  // "[Double/Triple] Striker" -> Striker
  if (/\bstriker\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Striker");
    if (kw) return kw.rule;
  }

  // "[Double/Triple/Quadruple] Empowered [by ...]" -> Empowered
  if (/\bempowered(?:\s+by)?\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Empowered");
    if (kw) return kw.rule;
  }

  // "Double Dark Memories" -> Dark Memories
  if (/\bdark\s+memories\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Dark Memories");
    if (kw) return kw.rule;
  }

  // "[Microscopic] Size-Changing [...]" -> Size-Changing or Microscopic Size Changing
  if (/\bmicroscopic\s+size[\s-]?changing\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Microscopic Size Changing");
    if (kw) return kw.rule;
  }
  if (/\bsize[\s-]?changing\b/i.test(cleanKeyword)) {
    const kw = GAME_KEYWORDS.find(k => k.name === "Size-Changing");
    if (kw) return kw.rule;
  }

  // 5. Substring match fallback
  for (const known of GAME_KEYWORDS) {
    const kName = known.name.toLowerCase();
    if (cleanKeyword.includes(kName) || kName.includes(cleanKeyword)) {
      return known.rule;
    }
  }

  return "This is a thematic tag associated with this card's lore, synergy, or abilities. It does not represent a specific Marvel Legendary mechanical keyword with a universal rule.";
};
