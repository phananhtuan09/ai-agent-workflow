"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useId, useRef, useState, useEffect, useCallback } from "react";
import { useLocale } from "@/components/client/locale-provider";
import { cn } from "@/lib/utils";

// ─── Config ─────────────────────────────────────────────────────────────────

const STEP_COLORS = [
  { accent: "#60a5fa", rgb: "96,165,250" },   // blue
  { accent: "#a78bfa", rgb: "167,139,250" },   // violet
  { accent: "#fb923c", rgb: "251,146,60" },    // orange
  { accent: "#22d3ee", rgb: "34,211,238" },    // cyan
] as const;

const EDGES = [
  {
    id: "e0",
    d: "M 24 24 L 58 30",
    x1: 24, y1: 24, x2: 58, y2: 30,
    srcStep: 0,
  },
  {
    id: "e1",
    d: "M 66 38 L 36 66",
    x1: 66, y1: 38, x2: 36, y2: 66,
    srcStep: 1,
  },
  {
    id: "e2",
    d: "M 44 72 L 72 80",
    x1: 44, y1: 72, x2: 72, y2: 80,
    srcStep: 2,
  },
] as const;

const DESKTOP_LAYOUT = [
  { id: "requirement", position: "left-[6%] top-[10%]" },
  { id: "epic",        position: "left-[52%] top-[22%]" },
  { id: "plan",        position: "left-[14%] top-[58%]" },
  { id: "execute",     position: "left-[58%] top-[68%]" },
] as const;

const NODE_LABELS = {
  en: ["Requirement intake", "Epic routing", "Plan review", "Execute"],
  vi: ["Tiếp nhận yêu cầu", "Điều phối epic", "Review plan", "Thực thi"],
} as const;

// phase 0: all idle
// phase 1: step 0 running
// phase 2: step 0 done → step 1 running, edge 0 particle fires
// phase 3: step 1 done → step 2 running, edge 1 particle fires
// phase 4: step 2 done → step 3 running, edge 2 particle fires
// phase 5: all done (celebration hold)
// then reset
const PHASE_MS = [700, 1900, 3100, 4300, 5500, 7900] as const;

type NodeState = "idle" | "running" | "done";

