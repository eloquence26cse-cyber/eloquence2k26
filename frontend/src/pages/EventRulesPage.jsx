import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  FaArrowLeft,
  FaArrowRight,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
  FaUsers,
  FaListOl,
  FaHeadset,
  FaBolt,
  FaLock,
  FaTimes,
  FaExternalLinkAlt,
  FaCopy,
  FaBuilding,
  FaCamera,
  FaImage,
  FaLayerGroup,
  FaCheckCircle,
  FaGamepad,
  FaStar,
  FaRedoAlt,
  FaWhatsapp,
  FaFire,
  FaCrosshairs
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl, getWsUrl } from '../config/api';
import { getCachedEvents, fetchEventsData, fetchRegistrationStatus, setCachedRegistrationStatus } from '../services/api.js';
import { findEvent, normalizeEvent } from '../utils/eventUtils.js';
import { getEventSticker } from '../data/eventStickers.js';
import coordinatorsData from '../data/coordinator.js';
import rulesData from '../data/rules.js';
import VenueImageModal from '../components/VenueImageModal.jsx';

const ESPORTS_GAMES_DATA = {
  'FREE FIRE': {
    title: 'FREE FIRE',
    tagline: 'Battle Royale Squad Showdown',
    badge: 'Mobile Only • 4-Player Squad',
    description: 'High-octane mobile battle royale showdown on custom symposium rooms. Drop into Bermuda and Purgatory with your 4-player squad, out-survive opponents with superior tactics, gunplay, and teamwork to seize the Booyah!',
    subtitle: 'Free Fire Custom Room Tournament',
    venue: 'Seminar Hall 2 / Annex',
    timing: '10:00 AM – 02:00 PM',
    fee: '₹200 per squad',
    feeType: 'per_squad',
    teamSize: '4 Players / Squad',
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
    venue: 'Seminar Hall 2 / Annex',
    timing: '10:00 AM – 02:00 PM',
    fee: '₹200 per squad',
    feeType: 'per_squad',
    teamSize: '4 Players / Squad',
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

export default function EventRulesPage({ eventId, from, categoryFilter, initialGame, onNavigate }) {
  const getStaticFallbackCoordinators = (id, currentEvent) => {
    if (currentEvent && Array.isArray(currentEvent.coordinators) && currentEvent.coordinators.length > 0) {
      return currentEvent.coordinators;
    }
    if (id && coordinatorsData[id]?.coordinators) {
      return coordinatorsData[id].coordinators;
    }
    return [];
  };

  const [eventsList, setEventsList] = useState(() => getCachedEvents() || []);
  const [loading, setLoading] = useState(false);
  const [liveCoordinators, setLiveCoordinators] = useState(() => getStaticFallbackCoordinators(eventId));
  const [isRegClosed, setIsRegClosed] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);

  const getInitialEsportsGame = () => {
    if (initialGame) {
      const g = String(initialGame).toUpperCase();
      if (g.includes('BGMI')) return 'BGMI';
      if (g.includes('FREE') || g.includes('FIRE')) return 'FREE FIRE';
    }
    try {
      const hash = window.location.hash || '';
      const [, query] = hash.split('?');
      if (query) {
        const p = new URLSearchParams(query);
        const gParam = p.get('game');
        if (gParam) {
          const up = gParam.toUpperCase();
          if (up.includes('BGMI')) return 'BGMI';
          if (up.includes('FREE') || up.includes('FIRE')) return 'FREE FIRE';
        }
      }
    } catch (_) {}
    return null;
  };

  const [selectedEsportsGame, setSelectedEsportsGame] = useState(getInitialEsportsGame);

  useEffect(() => {
    setSelectedEsportsGame(getInitialEsportsGame());
  }, [eventId, initialGame]);

  useEffect(() => {
    let isMounted = true;
    let ws = null;
    let reconnectTimer = null;
    let isExplicitlyClosed = false;

    fetchRegistrationStatus()
      .then((data) => {
        if (isMounted && data?.success) {
          setIsRegClosed(Boolean(data.isRegistrationClosed));
        }
      })
      .catch(() => {});

    const connectWs = () => {
      if (isExplicitlyClosed || !isMounted) return;
      try {
        ws = new WebSocket(getWsUrl('/ws/registrations'));
        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === 'REGISTRATION_UPDATE' && msg.action === 'REGISTRATION_STATUS_UPDATED') {
              if (isMounted) {
                setCachedRegistrationStatus(msg.data);
                setIsRegClosed(Boolean(msg.data?.isRegistrationClosed));
              }
            }
            if (msg.type === 'REGISTRATION_UPDATE' && msg.action === 'EVENT_UPDATED') {
              if (isMounted && msg.data?.id) {
                setEventsList(prev => prev.map(ev => (ev.id === msg.data.id ? { ...ev, ...msg.data } : ev)));
                fetchEventsData(true).catch(() => {});
              }
            }
          } catch (_) {}
        };
        ws.onclose = () => {
          if (!isExplicitlyClosed && isMounted) {
            reconnectTimer = setTimeout(connectWs, 3000);
          }
        };
        ws.onerror = () => {
          try {
            if (ws && ws.readyState === WebSocket.OPEN) ws.close();
          } catch (_) {}
        };
      } catch (_) {
        if (!isExplicitlyClosed && isMounted) {
          reconnectTimer = setTimeout(connectWs, 3000);
        }
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      isExplicitlyClosed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(); } catch (_) {}
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            try { ws.close(); } catch (_) {}
          };
        }
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchEventsData(false)
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setEventsList(data);
        }
      })
      .catch((err) => {
        console.warn('EventRulesPage fetch error:', err);
      });
    return () => { isMounted = false; };
  }, [eventId]);

  const event = findEvent(eventsList, eventId);

  useEffect(() => {
    if (!event?.id) return;
    let isMounted = true;
    const staticFallback = getStaticFallbackCoordinators(event.id, event);
    setLiveCoordinators(prev => (Array.isArray(prev) && prev.length > 0 ? prev : staticFallback));

    fetch(getApiUrl(`/api/coordinators/event/${encodeURIComponent(event.id)}`))
      .then((res) => res.json())
      .then((result) => {
        if (!isMounted) return;
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          setLiveCoordinators(result.data);
        } else if (staticFallback.length > 0) {
          setLiveCoordinators(staticFallback);
        }
      })
      .catch(() => {
        if (isMounted && staticFallback.length > 0) setLiveCoordinators(staticFallback);
      });
    return () => { isMounted = false; };
  }, [event?.id]);

  const isEsports = event && (event.id === 'nontech-05' || event.name?.toLowerCase().includes('gaming') || event.name?.toLowerCase().includes('battle of champions'));
  const activeEsportsData = (isEsports && selectedEsportsGame && ESPORTS_GAMES_DATA[selectedEsportsGame])
    ? ESPORTS_GAMES_DATA[selectedEsportsGame]
    : null;

  const rulesList = activeEsportsData
    ? activeEsportsData.rules
    : ((event && Array.isArray(event.rules) && event.rules.length > 0)
        ? event.rules
        : (rulesData[event?.id]?.rules || []));

  const rounds = activeEsportsData
    ? activeEsportsData.rounds
    : ((event && Array.isArray(event.rounds) && event.rounds.length > 0)
        ? event.rounds
        : (rulesData[event?.id]?.rounds || []));

  const displayDescription = activeEsportsData
    ? activeEsportsData.description
    : (event?.description || event?.subtitle);

  const displaySubtitle = activeEsportsData
    ? activeEsportsData.subtitle
    : event?.subtitle;

  const displayVenue = activeEsportsData
    ? activeEsportsData.venue
    : (event?.venue || 'Seminar Hall 2 / Annex');

  const displayTiming = activeEsportsData
    ? activeEsportsData.timing
    : (event?.timing || '10:00 AM – 02:00 PM');

  const displayFee = activeEsportsData
    ? activeEsportsData.fee
    : event?.fee;

  const displayTeamSize = activeEsportsData
    ? activeEsportsData.teamSize
    : (event?.teamSize || event?.team_size);

  const displayFeeType = activeEsportsData
    ? activeEsportsData.feeType
    : (event?.feeType || event?.fee_type || 'per_head');

  const displayIsTeam = activeEsportsData
    ? activeEsportsData.isTeam
    : Boolean(event?.isTeam || event?.is_team);

  const displayMaxMembers = activeEsportsData
    ? 4
    : Number(event?.maxMembers || event?.max_members || (displayIsTeam ? 3 : 1));

  const staticFallbackCoords = getStaticFallbackCoordinators(event?.id, event);
  const allCoords = (Array.isArray(liveCoordinators) && liveCoordinators.length > 0)
    ? liveCoordinators
    : staticFallbackCoords;

  const [showMobileStickyBar, setShowMobileStickyBar] = useState(false);
  // ONLY show Lead Coordinators publicly on Event Details (Coordinators & Sub-Coordinators are visible only in internal Coordinator login)
  // For E-Sports (Battle of Champions), if an arena/game is selected (Free Fire vs BGMI), filter strictly to that game's coordinators
  const coordsList = allCoords.filter(c => {
    const roleStr = String(c.role || '').toLowerCase().trim();
    const isLead = !roleStr || roleStr.includes('lead');
    if (!isLead) return false;

    if (isEsports && selectedEsportsGame) {
      const gUpper = selectedEsportsGame.toUpperCase().trim();
      const cGame = String(c.game || '').toUpperCase().trim();
      if (!cGame) return true;
      if (cGame.includes('BOTH')) return true;
      if (gUpper.includes('FREE') || gUpper.includes('FIRE')) {
        return cGame.includes('FIRE') || cGame.includes('FREE');
      }
      if (gUpper.includes('BGMI')) {
        return cGame.includes('BGMI');
      }
      return cGame.includes(gUpper);
    }
    return true;
  });

  // Pre-filtered lists for the initial arena overview prompt
  const freeFireLeadCoords = isEsports ? allCoords.filter(c => {
    const roleStr = String(c.role || '').toLowerCase().trim();
    const isLead = !roleStr || roleStr.includes('lead');
    if (!isLead) return false;
    const cGame = String(c.game || '').toUpperCase().trim();
    return cGame.includes('FIRE') || cGame.includes('FREE') || cGame.includes('BOTH');
  }) : [];

  const bgmiLeadCoords = isEsports ? allCoords.filter(c => {
    const roleStr = String(c.role || '').toLowerCase().trim();
    const isLead = !roleStr || roleStr.includes('lead');
    if (!isLead) return false;
    const cGame = String(c.game || '').toUpperCase().trim();
    return cGame.includes('BGMI') || cGame.includes('BOTH');
  }) : [];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [eventId]);

  useEffect(() => {
    const handleScroll = () => {
      // In mobile view: show sticky bottom bar only when user scrolls down past the top nav
      if (window.scrollY > 85) {
        setShowMobileStickyBar(true);
      } else {
        setShowMobileStickyBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const eventSticker = getEventSticker(event);

  const handleRegister = () => {
    if (isRegClosed) return;
    if (onNavigate && event) {
      onNavigate('register', event.id);
    }
  };

  const handleSelectGame = (game) => {
    setSelectedEsportsGame(game);
    try {
      const hash = window.location.hash || '';
      const [baseHash, currentQuery] = hash.split('?');
      const params = new URLSearchParams(currentQuery || '');
      if (game) {
        params.set('game', game);
      } else {
        params.delete('game');
      }
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState(null, '', `${baseHash}${queryStr}`);
    } catch (_) {}

    // Smoothly scroll to the very top so user sees all details from the starting of the page
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRegisterGame = (game) => {
    if (isRegClosed) return;
    const targetGame = game || selectedEsportsGame;
    if (onNavigate && event) {
      onNavigate('register', { eventId: event.id, game: targetGame });
    }
  };

  const handleTopRegisterClick = () => {
    if (isRegClosed) return;
    if (isEsports) {
      if (!selectedEsportsGame) {
        toast('Please choose Free Fire or BGMI below to proceed', {
          icon: <FaGamepad style={{ color: '#38bdf8' }} />,
          style: {
            background: '#04140a',
            color: '#39FF88',
            border: '1px solid #39FF88',
            fontFamily: 'monospace'
          }
        });
        const el = document.getElementById('esports-game-selector');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      handleRegisterGame(selectedEsportsGame);
      return;
    }
    handleRegister();
  };

  const handleBackToEvents = () => {
    if (onNavigate) {
      onNavigate('events');
    }
  };

  if (loading || !event) {
    return (
      <div className="event-rules-page" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="events-loading-container"
          style={{ padding: '3rem 1.5rem', maxWidth: '480px' }}
        >
          {/* High-tech cyberpunk orbital radar loader */}
          <div className="cyber-loader-wrap">
            <motion.div
              className="cyber-orbit-ring-outer"
              animate={{ rotate: 360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="cyber-orbit-ring-inner"
              animate={{ rotate: -360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="cyber-loader-core"
              animate={{
                scale: [0.92, 1.08, 0.92],
                boxShadow: [
                  '0 0 15px rgba(57, 255, 136, 0.4)',
                  '0 0 28px rgba(0, 240, 255, 0.75)',
                  '0 0 15px rgba(57, 255, 136, 0.4)',
                ],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FaBolt className="cyber-loader-icon" />
            </motion.div>
          </div>

          <div className="cyber-loading-meta">
            <h4 className="cyber-loading-title">LOADING EVENT RULES</h4>
            <p className="cyber-loading-subtext">
              Please wait while we fetch the rules and details
              <span className="cyber-loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </p>
            <div className="cyber-loading-beam-wrap">
              <motion.div
                className="cyber-loading-beam"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="event-rules-page">
      <div className="event-rules-full-container">
        {/* Top Navigation & Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rules-clean-top-nav"
        >
          <button className="rules-back-btn" onClick={handleBackToEvents}>
            <FaArrowLeft style={{ marginRight: '0.45rem', verticalAlign: '-1px' }} />
            Back to Events
          </button>
          <button
            className="rules-register-top-btn"
            onClick={isRegClosed ? undefined : handleTopRegisterClick}
            disabled={isRegClosed}
            style={isRegClosed ? {
              background: 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              cursor: 'not-allowed',
              opacity: 0.9,
              boxShadow: 'none',
              transform: 'none'
            } : {}}
          >
            {isRegClosed ? (
              <>
                <FaLock style={{ marginRight: '0.45rem', verticalAlign: '-1px' }} /> Registrations Closed
              </>
            ) : (
              <>
                {isEsports && selectedEsportsGame ? `Register ${selectedEsportsGame}` : 'Register Now'}{' '}
                <FaArrowRight style={{ marginLeft: '0.45rem', verticalAlign: '-1px' }} />
              </>
            )}
          </button>
        </motion.div>

        {/* Main Title & Category Tag Header (Centered) */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rules-title-header-wrap rules-title-header-centered"
        >
          <div className="rules-category-tags-row">
            <span className="rules-category-tag">
              {event.category === 'technical' ? (
                <>
                  <FaBolt style={{ marginRight: '0.35rem' }} /> TECHNICAL EVENT
                </>
              ) : (
                <>
                  <FaGamepad style={{ marginRight: '0.35rem' }} /> NON-TECHNICAL EVENT
                </>
              )}
            </span>
            {event.tag && (
              <span className="rules-sub-tag-badge">{event.tag}</span>
            )}
            {isEsports && selectedEsportsGame && (
              <span
                className={`rules-sub-tag-badge ${selectedEsportsGame === 'FREE FIRE' ? 'tag-ff' : 'tag-bgmi'}`}
                style={{
                  background: selectedEsportsGame === 'FREE FIRE' ? 'rgba(255, 107, 0, 0.2)' : 'rgba(0, 210, 255, 0.2)',
                  color: selectedEsportsGame === 'FREE FIRE' ? '#ff9d42' : '#38bdf8',
                  borderColor: selectedEsportsGame === 'FREE FIRE' ? 'rgba(255, 107, 0, 0.5)' : 'rgba(0, 210, 255, 0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {selectedEsportsGame === 'FREE FIRE' ? (
                  <><FaFire style={{ color: '#ff9d42' }} /> FREE FIRE SQUAD</>
                ) : (
                  <><FaCrosshairs style={{ color: '#38bdf8' }} /> BGMI SQUAD</>
                )}
              </span>
            )}
          </div>
          <div className="rules-hero-title-row">
            <h1 className="rules-clean-main-title">
              {event.name}
              {isEsports && selectedEsportsGame && (
                <span
                  style={{
                    color: selectedEsportsGame === 'FREE FIRE' ? '#ff9d42' : '#38bdf8',
                    textShadow: selectedEsportsGame === 'FREE FIRE'
                      ? '0 0 24px rgba(255, 107, 0, 0.55)'
                      : '0 0 24px rgba(0, 210, 255, 0.55)',
                    marginLeft: '0.45rem'
                  }}
                >
                  : {selectedEsportsGame}
                </span>
              )}
            </h1>
            {eventSticker && (
              <div className="rules-hero-sticker-container" title={eventSticker.title}>
                <img
                  src={eventSticker.src}
                  alt={eventSticker.alt}
                  className="rules-hero-sticker-img"
                  style={{
                    '--rules-sticker-scale': eventSticker.scale || 1,
                    '--rules-sticker-origin': eventSticker.cropPosition === 'top' ? 'top center' : 'center center'
                  }}
                />
              </div>
            )}
          </div>
          <p className="rules-alias-sub">
            {isEsports && activeEsportsData
              ? `// ${activeEsportsData.tagline} • ${activeEsportsData.badge}`
              : (event.alias && event.alias.toLowerCase() !== event.name.toLowerCase() ? `// ${event.alias}` : '')}
          </p>
        </motion.div>

        {/* E-Sports Top Game Selector: Two Options initially, then ONLY the chosen one after selection */}
        {isEsports && (
          <motion.div
            id="esports-game-selector"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="esports-top-game-selector-container"
          >
            <div className="esports-selector-header-line">
              <span className="esports-selector-label">
                {selectedEsportsGame ? `ACTIVE ARENA: ${selectedEsportsGame}` : 'CHOOSE GAME TO REGISTER'}
              </span>
              <span className="esports-selector-divider-bar" />
            </div>

            <AnimatePresence mode="wait">
              {!selectedEsportsGame ? (
                /* Initially: Show BOTH options */
                <motion.div
                  key="both-options"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="esports-pills-row"
                >
                  <button
                    type="button"
                    className="esports-game-pill-btn"
                    onClick={() => handleSelectGame('FREE FIRE')}
                    id="btn-select-freefire"
                  >
                    <span className="esports-pill-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FaFire style={{ color: '#ff9d42' }} /> FREE FIRE
                    </span>
                    <FaArrowRight className="esports-pill-arrow" />
                  </button>

                  <button
                    type="button"
                    className="esports-game-pill-btn"
                    onClick={() => handleSelectGame('BGMI')}
                    id="btn-select-bgmi"
                  >
                    <span className="esports-pill-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FaCrosshairs style={{ color: '#38bdf8' }} /> BGMI
                    </span>
                    <FaArrowRight className="esports-pill-arrow" />
                  </button>
                </motion.div>
              ) : (
                /* After selection: Show ONLY the chosen option with quick change button */
                <motion.div
                  key={`selected-${selectedEsportsGame}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="esports-pills-row esports-selected-single-row"
                >
                  <div className={`esports-game-pill-btn is-active is-selected-single ${selectedEsportsGame === 'FREE FIRE' ? 'arena-selected-ff' : 'arena-selected-bgmi'}`}>
                    <span className="esports-pill-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {selectedEsportsGame === 'FREE FIRE' ? (
                        <><FaFire style={{ color: '#ff9d42' }} /> FREE FIRE</>
                      ) : (
                        <><FaCrosshairs style={{ color: '#38bdf8' }} /> BGMI</>
                      )}
                    </span>
                    <FaCheckCircle className="esports-pill-check" />
                  </div>

                  <button
                    type="button"
                    className="esports-change-game-btn"
                    onClick={() => handleSelectGame(null)}
                    id="btn-change-game"
                    title="Choose another game"
                  >
                    <FaRedoAlt className="esports-change-icon" />
                    <span>Change Arena</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* When in E-Sports and no game is chosen yet: Show interactive prompt with both arenas' details and coordinator preview */}
        {isEsports && !selectedEsportsGame && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="esports-select-prompt-card"
          >
            <div className="esports-prompt-icon-ring">
              <FaGamepad className="esports-prompt-icon" />
            </div>
            <h3 className="esports-prompt-title">SELECT YOUR ARENA TO VIEW DETAILS</h3>
            <p className="esports-prompt-desc">
              Choose either <strong>FREE FIRE</strong> or <strong>BGMI</strong> above to unlock event rules, map schedule, guidelines, and squad registration.
            </p>
            <div className="esports-prompt-tags">
              <span className="esports-prompt-tag"><FaUsers style={{ marginRight: '6px' }} /> 4-Player Squad Match</span>
              <span className="esports-prompt-tag"><FaMoneyBillWave style={{ marginRight: '6px' }} /> Flat ₹200 / Squad</span>
              <span className="esports-prompt-tag"><FaBolt style={{ marginRight: '6px' }} /> Custom Tournament Rooms</span>
            </div>

            {/* Side-by-Side Dual Arena Coordinator & Info Cards */}
            <div className="esports-prompt-arenas-grid">
              {/* Free Fire Arena Preview Card */}
              <div className="esports-arena-interactive-card arena-card-freefire">
                <div className="arena-card-topbar">
                  <span className="arena-track-badge ff-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FaFire style={{ color: '#ff9d42' }} /> Free Fire Arena
                  </span>
                  <span className="arena-price-badge">₹200 / Squad</span>
                </div>
                <div className="arena-card-info">
                  <h4 className="arena-card-heading">FREE FIRE SHOWDOWN</h4>
                  <p className="arena-card-summary">
                    Bermuda & Purgatory custom room matches. Mobile only with gun attributes turned OFF for fair play.
                  </p>
                </div>

                {freeFireLeadCoords.length > 0 && (
                  <div className="arena-coords-preview-box">
                    <div className="arena-coords-heading">
                      <span>Event Coordinators ({freeFireLeadCoords.length})</span>
                    </div>
                    <div className="arena-coords-list">
                      {freeFireLeadCoords.map((c, i) => (
                        <div key={i} className="arena-coord-row">
                          <div className="arena-coord-meta">
                            <span className="arena-coord-name">{c.name}</span>
                            <span className="arena-coord-sub">{c.role || 'Lead Coordinator'}</span>
                          </div>
                          <div className="arena-coord-actions">
                            <a
                              href={`tel:${c.phone}`}
                              className="arena-call-link"
                              title={`Call ${c.name}`}
                            >
                              <FaPhoneAlt size={10} style={{ marginRight: '5px' }} />
                              <span>{c.displayPhone || c.phone}</span>
                            </a>
                            {(c.whatsapp || c.phone) && (
                              <a
                                href={`https://wa.me/91${String(c.whatsapp || c.phone).replace(/\D/g, '').slice(-10)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="arena-wa-link"
                                title={`WhatsApp ${c.name}`}
                              >
                                <FaWhatsapp size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="arena-select-cta-btn ff-cta-btn"
                  onClick={() => handleSelectGame('FREE FIRE')}
                  id="btn-arena-select-freefire"
                >
                  <span>Select Free Fire Rules & Register</span>
                  <FaArrowRight size={11} style={{ marginLeft: '6px' }} />
                </button>
              </div>

              {/* BGMI Arena Preview Card */}
              <div className="esports-arena-interactive-card arena-card-bgmi">
                <div className="arena-card-topbar">
                  <span className="arena-track-badge bgmi-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FaCrosshairs style={{ color: '#38bdf8' }} /> BGMI Arena
                  </span>
                  <span className="arena-price-badge">₹200 / Squad</span>
                </div>
                <div className="arena-card-info">
                  <h4 className="arena-card-heading">BGMI CHAMPIONSHIP</h4>
                  <p className="arena-card-summary">
                    Erangel & Miramar tactical battlegrounds. TPP Squad rooms following the official BGIS points matrix.
                  </p>
                </div>

                {bgmiLeadCoords.length > 0 && (
                  <div className="arena-coords-preview-box">
                    <div className="arena-coords-heading">
                      <span>Event Coordinators ({bgmiLeadCoords.length})</span>
                    </div>
                    <div className="arena-coords-list">
                      {bgmiLeadCoords.map((c, i) => (
                        <div key={i} className="arena-coord-row">
                          <div className="arena-coord-meta">
                            <span className="arena-coord-name">{c.name}</span>
                            <span className="arena-coord-sub">{c.role || 'Lead Coordinator'}</span>
                          </div>
                          <div className="arena-coord-actions">
                            <a
                              href={`tel:${c.phone}`}
                              className="arena-call-link"
                              title={`Call ${c.name}`}
                            >
                              <FaPhoneAlt size={10} style={{ marginRight: '5px' }} />
                              <span>{c.displayPhone || c.phone}</span>
                            </a>
                            {(c.whatsapp || c.phone) && (
                              <a
                                href={`https://wa.me/91${String(c.whatsapp || c.phone).replace(/\D/g, '').slice(-10)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="arena-wa-link"
                                title={`WhatsApp ${c.name}`}
                              >
                                <FaWhatsapp size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="arena-select-cta-btn bgmi-cta-btn"
                  onClick={() => handleSelectGame('BGMI')}
                  id="btn-arena-select-bgmi"
                >
                  <span>Select BGMI Rules & Register</span>
                  <FaArrowRight size={11} style={{ marginLeft: '6px' }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Animated Details: Shown when standard event OR once an E-Sports game is selected */}
        <AnimatePresence mode="wait">
          {(!isEsports || selectedEsportsGame) && (
            <motion.div
              key={isEsports ? selectedEsportsGame : 'event-content'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="rules-details-animated-wrapper"
            >
              {/* 2-Column Split: Overview (Left) & Rules (Right) */}
              <div className="rules-split-grid">
                {/* Left Side: Overview Stack (4 Small Boxes + 1 Long Diagonal Card) */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="rules-left-overview-stack"
                >
                  {/* 4 Small Detail Boxes Grid */}
                  <div className="rules-overview-quad-grid">
                    {/* Box 1: Venue */}
                    <div
                      className="rules-overview-box rules-overview-box-venue rules-overview-box-clickable"
                      onClick={() => setShowVenueModal(true)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setShowVenueModal(true);
                        }
                      }}
                      title="Click to view venue picture"
                    >
                      <div className="rules-box-top">
                        <span className="rules-box-icon"><FaBuilding /></span>
                        <span className="rules-box-label">VENUE</span>
                        <span className="rules-box-corner-indicator" title="Click to view picture"><FaExternalLinkAlt style={{ fontSize: '0.75rem' }} /></span>
                      </div>
                      <div className="rules-box-value">{displayVenue}</div>
                      <span className="rules-box-subhint">Click to view photo</span>
                    </div>

                    {/* Box 2: Timing */}
                    <div className="rules-overview-box">
                      <div className="rules-box-top">
                        <span className="rules-box-icon"><FaClock /></span>
                        <span className="rules-box-label">TIMING</span>
                      </div>
                      <div className="rules-box-value">{displayTiming}</div>
                      <span className="rules-box-subhint">Reporting: 15 mins prior</span>
                    </div>

                    {/* Box 3: Registration Fee */}
                    <div className="rules-overview-box">
                      <div className="rules-box-top">
                        <span className="rules-box-icon"><FaMoneyBillWave /></span>
                        <span className="rules-box-label">REGISTRATION FEE</span>
                      </div>
                      <div className="rules-box-value fee-highlight">{displayFee}</div>
                      <span className="rules-box-subhint">
                        {displayFeeType === 'per_head' ? 'Per participant' : 'Per team / squad'}
                      </span>
                    </div>

                    {/* Box 4: Members / Team Size */}
                    <div className="rules-overview-box">
                      <div className="rules-box-top">
                        <span className="rules-box-icon"><FaUsers /></span>
                        <span className="rules-box-label">MEMBERS</span>
                      </div>
                      <div className="rules-box-value">
                        {displayTeamSize || (displayIsTeam ? `Max ${displayMaxMembers} Members` : 'Individual')}
                      </div>
                      <span className="rules-box-subhint">
                        {displayIsTeam
                          ? (displayMaxMembers > 1 ? `Team (Max ${displayMaxMembers} members)` : 'Team competition')
                          : 'Solo entry'}
                      </span>
                    </div>
                  </div>

                  {/* One Long Diagonal Card for Description */}
                  <div className="rules-desc-diagonal-card">
                    <div className="diagonal-card-header">
                      <div className="diagonal-card-badge">
                        <span className="diagonal-badge-dot" />
                        <span>OVERVIEW & BRIEF</span>
                      </div>
                      <span className="diagonal-cut-corner-decor" />
                    </div>
                    <div className="diagonal-card-content">
                      <p className="diagonal-desc-text">
                        {displayDescription}
                      </p>
                      {((activeEsportsData && Array.isArray(activeEsportsData.highlights)) || (event && Array.isArray(event.highlights) && event.highlights.length > 0)) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.85rem', marginBottom: '0.5rem' }}>
                          {(activeEsportsData?.highlights || event.highlights).map((hl, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '12px',
                                background: isEsports && selectedEsportsGame === 'FREE FIRE'
                                  ? 'rgba(255, 107, 0, 0.15)'
                                  : (isEsports && selectedEsportsGame === 'BGMI'
                                      ? 'rgba(0, 210, 255, 0.15)'
                                      : 'rgba(57, 255, 136, 0.12)'),
                                color: isEsports && selectedEsportsGame === 'FREE FIRE'
                                  ? '#ff9d42'
                                  : (isEsports && selectedEsportsGame === 'BGMI'
                                      ? '#38bdf8'
                                      : '#39FF88'),
                                border: `1px solid ${
                                  isEsports && selectedEsportsGame === 'FREE FIRE'
                                    ? 'rgba(255, 107, 0, 0.35)'
                                    : (isEsports && selectedEsportsGame === 'BGMI'
                                        ? 'rgba(0, 210, 255, 0.35)'
                                        : 'rgba(57, 255, 136, 0.25)')
                                }`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <FaBolt style={{ fontSize: '0.68rem' }} /> {hl}
                            </span>
                          ))}
                        </div>
                      )}
                      {displaySubtitle && (
                        <div className="rules-subtitle-banner">
                          <span><FaStar style={{ marginRight: '0.35rem', fontSize: '0.75rem' }} /> {displaySubtitle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Right Side: Separate Rules Card and Coordinator Contact Card */}
                <div className="rules-right-stack">
                  {/* Card 1: Rules & Guidelines */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="rules-card-glass rules-right-rules-card"
                  >
                    <div className="rules-card-header">
                      <h2 className="rules-card-title">
                        <FaListOl className="rules-card-icon" /> Rules & Guidelines
                      </h2>
                      {rulesList.length > 0 && (
                        <span className="rules-count-badge">{rulesList.length} Rules</span>
                      )}
                    </div>

                    {rulesList.length > 0 ? (
                      <ol className="rules-unified-list">
                        {rulesList.map((rule, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 + idx * 0.03 }}
                            className="rules-unified-item"
                          >
                            <span className="rules-item-index">{String(idx + 1).padStart(2, '0')}.</span>
                            <span className="rules-item-text">{rule}</span>
                          </motion.li>
                        ))}
                      </ol>
                    ) : (
                      <p className="rules-empty-text">Standard event guidelines apply. Contact event coordinators for details.</p>
                    )}
                  </motion.div>

                  {/* Round Structure (if provided) */}
                  {rounds.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="rules-card-glass rules-rounds-card"
                    >
                      <div className="rules-card-header">
                        <h2 className="rules-card-title">
                          <FaLayerGroup className="rules-card-icon" /> Round Structure
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="rules-count-badge">{rounds.length} Rounds</span>
                        </div>
                      </div>
                      <div className="rules-rounds-grid">
                        {rounds.map((rnd, i) => {
                          const isObj = typeof rnd === 'object' && rnd !== null;
                          const roundTitle = isObj
                            ? (rnd.name || rnd.title || `Round ${i + 1}`)
                            : (typeof rnd === 'string' && rnd.includes(':') ? rnd.split(':')[0].trim() : (rnd || `Round ${i + 1}`));
                          const roundTime = isObj
                            ? (rnd.time || rnd.duration || '')
                            : '';
                          const roundDesc = isObj
                            ? (rnd.desc || rnd.description || '')
                            : (typeof rnd === 'string' && rnd.includes(':') ? rnd.substring(rnd.indexOf(':') + 1).trim() : '');

                          return (
                            <div key={i} className="rules-round-card">
                              <div className="rules-round-header">
                                <span className="rules-round-num">
                                  {isObj && rnd.round ? rnd.round.toUpperCase() : `ROUND ${i + 1}`}
                                </span>
                                {roundTime && <span className="rules-round-time">{roundTime}</span>}
                              </div>
                              <h4 className="rules-round-title">{roundTitle}</h4>
                              {roundDesc && <p className="rules-round-desc">{roundDesc}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Card 2: Event Coordinators & Contact (Separate Card) */}
                  {coordsList.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.25 }}
                      className="rules-card-glass rules-coords-card"
                    >
                      <div className="rules-card-header">
                        <h2 className="rules-card-title">
                          <FaHeadset className="rules-card-icon" />{' '}
                          {isEsports && selectedEsportsGame ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              {selectedEsportsGame === 'FREE FIRE' ? (
                                <><FaFire style={{ color: '#ff9d42' }} /> Free Fire</>
                              ) : (
                                <><FaCrosshairs style={{ color: '#38bdf8' }} /> BGMI</>
                              )}{' '}
                              Coordinators & Contact
                            </span>
                          ) : (
                            'Event Coordinators & Contact'
                          )}
                        </h2>
                        <span className="rules-count-badge">
                          {coordsList.length} Lead Coordinator{coordsList.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="rules-coords-grid">
                        {coordsList.map((coord, idx) => (
                          <div key={idx} className="rules-embedded-coord-chip">
                            <div className="coord-chip-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                                <span className="coord-chip-badge">{coord.role || 'Lead Coordinator'}</span>
                                {coord.game && (
                                  <span
                                    className={`rules-coord-game-pill ${
                                      coord.game.toLowerCase().includes('fire') ? 'pill-ff' : 'pill-bgmi'
                                    }`}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    {coord.game.toLowerCase().includes('fire') ? (
                                      <><FaFire style={{ color: '#ff9d42' }} /> Free Fire</>
                                    ) : (
                                      <><FaCrosshairs style={{ color: '#38bdf8' }} /> BGMI</>
                                    )}
                                  </span>
                                )}
                              </div>
                              <h4 className="coord-chip-name">{coord.name}</h4>
                            </div>
                            <div className="coord-chip-actions-group">
                              <a
                                href={`tel:${coord.phone}`}
                                className="coord-chip-call-btn"
                                title={`Call ${coord.name}`}
                              >
                                <FaPhoneAlt size={11} style={{ marginRight: '5px' }} />
                                <span>{coord.displayPhone || coord.phone}</span>
                              </a>
                              {(coord.whatsapp || coord.phone) && (
                                <a
                                  href={`https://wa.me/91${String(coord.whatsapp || coord.phone).replace(/\D/g, '').slice(-10)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="coord-chip-wa-btn"
                                  title={`WhatsApp ${coord.name}`}
                                >
                                  <FaWhatsapp size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Bottom Primary Register CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="rules-bottom-cta-section"
              >
                <div className="overview-card-cta-wrap">
                  <button
                    type="button"
                    className={`btn btn-primary btn-full-width btn-rules-main-register esports-selected-register-btn ${
                      isEsports && selectedEsportsGame === 'FREE FIRE'
                        ? 'esports-ff-active'
                        : (isEsports && selectedEsportsGame === 'BGMI' ? 'esports-bgmi-active' : '')
                    }`}
                    onClick={isRegClosed ? undefined : () => (isEsports ? handleRegisterGame(selectedEsportsGame) : handleRegister())}
                    disabled={isRegClosed}
                    id={isEsports ? `btn-register-${selectedEsportsGame === 'BGMI' ? 'bgmi' : 'freefire'}` : 'btn-register-event'}
                    style={isRegClosed ? {
                      background: 'linear-gradient(135deg, #7f1d1d, #451a1a)',
                      borderColor: '#ef4444',
                      color: '#fca5a5',
                      cursor: 'not-allowed',
                      boxShadow: 'none',
                      transform: 'none',
                      opacity: 0.95
                    } : {}}
                  >
                    {isRegClosed ? (
                      <>
                        <FaLock style={{ marginRight: '0.4rem' }} /> REGISTRATIONS CLOSED
                      </>
                    ) : (
                      <>
                        {isEsports && selectedEsportsGame
                          ? `REGISTER SQUAD FOR ${selectedEsportsGame}`
                          : 'REGISTER FOR THIS EVENT'}{' '}
                        <FaArrowRight style={{ marginLeft: '0.45rem' }} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sticky Action Bar - Appears when scrolling down */}
      <div className={`rules-mobile-sticky-bar ${showMobileStickyBar ? 'is-visible' : ''}`}>
        <button className="rules-mobile-back-btn" onClick={handleBackToEvents}>
          <FaArrowLeft style={{ marginRight: '0.45rem', verticalAlign: '-1px' }} /> Back
        </button>
        <button
          className="rules-mobile-register-btn"
          onClick={isRegClosed ? undefined : handleTopRegisterClick}
          disabled={isRegClosed}
          style={isRegClosed ? {
            background: 'linear-gradient(135deg, #7f1d1d, #451a1a)',
            borderColor: '#ef4444',
            color: '#fca5a5',
            cursor: 'not-allowed',
            boxShadow: 'none'
          } : {}}
        >
          {isRegClosed ? 'Closed' : (
            <>
              {isEsports && selectedEsportsGame ? `Register ${selectedEsportsGame}` : 'Register Now'}{' '}
              <FaArrowRight style={{ marginLeft: '0.45rem', verticalAlign: '-1px' }} />
            </>
          )}
        </button>
      </div>

      {/* Venue Photo Popup Modal */}
      <VenueImageModal
        isOpen={showVenueModal}
        onClose={() => setShowVenueModal(false)}
        event={event}
      />
    </div>
  );
}
