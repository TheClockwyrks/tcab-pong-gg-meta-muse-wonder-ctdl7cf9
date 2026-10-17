import { createCanvas } from "@napi-rs/canvas";
import {
  ConstantClock,
  createEngine,
  type Engine,
  type SurfaceMetrics,
} from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import { FIELD_H, FIELD_W } from "./constants";
import { game, type CaromDebugApi, type CaromState } from "./game";

type Ev = { type: string; [key: string]: unknown };
type Listener = (event: Ev) => void;

class FakeTarget extends EventTarget {
  handlers = new Map<string, Listener[]>();
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
  ): void {
    const fn = listener as unknown as Listener;
    const list = this.handlers.get(type) ?? [];
    list.push(fn);
    this.handlers.set(type, list);
  }
  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
  ): void {
    const fn = listener as unknown as Listener;
    const list = this.handlers.get(type) ?? [];
    this.handlers.set(
      type,
      list.filter((h) => h !== fn),
    );
  }
  fire(type: string, props: Record<string, unknown>): void {
    const event = { type, ...props } as Ev;
    for (const handler of this.handlers.get(type) ?? []) handler(event);
  }
  key(code: string, down = true): void {
    this.fire(down ? "keydown" : "keyup", { code, repeat: false });
  }
  pointer(
    type: string,
    x: number,
    y: number,
    pointerType = "mouse",
    pointerId = 1,
  ): void {
    const buttonBit = type === "pointerup" ? 0 : 1;
    this.fire(type, {
      clientX: x,
      clientY: y,
      pointerId,
      pointerType,
      isPrimary: true,
      button: 0,
      buttons: buttonBit,
    });
  }
}

async function makeEngine(stepMs = 1000 / 120) {
  const canvas = createCanvas(FIELD_W, FIELD_H);
  const target = new FakeTarget();
  const surface: SurfaceMetrics = {
    cssWidth: () => FIELD_W,
    cssHeight: () => FIELD_H,
    dpr: () => 1,
    events: () => target,
    origin: () => ({ x: 0, y: 0 }),
  };
  const engine = createEngine({
    canvas: canvas as unknown as HTMLCanvasElement,
    width: FIELD_W,
    height: FIELD_H,
    game,
    background: "#0a0e1a",
    layout: "dual-vertical",
    clock: new ConstantClock(stepMs),
    surface,
  }) as Engine<CaromState, CaromDebugApi>;
  await engine.initialize();
  return { engine, target, debug: engine.debug };
}

function toPlaying(engine: Engine<CaromState, CaromDebugApi>): void {
  const d = engine.debug;
  engine.apply((s) => d.setScreen(s, "playing"));
  engine.apply((s) => d.setBallHeld(s, false));
}

