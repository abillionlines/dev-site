import { useCallback, useEffect, useRef, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Hero3D from "./components/Hero3D/Hero3D";
import GrainForge from "./components/GrainForge/GrainForge";
import { hasSupabaseConfig, supabase } from "./lib/supabaseClient";
import { FaGithub, FaImdb, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import lakewaterVideo from "./assets/lakewater2.mov";

function HomePage() {
  const nextSectionRef = useRef(null);
  const [isPageAtTop, setIsPageAtTop] = useState(true);
  const [heroZoomDone, setHeroZoomDone] = useState(false);
  const [sectionInView, setSectionInView] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => window.innerWidth <= 670,
  );

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= 670);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const syncTopState = () => {
      const atTop = window.scrollY <= 1;
      setIsPageAtTop(atTop);
      if (atTop) {
        setHeroZoomDone(false);
      }
    };

    syncTopState();
    window.addEventListener("scroll", syncTopState, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncTopState);
    };
  }, []);

  const heroZoomActive = !isMobileViewport && isPageAtTop && !heroZoomDone;

  // Lock body scroll while hero zoom is active
  useEffect(() => {
    if (heroZoomActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [heroZoomActive]);

  // Scroll to next section once zoom completes
  useEffect(() => {
    if (heroZoomDone) {
      nextSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [heroZoomDone]);

  const handleHeroFullyZoomedOut = useCallback(() => {
    setHeroZoomDone(true);
  }, []);

  useEffect(() => {
    const node = nextSectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setSectionInView(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="page-shell home-page">
      <Hero3D
        onFullyZoomedOut={handleHeroFullyZoomedOut}
        isScrollEffectsEnabled={heroZoomActive}
        isMobile={isMobileViewport}
      />
      <section
        ref={nextSectionRef}
        className={`home-next-section${sectionInView ? " in-view" : ""}`}
        aria-label="Next section"
      >
        <video
          className="section-bg-video"
          src={lakewaterVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="section-bg-overlay" />
        <div className="section-content">
          <h2
            style={{
              fontFamily: "Lexend, sans-serif",
              fontWeight: 600,
              fontSize: "2rem",
              marginBottom: "1.2rem",
              color: "#f6f8ff",
            }}
          >
            How&apos;d he do it?
          </h2>
          <p
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "1.08rem",
              color: "#e6eaf7",
              lineHeight: 1.7,
            }}
          >
            This project is a mobile-responsive React single-page application
            built with Vite. It combines a 3D landing experience powered by
            @react-three/fiber and drei with a routed portfolio structure that
            includes Home, About Me, Contact, and a gated synth page called
            GrainForge. The hero uses custom camera motion, layered overlays,
            linked social icons, and video-backed content sections to create a
            more immersive first impression than a standard portfolio layout.
            <br />
            <br />
            Supabase handles both authentication and data flow. Logged-in users
            can access the synth experience, while the contact page submits form
            entries directly into a Supabase table using the existing client
            integration, client-side validation, and a basic honeypot spam
            check. Auth state, modal flows, and protected routing are all
            managed with React hooks and React Router.
            <br />
            <br />
            The codebase is organized by feature, with colocated components,
            assets, and styles for maintainability. It leans on functional React
            patterns, semantic HTML, accessible labels, custom typography, and
            responsive layout rules tuned for desktop and mobile. Together, the
            app shows interactive 3D UI work, frontend architecture, Supabase
            integration, and polished presentation in one build.
            <br />
            <br />
            Key challenges solved include robust mobile responsiveness,
            scroll-lock and animation state management, protected routes,
            modular 3D scene logic, and full-stack form handling through
            Supabase. The result is a portfolio that functions as both a resume
            piece and a working product.
          </p>
        </div>
      </section>
    </main>
  );
}

function SynthPage() {
  return (
    <main className="page-shell">
      <GrainForge />
    </main>
  );
}

// ...existing code...
function AboutMePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="page-shell about-page">
      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "40vh",
          }}
        >
          <div
            className="simple-loader"
            style={{
              width: 48,
              height: 48,
              border: "5px solid #e0e0e0",
              borderTop: "5px solid #7f8694",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <span
            style={{
              marginTop: 16,
              color: "#7f8694",
              fontFamily: "Lexend, sans-serif",
              fontSize: 18,
            }}
          >
            Loading...
          </span>
        </div>
      ) : (
        <>
          <h1 className="about-page-title">About Me</h1>
          <div className="about-me-text">
            <p>
              My path into software has been shaped by a long career in music,
              live performance, audio engineering, and creative work. Before I
              started building web applications, I spent years learning how to
              solve problems in real time, communicate clearly with all kinds of
              people, and keep working on something until it was both effective
              and meaningful. That experience still shapes the way I approach
              technology today.
            </p>
            <p>
              Over the last decade, I&apos;ve performed nearly 3,000 live shows,
              produced and engineered close to 100 songs, and had music placed
              on FOX, Netflix, Hulu, and BYUtv. Working in those environments
              taught me discipline, adaptability, and a deep respect for craft.
              Whether I was managing a live room, shaping a recording, or
              collaborating with clients, I was always trying to create an
              experience that felt intentional and connected with people.
            </p>
            <p>
              That same mindset is what drew me to software. I enjoy building
              digital experiences that are clear, useful, and thoughtfully
              designed. I work primarily with JavaScript, React, HTML, CSS, and
              modern web tools, and I like the process of taking an idea from
              rough concept to polished interface. I&apos;m especially
              interested in the place where creativity and structure meet, where
              good design, strong logic, and attention to detail all matter at
              once.
            </p>
            <p>
              What I value most in any kind of work is the chance to keep
              learning, keep improving, and contribute something real. I bring a
              mix of technical curiosity, creative instinct, and professional
              resilience that comes from years of working independently,
              collaborating with others, and staying committed to long-term
              growth.
            </p>
            <p>
              At the core, I&apos;m someone who likes building things, solving
              problems, and making experiences better for the people on the
              other side of them. Whether that&apos;s through music, technology,
              or another creative challenge, that&apos;s the work that motivates
              me.
            </p>
          </div>
          <div className="about-social-icons">
            <a
              className="hero-social-icon"
              aria-label="LinkedIn"
              href="https://www.linkedin.com/in/brianwilkinsoninc/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedinIn />
            </a>
            <a
              className="hero-social-icon"
              aria-label="Instagram"
              href="https://www.instagram.com/brianwilkinsonmusic/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
            <a
              className="hero-social-icon"
              aria-label="GitHub"
              href="https://github.com/abillionlines"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub />
            </a>
            <a
              className="hero-social-icon"
              aria-label="Email"
              href="mailto:brian@brianwilkinson.net"
            >
              <MdEmail />
            </a>
            <a
              className="hero-social-icon"
              aria-label="IMDb"
              href="https://www.imdb.com/name/nm18333965/?ref_=fn_t_13"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaImdb />
            </a>
          </div>
        </>
      )}
    </main>
  );
}