function getNodeState(phase: number, i: number): NodeState {
  if (phase > i + 1) return "done";
  if (phase === i + 1) return "running";
  return "idle";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProcessingDots({ rgb }: { rgb: string }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-[3px] w-[3px] rounded-full"
          style={{ background: `rgb(${rgb})` }}
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.7, 1.3, 0.7] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.22,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function CheckMark({ rgb }: { rgb: string }) {
  return (
    <motion.svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
    >
      <circle
        cx="7.5"
        cy="7.5"
        r="6.5"
        stroke={`rgb(${rgb})`}
        strokeOpacity="0.4"
      />
      <path
        d="M4.5 7.5L6.7 9.7L10.5 5.3"
        stroke={`rgb(${rgb})`}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

function NodeCard({
  stepIndex,
  label,
  stepLabel,
  nodeState,
  reducedMotion,
}: {
  stepIndex: number;
  label: string;
  stepLabel: string;
  nodeState: NodeState;
  reducedMotion: boolean;
}) {
  const { rgb, accent } = STEP_COLORS[stepIndex];
  const running = nodeState === "running";
  const done = nodeState === "done";
  const active = running || done;

  return (
    <div className="relative">
      {/* Outer bloom glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-5 rounded-3xl"
        style={{
          background: `radial-gradient(ellipse at 40% 50%, rgba(${rgb},0.32) 0%, transparent 68%)`,
          filter: "blur(10px)",
        }}
        animate={{ opacity: running ? 1 : done ? 0.28 : 0 }}
        transition={{ duration: 0.55 }}
      />

      {/* Card */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ backdropFilter: "blur(22px)" }}
      >
        {/* Base layer */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ background: "rgba(9,13,19,0.92)" }}
        />

        {/* Running color tint */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(140deg, rgba(${rgb},0.11) 0%, transparent 55%)`,
          }}
          animate={{ opacity: running ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />

        {/* Colored border overlay */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ border: `1px solid rgb(${rgb})` }}
          animate={{
            opacity: running ? 0.55 : done ? 0.22 : 0,
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Base subtle border always visible */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.06]" />

        {/* Pulse ring — running */}
        {!reducedMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ border: `1px solid rgba(${rgb},0.75)` }}
            animate={
              running
                ? { scale: [1, 1.07, 1], opacity: [0, 0.75, 0] }
                : { scale: 1, opacity: 0 }
            }
            transition={
              running
                ? { duration: 2.1, repeat: Infinity, ease: "easeOut" }
                : { duration: 0.25 }
            }
          />
        )}

        {/* Content */}
        <div className="relative p-5">
          <div className="mb-3 flex items-center justify-between">
            <motion.p
              className="section-kicker"
              animate={{ color: active ? accent : "rgba(148,163,184,0.45)" }}
              transition={{ duration: 0.4 }}
            >
              {stepLabel} {stepIndex + 1}
            </motion.p>

            <div className="flex h-4 items-center gap-1.5">
              {!reducedMotion && running && <ProcessingDots rgb={rgb} />}
              {!reducedMotion && done && <CheckMark rgb={rgb} />}
              {nodeState === "idle" && (
                <span className="block h-[5px] w-[5px] rounded-full bg-white/[0.14]" />
              )}
            </div>
          </div>

          <motion.p
            className="font-heading text-[1.65rem] font-semibold leading-tight"
            animate={{
              color: running
                ? "#ffffff"
                : done
                  ? "rgba(255,255,255,0.62)"
                  : "rgba(255,255,255,0.32)",
            }}
            transition={{ duration: 0.4 }}
          >
            {label}
          </motion.p>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function AnimatedWorkflowNodes() {
  const { locale, t } = useLocale();
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const blurId = `blur-${uid}`;

  const labels = NODE_LABELS[locale];
  const stepLabel = locale === "vi" ? "bước" : "step";

  // ── Activation sequence ───────────────────────────────────────────────────
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;

    function go(fn: () => void, ms: number) {
      setTimeout(() => { if (!cancelled) fn(); }, ms);
    }

    function startCycle() {
      if (cancelled) return;
      setPhase(0);
      go(() => setPhase(1), PHASE_MS[0]);
      go(() => setPhase(2), PHASE_MS[1]);
      go(() => setPhase(3), PHASE_MS[2]);
      go(() => setPhase(4), PHASE_MS[3]);
      go(() => setPhase(5), PHASE_MS[4]);
      go(() => {
        setCycle((c) => c + 1);
        startCycle();
      }, PHASE_MS[5]);
    }

    startCycle();
    return () => { cancelled = true; };
  }, [reducedMotion]);

  // ── Hover tilt ────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotX = useSpring(rawX, { stiffness: 120, damping: 18 });
  const rotY = useSpring(rawY, { stiffness: 120, damping: 18 });

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    rawY.set(dx * 9);
    rawX.set(-dy * 6);
  }, [reducedMotion, rawX, rawY]);

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={t("home.nodeMapAlt")}
      className="glass-panel relative overflow-hidden p-5 sm:p-6"
      style={{ perspective: "1200px" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.13) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse at 50% 50%, black 20%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 50%, black 20%, transparent 72%)",
        }}
      />

      {/* Scanlines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
          opacity: 0.45,
        }}
      />

      {/* Ambient background gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 85% 10%, rgba(96,165,250,0.08) 0%, transparent 42%), radial-gradient(ellipse at 15% 90%, rgba(167,139,250,0.09) 0%, transparent 42%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent"
      />

      {/* ── Mobile layout ─────────────────────────────────────────────────── */}
      <div className="relative sm:hidden">
        <div className="space-y-4">
          {labels.map((label, index) => {
            const nodeState = getNodeState(phase, index);
            const { rgb } = STEP_COLORS[index];
            return (
              <div key={label} className="relative pl-6">
                {index < labels.length - 1 && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute left-[11px] top-12 h-[calc(100%+0.5rem)] w-px"
                    style={{
                      background: `linear-gradient(to bottom, rgba(${rgb},0.45), rgba(255,255,255,0.05))`,
                      transformOrigin: "top",
                    }}
                    initial={reducedMotion ? false : { scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{
                      duration: 0.35,
                      delay: reducedMotion ? 0 : index * 0.15 + 0.18,
                    }}
                  />
                )}
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: reducedMotion ? 0 : index * 0.15 }}
                >
                  <NodeCard
                    stepIndex={index}
                    label={label}
                    stepLabel={stepLabel}
                    nodeState={nodeState}
                    reducedMotion={!!reducedMotion}
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Desktop layout ────────────────────────────────────────────────── */}
      <motion.div
        className="relative hidden min-h-[26rem] select-none sm:block"
        style={{
          rotateX: reducedMotion ? 0 : rotX,
          rotateY: reducedMotion ? 0 : rotY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* SVG edges */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {EDGES.map((edge) => {
              const src = STEP_COLORS[edge.srcStep];
              const dst = STEP_COLORS[edge.srcStep + 1];
              return (
                <linearGradient
                  key={`grad-${uid}-${edge.id}`}
                  id={`grad-${uid}-${edge.id}`}
                  x1="0%" y1="0%" x2="100%" y2="100%"
                >
                  <stop offset="0%" stopColor={src.accent} stopOpacity="1" />
                  <stop offset="100%" stopColor={dst.accent} stopOpacity="0.8" />
                </linearGradient>
              );
            })}
            <filter id={blurId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
          </defs>

          {EDGES.map((edge, i) => {
            const isLit = phase > edge.srcStep + 1;
            const particleFiring = phase === edge.srcStep + 2;
            const srcColor = STEP_COLORS[edge.srcStep];
            const dstColor = STEP_COLORS[edge.srcStep + 1];

            return (
              <g key={edge.id}>
                {/* Glow halo */}
                <motion.path
                  d={edge.d}
                  fill="none"
                  stroke={`url(#grad-${uid}-${edge.id})`}
                  strokeWidth="7"
                  strokeLinecap="round"
                  filter={`url(#${blurId})`}
                  animate={{ opacity: isLit ? 0.55 : 0.06 }}
                  transition={{ duration: 0.65 }}
                  initial={false}
                />

                {/* Crisp stroke */}
                <motion.path
                  d={edge.d}
                  fill="none"
                  stroke={`url(#grad-${uid}-${edge.id})`}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ opacity: isLit ? 1 : 0.1 }}
                  transition={{ duration: 0.65 }}
                  initial={false}
                />

                {/* Junction dot at start */}
                <motion.circle
                  cx={edge.x1}
                  cy={edge.y1}
                  r="1.4"
                  fill={srcColor.accent}
                  animate={{ opacity: isLit ? 0.9 : 0.12, r: isLit ? 1.6 : 1.2 }}
                  transition={{ duration: 0.5 }}
                  initial={false}
                />

                {/* Junction dot at end */}
                <motion.circle
                  cx={edge.x2}
                  cy={edge.y2}
                  r="1.4"
                  fill={dstColor.accent}
                  animate={{ opacity: isLit ? 0.9 : 0.12, r: isLit ? 1.6 : 1.2 }}
                  transition={{ duration: 0.5 }}
                  initial={false}
                />

                {/* One-shot travel particle */}
                {!reducedMotion && particleFiring && (
                  <motion.path
                    key={`p-${cycle}-${i}`}
                    d={edge.d}
                    fill="none"
                    stroke="rgba(255,255,255,0.95)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathOffset: 0, pathLength: 0.13, opacity: 1 }}
                    animate={{ pathOffset: 1, opacity: [1, 1, 0] }}
                    transition={{
                      pathOffset: { duration: 0.72, ease: "easeIn" },
                      opacity: { duration: 0.72, times: [0, 0.75, 1] },
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Node cards */}
        {DESKTOP_LAYOUT.map((node, index) => (
          <motion.div
            key={node.id}
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: reducedMotion ? 0 : index * 0.12 }}
            className={cn("absolute w-[42%] max-w-[14rem]", node.position)}
          >
            <NodeCard
              stepIndex={index}
              label={labels[index]}
              stepLabel={stepLabel}
              nodeState={getNodeState(phase, index)}
              reducedMotion={!!reducedMotion}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
