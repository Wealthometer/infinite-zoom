import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Infinite Zoom Universe" },
      { name: "description", content: "Zoom from galaxies to the quantum realm in one infinite scroll." },
      { property: "og:title", content: "Infinite Zoom Universe" },
      { property: "og:description", content: "Zoom from galaxies to the quantum realm in one infinite scroll." },
    ],
  }),
  component: Index,
});

const LEVELS = [
  { name: "Galaxy", caption: "100,000 light-years across" },
  { name: "Solar System", caption: "A quiet sun and its orbits" },
  { name: "Planet", caption: "A pale blue world" },
  { name: "City", caption: "Skyline at dusk" },
  { name: "House", caption: "A small home on a quiet street" },
  { name: "Room", caption: "Inside, a desk and a lamp" },
  { name: "Atom", caption: "Nucleus and electron clouds" },
  { name: "Quantum Realm", caption: "Fields, probabilities, foam" },
];

const STORAGE_KEY = "infinite-zoom-position";
const MAX = LEVELS.length - 1;

function Index() {
  const [pos, setPos] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const v = raw ? parseFloat(raw) : 0;
    return isNaN(v) ? 0 : Math.min(MAX, Math.max(0, v));
  });
  const posRef = useRef(pos);
  posRef.current = pos;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(pos));
  }, [pos]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.0018;
      setPos((p) => Math.min(MAX, Math.max(0, p + delta)));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "+" || e.key === "=") {
        setPos((p) => Math.min(MAX, p + 0.25));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "-") {
        setPos((p) => Math.max(0, p - 0.25));
      }
    };
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      const y = e.touches[0]?.clientY ?? touchY;
      const dy = touchY - y;
      touchY = y;
      setPos((p) => Math.min(MAX, Math.max(0, p + dy * 0.006)));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const level = Math.floor(pos);
  const frac = pos - level;
  const current = LEVELS[Math.min(MAX, level)];
  const next = LEVELS[Math.min(MAX, level + 1)];

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground select-none">
      {/* Stage */}
      <div className="absolute inset-0">
        {LEVELS.map((_, i) => {
          const d = pos - i;
          // current scene scales up as we zoom past it, next scene scales in from small
          const scale = Math.pow(2.6, d);
          const opacity =
            d < -1 || d > 1 ? 0 : 1 - Math.min(1, Math.abs(d));
          if (opacity <= 0.01) return null;
          return (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center will-change-transform"
              style={{
                transform: `scale(${scale})`,
                opacity,
                transition: "none",
              }}
            >
              <Scene index={i} />
            </div>
          );
        })}
      </div>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 55%, oklch(0.10 0.02 260 / 0.85) 100%)"
      }} />

      {/* HUD */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 text-sm tracking-widest uppercase">
        <div className="text-muted-foreground">Infinite Zoom</div>
        <div className="text-muted-foreground">Scroll to zoom</div>
      </header>

      <section className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center gap-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-light tracking-tight">
            <span style={{ opacity: 1 - frac }}>{current.name}</span>
            {frac > 0.02 && next !== current && (
              <span className="ml-3 text-primary" style={{ opacity: frac }}>
                → {next.name}
              </span>
            )}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{frac < 0.5 ? current.caption : next.caption}</p>
        </div>

        {/* Progress rail */}
        <div className="w-full max-w-2xl">
          <div className="relative h-px bg-muted">
            <div
              className="absolute top-0 left-0 h-px bg-primary"
              style={{ width: `${(pos / MAX) * 100}%` }}
            />
            {LEVELS.map((l, i) => (
              <button
                key={l.name}
                onClick={() => setPos(i)}
                className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 group"
                style={{ left: `${(i / MAX) * 100}%` }}
                aria-label={`Jump to ${l.name}`}
              >
                <span
                  className={`block h-2 w-2 rounded-full transition-all ${
                    i <= pos ? "bg-primary" : "bg-muted-foreground/40"
                  } group-hover:scale-150`}
                />
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] tracking-widest uppercase text-muted-foreground">
            <span>Galaxy</span>
            <span>Quantum</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function Scene({ index }: { index: number }) {
  switch (index) {
    case 0: return <Galaxy />;
    case 1: return <SolarSystem />;
    case 2: return <Planet />;
    case 3: return <City />;
    case 4: return <House />;
    case 5: return <Room />;
    case 6: return <Atom />;
    case 7: return <Quantum />;
    default: return null;
  }
}

const SVG = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="-100 -100 200 200" className="h-[80vmin] w-[80vmin]">
    {children}
  </svg>
);

function Galaxy() {
  const stars = Array.from({ length: 120 });
  return (
    <SVG>
      <defs>
        <radialGradient id="g-core" cx="50%" cy="50%">
          <stop offset="0%" stopColor="oklch(0.95 0.12 80)" />
          <stop offset="60%" stopColor="oklch(0.55 0.10 80 / 0.4)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle r="80" fill="url(#g-core)" />
      {[0, 1, 2, 3].map((arm) => (
        <g key={arm} transform={`rotate(${arm * 90})`}>
          {Array.from({ length: 40 }).map((_, i) => {
            const t = i / 40;
            const r = 8 + t * 75;
            const a = t * 5;
            return (
              <circle
                key={i}
                cx={Math.cos(a) * r}
                cy={Math.sin(a) * r}
                r={0.6 + (1 - t) * 0.8}
                fill="oklch(0.95 0.05 90)"
                opacity={0.3 + (1 - t) * 0.6}
              />
            );
          })}
        </g>
      ))}
      {stars.map((_, i) => (
        <circle
          key={i}
          cx={(Math.random() - 0.5) * 200}
          cy={(Math.random() - 0.5) * 200}
          r={Math.random() * 0.5}
          fill="oklch(0.95 0.02 90)"
          opacity={Math.random()}
        />
      ))}
    </SVG>
  );
}

function SolarSystem() {
  const planets = [14, 22, 32, 44, 58, 74];
  return (
    <SVG>
      <circle r="6" fill="oklch(0.85 0.16 75)" />
      <circle r="9" fill="oklch(0.85 0.16 75 / 0.25)" />
      {planets.map((r, i) => (
        <g key={r}>
          <circle r={r} fill="none" stroke="oklch(0.95 0.02 90 / 0.2)" strokeWidth="0.3" />
          <circle
            cx={Math.cos(i * 1.3) * r}
            cy={Math.sin(i * 1.3) * r}
            r={1 + (i % 3) * 0.4}
            fill="oklch(0.9 0.04 90)"
          />
        </g>
      ))}
    </SVG>
  );
}

function Planet() {
  return (
    <SVG>
      <defs>
        <radialGradient id="p-shade" cx="35%" cy="35%">
          <stop offset="0%" stopColor="oklch(0.7 0.1 230)" />
          <stop offset="100%" stopColor="oklch(0.2 0.05 240)" />
        </radialGradient>
      </defs>
      <circle r="70" fill="url(#p-shade)" />
      <path d="M -40 -20 Q -20 -30 0 -22 T 40 -10 L 35 0 Q 10 5 -15 -2 Z" fill="oklch(0.65 0.12 145)" opacity="0.85" />
      <path d="M -30 25 Q -10 18 15 24 T 45 30 L 30 38 Q 5 42 -25 35 Z" fill="oklch(0.65 0.12 145)" opacity="0.85" />
      <circle r="70" fill="none" stroke="oklch(0.95 0.02 90 / 0.08)" strokeWidth="6" />
    </SVG>
  );
}

function City() {
  const buildings = Array.from({ length: 14 }).map((_, i) => ({
    x: -90 + i * 13,
    w: 9 + ((i * 37) % 4),
    h: 30 + ((i * 53) % 50),
  }));
  return (
    <SVG>
      <rect x="-100" y="40" width="200" height="60" fill="oklch(0.22 0.03 260)" />
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={40 - b.h} width={b.w} height={b.h} fill="oklch(0.28 0.03 260)" />
          {Array.from({ length: Math.floor(b.h / 5) }).map((_, r) =>
            Array.from({ length: Math.floor(b.w / 3) }).map((_, c) => (
              <rect
                key={`${r}-${c}`}
                x={b.x + 1 + c * 3}
                y={40 - b.h + 3 + r * 5}
                width="1.5"
                height="2"
                fill={(i + r + c) % 3 === 0 ? "oklch(0.85 0.16 75)" : "oklch(0.4 0.03 260)"}
              />
            ))
          )}
        </g>
      ))}
      <circle cx="50" cy="-40" r="6" fill="oklch(0.95 0.05 90 / 0.5)" />
    </SVG>
  );
}