function ContactPage() {
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (company) {
      return;
    }

    if (!supabase || !hasSupabaseConfig) {
      setSubmitError(
        "Supabase is not configured yet. Add VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY to your environment.",
      );
      setSubmitNotice("");
      return;
    }

    if (!name.trim() || !contactEmail.trim() || !message.trim()) {
      setSubmitError("Please fill out all fields.");
      setSubmitNotice("");
      return;
    }

    if (message.trim().length < 10) {
      setSubmitError("Please enter a more detailed message.");
      setSubmitNotice("");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitNotice("");

    const { error } = await supabase.from("contact_messages").insert([
      {
        name: name.trim(),
        email: contactEmail.trim(),
        message: message.trim(),
      },
    ]);

    if (error) {
      setSubmitError(
        error.message ?? "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
      return;
    }

    setName("");
    setContactEmail("");
    setMessage("");
    setSubmitNotice("Message sent. I'll get back to you soon.");
    setIsSubmitting(false);
  };

  return (
    <main className="page-shell contact-page">
      <section className="contact-panel">
        <h1 className="contact-page-title">Contact</h1>
        <p className="contact-page-intro">
          Have a project, role, collaboration, or question in mind? Send a
          message here and it will go directly into my Supabase contact inbox.
        </p>
        <form className="contact-form" onSubmit={handleContactSubmit}>
          <input
            className="contact-honeypot"
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={7}
              required
            />
          </label>
          {submitError ? <p className="contact-error">{submitError}</p> : null}
          {submitNotice ? (
            <p className="contact-notice">{submitNotice}</p>
          ) : null}
          <button
            type="submit"
            className="contact-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const isHomeRoute = location.pathname === "/";
  const [user, setUser] = useState(null);
  const [isSynthGateModalOpen, setIsSynthGateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted || error) {
        return;
      }

      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = useCallback((mode = "login") => {
    setAuthMode(mode);
    setAuthError("");
    setAuthNotice("");
    setIsAuthModalOpen(true);
  }, []);

  const openSynthGateModal = useCallback(() => {
    setIsSynthGateModalOpen(true);
  }, []);

  const closeSynthGateModal = useCallback(() => {
    setIsSynthGateModalOpen(false);
  }, []);

  const handleOpenAuthFromSynthGate = useCallback(() => {
    setIsSynthGateModalOpen(false);
    openAuthModal("login");
  }, [openAuthModal]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError("");
    setAuthNotice("");
    setPassword("");
  }, []);

  const handleAuthSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!supabase || !hasSupabaseConfig) {
        setAuthError(
          "Supabase is not configured yet. Add VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY to your environment.",
        );
        return;
      }

      setIsAuthLoading(true);
      setAuthError("");
      setAuthNotice("");

      try {
        if (authMode === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          if (!data.session) {
            setAuthNotice(
              "Check your email to confirm your account, then log in.",
            );
            return;
          }

          closeAuthModal();
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        closeAuthModal();
      } catch (error) {
        setAuthError(error.message ?? "Authentication failed.");
      } finally {
        setIsAuthLoading(false);
      }
    },
    [authMode, closeAuthModal, email, password],
  );

  const handleSignOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message ?? "Unable to sign out.");
      return;
    }

    setAuthNotice("");
    setEmail("");
    setPassword("");
  }, []);

  return (
    <div className={`app-shell${isHomeRoute ? " home-route" : ""}`}>
      <header className="top-nav">
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>
        <div className={`nav-menu${isMobileMenuOpen ? " nav-menu-open" : ""}`}>
          <div className="top-nav-left">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            {user ? (
              <NavLink
                to="/synth"
                className={({ isActive }) =>
                  `nav-link synth-link-unlocked${isActive ? " active" : ""}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Synth
              </NavLink>
            ) : (
              <button
                type="button"
                className="nav-link nav-link-button synth-link-locked"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openSynthGateModal();
                }}
              >
                Synth
              </button>
            )}
            <NavLink
              to="/about-me"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About Me
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </NavLink>
          </div>

          <div className="top-nav-right">
            {user ? (
              <>
                <span className="auth-user" title={user.email ?? "Signed in"}>
                  {user.email ?? "Signed in"}
                </span>
                <button
                  type="button"
                  className="nav-link nav-link-button auth-action"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <button
                type="button"
                className="nav-link nav-link-button auth-action"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal("login");
                }}
              >
                Log In / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/synth"
          element={user ? <SynthPage /> : <Navigate to="/" replace />}
        />
        <Route path="/about-me" element={<AboutMePage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>

      {isSynthGateModalOpen ? (
        <div className="auth-modal-overlay" onClick={closeSynthGateModal}>
          <div
            className="auth-modal synth-gate-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Synth access required"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="auth-close"
              onClick={closeSynthGateModal}
              aria-label="Close synth access modal"
            >
              x
            </button>
            <h2>Synth Requires Login</h2>
            <p className="synth-gate-message">
              You need to log in to make music in Synth.
            </p>
            <button
              type="button"
              className="auth-submit"
              onClick={handleOpenAuthFromSynthGate}
            >
              Log In / Create Account
            </button>
          </div>
        </div>
      ) : null}

      {isAuthModalOpen ? (
        <div className="auth-modal-overlay" onClick={closeAuthModal}>
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Authentication"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="auth-close"
              onClick={closeAuthModal}
              aria-label="Close authentication modal"
            >
              x
            </button>
            <h2>{authMode === "login" ? "Log In" : "Sign Up"}</h2>
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </label>
              {authError ? <p className="auth-error">{authError}</p> : null}
              {authNotice ? <p className="auth-notice">{authNotice}</p> : null}
              <button
                type="submit"
                className="auth-submit"
                disabled={isAuthLoading}
              >
                {isAuthLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Log In"
                    : "Create Account"}
              </button>
            </form>
            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setAuthMode((current) =>
                  current === "login" ? "signup" : "login",
                );
                setAuthError("");
                setAuthNotice("");
              }}
            >
              {authMode === "login"
                ? "Need an account? Sign up"
                : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      ) : null}

      <footer className="site-footer">
        <div className="footer-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Home
          </NavLink>
          {user ? (
            <NavLink
              to="/synth"
              className={({ isActive }) =>
                `nav-link synth-link-unlocked${isActive ? " active" : ""}`
              }
            >
              Synth
            </NavLink>
          ) : (
            <button
              type="button"
              className="nav-link nav-link-button synth-link-locked"
              onClick={openSynthGateModal}
            >
              Synth
            </button>
          )}
          <NavLink
            to="/about-me"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            About Me
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Contact
          </NavLink>
        </div>
        <p className="footer-copyright">&copy; Wing Shot Devs</p>
      </footer>
    </div>
  );
}
