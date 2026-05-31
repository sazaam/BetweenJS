# BetweenJS v0.9.8

A lightweight, high-performance JavaScript animation library for the browser. Tween any numeric property of any object — DOM elements, canvas objects, Three.js vectors, custom models — with a rich ease system, composable tweens, action tweens, and full CSS 3D transform interpolation.

**No dependencies. No build step. ~25 KB gzipped.**

---

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [Creating Tweens](#creating-tweens)
  - [Group Composition](#group-composition)
  - [Decorators](#decorators)
  - [Easing](#easing)
  - [Action Tweens](#action-tweens)
  - [Tween Lifecycle](#tween-lifecycle)
  - [Fluent Decorator API](#fluent-decorator-api)
  - [Global Controls](#global-controls)
  - [CSS Transform Interpolation](#css-transform-interpolation)
  - [Custom Mappers](#custom-mappers)
  - [Color](#color)
  - [Ticker System](#ticker-system)
- [Copy-Paste Examples](#copy-paste-examples)
- [Full API Table](#full-api-table)

---

## Quick Start

```javascript
// Animate an element's left from 0 to 500 over 2 seconds with Quad.easeOut
BJS.create({
  target: document.getElementById('box'),
  to: { left: 500 },
  time: 2,
  ease: Quad.easeOut
}).play();

// Same thing with the shortcut
BJS.to(document.getElementById('box'), { left: 500 }, 2, Quad.easeOut).play();
```

---

## Installation

BetweenJS is a single-file ES5 library. Include it with a `<script>` tag:

```html
<script src="betweenjs.js"></script>
```

On load it creates the global `BJS` (also `BTW` and `BetweenJS`). All classes (eases, tickers, etc.) are on `window`.

If you have a `require()` polyfill, it also exports via `module.exports`.

---

## Core Concepts

### Tweens

A **tween** animates a target object's properties from a source value to a destination value over time.

```javascript
var tw = BJS.create({
  target: myElement,      // DOM element, canvas object, anything
  from: { left: 0 },      // optional — if omitted, reads current value
  to:   { left: 500 },     // required
  time: 2,                 // seconds
  ease: Quad.easeOut,      // easing function
  onComplete: function(){ console.log('done!'); }
});
tw.play();
```

### The Render Loop

BetweenJS uses `requestAnimationFrame` via its own `EnterFrameTicker`. You never need to call a render loop — it starts automatically when the first tween plays.

### Targets

Any object with numeric properties works: DOM elements, canvas drawables, Three.js objects, plain JS objects, jQuery collections.

---

## API Reference

### Creating Tweens

#### `BJS.create(options)`

The universal tween factory. Returns a `Tween` (or a `ParallelTween` if targeting multiple objects).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `Element∣Array∣jQuery` | required | Target(s) to animate |
| `to` | `Object` | required | Destination property values |
| `from` | `Object` | current | Source property values |
| `time` | `Number` | `1` | Duration in seconds |
| `ease` | `Function` | `Linear.easeIn` | Easing function |
| `delay` | `Number` | `0` | Seconds to wait before starting |
| `repeat` | `Number` | `0` | Repeat count (0 = no repeat, -1 = infinite) |
| `onStart` | `Function` | — | `function()` — fires when tween starts |
| `onUpdate` | `Function` | — | `function()` — fires each frame |
| `onComplete` | `Function` | — | `function()` — fires when done |
| `onStop` | `Function` | — | `function()` — fires when stopped manually |
| `onPlay` | `Function` | — | `function()` — fires each time tween plays |
| `transform` | `Object` | — | GSAP-style transform shorthand (see [CSS Transform](#css-transform-interpolation)) |

**Examples:**

```javascript
// Basic
BJS.create({ target: el, to: { left: 500 }, time: 2 }).play();

// With from values
BJS.create({ target: el, from: { left: 0 }, to: { left: 500 }, time: 2 }).play();

// With transform
BJS.create({ target: el, transform: { translateX: 200, rotate: 45 }, time: 1.5 }).play();

// Multiple targets — automatically creates a ParallelTween
BJS.create({ target: [el1, el2, el3], to: { opacity: 0 }, time: 1 }).play();
```

#### `BJS.tween(target, to, from, time, ease)`

Positional shortcut. `to` and `from` are objects.

```javascript
BJS.tween(el, { left: 500, top: 300 }, { left: 0, top: 0 }, 2, Quad.easeOut).play();
```

#### `BJS.to(target, to, time, ease)`

Animate to destination values (reads current as source).

```javascript
BJS.to(el, { left: 500, top: 300 }, 2, Quad.easeOut).play();
```

#### `BJS.from(target, from, time, ease)`

Animate from source values to current values.

```javascript
BJS.from(el, { left: 500, opacity: 0 }, 2, Cubic.easeIn).play();
```

#### `BJS.apply(options)`

Set properties instantly without animation. Returns a one-frame tween.

```javascript
BJS.apply({ target: el, to: { opacity: 0.5 } });
```

#### `BJS.instant(target, properties)`

Immediately set properties on target. No tween created.

```javascript
BJS.instant(el, { opacity: 0, display: 'none' });
```

#### `BJS.bezier(target, to, from, cuepoints, time, ease)`

Animate along a bezier path defined by cuepoint arrays.

```javascript
BJS.bezier(
  el,
  { left: 800, top: 400 },           // destination
  { left: 100, top: 100 },           // source
  { left: [300, 500], top: [50, 300] }, // cuepoints (arrays of intermediate values)
  3, Quad.easeInOut
).play();
```

#### `BJS.bezierTo(target, to, cuepoints, time, ease)`

Bezier with auto-sourced current values.

#### `BJS.bezierFrom(target, from, cuepoints, time, ease)`

Bezier auto-targeted to current values.

#### `BJS.physical(target, to, from, ease)`

Tween with a Physical ease. The ease argument should be a Physical instance.

```javascript
BJS.physical(el, { left: 500 }, { left: 0 }, Physical.uniform(200, 60)).play();
```

#### `BJS.physicalTo(target, to, ease)`

Physical tween, source from current values.

#### `BJS.physicalFrom(target, from, ease)`

Physical tween, target from current values.

#### `BJS.physicalApply(target, to, from, ease, applyTime)`

Physical tween that applies + draws at a specific time without animating.

#### `BJS.stagger(targets, to, options)`

Animate multiple targets with staggered delay.

```javascript
BJS.stagger(
  document.querySelectorAll('.item'),
  { left: 500 },
  { time: 0.5, staggerDelay: 0.1, ease: Quad.easeOut }
).play();
```

Options accepts: `time`, `ease`, `from`, `staggerDelay`, `startDelay`, and all event handlers.

---

### Group Composition

#### `BJS.serial(tween1, tween2, ...)`

Play tweens one after another. Returns a `SerialTween`.

```javascript
BJS.serial(
  BJS.to(el, { left: 500 }, 1, Quad.easeOut),
  BJS.to(el, { top: 300 }, 1, Quad.easeOut),
  BJS.to(el, { left: 100, top: 100 }, 1, Quad.easeOut)
).play();
```

#### `BJS.serialTweens(array)`

Same as `serial()` but takes an array.

```javascript
var tweens = [
  BJS.to(el, { left: 500 }, 1),
  BJS.to(el, { top: 300 }, 1)
];
BJS.serialTweens(tweens).play();
```

#### `BJS.parallel(tween1, tween2, ...)`

Play tweens simultaneously. Returns a `ParallelTween`.

```javascript
BJS.parallel(
  BJS.to(el1, { left: 500 }, 2, Quad.easeOut),
  BJS.to(el2, { left: 500 }, 1.5, Cubic.easeInOut)
).play();
```

#### `BJS.parallelTweens(array)`

Same as `parallel()` but takes an array.

#### `BJS.timeline()`

Returns a fluent timeline builder.

```javascript
var tl = BJS.timeline();
tl.add(BJS.to(el, { left: 500 }, 1));
tl.add(BJS.to(el, { top: 300 }, 1));
tl.add(function(){ console.log('timeline done!'); });
tl.play();

// Properties: add(), play(), stop(), pause(), resume(),
// onComplete(cb), getDuration(), seek(time)
```

---

### Decorators

Decorators wrap a tween to modify its behavior. They can be chained.

#### `BJS.reverse(tween)`

Play the tween backwards.

```javascript
BJS.reverse(BJS.to(el, { left: 500 }, 2)).play();
```

#### `BJS.slice(tween, begin, end, isPercent)`

Play only a portion of the tween's timeline.

```javascript
// Play only the middle 50% of the timeline
BJS.slice(BJS.to(el, { left: 500 }, 2), 0.25, 0.75, true).play();

// Play from 0.5s to 1.5s
BJS.slice(BJS.to(el, { left: 500 }, 2), 0.5, 1.5).play();
```

#### `BJS.scale(tween, scaleFactor)`

Scale the tween's duration by a factor.

```javascript
// Make a 2s tween take 4s
BJS.scale(BJS.to(el, { left: 500 }, 2), 2).play();

// Make a 2s tween take 0.5s
BJS.scale(BJS.to(el, { left: 500 }, 2), 0.25).play();
```

#### `BJS.delay(tween, delay, postDelay)`

Add leading and/or trailing delay to a tween.

```javascript
// Wait 1s, then animate
BJS.delay(BJS.to(el, { left: 500 }, 2), 1).play();

// Wait 1s, animate, then wait 0.5s before signaling completion
BJS.delay(BJS.to(el, { left: 500 }, 2), 1, 0.5).play();
```

#### `BJS.repeat(tween, repeatCount)`

Repeat a tween a number of times. Use `-1` for infinite looping.

```javascript
// Repeat 3 times
BJS.repeat(BJS.to(el, { left: 500 }, 2), 3).play();

// Loop forever
BJS.repeat(BJS.to(el, { left: 500 }, 2), -1).play();
```

---

### Easing

BetweenJS includes 11 ease families, each with 4 variants.

#### Standard Eases

| Class | `easeIn` | `easeOut` | `easeInOut` | `easeOutIn` |
|-------|----------|-----------|-------------|-------------|
| `Linear` | Linear | Linear | Linear | Linear |
| `Quad` | Accelerate | Decelerate | Both | Center-peak |
| `Cubic` | ✦ | ✦ | ✦ | ✦ |
| `Quart` | ✦ | ✦ | ✦ | ✦ |
| `Quint` | ✦ | ✦ | ✦ | ✦ |
| `Sine` | ✦ | ✦ | ✦ | ✦ |
| `Expo` | ✦ | ✦ | ✦ | ✦ |
| `Circ` | ✦ | ✦ | ✦ | ✦ |
| `Back` | Overshoot | Overshoot | Both | Both |
| `Bounce` | ✦ | ✦ | ✦ | ✦ |
| `Elastic` | ✦ | ✦ | ✦ | ✦ |

```javascript
BJS.to(el, { left: 500 }, 2, Quad.easeOut).play();
BJS.to(el, { left: 500 }, 2, Cubic.easeInOut).play();
BJS.to(el, { left: 500 }, 2, Bounce.easeOut).play();
BJS.to(el, { left: 500 }, 2, Elastic.easeOut).play();
```

#### Parametric Eases

**Back** — adjust overshoot with `*With(s)`:

```javascript
Back.easeInWith(2);    // stronger overshoot
Back.easeOutWith(0.5); // milder overshoot
Back.easeInOutWith(1.5);
```

**Elastic** — adjust amplitude and period with `*With(a, p)`:

```javascript
Elastic.easeOutWith(1, 0.3);
Elastic.easeInWith(2, 0.5);
```

#### Physical Eases

Physical eases model real-world physics. They take velocity/acceleration values in **per-frame units at 60fps** (not per-second).

```javascript
// Constant velocity: 200 pixels per frame
Physical.uniform(200, 60);

// Constant acceleration: 50 px/frame², initial velocity 100 px/frame
Physical.accelerate(50, 100, 60);

// Exponential: grows by factor 1.1 per frame, threshold 0.01
Physical.exponential(1.1, 0.01, 60);
```

Physical eases auto-compute their duration — you don't pass a `time`:

```javascript
BJS.physical(el, { left: 500 }, { left: 0 }, Physical.uniform(200, 60)).play();
// Or via create:
BJS.create({
  target: el,
  to: { left: 500 },
  from: { left: 0 },
  ease: Physical.uniform(200, 60)
}).play();
```

**Physical classes:**

| Factory Method | Class | Description |
|---------------|-------|-------------|
| `Physical.uniform(v, fps)` | `PhysicalUniform` | Constant velocity |
| `Physical.accelerate(accel, iv, fps)` | `PhysicalAccelerate` | Constant acceleration |
| `Physical.exponential(factor, threshold, fps)` | `PhysicalExponential` | Exponential decay/growth |

#### `Custom.func(fn)`

Create a custom ease from a function `fn(t, b, c)` where `t` is time (0..duration), `b` is start value, `c` is change (end - start).

```javascript
var myEase = Custom.func(function(t, b, c){
  return b + c * Math.pow(t / this.time, 3);
});
BJS.to(el, { left: 500 }, 2, myEase).play();
```

---

### Action Tweens

Action tweens are tweens that perform side effects — calling functions, loading data, adding DOM children, etc. They can be used standalone or composed in `serial()`/`parallel()` chains where they block progression until complete.

**Important:** Action tweens created with `BJS.timeout()`, `BJS.interval()`, `BJS.func()`, and `BJS.load()` do **not** auto-play. Call `.play()` explicitly or nest in a serial/parallel chain.

#### `BJS.func(closure, params?, useRollback?, rollbackClosure?, rollbackParams?)`

Execute a function. Can include rollback logic. Good for callback-based sequencing in serial chains.

```javascript
// Standalone
BJS.func(function(){ console.log('hello!'); }).play();

// In a serial chain — fires between animations
BJS.serial(
  BJS.to(el, { left: 500 }, 1),
  BJS.func(function(){ console.log('midpoint!'); }),
  BJS.to(el, { left: 100 }, 1)
).play();

// With params
BJS.func(console.log, ['hello!']).play();
```

#### `BJS.timeout(duration, closure, params?)`

Fire a callback after `duration` seconds. Cached — use `BJS.clearTimeout(uid)` to cancel.

```javascript
BJS.timeout(2, function(){ console.log('2 seconds later'); }).play();

// In a serial chain — blocks for 2 seconds before next tween
BJS.serial(
  BJS.timeout(2, function(){ console.log('wait over'); }),
  BJS.to(el, { left: 500 }, 1)
).play();
```

#### `BJS.interval(duration, closure, params?)`

Fire a callback every `duration` seconds until `.clear()` is called. Cached.

```javascript
var count = 0;
var iv = BJS.interval(0.5, function(){
  count++;
  console.log('tick', count);
  if(count >= 5) BJS.clearInterval(iv);
});
iv.play();
```

#### `BJS.load(url, callback | options, params?)`

Load a resource via XHR. Blocks serial chains until done.

```javascript
// Simple
BJS.load('/data.json', function(data){ console.log(data); }).play();

// Options object
BJS.load('/data.json', {
  callback: function(data){ console.log(data); },
  nocache: true,
  postData: { key: 'value' }
}).play();

// In a serial chain — blocks until XHR completes
BJS.serial(
  BJS.load('/data.json', function(data){ window.mydata = data; }),
  BJS.to(el, { left: 500 }, 1)
).play();
```

#### `BJS.animationframe(closure, params?)`

Fire a callback every animation frame until `.clear()`.

```javascript
var af = BJS.animationframe(function(timestamp){
  el.style.transform = 'rotate(' + (timestamp * 60 % 360) + 'deg)';
});
af.play();
// Later: BJS.cancelanimationframe(af);
```

#### `BJS.addChild(target, parent)`

Append a DOM child on play, remove on stop/rollback.

#### `BJS.removeFromParent(target)`

Remove a DOM child on play, re-append on stop/rollback.

---

### Tween Lifecycle

Once you have a tween, control it with:

```javascript
var tw = BJS.to(el, { left: 500 }, 2);

tw.play();        // Start or resume
tw.pause();       // Pause at current position
tw.stop();        // Stop and teardown
tw.restart();     // Seek to 0 then play
tw.seek(1);       // Jump to 1 second (resets TickerListener)
tw.gotoAndPlay(0.5);  // Seek to 0.5s then play
tw.gotoAndStop(0.5);  // Seek to 0.5s then stop
tw.toggle();      // If playing → stop, else → play
tw.rewind();      // Seek to 0
```

### Fluent Decorator API

Decorators can be chained directly on a tween via prototype methods:

```javascript
BJS.to(el, { left: 500 }, 2)
  .reverse()
  .delay(0.3)
  .play();

BJS.to(el, { left: 500 }, 2)
  .repeat(3)
  .scale(0.5)    // each repeat is now 1s
  .play();
```

Available chain methods:

| Method | Description |
|--------|-------------|
| `.reverse()` | Run backwards |
| `.slice(begin, end, isPercent?)` | Play a portion |
| `.scale(factor)` | Scale duration |
| `.delay(delay, postDelay?)` | Add pre/post delay |
| `.repeat(count)` | Repeat N times (-1 = infinite) |
| `.then(onFulfilled)` | Callback on complete (returns `this`) |

---

### Global Controls

```javascript
BJS.pause();       // Halt ALL animation
BJS.resume();      // Resume ALL animation
BJS.isPlaying();   // Boolean — is the ticker running?
BJS.stopAll();     // Stop every active tween
BJS.clear();       // Stop all tweens, reset ticker
```

---

### CSS Transform Interpolation

BJS supports GSAP-style CSS transform animation with full 3D matrix decomposition and recomposition.

#### GSAP-Style Syntax

Wrap transforms in a `transform` object:

```javascript
BJS.to(el, {
  transform: { translateX: 200, rotate: 45 }
}, 2, Quad.easeOut).play();
```

Supported transform properties:

| Property | Type | Example |
|----------|------|---------|
| `translateX` | Number (px) | `translateX: 200` |
| `translateY` | Number (px) | `translateY: 100` |
| `translateZ` | Number (px) | `translateZ: 150` *(needs parent perspective — see below)* |
| `rotate` / `rotateZ` | Number (deg) | `rotate: 45` |
| `rotateX` | Number (deg) | `rotateX: 90` |
| `rotateY` | Number (deg) | `rotateY: 180` |
| `scaleX` | Number | `scaleX: 2` |
| `scaleY` | Number | `scaleY: 0.5` |
| `scaleZ` | Number | `scaleZ: 1.5` |
| `skewX` | Number (deg) | `skewX: 30` |

`rotate` and `rotateZ` are aliases — animating one keeps the other in sync.

#### Perspective

`translateZ` requires `perspective` on a parent element:

```css
#stage {
  perspective: 800px;
}
```

```javascript
BJS.to(el, { transform: { translateZ: 200, rotateY: 45 } }, 2).play();
```

#### Flat Syntax

You can also animate `transform` as a flat CSS property with string values:

```javascript
BJS.to(el, { transform: 'translateX(200px) rotate(45deg)' }, 2).play();
```

#### How It Works

Internally, BJS reads the current computed transform matrix via `getComputedStyle`, then decomposes it into individual components (`translateX`, `rotate`, `scaleX`, etc.) using matrix decomposition. Each component is interpolated independently, then recomposed into a CSS `transform` string every frame. This means you can start a transform tween on an element that already has transforms applied, and BJS correctly picks up the current state.

---

### Custom Mappers

The `PropertyMapper` system is what lets BJS know how to read and write properties on different target types. It includes built-in mappers for:

| Mapper | Properties | Behavior |
|--------|-----------|----------|
| `TRANSFORM_reg` | `transform` | CSS transform matrix decompose/interpolate/recompose |
| `ALL_reg` | everything else | Dash-conversion (`marginLeft` → `margin-left`), unit suffix support, relative values |
| `COLOR_reg` | `color`, `backgroundColor` | Color interpolation via `{r,g,b,a}` objects |
| `ALPHA_reg` | `alpha`, `opacity` | Cross-browser opacity with IE filter fallback |
| `SCROLL_reg` | `scrollLeft`, `scrollTop` | Window/element scroll position |

#### `::unit` Suffix

Force a CSS unit by appending `::unit` to the property name:

```javascript
BJS.to(el, { 'width::%': 50, 'left::px': 200 }, 1).play();
BJS.to(el, { 'font-size::em': 2.5 }, 1).play();
```

#### Relative Values with `$` Prefix

Prefix a value with `$` to make it relative to the current value:

```javascript
BJS.to(el, { left: '$100' }, 1).play();   // move 100px right from current
BJS.to(el, { left: '$-50' }, 1).play();   // move 50px left
```

---

### Color

Animate colors with the `Color` utility. Colors are interpolated as `{r,g,b,a}` objects internally.

```javascript
BJS.to(el, { backgroundColor: { r: 255, g: 0, b: 0 } }, 2).play();
BJS.to(el, { color: Color.toOBJ('#ff8800') }, 2).play();
```

**Color static methods:**

| Method | Description |
|--------|-------------|
| `Color.toOBJ(val)` | Any input → `{r,g,b,a}` |
| `Color.toSTR(val)` | Any input → `'rgb(r,g,b)'` |
| `Color.toHEX(val)` | Any input → `'#RRGGBB'` |
| `Color.toUINT(val)` | Any input → integer |
| `Color.safe(val, mode?)` | Clamp to valid range |
| `Color.RGBtoHSV(o)` | `{r,g,b,a}` → `{h,s,v,a}` |
| `Color.HSVtoRGB(o)` | `{h,s,v,a}` → `{r,g,b,a}` |
| `Color.HSLtoRGB(o)` | `{h,s,l,a}` → `{r,g,b,a}` |
| `Color.RGBtoHSL(o)` | `{r,g,b,a}` → `{h,s,l,a}` |
| `Color.HSVtoHSL(o)` | `{h,s,v,a}` → `{h,s,l,a}` |
| `Color.HSLtoHSV(o)` | `{h,s,l,a}` → `{h,s,v,a}` |

```javascript
var red = Color.toOBJ('#ff0000');  // { r:255, g:0, b:0, a:1 }
var rgb = Color.toSTR(red);        // 'rgb(255,0,0)'
var hex = Color.toHEX(red);        // '#ff0000'
```

---

### Ticker System

BJS has two ticker layers:

- **`AnimationTicker`** — the low-level `requestAnimationFrame` manager. Handles frame timing, FPS calculation, and the global render loop.
- **`EnterFrameTicker`** — manages the linked-list of active tween listeners. Each playing tween registers a `TickerListener` that receives `tick(time)` per frame.

You generally don't interact with the ticker directly, but these methods are available:

```javascript
AnimationTicker.start();      // Begin the rAF loop (auto-started on first tween)
AnimationTicker.stop();       // Stop the rAF loop
AnimationTicker.haltSystem(); // Emergency halt
AnimationTicker.restoreSystem(); // Restart after halt
```

The ticker uses a **padding sentinel** linked list technique. When a tween completes and removes itself during iteration, the ticker safely continues via padding fallback nodes.

---

## Copy-Paste Examples

### 1. Basic DOM Animation

```javascript
var el = document.getElementById('box');

// Move smoothly
BJS.to(el, { left: 500 }, 1.5, Quad.easeOut).play();

// Fade out
BJS.to(el, { opacity: 0 }, 1, Cubic.easeIn).play();

// Animate multiple properties at once
BJS.to(el, {
  left: 500,
  top: 300,
  width: 200,
  height: 200,
  opacity: 0.8
}, 2, Quart.easeOut).play();
```

### 2. Animation Sequence (Serial)

```javascript
var el = document.getElementById('box');

BJS.serial(
  BJS.to(el, { left: 500 }, 1, Quad.easeOut),
  BJS.to(el, { top: 300, backgroundColor: { r: 255, g: 0, b: 0 } }, 1, Quad.easeOut),
  BJS.to(el, { left: 100, top: 100 }, 1, Bounce.easeOut)
).play();
```

### 3. Parallel Animations (Multiple Elements)

```javascript
var el1 = document.getElementById('box1');
var el2 = document.getElementById('box2');

BJS.parallel(
  BJS.to(el1, { left: 500 }, 2, Quad.easeOut),
  BJS.to(el2, { top: 400 }, 1.5, Cubic.easeInOut)
).play();

// Or with an array target (auto-parallel)
BJS.create({
  target: [el1, el2],
  to: { opacity: 0 },
  time: 1.5
}).play();
```

### 4. Stagger Animation (Multiple Targets)

```javascript
var items = document.querySelectorAll('.item');

BJS.stagger(items, { left: 500 }, {
  time: 0.5,
  staggerDelay: 0.1,
  ease: Back.easeOut
}).play();
```

### 5. CSS Transform — 2D

```javascript
var el = document.getElementById('card');

BJS.to(el, {
  transform: { translateX: 300, rotate: 180, scaleX: 1.5 }
}, 2, Elastic.easeOut).play();
```

### 6. CSS Transform — 3D with Perspective

```css
#stage { perspective: 800px; }
```

```javascript
var el = document.getElementById('card');

BJS.parallel(
  BJS.to(el, { transform: { translateZ: 200, rotateY: 90 } }, 2, Quad.easeOut),
  BJS.to(el, { opacity: 0.5 }, 2)
).play();
```

### 7. Fluent Chaining

```javascript
BJS.to(document.getElementById('box'), { left: 500 }, 2)
  .reverse()
  .delay(0.5)
  .repeat(2)
  .play();
```

### 8. Timeline

```javascript
var tl = BJS.timeline();
tl.add(BJS.to(el, { left: 300 }, 1));
tl.add(BJS.to(el, { top: 200 }, 1));
tl.add(function(){ console.log('done!'); });
tl.play();

// With delays between
var tl2 = BJS.timeline();
tl2.add(BJS.to(el, { left: 300 }, 1), 0.5); // 0.5s gap
tl2.add(BJS.to(el, { top: 200 }, 1));
tl2.play();
```

### 9. Action Tween in Serial Chain

```javascript
// Load data, then animate, then log
BJS.serial(
  BJS.load('/api/data.json', function(data){ window.data = data; }),
  BJS.to(el, { left: 500 }, 1, Quad.easeOut),
  BJS.func(function(){ console.log('animation done, data:', window.data); })
).play();

// Wait 2 seconds, then animate, then wait 1s, then animate back
BJS.serial(
  BJS.timeout(2, function(){ console.log('starting...'); }),
  BJS.to(el, { left: 500 }, 1, Bounce.easeOut),
  BJS.timeout(1),
  BJS.to(el, { left: 100 }, 1)
).play();
```

### 10. Repeating Interval Controlled

```javascript
var count = 0;
var iv = BJS.interval(0.3, function(){
  count++;
  el.style.left = (count * 50) + 'px';
  if(count >= 10) BJS.clearInterval(iv);
});
iv.play();
```

### 11. Physical Eases

```javascript
// Constant velocity — takes exactly as long as needed to travel 500px at 200px/frame
BJS.create({
  target: el,
  to: { left: 500 },
  from: { left: 0 },
  ease: Physical.uniform(200, 60)
}).play();

// Accelerating
BJS.create({
  target: el,
  to: { left: 500 },
  ease: Physical.accelerate(30, 0, 60)
}).play();
```

### 12. Color Animation

```javascript
BJS.to(el, {
  backgroundColor: { r: 255, g: 0, b: 0 },
  color: { r: 255, g: 255, b: 255 }
}, 2, Quad.easeOut).play();
```

### 13. `restart()` for Reusable Tweens

```javascript
var tw = BJS.to(el, { left: 500 }, 2, Bounce.easeOut);

document.getElementById('go-btn').onclick = function(){ tw.restart(); };
document.getElementById('pause-btn').onclick = function(){ tw.pause(); };
```

### 14. `stopAll()` on Page Navigation

```javascript
// Single-page app navigation
function navigate(url) {
  BJS.stopAll();  // kill all running animations
  // ... load new page ...
}
```

### 15. Bezier Path

```javascript
BJS.bezierTo(
  el,
  { left: 800, top: 400 },
  { left: [300, 500, 600], top: [50, 300, 100] },
  3,
  Quad.easeInOut
).play();
```

---

## Full API Table

### `BJS` (a.k.a. `BetweenJS`, `BTW`) — Static Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `create(opts)` | `TweenLike` | Universal factory |
| `tween(tg, to, from, time, ease)` | `Tween` | Positional tween |
| `to(tg, to, time, ease)` | `Tween` | Target to values |
| `from(tg, from, time, ease)` | `Tween` | From values to current |
| `apply(opts)` | `Tween` | Instant apply (one frame) |
| `instant(tg, props)` | — | Immediate set |
| `bezier(tg, to, from, cp, time, ease)` | `Tween` | Bezier path |
| `bezierTo(tg, to, cp, time, ease)` | `Tween` | Bezier (auto-source) |
| `bezierFrom(tg, from, cp, time, ease)` | `Tween` | Bezier (auto-target) |
| `physical(tg, to, from, ease)` | `Tween` | Physical ease tween |
| `physicalTo(tg, to, ease)` | `Tween` | Physical (auto-source) |
| `physicalFrom(tg, from, ease)` | `Tween` | Physical (auto-target) |
| `physicalApply(tg, to, from, ease, t)` | `Tween` | Physical instant apply |
| `serial(...tweens)` | `SerialTween` | Sequential composition |
| `serialTweens(array)` | `SerialTween` | Sequential from array |
| `parallel(...tweens)` | `ParallelTween` | Parallel composition |
| `parallelTweens(array)` | `ParallelTween` | Parallel from array |
| `reverse(tween)` | `ReversedTween` | Decorator: reverse |
| `slice(tween, begin, end, isPercent?)` | `SlicedTween` | Decorator: slice |
| `scale(tween, factor)` | `ScaledTween` | Decorator: scale time |
| `delay(tween, delay, postDelay?)` | `DelayedTween` | Decorator: delay |
| `repeat(tween, count?)` | `RepeatedTween` | Decorator: repeat |
| `stagger(targets, to, opts)` | `ParallelTween` | Staggered animation |
| `timeline()` | `TimelineBuilder` | Fluent timeline |
| `func(fn, params?, rollback?, ...)` | `FunctionAction` | Action: execute func |
| `timeout(dur, fn, params?)` | `TimeoutAction` | Action: delayed callback |
| `interval(dur, fn, params?)` | `IntervalAction` | Action: repeating callback |
| `load(url, cb\|opts, params?)` | `LoadAction` | Action: XHR load |
| `animationframe(fn, params?)` | `AnimationFrameAction` | Action: per-frame callback |
| `addChild(tg, parent)` | `AddChildAction` | Action: append DOM |
| `removeFromParent(tg)` | `RemoveFromParentAction` | Action: remove DOM |
| `clearTimeout(uid)` | — | Cancel timeout |
| `clearInterval(uid)` | — | Cancel interval |
| `clearLoad(uid)` | — | Cancel load |
| `cancelanimationframe(uid)` | — | Cancel anim frame |
| `pause()` | — | Halt all animation |
| `resume()` | — | Resume all animation |
| `isPlaying()` | `Boolean` | Check if ticker is running |
| `clean()` | — | Stop all, reset ticker |
| `stopAll()` | — | Stop every active tween |
| `restart(tween)` | — | Stop → seek(0) → play |

### `AbstractTween` — Prototype Methods

| Method | Description |
|--------|-------------|
| `play()` | Start or resume |
| `stop()` | Stop and teardown |
| `restart()` | Seek(0) → play |
| `pause()` | Pause at current position |
| `toggle()` | Play ↔ stop |
| `start()` | Rewind → play |
| `seek(pos, isPercent?)` | Jump to position |
| `gotoAndPlay(pos, isPercent?)` | Seek → play |
| `gotoAndStop(pos, isPercent?)` | Seek → stop |
| `rewind()` | Seek to 0 |
| `reverse()` | Return ReversedTwen (fluent) |
| `slice(begin, end, isPercent?)` | Alt `SlicedTween` (fluent) |
| `scale(factor)` | Return `ScaledTween` (fluent) |
| `delay(delay, postDelay?)` | Return `DelayedTween` (fluent) |
| `repeat(count)` | Return `RepeatedTween` (fluent) |
| `then(onFulfilled)` | Register onComplete callback |
| `configure(opts)` | Set options |
| `bind(type, fn)` | Register event handler |
| `unbind(type, fn)` | Unregister event handler |
| `fire(type)` | Fire event |
| `clone()` | Deep copy |
| `destroy()` | Clean up |

### Ease Access

| Expression | Value |
|---|---|
| `Linear.easeIn` | Linear function |
| `Linear.easeOut` | `= Linear.easeIn` (identity) |
| `Quad.easeIn` | Quadratic acceleration |
| `Quad.easeOut` | Quadratic deceleration |
| `Quad.easeInOut` | Both (S-curve) |
| `Cubic.easeIn` | Cubic acceleration |
| `Back.easeInWith(s)` | Back with custom overshoot |
| `Elastic.easeOutWith(a, p)` | Elastic with custom amplitude/period |
| `Physical.uniform(v, fps)` | Constant velocity |
| `Physical.accelerate(a, iv, fps)` | Constant acceleration |
| `Physical.exponential(f, t, fps)` | Exponential growth/decay |
| `Custom.func(fn)` | Custom ease function |

### Event Types

| Event | Fires When |
|-------|-----------|
| `onStart` | Tween begins |
| `onPlay` | Each time tween plays (including re-plays) |
| `onUpdate` | Every frame (during animation) |
| `onDraw` | Every frame (after property update) |
| `onStop` | Tween stopped manually |
| `onComplete` | Tween reaches end |

```javascript
BJS.create({
  target: el,
  to: { left: 500 },
  time: 2,
  onStart:    function(){ console.log('start'); },
  onUpdate:   function(){ console.log('updating...'); },
  onComplete: function(){ console.log('complete!'); }
}).play();
```