function House() {
  return (
    <SVG>
      <rect x="-100" y="40" width="200" height="60" fill="oklch(0.25 0.03 150)" />
      <rect x="-40" y="-5" width="80" height="60" fill="oklch(0.85 0.04 80)" />
      <polygon points="-50,-5 0,-45 50,-5" fill="oklch(0.45 0.08 30)" />
      <rect x="-10" y="20" width="20" height="35" fill="oklch(0.3 0.03 260)" />
      <circle cx="6" cy="38" r="1" fill="oklch(0.85 0.16 75)" />
      <rect x="15" y="10" width="18" height="18" fill="oklch(0.85 0.16 75 / 0.7)" />
      <rect x="-33" y="10" width="18" height="18" fill="oklch(0.85 0.16 75 / 0.7)" />
    </SVG>
  );
}

function Room() {
  return (
    <SVG>
      <rect x="-100" y="-100" width="200" height="200" fill="oklch(0.22 0.02 80)" />
      <rect x="-100" y="40" width="200" height="60" fill="oklch(0.32 0.04 40)" />
      <rect x="-70" y="0" width="50" height="40" fill="oklch(0.3 0.03 260)" />
      <rect x="-65" y="5" width="40" height="30" fill="oklch(0.85 0.16 75 / 0.6)" />
      <rect x="20" y="10" width="50" height="30" fill="oklch(0.45 0.05 40)" />
      <rect x="22" y="-10" width="46" height="20" fill="oklch(0.4 0.04 40)" />
      <circle cx="45" cy="0" r="3" fill="oklch(0.85 0.16 75)" />
      <line x1="45" y1="-30" x2="45" y2="-3" stroke="oklch(0.4 0.03 260)" strokeWidth="0.5" />
    </SVG>
  );
}

