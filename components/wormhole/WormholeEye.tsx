import React, { useEffect, useRef, useState } from "react";
import { vertexShader, fragmentShader } from "./shaders";
import { asset } from "./worlds";

/** Owns one WebGL context. The SVG remains visible until the texture is ready. */
export default function WormholeEye({
  stage,
  reduced,
}: {
  stage: React.RefObject<HTMLDivElement>;
  reduced: boolean;
}) {
  const host = useRef<HTMLSpanElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const cv = canvas.current,
      element = host.current;
    if (!cv || !element) return;
    setReady(false);
    const gl = cv.getContext("webgl", {
      premultipliedAlpha: true,
      alpha: true,
      antialias: false,
    });
    if (!gl) return;
    let stopped = false,
      raf = 0;
    const shaders: WebGLShader[] = [];
    const program = gl.createProgram(),
      buffer = gl.createBuffer(),
      texture = gl.createTexture();
    const image = new Image();
    const dispose = () => {
      stopped = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      image.onload = null;
      image.onerror = null;
      image.src = "";
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
    };
    const observer = new ResizeObserver(() => {
      if (loaded && reduced) draw();
    });
    let loaded = false;
    const start = performance.now();
    const spill = () => {
      const c = element.getBoundingClientRect(),
        cx = c.left + c.width * 0.4937,
        cy = c.top + c.height * 0.5004;
      stage.current
        ?.querySelectorAll<HTMLElement>(
          ".lh-planet:not(.lh-planet--slot) .lh-globe",
        )
        .forEach((g) => {
          const r = g.getBoundingClientRect(),
            dx = cx - r.left - r.width / 2,
            dy = cy - r.top - r.height / 2;
          const d = Math.hypot(dx, dy) || 1,
            reach = Math.max(c.width * 1.1, 240);
          g.style.setProperty("--sx", (50 + (dx / d) * 42).toFixed(1) + "%");
          g.style.setProperty("--sy", (50 + (dy / d) * 42).toFixed(1) + "%");
          g.style.setProperty(
            "--so",
            Math.max(0, Math.min(0.6, 0.66 * Math.exp(-d / reach))).toFixed(3),
          );
        });
    };
    let time: WebGLUniformLocation | null;
    const draw = () => {
      if (stopped || !loaded || gl.isContextLost()) return;
      const r = element.getBoundingClientRect(),
        d = Math.min(devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(r.width * d)),
        h = Math.max(2, Math.round(r.height * d));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform1f(time, reduced ? 0 : (performance.now() - start) / 1000);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      spill();
    };
    const loop = () => {
      if (stopped) return;
      if (!document.hidden) draw();
      raf = requestAnimationFrame(loop);
    };
    try {
      if (!program || !buffer || !texture)
        throw new Error("WebGL resources unavailable");
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertexShader],
        [gl.FRAGMENT_SHADER, fragmentShader],
      ] as const) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error("WebGL shader unavailable");
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new Error("Wormhole shader compilation failed");
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error("Wormhole shader link failed");
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const p = gl.getAttribLocation(program, "p");
      gl.enableVertexAttribArray(p);
      gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
      time = gl.getUniformLocation(program, "t");
      gl.uniform2f(gl.getUniformLocation(program, "C"), 0.49373, 0.50036);
      gl.uniform1f(gl.getUniformLocation(program, "mo"), reduced ? 0 : 1);
      image.onload = () => {
        if (stopped || gl.isContextLost()) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        loaded = true;
        draw();
        setReady(true);
        if (!reduced) loop();
      };
      image.src = asset("eye-tex.webp");
      observer.observe(element);
    } catch {
      dispose();
    }
    const lost = (event: Event) => {
      event.preventDefault();
      stopped = true;
      cancelAnimationFrame(raf);
      setReady(false);
    };
    const restored = () => setRevision((value) => value + 1);
    cv.addEventListener("webglcontextlost", lost);
    cv.addEventListener("webglcontextrestored", restored);
    return () => {
      cv.removeEventListener("webglcontextlost", lost);
      cv.removeEventListener("webglcontextrestored", restored);
      dispose();
    };
  }, [reduced, revision, stage]);
  return (
    <span className={`wh ${ready ? "wh--gl" : ""}`} aria-hidden="true">
      <span className="wh-hov" ref={host}>
        <canvas
          ref={canvas}
          className="wh-gl"
          data-renderer={ready ? "webgl" : "svg"}
        />
        <span className="wh-eye">
          <img
            className="wh-out"
            src={asset("eye-outer.svg")}
            alt=""
            draggable={false}
          />
          <img
            className="wh-in"
            src={asset("eye-inner.svg")}
            alt=""
            draggable={false}
          />
          <i className="wh-r" />
          <i className="wh-r" />
          <i className="wh-r" />
        </span>
      </span>
      <span className="wh-dust">
        {Array.from({ length: 12 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--a": `${i * 30}deg`,
                "--w": `${(-i * 0.29).toFixed(2)}s`,
                "--d": `${3 + (i % 3) * 0.5}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </span>
    </span>
  );
}
