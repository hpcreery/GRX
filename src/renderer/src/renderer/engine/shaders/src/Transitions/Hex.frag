// License CC0: Hex tile transition effect
//  Result after playing around with transition effects

precision highp float;
uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform float     iFrameRate;            // shader frame rate
uniform int       iFrame;                // shader playback frame
uniform float     iChannelTime[4];       // channel playback time (in seconds)
uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform sampler2D iChannel0;             // input channel. XX = 2D/Cube
uniform vec4      iDate;                 // (year, month, day, time in seconds)


#define HEXTILE_SIZE 0.125
#define RANDOMNESS   0.75

// -
#define PI           3.141592654
#define TAU          (2.0*PI)
#define RESOLUTION   iResolution
#define TIME         iTime
#define PERIOD       1.0

float hash(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898,58.233))) * 13758.5453);
}

float tanh_approx(float x) {
//  return tanh(x);
  float x2 = x*x;
  return clamp(x*(27.0 + x2)/(27.0+9.0*x2), -1.0, 1.0);
}

// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 hsv2rgb(vec3 c) {
  const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


// http://mercury.sexy/hg_sdf/
vec2 mod2(inout vec2 p, vec2 size) {
  vec2 c = floor((p + size*0.5)/size);
  p = mod(p + size*0.5,size) - size*0.5;
  return c;
}

// IQ's hex
float hex(vec2 p, float r) {
  p.xy = p.yx;
  const vec3 k = vec3(-sqrt(3.0/4.0),1.0/2.0,1.0/sqrt(3.0));
  p = abs(p);
  p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
  p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
  return length(p)*sign(p.y);
}

// See Art of Code: Hexagonal Tiling Explained!
// https://www.youtube.com/watch?v=VmrIDyYiJBA
vec2 hextile(inout vec2 p) {
  const vec2 sz       = vec2(1.0, sqrt(3.0));
  const vec2 hsz      = 0.5*sz;

  vec2 p1 = mod(p, sz)-hsz;
  vec2 p2 = mod(p - hsz, sz)-hsz;
  vec2 p3 = dot(p1, p1) < dot(p2, p2) ? p1 : p2;
  vec2 n = ((p3 - p + hsz)/sz);
  p = p3;

  n -= vec2(0.5);
  // Rounding to make hextile 0,0 well behaved
  return round(n*2.0)/2.0;
}

// IQ's polynominal soft min
float pmin(float a, float b, float k) {
  float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
  return mix( b, a, h ) - k*h*(1.0-h);
}

float pmax(float a, float b, float k) {
  return -pmin(-a, -b, k);
}

// IQ's ellipse
float ellipse(vec2 p, vec2 ab) {
    p = abs(p); if( p.x > p.y ) {p=p.yx;ab=ab.yx;}
    float l = ab.y*ab.y - ab.x*ab.x;
    float m = ab.x*p.x/l;      float m2 = m*m;
    float n = ab.y*p.y/l;      float n2 = n*n;
    float c = (m2+n2-1.0)/3.0; float c3 = c*c*c;
    float q = c3 + m2*n2*2.0;
    float d = c3 + m2*n2;
    float g = m + m*n2;
    float co;
    if( d<0.0 )
    {
        float h = acos(q/c3)/3.0;
        float s = cos(h);
        float t = sin(h)*sqrt(3.0);
        float rx = sqrt( -c*(s + t + 2.0) + m2 );
        float ry = sqrt( -c*(s - t + 2.0) + m2 );
        co = (ry+sign(l)*rx+abs(g)/(rx*ry)- m)/2.0;
    }
    else
    {
        float h = 2.0*m*n*sqrt( d );
        float s = sign(q+h)*pow(abs(q+h), 1.0/3.0);
        float u = sign(q-h)*pow(abs(q-h), 1.0/3.0);
        float rx = -s - u - c*4.0 + 2.0*m2;
        float ry = (s - u)*sqrt(3.0);
        float rm = sqrt( rx*rx + ry*ry );
        co = (ry/sqrt(rm-rx)+2.0*g/rm-m)/2.0;
    }
    vec2 r = ab * vec2(co, sqrt(1.0-co*co));
    return length(r-p) * sign(p.y-r.y);
}

const int N = 4;

// IQ's polygon
float polygon(vec2 p, vec2[N] v) {
    float d = dot(p-v[0],p-v[0]);
    float s = 1.0;
    for( int i=0, j=N-1; i<N; j=i, i++ ) {
        vec2 e = v[j] - v[i];
        vec2 w =    p - v[i];
        vec2 b = w - e*clamp( dot(w,e)/dot(e,e), 0.0, 1.0 );
        d = min( d, dot(b,b) );
        bvec3 c = bvec3(p.y>=v[i].y,p.y<v[j].y,e.x*w.y>e.y*w.x);
        if( all(c) || all(not(c)) ) s*=-1.0;
    }
    return s*sqrt(d);
}

