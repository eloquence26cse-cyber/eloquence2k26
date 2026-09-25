/**
 * ELOQUENCE 26 - Student Coordinator Details Data
 * Structured JSON representation of all technical and non-technical event coordinators.
 */

const coordinatorsData = {
  /* ───── TECHNICAL EVENT COORDINATORS ───── */
  'tech-01': {
    eventId: 'tech-01',
    eventName: 'SLIDE CRAFT',
    alias: 'Slide Craft',
    category: 'technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Mohammed Nabeel',
        phone: '9994023366',
        displayPhone: '+91 99940 23366',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Syed Zaid Ahmed',
        phone: '8056463976',
        displayPhone: '+91 80564 63976',
        role: 'Lead Coordinator'
      }
    ]
  },

  'tech-02': {
    eventId: 'tech-02',
    eventName: 'CRACK THE CODE',
    alias: 'Crack the Code',
    category: 'technical',
    coordinators: [
      {
        slot: 'A',
        name: 'MD Faazil Ammar P.',
        phone: '9025184611',
        displayPhone: '+91 90251 84611',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Mohammed Saad V.',
        phone: '8643033733',
        displayPhone: '+91 86430 33733',
        role: 'Lead Coordinator'
      }
    ]
  },

  'tech-03': {
    eventId: 'tech-03',
    eventName: 'TECH BATTLE',
    alias: 'Tech Battle',
    category: 'technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Kashif Ulhaq K.',
        phone: '9150311529',
        displayPhone: '+91 91503 11529',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Tejashwini P.R.',
        phone: '8608190410',
        displayPhone: '+91 86081 90410',
        role: 'Lead Coordinator'
      }
    ]
  },

  'tech-04': {
    eventId: 'tech-04',
    eventName: 'WEB / PROMPT',
    alias: 'Web / Prompt',
    category: 'technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Faseeh Mohammed A.',
        phone: '7867926568',
        displayPhone: '+91 78679 26568',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Roshni',
        phone: '9489339990',
        displayPhone: '+91 94893 39990',
        role: 'Lead Coordinator'
      }
    ]
  },

  'tech-05': {
    eventId: 'tech-05',
    eventName: 'CHART CANVAS',
    alias: 'Chart Canvas',
    category: 'technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Imran B.',
        phone: '6369954082',
        displayPhone: '+91 63699 54082',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Preethi R.',
        phone: '9344114553',
        displayPhone: '+91 93441 14553',
        role: 'Lead Coordinator'
      }
    ]
  },

  'tech-06': {
    eventId: 'tech-06',
    eventName: 'UI/UX',
    alias: 'UI/UX',
    category: 'technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Mohammed Azhan U.',
        phone: '8428487798',
        displayPhone: '+91 84284 87798',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Sufiya Firdause A.',
        phone: '9487915961',
        displayPhone: '+91 94879 15961',
        role: 'Lead Coordinator'
      }
    ]
  },

  'tech-07': {
    eventId: 'tech-07',
    eventName: 'The Roborange Botathon',
    alias: 'The Roborange Botathon',
    category: 'technical',
    coordinators: [
      {
        slot: 'A',
        name: 'MD Faazil Ammar P.',
        phone: '9025184611',
        displayPhone: '+91 90251 84611',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Mohammed Saad V.',
        phone: '8643033733',
        displayPhone: '+91 86430 33733',
        role: 'Lead Coordinator'
      }
    ]
  },

  /* ───── NON-TECHNICAL EVENT COORDINATORS ───── */
  'nontech-01': {
    eventId: 'nontech-01',
    eventName: 'SNAP & REEL',
    alias: 'Snap & Reel',
    category: 'non-technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Ismail',
        phone: '8098067668',
        displayPhone: '+91 80980 67668',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Afra Tharanum A.',
        phone: '6382025752',
        displayPhone: '+91 63820 25752',
        role: 'Lead Coordinator'
      }
    ]
  },

  'nontech-02': {
    eventId: 'nontech-02',
    eventName: 'LINK UP (CONNECTION)',
    alias: 'Link Up',
    category: 'non-technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Mohamed Abbas T.A.',
        phone: '9486976316',
        displayPhone: '+91 94869 76316',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Syed Nounman A.',
        phone: '9844266605',
        displayPhone: '+91 98442 66605',
        role: 'Lead Coordinator'
      }
    ]
  },

  'nontech-03': {
    eventId: 'nontech-03',
    eventName: 'HUNT ZONE (TREASURE HUNT)',
    alias: 'Hunt Zone',
    category: 'non-technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Sugesh B.',
        phone: '9080344472',
        displayPhone: '+91 90803 44472',
        role: 'Lead Coordinator'
      }
    ]
  },

  'nontech-04': {
    eventId: 'nontech-04',
    eventName: 'HENNA HEIST (MEHANDI)',
    alias: 'Henna Heist',
    category: 'non-technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Kaviya Shree',
        phone: '9025853558',
        displayPhone: '+91 90258 53558',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Pooja Sri',
        phone: '9345728863',
        displayPhone: '+91 93457 28863',
        role: 'Lead Coordinator'
      }
    ]
  },

  'nontech-05': {
    eventId: 'nontech-05',
    eventName: 'BATTLE OF CHAMPIONS (E-SPORTS)',
    alias: 'Battle of Champions',
    category: 'non-technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Bala Murugan M.K.',
        phone: '8825905010',
        displayPhone: '+91 88259 05010',
        role: 'Lead Coordinator',
        game: 'Free Fire'
      },
      {
        slot: 'B',
        name: 'Suresh V',
        phone: '6379464434',
        displayPhone: '+91 63794 64434',
        role: 'Lead Coordinator',
        game: 'Free Fire'
      },
      {
        slot: 'C',
        name: 'Mohamed Adnan F',
        phone: '9080969891',
        displayPhone: '+91 90809 69891',
        role: 'Lead Coordinator',
        game: 'BGMI'
      },
      {
        slot: 'D',
        name: 'Syed Zaid Ahmed',
        phone: '8056463976',
        displayPhone: '+91 80564 63976',
        role: 'Lead Coordinator',
        game: 'BGMI'
      }
    ]
  },

  'nontech-06': {
    eventId: 'nontech-06',
    eventName: '64 SQUARES (CHESS)',
    alias: '64 Squares',
    category: 'non-technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Mohammed Mussadiq',
        phone: '9344200079',
        displayPhone: '+91 93442 00079',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Mohammed Sharuk I.',
        phone: '9994580064',
        displayPhone: '+91 99945 80064',
        role: 'Lead Coordinator'
      }
    ]
  },

  'nontech-07': {
    eventId: 'nontech-07',
    eventName: 'BATTLEWORLD BIDDING',
    alias: 'Battleworld Bidding',
    category: 'non-technical',
    coordinators: [
      {
        slot: 'A',
        name: 'Bala Murugan M.K.',
        phone: '8681029193',
        displayPhone: '+91 86810 29193',
        role: 'Lead Coordinator'
      },
      {
        slot: 'B',
        name: 'Vijay Kumar M.',
        phone: '9840251140',
        displayPhone: '+91 98402 51140',
        role: 'Lead Coordinator'
      }
    ]
  }
};

export default coordinatorsData;
