// GLSL for the Lookers AI cosmos. All surfaces are procedural so every body is a real,
// rotating 3D object (no crops of the approved image). Palette and lighting follow the
// approved orbital artwork: warm key light from the upper right, gold filaments, cool rims.

// Ashima / Stefan Gustavson 3D simplex noise (MIT).
export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float f=0.0;float a=0.5;for(int i=0;i<5;i++){f+=a*snoise(p);p*=2.03;a*=0.5;}return f;}
float fbm3(vec3 p){float f=0.0;float a=0.5;for(int i=0;i<3;i++){f+=a*snoise(p);p*=2.07;a*=0.5;}return f;}
`;

export const LIGHT = /* glsl */ `
// Key light in view space: upper right, slightly in front, like the approved artwork.
const vec3 KEY = normalize(vec3(0.62,0.52,0.58));
`;

export const planetVertex = /* glsl */ `
varying vec3 vObj; varying vec3 vN; varying vec3 vView;
void main(){
  vObj = position;
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vN = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

export const planetFragment = /* glsl */ `
uniform vec3 uOcean; uniform vec3 uLand; uniform vec3 uLand2; uniform vec3 uEmit; uniform vec3 uRim;
uniform float uSeed; uniform float uOpacity; uniform float uVeins; uniform float uHover; uniform float uLandAmt;
varying vec3 vObj; varying vec3 vN; varying vec3 vView;
${NOISE}
${LIGHT}
void main(){
  vec3 p = normalize(vObj);
  vec3 s = vec3(uSeed, uSeed*1.7, uSeed*0.3);
  float n = fbm(p*1.55 + s);
  float land = smoothstep(uLandAmt - 0.06, uLandAmt + 0.1, n);
  float tone = fbm3(p*4.2 + s*2.0)*0.5 + 0.5;
  vec3 albedo = mix(uOcean*(0.75+0.5*tone), mix(uLand, uLand2, tone), land);
  float detail = fbm3(p*11.0 + s) * 0.5 + 0.5;
  albedo *= 0.5 + 0.95*detail;
  // Cracked plates / fine mineral lines.
  float cr = 1.0 - abs(snoise(p*5.5 + s*3.0));
  albedo *= 1.0 - 0.35*pow(cr, 14.0);

  vec3 N = normalize(vN); vec3 V = normalize(vView);
  float ndl = dot(N, KEY);
  float diff = smoothstep(-0.18, 1.0, ndl);
  vec3 col = albedo * (0.035 + 1.55*diff*diff);

  // Fine luminous filaments (city-light veins), mostly visible on the night side.
  float r1 = 1.0 - abs(snoise(p*3.4 + s*1.3));
  float r2 = 1.0 - abs(snoise(p*8.2 - s));
  float veins = pow(r1, 48.0)*1.1 + pow(r2, 60.0)*0.7;
  float sparks = smoothstep(0.82, 0.98, snoise(p*70.0 + s)) * land;
  float night = 0.18 + 0.82*(1.0 - diff);
  col += uEmit * (veins*(0.35 + 0.65*land) + sparks*0.9) * uVeins * night;

  // Specular glint near the key light.
  vec3 H = normalize(KEY + V);
  col += vec3(1.0,0.86,0.62) * pow(max(dot(N,H),0.0), 42.0) * 0.55 * (1.0-land*0.6);

  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  col += uRim * fres * (0.08 + 0.85*max(ndl + 0.25, 0.0));
  col *= 1.0 + uHover*0.28;
  gl_FragColor = vec4(col, uOpacity);
}`;

export const atmosphereFragment = /* glsl */ `
uniform vec3 uRim; uniform float uOpacity; uniform float uHover;
varying vec3 vObj; varying vec3 vN; varying vec3 vView;
${LIGHT}
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(vView);
  // Back faces of a slightly larger shell: strongest at the planet limb, zero at the shell edge.
  float f = pow(clamp(-dot(N, V) * 3.2, 0.0, 1.0), 2.2);
  float lit = 0.12 + 1.5*max(dot(N, KEY) + 0.15, 0.0);
  float a = f * lit * uOpacity * (0.85 + uHover*0.7);
  gl_FragColor = vec4(uRim * a, a);
}`;

export const ringVertex = /* glsl */ `
varying float vR; varying float vA; varying vec3 vViewPos;
void main(){
  vR = length(position.xy);
  vA = atan(position.y, position.x);
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

export const ringFragment = /* glsl */ `
uniform vec3 uColor; uniform vec3 uColor2; uniform float uInner; uniform float uOuter; uniform float uSeed;
uniform float uOpacity; uniform float uTime; uniform float uHover; uniform float uDensity;
varying float vR; varying float vA; varying vec3 vViewPos;
${NOISE}
void main(){
  float t = (vR - uInner) / (uOuter - uInner);
  if (t < 0.0 || t > 1.0) discard;
  float edge = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.82, t);
  // A handful of thin luminous filaments with varying brightness (anti-aliased).
  float lines = 0.0;
  float k = t * 9.0 + uSeed;
  float id = floor(k);
  float on = step(0.42, fract(sin(id*91.7 + uSeed)*4375.85));
  float bright = 0.35 + 0.65*fract(sin(id*12.9 + uSeed*3.0)*958.3);
  float d = abs(fract(k) - 0.5);
  float w = max(0.045, fwidth(k)*1.2);
  lines += (1.0 - smoothstep(0.0, w, d)) * on * bright;
  float k2 = t * 41.0 + uSeed*1.7;
  float d2 = abs(fract(k2) - 0.5);
  float w2 = max(0.05, fwidth(k2)*1.2);
  lines += (1.0 - smoothstep(0.0, w2, d2)) * 0.14 * step(0.55, fract(sin(floor(k2)*45.1)*758.5));
  // Streaky, uneven brightness around the orbit instead of perfect circles.
  lines *= 0.3 + 0.7*smoothstep(-0.35, 0.6, snoise(vec3(cos(vA)*1.4, sin(vA)*1.4, id*0.7 + uSeed)));
  float dust = pow(snoise(vec3(t*20.0, vA*2.0, uSeed)) * 0.5 + 0.5, 2.0) * 0.16;
  float b = (lines + dust) * uDensity;
  // A slow travelling glint along the ring.
  float glint = pow(max(cos(vA - uTime*0.22 - uSeed), 0.0), 140.0) * lines;
  b += glint * 1.6;
  vec3 col = mix(uColor, uColor2, smoothstep(0.1, 0.9, t));
  float a = b * edge * uOpacity * (1.0 + uHover*0.5);
  gl_FragColor = vec4(col * a * 1.35, a);
}`;

export const rockVertex = /* glsl */ `
varying vec3 vObj; varying vec3 vN; varying vec3 vView;
void main(){
  vObj = position;
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vN = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

export const rockFragment = /* glsl */ `
uniform float uSeed; uniform float uOpacity; uniform float uHover; uniform vec3 uGlow; uniform float uDim; uniform float uSelected;
varying vec3 vObj; varying vec3 vN; varying vec3 vView;
${NOISE}
${LIGHT}
void main(){
  vec3 p = vObj * 1.8 + vec3(uSeed);
  float n = fbm3(p*1.3) * 0.5 + 0.5;
  float fine = fbm3(p*6.0) * 0.5 + 0.5;
  // Basalt / iron rock with warm bronze facets, matching the artwork's floating rocks.
  vec3 albedo = mix(vec3(0.13,0.12,0.12), vec3(0.42,0.33,0.24), n);
  albedo *= 0.55 + 0.8*fine;
  float mineral = smoothstep(0.7, 0.92, snoise(p*11.0)) * (0.4 + 0.6*n);
  vec3 N = normalize(vN); vec3 V = normalize(vView);
  // Pitted, cratered surface: bend the normal with small-scale noise.
  vec3 q = p*7.0;
  float e = 0.08;
  float h0 = snoise(q);
  vec3 grad = vec3(snoise(q+vec3(e,0,0))-h0, snoise(q+vec3(0,e,0))-h0, snoise(q+vec3(0,0,e))-h0) / e;
  N = normalize(N - grad * 0.035);
  float ndl = max(dot(N, KEY), 0.0);
  vec3 col = albedo * (0.07 + 1.9*ndl*ndl);
  col += vec3(1.0,0.8,0.5) * pow(max(dot(N, normalize(KEY+V)),0.0), 24.0) * 0.35;
  col += vec3(1.0,0.78,0.42) * mineral * (0.15 + 1.1*ndl) * 0.7;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += uGlow * fres * (0.25 + uHover*1.6 + uSelected*0.8);
  col += uGlow * mineral * uHover * 0.6;
  col *= uDim;
  gl_FragColor = vec4(col, uOpacity);
}`;

export const skyVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;

export const skyFragment = /* glsl */ `
uniform vec2 uRes; uniform float uTime; uniform float uDim; uniform vec2 uShift; uniform float uPortrait;
varying vec2 vUv;
${NOISE}
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float stars(vec2 p, float scale, float thr, float tw){
  vec2 g = p*scale; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
  float h = hash(id);
  if (h < thr) return 0.0;
  vec2 o = vec2(hash(id+7.1), hash(id+3.3)) - 0.5;
  float d = length(f - o*0.7);
  float tws = 0.6 + 0.4*sin(uTime*(0.6+h*2.0)*tw + h*40.0);
  return smoothstep(0.08, 0.0, d) * (h - thr)/(1.0-thr) * tws;
}
void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) + uShift;
  // The galactic band crosses diagonally (top-left → right) on desktop; steeper on portrait.
  vec2 dir = normalize(mix(vec2(1.0, -0.42), vec2(0.55, -1.0), uPortrait));
  vec2 nrm = vec2(-dir.y, dir.x);
  float along = dot(p, dir);
  float dist = dot(p - vec2(0.0, 0.08), nrm);
  float warp = fbm3(vec3(p*1.6, uTime*0.004)) * 0.22;
  float band = exp(-pow((dist + warp) / 0.26, 2.0));
  float clouds = fbm(vec3(p*2.4, 3.0 + uTime*0.003)) * 0.5 + 0.5;
  float wisps = pow(fbm(vec3(p*5.5 + 2.0, uTime*0.002)) * 0.5 + 0.5, 3.0);
  vec3 col = vec3(0.012, 0.017, 0.032);
  col += vec3(0.05, 0.075, 0.15) * clouds * 0.9;
  vec3 coolNeb = vec3(0.16, 0.2, 0.36);
  vec3 warmNeb = vec3(0.62, 0.34, 0.14);
  vec3 neb = mix(coolNeb, warmNeb, smoothstep(-0.1, 0.9, along));
  col += neb * band * (0.45 + 1.1*wisps) * clouds * 1.2;
  col += vec3(0.95, 0.72, 0.45) * band * pow(wisps, 1.6) * 0.5 * smoothstep(0.0, 0.8, along);
  // Dark dust lanes.
  col *= 1.0 - 0.55 * smoothstep(0.55, 0.85, fbm3(vec3(p*6.0, 9.0))*0.5+0.5) * band;
  // A subtle violet haze bottom-left and teal haze bottom-right.
  col += vec3(0.16, 0.08, 0.24) * smoothstep(1.1, 0.0, length(p - vec2(-0.75*aspect*0.6, -0.55))) * 0.35;
  col += vec3(0.04, 0.16, 0.16) * smoothstep(1.0, 0.0, length(p - vec2(0.7*aspect*0.6, -0.5))) * 0.25;
  vec2 sp = p + uShift*0.4;
  float s = stars(sp, 90.0, 0.94, 1.0) * 0.8 + stars(sp + 3.1, 180.0, 0.9, 1.6) * 0.55 + stars(sp + 7.7, 34.0, 0.985, 0.6) * 1.4;
  s *= 0.65 + band*1.3;
  col += vec3(1.0, 0.94, 0.86) * s;
  // Vignette.
  float vg = smoothstep(1.35, 0.25, length((uv-0.5)*vec2(1.0, 1.15)));
  col *= 0.55 + 0.45*vg;
  col *= uDim;
  gl_FragColor = vec4(col, 1.0);
}`;
