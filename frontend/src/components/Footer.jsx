import { useState, useRef, useEffect } from 'react';
import { FaBolt, FaGamepad, FaCompass, FaInstagram, FaRegEnvelope } from 'react-icons/fa';
import logoImg from '../assets/logo.png';
import staticEvents from '../data/events.js';
import { getCachedEvents, fetchEventsData } from '../services/api.js';

const isExcludedEvent = (e) => {
  if (!e) return true;
  const name = String(e.name || '').toLowerCase();
  const alias = String(e.alias || '').toLowerCase();
  return (
    e.id === 'tech-07' ||
    name.includes('chart canvas') ||
    alias.includes('chart canvas') ||
    name.includes('roborange') ||
    alias.includes('roborange')
  );
};

export default function Footer({ onNavigate }) {
  const [clickCount, setClickCount] = useState(0);
  const timerRef = useRef(null);
  const [eventList, setEventList] = useState(() => {
    const cached = getCachedEvents();
    if (Array.isArray(cached) && cached.length > 0) {
      return cached.filter((e) => !isExcludedEvent(e));
    }
    return staticEvents;
  });

  useEffect(() => {
    let isMounted = true;
    const cached = getCachedEvents();
    if (Array.isArray(cached) && cached.length > 0) {
      setEventList(cached.filter((e) => !isExcludedEvent(e)));
    }
    fetchEventsData()
      .then((events) => {
        if (isMounted && Array.isArray(events) && events.length > 0) {
          setEventList(events.filter((e) => !isExcludedEvent(e)));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTripleClick = () => {
    setClickCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        clearTimeout(timerRef.current);
        window.location.href = '/admin';
        return 0;
      }
      return newCount;
    });

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 1000);
  };

  const handleNav = (page, extra = null) => {
    if (onNavigate) {
      onNavigate(page, extra);
    } else {
      if (typeof extra === 'string') {
        document.getElementById(extra)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const techEvents = eventList.filter((e) => e.category === 'technical' && !isExcludedEvent(e));
  const nonTechEvents = eventList.filter((e) => e.category === 'non-technical' && !isExcludedEvent(e));

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Col 1: Brand */}
        <div className="footer-brand">
          <a
            className="footer-logo-container"
            href="#hero"
            onClick={(event) => {
              event.preventDefault();
              handleNav('home', 'hero');
            }}
            aria-label="Return to ELOQUENCE 26 home"
          >
            <img src={logoImg} alt="ELOQUENCE 26" className="footer-logo-img" />
          </a>
          <p className="footer-tagline">THE COUNTDOWN BEGINS.</p>
          <p className="footer-desc">
            Where Ideas Collide. Skills Survive. Legends Emerge.
          </p>
        </div>

        {/* Col 2: Technical Events */}
        <div className="footer-col">
          <h4 className="footer-heading">
            <FaBolt style={{ marginRight: '0.4rem', color: 'var(--bright-green)', verticalAlign: '-1px' }} />
            TECHNICAL
          </h4>
          <ul className="footer-event-list">
            {techEvents.map((event) => (
              <li key={event.id}>
                <a
                  href={`#/events/${event.id}`}
                  title={event.name}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav('event-rules', event.id);
                  }}
                >
                  {event.alias || event.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Non-Technical Events */}
        <div className="footer-col">
          <h4 className="footer-heading">
            <FaGamepad style={{ marginRight: '0.4rem', color: 'var(--bright-green)', verticalAlign: '-1px' }} />
            NON-TECHNICAL
          </h4>
          <ul className="footer-event-list">
            {nonTechEvents.map((event) => (
              <li key={event.id}>
                <a
                  href={`#/events/${event.id}`}
                  title={event.name}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav('event-rules', event.id);
                  }}
                >
                  {event.alias || event.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Quick Navigation */}
        <div className="footer-col">
          <h4 className="footer-heading">
            <FaCompass style={{ marginRight: '0.4rem', color: 'var(--bright-green)', verticalAlign: '-1px' }} />
            NAVIGATION
          </h4>
          <ul className="footer-nav-list">
            <li>
              <a
                href="#hero"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('home', 'hero');
                }}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#/events"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('events');
                }}
              >
                All Events
              </a>
            </li>
            <li>
              <a
                href="#intro"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('home', 'intro');
                }}
              >
                About Fest
              </a>
            </li>
            <li>
              <a
                href="#patrons"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('home', 'patrons');
                }}
              >
                Patrons
              </a>
            </li>
            <li>
              <a
                href="#location"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('home', 'location');
                }}
              >
                Location
              </a>
            </li>
          </ul>

          {/* Social / Connect Details under Navigation */}
          <div className="footer-connect-section">
            <h5 className="footer-connect-heading">CONNECT WITH US</h5>
            <div className="footer-social-icons-row">
              <a
                href="https://www.instagram.com/eloquence.26?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon-btn footer-instagram-btn"
                aria-label="Follow ELOQUENCE'26 on Instagram"
                title="Instagram: @eloquence.26"
              >
                <FaInstagram className="footer-social-svg" />
              </a>
              <a
                href="mailto:eloquence2k26@gmail.com"
                className="footer-social-icon-btn footer-email-btn"
                aria-label="Email ELOQUENCE'26"
                title="Email: eloquence2k26@gmail.com"
              >
                <FaRegEnvelope className="footer-social-svg" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p
          onClick={handleTripleClick}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="Triple click to open admin login"
        >
          © 2026 ELOQUENCE26 — C. Abdul Hakeem College of Engineering and Technology. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