const vec2[] wing = vec2[](vec2(0.385, 0.435), vec2(1.35, 0.435), vec2(0.92, 0.035), vec2(0.385, 0.035));

float commodore(vec2 p, out bool isRed) {
  vec2 op = p;
  p.y = abs(p.y);
  float d0 = ellipse(p, vec2(1.0, 0.865));
  d0 = abs(d0)- 0.275;
  float d1 = p.x-0.375;
  float d2 = polygon(p, wing);
  float d = d0;
  d = pmax(d, d1, 0.025);
  d = pmin(d, d2, 0.025);
  isRed = op.y > 0.0 && d2 <= 0.0025;
  return d;
}


vec3 hexTransition(vec2 p, float aa, vec3 from, vec3 to, float m) {
  m = clamp(m, 0.0, 1.0);
  const float hz = HEXTILE_SIZE;
  const float rz = RANDOMNESS;
  vec2 hp = p;
  hp /= hz;
//  hp *= ROT(0.5*(1.0-m));
  vec2 hn = hextile(hp)*hz*-vec2(-1.0, sqrt(3.0));
  float r = hash(hn+123.4);

  const float off = 3.0;
  float fi = smoothstep(0.0, 0.1, m);
  float fo = smoothstep(0.9, 1.0, m);

  float sz = 0.55*(0.5+0.5*tanh_approx(((rz*r+hn.x + hn.y-off+m*off*2.0))*2.0));
  float hd = (hex(hp, sz)-0.1*sz)*hz;

  float mm = smoothstep(-aa, aa, -hd);
  mm = mix(0.0, mm, fi);
  mm = mix(mm, 1.0, fo);

  vec3 col = mix(from, to, mm);
  vec2 ahn = abs(hn);
  return col;
}

vec3 sunset(vec2 p, float aa) {
  const float z = 0.75;
  const float so = 0.05;

  bool isRed;
  float d = commodore(p/z, isRed)*z;
  bool sisRed;
  float ds = commodore((p-so*vec2(-1.0, -1.0))/z, sisRed)*z;

  vec3 col = vec3(1.0);

  float sy = abs(p.y);

  vec3 sky   = hsv2rgb(vec3(0.55, max(sy, 0.0), max(1.0-1.0*sy, 0.0)))*0.6;
  vec3 sun1  = hsv2rgb(vec3(0.05, max(1.0-sy, 0.0), max(1.0-(1.0/1.25)*sy, 0.0)))*0.6;
  vec3 sun2  = hsv2rgb(vec3(0.05, smoothstep(0.0, 0.125, sy)*0.5, (1.0-sy)*smoothstep(0.0, 0.125, sy)))*0.6;
  vec3 venus = 1.0*exp(-300.0*(length(p - vec2(0.5))))*vec3(1.0);
  vec3 land  = vec3(0.05);
  vec3 sea   = hsv2rgb(vec3(0.5, 0.5*sy, sy))*1.9;

  col = sun1+sun2;
  col = mix(col, sky, max(sy*sy, 0.0));
  col = mix(col, land, smoothstep(0.026, 0.0, sy));
  col += 0.33*(1.0-tanh_approx(8.0*length((p-vec2(0.0, 0.0125))*vec2(0.125, 1.0))));
  col += 0.66*(1.0-tanh_approx(8.0*length((p-vec2(0.0, 0.0125))*vec2(1.0, 1.0))));
  col += venus;
  col += sea*sqrt(max(-p.y, 0.0));

  col = clamp(col, 0.0, 1.0);

  col = mix(col, vec3(0.25, 0.25, 0.25) , 1.0*exp(-10.0*max(ds+so*sqrt(2.0), 0.0)));
  col = mix(col, isRed ? vec3(1.0, 0.215, 0.25) : vec3(1.0), smoothstep(-aa, aa, -d));

  col = clamp(col, 0.0, 1.0);

  return col;
}

vec3 postProcess(vec3 col, vec2 q) {
  col=pow(clamp(col,0.0,1.0),vec3(0.75));
  col=col*0.6+0.4*col*col*(3.0-2.0*col);  // contrast
  col=mix(col, vec3(dot(col, vec3(0.33))), -0.4);  // satuation
  col*=0.5+0.5*pow(19.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.7);  // vigneting
  return col;
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 q = fragCoord/RESOLUTION.xy;
  vec2 p = -1. + 2. * q;
  p.x *= RESOLUTION.x/RESOLUTION.y;
  float aa = 2.0/RESOLUTION.y;

  vec3 dark   = vec3(0.25)*(1.0-tanh_approx(length(p)));
  vec3 sunset = sunset(p, aa);

  float nt = TIME/PERIOD;
  float m = fract(nt)*1.25;
  float n = mod(floor(nt), 2.0);

  vec3 from = n == 0.0 ? dark:sunset;
  vec3 to   = n != 0.0 ? dark:sunset;

  vec3 col = hexTransition(p, aa, from, to, m);

  //col = postProcess(col, q);


  fragColor = vec4(col, 1.0);
}
