import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  ACTIONS,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLES,
  OBSTACLE_CENTERS,
  OBSTACLE_H,
  OBSTACLE_W,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_H,
  PADDLE_HALF,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PADDLE_W,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";

export type Mode = "solo" | "versus";

export type Side = "left" | "right";

export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}

export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}

export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}

export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}

export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}

export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";

  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;

  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;

  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];

  readonly simTime: number;
  readonly muted: boolean;
}

export interface MenuRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface CaromSnapshot {
  readonly version: number;
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly muted: boolean;
  readonly paddles: {
    readonly left: PaddleState;
    readonly right: PaddleState;
  };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: (BallState & { readonly speed: number }) | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
}

export interface CaromDebugApi {
  readonly version: number;
  clearWorld(state: DeepReadonly<CaromState>): CaromState;
  spawnBall(state: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(state: DeepReadonly<CaromState>, index: number): CaromState;
  reset(state: DeepReadonly<CaromState>): CaromState;
  reconcile(state: DeepReadonly<CaromState>): CaromState;
  setScreen(state: DeepReadonly<CaromState>, screen: Screen): CaromState;
  setMode(state: DeepReadonly<CaromState>, mode: Mode): CaromState;
  setMenuIndex(state: DeepReadonly<CaromState>, index: number): CaromState;
  setTitleIndex(state: DeepReadonly<CaromState>, index: number): CaromState;
  setResumeScreen(
    state: DeepReadonly<CaromState>,
    screen: "countdown" | "playing",
  ): CaromState;
  setScore(state: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(state: DeepReadonly<CaromState>, side: Side | null): CaromState;
  setReceiver(state: DeepReadonly<CaromState>, side: Side): CaromState;
  setPaddleCy(
    state: DeepReadonly<CaromState>,
    side: Side,
    cy: number,
  ): CaromState;
  setPaddleVy(
    state: DeepReadonly<CaromState>,
    side: Side,
    vy: number,
  ): CaromState;
  setPaddleDriven(
    state: DeepReadonly<CaromState>,
    side: Side,
    driven: boolean,
  ): CaromState;
  setBallPosition(
    state: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    state: DeepReadonly<CaromState>,
    vx: number,
    vy: number,
  ): CaromState;
  setBallSpin(state: DeepReadonly<CaromState>, spin: number): CaromState;
  setBallHeld(state: DeepReadonly<CaromState>, held: boolean): CaromState;
  setBallHoldTimer(
    state: DeepReadonly<CaromState>,
    seconds: number,
  ): CaromState;
  setBallServeSign(state: DeepReadonly<CaromState>, sign: 1 | -1): CaromState;
  drawBallServeSign(state: DeepReadonly<CaromState>): CaromState;
  setAiTracking(state: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setAiMovement(state: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setMuted(state: DeepReadonly<CaromState>, muted: boolean): CaromState;
  snapshot(state: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(state: DeepReadonly<CaromState>, index: number): MenuRect | null;
}

export const BACKGROUND = "#0a0e1a";

const HOWTO_ITEM = "BACK";
const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));
const drawServeSign = (): 1 | -1 => (Math.random() < 0.5 ? 1 : -1);

function parkedBall(): BallState {
  return {
    x: FIELD_W / 2,
    y: FIELD_CY,
    vx: 0,
    vy: 0,
    spin: 0,
    held: true,
    holdTimer: HOLD_TIME,
    serveSign: drawServeSign(),
    trail: [],
  };
}

function bothObstacles(): ObstacleState[] {
  return OBSTACLE_CENTERS.map((c, index) => ({ index, cx: c.x, cy: c.y }));
}

function titleState(
  simTime: number,
  muted: boolean,
  titleIndex: number,
): CaromState {
  return {
    screen: "title",
    mode: "solo",
    menuIndex: titleIndex,
    titleIndex,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    paddles: {
      left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
      right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    },
    ai: { tracking: true, movement: true },
    receiver: "left",
    ball: parkedBall(),
    obstacles: bothObstacles(),
    simTime,
    muted,
  };
}

function menuCount(screen: Screen): number {
  switch (screen) {
    case "title":
      return TITLE_ITEMS.length;
    case "howto":
      return 1;
    case "paused":
      return PAUSE_ITEMS.length;
    case "matchover":
      return MATCHOVER_ITEMS.length;
    default:
      return 0;
  }
}

function menuItems(screen: Screen): readonly string[] {
  switch (screen) {
    case "title":
      return TITLE_ITEMS;
    case "howto":
      return [HOWTO_ITEM];
    case "paused":
      return PAUSE_ITEMS;
    case "matchover":
      return MATCHOVER_ITEMS;
    default:
      return [];
  }
}

export function menuRectFor(screen: Screen, index: number): MenuRect | null {
  const count = menuCount(screen);
  if (!Number.isInteger(index) || index < 0 || index >= count) return null;
  const w = 340;
  const h = 54;
  const x = (FIELD_W - w) / 2;
  let top = 360;
  if (screen === "title") top = 372;
  else if (screen === "howto") top = 576;
  else if (screen === "paused") top = 304;
  else if (screen === "matchover") top = 396;
  return { x, y: top + index * 70, w, h };
}

function requireBall(state: DeepReadonly<CaromState>): DeepReadonly<BallState> {
  if (!state.ball) throw new Error("Carom: no ball on the field");
  return state.ball;
}

function withBall(
  state: DeepReadonly<CaromState>,
  ball: BallState,
): CaromState {
  return { ...(state as CaromState), ball };
}

function withPaddle(
  state: DeepReadonly<CaromState>,
  side: Side,
  paddle: PaddleState,
): CaromState {
  const s = state as CaromState;
  return {
    ...s,
    paddles:
      side === "left"
        ? { left: paddle, right: s.paddles.right }
        : { left: s.paddles.left, right: paddle },
  };
}

const debug: CaromDebugApi = {
  version: CAROM_DEBUG_VERSION,
  clearWorld: (state) => ({
    ...(state as CaromState),
    ball: null,
    obstacles: [],
  }),
  spawnBall: (state) => withBall(state, parkedBall()),
  spawnObstacle: (state, index) => {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= OBSTACLE_CENTERS.length
    ) {
      throw new Error(`Carom: no obstacle with index ${index}`);
    }
    const center = OBSTACLE_CENTERS[index];
    if (!center) throw new Error(`Carom: no obstacle with index ${index}`);
    const present = new Map(state.obstacles.map((o) => [o.index, o]));
    present.set(index, { index, cx: center.x, cy: center.y });
    return {
      ...(state as CaromState),
      obstacles: [...present.values()].sort((a, b) => a.index - b.index),
    };
  },
  reset: (state) => titleState(0, state.muted, 0),
  reconcile: (state) => ({ ...(state as CaromState) }),
  setScreen: (state, screen) => ({ ...(state as CaromState), screen }),
  setMode: (state, mode) => ({ ...(state as CaromState), mode }),
  setMenuIndex: (state, index) => ({
    ...(state as CaromState),
    menuIndex: index,
  }),
  setTitleIndex: (state, index) => ({
    ...(state as CaromState),
    titleIndex: index,
  }),
  setResumeScreen: (state, screen) => ({
    ...(state as CaromState),
    resumeScreen: screen,
  }),
  setScore: (state, p1, p2) => ({
    ...(state as CaromState),
    score: { p1, p2 },
  }),
  setWinner: (state, winner) => ({ ...(state as CaromState), winner }),
  setReceiver: (state, receiver) => ({ ...(state as CaromState), receiver }),
  setPaddleCy: (state, side, cy) =>
    withPaddle(state, side, {
      ...(side === "left" ? state.paddles.left : state.paddles.right),
      cy,
    }),
  setPaddleVy: (state, side, vy) =>
    withPaddle(state, side, {
      ...(side === "left" ? state.paddles.left : state.paddles.right),
      drivenVy: vy,
    }),
  setPaddleDriven: (state, side, driven) =>
    withPaddle(state, side, {
      ...(side === "left" ? state.paddles.left : state.paddles.right),
      driven,
    }),
  setBallPosition: (state, x, y) => {
    const ball = requireBall(state);
    return withBall(state, { ...ball, x, y });
  },
  setBallVelocity: (state, vx, vy) => {
    const ball = requireBall(state);
    return withBall(state, { ...ball, vx, vy });
  },
  setBallSpin: (state, spin) => {
    const ball = requireBall(state);
    return withBall(state, { ...ball, spin });
  },
  setBallHeld: (state, held) => {
    const ball = requireBall(state);
    return withBall(state, { ...ball, held });
  },
  setBallHoldTimer: (state, seconds) => {
    const ball = requireBall(state);
    return withBall(state, { ...ball, holdTimer: seconds });
  },
  setBallServeSign: (state, sign) => {
    const ball = requireBall(state);
    return withBall(state, { ...ball, serveSign: sign });
  },
  drawBallServeSign: (state) => {
    const ball = requireBall(state);
    return withBall(state, { ...ball, serveSign: drawServeSign() });
  },
  setAiTracking: (state, enabled) => ({
    ...(state as CaromState),
    ai: { tracking: enabled, movement: state.ai.movement },
  }),
  setAiMovement: (state, enabled) => ({
    ...(state as CaromState),
    ai: { tracking: state.ai.tracking, movement: enabled },
  }),
  setMuted: (state, muted) => ({ ...(state as CaromState), muted }),
  snapshot: (state) => ({
    version: CAROM_DEBUG_VERSION,
    screen: state.screen,
    mode: state.mode,
    menuIndex: state.menuIndex,
    titleIndex: state.titleIndex,
    resumeScreen: state.resumeScreen,
    score: { p1: state.score.p1, p2: state.score.p2 },
    winner: state.winner,
    muted: state.muted,
    paddles: {
      left: { ...state.paddles.left },
      right: { ...state.paddles.right },
    },
    ai: { ...state.ai },
    receiver: state.receiver,
    ball: state.ball
      ? {
          ...state.ball,
          trail: state.ball.trail.map((t) => ({ ...t })),
          speed: Math.hypot(state.ball.vx, state.ball.vy),
        }
      : null,
    obstacles: state.obstacles.map((o) => ({ ...o })),
    simTime: state.simTime,
  }),
  menuItemRect: (state, index) => menuRectFor(state.screen, index),
};

// Transient pointer press tracking, keyed by the immutable state value it
// belongs to. This keeps CaromState exactly as specified while still letting
// a press on one frame and a release on a later frame be recognised as one
// gesture (and lets two engines interleave without sharing this).
const pressStartByState = new WeakMap<object, number>();

function integratePaddle(
  paddle: PaddleState,
  vy: number,
  dt: number,
): PaddleState {
  const next = clamp(paddle.cy + vy * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  let actualVy = vy;
  if (next !== paddle.cy + vy * dt && dt > 0) {
    actualVy = (next - paddle.cy) / dt;
  }
  return { ...paddle, cy: next, vy: actualVy };
}

interface MutableBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
}

interface FrameEvents {
  paddle: boolean;
  wall: boolean;
  obstacle: boolean;
}

type RectFace = "left" | "right" | "top" | "bottom";

function rectFace(
  ball: MutableBall,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): RectFace | null {
  if (!(
    ball.x > x0 - BALL_R &&
    ball.x < x1 + BALL_R &&
    ball.y > y0 - BALL_R &&
    ball.y < y1 + BALL_R
  )) {
    return null;
  }
  const left = ball.x - (x0 - BALL_R);
  const right = x1 + BALL_R - ball.x;
  const top = ball.y - (y0 - BALL_R);
  const bottom = y1 + BALL_R - ball.y;
  const min = Math.min(left, right, top, bottom);
  if (min === left) return "left";
  if (min === right) return "right";
  if (min === top) return "top";
  return "bottom";
}

function resolveRectGeneric(
  ball: MutableBall,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  face: RectFace,
): void {
  if (face === "left") {
    ball.x = x0 - BALL_R;
    if (ball.vx > 0) ball.vx = -ball.vx;
  } else if (face === "right") {
    ball.x = x1 + BALL_R;
    if (ball.vx < 0) ball.vx = -ball.vx;
  } else if (face === "top") {
    ball.y = y0 - BALL_R;
    if (ball.vy > 0) ball.vy = -ball.vy;
  } else {
    ball.y = y1 + BALL_R;
    if (ball.vy < 0) ball.vy = -ball.vy;
  }
}

function stepBall(
  ballIn: DeepReadonly<BallState>,
  leftPaddle: PaddleState,
  rightPaddle: PaddleState,
  obstacles: readonly ObstacleState[],
  dt: number,
  events: FrameEvents,
): MutableBall {
  const ball: MutableBall = {
    x: ballIn.x,
    y: ballIn.y,
    vx: ballIn.vx,
    vy: ballIn.vy,
    spin: ballIn.spin,
  };
  const startSpeed = Math.hypot(ball.vx, ball.vy);
  const n = Math.max(1, Math.ceil((startSpeed * dt) / MAX_SUBSTEP));
  const h = dt / n;
  const sortedObstacles = [...obstacles].sort((a, b) => a.index - b.index);
  for (let i = 0; i < n; i++) {
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 0) {
      const angle = (ball.spin / speed) * h;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const nvx = ball.vx * cos - ball.vy * sin;
      const nvy = ball.vx * sin + ball.vy * cos;
      ball.vx = nvx;
      ball.vy = nvy;
    }
    ball.spin *= Math.pow(0.5, h / SPIN_HALFLIFE);
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;

    // Walls
    if (ball.y - BALL_R < 0 && ball.vy < 0) {
      ball.y = BALL_R;
      ball.vy = -ball.vy;
      events.wall = true;
    } else if (ball.y + BALL_R > FIELD_H && ball.vy > 0) {
      ball.y = FIELD_H - BALL_R;
      ball.vy = -ball.vy;
      events.wall = true;
    }

    // Paddles
    const paddles: {
      x0: number;
      x1: number;
      paddle: PaddleState;
      side: Side;
    }[] = [
      { x0: P1_X0, x1: P1_X1, paddle: leftPaddle, side: "left" },
      { x0: P2_X0, x1: P2_X1, paddle: rightPaddle, side: "right" },
    ];
    for (const p of paddles) {
      const y0 = p.paddle.cy - PADDLE_HALF;
      const y1 = p.paddle.cy + PADDLE_HALF;
      const face = rectFace(ball, p.x0, y0, p.x1, y1);
      if (!face) continue;
      if (face === "left" || face === "right") {
        const offset = clamp((ball.y - p.paddle.cy) / PADDLE_HALF, -1, 1);
        const theta = offset * MAX_BOUNCE_ANGLE;
        const contactSpeed = Math.hypot(ball.vx, ball.vy);
        const newSpeed = Math.min(contactSpeed * SPEED_MULT, SPEED_CAP);
        const dir = p.side === "left" ? 1 : -1;
        ball.vx = dir * newSpeed * Math.cos(theta);
        ball.vy = newSpeed * Math.sin(theta);
        ball.spin = clamp(
          ball.spin + p.paddle.vy * SPIN_FROM_PADDLE,
          -SPIN_CLAMP,
          SPIN_CLAMP,
        );
        ball.x = p.side === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R;
        events.paddle = true;
      } else {
        resolveRectGeneric(ball, p.x0, y0, p.x1, y1, face);
        events.wall = true;
      }
    }

    // Obstacles
    for (const obstacle of sortedObstacles) {
      const rect = OBSTACLES[obstacle.index];
      if (!rect) continue;
      const face = rectFace(ball, rect.x0, rect.y0, rect.x1, rect.y1);
      if (!face) continue;
      resolveRectGeneric(ball, rect.x0, rect.y0, rect.x1, rect.y1, face);
      events.obstacle = true;
    }
  }
  return ball;
}

function pruneTrail(
  trail: readonly TrailSample[],
  sample: TrailSample,
  simTime: number,
): TrailSample[] {
  const next = [...trail, sample];
  return next.filter((s) => simTime - s.t <= TRAIL_TIME);
}

function startMatch(
  state: DeepReadonly<CaromState>,
  mode: Mode,
  simTime: number,
  muted: boolean,
): CaromState {
  const s = state as CaromState;
  return {
    ...s,
    screen: "countdown",
    mode,
    menuIndex: 0,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    paddles: {
      left: { ...s.paddles.left, cy: FIELD_CY, vy: 0 },
      right: { ...s.paddles.right, cy: FIELD_CY, vy: 0 },
    },
    receiver: "left",
    ball: parkedBall(),
    simTime,
    muted,
  };
}

function returnToTitle(
  state: DeepReadonly<CaromState>,
  simTime: number,
  muted: boolean,
): CaromState {
  return { ...titleState(simTime, muted, state.titleIndex) };
}

function computePaddles(
  state: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
  screenForAi: Screen,
): { left: PaddleState; right: PaddleState } {
  const leftIn = state.paddles.left;
  const rightIn = state.paddles.right;

  let left: PaddleState;
  if (leftIn.driven) {
    left = integratePaddle(leftIn, leftIn.drivenVy, dt);
  } else {
    const up =
      state.mode === "solo"
        ? api.input.value("p1-up") > 0 || api.input.value("p2-up") > 0
          ? 1
          : 0
        : api.input.value("p1-up");
    const down =
      state.mode === "solo"
        ? api.input.value("p1-down") > 0 || api.input.value("p2-down") > 0
          ? 1
          : 0
        : api.input.value("p1-down");
    left = integratePaddle(leftIn, (down - up) * PADDLE_SPEED, dt);
  }

  let right: PaddleState;
  if (rightIn.driven) {
    right = integratePaddle(rightIn, rightIn.drivenVy, dt);
  } else if (state.mode === "versus") {
    const up = api.input.value("p2-up");
    const down = api.input.value("p2-down");
    right = integratePaddle(rightIn, (down - up) * PADDLE_SPEED, dt);
  } else {
    // Solo AI
    if (!state.ai.movement) {
      right = { ...rightIn, vy: 0 };
    } else {
      let target = AI_HOME_Y;
      let deadzone = AI_HOME_DEADZONE;
      if (
        state.ai.tracking &&
        screenForAi === "playing" &&
        state.ball &&
        state.ball.vx > 0
      ) {
        target = state.ball.y - state.ball.vy * AI_REACT;
        deadzone = AI_DEADZONE;
      }
      const diff = target - rightIn.cy;
      let vy = 0;
      if (Math.abs(diff) > deadzone) {
        vy =
          Math.sign(diff) *
          (dt > 0 ? Math.min(AI_SPEED, Math.abs(diff) / dt) : AI_SPEED);
      }
      right = integratePaddle(rightIn, vy, dt);
    }
  }
  return { left, right };
}

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>): [CaromState, CaromDebugApi] {
    for (const name of ACTIONS) {
      api.input.register(name, { keys: [...BINDINGS[name]] });
    }
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 240,
      freqTo: 150,
      durationMs: 70,
      gain: 0.18,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "sine",
      freq: 190,
      freqTo: 130,
      durationMs: 60,
      gain: 0.15,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "triangle",
      freq: 340,
      freqTo: 240,
      durationMs: 70,
      gain: 0.18,
    });
    api.audio.define(CUES.score, {
      wave: "square",
      freq: 620,
      freqTo: 980,
      durationMs: 170,
      gain: 0.16,
    });

    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("p1-score", (s) => s.score.p1);
    api.diagnostics.register("p2-score", (s) => s.score.p2);
    api.diagnostics.register("ball-x", (s) =>
      s.ball ? Number(s.ball.x.toFixed(1)) : "none",
    );
    api.diagnostics.register("ball-y", (s) =>
      s.ball ? Number(s.ball.y.toFixed(1)) : "none",
    );
    api.diagnostics.register("ball-vx", (s) =>
      s.ball ? Number(s.ball.vx.toFixed(1)) : "none",
    );
    api.diagnostics.register("ball-vy", (s) =>
      s.ball ? Number(s.ball.vy.toFixed(1)) : "none",
    );
    api.diagnostics.register("ball-speed", (s) =>
      s.ball ? Number(Math.hypot(s.ball.vx, s.ball.vy).toFixed(1)) : "none",
    );
    api.diagnostics.register("ball-spin", (s) =>
      s.ball ? Number(s.ball.spin.toFixed(1)) : "none",
    );
    api.diagnostics.register("paddle-left-cy", (s) =>
      Number(s.paddles.left.cy.toFixed(1)),
    );
    api.diagnostics.register("paddle-left-vy", (s) =>
      Number(s.paddles.left.vy.toFixed(1)),
    );
    api.diagnostics.register("paddle-right-cy", (s) =>
      Number(s.paddles.right.cy.toFixed(1)),
    );
    api.diagnostics.register("paddle-right-vy", (s) =>
      Number(s.paddles.right.vy.toFixed(1)),
    );

    return [titleState(0, false, 0), debug];
  },

  update(
    state: DeepReadonly<CaromState>,
    api: UpdateApi,
    dt: number,
  ): CaromState {
    const simTime = state.simTime + dt;
    const beginScreen = state.screen;

    const mutePressed = api.input.pressed("mute");
    let muted = state.muted;
    if (mutePressed) muted = !muted;
    if (api.audio.muted() !== muted) api.audio.setMuted(muted);

    // ---- Read edges for the screen we began on ----
    let upEdge = false;
    let downEdge = false;
    let confirmEdge = false;
    let backEdge = false;
    let pauseEdge = false;

    if (
      beginScreen === "title" ||
      beginScreen === "paused" ||
      beginScreen === "matchover"
    ) {
      const p1Up = api.input.pressed("p1-up");
      const p2Up = api.input.pressed("p2-up");
      const p1Down = api.input.pressed("p1-down");
      const p2Down = api.input.pressed("p2-down");
      upEdge = p1Up || p2Up;
      downEdge = p1Down || p2Down;
      confirmEdge = api.input.pressed("confirm");
      backEdge = api.input.pressed("back");
      if (beginScreen === "paused") pauseEdge = api.input.pressed("pause");
    } else if (beginScreen === "howto") {
      confirmEdge = api.input.pressed("confirm");
      backEdge = api.input.pressed("back");
    } else if (beginScreen === "countdown" || beginScreen === "playing") {
      pauseEdge = api.input.pressed("pause");
    }

    // Pointer samples are read once per frame (menu screens only use them).
    const samples = api.input.pointerSamples();
    const contacts = api.input.pointerContacts();
    const priorPress = pressStartByState.get(state as object);

    const isMenu =
      beginScreen === "title" ||
      beginScreen === "howto" ||
      beginScreen === "paused" ||
      beginScreen === "matchover";

    // Working copy of fields that transitions may change
    let working: CaromState = {
      ...(state as CaromState),
      simTime,
      muted,
    };

    let transitionedByKeyboardConfirm = false;
    let resumedFromPause = false;

    const doConfirm = (index: number, base: CaromState): CaromState => {
      if (beginScreen === "title") {
        const withTitle = { ...base, titleIndex: index };
        if (index === 0) return startMatch(withTitle, "solo", simTime, muted);
        if (index === 1) return startMatch(withTitle, "versus", simTime, muted);
        return { ...withTitle, screen: "howto", menuIndex: 0 };
      }
      if (beginScreen === "howto") {
        return returnToTitle(base, simTime, muted);
      }
      if (beginScreen === "paused") {
        if (index === 0) return { ...base, screen: base.resumeScreen };
        if (index === 1) return startMatch(base, base.mode, simTime, muted);
        return returnToTitle(base, simTime, muted);
      }
      if (beginScreen === "matchover") {
        if (index === 0) return startMatch(base, base.mode, simTime, muted);
        return returnToTitle(base, simTime, muted);
      }
      return base;
    };

    if (isMenu) {
      // Paused: pause/back resume before anything else.
      if (beginScreen === "paused" && (pauseEdge || backEdge)) {
        working = { ...working, screen: working.resumeScreen };
        resumedFromPause = true;
      } else if (beginScreen === "matchover" && backEdge) {
        working = returnToTitle(working, simTime, muted);
      } else if (beginScreen === "howto" && (confirmEdge || backEdge)) {
        working = returnToTitle(working, simTime, muted);
        transitionedByKeyboardConfirm = true;
      } else if (
        beginScreen === "title" &&
        backEdge &&
        !confirmEdge &&
        !upEdge &&
        !downEdge
      ) {
        // back does nothing on title; still fall through to pointer below
        // (keyboard handling is a no-op)
        // Pointer processing happens later using working as-is.
        // To allow that, do not mark anything.
        // (Handled by pointer section)
        // No keyboard confirm.
        // Note we still need movement/confirm handling, so re-evaluate:
        // Actually back alone shouldn't consume confirm etc; below block
        // would run if we didn't branch. Since edges are all false here
        // except back, falling to pointer is correct.
      } else {
        // Normal menu keyboard handling
        const count = menuCount(beginScreen);
        if (count > 0) {
          let idx = working.menuIndex;
          let moved = false;
          if (upEdge) {
            idx = (((idx - 1) % count) + count) % count;
            moved = true;
          } else if (downEdge) {
            idx = (idx + 1) % count;
            moved = true;
          }
          working = { ...working, menuIndex: idx };
          if (!moved && confirmEdge) {
            working = doConfirm(idx, working);
            transitionedByKeyboardConfirm = true;
          }
        }
      }

      // ---- Pointer / touch (after keyboard, unless keyboard confirmed or resumed) ----
      if (!transitionedByKeyboardConfirm && !resumedFromPause) {
        // Only if still on a menu screen (a back-to-title is also a menu,
        // but pointer was aimed at previous screen; skip if screen changed)
        if (working.screen === beginScreen) {
          const count = menuCount(beginScreen);
          let hoverIndex: number | null = null;
          let confirmIndex: number | null = null;
          const downById = new Map<number, number>();
          if (priorPress !== undefined) {
            // will be used on up without a down in this frame
          }
          for (const sample of samples) {
            let idx = -1;
            for (let i = 0; i < count; i++) {
              const r = menuRectFor(beginScreen, i);
              if (
                r &&
                sample.x >= r.x &&
                sample.x < r.x + r.w &&
                sample.y >= r.y &&
                sample.y < r.y + r.h
              ) {
                idx = i;
                break;
              }
            }
            if (sample.type === "down") {
              downById.set(sample.id, idx);
              if (idx >= 0) hoverIndex = idx;
            } else if (sample.type === "move") {
              if (idx >= 0) {
                if (sample.device === "touch") hoverIndex = idx;
                else if (sample.buttons.length === 0) hoverIndex = idx;
              }
            } else {
              // up
              const start = downById.has(sample.id)
                ? downById.get(sample.id)
                : priorPress;
              if (start !== undefined && start >= 0 && start === idx) {
                confirmIndex = idx;
              } else if (
                !downById.has(sample.id) &&
                priorPress === undefined &&
                idx >= 0 &&
                // A bare release with no recorded press this run: only
                // confirm when the released item is already selected,
                // which is the state a press on an earlier frame left via
                // hover selection — but samples for that press would
                // have recorded in pressStartByState, so this branch is
                // for engines whose samples start mid-gesture.
                idx === working.menuIndex &&
                api.input.pointerReleased()
              ) {
                confirmIndex = idx;
              }
              if (idx >= 0 && downById.has(sample.id)) {
                // release inside an item also selects it if press started there
                // (confirm path handles selection)
              }
            }
          }
          // Touch contacts travelling onto / landing on an item select it.
          for (const contact of contacts) {
            if (contact.device !== "touch") continue;
            for (let i = 0; i < count; i++) {
              const r = menuRectFor(beginScreen, i);
              if (
                r &&
                contact.x >= r.x &&
                contact.x < r.x + r.w &&
                contact.y >= r.y &&
                contact.y < r.y + r.h
              ) {
                hoverIndex = i;
                break;
              }
            }
          }

          // Track an unfinished press for later frames.
          let nextPress: number | undefined;
          // If a down happened and no up for that id, remember it.
          // Samples are in order; reconstruct: last down without up.
          const open = new Map<number, number>();
          for (const sample of samples) {
            if (sample.type === "down")
              open.set(
                sample.id,
                (() => {
                  for (let i = 0; i < count; i++) {
                    const r = menuRectFor(beginScreen, i);
                    if (
                      r &&
                      sample.x >= r.x &&
                      sample.x < r.x + r.w &&
                      sample.y >= r.y &&
                      sample.y < r.y + r.h
                    )
                      return i;
                  }
                  return -1;
                })(),
              );
            else if (sample.type === "up") open.delete(sample.id);
          }
          if (open.size > 0) {
            nextPress = [...open.values()][open.size - 1];
          } else if (
            priorPress !== undefined &&
            !samples.some((s) => s.type === "up")
          ) {
            nextPress = priorPress;
          }

          if (confirmIndex !== null) {
            working = { ...working, menuIndex: confirmIndex };
            working = doConfirm(confirmIndex, working);
          } else if (hoverIndex !== null) {
            working = { ...working, menuIndex: hoverIndex };
          }

          // Record press state against the state we will return (set later,
          // after advancement constructs the final object). Stash via a
          // temporary association with `working` may be replaced by final;
          // handled at return points below by helper.
          // Store on working for now and transfer at end.
          if (nextPress !== undefined) {
            pressStartByState.set(working as object, nextPress);
            // Marker transferred at end via pendingPress variable.
            pendingPress = nextPress;
            pendingPressSource = working as object;
          } else {
            pendingPress = undefined;
            pendingPressSource = null;
          }
        }
      }
    } else if (beginScreen === "countdown" || beginScreen === "playing") {
      if (pauseEdge) {
        working = {
          ...working,
          resumeScreen: beginScreen,
          screen: "paused",
          menuIndex: 0,
        };
      }
    }

    // helper closures for pending press transfer are declared below via vars
    // (hoisted var-like through function scope using let at bottom is not
    // possible, so pendingPress is handled by re-reading from working)
    // -- Advance the screen the input left us on --
    const finalState = advanceScreen(working, state, api, dt, simTime);

    // Transfer pending press association to final state object.
    const pending = pressStartByState.get(working as object);
    if (pending !== undefined && finalState !== (working as unknown)) {
      // Only keep if the gesture is still open: check final samples had no up
      // We stored pendingPress above; if it is set, propagate.
      if (pendingPress !== undefined) {
        pressStartByState.set(finalState as object, pendingPress);
      }
    } else if (pendingPress !== undefined && isMenu) {
      pressStartByState.set(finalState as object, pendingPress);
    }

    return finalState;

    function advanceScreen(
      current: CaromState,
      original: DeepReadonly<CaromState>,
      updateApi: UpdateApi,
      stepDt: number,
      now: number,
    ): CaromState {
      if (
        current.screen === "title" ||
        current.screen === "howto" ||
        current.screen === "matchover" ||
        current.screen === "paused"
      ) {
        return current;
      }
      if (current.screen === "countdown") {
        const paddles = computePaddles(
          {
            ...original,
            mode: current.mode,
            ai: current.ai,
            paddles: current.paddles,
            ball: current.ball,
            screen: original.screen,
          },
          updateApi,
          stepDt,
          current.screen,
        );
        // AI rule uses the ball/screen from original state for countdown
        // (home target) — computePaddles already used current.screen passed.
        if (!current.ball) {
          return { ...current, paddles };
        }
        const newHold = current.ball.holdTimer - stepDt;
        if (newHold <= 0) {
          const dir = current.receiver === "left" ? -1 : 1;
          const ball: BallState = {
            ...current.ball,
            holdTimer: 0,
            held: false,
            trail: [],
            vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
            vy: current.ball.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
          };
          return { ...current, paddles, ball, screen: "playing" };
        }
        const ball: BallState = {
          ...current.ball,
          holdTimer: newHold,
          trail: pruneTrail(
            current.ball.trail,
            { x: current.ball.x, y: current.ball.y, t: now },
            now,
          ),
        };
        return { ...current, paddles, ball };
      }
      // playing
      const baseForPaddles: DeepReadonly<CaromState> = {
        ...original,
        mode: current.mode,
        ai: current.ai,
        paddles: current.paddles,
        ball: current.ball,
      };
      const paddles = computePaddles(
        baseForPaddles,
        updateApi,
        stepDt,
        "playing",
      );
      if (!current.ball) {
        return { ...current, paddles };
      }
      const events: FrameEvents = {
        paddle: false,
        wall: false,
        obstacle: false,
      };
      const stepped = stepBall(
        current.ball,
        paddles.left,
        paddles.right,
        current.obstacles,
        stepDt,
        events,
      );
      if (events.paddle) updateApi.audio.play(CUES.paddleHit);
      if (events.wall) updateApi.audio.play(CUES.wallBounce);
      if (events.obstacle) updateApi.audio.play(CUES.obstacleBounce);

      let trail = pruneTrail(
        current.ball.trail,
        { x: stepped.x, y: stepped.y, t: now },
        now,
      );

      const scoredP1 = stepped.x - BALL_R > FIELD_W;
      const scoredP2 = stepped.x + BALL_R < 0;
      if (scoredP1 || scoredP2) {
        updateApi.audio.play(CUES.score);
        const p1 = current.score.p1 + (scoredP1 ? 1 : 0);
        const p2 = current.score.p2 + (scoredP2 ? 1 : 0);
        const scorer: Side = scoredP1 ? "left" : "right";
        const wins =
          (p1 >= WIN_SCORE && p1 - p2 >= WIN_LEAD) ||
          (p2 >= WIN_SCORE && p2 - p1 >= WIN_LEAD);
        if (wins) {
          const ball: BallState = {
            ...current.ball,
            x: stepped.x,
            y: stepped.y,
            vx: stepped.vx,
            vy: stepped.vy,
            spin: stepped.spin,
            trail,
          };
          return {
            ...current,
            paddles,
            ball,
            score: { p1, p2 },
            winner: scorer,
            screen: "matchover",
            menuIndex: 0,
          };
        }
        const receiver: Side = scoredP1 ? "right" : "left";
        const ball = parkedBall();
        trail = [];
        void trail;
        return {
          ...current,
          paddles,
          ball,
          score: { p1, p2 },
          receiver,
          screen: "countdown",
        };
      }

      const ball: BallState = {
        ...current.ball,
        x: stepped.x,
        y: stepped.y,
        vx: stepped.vx,
        vy: stepped.vy,
        spin: stepped.spin,
        trail,
      };
      return { ...current, paddles, ball };
    }
  },

  render(state: DeepReadonly<CaromState>, api: RenderApi): void {
    const ctx = api.ctx;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);

    const dimmed = state.screen === "title";
    drawField(state, ctx, dimmed);

    if (state.screen === "title") {
      ctx.fillStyle = "rgba(4,6,14,0.55)";
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "900 92px system-ui, sans-serif";
      ctx.fillText(TITLE_TEXT, FIELD_W / 2, 190);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 22px system-ui, sans-serif";
      ctx.fillText(
        "Spin the ball. Bank the shot. First to 11, win by 2.",
        FIELD_W / 2,
        252,
      );
      ctx.fillStyle = "#64748b";
      ctx.font = "500 18px system-ui, sans-serif";
      ctx.fillText(
        "W/S or ↑/↓ to move · Enter to select · P pause · M mute",
        FIELD_W / 2,
        292,
      );
      drawMenu(ctx, state.screen, state.menuIndex);
    } else if (state.screen === "howto") {
      ctx.fillStyle = "rgba(4,6,14,0.78)";
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 48px system-ui, sans-serif";
      ctx.fillText("HOW TO PLAY", FIELD_W / 2, 110);
      ctx.textAlign = "left";
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "500 24px system-ui, sans-serif";
      const lines = [
        "Solo: move the left paddle with W / S (or ↑ / ↓).",
        "Versus: left player W / S, right player ↑ / ↓.",
        "Move your paddle as it strikes the ball to add spin.",
        "Spin curves the ball in flight — bend it around obstacles.",
        "The two mid-field obstacles block and bank shots: use them.",
        "Score past your opponent. First to 11, win by 2, wins.",
        "P or Esc pauses · M mutes · Enter selects menus.",
      ];
      lines.forEach((line, i) => {
        ctx.fillText(line, 300, 190 + i * 48);
      });
      drawMenu(ctx, state.screen, state.menuIndex);
    } else if (state.screen === "paused") {
      ctx.fillStyle = "rgba(4,6,14,0.62)";
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 54px system-ui, sans-serif";
      ctx.fillText("PAUSED", FIELD_W / 2, 210);
      drawMenu(ctx, state.screen, state.menuIndex);
    } else if (state.screen === "matchover") {
      ctx.fillStyle = "rgba(4,6,14,0.55)";
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 56px system-ui, sans-serif";
      const winnerText =
        state.winner === "left"
          ? "LEFT WINS!"
          : state.winner === "right"
            ? "RIGHT WINS!"
            : "MATCH OVER";
      ctx.fillText(winnerText, FIELD_W / 2, 210);
      ctx.font = "700 44px system-ui, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(`${state.score.p1} — ${state.score.p2}`, FIELD_W / 2, 285);
      drawMenu(ctx, state.screen, state.menuIndex);
    } else if (state.screen === "countdown") {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(248,250,252,0.92)";
      ctx.font = "800 42px system-ui, sans-serif";
      const secs = state.ball
        ? Math.max(1, Math.ceil(state.ball.holdTimer))
        : 1;
      ctx.fillText(`GET READY · ${secs}`, FIELD_W / 2, 120);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 20px system-ui, sans-serif";
      ctx.fillText(
        state.receiver === "left" ? "Serve to the left" : "Serve to the right",
        FIELD_W / 2,
        156,
      );
    }
  },
};