describe("Carom", () => {
  it("starts on title with both obstacles and parked ball", async () => {
    const { engine, debug } = await makeEngine();
    const snap = debug.snapshot(engine.state);
    expect(snap.version).toBe(1);
    expect(snap.screen).toBe("title");
    expect(snap.ball?.held).toBe(true);
    expect(snap.ball?.x).toBe(640);
    expect(snap.obstacles).toHaveLength(2);
    expect(debug.menuItemRect(engine.state, 0)).not.toBeNull();
    expect(debug.menuItemRect(engine.state, 99)).toBeNull();
    engine.destroy();
  });

  it("serves after hold and moves ball", async () => {
    const { engine, debug } = await makeEngine();
    engine.apply((s) => debug.setScreen(s, "countdown"));
    // holdTimer is 1s; 120 steps at 1/120 = 1s
    await engine.advance(119);
    expect(debug.snapshot(engine.state).screen).toBe("countdown");
    await engine.advance(2);
    const snap = debug.snapshot(engine.state);
    expect(snap.screen).toBe("playing");
    expect(snap.ball?.held).toBe(false);
    expect(Math.abs(snap.ball?.speed ?? 0)).toBeGreaterThan(0);
    engine.destroy();
  });

  it("wall bounce reverses vy and paddle hit increases speed", async () => {
    const { engine, debug } = await makeEngine();
    toPlaying(engine);
    engine.apply((s) => debug.setBallPosition(s, 640, 20));
    engine.apply((s) => debug.setBallVelocity(s, 0, -400));
    await engine.advance(10);
    expect((debug.snapshot(engine.state).ball?.vy ?? 0) > 0).toBe(true);
    engine.apply((s) => debug.setBallPosition(s, 90, 360));
    engine.apply((s) => debug.setBallVelocity(s, -520, 0));
    engine.apply((s) => debug.setPaddleCy(s, "left", 360));
    await engine.advance(30);
    const snap = debug.snapshot(engine.state);
    expect((snap.ball?.vx ?? 0) > 0).toBe(true);
    expect(snap.ball?.speed).toBeCloseTo(520 * 1.04, 0);
    engine.destroy();
  });

  it("scores for left when ball passes right edge and parks", async () => {
    const { engine, debug } = await makeEngine();
    toPlaying(engine);
    engine.apply((s) => debug.setBallPosition(s, 1270, 100));
    engine.apply((s) => debug.setBallVelocity(s, 600, 0));
    await engine.advance(10);
    const snap = debug.snapshot(engine.state);
    expect(snap.score.p1).toBe(1);
    expect(snap.screen).toBe("countdown");
    expect(snap.receiver).toBe("right");
    engine.destroy();
  });

  it("win by two at 11 ends match", async () => {
    const { engine, debug } = await makeEngine();
    toPlaying(engine);
    engine.apply((s) => debug.setScore(s, 10, 9));
    engine.apply((s) => debug.setBallPosition(s, 1270, 100));
    engine.apply((s) => debug.setBallVelocity(s, 600, 0));
    await engine.advance(10);
    const snap = debug.snapshot(engine.state);
    expect(snap.screen).toBe("matchover");
    expect(snap.winner).toBe("left");
    engine.destroy();
  });

  it("driven paddle uses drivenVy on next frame", async () => {
    const { engine, debug } = await makeEngine();
    engine.apply((s) => debug.setScreen(s, "countdown"));
    engine.apply((s) => debug.setPaddleVy(s, "left", 300));
    engine.apply((s) => debug.setPaddleDriven(s, "left", true));
    await engine.advance(1);
    const snap = debug.snapshot(engine.state);
    expect(snap.paddles.left.vy).toBeCloseTo(300, 5);
    expect(snap.paddles.left.cy).toBeGreaterThan(360);
    engine.destroy();
  });

  it("spin curves ball", async () => {
    const { engine, debug } = await makeEngine();
    toPlaying(engine);
    engine.apply((s) => debug.setBallPosition(s, 640, 360));
    engine.apply((s) => debug.setBallVelocity(s, 400, 0));
    engine.apply((s) => debug.setBallSpin(s, 800));
    await engine.advance(20);
    expect((debug.snapshot(engine.state).ball?.vy ?? 0) > 5).toBe(true);
    engine.destroy();
  });

  it("debug world manipulation and errors", async () => {
    const { engine, debug } = await makeEngine();
    engine.apply((s) => debug.clearWorld(s));
    expect(debug.snapshot(engine.state).ball).toBeNull();
    expect(() => debug.setBallPosition(engine.state, 0, 0)).toThrow();
    engine.apply((s) => debug.spawnBall(s));
    engine.apply((s) => debug.spawnObstacle(s, 1));
    expect(debug.snapshot(engine.state).obstacles).toHaveLength(1);
    engine.apply((s) => debug.reset(s));
    expect(debug.snapshot(engine.state).obstacles).toHaveLength(2);
    expect(() => debug.spawnObstacle(engine.state, 7)).toThrow();
    engine.destroy();
  });

  it("keyboard menu navigation starts solo", async () => {
    const { engine, target, debug } = await makeEngine();
    target.key("Enter");
    await engine.advance(1);
    target.key("Enter", false);
    expect(debug.snapshot(engine.state).screen).toBe("countdown");
    expect(debug.snapshot(engine.state).mode).toBe("solo");
    expect(debug.snapshot(engine.state).titleIndex).toBe(0);
    engine.destroy();
  });

  it("pointer same-frame down/up on versus starts versus", async () => {
    const { engine, target, debug } = await makeEngine();
    const r = debug.menuItemRect(engine.state, 1);
    expect(r).not.toBeNull();
    if (!r) throw new Error("no rect");
    target.pointer("pointerdown", r.x + r.w / 2, r.y + r.h / 2);
    target.pointer("pointerup", r.x + r.w / 2, r.y + r.h / 2);
    await engine.advance(1);
    expect(debug.snapshot(engine.state).screen).toBe("countdown");
    expect(debug.snapshot(engine.state).mode).toBe("versus");
    engine.destroy();
  });

  it("trail records samples during play", async () => {
    const { engine, debug } = await makeEngine();
    toPlaying(engine);
    engine.apply((s) => debug.setBallPosition(s, 640, 360));
    engine.apply((s) => debug.setBallVelocity(s, 300, 0));
    await engine.advance(5);
    expect((debug.snapshot(engine.state).ball?.trail.length ?? 0) > 0).toBe(
      true,
    );
    engine.destroy();
  });

  it("obstacle bounce keeps speed", async () => {
    const { engine, debug } = await makeEngine();
    toPlaying(engine);
    engine.apply((s) => debug.setBallPosition(s, 460, 220));
    engine.apply((s) => debug.setBallVelocity(s, 400, 0));
    await engine.advance(10);
    const snap = debug.snapshot(engine.state);
    expect(snap.ball?.speed).toBeCloseTo(400, 0);
    expect((snap.ball?.vx ?? 0) < 0).toBe(true);
    engine.destroy();
  });

  it("is step-size independent for bounce outcomes", async () => {
    const a = await makeEngine(8);
    const b = await makeEngine(4);
    for (const ctx of [a, b]) {
      toPlaying(ctx.engine);
      ctx.engine.apply((s) => ctx.debug.setBallPosition(s, 300, 360));
      ctx.engine.apply((s) => ctx.debug.setBallVelocity(s, 520, 100));
      ctx.engine.apply((s) => ctx.debug.setPaddleCy(s, "right", 360));
    }
    await a.engine.advance(150); // 1.2s
    await b.engine.advance(300); // 1.2s
    const sa = a.debug.snapshot(a.engine.state);
    const sb = b.debug.snapshot(b.engine.state);
    expect(
      Math.abs((sa.ball?.speed ?? 0) - (sb.ball?.speed ?? 0)),
    ).toBeLessThan(10);
    expect(Math.sign(sa.ball?.vx ?? 0)).toBe(Math.sign(sb.ball?.vx ?? 0));
    a.engine.destroy();
    b.engine.destroy();
  });
});
