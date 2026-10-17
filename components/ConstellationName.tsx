import React, { useEffect, useRef } from 'react';
export default function ConstellationName() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current, context = surface?.getContext('2d'); if (!surface || !context) return;
    const mask = document.createElement('canvas'); mask.width = 1120; mask.height = 240;
    const m = mask.getContext('2d'); if (!m) return;
    m.font = '700 116px Arial'; m.textAlign = 'center'; m.fillText('Lookers AI', 560, 166);
    const pixels = m.getImageData(0, 0, 1120, 240).data;
    let seed = 71; const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
    context.clearRect(0, 0, 1120, 240);
    for (let i = 0; i < 100; i++) { context.fillStyle = `rgba(163,197,225,${.12 + random() * .35})`; context.beginPath(); context.arc(random() * 1120, random() * 240, random() * 1.3 + .4, 0, Math.PI * 2); context.fill(); }
    const points: number[][] = [];
    for (let y = 60; y < 180; y += 5) for (let x = 160; x < 960; x += 5) if (pixels[(y * 1120 + x) * 4 + 3] > 100) {
      const px = x + (random() - .5) * 2, py = y + (random() - .5) * 2; points.push([px, py]);
      context.fillStyle = random() > .7 ? '#ffdc92' : '#daeafb'; context.globalAlpha = .5 + random() * .5;
      context.beginPath(); context.arc(px, py, .9 + random() * 1.2, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1; context.strokeStyle = '#91bce836'; context.lineWidth = .7;
    for (let i = 0; i < points.length; i += 23) for (let j = i + 1; j < Math.min(i + 20, points.length); j++) {
      const p = points[i], q = points[j], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d < 24 && d > 8) { context.beginPath(); context.moveTo(p[0], p[1]); context.lineTo(q[0], q[1]); context.stroke(); break; }
    }
    for (let i = 8; i < points.length; i += 83) { const [x, y] = points[i]; context.strokeStyle = '#fff1c9'; context.shadowColor = '#f7ce78'; context.shadowBlur = 11; context.beginPath(); context.moveTo(x - 5, y); context.lineTo(x + 5, y); context.moveTo(x, y - 5); context.lineTo(x, y + 5); context.stroke(); }
  }, []);
  return <div className="lai-constellation" role="img" aria-label="Lookers AI"><canvas ref={canvas} width={1120} height={240} aria-hidden="true" /></div>;
}
