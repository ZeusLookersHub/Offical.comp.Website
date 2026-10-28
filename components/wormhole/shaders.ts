// Byte-identical shader strings from handoff 5344faa.
export const vertexShader =
  "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}";
export const fragmentShader = `precision mediump float;
uniform sampler2D T;uniform float t,mo;uniform vec2 C;varying vec2 v;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
vec2 uv(float r,float a){return C+vec2(cos(a)*r*.5,sin(a)*r);}
vec4 S(vec2 u){return texture2D(T,u);}
vec3 D(vec2 u){vec3 a=texture2D(T,u).rgb;return a+(a-texture2D(T,u,2.5).rgb)*.9;}
void main(){
  vec2 q=(v-C)*vec2(2.,1.);
  float r=length(q),a=atan(q.y,q.x);
  float e=length(vec2(q.x,q.y*2.));                  /* 0 at the throat, ~1 at the eye's tips */
  vec4 base=S(v);
  vec2 tb=(vec2(n(q*6.+t*.11),n(q*6.-t*.09+7.3))-.5)*.012*mo;   /* gentle turbulence */
  /* inner flow: spiral + contraction, two phases cross-faded so it never jumps */
  vec3 ci=vec3(0.);float wi=0.;
  for(int k=0;k<2;k++){
    float f=fract(t*.075*mo+float(k)*.5);
    float rs=r*pow(1.42,f);
    float as=a+t*mo*.30*(.09/(r+.05));
    float w=sin(3.14159*f);
    ci+=D(uv(rs,as)+tb)*w;wi+=w;
  }
  ci/=wi;
  /* outer flow: slow outward drift of filaments, different speed and depth */
  vec3 co=vec3(0.);float wo=0.;
  for(int k=0;k<2;k++){
    float f=fract(t*.045*mo+float(k)*.5+.25);
    float rs=r*pow(1.10,-f);
    float as=a-t*mo*.035*(.25/(r+.12));
    float w=sin(3.14159*f);
    co+=D(uv(rs,as)+tb*1.6)*w;wo+=w;
  }
  co/=wo;
  float inner=1.-smoothstep(.15,.33,r);
  vec3 col=mix(co,ci,inner);
  float L=dot(col,vec3(.299,.587,.114));
  /* dodge & burn: quiet gaps go darker, luminous currents keep their filament detail */
  col*=mix(.42,1.08,smoothstep(.10,.62,L));
  /* strongest light at the inner rim, gradual falloff to the tips */
  float rim=exp(-pow((r-.19)/.075,2.));
  col*=.70+.50*rim;
  col*=mix(1.,.48,smoothstep(.30,1.,e));
  /* key light from the upper right, like the planets: subtle lift there, burn bottom-left */
  col*=1.+.16*dot(normalize(q+vec2(.0001)),normalize(vec2(.7,-.7)))*smoothstep(.12,.5,r);
  /* outward ripples: faint light rings travelling out and fading */
  float rip=.5+.5*sin(r*(20.+6.*n(vec2(a*1.7,1.3)))-t*mo*1.1+3.*n(vec2(a*2.3,r*3.+t*.07)));
  rip*=n(vec2(a*3.1+t*.05,r*5.));
  col*=1.+.09*rip*smoothstep(.22,.4,r)*(1.-smoothstep(.55,.95,e))*mo;
  /* restrained, slow brightness variation */
  col*=.95+.07*n(vec2(t*.15,a*1.3+2.));
  /* exposure and highlight shoulder: no blown highlights */
  col=max(col,0.)*.9;col=col/(1.+col*.55)*1.4;
  /* colour temperature towards the scene: a little less saturated, warm amber */
  float L2=dot(col,vec3(.299,.587,.114));
  col=mix(vec3(L2),col,.93)*vec3(1.,.9,.74);
  /* dark core with a soft transition into the light */
  float core=1.-smoothstep(.10,.175,r);
  col*=1.-core*.96;
  float al=base.a*smoothstep(1.04,.80,e);            /* no cut-out edge */
  al=max(al,core);
  gl_FragColor=vec4(col*al,al);
}`;
