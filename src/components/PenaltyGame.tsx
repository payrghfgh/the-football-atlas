"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Pixel penalty shootout, second pass.
 *
 * Everything is drawn on a 320x200 canvas and scaled up with nearest-neighbour
 * scaling: tiered crowd, floodlight cones, a net with depth, a keeper with a
 * three-frame dive, a striker run-up, ball trail, confetti and a scoreboard.
 * No image assets, no game libraries.
 *
 * Controls: arrows / WASD to place the reticle (hold Shift for fine aim), Space
 * to lock the aim, Space again to strike. Pointer works too: move to aim, click
 * to lock, click again to shoot. Every button in the panel mirrors the keys.
 */

type Phase = "aim" | "power" | "flight" | "result" | "over";
type Outcome = "goal" | "save" | "over" | "wide";
type Difficulty = "amateur" | "pro" | "world";

const W = 320;
const H = 200;
const SHOTS = 5;

const GOAL = { x: 78, y: 52, w: 164, h: 70 };
const SPOT = { x: 160, y: 170 };

const DIFFICULTY: Record<
  Difficulty,
  { label: string; read: number; error: number; reach: number; note: string }
> = {
  amateur: { label: "Amateur", read: 0.15, error: 34, reach: 15, note: "slow hands, generous corners" },
  pro: { label: "Pro", read: 0.38, error: 22, reach: 12, note: "reads you half the time" },
  world: { label: "World class", read: 0.62, error: 12, reach: 10, note: "closes the corners down" },
};

const C = {
  sky: "#080b0e",
  standDark: "#0e1319",
  standMid: "#131a22",
  standLight: "#1a232d",
  crowd: ["#2b3540", "#39434f", "#46525f", "#5a6672", "#7c8a6a"],
  light: "#f2f7d8",
  lightGlow: "rgba(198,242,78,0.10)",
  grassA: "#12210f",
  grassB: "#152711",
  line: "#e6eedd",
  net: "rgba(230,238,221,0.20)",
  netBack: "rgba(230,238,221,0.10)",
  keeper: "#c6f24e",
  keeperShade: "#93b536",
  keeperGlove: "#f4f7ef",
  ball: "#f7faf2",
  ballShade: "#a8b3a0",
  ballDark: "#3c4438",
  accent: "#c6f24e",
  muted: "#5b6672",
  hoard: "#0b0f14",
  red: "#ff6b5e",
};

