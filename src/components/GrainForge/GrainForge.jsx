import { useEffect, useRef, useState, useCallback } from "react";
import "./GrainForge.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createReverb(ctx, seconds = 2.5) {
  const convolver = ctx.createConvolver();
  const rate = ctx.sampleRate;
  const length = rate * seconds;
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  convolver.buffer = impulse;
  return convolver;
}

function noteToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

const NOTES = [
  { label: "C4", midi: 60, key: "a" },
  { label: "D4", midi: 62, key: "s" },
  { label: "E4", midi: 64, key: "d" },
  { label: "F4", midi: 65, key: "f" },
  { label: "G4", midi: 67, key: "g" },
  { label: "A4", midi: 69, key: "h" },
  { label: "B4", midi: 71, key: "j" },
  { label: "C5", midi: 72, key: "k" },
];

// ---------------------------------------------------------------------------
// Knob — defined outside GrainForge to avoid "created during render" error
// ---------------------------------------------------------------------------
function Knob({ label, value, min, max, step = 0.01, onChange, display }) {
  return (
    <div className="gf-knob-wrapper">
      <div className="gf-knob-top">
        <label className="gf-knob-label">{label}</label>
        <span className="gf-knob-value">{display ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="gf-knob-slider"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// GrainForge — fully self-contained, drop anywhere
// ---------------------------------------------------------------------------
export default function GrainForge() {
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const filterRef = useRef(null);
  const reverbRef = useRef(null);
  const reverbGainRef = useRef(null);
  const dryGainRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const activeGrainsRef = useRef([]);
  const activeNotesRef = useRef(new Set());
  const grainIntervalRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [activeKeys, setActiveKeys] = useState(new Set());

  const [grainSize, setGrainSize] = useState(0.12);
  const [density, setDensity] = useState(8);
  const [pitch, setPitch] = useState(0);
  const [spray, setSpray] = useState(0.05);
  const [reverbMix, setReverbMix] = useState(0.3);
  const [filterFreq, setFilterFreq] = useState(3000);
  const [volume, setVolume] = useState(0.7);
  const [waveform, setWaveform] = useState("sawtooth");

  const paramsRef = useRef({
    grainSize,
    density,
    pitch,
    spray,
    reverbMix,
    filterFreq,
    volume,
    waveform,
  });
  useEffect(() => {
    paramsRef.current = {
      grainSize,
      density,
      pitch,
      spray,
      reverbMix,
      filterFreq,
      volume,
      waveform,
    };
  }, [
    grainSize,
    density,
    pitch,
    spray,
    reverbMix,
    filterFreq,
    volume,
    waveform,
  ]);

  // ── Boot audio context ───────────────────────────────────────────
  const bootAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.7;
    masterGainRef.current = master;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 3000;
    filterRef.current = filter;

    const reverb = createReverb(ctx);
    reverbRef.current = reverb;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.7;
    dryGainRef.current = dryGain;

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.3;
    reverbGainRef.current = reverbGain;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    filter.connect(dryGain);
    filter.connect(reverb);
    reverb.connect(reverbGain);
    dryGain.connect(master);
    reverbGain.connect(master);
    master.connect(analyser);
    analyser.connect(ctx.destination);

    setStarted(true);
  }, []);

  // ── Spawn a single grain ─────────────────────────────────────────
  const spawnGrain = useCallback((baseFreq) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const { grainSize, pitch, spray, waveform } = paramsRef.current;
    const now = ctx.currentTime;

    const detune = pitch * 100 + (Math.random() - 0.5) * spray * 1200;
    const freq = baseFreq * Math.pow(2, detune / 1200);

    const osc = ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = waveform;
    osc2.frequency.value = freq * 1.004;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.18, now + grainSize * 0.3);
    env.gain.linearRampToValueAtTime(0, now + grainSize);

    osc.connect(env);
    osc2.connect(env);
    env.connect(filterRef.current);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + grainSize + 0.01);
    osc2.stop(now + grainSize + 0.01);

    osc.onended = () => {
      env.disconnect();
      activeGrainsRef.current = activeGrainsRef.current.filter(
        (g) => g.env !== env,
      );
    };
    activeGrainsRef.current.push({ osc, osc2, env });
  }, []);

  // ── Grain loop ───────────────────────────────────────────────────
  const startGrainLoop = useCallback(() => {
    if (grainIntervalRef.current) return;
    const tick = () => {
      const { density } = paramsRef.current;
      activeNotesRef.current.forEach((freq) => spawnGrain(freq));
      grainIntervalRef.current = setTimeout(tick, 1000 / density);
    };
    tick();
  }, [spawnGrain]);

  const stopGrainLoop = useCallback(() => {
    if (grainIntervalRef.current) {
      clearTimeout(grainIntervalRef.current);
      grainIntervalRef.current = null;
    }
  }, []);

  // ── Note on / off ────────────────────────────────────────────────
  const noteOn = useCallback(
    (midi) => {
      bootAudio();
      const freq = noteToFreq(midi);
      activeNotesRef.current.add(freq);
      setActiveKeys((prev) => new Set([...prev, midi]));
      if (activeNotesRef.current.size === 1) startGrainLoop();
    },
    [bootAudio, startGrainLoop],
  );

  const noteOff = useCallback(
    (midi) => {
      const freq = noteToFreq(midi);
      activeNotesRef.current.delete(freq);
      setActiveKeys((prev) => {
        const n = new Set(prev);
        n.delete(midi);
        return n;
      });
      if (activeNotesRef.current.size === 0) stopGrainLoop();
    },
    [stopGrainLoop],
  );

  // ── Live param sync ──────────────────────────────────────────────
  useEffect(() => {
    if (filterRef.current) filterRef.current.frequency.value = filterFreq;
  }, [filterFreq]);

  useEffect(() => {
    if (masterGainRef.current) masterGainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    if (reverbGainRef.current) reverbGainRef.current.gain.value = reverbMix;
    if (dryGainRef.current) dryGainRef.current.gain.value = 1 - reverbMix;
  }, [reverbMix]);

  // ── Keyboard ─────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      if (e.repeat) return;
      const note = NOTES.find((n) => n.key === e.key.toLowerCase());
      if (note) noteOn(note.midi);
    };
    const up = (e) => {
      const note = NOTES.find((n) => n.key === e.key.toLowerCase());
      if (note) noteOff(note.midi);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [noteOn, noteOff]);

  // ── Oscilloscope ─────────────────────────────────────────────────
  useEffect(() => {
    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const ctx2d = canvas.getContext("2d");
      const W = canvas.width,
        H = canvas.height;
      const buf = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(buf);

      ctx2d.clearRect(0, 0, W, H);
      ctx2d.fillStyle = "#0d0d14";
      ctx2d.fillRect(0, 0, W, H);

      ctx2d.strokeStyle = "#1e1e2e";
      ctx2d.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx2d.beginPath();
        ctx2d.moveTo(0, (H / 4) * i);
        ctx2d.lineTo(W, (H / 4) * i);
        ctx2d.stroke();
      }

      const grad = ctx2d.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "#7c3aed");
      grad.addColorStop(0.5, "#06b6d4");
      grad.addColorStop(1, "#7c3aed");
      ctx2d.beginPath();
      ctx2d.strokeStyle = grad;
      ctx2d.lineWidth = 2.5;
      ctx2d.shadowBlur = 12;
      ctx2d.shadowColor = "#06b6d4";
      const sliceW = W / buf.length;
      let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const y = (buf[i] / 128.0) * (H / 2);
        i === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y);
        x += sliceW;
      }
      ctx2d.stroke();
      ctx2d.shadowBlur = 0;
    };
    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="gf-synth">
      <header className="gf-header">
        <h1 className="gf-title">
          <span className="gf-grain">GRAIN</span>
          <span className="gf-forge">FORGE</span>
        </h1>
        <p className="gf-subtitle">Web Granular Synthesizer · Web Audio API</p>
      </header>

      {/* Oscilloscope */}
      <div className="gf-scope-container">
        <canvas
          ref={canvasRef}
          width={960}
          height={160}
          className="gf-scope-canvas"
        />
        {!started && (
          <div className="gf-scope-overlay">
            <button className="gf-start-btn" onClick={bootAudio}>
              ▶&nbsp;&nbsp;INITIALIZE ENGINE
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="gf-controls-grid">
        <section className="gf-section">
          <h2 className="gf-section-title">⟁ &nbsp;GRAIN</h2>
          <Knob
            label="Size"
            value={grainSize}
            min={0.01}
            max={0.5}
            step={0.005}
            onChange={setGrainSize}
            display={`${(grainSize * 1000).toFixed(0)} ms`}
          />
          <Knob
            label="Density"
            value={density}
            min={1}
            max={40}
            step={0.5}
            onChange={setDensity}
            display={`${density.toFixed(1)} / s`}
          />
          <Knob
            label="Spray"
            value={spray}
            min={0}
            max={1}
            onChange={setSpray}
            display={`${(spray * 100).toFixed(0)} %`}
          />
        </section>

        <section className="gf-section">
          <h2 className="gf-section-title">♪ &nbsp;PITCH</h2>
          <Knob
            label="Transpose"
            value={pitch}
            min={-24}
            max={24}
            step={1}
            onChange={setPitch}
            display={`${pitch > 0 ? "+" : ""}${pitch} st`}
          />
          <div className="gf-knob-wrapper">
            <div className="gf-knob-top">
              <label className="gf-knob-label">Waveform</label>
            </div>
            <select
              value={waveform}
              onChange={(e) => setWaveform(e.target.value)}
              className="gf-wave-select"
            >
              {["sine", "sawtooth", "square", "triangle"].map((w) => (
                <option key={w} value={w}>
                  {w.charAt(0).toUpperCase() + w.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="gf-section">
          <h2 className="gf-section-title">◈ &nbsp;FILTER</h2>
          <Knob
            label="Cutoff"
            value={filterFreq}
            min={80}
            max={18000}
            step={10}
            onChange={setFilterFreq}
            display={
              filterFreq >= 1000
                ? `${(filterFreq / 1000).toFixed(1)} kHz`
                : `${filterFreq} Hz`
            }
          />
        </section>

        <section className="gf-section">
          <h2 className="gf-section-title">✦ &nbsp;FX</h2>
          <Knob
            label="Reverb"
            value={reverbMix}
            min={0}
            max={1}
            onChange={setReverbMix}
            display={`${(reverbMix * 100).toFixed(0)} %`}
          />
          <Knob
            label="Volume"
            value={volume}
            min={0}
            max={1}
            onChange={setVolume}
            display={`${(volume * 100).toFixed(0)} %`}
          />
        </section>
      </div>

      {/* Keyboard */}
      <div className="gf-keyboard-section">
        <h2 className="gf-section-title gf-kb-title">
          ⌨ &nbsp;KEYBOARD
          <span className="gf-key-hint">
            hold keys: A &nbsp;S &nbsp;D &nbsp;F &nbsp;G &nbsp;H &nbsp;J &nbsp;K
          </span>
        </h2>
        <div className="gf-keyboard">
          {NOTES.map((note) => (
            <button
              key={note.midi}
              className={`gf-key${activeKeys.has(note.midi) ? " gf-key-active" : ""}`}
              onMouseDown={() => noteOn(note.midi)}
              onMouseUp={() => noteOff(note.midi)}
              onMouseLeave={() => {
                if (activeKeys.has(note.midi)) noteOff(note.midi);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                noteOn(note.midi);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                noteOff(note.midi);
              }}
            >
              <span className="gf-key-note">{note.label}</span>
              <span className="gf-key-shortcut">{note.key.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      <footer className="gf-footer">
        Built with React · Web Audio API · Granular Synthesis
      </footer>
    </div>
  );
}
