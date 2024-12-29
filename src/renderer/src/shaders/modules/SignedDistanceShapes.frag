precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

//////////////////////////////////////
// Combine distance field functions //
//////////////////////////////////////

float smoothMerge(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

float merge(float d1, float d2) {
  return min(d1, d2);
}

float mergeExclude(float d1, float d2) {
  return min(max(-d1, d2), max(-d2, d1));
}

float substract(float d1, float d2) {
  return max(-d1, d2);
}

float intersect(float d1, float d2) {
  return max(d1, d2);
}

//////////////////////////////
// Rotation and translation //
//////////////////////////////

vec2 rotateCCW(vec2 p, float angle) {
  mat2 m = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
  return p * m;
}

vec2 rotateCW(vec2 p, float angle) {
  mat2 m = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  return p * m;
}

mat2 rotateCCW(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

mat2 rotateCW(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

vec2 translate(vec2 p, vec2 t) {
  return p - t;
}

//////////////////////////////
// Distance field functions //
//////////////////////////////

float pieDist(vec2 p, float angle) {
  angle = radians(angle) / 2.0;
  vec2 n = vec2(cos(angle), sin(angle));
  return abs(p).x * n.x + p.y * n.y;
}

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
}

vec3 circleSDG(in vec2 p, in float r)
{
    float d = length(p);
    return vec3( d-r, p/d );

    // float dist = circleDist(p, r);

    // const float eps = 0.001;
    // vec2 grad = normalize(vec2(
    //     (circleDist(p+vec2(1,0)*eps, r)-circleDist(p+vec2(-1,0)*eps, r)),
    //     (circleDist(p+vec2(0,1)*eps, r)-circleDist(p+vec2( 0,-1)*eps, r))
    // ));
    // return vec3(dist, grad);
}

float triangleDist(vec2 p, float radius) {
  return max(abs(p).x * 0.866025 +
    p.y * 0.5, -p.y) - radius * 0.5;
}

float triangleDist(vec2 p, float width, float height) {
  p.y += height * 0.5;
  vec2 n = normalize(vec2(height, width / 2.0));
  return max(abs(p).x * n.x + p.y * n.y - (height * n.y), -p.y);
}

vec3 triangleSDG( in vec2 p, float width, float height)
{
  p += vec2(0.0, -height/2.0);
  vec2 q = vec2(width/2.0, -height);
  float w = sign(p.x);
  p.x = abs(p.x);
  vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
  vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
  float k = sign(q.y);
  float l1 = dot(a,a);
  float l2 = dot(b,b);
  float d = sqrt((l1<l2)?l1:l2);
  vec2  g =      (l1<l2)? a: b;
  float s = max( k*(p.x*q.y-p.y*q.x),k*(p.y-q.y)  );
  return vec3(d,vec2(w*g.x,g.y)/d)*sign(s);
}

float semiCircleDist(vec2 p, float radius, float angle, float width) {
  width /= 2.0;
  radius -= width;
  return substract(pieDist(p, angle), abs(circleDist(p, radius)) - width);
}

float lineDist(vec2 p, vec2 start, vec2 end, float width) {
  vec2 dir = start - end;
  float lngth = length(dir);
  dir /= lngth;
  vec2 proj = max(0.0, min(lngth, dot((start - p), dir))) * dir;
  return length((start - p) - proj) - (width / 2.0);
}

float boxDist(vec2 p, vec2 size) {
  size /= 2.0;
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec3 boxSDG( in vec2 p, in vec2 size ) {
  size /= 2.0;
  vec2 w = abs(p) - size;
  vec2 s = vec2(p.x < 0.0 ? -1 : 1, p.y < 0.0 ? -1 : 1);
  float g = max(w.x, w.y);
  vec2  q = max(w, 0.0);
  float l = length(q);
  return vec3((g > 0.0) ? l : g, s * ((g > 0.0) ? q / l : ((w.x > w.y) ? vec2(1, 0) : vec2(0, 1))));
}

vec4 roundedCornersVector(float corners) {
  // CORNERS IS A VALUE FROM 0 TO 15, 1,2,4,8 indicate the chamfered corner and the sum of the values is between 0 and 15 base 2 added up

  // r.x = roundness top-right
  // r.y = roundness top-left
  // r.z = roundness bottom-left
  // r.w = roundness bottom-right
  vec4 r = vec4(0.0, 0.0, 0.0, 0.0);

  // default to all corners
  corners = mod(corners, 16.0);
  if (corners == 0.0) {
    corners = 15.0;
  }
  // bottom-right
  r.w = step(8.0, corners);
  corners = mod(corners, 8.0);
  // bottom-left
  r.z = step(4.0, corners);
  corners = mod(corners, 4.0);
  // top-left
  r.y = step(2.0, corners);
  corners = mod(corners, 2.0);
  // top-right
  r.x = step(1.0, corners);
  corners = mod(corners, 1.0);
  return r;
}

// this only works if angle is a factor of 45 and num_of_spokes is 1,2,4
// returns vec4 indicating ur, ul, bl, br
vec4 openCorners(in float angle, in float num_of_spokes) {
  vec4 a = vec4(45.0, 315.0, 225.0, 135.0);
  vec4 b = step(mod((a - 45.0) + (angle - 45.0), (360.0 / num_of_spokes)), vec4(0.0));
  return b;
}

// Round Box with rounded all corners
float roundBoxDist(vec2 p, vec2 size, float radius) {
  size /= 2.0;
  size -= vec2(radius);
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;
}

// Round Box with rounded all corners
vec3 roundBoxSDG(vec2 p, vec2 size, float radius) {
  size -= (radius * 2.0);
  vec3 dis_gra = boxSDG(p, size);
  return vec3( dis_gra.x - radius, dis_gra.yz );
}

// Round box with vec4 of rounded corners
float roundBoxDist(vec2 p, vec2 size, vec4 corners) {
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  vec2 q = abs(p) - size + corners.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - corners.x;
}

// Round box with vec4 of rounded corners
vec3 roundBoxSDG(vec2 p, vec2 size, vec4 corners) {
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  // vec2 q = abs(p) - size + corners.x;
  // return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - corners.x;
  vec3 dis_gra = boxSDG(p, size - (corners.x * 2.0));
  return vec3( dis_gra.x - corners.x, dis_gra.yz );
}

// Round box with uniform corner radius and float of corners rounded, see roundedCornersVector
float roundBoxDist(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return roundBoxDist(p, size, r);
}

// Round box with uniform corner radius and float of corners rounded, see roundedCornersVector
vec3 roundBoxSDG(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return roundBoxSDG(p, size, r);
}

// Chamfered box with vec4 of chamfered corners
float chamferedBoxDist(vec2 p, vec2 size, vec4 corners) {
  float distb = boxDist(p ,size);
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  float dista = (abs(p.x) + abs(p.y) - (size.x + size.y) + corners.x) / sqrt(2.0);
  // vec2 d = abs(p) - size;
  return intersect(distb, dista);
}

vec3 segmentSDF( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 ba = b-a;
    vec2 pa = p-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    vec2  q = pa-h*ba;
    float d = length(q);

    //https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line
    //Given a line a--b and point c
    //(b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x) > 0;
    float side = (b.x - a.x)*(p.y - a.y) - (b.y - a.y)*(p.x - a.x);

    return vec3(d*sign(side),q/d*sign(side));
}

vec3 mergeSDG( in vec3 fill, in vec3 remove) {
  if (fill.x > remove.x) {
    return fill;
  }
  return remove;
}

// Chamfered box with vec4 of chamfered corners
vec3 chamferedBoxSDG(vec2 p, vec2 size, vec4 corners) {
  // float dist = chamferedBoxDist(p, size, corners);
  // const float eps = 0.001;
  // vec2 grad = normalize(vec2(
  //     (chamferedBoxDist(p+vec2(1,0)*eps, size, corners)-chamferedBoxDist(p+vec2(-1,0)*eps, size, corners)),
  //     (chamferedBoxDist(p+vec2(0,1)*eps, size, corners)-chamferedBoxDist(p+vec2( 0,-1)*eps, size, corners))
  // ));
  // return vec3(dist, grad);

  vec3 box = boxSDG(p, size);
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  vec3 chamfer = segmentSDF(abs(p), size - vec2(corners.x, 0.0), size - vec2(0.0, corners.x));
  if (box.x > chamfer.x) {
    return box;
  } else {
    if (abs(p.x) < size.x - corners.x && chamfer.x >= 0.0) {
      return box;
    }
    if (abs(p.y) < size.y - corners.x && chamfer.x >= 0.0) {
      return box;
    }
    return chamfer * vec3(1.0, sign(p.x), sign(p.y));
  }
}

// Chamfered box with uniform corner radius and float of corners rounded, see roundedCornersVector
float chamferedBoxDist(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return chamferedBoxDist(p, size, r);
}

// Chamfered box with uniform corner radius and float of corners rounded, see roundedCornersVector
vec3 chamferedBoxSDG(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return chamferedBoxSDG(p, size, r);
}

// Diamond
float diamonDist(vec2 p, vec2 size) {
  float dist = abs(p.x) * size.y + abs(p.y) * size.x - size.x * size.y * 0.5;
  return dist / (size.x + size.y) * 2.0;
}

// Diamond
vec3 diamonSDG(vec2 p, vec2 size) {
  vec2 ap = abs(p);
  vec3 side = segmentSDF(ap, vec2(size.x/2.0, 0.0), vec2(0.0, size.y/2.0));
  return side * vec3(1.0, sign(p.x), sign(p.y));
}

// Horizontal Hexagon has flat top and bottom
float verticalHexagonDist(vec2 p, vec2 size, float radius) {
  float dist = abs(p.x) * (size.y - (size.y - radius * 2.0)) + abs(p.y) * size.x - size.x * size.y * 0.5;
  dist = dist / (size.x + size.y) * 2.0;
  return max(dist, boxDist(p, size));
}

// Vertical Hexagon has pointy top and bottom
float horizHexagonDist(vec2 p, vec2 size, float radius) {
  float dist = abs(p.x) * size.y + abs(p.y) * (size.x - (size.x - radius * 2.0)) - size.x * size.y * 0.5;
  dist = dist / (size.x + size.y) * 2.0;
  return max(dist, boxDist(p, size));
}

// Horizontal Hexagon has flat top and bottom
// vec3 horizHexagonSDG( in vec2 p, in float r )
// {
//     const vec3 k = vec3(-0.866025404,0.5,0.577350269);
//     vec2 s = sign(p); p = abs(p);
//     float w = dot(k.xy,p);
//     p -= 2.0*min(w,0.0)*k.xy;
//     p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
//     float d = length(p)*sign(p.y);
//     vec2  g = (w<0.0) ? mat2(-k.y,-k.x,-k.x,k.y)*p : p;
//     return vec3( d, s*g/d );
// }

// Vertical Hexagon has pointy top and bottom
vec3 verticalHexagonSDG(vec2 p, vec2 size, float radius) {
vec3 box = boxSDG(p, size);
size /= 2.0;
vec3 chamfer = segmentSDF(abs(p), size - vec2(size.x, 0.0), size - vec2(0.0, radius));
if (box.x > chamfer.x) {
  return box;
} else {
  if (abs(p.x) < size.x - size.x && chamfer.x >= 0.0) {
    return box;
  }
  if (abs(p.y) < size.y - radius && chamfer.x >= 0.0) {
    return box;
  }
  return chamfer * vec3(1.0, sign(p.x), sign(p.y));
}
}

// Horizontal Hexagon has flat top and bottom
vec3 horizHexagonSDG(vec2 p, vec2 size, float radius) {
  vec3 box = boxSDG(p, size);
  size /= 2.0;
  vec3 chamfer = segmentSDF(abs(p), size - vec2(radius, 0.0), size - vec2(0.0, size.y));
  if (box.x > chamfer.x) {
    return box;
  } else {
    if (abs(p.x) < size.x - radius && chamfer.x >= 0.0) {
      return box;
    }
    if (abs(p.y) < size.y - size.y && chamfer.x >= 0.0) {
      return box;
    }
    return chamfer * vec3(1.0, sign(p.x), sign(p.y));
  }
}

float butterflyDist(vec2 p, float dist) {
  float d = circleDist(p, dist);
  float ulSquareDist = boxDist(p - vec2(-0.5 * dist, 0.5 * dist), vec2(dist, dist));
  float lrSquareDist = boxDist(p - vec2(0.5 * dist, -0.5 * dist), vec2(dist, dist));
  float ul = max(d, ulSquareDist);
  float lr = max(d, lrSquareDist);
  d = min(ul, lr);
  return d;
}

vec3 butterflySDG(vec2 p, float dist) {
  vec3 d = circleSDG(p, dist);
  vec3 ulSquare = boxSDG(p - vec2(-0.5 * dist, 0.5 * dist), vec2(dist, dist));
  vec3 lrSquare = boxSDG(p - vec2(0.5 * dist, -0.5 * dist), vec2(dist, dist));
  if (p.x - p.y < 0.0) {
    return mergeSDG(d, ulSquare);
  } else {
    return mergeSDG(d, lrSquare);
  }
}

float squareButterflydist(vec2 p, float dist) {
  float ul = boxDist(p - vec2(-0.5 * dist, 0.5 * dist), vec2(dist, dist));
  float lr = boxDist(p - vec2(0.5 * dist, -0.5 * dist), vec2(dist, dist));
  float d = min(ul, lr);
  return d;
}

vec3 squareButterflySDG(vec2 p, float dist) {
  vec3 ul = boxSDG(p - vec2(-0.5 * dist, 0.5 * dist), vec2(dist, dist));
  vec3 lr = boxSDG(p - vec2(0.5 * dist, -0.5 * dist), vec2(dist, dist));
  if (p.x - p.y < 0.0) {
    return ul;
  } else {
    return lr;
  }
}

float spokeDist(vec2 p, float angle, float num_spokes, float gap) {

  float r_angle = radians(angle);
  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_spokes) * atan(tan((num_spokes / 2.0) * n_angle));

  float leng = length(p);

  float da = (leng * sin(n_angle) + gap / 2.0);
  float db = (-leng * sin(n_angle) + gap / 2.0);
  float spokes = min(da, db);
  if (num_spokes == 1.0) {
    p = rotateCW(r_angle) * p;
    spokes = min(spokes, p.x);
  }

  return spokes;
}

float ellipseDist(vec2 p, vec2 ab) {
    // symmetry
  p = abs(p);

    // find root with Newton solver
  vec2 q = ab * (p - ab);
  float w = (q.x < q.y) ? 1.570796327 : 0.0;
  for (int i = 0; i < 5; i++) {
    vec2 cs = vec2(cos(w), sin(w));
    vec2 u = ab * vec2(cs.x, cs.y);
    vec2 v = ab * vec2(-cs.y, cs.x);
    w = w + dot(p - u, v) / (dot(p - u, u) + dot(v, v));
  }

    // compute final point and distance
  float d = length(p - ab * vec2(cos(w), sin(w)));

    // return signed distance
  return (dot(p / ab, p / ab) > 1.0) ? d : -d;
}

float moireODBDist(vec2 p, float ring_width, float ring_gap, float num_rings, float line_width, float line_length, float angle) {

  ring_gap = ring_gap - (ring_width / 2.0);
  float a = ((ring_width + ring_gap) / 2.0);

  float t = (ring_width - ring_gap) / 4.0;
  float offset = ring_gap + (ring_width / 2.0);

  float rings = (a / PI) * asin(sin((PI / a) * (length(p) + t - offset))) - t;
  float rings_edge = circleDist(p, ((ring_width + ring_gap) * num_rings) + (ring_width / 2.0) + ring_gap);

  float target_pad = circleDist(p, ring_width / 2.0);
  float target_pad_clearance = -circleDist(p, (ring_width / 2.0) + (ring_gap * 2.0));
  float target = min(target_pad, target_pad_clearance);

  rings = max(rings, rings_edge);
  rings = max(rings, target);

  float lines = -spokeDist(p, angle, 4.0, line_width);
  float lines_edge = boxDist(p * rotateCW(-radians(angle)), vec2(line_length, line_length));
  lines = max(lines, lines_edge);

  return min(rings, lines);
}

float moireGerberDist(vec2 p, float ring_width, float ring_gap, float num_rings, float line_width, float line_length, float angle, float outer_dia) {

  float a = ((ring_width + ring_gap) / 2.0);
  float t = (ring_width - ring_gap) / 4.0;
  float offset = outer_dia / 2.0;

  float rings = (a / PI) * asin(sin((PI / a) * (length(p) + t - offset))) - t;
  float rings_edge = circleDist(p, outer_dia / 2.0);
  float inner_rings_edge = -circleDist(p, (outer_dia / 2.0) - (ring_width * num_rings) - (ring_gap * (num_rings - 1.0)));
  rings = max(inner_rings_edge, max(rings, rings_edge));

  float lines = -spokeDist(p, angle, 4.0, line_width);
  float lines_edge = boxDist(p * rotateCW(-radians(angle)), vec2(line_length, line_length));
  lines = max(lines, lines_edge);

  return min(rings, lines);
}

// signed distance to a n-star polygon with external angle en
float regularPolygonDist(in vec2 p, in float r, in int n) {
    // these 4 lines can be precomputed for a given shape
  float an = PI / float(n);
  vec2 acs = vec2(cos(an), sin(an));

    // reduce to first sector
  float bn = mod(atan(p.y, p.x), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));

    // line sdf
  p -= r * acs;
  p.y += clamp(-p.y, 0.0, r * acs.y);
  return length(p) * sign(p.x);
}

///////////////////////
// Masks for drawing //
///////////////////////

float fillMask(float dist) {
  return clamp(-dist, 0.0, 1.0);
}

float innerBorderMask(float dist, float width) {
	//dist += 1.0;
  float alpha1 = clamp(dist + width, 0.0, 1.0);
  float alpha2 = clamp(dist, 0.0, 1.0);
  return alpha1 - alpha2;
}

float outerBorderMask(float dist, float width) {
	//dist += 1.0;
  float alpha1 = clamp(dist, 0.0, 1.0);
  float alpha2 = clamp(dist - width, 0.0, 1.0);
  return alpha1 - alpha2;
}

// this is an easy polygon of v sides sides
// https://iquilezles.org/articles/distfunctions2d/
// float sdPolygon( in vec2[N] v, in vec2 p )
// {
//     float d = dot(p-v[0],p-v[0]);
//     float s = 1.0;
//     for( int i=0, j=N-1; i<N; j=i, i++ )
//     {
//         vec2 e = v[j] - v[i];
//         vec2 w =    p - v[i];
//         vec2 b = w - e*clamp( dot(w,e)/dot(e,e), 0.0, 1.0 );
//         d = min( d, dot(b,b) );
//         bvec3 c = bvec3(p.y>=v[i].y,p.y<v[j].y,e.x*w.y>e.y*w.x);
//         if( all(c) || all(not(c)) ) s*=-1.0;
//     }
//     return s*sqrt(d);
// }

///////////////////////
//   SDG Utilities   //
///////////////////////

// vec3 onionSDG( in vec2 p, in float r )
// {
//   vec3 dis_gra = sdgShape(p);
//   return vec3( abs(dis_gra.x) - r, sign(dis_gra.x)*dis_gra.yz );
// }

// vec3 mergeSDG( in vec3 fill, in vec3 remove) {
//   if (fill.x > remove.x) {
//     return fill;
//   }
//   return remove * vec3(1.0, 1.0, 1.0);
// }

// vec3 sdgRound( in vec2 p, in float r )
// {
//   vec3 dis_gra = sdgShape(p);
//   return vec3( dis_gra.x - r, dis_gra.yz );
// }

// vec2 gradient(vec2 p)
// {
//     const float eps = 0.001;
//     return normalize(vec2(
//         (shape(p+vec2(1,0)*eps)-shape(p+vec2(-1,0)*eps)),
//         (shape(p+vec2(0,1)*eps)-shape(p+vec2( 0,-1)*eps))
//     ));
// }

#pragma glslify: pullSymbolParameter = require(./PullSymbolParameter.frag,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

vec3 drawShape(vec2 FragCoord, int SymNum) {

  float t_Symbol = pullSymbolParameter(u_Parameters.symbol, SymNum);
  float t_Width = pullSymbolParameter(u_Parameters.width, SymNum);
  float t_Height = pullSymbolParameter(u_Parameters.height, SymNum);
  float t_Corner_Radius = pullSymbolParameter(u_Parameters.corner_radius, SymNum);
  float t_Corners = pullSymbolParameter(u_Parameters.corners, SymNum);
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, SymNum);
  float t_Inner_Dia = pullSymbolParameter(u_Parameters.inner_dia, SymNum);
  float t_Line_Width = pullSymbolParameter(u_Parameters.line_width, SymNum);
  float t_Line_Length = pullSymbolParameter(u_Parameters.line_length, SymNum);
  float t_Angle = pullSymbolParameter(u_Parameters.angle, SymNum);
  float t_Gap = pullSymbolParameter(u_Parameters.gap, SymNum);
  float t_Num_Spokes = pullSymbolParameter(u_Parameters.num_spokes, SymNum);
  float t_Round = pullSymbolParameter(u_Parameters.round, SymNum);
  // float t_Cut_Size = pullSymbolParameter(u_Parameters.cut_size);
  float t_Ring_Width = pullSymbolParameter(u_Parameters.ring_width, SymNum);
  float t_Ring_Gap = pullSymbolParameter(u_Parameters.ring_gap, SymNum);
  float t_Num_Rings = pullSymbolParameter(u_Parameters.num_rings, SymNum);

  float dist = 10.0;
  vec3 sdg = vec3(10.0,10.0,10.0);

  // SD - Signed Distance (float)
  // SDG - Signed Distance with Gradient (vec3)


  if (t_Symbol == u_Symbols.Round || t_Symbol == u_Symbols.Hole) {
    // SD Variant
    // dist = circleDist(FragCoord.xy, t_Outer_Dia / 2.0);
    // if (t_Inner_Dia != 0.0) {
    //   float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    //   dist = max(dist, hole);
    // }
    // SDG Variant
    sdg = circleSDG(FragCoord.xy, t_Outer_Dia / 2.0);
    if (t_Inner_Dia != 0.0) {
      vec3 hole = -1.0 * circleSDG(FragCoord.xy, t_Inner_Dia / 2.0);
      sdg = mergeSDG(sdg, hole);
    }
  } else if (t_Symbol == u_Symbols.Square || t_Symbol == u_Symbols.Rectangle) {
    // SD Variant
    // dist = boxDist(FragCoord.xy, vec2(t_Width, t_Height));
    // if (t_Inner_Dia != 0.0) {
    //   float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    //   dist = max(dist, hole);
    // }
    // SDG Variant
    sdg = boxSDG(FragCoord.xy, vec2(t_Width, t_Height));
    if (t_Inner_Dia != 0.0) {
      vec3 hole = -1.0 * circleSDG(FragCoord.xy, t_Inner_Dia / 2.0);
      sdg = mergeSDG(sdg, hole);
    }
  } else if (t_Symbol == u_Symbols.Rounded_Rectangle) {
    // SD Variant
    // dist = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    // if (t_Inner_Dia != 0.0) {
    //   float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    //   dist = max(dist, hole);
    // }
    // SDG Variant
    sdg = roundBoxSDG(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    if (t_Inner_Dia != 0.0) {
      vec3 hole = -1.0 * circleSDG(FragCoord.xy, t_Inner_Dia / 2.0);
      sdg = mergeSDG(sdg, hole);
    }
  } else if (t_Symbol == u_Symbols.Oval) {
    // SD Variant
    // dist = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
    // if (t_Inner_Dia != 0.0) {
    //   float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    //   dist = max(dist, hole);
    // }
    // SDG Variant
    sdg = roundBoxSDG(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
    if (t_Inner_Dia != 0.0) {
      vec3 hole = -1.0 * circleSDG(FragCoord.xy, t_Inner_Dia / 2.0);
      sdg = mergeSDG(sdg, hole);
    }
  } else if (t_Symbol == u_Symbols.Chamfered_Rectangle) {
    // SD Variant
    // dist = chamferedBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    // if (t_Inner_Dia != 0.0) {
    //   float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    //   dist = max(dist, hole);
    // }
    // SDG Variant
    sdg = chamferedBoxSDG(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    if (t_Inner_Dia != 0.0) {
      vec3 hole = -1.0 * circleSDG(FragCoord.xy, t_Inner_Dia / 2.0);
      sdg = mergeSDG(sdg, hole);
    }
  } else if (t_Symbol == u_Symbols.Diamond) {
    // SD Variant
    // dist = diamonDist(FragCoord.xy, vec2(t_Width, t_Height));
    // if (t_Inner_Dia != 0.0) {
    //   float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    //   dist = max(dist, hole);
    // }
    // SDG Variant
    sdg = diamonSDG(FragCoord.xy, vec2(t_Width, t_Height));
    if (t_Inner_Dia != 0.0) {
      vec3 hole = -1.0 * circleSDG(FragCoord.xy, t_Inner_Dia / 2.0);
      sdg = mergeSDG(sdg, hole);
    }
  } else if (t_Symbol == u_Symbols.Octagon) {
    // SD Variant
    // dist = chamferedBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, 15.0);
    // if (t_Inner_Dia != 0.0) {
    //   float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    //   dist = max(dist, hole);
    // }
    // SDG Variant
    sdg = chamferedBoxSDG(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, 15.0);
    if (t_Inner_Dia != 0.0) {
      vec3 hole = -1.0 * circleSDG(FragCoord.xy, t_Inner_Dia / 2.0);
      sdg = mergeSDG(sdg, hole);
    }
  } else if (t_Symbol == u_Symbols.Round_Donut) {
    // SD Variant
    // float InnerCircle = circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    // float OuterCircle = circleDist(FragCoord.xy, t_Outer_Dia / 2.0);
    // dist = substract(InnerCircle, OuterCircle);
    // SDG Variant
    vec3 OuterCircleSDG = circleSDG(FragCoord.xy, t_Outer_Dia / 2.0);
    vec3 InnerCircleSDG = circleSDG(FragCoord.xy, t_Inner_Dia / 2.0) * -1.0;
    sdg = mergeSDG(OuterCircleSDG, InnerCircleSDG);

  } else if (t_Symbol == u_Symbols.Square_Donut) {
    // SD Variant
    // float InnerSquare = boxDist(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia));
    // float OuterSquare = boxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia));
    // dist = substract(InnerSquare, OuterSquare);
    // SDG Variant
    vec3 OuterSquareSDG = boxSDG(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia));
    vec3 InnerSquareSDG = boxSDG(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia)) * -1.0;
    sdg = mergeSDG(OuterSquareSDG, InnerSquareSDG);
  } else if (t_Symbol == u_Symbols.SquareRound_Donut) {
    // SD Variant
    // float InnerCircle = circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    // float OuterCircle = boxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia));
    // dist = substract(InnerCircle, OuterCircle);
    // SDG Variant
    vec3 OuterSquareSDG = roundBoxSDG(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    vec3 InnerCircleSDG = -1.0 * circleSDG(FragCoord.xy, t_Inner_Dia / 2.0);
    sdg = mergeSDG(OuterSquareSDG, InnerCircleSDG);
  } else if (t_Symbol == u_Symbols.Rounded_Square_Donut) {
    // SD Variant
    // float InnerSquare = roundBoxDist(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia), t_Corner_Radius - (t_Outer_Dia - t_Inner_Dia) / 2.0, t_Corners);
    // float OuterSquare = roundBoxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia), t_Corner_Radius, t_Corners);
    // dist = substract(InnerSquare, OuterSquare);
    // SDG Variant
    vec3 InnerSquareSDG = roundBoxSDG(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia), t_Corner_Radius - (t_Outer_Dia - t_Inner_Dia) / 2.0, t_Corners) * -1.0;
    vec3 OuterSquareSDG = roundBoxSDG(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia), t_Corner_Radius, t_Corners);
    sdg = mergeSDG(OuterSquareSDG, InnerSquareSDG);
  } else if (t_Symbol == u_Symbols.Rectangle_Donut) {
    // SD Variant
    // float InnerRect = boxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0));
    // float OuterRect = boxDist(FragCoord.xy, vec2(t_Width, t_Height));
    // dist = substract(InnerRect, OuterRect);
    // SDG Variant
    vec3 OuterRectSDG = boxSDG(FragCoord.xy, vec2(t_Width, t_Height));
    vec3 InnerRectSDG = boxSDG(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0)) * -1.0;
    sdg = mergeSDG(OuterRectSDG, InnerRectSDG);

  } else if (t_Symbol == u_Symbols.Rounded_Rectangle_Donut) {
    // SD Variant
    // float OuterRect = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    // float InnerRect = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), t_Corner_Radius - t_Line_Width, t_Corners);
    // dist = substract(InnerRect, OuterRect);
    // SDG Variant
    vec3 OuterRectSDG = roundBoxSDG(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    vec3 InnerRectSDG = roundBoxSDG(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), t_Corner_Radius - t_Line_Width, t_Corners) * -1.0;
    sdg = mergeSDG(OuterRectSDG, InnerRectSDG);
  } else if (t_Symbol == u_Symbols.Oval_Donut) {
    // SD Variant
    // float OuterOval = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
    // float InnerOval = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), min(t_Height, t_Width) / 2.0 - t_Line_Width);
    // dist = substract(InnerOval, OuterOval);
    // SDG Variant
    vec3 OuterOvalSDG = roundBoxSDG(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
    vec3 InnerOvalSDG = roundBoxSDG(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), min(t_Height, t_Width) / 2.0 - t_Line_Width) * -1.0;
    sdg = mergeSDG(OuterOvalSDG, InnerOvalSDG);
  } else if (t_Symbol == u_Symbols.Horizontal_Hexagon) {
    // SD Variant
    // dist = horizHexagonDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius);
    // SDG Variant
    sdg = horizHexagonSDG(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius);
  } else if (t_Symbol == u_Symbols.Vertical_Hexagon) {
    // SD Variant
    // dist = verticalHexagonDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius);
    // SDG Variant
    sdg = verticalHexagonSDG(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius);
  } else if (t_Symbol == u_Symbols.Butterfly) {
    // SD Variant
    // dist = butterflyDist(FragCoord.xy, t_Outer_Dia / 2.0);
    // SDG Variant
    sdg = butterflySDG(FragCoord.xy, t_Outer_Dia / 2.0);
  } else if (t_Symbol == u_Symbols.Square_Butterfly) {
    // SD Variant
    // dist = squareButterflydist(FragCoord.xy, t_Width / 2.0);
    // SDG Variant
    sdg = squareButterflySDG(FragCoord.xy, t_Width / 2.0);
  } else if (t_Symbol == u_Symbols.Triangle) {
    // SD Variant
    // dist = triangleDist(FragCoord.xy, t_Width, t_Height);
    // SDG Variant
    sdg = triangleSDG(FragCoord.xy, t_Width, t_Height);
  } else if (t_Symbol == u_Symbols.Half_Oval) {
    // SD Variant
    // dist = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Height / 2.0, 9.0);
    // SDG Variant
    sdg = roundBoxSDG(FragCoord.xy, vec2(t_Width, t_Height), t_Height / 2.0, 9.0);
  } else if (t_Symbol == u_Symbols.Ellipse) {
    dist = ellipseDist(FragCoord.xy, vec2(t_Width / 2.0, t_Height / 2.0));
  } else if (t_Symbol == u_Symbols.Polygon) {
    dist = regularPolygonDist(FragCoord.xy * rotateCW(radians(t_Angle)), t_Outer_Dia / 2.0, int(t_Corners));
    if (t_Line_Width != 0.0) {
      float inner = -1.0 * regularPolygonDist(FragCoord.xy * rotateCW(radians(t_Angle)), (t_Outer_Dia / 2.0) - t_Line_Width, int(t_Corners));
      dist = max(dist, inner);
    }
    if (t_Inner_Dia != 0.0) {
      float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
      dist = max(dist, hole);
    }
  } else {
    // u_Symbols.Null
    dist = SDF_FAR_AWAY;
  }
  // return dist;
  return sdg;
}

#pragma glslify: export(drawShape)