// Variables used by update's pointer tracking. Declared at module level as
// plain `let` bindings reset every update; they hold no game state between
// frames except through the WeakMap keyed by state (see above).
let pendingPress: number | undefined;
let pendingPressSource: object | null = null;
void pendingPressSource;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function drawMenu(
  ctx: CanvasRenderingContext2D,
  screen: Screen,
  menuIndex: number,
): void {
  const items = menuItems(screen);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  items.forEach((item, i) => {
    const rect = menuRectFor(screen, i);
    if (!rect) return;
    const selected = i === menuIndex;
    ctx.fillStyle = selected ? "#facc15" : "rgba(30,41,59,0.92)";
    roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.fillStyle = selected ? "#111827" : "#e2e8f0";
    ctx.font = "700 24px system-ui, sans-serif";
    ctx.fillText(item, rect.x + rect.w / 2, rect.y + rect.h / 2);
  });
}

function drawField(
  state: DeepReadonly<CaromState>,
  ctx: CanvasRenderingContext2D,
  dimmed: boolean,
): void {
  ctx.save();
  if (dimmed) ctx.globalAlpha = 0.55;
  // Field border
  ctx.strokeStyle = "rgba(148,163,184,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, FIELD_W - 2, FIELD_H - 2);

  // Net
  ctx.strokeStyle = "rgba(226,232,240,0.45)";
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 14]);
  ctx.beginPath();
  ctx.moveTo(NET_X, 0);
  ctx.lineTo(NET_X, FIELD_H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Obstacles
  for (const obstacle of state.obstacles) {
    ctx.fillStyle = "#a855f7";
    roundRectPath(
      ctx,
      obstacle.cx - OBSTACLE_W / 2,
      obstacle.cy - OBSTACLE_H / 2,
      OBSTACLE_W,
      OBSTACLE_H,
      8,
    );
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    roundRectPath(
      ctx,
      obstacle.cx - 3,
      obstacle.cy - OBSTACLE_H / 2 + 10,
      6,
      OBSTACLE_H - 20,
      3,
    );
    ctx.fill();
  }

  // Scores + mode label during match-like screens
  if (state.screen !== "title" && state.screen !== "howto") {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 54px system-ui, sans-serif";
    ctx.fillStyle = "rgba(34,211,238,0.9)";
    ctx.fillText(String(state.score.p1), FIELD_W / 2 - 90, 52);
    ctx.fillStyle = "rgba(251,113,133,0.9)";
    ctx.fillText(String(state.score.p2), FIELD_W / 2 + 90, 52);
    ctx.font = "600 17px system-ui, sans-serif";
    ctx.fillStyle = "rgba(226,232,240,0.75)";
    ctx.fillText(
      state.mode === "solo" ? "SOLO" : "VERSUS",
      FIELD_W / 2,
      FIELD_H - 24,
    );
  }

  // Paddles
  ctx.fillStyle = "#22d3ee";
  roundRectPath(
    ctx,
    P1_X0,
    state.paddles.left.cy - PADDLE_HALF,
    PADDLE_W,
    PADDLE_H,
    7,
  );
  ctx.fill();
  ctx.fillStyle = "#fb7185";
  roundRectPath(
    ctx,
    P2_X0,
    state.paddles.right.cy - PADDLE_HALF,
    PADDLE_W,
    PADDLE_H,
    7,
  );
  ctx.fill();

  // Ball + trail
  if (state.ball) {
    const trail = state.ball.trail;
    if (trail.length > 1) {
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        if (!a || !b) continue;
        const f = i / trail.length;
        ctx.strokeStyle = `rgba(250,204,21,${(0.12 + 0.5 * f).toFixed(3)})`;
        ctx.lineWidth = 2 + 7 * f;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(state.ball.x - 3, state.ball.y - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
