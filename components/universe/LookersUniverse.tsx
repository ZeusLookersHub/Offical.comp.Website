import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CosmosScene, Projection } from './CosmosScene';
import { WORLDS, type WorldId } from './worlds';
import './LookersUniverse.css';

interface Props {
  lang: 'ar' | 'en';
  /** True while the universe (worlds / tasks) is the active stage. False = calm backdrop behind the chat. */
  active: boolean;
  onSelect: (worldEn: string, taskEn: string) => void;
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function LookersUniverse({ lang, active, onSelect }: Props) {
  const ar = lang === 'ar';
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CosmosScene | null>(null);
  const worldRefs = useRef<Partial<Record<WorldId, HTMLButtonElement | null>>>({});
  const taskRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<SVGEllipseElement>(null);
  const [focus, setFocus] = useState<WorldId | null>(null);
  const [lastFocus, setLastFocus] = useState<WorldId | null>(null);
  const [glFailed, setGlFailed] = useState(false);
  const [reduced] = useState(prefersReducedMotion);
  const keyboardPick = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  const focusedWorld = WORLDS.find(w => w.id === focus) ?? null;
  const mode = !active ? 'ambient' : focus ? 'tasks' : 'worlds';
  const modeRef = useRef({ mode: mode as 'ambient' | 'tasks' | 'worlds', focus: (mode === 'ambient' ? lastFocus : focus) as WorldId | null });
  modeRef.current = { mode, focus: mode === 'ambient' ? lastFocus : focus };

  const getFrame = useCallback(() => {
    const el = stageRef.current;
    if (activeRef.current && el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return { left: r.left, top: r.top, width: r.width, height: r.height };
    }
    return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  }, []);

  // Uses the CSS `translate` property (not `transform`) so page-wide button press styles never move hit areas.
  // Positions every DOM label / hit area on top of its 3D body, every frame, without React re-renders.
  const onFrame = useCallback((planets: Record<WorldId, Projection>, rocks: Projection[]) => {
    for (const w of WORLDS) {
      const el = worldRefs.current[w.id]; const p = planets[w.id];
      if (!el || !p) continue;
      el.style.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
      el.style.setProperty('--r', `${p.r.toFixed(1)}px`);
      el.style.setProperty('--o', p.o.toFixed(3));
    }
    rocks.forEach((p, i) => {
      const el = taskRefs.current[i];
      if (!el) return;
      el.style.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
      el.style.setProperty('--r', `${p.r.toFixed(1)}px`);
      el.style.setProperty('--o', p.o.toFixed(3));
    });
    const fp = focusRef.current ? planets[focusRef.current] : null;
    if (titleRef.current && fp) {
      titleRef.current.style.translate = `${fp.x.toFixed(1)}px ${(fp.y + fp.r * 1.08).toFixed(1)}px`;
    }
    // Orbit drawn through the task asteroids, centred on the focused world (landscape only).
    const orbit = orbitRef.current;
    if (orbit && fp && rocks[0] && rocks[1]) {
      const [a, b] = [rocks[0], rocks[1]];
      const ax = (a.x - fp.x) ** 2, ay = (a.y - fp.y) ** 2, bx = (b.x - fp.x) ** 2, by = (b.y - fp.y) ** 2;
      const det = ax * by - bx * ay;
      if (Math.abs(det) > 1 && a.o > 0.05) {
        const A = (by - ay) / det, B = (ax - bx) / det; // 1/rx², 1/ry²
        if (A > 0 && B > 0) {
          orbit.setAttribute('cx', fp.x.toFixed(1)); orbit.setAttribute('cy', fp.y.toFixed(1));
          orbit.setAttribute('rx', (1 / Math.sqrt(A)).toFixed(1)); orbit.setAttribute('ry', (1 / Math.sqrt(B)).toFixed(1));
          orbit.style.opacity = String(Math.min(a.o, 1) * 0.55);
          // Only the lower half of the orbit is drawn, so it never crosses the headers.
          (orbit.parentNode as SVGElement).style.clipPath = `inset(${fp.y.toFixed(0)}px 0 0 0)`;
          return;
        }
      }
      orbit.style.opacity = '0';
    } else if (orbit) orbit.style.opacity = '0';
  }, []);
  const focusRef = useRef<WorldId | null>(null);
  focusRef.current = focus ?? (mode === 'ambient' ? lastFocus : null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: CosmosScene | null = null;
    let cancelled = false;
    const onResize = () => scene?.resize();
    const ro = new ResizeObserver(() => scene?.renderOnce());
    // Three.js is loaded on demand so the rest of the site does not pay for it.
    import('./CosmosScene').then(({ CosmosScene: Scene }) => {
      if (cancelled) return;
      try {
        scene = new Scene(canvas, getFrame, onFrame, { reducedMotion: reduced });
      } catch (err) {
        console.warn('Lookers universe: WebGL unavailable, using static fallback.', err);
        setGlFailed(true);
        return;
      }
      sceneRef.current = scene;
      scene.setDirection(document.documentElement.dir === 'rtl');
      scene.setMode(modeRef.current.mode, modeRef.current.focus);
      window.addEventListener('resize', onResize);
      if (stageRef.current) ro.observe(stageRef.current);
    }).catch(() => setGlFailed(true));
    return () => { cancelled = true; window.removeEventListener('resize', onResize); ro.disconnect(); scene?.dispose(); sceneRef.current = null; };
  }, [getFrame, onFrame, reduced]);

