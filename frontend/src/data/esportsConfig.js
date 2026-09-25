export const DEFAULT_ESPORTS_CONFIG = {
  'FREE FIRE': {
    title: 'Free Fire',
    tagline: 'Mobile Battle Royale Clash',
    badge: 'Mobile Only • 4-Player Squad',
    description: 'High-octane mobile battle royale showdown on custom symposium rooms. Drop into Bermuda and Purgatory with your 4-player squad, out-survive opponents with superior tactics, gunplay, and teamwork to seize the Booyah!',
    subtitle: 'Free Fire Custom Room Tournament',
    venue: 'Mech dept Drawing Hall',
    timing: '10:40 AM TO 12:40 PM',
    fee: '₹200 per squad',
    feeType: 'per_squad',
    teamSize: 'Only Squad Match (4 Players)',
    isTeam: true,
    rules: [
      'Strictly 4 players per squad (mobile phones only, no iPads, tablets, or emulators).',
      'Official Free Fire custom room matches played on Bermuda and Purgatory maps.',
      'Gun Property / Attributes will be turned OFF for fair competitive esports play.',
      'Hacks, scripts, triggers, or third-party boosters will result in immediate squad ban.',
      'All players must join the room using their registered In-Game Name (IGN) and UID on time.',
      'Scoring is calculated strictly using the official Free Fire Esports Points System (Placement + Kills).',
      'Participants must bring their own charged mobile devices, earphones, and active internet connection.'
    ],
    rounds: [
      {
        name: 'Match 1: Bermuda Qualifying Drop',
        time: '35 Mins',
        desc: 'All squads drop into Bermuda. Placements and kill points determine the top advancing teams.'
      },
      {
        name: 'Match 2: Purgatory Grand Finals',
        time: '40 Mins',
        desc: 'Top seeded surviving squads battle on Purgatory for the ultimate championship trophy and cash prize.'
      }
    ],
    highlights: [
      'Gun Attributes OFF',
      'Bermuda & Purgatory',
      'Flat ₹200 / Squad'
    ]
  },
  'BGMI': {
    title: 'BGMI',
    tagline: 'Battlegrounds Mobile India Squad Championship',
    badge: 'Smartphone / iPad • 4-Player Squad',
    description: 'Premier squad tactical tournament on classic custom tournament rooms. Coordinate tactical rotations, zone dominance, and precise team assaults across Erangel and Miramar to claim the Winner Winner Chicken Dinner!',
    subtitle: 'BGMI Custom Room Tournament',
    venue: 'Mech dept Drawing Hall',
    timing: '10:40 AM TO 12:40 PM',
    fee: '₹200 per squad',
    feeType: 'per_squad',
    teamSize: 'Only Squad Match (4 Players)',
    isTeam: true,
    rules: [
      'Strictly 4 players per squad (smartphones & iPads permitted; emulators, PCs, and triggers are prohibited).',
      'Matches are hosted on official BGMI Custom Tournament Rooms in TPP Squad mode.',
      'Official competition maps: Erangel (Qualifiers) and Miramar (Grand Finals).',
      'Any form of cheating, wallhacks, aimbots, GFX configs, or iPad-view mods on mobile will result in an instant permanent ban.',
      'Teams must enter the custom room within the allotted time using their registered In-Game Character IDs.',
      'Scoring follows the official BGIS points matrix (10 pts for #1 + 1 pt per finish).',
      'Players must bring fully charged devices, chargers, and personal wired/wireless earphones.'
    ],
    rounds: [
      {
        name: 'Match 1: Erangel Battle Drop',
        time: '35 Mins',
        desc: 'Squads drop across Erangel. Survival placement and finish points rank the leaderboard.'
      },
      {
        name: 'Match 2: Miramar Desert Showdown',
        time: '40 Mins',
        desc: 'Top qualified squads duel in the dunes of Miramar to crown the ELOQUENCE ’26 E-Sports Champion!'
      }
    ],
    highlights: [
      'TPP Squad Mode',
      'Erangel & Miramar',
      'Flat ₹200 / Squad'
    ]
  }
};

export default DEFAULT_ESPORTS_CONFIG;