function Atom() {
  return (
    <SVG>
      <g>
        <circle r="6" fill="oklch(0.85 0.16 75)" />
        <circle r="3" cx="-2" cy="-1" fill="oklch(0.95 0.08 90)" />
      </g>
      {[0, 60, 120].map((rot) => (
        <g key={rot} transform={`rotate(${rot})`}>
          <ellipse rx="70" ry="22" fill="none" stroke="oklch(0.95 0.02 90 / 0.4)" strokeWidth="0.5" />
          <circle cx="70" cy="0" r="2" fill="oklch(0.85 0.16 75)" />
        </g>
      ))}
    </SVG>
  );
}

function Quantum() {
  return (
    <SVG>
      <defs>
        <radialGradient id="q-glow">
          <stop offset="0%" stopColor="oklch(0.85 0.16 75 / 0.8)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {Array.from({ length: 8 }).map((_, i) => (
        <circle
          key={i}
          r={20 + i * 8}
          fill="none"
          stroke="oklch(0.95 0.02 90 / 0.08)"
          strokeWidth="0.5"
          strokeDasharray="2 3"
        />
      ))}
      {Array.from({ length: 40 }).map((_, i) => {
        const a = (i / 40) * Math.PI * 2;
        const r = 30 + (i % 5) * 12;
        return (
          <circle
            key={i}
            cx={Math.cos(a) * r}
            cy={Math.sin(a) * r}
            r={1.5}
            fill="url(#q-glow)"
          />
        );
      })}
      <circle r="10" fill="url(#q-glow)" />
    </SVG>
  );
}