  // Coming back to the universe from the chat always starts at the five worlds.
  useEffect(() => { if (active) setFocus(null); }, [active]);

  useEffect(() => { sceneRef.current?.setDirection(ar); }, [ar]);

  useEffect(() => {
    sceneRef.current?.setMode(mode, mode === 'ambient' ? lastFocus : focus);
  }, [mode, focus, lastFocus]);

  useEffect(() => {
    if (mode !== 'tasks') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFocus(null); };
    window.addEventListener('keydown', onKey);
    // Keyboard users land on the first task once the asteroids arrive; pointer users keep a clean view.
    const id = keyboardPick.current ? window.setTimeout(() => taskRefs.current[0]?.focus({ preventScroll: true }), reduced ? 0 : 900) : 0;
    return () => { window.removeEventListener('keydown', onKey); window.clearTimeout(id); };
  }, [mode, reduced]);

  const chooseWorld = (id: WorldId) => {
    sceneRef.current?.press('world', id);
    sceneRef.current?.setHover('world', null);
    setFocus(id); setLastFocus(id);
  };
  const chooseTask = (index: number) => {
    if (!focusedWorld) return;
    sceneRef.current?.press('task', index);
    const task = focusedWorld.tasks[index];
    window.setTimeout(() => onSelect(focusedWorld.name.en.toUpperCase(), task.en), reduced ? 0 : 260);
  };

  return (
    <div className={'lu' + (glFailed ? ' lu--nogl' : '')} data-mode={mode} dir={ar ? 'rtl' : 'ltr'}>
      <canvas ref={canvasRef} className="lu-canvas" aria-hidden="true" />
      {active && (
        <section ref={stageRef} className="lu-stage" aria-label={t('Choose your universe and mission', 'اختار عالمك ومهمتك')}>
          <header className="lu-heading" aria-hidden={mode === 'tasks'}>
            <span className="lu-kicker">LOOKERS AI</span>
            <h1>{ar ? <>فكرة واحدة. <em>وكل خطوة تفتح اللي بعدها.</em></> : <>One idea. <em>Every step opens the next.</em></>}</h1>
            <p>{t('Explore your universe. Turn ideas into real results.', 'استكشف عالمك، وحوّل أفكارك لنتائج حقيقية.')}</p>
          </header>
          {mode === 'tasks' && (
            <button type="button" className="lu-back" onClick={() => setFocus(null)}>
              <span aria-hidden="true">{ar ? '→' : '←'}</span>{t('All universes', 'كل المجالات')}
            </button>
          )}
        </section>
      )}

      <div className="lu-overlay" aria-hidden={!active}>
        <svg className="lu-orbit" aria-hidden="true"><ellipse ref={orbitRef} cx="0" cy="0" rx="0" ry="0" /></svg>
        {WORLDS.map(w => (
          <button
            key={w.id}
            ref={el => { worldRefs.current[w.id] = el; }}
            type="button"
            className={'lu-world lu-world--' + w.id}
            tabIndex={mode === 'worlds' ? 0 : -1}
            aria-hidden={mode !== 'worlds'}
            onClick={e => { keyboardPick.current = e.detail === 0; chooseWorld(w.id); }}
            onPointerEnter={() => sceneRef.current?.setHover('world', w.id)}
            onPointerLeave={() => sceneRef.current?.setHover('world', null)}
            onFocus={() => sceneRef.current?.setHover('world', w.id)}
            onBlur={() => sceneRef.current?.setHover('world', null)}
          >
            <span className="lu-world__label">
              <small>{w.number}</small>
              <strong>{w.name[lang]}</strong>
              <span>{w.subtitle[lang]}</span>
              <i aria-hidden="true" />
            </span>
          </button>
        ))}
        {focusedWorld && (
          <div ref={titleRef} className="lu-focus-title">
            <small>{focusedWorld.number}</small>
            <h2>{focusedWorld.name[lang]}</h2>
            <p>{focusedWorld.subtitle[lang]}</p>
          </div>
        )}
        {[0, 1, 2, 3].map(i => {
          const task = (focusedWorld ?? WORLDS.find(w => w.id === lastFocus) ?? WORLDS[0]).tasks[i];
          return (
            <button
              key={i}
              ref={el => { taskRefs.current[i] = el; }}
              type="button"
              className="lu-task"
              tabIndex={mode === 'tasks' ? 0 : -1}
              aria-hidden={mode !== 'tasks'}
              onClick={() => chooseTask(i)}
              onPointerEnter={() => sceneRef.current?.setHover('task', i)}
              onPointerLeave={() => sceneRef.current?.setHover('task', null)}
              onFocus={() => sceneRef.current?.setHover('task', i)}
              onBlur={() => sceneRef.current?.setHover('task', null)}
            >
              <span className="lu-task__label"><small>{String(i + 1).padStart(2, '0')}</small><strong>{task[lang]}</strong></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
