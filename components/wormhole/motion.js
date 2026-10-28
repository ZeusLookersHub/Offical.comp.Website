/* Lookers Hub Motion Kit v1.1 (optional rockSprites: asteroid images in place of crystal shards; motion unchanged)
 * The motion layer only: deep-space background, cursor, click/hover feedback, orbits, warp, text reveal.
 * The interface (layout, copy, components) is built separately on top of it.
 *
 *   <link rel="stylesheet" href="lookers-motion.css">
 *   <script src="lookers-motion.js"></script>
 *   <script>LookersMotion.init();</script>
 *
 * API (window.LookersMotion):
 *   init(opts)                  start the background + cursor + click effects. opts: { galaxies, asteroids, stars, meteors, cursor, clickFx, zIndex, rockSprites:[{src, pal}] }
 *   orbit(stage, items, opts)   move elements on an elliptical orbit. items: [{ el, ring:'outer'|'inner', size }]
 *                               returns { layout(), pause(bool), destroy() }
 *   burst(elOrPoint, n)         spark burst at an element's centre or {x,y}
 *   warp(dir)                   hyperspace streak; dir 1 = going in, -1 = coming back
 *   splitWords(el, text?)       word-by-word reveal; wrap a word in [brackets] to give it the gold shimmer
 *   reduced                     true when the viewer prefers reduced motion
 */
