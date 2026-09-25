/**
 * ELOQUENCE 26 - Official Competition Rules & Guidelines Data
 * Structured JSON representation of all technical and non-technical event rules.
 */

const rulesData = {
  /* ───── TECHNICAL EVENTS ───── */
  'tech-01': {
    id: 'tech-01',
    name: 'SLIDE CRAFT',
    alias: 'Slide Craft',
    category: 'technical',
    fee: '₹100 per head',
    feePerHead: 100,
    feeType: 'per_head',
    teamSize: 'Max of 3 members',
    minMembers: 1,
    maxMembers: 3,
    venue: 'CSE & AIDS Smart room',
    timing: '10:40 AM TO 3:00 PM',
    description: 'Present your groundbreaking ideas with clarity, innovation, and impactful slide decks before an expert jury.',
    rules: [
      'Teams are highly recommended to submit/send their PPT before the event starts.',
      'Each team will have 5 minutes for presentation.',
      '2 minutes will be allotted for Q&A.',
      'Presentation should contain fewer than 7 slides.',
      'Maximum of 3 members per team.',
      'Registration fee: ₹100 per participant / head.',
      'Topics must be relevant to emerging technologies, AI, computer science, or engineering innovations.'
    ],
    topics: [
      'Emerging Technologies: How Innovation Is Shaping Our Future',
      'Will AI Replace Jobs or Transform Them?',
      'Skills vs. Degree: What Matters More for Career Success?'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Slide Deck Presentation',
        duration: '5 Minutes',
        desc: 'Present your slides (fewer than 7 slides) covering problem statement, architecture, methodology, and conclusion.'
      },
      {
        round: 'Round 2',
        title: 'Jury Q&A Defense',
        duration: '2 Minutes',
        desc: 'Defend your technical concepts, feasibility, and design decisions before the expert panel.'
      }
    ],
    guidelines: [
      'Bring your presentation on a clean USB drive and email a backup copy.',
      'Audio-visual aids and live software prototypes are encouraged.',
      'Plagiarism in slide content will lead to immediate disqualification.'
    ]
  },

  'tech-02': {
    id: 'tech-02',
    name: 'CRACK THE CODE',
    alias: 'Crack the Code',
    category: 'technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Individual / Team of 2',
    minMembers: 1,
    maxMembers: 2,
    venue: 'Computer Labs 1 & 2',
    timing: '10:30 AM – 1:00 PM',
    description: 'Put your programming logic and debugging precision to the ultimate speed and accuracy test.',
    rules: [
      'Built-in libraries are not allowed.',
      'Round 1: Written test – Technical questions.',
      'Round 2: Coding & Debugging (Coding questions, Debugging questions).',
      'Participation can be individual or in a team of up to 2 members.',
      'Registration fee: ₹50 per head.',
      'Allowed programming languages: C, C++, Java, Python.',
      'Use of internet, AI tools, or external storage devices is strictly prohibited.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Written Technical Screening',
        duration: '30 Minutes',
        desc: 'MCQ & short-answer written test testing core computer science, syntax, logic, and data structures.'
      },
      {
        round: 'Round 2',
        title: 'Coding & Debugging Challenge',
        duration: '60 Minutes',
        desc: 'Fix corrupted code snippets (Debugging) and implement algorithmic logic from scratch without built-in libraries (Coding).'
      }
    ],
    guidelines: [
      'All code must be self-written from fundamental data types and logic.',
      'Code will be evaluated on correctness, time complexity, and edge case handling.'
    ]
  },

  'tech-03': {
    id: 'tech-03',
    name: 'TECH BATTLE',
    alias: 'Tech Battle',
    category: 'technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Individual / Team of 2',
    minMembers: 1,
    maxMembers: 2,
    venue: 'Online Quiz Arena / Lab 3',
    timing: '11:00 AM – 12:30 PM',
    description: 'Battle through rapid-fire rounds of computing trivia, tech history, and real-time brain busters.',
    rules: [
      'Screen sharing or changing screens is strictly restricted.',
      'There will be 3 rounds.',
      'Total time: 45 minutes (15 minutes per round).',
      'Participation can be individual or in a team of up to 2 members.',
      'Registration fee: ₹50 per head.',
      'Switching browser tabs or opening secondary apps will result in auto-submission and disqualification.',
      'Ties will be resolved using sudden-death tiebreaker speed questions.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Fundamentals & Tech Trivia',
        duration: '15 Minutes',
        desc: 'Fast-paced MCQs on CS basics, hardware, operating systems, and pioneers.'
      },
      {
        round: 'Round 2',
        title: 'Modern Tech, AI & Logos',
        duration: '15 Minutes',
        desc: 'Visual clues, brand identification, AI frameworks, and emerging tech stacks.'
      },
      {
        round: 'Round 3',
        title: 'Grand Rapid Fire Finale',
        duration: '15 Minutes',
        desc: 'High-stakes complex technical problem questions with negative marking.'
      }
    ],
    guidelines: [
      'Stable system setup will be provided at the campus quiz hall.',
      'Maintain continuous focus on the active exam window.'
    ]
  },

  'tech-04': {
    id: 'tech-04',
    name: 'WEB / PROMPT',
    alias: 'Web / Prompt',
    category: 'technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Individual / Team of 2',
    minMembers: 1,
    maxMembers: 2,
    venue: 'Web Development Lab 4',
    timing: '10:45 AM – 1:15 PM',
    description: 'Build modern responsive web interfaces or engineer high-precision AI prompts to generate optimal applications.',
    rules: [
      'Round 1: Landing Page design and implementation.',
      'Round 2: Overall Website and full functionality.',
      'Systems will be provided for the competition.',
      'Participate individually or in a team of 2 members.',
      'Registration fee: ₹50 per head.',
      'Modern web technologies (HTML, CSS, JS, frameworks) and prompt engineering workflows allowed.',
      'Submissions evaluated on UI aesthetics, responsiveness, semantic code, and prompt efficiency.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Landing Page Sprint',
        duration: '45 Minutes',
        desc: 'Create an engaging, hero-focused landing page based on the surprise theme provided on the spot.'
      },
      {
        round: 'Round 2',
        title: 'Full Website Expansion',
        duration: '60 Minutes',
        desc: 'Scale the landing page into a multi-section, responsive web experience with functional interactions.'
      }
    ],
    guidelines: [
      'Clean desktop systems with standard IDEs and browsers will be provided.',
      'External asset packs and CDNs are permissible.'
    ]
  },

  'tech-05': {
    id: 'tech-05',
    name: 'CHART CANVAS',
    alias: 'Chart Canvas',
    category: 'technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Team (Max 3 members)',
    minMembers: 1,
    maxMembers: 3,
    venue: 'Drawing Hall / Main Corridor',
    timing: '10:30 AM – 12:45 PM',
    description: 'Unleash your manual graphic creativity on chart paper to visually communicate complex tech ideas.',
    rules: [
      'Topics will be provided on the spot.',
      'Participants should bring the required drawing and art materials.',
      '1 hour will be provided for designing the poster.',
      '5 minutes will be given for explanation/presentation to the judges.',
      'Poster must be designed within the given theme.',
      'Maximum 3 members per team.',
      'Registration fee: ₹50 per head.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Chart Poster Creation',
        duration: '60 Minutes (1 Hour)',
        desc: 'Manual drafting, sketch, coloring, and infographics on chart paper within the assigned topic.'
      },
      {
        round: 'Round 2',
        title: 'Concept Presentation',
        duration: '5 Minutes',
        desc: 'Explain your poster concept, symbolism, and message to the judging panel.'
      }
    ],
    guidelines: [
      'Standard chart papers will be provided by the host college.',
      'Participants must bring their own sketch pens, markers, colors, and rulers.'
    ]
  },

  'tech-06': {
    id: 'tech-06',
    name: 'UI/UX',
    alias: 'UI/UX',
    category: 'technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Individual',
    minMembers: 1,
    maxMembers: 1,
    venue: 'Design & Multimedia Lab 5',
    timing: '11:00 AM – 1:30 PM',
    description: 'Design intuitive, modern digital interfaces and user experiences using industry-standard design tools.',
    rules: [
      'Topics will be given on the spot.',
      'Tools allowed: Figma, Canva.',
      'AI usage is strictly restricted.',
      'There will be 2 rounds: Round 1 – Login Page, Round 2 – Dashboard.',
      'Individual participation only.',
      'Registration fee: ₹50 per head.',
      'Designs judged on visual hierarchy, accessibility, UI consistency, and prototype interactions.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Login / Authentication Interface',
        duration: '40 Minutes',
        desc: 'Design a sleek, accessible, responsive Login & Sign-up page for the assigned application domain.'
      },
      {
        round: 'Round 2',
        title: 'Application Dashboard Design',
        duration: '60 Minutes',
        desc: 'Design a high-density, interactive Dashboard interface with data visualization and side navigation.'
      }
    ],
    guidelines: [
      'No pre-made UI kits or AI prompt generators allowed.',
      'Live share links or export files must be submitted before timer ends.'
    ]
  },

  'tech-07': {
    id: 'tech-07',
    name: 'The Roborange Botathon',
    alias: 'The Roborange Botathon',
    category: 'technical',
    fee: '₹150 per head',
    feePerHead: 150,
    feeType: 'per_head',
    teamSize: 'Max of 4 members',
    minMembers: 1,
    maxMembers: 4,
    venue: 'CSE Seminar Hall',
    timing: '10:00 AM – 01:00 PM',
    description: 'Watch autonomous robots race to follow a track using their own sensors — no remote control allowed. Fastest clean run wins, with penalty points for going off-track or any manual intervention.',
    rules: [
      'Each team must have 2–4 members and register one robot with a unique team name.',
      'The robot must be a line-follower that runs fully autonomously — no manual or remote control during the run.',
      'Ranking is based on the fastest successful completion time across the given attempts.',
      'Penalty points apply for leaving the track, skipping checkpoints, or touching/moving the robot during a run.',
      'The judges\' decision on time, penalties, and qualification is final.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Track Qualification Run',
        duration: '10 Minutes',
        desc: 'Autonomous run through the qualification line path to record baseline timing.'
      },
      {
        round: 'Round 2',
        title: 'Championship Speed Trials',
        duration: '15 Minutes',
        desc: 'Complex obstacle and curve track run to determine fastest clean run.'
      }
    ],
    guidelines: [
      'Robots must be fully autonomous with onboard power supply.',
      'Teams must report 15 minutes before the competition start time.'
    ]
  },

  /* ───── NON-TECHNICAL EVENTS ───── */
  'nontech-01': {
    id: 'nontech-01',
    name: 'SNAP & REEL',
    alias: 'Snap & Reel',
    category: 'non-technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Individual',
    minMembers: 1,
    maxMembers: 1,
    venue: 'Campus Grounds & Media Room',
    timing: '10:00 AM – 2:00 PM',
    description: 'Capture the pulse, emotion, and aesthetic moments of ELOQUENCE 26 in cinematic photography and short-form reels.',
    rules: [
      'Individual participation only.',
      'Registration fee: ₹50 per head.',
      'All footage and photos must be originally shot within the college campus on the day of the fest.',
      'Reel duration must be between 30 to 60 seconds with suitable background audio.',
      'Basic color grading is allowed; heavy pre-rendered CGI is disallowed.',
      'Submissions must be made to the coordinator before the final cutoff time.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Campus Capture Sprint',
        duration: 'Throughout Fest',
        desc: 'Shoot cinematic b-roll, photography frames, and candid event moments.'
      },
      {
        round: 'Round 2',
        title: 'Reel Submission & Screening',
        duration: 'Final 30 Mins',
        desc: 'Submit rendered reel file for jury evaluation based on storytelling, transitions, and grading.'
      }
    ],
    guidelines: [
      'Mobile phones and DSLR cameras are both welcomed.',
      'Respect participant privacy when capturing close-up footage.'
    ]
  },

  'nontech-02': {
    id: 'nontech-02',
    name: 'LINK UP (CONNECTION)',
    alias: 'Link Up',
    category: 'non-technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Max of 3 members',
    minMembers: 1,
    maxMembers: 3,
    venue: 'Auditorium Hall B',
    timing: '11:15 AM – 1:00 PM',
    description: 'Decode visual clues, guess the hidden associations, and connect disparate images into one logical answer.',
    rules: [
      'Team event: Maximum of 3 members.',
      'Registration fee: ₹50 per head.',
      'Clues will span movies, pop culture, logos, science, and word puns.',
      'Buzzer rules apply: fastest buzz gets the first right to answer.',
      'Incorrect answers on buzz will incur negative points.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Rapid Connection Preliminary',
        duration: '30 Minutes',
        desc: 'Written visual connection paper round to qualify top squads.'
      },
      {
        round: 'Round 2',
        title: 'Stage Buzzer Showdown',
        duration: '45 Minutes',
        desc: 'Live projection connection questions with fast buzzer battles.'
      }
    ],
    guidelines: [
      'Teamwork and quick thinking are critical.',
      'Decision of the quizmaster is final.'
    ]
  },

  'nontech-03': {
    id: 'nontech-03',
    name: 'HUNT ZONE (TREASURE HUNT)',
    alias: 'Hunt Zone',
    category: 'non-technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Max of 4 members',
    minMembers: 2,
    maxMembers: 4,
    venue: 'Campus Open Quadrangle',
    timing: '11:30 AM – 2:00 PM',
    description: 'Crack cryptic riddles, search for hidden checkpoint markers across campus, and race to unlock the mystery treasure.',
    rules: [
      'Team event: 2 to 4 members per team.',
      'Registration fee: ₹50 per head.',
      'Teams must decipher clues in strict numerical sequence.',
      'Interference with another team or clue damage results in immediate disqualification.',
      'First team to locate the final master clue and report back wins.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Riddle Qualifier',
        duration: '20 Minutes',
        desc: 'Solve initial brain teaser to receive the first physical map coordinates.'
      },
      {
        round: 'Round 2',
        title: 'Campus Treasure Race',
        duration: '90 Minutes',
        desc: 'Navigate multi-checkpoint physical trail across campus buildings.'
      }
    ],
    guidelines: [
      'Stay within designated campus boundary limits.',
      'Maintain safety and discipline across corridors and grounds.'
    ]
  },

  'nontech-04': {
    id: 'nontech-04',
    name: 'HENNA HEIST (MEHANDI)',
    alias: 'Henna Heist',
    category: 'non-technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Individual',
    minMembers: 1,
    maxMembers: 1,
    venue: 'Seminar Hall Corridor / Art Lounge',
    timing: '11:00 AM – 12:30 PM',
    description: 'Demonstrate fine traditional and contemporary mehndi art with intricate, elegant henna designs.',
    rules: [
      'Individual participation.',
      'Registration fee: ₹50 per head.',
      'Participants must bring their own henna cones and accessories.',
      'Time duration: 1 hour.',
      'Designs must extend from fingertips to wrist/elbow as specified on the spot.',
      'Judged on neatness, intricacy, symmetry, and visual elegance.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Henna Application',
        duration: '60 Minutes (1 Hour)',
        desc: 'Apply original mehndi designs on partner or provided hand canvas.'
      }
    ],
    guidelines: [
      'Pre-drawn stencils or transfer tattoos are strictly forbidden.',
      'Fresh, authentic henna art only.'
    ]
  },

  'nontech-05': {
    id: 'nontech-05',
    name: 'BATTLE OF CHAMPIONS (E-SPORTS)',
    alias: 'Battle of Champions',
    category: 'non-technical',
    fee: '₹200 per squad',
    feePerHead: 50,
    feeType: 'per_squad',
    teamSize: 'Only Squad Match (4 Players)',
    minMembers: 4,
    maxMembers: 4,
    venue: 'E-Sports Arena / Auditorium Room 1',
    timing: '10:30 AM – 2:00 PM',
    description: 'Squad up for high-octane battle royale tournament. Coordinate tactical drops, gunplay, and secure victory.',
    rules: [
      'Emotes are strictly restricted.',
      '4-player squad match only.',
      'Registration fee: ₹200 per squad flat.',
      'Mobile devices only — no emulators, triggers, iPad/tablet ratios, or third-party config files.',
      'Unsportsmanlike conduct or toxic behavior in lobby will cause immediate disqualification.',
      'Tournament format: Custom room points table (Survival + Kills).'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Group Qualifiers (Match 1)',
        duration: '30 Minutes',
        desc: 'Group stage match to determine top seeds.'
      },
      {
        round: 'Round 2',
        title: 'Championship Finals (Match 2 & 3)',
        duration: '60 Minutes',
        desc: 'Grand finals showdown between top qualifying squads.'
      }
    ],
    guidelines: [
      'Ensure device is fully charged; bring your own power bank and headphones.',
      'Campus Wi-Fi / hotspot will be provided.'
    ]
  },

  'nontech-06': {
    id: 'nontech-06',
    name: '64 SQUARES (CHESS)',
    alias: '64 Squares',
    category: 'non-technical',
    fee: '₹50 per head',
    feePerHead: 50,
    feeType: 'per_head',
    teamSize: 'Individual only',
    minMembers: 1,
    maxMembers: 1,
    venue: 'Indoor Sports Arena / Chess Hall',
    timing: '10:30 AM – 1:30 PM',
    description: 'Outmaneuver, calculate variations, and conquer your opponent’s king on the 64-square battlefield.',
    rules: [
      'Individual participation only.',
      'Registration fee: ₹50 per head.',
      'Rapid / Blitz time control: 10 minutes + 2 seconds increment per move.',
      'Standard FIDE touch-move and tournament rules apply.',
      'Illegal moves: 2nd illegal move results in forfeiture of the game.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Swiss / Knockout Prelims',
        duration: '45 Minutes',
        desc: 'Preliminary matches to seed into the championship knockout bracket.'
      },
      {
        round: 'Round 2',
        title: 'Quarter, Semi & Grand Finals',
        duration: '60 Minutes',
        desc: 'Direct elimination knockout matches under digital chess clocks.'
      }
    ],
    guidelines: [
      'Chess boards, pieces, and digital clocks provided.',
      'Decisions of the Chief Arbiter are final and binding.'
    ]
  },

  'nontech-07': {
    id: 'nontech-07',
    name: 'BATTLEWORLD BIDDING',
    alias: 'Battleworld Bidding',
    category: 'non-technical',
    fee: '₹250 per team',
    feePerHead: 50,
    feeType: 'per_team',
    teamSize: 'Team of 5 Members',
    minMembers: 5,
    maxMembers: 5,
    venue: 'CSE Seminar Hall',
    timing: '10:00 AM – 1:00 PM',
    description: 'Step into the world of strategy, wit, and quick decisions. Bid smart, outthink the rest, and take the win!',
    rules: [
      'Strictly a team of 5 members.',
      'Registration fee: ₹250 per team.',
      'Virtual purse budget will be allocated to each participating team at the start.',
      'Bidding follows sequential live auction rounds with strict countdown timers.',
      'Exceeding allocated purse budget or bid collusion will result in penalty or disqualification.',
      'Scoring is calculated from total squad/asset valuation, strategic diversity, and remaining funds.',
      'Decision of the Auctioneer and judges is final and binding.'
    ],
    rounds: [
      {
        round: 'Round 1',
        title: 'Purse Allocation & Rules Brief',
        duration: '15 Minutes',
        desc: 'Rules explanation, category tier reveal, and budget distribution.'
      },
      {
        round: 'Round 2',
        title: 'Live Auction Bidding',
        duration: '90 Minutes',
        desc: 'Fast-paced live bidding rounds across featured player/asset pools.'
      }
    ],
    guidelines: [
      'Paper and calculators will be provided for tracking bids.',
      'Keep your bidding paddle clearly visible when placing bids.',
      'Virtual purse ledger will be maintained by auction marshals.'
    ]
  }
};

export default rulesData;