const COMMENTARY = {
  goal: [
    "Buried it — the keeper went the other way.",
    "No chance. Right into the corner.",
    "Smashed in off the underside of the bar.",
    "Cool as you like, straight down the middle.",
  ],
  save: [
    "Read it all the way. Strong hand.",
    "Fingertips. The keeper guessed right.",
    "Too close to him — an easy height.",
    "He stood tall and palmed it clear.",
  ],
  over: [
    "Row Z. Far too much on that.",
    "Over the bar — the power bar got away from you.",
    "Blazed over. The keeper never moved.",
  ],
  wide: [
    "Dragged wide of the post.",
    "Outside the post — the angle was never on.",
    "Wide. Should have gone across the keeper.",
  ],
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function drawStadium(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = C.sky;
  ctx.fillRect(0, 0, W, H);

  // three tiers of stand
  const tiers = [
    { y: 0, h: 16, shade: C.standDark },
    { y: 16, h: 15, shade: C.standMid },
    { y: 31, h: 15, shade: C.standLight },
  ];
  tiers.forEach((tier, tierIndex) => {
    ctx.fillStyle = tier.shade;
    ctx.fillRect(0, tier.y, W, tier.h);
    // crowd pixels, deterministic per row so it does not shimmer
    for (let y = tier.y + 3; y < tier.y + tier.h - 2; y += 4) {
      for (let x = (y * 7 + tierIndex * 5) % 11; x < W; x += 6) {
        const seed = (x * 31 + y * 17) % 100;
        if (seed < 62) {
          ctx.fillStyle = C.crowd[seed % C.crowd.length];
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
  });

  // floodlights + cones
  const flicker = 0.06 + Math.sin(t / 900) * 0.015;
  [26, W - 26].forEach((x) => {
    ctx.fillStyle = C.light;
    ctx.fillRect(x - 10, 2, 20, 4);
    ctx.fillStyle = `rgba(242,247,216,${flicker})`;
    ctx.beginPath();
    ctx.moveTo(x - 10, 6);
    ctx.lineTo(x + 10, 6);
    ctx.lineTo(x + 54, 130);
    ctx.lineTo(x - 54, 130);
    ctx.closePath();
    ctx.fill();
  });

  // pitch
  for (let y = 46; y < H; y += 12) {
    ctx.fillStyle = (y / 12) % 2 === 0 ? C.grassA : C.grassB;
    ctx.fillRect(0, y, W, 12);
  }

  // six-yard box and penalty arc
  ctx.strokeStyle = C.line;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.moveTo(36, H);
  ctx.lineTo(52, 126);
  ctx.lineTo(W - 52, 126);
  ctx.lineTo(W - 36, H);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // hoardings
  ctx.fillStyle = C.hoard;
  ctx.fillRect(0, 186, W, 14);
  ctx.strokeStyle = "rgba(198,242,78,0.25)";
  ctx.beginPath();
  ctx.moveTo(0, 186);
  ctx.lineTo(W, 186);
  ctx.stroke();
  ctx.fillStyle = "rgba(198,242,78,0.55)";
  ctx.font = "6px monospace";
  ctx.fillText("FOOTBALL ATLAS", 8, 195);
  ctx.fillText("PENALTY SHOOTOUT", W - 92, 195);
}

function drawGoal(ctx: CanvasRenderingContext2D) {
  // back of the net (gives the goal depth)
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);

  ctx.strokeStyle = C.netBack;
  for (let x = GOAL.x + 3; x < GOAL.x + GOAL.w; x += 5) {
    ctx.beginPath();
    ctx.moveTo(x, GOAL.y);
    ctx.lineTo(x, GOAL.y + GOAL.h);
    ctx.stroke();
  }
  for (let y = GOAL.y + 3; y < GOAL.y + GOAL.h; y += 5) {
    ctx.beginPath();
    ctx.moveTo(GOAL.x, y);
    ctx.lineTo(GOAL.x + GOAL.w, y);
    ctx.stroke();
  }

  // side netting, angled inwards
  ctx.strokeStyle = C.net;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(GOAL.x, GOAL.y + i * 14);
    ctx.lineTo(GOAL.x - 7, GOAL.y + 6 + i * 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(GOAL.x + GOAL.w, GOAL.y + i * 14);
    ctx.lineTo(GOAL.x + GOAL.w + 7, GOAL.y + 6 + i * 14);
    ctx.stroke();
  }

  // frame
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(GOAL.x - 1, GOAL.y + GOAL.h);
  ctx.lineTo(GOAL.x - 1, GOAL.y);
  ctx.lineTo(GOAL.x + GOAL.w + 1, GOAL.y);
  ctx.lineTo(GOAL.x + GOAL.w + 1, GOAL.y + GOAL.h);
  ctx.stroke();
  ctx.lineWidth = 1;

  // grass line at the base of the goal
  ctx.strokeStyle = "rgba(230,238,221,0.5)";
  ctx.beginPath();
  ctx.moveTo(GOAL.x - 1, GOAL.y + GOAL.h);
  ctx.lineTo(GOAL.x + GOAL.w + 1, GOAL.y + GOAL.h);
  ctx.stroke();
}

function drawKeeper(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dive: -1 | 0 | 1,
  lift: number
) {
  const cx = Math.round(x);
  const cy = Math.round(y - lift);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(cx - 7, GOAL.y + GOAL.h - 3, 14, 3);

  if (dive === 0) {
    ctx.fillStyle = C.keeperShade;
    ctx.fillRect(cx - 4, cy - 14, 8, 11);
    ctx.fillStyle = C.keeper;
    ctx.fillRect(cx - 3, cy - 20, 6, 6);
    ctx.fillRect(cx - 4, cy - 3, 3, 9);
    ctx.fillRect(cx + 1, cy - 3, 3, 9);
    ctx.fillStyle = C.keeperGlove;
    ctx.fillRect(cx - 10, cy - 13, 6, 3);
    ctx.fillRect(cx + 4, cy - 13, 6, 3);
  } else {
    // full-stretch dive
    const dir = dive;
    ctx.fillStyle = C.keeperShade;
    ctx.fillRect(cx - 8 * dir, cy - 10, 16, 8);
    ctx.fillStyle = C.keeper;
    ctx.fillRect(cx + 6 * dir, cy - 13, 6, 6); // head leads
    ctx.fillRect(cx - 2 * dir, cy - 2, 5, 8);
    ctx.fillStyle = C.keeperGlove;
    ctx.fillRect(cx + 12 * dir - (dir < 0 ? 6 : 0), cy - 14, 6, 4);
    ctx.fillRect(cx + 8 * dir - (dir < 0 ? 4 : 0), cy - 8, 4, 3);
  }
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, spin: number) {
  const s = Math.max(3, Math.round(5 * scale));
  const px = Math.round(x - s / 2);
  const py = Math.round(y - s / 2);

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(px, SPOT.y + 1, s, 2);

  ctx.fillStyle = C.ballShade;
  ctx.fillRect(px, py, s, s);
  ctx.fillStyle = C.ball;
  ctx.fillRect(px, py, s - 1, s - 1);
  // panel detail that rotates with the spin
  if (s >= 5) {
    const offset = Math.abs(Math.round(spin)) % 3;
    ctx.fillStyle = C.ballDark;
    ctx.fillRect(px + 1 + offset, py + 1, 1, 1);
    ctx.fillRect(px + 2, py + 2 + offset, 1, 1);
  }
}

function drawStriker(ctx: CanvasRenderingContext2D, runUp: number) {
  // stands to the left of the spot, steps forward as the shot is struck
  const x = 128 - Math.round(runUp * 16);
  const y = 176 + Math.round(runUp * 4);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(x - 4, y + 9, 12, 3);
  ctx.fillStyle = "#1b2733";
  ctx.fillRect(x - 3, y - 8, 7, 9); // shirt
  ctx.fillStyle = "#2b3b4b";
  ctx.fillRect(x - 3, y + 1, 3, 9);
  ctx.fillRect(x + 1, y + 1, 3, 9);
  ctx.fillStyle = "#c9a27a";
  ctx.fillRect(x - 2, y - 13, 5, 5); // head
}

export function PenaltyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [phase, setPhase] = useState<Phase>("aim");
  const [difficulty, setDifficulty] = useState<Difficulty>("pro");
  const [aim, setAim] = useState({ x: GOAL.x + GOAL.w * 0.72, y: GOAL.y + GOAL.h * 0.28 });
  const [power, setPower] = useState(0.5);
  const [results, setResults] = useState<Outcome[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const [message, setMessage] = useState("Five penalties. Pick your corner, then judge the power.");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reduced, setReduced] = useState(false);

  const goals = results.filter((r) => r === "goal").length;
  const saves = results.filter((r) => r === "save").length;
  const misses = results.filter((r) => r === "over" || r === "wide").length;
  const shotNumber = Math.min(results.length + 1, SHOTS);

  const resultsRef = useRef<Outcome[]>([]);

  const stateRef = useRef({
    phase: "aim" as Phase,
    aim: { x: aim.x, y: aim.y },
    power: 0.5,
    ball: { x: SPOT.x, y: SPOT.y },
    ballScale: 1,
    spin: 0,
    keeperX: (GOAL.x + GOAL.w) / 2,
    keeperY: GOAL.y + GOAL.h - 16,
    keeperDive: 0 as -1 | 0 | 1,
    keeperLift: 0,
    keeperTarget: { x: (GOAL.x + GOAL.w) / 2, y: GOAL.y + GOAL.h - 16, dive: 0 as -1 | 0 | 1 },
    flight: 0,
    runUp: 0,
    target: { x: 0, y: 0 },
    confetti: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    time: 0,
  });

  useEffect(() => {
    stateRef.current.phase = phase;
    stateRef.current.aim = aim;
    stateRef.current.power = power;
  }, [aim, phase, power]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    const storedBest = Number(localStorage.getItem("atlas-penalty-best") ?? "0");
    if (storedBest > 0) setBest(storedBest);
    const storedDifficulty = localStorage.getItem("atlas-penalty-difficulty") as Difficulty | null;
    if (storedDifficulty && DIFFICULTY[storedDifficulty]) setDifficulty(storedDifficulty);

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // ------------------------------------------------------------------ render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(now - last, 48);
      last = now;
      const s = stateRef.current;
      s.time += dt;

      drawStadium(ctx, s.time);

      // keeper eases toward the dive target
      s.keeperX += (s.keeperTarget.x - s.keeperX) * 0.22;
      s.keeperY += (s.keeperTarget.y - s.keeperY) * 0.22;
      if (s.keeperDive !== s.keeperTarget.dive && Math.abs(s.keeperX - s.keeperTarget.x) < 18) {
        s.keeperDive = s.keeperTarget.dive;
      }
      s.keeperLift += ((s.keeperDive === 0 ? 0 : 4) - s.keeperLift) * 0.2;

      drawGoal(ctx);

      // aim reticle
      if (s.phase === "aim" || s.phase === "power") {
        const rect = 26;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          Math.round(s.aim.x - rect / 2),
          Math.round(s.aim.y - rect / 2),
          rect,
          rect
        );
        ctx.lineWidth = 1;
        ctx.fillStyle = "rgba(198,242,78,0.10)";
        ctx.fillRect(
          Math.round(s.aim.x - rect / 2),
          Math.round(s.aim.y - rect / 2),
          rect,
          rect
        );
        // crosshair dot
        ctx.fillStyle = C.accent;
        ctx.fillRect(Math.round(s.aim.x) - 1, Math.round(s.aim.y) - 1, 2, 2);
      }

      drawKeeper(ctx, s.keeperX, s.keeperY, s.keeperDive as -1 | 0 | 1, s.keeperLift);
      drawStriker(ctx, s.runUp);

      // ball
      if (s.phase === "flight") {
        const p = s.flight;
        const x = SPOT.x + (s.target.x - SPOT.x) * p;
        const arc = Math.sin(Math.PI * p) * (18 + s.power * 26);
        const y = SPOT.y + (s.target.y - SPOT.y) * p - arc;
        s.spin += dt / 40;
        // trail
        for (let i = 1; i <= 4; i += 1) {
          const tp = Math.max(0, p - i * 0.055);
          const tx = SPOT.x + (s.target.x - SPOT.x) * tp;
          const ty = SPOT.y + (s.target.y - SPOT.y) * tp - Math.sin(Math.PI * tp) * (18 + s.power * 26);
          ctx.fillStyle = `rgba(247,250,242,${0.22 - i * 0.04})`;
          ctx.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 2, 2);
        }
        drawBall(ctx, x, y, 1 - p * 0.4, s.spin);
      } else if (s.phase !== "over") {
        drawBall(ctx, SPOT.x, SPOT.y, 1, 0);
      }

      // confetti
      if (s.confetti.length) {
        s.confetti = s.confetti.filter((p) => p.life > 0);
        s.confetti.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12;
          p.life -= 1;
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
        });
      }

      // power meter
      if (s.phase === "power") {
        const barW = 150;
        const x = (W - barW) / 2;
        const y = H - 26;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(x - 3, y - 3, barW + 6, 12);
        // sweet-spot band
        ctx.fillStyle = "rgba(198,242,78,0.18)";
        ctx.fillRect(x + barW * 0.62, y, barW * 0.3, 6);
        ctx.fillStyle = s.power > 0.94 ? C.red : s.power < 0.2 ? "#8d98a5" : C.accent;
        ctx.fillRect(x, y, Math.round(barW * s.power), 6);
        ctx.strokeStyle = "rgba(230,238,221,0.45)";
        ctx.strokeRect(x, y, barW, 6);
        ctx.fillStyle = "rgba(230,238,221,0.5)";
        ctx.fillRect(x + barW * 0.94, y - 2, 1, 10);
      }

      // shot pips
      for (let i = 0; i < SHOTS; i += 1) {
        const result = resultsRef.current[i];
        const bx = 10 + i * 10;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(bx - 1, 7, 8, 8);
        ctx.fillStyle =
          result === "goal"
            ? C.accent
            : result === "save"
            ? C.red
            : result === "over" || result === "wide"
            ? "#4b5560"
            : "rgba(230,238,221,0.25)";
        ctx.fillRect(bx, 8, 6, 6);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [difficulty]);

  // -------------------------------------------------------------- power sweep
  useEffect(() => {
    if (phase !== "power") return;
    let direction = 1;
    const speed = difficulty === "world" ? 0.075 : difficulty === "pro" ? 0.062 : 0.05;
    const timer = setInterval(() => {
      setPower((value) => {
        let next = value + direction * speed;
        if (next >= 1) {
          next = 1;
          direction = -1;
        }
        if (next <= 0.06) {
          next = 0.06;
          direction = 1;
        }
        return next;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [difficulty, phase]);

  const spawnConfetti = useCallback(() => {
    const s = stateRef.current;
    s.confetti = Array.from({ length: 34 }, () => ({
      x: GOAL.x + rand(0, GOAL.w),
      y: GOAL.y + rand(0, GOAL.h),
      vx: rand(-1.1, 1.1),
      vy: rand(-1.6, -0.3),
      life: 40 + Math.random() * 30,
      color: [C.accent, C.ball, "#7cc4ff", C.keeperShade][Math.floor(Math.random() * 4)],
    }));
  }, []);

  // ------------------------------------------------------------------- strike
  const strike = useCallback(
    (currentPower: number, currentAim: { x: number; y: number }) => {
      const s = stateRef.current;
      const config = DIFFICULTY[difficulty];

      const overBar = currentPower > 0.94;
      const weak = currentPower < 0.2;
      const wide = currentAim.x < GOAL.x - 6 || currentAim.x > GOAL.x + GOAL.w + 6;

      // keeper picks where to go: sometimes he reads the aim, otherwise he guesses
      const readsAim = Math.random() < config.read + results.length * 0.03;
      const guessedX = readsAim
        ? currentAim.x + rand(-config.error, config.error)
        : GOAL.x + rand(0, GOAL.w);
      const keeperTargetX = Math.max(GOAL.x + 6, Math.min(GOAL.x + GOAL.w - 6, guessedX));
      const dive: -1 | 0 | 1 =
        keeperTargetX < (GOAL.x + GOAL.w) / 2 - 22
          ? -1
          : keeperTargetX > (GOAL.x + GOAL.w) / 2 + 22
          ? 1
          : 0;

      // how far the ball lands from the keeper's hands
      const handsX = keeperTargetX + dive * 12;
      const handsY = GOAL.y + GOAL.h - 18;
      const reach = config.reach + (weak ? 26 : 0);
      const distance = Math.hypot(currentAim.x - handsX, currentAim.y - handsY);

      let result: Outcome;
      if (overBar) result = "over";
      else if (wide) result = "wide";
      else if (distance < reach) result = "save";
      else if (distance < reach * 1.6 && Math.random() < 0.25) result = "save";
      else result = "goal";

      s.target = { x: currentAim.x, y: currentAim.y };
      s.power = currentPower;
      s.flight = 0;
      s.runUp = 0;
      s.keeperTarget = {
        x: keeperTargetX,
        y: GOAL.y + GOAL.h - 16,
        dive,
      };
      s.phase = "flight";
      setPhase("flight");

      const finish = () => {
        s.phase = "result";
        setPhase("result");
        setOutcome(result);
        setResults((previous) => [...previous, result]);

        if (result === "goal") spawnConfetti();

        const pool = COMMENTARY[result];
        const line = pool[Math.floor(Math.random() * pool.length)];
        const remaining = SHOTS - (results.length + 1);
        setMessage(remaining > 0 ? `${line} ${remaining} left.` : `${line} That's the five.`);

        if (results.length + 1 >= SHOTS) {
          window.setTimeout(() => {
            const finalGoals = [...results, result].filter((entry) => entry === "goal").length;
            setPhase("over");
            s.phase = "over";
            setBest((previous) => {
              const next = Math.max(previous ?? 0, finalGoals);
              localStorage.setItem("atlas-penalty-best", String(next));
              return next;
            });
            setMessage("Shootout over.");
          }, 1100);
        } else {
          window.setTimeout(() => {
            s.keeperTarget = { x: (GOAL.x + GOAL.w) / 2, y: GOAL.y + GOAL.h - 16, dive: 0 };
            s.keeperDive = 0;
            s.keeperLift = 0;
            s.runUp = 0;
            s.phase = "aim";
            setPhase("aim");
            setOutcome(null);
          }, 1150);
        }
      };

      if (reduced) {
        finish();
        return;
      }

      const started = performance.now();
      const duration = 620;
      const animate = (now: number) => {
        const progress = Math.min((now - started) / duration, 1);
        s.flight = progress;
        s.runUp = Math.min(progress * 2.2, 1);
        if (progress < 1) requestAnimationFrame(animate);
        else finish();
      };
      requestAnimationFrame(animate);
    },
    [difficulty, reduced, results, spawnConfetti]
  );

  const reset = useCallback(() => {
    setResults([]);
    setOutcome(null);
    setPower(0.5);
    setPhase("aim");
    setMessage("New shootout. Pick your corner, then judge the power.");
    const s = stateRef.current;
    s.phase = "aim";
    s.keeperDive = 0;
    s.keeperLift = 0;
    s.keeperTarget = { x: (GOAL.x + GOAL.w) / 2, y: GOAL.y + GOAL.h - 16, dive: 0 };
    s.confetti = [];
    s.runUp = 0;
  }, []);

  // ---------------------------------------------------------------- keyboard
  useEffect(() => {
    const move = (dx: number, dy: number) => {
      setAim((value) => ({
        x: Math.max(GOAL.x - 10, Math.min(GOAL.x + GOAL.w + 10, value.x + dx)),
        y: Math.max(GOAL.y - 10, Math.min(GOAL.y + GOAL.h + 8, value.y + dy)),
      }));
    };

    const onKey = (event: KeyboardEvent) => {
      const step = event.shiftKey ? 3 : 9;
      if (phase === "aim") {
        if (event.key === "ArrowLeft" || event.key === "a") {
          event.preventDefault();
          move(-step, 0);
        } else if (event.key === "ArrowRight" || event.key === "d") {
          event.preventDefault();
          move(step, 0);
        } else if (event.key === "ArrowUp" || event.key === "w") {
          event.preventDefault();
          move(0, -step);
        } else if (event.key === "ArrowDown" || event.key === "s") {
          event.preventDefault();
          move(0, step);
        } else if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          setPhase("power");
        }
      } else if (phase === "power" && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        strike(power, aim);
      } else if (phase === "over" && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aim, phase, power, reset, strike]);

  function canvasPoint(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    };
  }

  function onCanvasMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (phase !== "aim") return;
    const point = canvasPoint(event);
    if (!point) return;
    setAim({
      x: Math.max(GOAL.x - 10, Math.min(GOAL.x + GOAL.w + 10, point.x)),
      y: Math.max(GOAL.y - 10, Math.min(GOAL.y + GOAL.h + 8, point.y)),
    });
  }

  function onCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    if (phase === "aim") {
      const point = canvasPoint(event);
      if (point) {
        setAim({
          x: Math.max(GOAL.x - 10, Math.min(GOAL.x + GOAL.w + 10, point.x)),
          y: Math.max(GOAL.y - 10, Math.min(GOAL.y + GOAL.h + 8, point.y)),
        });
      }
      setPhase("power");
    } else if (phase === "power") {
      strike(power, aim);
    }
  }

  function changeDifficulty(next: Difficulty) {
    setDifficulty(next);
    localStorage.setItem("atlas-penalty-difficulty", next);
    reset();
  }

  const verdict = useMemo(() => {
    if (goals === 5) return { title: "Perfect five", note: "Every penalty buried. Take the gloves off." };
    if (goals === 4) return { title: "Clinical", note: "Four from five — a shootout you win most weeks." };
    if (goals === 3) return { title: "Par", note: "Three from five. The keeper will fancy his chances." };
    if (goals === 2) return { title: "Nervy", note: "Two from five. The power bar is not your friend yet." };
    return { title: "Nightmare", note: "The keeper wins this one comfortably." };
  }, [goals]);

  return (
    <div className="card overflow-hidden">
      {/* scoreboard */}
      <div className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="eyebrow">You</span>
          <span className="num display text-3xl leading-none">{goals}</span>
        </div>
        <div className="h-8 w-px bg-line" />
        <div className="flex items-baseline gap-2">
          <span className="eyebrow">Keeper</span>
          <span className="num display text-3xl leading-none text-muted">{saves}</span>
        </div>
        <div className="h-8 w-px bg-line" />
        <div className="text-[11px] text-muted">
          <span className="num text-ink">{shotNumber}</span> of {SHOTS} · best{" "}
          <span className="num text-ink">{best ?? "—"}</span>
        </div>
        <div className="ml-auto flex items-center gap-1" role="group" aria-label="Difficulty">
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => changeDifficulty(key)}
              aria-pressed={difficulty === key}
              title={DIFFICULTY[key].note}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 ease-out ${
                difficulty === key
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {DIFFICULTY[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* screen */}
      <div className="relative bg-[#080b0e] p-3">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={onCanvasClick}
          onMouseMove={onCanvasMove}
          role="application"
          aria-label="Pixel penalty shootout. Arrow keys move the reticle, Space locks the aim, Space again strikes the ball."
          className="mx-auto block w-full max-w-[680px] cursor-crosshair touch-manipulation rounded-md border border-[#232c37]"
          style={{ imageRendering: "pixelated", aspectRatio: `${W} / ${H}` }}
        />

        {outcome && phase !== "aim" && (
          <p
            className="pointer-events-none absolute inset-0 grid place-items-center"
            aria-hidden="true"
          >
            <span
              className="display text-5xl tracking-wide"
              style={{
                color: outcome === "goal" ? C.accent : C.red,
                textShadow: "0 3px 0 rgba(0,0,0,0.85)",
              }}
            >
              {outcome === "goal"
                ? "GOAL"
                : outcome === "save"
                ? "SAVED"
                : outcome === "over"
                ? "OVER THE BAR"
                : "WIDE"}
            </span>
          </p>
        )}
      </div>

      {/* controls + commentary */}
      <div className="border-t border-line px-4 py-3">
        <p className="text-[12px] text-muted" aria-live="polite">
          {message}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {phase === "aim" && (
            <>
              <div className="flex gap-1" role="group" aria-label="Move the aim">
                <button type="button" className="btn h-9 w-9 !px-0" onClick={() => setAim((v) => ({ ...v, x: Math.max(GOAL.x - 10, v.x - 9) }))} aria-label="Aim left">◀</button>
                <button type="button" className="btn h-9 w-9 !px-0" onClick={() => setAim((v) => ({ ...v, x: Math.min(GOAL.x + GOAL.w + 10, v.x + 9) }))} aria-label="Aim right">▶</button>
                <button type="button" className="btn h-9 w-9 !px-0" onClick={() => setAim((v) => ({ ...v, y: Math.max(GOAL.y - 10, v.y - 9) }))} aria-label="Aim higher">▲</button>
                <button type="button" className="btn h-9 w-9 !px-0" onClick={() => setAim((v) => ({ ...v, y: Math.min(GOAL.y + GOAL.h + 8, v.y + 9) }))} aria-label="Aim lower">▼</button>
              </div>
              <button type="button" className="btn btn-accent" onClick={() => setPhase("power")}>
                Lock aim
              </button>
            </>
          )}

          {phase === "power" && (
            <button type="button" className="btn btn-accent" onClick={() => strike(power, aim)}>
              Strike
            </button>
          )}

          {(phase === "flight" || phase === "result") && (
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
              {phase === "flight" ? "Ball in flight…" : "Next penalty…"}
            </span>
          )}

          {phase === "over" && (
            <button type="button" className="btn btn-accent" onClick={reset}>
              Take five more
            </button>
          )}

          {phase !== "over" && phase !== "result" && phase !== "flight" && (
            <button type="button" className="btn ml-auto" onClick={reset}>
              Restart
            </button>
          )}
        </div>

        {phase === "over" && (
          <div className="mt-4 rounded-xl border border-line bg-[var(--surface-raised)] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="display text-3xl leading-none">{verdict.title}</p>
              <p className="num text-[13px] text-muted">
                {goals} goals · {saves} saved · {misses} off target · {difficulty}
              </p>
            </div>
            <p className="mt-2 text-[12px] text-muted">{verdict.note}</p>
          </div>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Arrows or WASD to place the reticle (hold Shift for fine aim), Space to lock, Space again to
          strike — or move the pointer and click. Above 94% power the ball climbs over the bar, under
          20% the keeper reaches it, and the further you place it from his hands the better.
        </p>
      </div>
    </div>
  );
}