export function createMotion(root) {
  const global = window;
  const abort = new AbortController();
  let raf = 0,
    stopped = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!stopped) fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const listen = (target, type, fn) =>
    target.addEventListener(type, fn, { signal: abort.signal });
  const addEventListener = (type, fn) =>
    listen(type === "resize" ? window : root, type, fn);
  ("use strict");
  const reduced =
    global.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);

  const PALETTE = {
    void: "#05040c",
    gold: "#e3b866",
    goldLight: "#fff4d6",
    ice: "#bfe9ff",
    crystals: [
      ["#fff0bf", "#e9c46a", "#8a5f1e"], // gold
      ["#efe4ff", "#9b7bea", "#2b1760"], // amethyst
      ["#d5fbff", "#43c6d8", "#0b3a4a"], // ice
      ["#ffe1ec", "#e2588f", "#4a0d27"], // rose quartz
    ],
    nebulae: [
      { fx: 0.7, fy: 0.25, r: 0.45, c: "109,75,216", a: 0.2 },
      { fx: 0.15, fy: 0.8, r: 0.4, c: "31,182,201", a: 0.13 },
      { fx: 0.55, fy: 0.9, r: 0.35, c: "226,88,143", a: 0.1 },
      { fx: 0.35, fy: 0.35, r: 0.3, c: "227,184,102", a: 0.06 },
    ],
    galaxies: [
      {
        fx: 0.8,
        fy: 0.28,
        size: 0.42,
        hue: 265,
        arms: 2,
        tilt: 0.55,
        depth: 0.25,
      },
      {
        fx: 0.14,
        fy: 0.78,
        size: 0.3,
        hue: 190,
        arms: 3,
        tilt: 0.4,
        depth: 0.18,
      },
      {
        fx: 0.22,
        fy: 0.18,
        size: 0.14,
        hue: 330,
        arms: 2,
        tilt: 0.7,
        depth: 0.12,
      },
    ],
  };

  let cfg,
    cv,
    ctx,
    W,
    H,
    DPR,
    started = false;
  let stars = [],
    galaxies = [],
    rocks = [],
    sparks = [],
    meteors = [];
  let warpDir = 0,
    warpT = 0;
  const orbits = new Set();
  const mouse = { tx: 0, ty: 0, cx: 0, cy: 0, active: false };
  let cur, dot;
  let sprites = []; // optional asteroid images: [{ img, pal, glow }]

  /* ---------- builders ---------- */
  function makeGalaxy(size, hue, arms) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d"),
      r = size / 2;
    const cg = g.createRadialGradient(r, r, 0, r, r, r * 0.35);
    cg.addColorStop(0, `hsla(${hue + 30},90%,92%,.95)`);
    cg.addColorStop(0.4, `hsla(${hue},80%,70%,.35)`);
    cg.addColorStop(1, "transparent");
    g.fillStyle = cg;
    g.fillRect(0, 0, size, size);
    g.globalCompositeOperation = "lighter";
    const N = Math.round(size * 7);
    for (let i = 0; i < N; i++) {
      const arm = i % arms,
        t = Math.pow(Math.random(), 0.7),
        dist = t * r * 0.95;
      const ang =
        (arm / arms) * Math.PI * 2 +
        t * 4.2 +
        rand(-0.35, 0.35) * (1 - t * 0.5);
      const x = r + Math.cos(ang) * dist + rand(-6, 6) * t,
        y = r + Math.sin(ang) * dist + rand(-6, 6) * t;
      g.fillStyle = `hsla(${hue + rand(-30, 40) + (t > 0.5 ? 40 : 0)},80%,${rand(65, 90)}%,${(1 - t) * 0.55 + 0.08})`;
      const s = Math.random() < 0.04 ? 1.8 : rand(0.4, 1.1);
      g.fillRect(x, y, s, s);
    }
    for (let i = 0; i < arms * 18; i++) {
      // dust haze along the arms
      const arm = i % arms,
        t = Math.random(),
        ang = (arm / arms) * Math.PI * 2 + t * 4.2,
        d = t * r * 0.85;
      const x = r + Math.cos(ang) * d,
        y = r + Math.sin(ang) * d;
      const hg = g.createRadialGradient(x, y, 0, x, y, r * 0.16);
      hg.addColorStop(0, `hsla(${hue + rand(-20, 60)},70%,60%,.07)`);
      hg.addColorStop(1, "transparent");
      g.fillStyle = hg;
      g.fillRect(x - r * 0.16, y - r * 0.16, r * 0.32, r * 0.32);
    }
    return c;
  }

  function makeRock() {
    // crystal shard: alternating long/short points, faceted from an off-centre core
    const sp = sprites.length
      ? sprites[Math.floor(Math.random() * sprites.length)]
      : null;
    const pal = sp
      ? PALETTE.crystals[sp.pal % PALETTE.crystals.length]
      : PALETTE.crystals[Math.floor(Math.random() * PALETTE.crystals.length)];
    const r = rand(10, Math.min(46, Math.max(22, Math.min(W, H) * 0.045)));
    const n = Math.floor(rand(6, 10)),
      pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.25, 0.25);
      const rr = r * (i % 2 ? rand(0.55, 0.75) : rand(0.9, 1.25));
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return {
      pts,
      r,
      pal,
      depth: rand(0.3, 1),
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-0.12, 0.12),
      vy: rand(-0.08, 0.08),
      rot: rand(0, 6.28),
      vr: rand(-0.006, 0.006),
      core: [rand(-r * 0.2, r * 0.2), rand(-r * 0.2, r * 0.2)],
      hover: 0,
      ox: 0,
      oy: 0,
      trail: Math.random() < 0.35,
      sprite: sp,
    };
  }

  function resize() {
    DPR = Math.min(global.devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    cv.width = W * DPR;
    cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const gs = Math.max(W, H);
    stars = cfg.stars
      ? Array.from({ length: Math.round((W * H) / 1800) }, () => ({
          x: rand(0, W),
          y: rand(0, H),
          z: rand(0.15, 1),
          tw: rand(0, 6.28),
          sp: rand(0.6, 2.4),
          hue: Math.random() < 0.15 ? rand(20, 50) : rand(200, 260),
        }))
      : [];
    galaxies = cfg.galaxies
      ? PALETTE.galaxies.map((gx) => {
          const size = Math.round(gs * gx.size);
          return Object.assign({}, gx, {
            img: makeGalaxy(size, gx.hue, gx.arms),
            px: size,
            rot: Math.random() * 6,
            speed: rand(0.00012, 0.00025) * (Math.random() < 0.5 ? -1 : 1),
          });
        })
      : [];
    rocks = cfg.asteroids
      ? Array.from({ length: W < 640 ? 7 : 13 }, makeRock)
      : [];
    orbits.forEach((o) => o.layout());
  }

  /* ---------- drawing ---------- */
  function drawRock(k) {
    if (k.sprite && k.sprite.ready) {
      // Asteroid image: same position, size, spin and hover as the crystal it replaces.
      const x = k.x + k.ox,
        y = k.y + k.oy,
        s = k.r * 2.2 * (1 + k.hover * 0.25);
      if (k.hover > 0.02) {
        // pre-made glow, no per-frame blur
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = k.hover * 0.9;
        ctx.drawImage(k.sprite.glow, x - s, y - s, s * 2, s * 2);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(k.rot);
      ctx.drawImage(k.sprite.img, -s / 2, -s / 2, s, s);
      ctx.restore();
      return;
    }
    const [hi, mid, lo] = k.pal;
    ctx.save();
    ctx.translate(k.x + k.ox, k.y + k.oy);
    ctx.rotate(k.rot);
    const s = 1 + k.hover * 0.25;
    ctx.scale(s, s);
    ctx.shadowColor = mid;
    ctx.shadowBlur = 10 + k.hover * 28;
    const light = -k.rot - 0.9,
      n = k.pts.length; // light stays top-left while the crystal spins
    for (let i = 0; i < n; i++) {
      const a = k.pts[i],
        b = k.pts[(i + 1) % n],
        mx = (a[0] + b[0]) / 2,
        my = (a[1] + b[1]) / 2;
      const facing = Math.cos(Math.atan2(my, mx) - light);
      const g = ctx.createLinearGradient(k.core[0], k.core[1], mx, my);
      if (facing > 0.3) {
        g.addColorStop(0, hi);
        g.addColorStop(1, mid);
      } else if (facing > -0.3) {
        g.addColorStop(0, mid);
        g.addColorStop(1, lo);
      } else {
        g.addColorStop(0, lo);
        g.addColorStop(1, PALETTE.void);
      }
      ctx.beginPath();
      ctx.moveTo(k.core[0], k.core[1]);
      ctx.lineTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      if (i === 0) ctx.shadowBlur = 0;
    }
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + k.hover * 0.5})`;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      ctx.moveTo(k.core[0], k.core[1]);
      ctx.lineTo(k.pts[i][0], k.pts[i][1]);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(k.pts[0][0], k.pts[0][1]);
    for (let i = 1; i <= n; i++) ctx.lineTo(k.pts[i % n][0], k.pts[i % n][1]);
    ctx.strokeStyle = `rgba(255,240,200,${0.45 + k.hover * 0.5})`;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    const sp = ctx.createRadialGradient(
      k.core[0],
      k.core[1],
      0,
      k.core[0],
      k.core[1],
      k.r * 0.5,
    );
    sp.addColorStop(0, `rgba(255,255,255,${0.5 + k.hover * 0.4})`);
    sp.addColorStop(1, "transparent");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = sp;
    ctx.beginPath();
    ctx.arc(k.core[0], k.core[1], k.r * 0.5, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  function shatter(k) {
    for (let i = 0; i < 26; i++) {
      const a = rand(0, 6.28),
        v = rand(1, 5);
      sparks.push({
        x: k.x,
        y: k.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 1,
        c: k.pal[Math.floor(rand(0, 2))],
        s: rand(2, 5),
        shard: true,
        rot: rand(0, 6),
        vr: rand(-0.2, 0.2),
      });
    }
    Object.assign(k, makeRock(), {
      x: Math.random() < 0.5 ? -60 : W + 60,
      y: rand(0, H),
    });
  }

  function clickAt(x, y) {
    for (const k of rocks)
      if (Math.hypot(k.x + k.ox - x, k.y + k.oy - y) < k.r * 1.2) {
        shatter(k);
        return;
      }
    for (let i = 0; i < 14; i++) {
      const a = rand(0, 6.28),
        v = rand(0.6, 3);
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 1,
        c: Math.random() < 0.6 ? PALETTE.gold : PALETTE.ice,
        s: rand(1, 2.4),
      });
    }
    for (const k of rocks) {
      // shockwave pushes nearby crystals
      const d = Math.hypot(k.x - x, k.y - y);
      if (d < 260 && d > 0) {
        const f = ((260 - d) / 260) * 3;
        k.vx += ((k.x - x) / d) * f;
        k.vy += ((k.y - y) / d) * f;
        k.vr += rand(-0.03, 0.03);
      }
    }
  }

  function burst(target, n = 40) {
    let x, y;
    if (target && target.getBoundingClientRect) {
      const r = target.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + Math.min(r.height, r.width) / 2;
    } else {
      x = target.x;
      y = target.y;
    }
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.28),
        v = rand(1, 6);
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 1,
        c: i % 3 ? PALETTE.gold : PALETTE.goldLight,
        s: rand(1.5, 3.5),
      });
    }
  }

  function warp(dir = 1) {
    warpDir = dir;
    warpT = 0;
  }

  let last = 0;
  function frame(now) {
    if (stopped) return;
    const dt = Math.min(48, now - (last || now)) / 16.67;
    last = now;
    if (document.hidden) {
      raf = requestAnimationFrame(frame);
      return;
    }
    mouse.cx += (mouse.tx - mouse.cx) * 0.18;
    mouse.cy += (mouse.ty - mouse.cy) * 0.18;
    if (cur) cur.style.transform = `translate3d(${mouse.cx}px,${mouse.cy}px,0)`;
    const px = mouse.cx / W - 0.5,
      py = mouse.cy / H - 0.5;
    if (warpDir) {
      warpT += 0.035 * dt;
      if (warpT >= 1) {
        warpDir = 0;
        warpT = 0;
      }
    }
    const warpAmt = warpDir ? Math.sin(warpT * Math.PI) : 0;
    const gs = Math.max(W, H);

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = "lighter";
    for (const nb of PALETTE.nebulae) {
      const x = nb.fx * W - px * 40,
        y = nb.fy * H - py * 40 + Math.sin(now / 6000 + nb.fx * 5) * 14,
        r = nb.r * gs;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${nb.c},${nb.a})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    for (const gx of galaxies) {
      if (!reduced) gx.rot += gx.speed * dt * 16.67 * (1 + warpAmt * 8);
      ctx.save();
      ctx.translate(
        gx.fx * W - px * 320 * gx.depth,
        gx.fy * H - py * 320 * gx.depth,
      );
      ctx.scale(1, gx.tilt);
      ctx.rotate(gx.rot);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(gx.img, -gx.px / 2, -gx.px / 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (const s of stars) {
      if (!reduced) s.tw += 0.03 * s.sp * dt;
      const a = 0.35 + Math.sin(s.tw) * 0.35 * s.z + 0.3 * s.z;
      let x = s.x - px * 60 * s.z,
        y = s.y - py * 60 * s.z;
      if (warpAmt) {
        x += (x - W / 2) * warpAmt * 0.5 * s.z;
        y += (y - H / 2) * warpAmt * 0.5 * s.z;
      }
      let boost = 0;
      if (mouse.active) {
        const d = Math.hypot(x - mouse.cx, y - mouse.cy);
        if (d < 120) boost = (120 - d) / 120;
      }
      ctx.fillStyle = `hsla(${s.hue},80%,${85 + boost * 15}%,${Math.min(1, a + boost * 0.6)})`;
      const sz = s.z * 1.6 + boost * 1.8;
      if (warpAmt > 0.05) {
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = sz * 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - (x - W / 2) * warpAmt * 0.12 * s.z,
          y - (y - H / 2) * warpAmt * 0.12 * s.z,
        );
        ctx.stroke();
      } else ctx.fillRect(x, y, sz, sz);
    }
    if (cfg.meteors && !reduced && Math.random() < 0.006 * dt) {
      const a = rand(0.3, 0.7);
      meteors.push({
        x: rand(W * 0.2, W * 1.1),
        y: rand(-40, H * 0.4),
        vx: -Math.cos(a) * 14,
        vy: Math.sin(a) * 14,
        life: 1,
      });
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life -= 0.016 * dt;
      const g = ctx.createLinearGradient(
        m.x,
        m.y,
        m.x - m.vx * 8,
        m.y - m.vy * 8,
      );
      g.addColorStop(0, `rgba(255,244,214,${Math.max(0, m.life)})`);
      g.addColorStop(1, "rgba(255,244,214,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 8, m.y - m.vy * 8);
      ctx.stroke();
      if (m.life <= 0) meteors.splice(i, 1);
    }

    ctx.globalCompositeOperation = "source-over";
    for (const k of rocks) {
      if (!reduced) {
        k.x += k.vx * dt * k.depth;
        k.y += k.vy * dt * k.depth;
        k.rot += k.vr * dt;
        k.vx *= 0.995;
        k.vy *= 0.995;
        k.vr = k.vr * 0.995 + (Math.sign(k.vr) || 1) * 0.00002;
        if (Math.abs(k.vx) < 0.05) k.vx += rand(-0.01, 0.01);
      }
      const m = k.r * 2;
      if (k.x < -m) k.x = W + m;
      if (k.x > W + m) k.x = -m;
      if (k.y < -m) k.y = H + m;
      if (k.y > H + m) k.y = -m;
      k.ox += (-px * 30 * k.depth - k.ox) * 0.06;
      k.oy += (-py * 30 * k.depth - k.oy) * 0.06;
      let target = 0;
      if (mouse.active) {
        const dx = k.x + k.ox - mouse.cx,
          dy = k.y + k.oy - mouse.cy,
          d = Math.hypot(dx, dy) || 1;
        if (d < k.r * 2.4) {
          target = 1;
          k.vr += 0.0015 * Math.sign(dx || 1);
        }
        if (d < 140) {
          k.vx += (dx / d) * 0.05;
          k.vy += (dy / d) * 0.05;
        }
      }
      k.hover += (target - k.hover) * 0.12;
      if (k.trail) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const sp = Math.hypot(k.vx, k.vy) + 0.2,
          x0 = k.x + k.ox,
          y0 = k.y + k.oy,
          x1 = x0 - (k.vx / sp) * k.r * 3,
          y1 = y0 - (k.vy / sp) * k.r * 3;
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, k.pal[1] + "55");
        g.addColorStop(1, "transparent");
        ctx.strokeStyle = g;
        ctx.lineWidth = k.r * 0.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.restore();
      }
      drawRock(k);
    }

    ctx.globalCompositeOperation = "lighter";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.965;
      p.vy *= 0.965;
      p.life -= 0.022 * dt;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      if (p.shard) {
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -p.s * 1.6);
        ctx.lineTo(p.s, 0);
        ctx.lineTo(0, p.s * 1.6);
        ctx.lineTo(-p.s, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.s * p.life), 0, 7);
        ctx.fill();
      }
      if (p.life <= 0) sparks.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    if (mouse.active) {
      const g = ctx.createRadialGradient(
        mouse.cx,
        mouse.cy,
        0,
        mouse.cx,
        mouse.cy,
        160,
      );
      g.addColorStop(0, "rgba(227,184,102,.10)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(mouse.cx - 160, mouse.cy - 160, 320, 320);
    }

    orbits.forEach((o) => o.tick(dt));
    if (!reduced) raf = requestAnimationFrame(frame);
  }

  /* ---------- orbits ---------- */
  function orbit(stage, items, opts = {}) {
    const o = Object.assign(
      {
        outer: [0.4, 0.36],
        inner: [0.62, 0.58],
        maxRx: 470,
        maxRy: 230,
        speed: 0.0009,
        startAngle: -Math.PI / 2,
        centerCards: false,
        innerSpeed: -1.4,
        depthScale: [0.82, 0.22],
        ringEls: true,
        pauseOnHover: true,
      },
      opts,
    );
    let angle = 0,
      paused = false,
      hover = false;
    let ringO, ringI;
    if (o.ringEls) {
      ringO = document.createElement("div");
      ringO.className = "lh-orbit";
      ringI = document.createElement("div");
      ringI.className = "lh-orbit lh-orbit--inner";
      stage.prepend(ringI);
      stage.prepend(ringO);
    }
    const onOver = (e) => {
      if (e.target.closest && items.some((it) => it.el.contains(e.target)))
        hover = true;
    };
    const onOut = (e) => {
      if (
        !e.relatedTarget ||
        !items.some((it) => it.el.contains(e.relatedTarget))
      )
        hover = false;
    };
    if (o.pauseOnHover) {
      stage.addEventListener("pointerover", onOver);
      stage.addEventListener("pointerout", onOut);
    }
    const labelObserver = new ResizeObserver(() => ctl.layout());
    const ctl = {
      layout() {
        const r = { width: stage.clientWidth, height: stage.clientHeight };
        const scale = o.depthScale[0] + o.depthScale[1];
        // Keep the recovered elliptical motion, limiting only radii that would
        // crop labels at another orbital angle or after a font has loaded.
        const halfWidth = Math.max(
          0,
          ...items.map((it) => (it.el.offsetWidth * scale) / 2),
        );
        const lowerExtent = Math.max(
          0,
          ...items.map(
            (it) =>
              (it.el.offsetHeight * (1 + scale)) / 2 -
              (o.centerCards
                ? it.el.offsetHeight
                : it.size || it.el.offsetHeight) /
                2,
          ),
        );
        const rx = Math.max(
            0,
            Math.min(
              r.width * o.outer[0],
              o.maxRx,
              r.width / 2 - halfWidth - 14,
            ),
          ),
          ry = Math.max(
            0,
            Math.min(
              r.height * o.outer[1],
              o.maxRy,
              r.height / 2 - lowerExtent - 14,
            ),
          );
        const rx2 = rx * o.inner[0],
          ry2 = ry * o.inner[1];
        if (ringO) {
          ringO.style.width = rx * 2 + "px";
          ringO.style.height = ry * 2 + "px";
        }
        if (ringI) {
          ringI.style.width = rx2 * 2 + "px";
          ringI.style.height = ry2 * 2 + "px";
          ringI.hidden = !items.some((it) => it.ring === "inner");
        }
        ["outer", "inner"].forEach((ring) => {
          const group = items.filter((it) => (it.ring || "outer") === ring);
          group.forEach((it, i) => {
            it.rx = ring === "outer" ? rx : rx2;
            it.ry = ring === "outer" ? ry : ry2;
            it.base =
              (i / group.length) * Math.PI * 2 +
              o.startAngle +
              (ring === "inner" ? Math.PI / group.length : 0);
            it.dir = ring === "outer" ? 1 : o.innerSpeed;
          });
        });
        ctl.place(r);
      },
      place(r = { width: stage.clientWidth, height: stage.clientHeight }) {
        items.forEach((it) => {
          const a = it.base + angle * it.dir;
          const x = r.width / 2 + Math.cos(a) * it.rx,
            y = r.height / 2 + Math.sin(a) * it.ry;
          const depth = (Math.sin(a) + 1) / 2;
          const size = o.centerCards
            ? it.el.offsetHeight
            : it.size || it.el.offsetHeight;
          it.el.style.transform = `translate(${x - it.el.offsetWidth / 2}px, ${y - size / 2}px) scale(${o.depthScale[0] + depth * o.depthScale[1]})`;
          it.el.style.zIndex = 3 + Math.round(depth * 10);
        });
      },
      tick(dt) {
        if (!paused && !hover && !reduced) angle += o.speed * dt;
        if (stage.offsetParent !== null) ctl.place();
      },
      pause(v = true) {
        paused = v;
      },
      destroy() {
        labelObserver.disconnect();
        orbits.delete(ctl);
        ringO && ringO.remove();
        ringI && ringI.remove();
        stage.removeEventListener("pointerover", onOver);
        stage.removeEventListener("pointerout", onOut);
      },
    };
    orbits.add(ctl);
    items.forEach((it) => labelObserver.observe(it.el));
    ctl.layout();
    return ctl;
  }

  /* ---------- text ---------- */
  function splitWords(el, text) {
    text = text == null ? el.textContent : text;
    el.textContent = "";
    text
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w, i) => {
        const s = document.createElement("span");
        s.className = "lh-word" + (/[\[\]]/.test(w) ? " lh-shimmer" : "");
        s.style.setProperty("--i", i);
        s.textContent = w.replace(/[\[\]]/g, "");
        el.appendChild(s);
        el.appendChild(document.createTextNode(" "));
      });
  }

  /* ---------- init ---------- */
  function init(opts = {}) {
    if (started) return api;
    started = true;
    cfg = Object.assign(
      {
        galaxies: true,
        asteroids: true,
        stars: true,
        meteors: true,
        cursor: true,
        clickFx: true,
        zIndex: 0,
        rockSprites: null,
      },
      opts,
    );
    if (cfg.rockSprites && cfg.rockSprites.length) {
      sprites = cfg.rockSprites.map((r) => {
        const sp = {
          img: new Image(),
          pal: r.pal || 0,
          ready: false,
          glow: document.createElement("canvas"),
        };
        const g = sp.glow;
        g.width = g.height = 64;
        const gc = g.getContext("2d"),
          mid = PALETTE.crystals[sp.pal % PALETTE.crystals.length][1];
        const rg = gc.createRadialGradient(32, 32, 0, 32, 32, 32);
        rg.addColorStop(0, mid + "aa");
        rg.addColorStop(0.45, mid + "33");
        rg.addColorStop(1, mid + "00");
        gc.fillStyle = rg;
        gc.fillRect(0, 0, 64, 64);
        sp.img.onload = () => {
          sp.ready = true;
          if (reduced && !stopped && ctx) frame(0);
        };
        sp.img.src = r.src;
        return sp;
      });
    }
    cv = document.createElement("canvas");
    cv.className = "lh-space";
    cv.setAttribute("aria-hidden", "true");
    cv.style.zIndex = cfg.zIndex;
    root.prepend(cv);
    ctx = cv.getContext("2d");
    mouse.tx = mouse.cx = innerWidth / 2;
    mouse.ty = mouse.cy = innerHeight / 2;
    const fine =
      global.matchMedia &&
      matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (cfg.cursor && fine && !reduced) {
      root.classList.add("lh-has-cursor");
      cur = document.createElement("div");
      cur.className = "lh-cursor";
      cur.setAttribute("aria-hidden", "true");
      dot = document.createElement("div");
      dot.className = "lh-cursor-dot";
      dot.setAttribute("aria-hidden", "true");
      root.append(cur, dot);
    }
    addEventListener("pointermove", (e) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      mouse.active = true;
      if (dot)
        dot.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
      if (cur)
        cur.classList.toggle(
          "is-hot",
          !!(
            e.target.closest &&
            e.target.closest(
              "button,a,[role=button],input,select,textarea,[data-lh-hot]",
            )
          ),
        );
    });
    addEventListener("pointerdown", (e) => {
      if (cur) cur.classList.add("is-down");
      if (!cfg.clickFx || reduced) return;
      const r = document.createElement("span");
      r.className = "lh-ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      root.appendChild(r);
      later(() => r.remove(), 800);
      clickAt(e.clientX, e.clientY);
    });
    addEventListener("pointerup", () => cur && cur.classList.remove("is-down"));
    addEventListener("pointerleave", () => {
      mouse.active = false;
    });
    let rT;
    addEventListener("resize", () => {
      clearTimeout(rT);
      rT = later(() => {
        resize();
        if (reduced) frame(0);
      }, 120);
    });
    resize();
    if (reduced) frame(0);
    else raf = requestAnimationFrame(frame);
    return api;
  }

  function destroy() {
    stopped = true;
    cancelAnimationFrame(raf);
    abort.abort();
    timers.forEach(clearTimeout);
    timers.clear();
    [...orbits].forEach((o) => o.destroy());
    sprites.forEach((s) => {
      s.img.onload = null;
      s.img.src = "";
    });
    [cv, cur, dot].forEach((n) => n && n.remove());
    root.querySelectorAll(".lh-ripple").forEach((n) => n.remove());
    root.classList.remove("lh-has-cursor");
    stars = [];
    galaxies = [];
    rocks = [];
    sparks = [];
    meteors = [];
    sprites = [];
  }
  const api = {
    init,
    orbit,
    burst,
    warp,
    splitWords,
    reduced,
    destroy,
    version: "1.1.0",
  };
  return api;
}
