# Carom

A top-down paddle duel that runs entirely in the browser: two paddles face each
other across a dark field, a ball ricochets between them and off two mid-field
obstacles, and the motion of a paddle as it strikes the ball adds spin that curves
the ball's flight afterward.

![The title screen](title.png)

![A rally curving through the obstacles](rally.png)

## Install

```sh
npm ci
```

## Run in development

```sh
npm run dev
```

Then open the URL Vite prints in your browser.

## Production build

```sh
npm run build
```

This type-checks and emits the static site into `dist/` (`index.html` at its
root). Serve that directory as-is from any static file server, for example with
`npm run preview`.

## Controls

| Input | Action |
| --- | --- |
| `W` / `S` | Player one (left paddle) up / down |
| `ArrowUp` / `ArrowDown` | Player two (right paddle) up / down — in Solo these also move player one's paddle |
| `Enter` or `Space` | Confirm a menu item |
| `Escape` | Back / pause |
| `P` | Pause |
| `M` | Mute |

Menus can also be used with a mouse or touch: hover or touch an item to select
it, and press and release (or land and lift) inside it to confirm it. On a
touchscreen the engine shows a left and a right vertical slider for the two
paddles.

## How to play

- **Solo**: play the left paddle against the AI. **Versus**: two local players
  share the keyboard.
- Move your paddle as it hits the ball to add spin — down adds positive spin,
  up adds negative spin — and the ball curves while that spin decays.
- The two purple obstacles block straight shots and bank angled ones around
  the middle of the field.
- Score by getting the ball past the far edge behind your opponent. First to
  11 points, winning by at least 2, takes the match.

## Checks

```sh
npm run typecheck
npm run lint
npm run format
npm test
```
