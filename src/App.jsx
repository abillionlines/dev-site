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

function HomePage() {
  const nextSectionRef = useRef(null);
  const [isPageAtTop, setIsPageAtTop] = useState(true);

  useEffect(() => {
    const syncTopState = () => {
      setIsPageAtTop(window.scrollY <= 1);
    };

    syncTopState();
    window.addEventListener("scroll", syncTopState, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncTopState);
    };
  }, []);

  const handleHeroFullyZoomedOut = useCallback(() => {
    if (!isPageAtTop) {
      return;
    }

    nextSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [isPageAtTop]);

  return (
    <main className="page-shell home-page">
      <Hero3D
        onFullyZoomedOut={handleHeroFullyZoomedOut}
        isScrollEffectsEnabled={isPageAtTop}
      />
      <section
        ref={nextSectionRef}
        className="home-next-section"
        aria-label="Next section"
      />
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

function AboutMePage() {
  return (
    <main className="page-shell about-page">
      <h1>About Me</h1>
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
        <div className="top-nav-left">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
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
                onClick={handleSignOut}
              >
                Log Out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="nav-link nav-link-button auth-action"
              onClick={() => openAuthModal("login")}
            >
              Log In / Sign Up
            </button>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/synth"
          element={user ? <SynthPage /> : <Navigate to="/" replace />}
        />
        <Route path="/about-me" element={<AboutMePage />} />
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
    </div>
  );
}
