precision mediump float;

#define PI 3.1415926535897932384626433832795
#define DEBUG 0

uniform struct shapes {
  float Round;
  float Square;
  float Rectangle;
  float Rounded_Rectangle;
  float Chamfered_Rectangle;
  float Oval;
  float Diamond;
  float Octagon;
  float Round_Donut;
  float Square_Donut;
  float SquareRound_Donut;
  float Rounded_Square_Donut;
  float Rectange_Donut;
  float Rounded_Rectangle_Donut;
  float Oval_Donut;
  float Horizontal_Hexagon;
  float Vertical_Hexagon;
  float Butterfly;
  float Square_Butterfly;
  float Triangle;
  float Half_Oval;
  float Rounded_Round_Thermal;
  float Squared_Round_Thermal;
  float Square_Thermal;
  float Open_Corners_Square_Thermal;
  float Line_Thermal;
  float Square_Round_Thermal;
  float Rectangular_Thermal;
  float Rectangular_Thermal_Open_Corners;
  float Rounded_Square_Thermal;
  float Rounded_Square_Thermal_Open_Corners;
  float Rounded_Rectangular_Thermal;
  float Oval_Thermal;
  float Oblong_Thermal;
  // float Home_Plate;
  // float Inverted_Home_Plate;
  // float Flat_Home_Plate;
  // float Radiused_Inverted_Home_Plate;
  // float Radiused_Home_Plate;
  // float Cross;
  // float Dogbone;
  // float DPack;
  float Ellipse;
  float Moire;
  float Hole;
  float Null;
} u_Shapes;

uniform struct parameters {
  highp int symbol;
  highp int width;
  highp int height;
  highp int corner_radius;
  highp int corners;
  highp int outer_dia;
  highp int inner_dia;
  highp int line_width;
  highp int line_length;
  highp int angle;
  highp int gap;
  highp int num_spokes;
  highp int round;
  highp int cut_size;
  highp int ring_width;
  highp int ring_gap;
  highp int num_rings;
} u_Parameters;

// #pragma glslify: parameters = require('./modules/test.frag')
// uniform parameters u_Parameters;
//  = parameters(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18);

uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform vec2 u_Screen;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;
// uniform float u_Scale;

varying float v_Index;
varying float v_SymNum;
varying vec2 v_Location;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror;

varying vec3 v_Color;
varying float v_Aspect;

// varying float v_TexColor;

const float ALPHA = 0.8;

mat2 rotate2d(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}

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

vec2 rotateCCW(vec2 p, float a) {
  mat2 m = mat2(cos(a), sin(a), -sin(a), cos(a));
  return p * m;
}

vec2 rotateCW(vec2 p, float a) {
  mat2 m = mat2(cos(a), -sin(a), sin(a), cos(a));
  return p * m;
}

vec2 translate(vec2 p, vec2 t) {
  return p - t;
}

//////////////////////////////
// Distance field functions //
//////////////////////////////

float pie(vec2 p, float angle) {
  angle = radians(angle) / 2.0;
  vec2 n = vec2(cos(angle), sin(angle));
  return abs(p).x * n.x + p.y * n.y;
}

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
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

float semiCircleDist(vec2 p, float radius, float angle, float width) {
  width /= 2.0;
  radius -= width;
  return substract(pie(p, angle), abs(circleDist(p, radius)) - width);
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

// float roundBoxDist(vec2 p, vec2 size, float radius) {
//   size /= 2.0;
//   size -= vec2(radius);
//   vec2 d = abs(p) - size;
//   return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;
// }

float sdRoundBox(in vec2 p, in vec2 size, in vec4 r) {
  size /= 2.0;
  r.xy = (p.x > 0.0) ? r.xy : r.zw;
  r.x = (p.y > 0.0) ? r.x : r.y;
  vec2 q = abs(p) - size + r.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

vec4 roundedCornersVectorOld(float corners) {
  // CORNERS IS A VALUE FROM 0 TO 15, 1,2,4,8 indicate the chamfered corner and the sum of the values is between 0 and 15 base 2 added up

  // r.x = roundness top-right
  // r.y = roundness boottom-right
  // r.z = roundness top-left
  // r.w = roundness bottom-left
  vec4 r = vec4(0.0, 0.0, 0.0, 0.0);

  // default to all corners
  if (corners == 0.0) {
    corners = 15.0;
  }
  // boottom-right
  if (corners >= 8.0) {
    r.y = 1.0;
    corners -= 8.0;
  }
  // bottom-left
  if (corners >= 4.0) {
    r.w = 1.0;
    corners -= 4.0;
  }
  // top-left
  if (corners >= 2.0) {
    r.z = 1.0;
    corners -= 2.0;
  }
  // top-right
  if (corners >= 1.0) {
    r.x = 1.0;
    corners -= 1.0;
  }
  return r;
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

// Round box with vec4 of rounded corners
float roundBoxDist(vec2 p, vec2 size, vec4 corners) {
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  vec2 q = abs(p) - size + corners.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - corners.x;
}

// Round box with uniform corner radius and float of corners rounded, see roundedCornersVector
float roundBoxDist(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return roundBoxDist(p, size, r);
}

// Chamfered box with vec4 of rounded corners
float chamferedBoxDist(vec2 p, vec2 size, vec4 corners) {
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  float dista = abs(p.x) + abs(p.y) - (size.x + size.y) + corners.x;
  vec2 d = abs(p) - size;
  return intersect(min(max(d.x, d.y), 0.0), dista);
}

// Chamfered box with uniform corner radius and float of corners rounded, see roundedCornersVector
float chamferedBoxDist(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return chamferedBoxDist(p, size, r);
}

// Diamond
float diamonDist(vec2 p, vec2 size) {
  float dist = abs(p.x) * size.y + abs(p.y) * size.x - size.x * size.y * 0.5;
  return dist / (size.x + size.y) * 2.0;
}

// Horizontal Hexagon
float verticalHexagonDist(vec2 p, vec2 size, float radius) {
  float dist = abs(p.x) * (size.y - (size.y - radius * 2.0)) + abs(p.y) * size.x - size.x * size.y * 0.5;
  dist = dist / (size.x + size.y) * 2.0;
  return max(dist, boxDist(p, size));
}

// Vertical Hexagon
float horizHexagonDist(vec2 p, vec2 size, float radius) {
  float dist = abs(p.x) * size.y + abs(p.y) * (size.x - (size.x - radius * 2.0)) - size.x * size.y * 0.5;
  dist = dist / (size.x + size.y) * 2.0;
  return max(dist, boxDist(p, size));
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

float squareButterflydist(vec2 p, float dist) {
  float ul = boxDist(p - vec2(-0.5 * dist, 0.5 * dist), vec2(dist, dist));
  float lr = boxDist(p - vec2(0.5 * dist, -0.5 * dist), vec2(dist, dist));
  float d = min(ul, lr);
  return d;
}

// float spokeDist(vec2 p, float angle, float num_spokes, float gap) {

//   float r_angle = radians(angle);
//   float n_angle = atan(p.y, p.x) - r_angle;
//   n_angle = (2.0 / num_spokes) * asin(sin((num_spokes / 2.0) * n_angle));

//   float leng = length(p);

//   // r = ro * cos(n_angle − theta1) + √( 𝑅^2 − (ro^2) * sin^2(n_angle − theta1))
//   float off = gap * 3.0;
//   float R = gap / 3.0;
//   // float ro = sqrt(off * off + R * R);
//   float ro = gap * 1.0;
//   // float theta1 = atan(R / off);
//   float theta1 = 0.0;

//   float r = ro * cos(n_angle - theta1) + sqrt(R * R - ro * ro * sin(n_angle - theta1) * sin(n_angle - theta1));
//   vec2 cart = vec2(off * cos(r_angle), off * sin(r_angle));
//   // return length(p - cart);
//   // return circleDist(p - cart, gap / 2.0);
//   return leng - r;
//   // float r = 0.4;
//   // float l = sqrt(r * r - ro * ro - 2.0 * ro * r * cos(n_angle - theta1));
//   // return leng - l;

//   float da = (leng * sin(n_angle) + gap / 2.0);
//   float db = (-leng * sin(n_angle) + gap / 2.0);
//   float spokes = min(da, db);
//   if (num_spokes == 1.0) {
//     p = rotate2d(r_angle) * p;
//     spokes = min(spokes, p.x);
//   }

//   return spokes;
// }

float spokeDist(vec2 p, float angle, float num_spokes, float gap) {

  float r_angle = radians(angle);
  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_spokes) * asin(sin((num_spokes / 2.0) * n_angle));

  float leng = length(p);

  float da = (leng * sin(n_angle) + gap / 2.0);
  float db = (-leng * sin(n_angle) + gap / 2.0);
  float spokes = min(da, db);
  if (num_spokes == 1.0) {
    p = rotate2d(r_angle) * p;
    spokes = min(spokes, p.x);
  }

  return spokes;
}

// This successfully works challenging to determine spoke gap width
// float sdThermal(in vec2 p) {
//   float ra = 0.9;
//   float rb = 0.05;
//   float num_spokes = 2.0;
//   float tb = 3.141519 / 2.0;
//   num_spokes *= 2.0;
//   vec2 sc = vec2(sin(tb), cos(tb));
//     //p.x = abs(p.x);
//     //return abs(length(p)-ra) - rb;

//   float ang = 0.0;// 3.141519 / num_spokes;
//   vec2 sincos = vec2(sin(ang), cos(ang));
//     //x = r cosθ and y = r sinθ
//   float r = length(p);

//   float r_angle = radians(ang);
//   float n_angle = atan(p.y, p.x) - r_angle;
//   n_angle = (2.0 / num_spokes) * asin(sin((num_spokes / 2.0) * n_angle));
//   vec2 s = vec2(r * cos(n_angle), r * sin(n_angle));

//     //return length(s - sincos * 0.9) - 0.3;

//     //return length(p-sc*ra) - rb;
//   return ((sc.y * s.x > sc.x * s.y) ? length(s - sc * ra) : abs(length(s) - ra)) - rb;
//     //return (p.x > 0.0 ? length(p-sc*ra) : abs(length(p)-ra)) - rb;
// }

// sc is the sin/cos of the aperture
float roundedRoundThermalDist(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  // radius
  float radius = (od / 2.0 + id / 2.0) / 2.0;

  // line width
  float lw = (od / 2.0 - id / 2.0) / 2.0;

  // correct rotation
  angle += (90.0) / num_of_spokes;

  float n = num_of_spokes * 2.0;
  float r_angle = radians(angle);
  float r = length(p);

  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / n) * asin(sin((n / 2.0) * n_angle));
  vec2 s = vec2(r * cos(n_angle), r * sin(n_angle));

  // find angle of offset from chord length (gap)
  gap += 2.0 * lw;
  float angle_of_gap = degrees(asin(gap / (2.0 * radius)));
  float offset = radians(angle_of_gap) - radians(180.0) / n;

  vec2 sincos2 = vec2(sin(radians(90.0) - offset), cos(radians(90.0) - offset));

  return (n_angle < offset ? length(s - sincos2 * radius) : abs(length(s) - radius)) - lw;
  // return length(s - sincos2 * radius) - lw; // round ends
  // return abs(length(s) - radius) - lw; // outer circle
}

// float thermalDist(vec2 p, float radius) {

//   float ang = 0.0;
//   vec2 sincos = vec2(sin(ang), cos(ang));
//   return length(p - sincos * 0.5 * radius) - radius / 6.0;

//   float id = radius * 0.8;
//   // float outercircle = circleDist(p, radius);
//   // float innercircle = circleDist(p, id);
//   float circle = abs(circleDist(p, (radius + id) / 2.0));
//   float spokes = spokeDist(p, 0.0, 2.0, radius / 2.0);
//   float therm = max(circle, spokes);

//   return spokes;// - ((radius - id) / 2.0);
//   // return spokeDist(p, 45.0, 3.0, radius / 4.0);
// }

float thermalDistOrig(vec2 p, float radius) {
  float id = radius * 0.8;
  float outercircle = circleDist(p, radius);
  float innercircle = circleDist(p, id);
  float d = substract(innercircle, outercircle);
  float therm = max(d, spokeDist(p, 45.0, 3.0, radius / 4.0));

  return therm;
  // return spokeDist(p, 45.0, 3.0, radius / 4.0);
}

float roundThermalDist(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float outercircle = circleDist(p, od / 2.0);
  float innercircle = circleDist(p, id / 2.0);
  float d = substract(innercircle, outercircle);
  float therm = max(d, spokeDist(p, angle, num_of_spokes, gap));
  return therm;
}

float squareThermalDist(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float outersquare = boxDist(p, vec2(od, od));
  float innersquare = boxDist(p, vec2(id, id));
  float d = substract(innersquare, outersquare);
  float therm = max(d, spokeDist(p, angle, num_of_spokes, gap));
  return therm;
}

float boxThermalDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width) {
  float outerbox = boxDist(p, vec2(width, height));
  float innerbox = boxDist(p, vec2(width - line_width * 2.0, height - line_width * 2.0));
  float d = substract(innerbox, outerbox);
  if (mod(angle, 90.0) == 0.0) {
    d = max(d, spokeDist(p, angle, num_of_spokes, gap));
    return d;
  }
  if (mod(angle, 45.0) == 0.0) {
    vec2 offset = vec2(max(0.0, width - height) / 2.0, max(0.0, height - width) / 2.0);
    offset.x = p.x > 0.0 ? offset.x : -offset.x;
    offset.y = p.y > 0.0 ? offset.y : -offset.y;
    if (width > height && abs(offset.x) < abs(p.x)) {
      d = max(d, spokeDist(translate(p, offset), angle, num_of_spokes, gap));
    }
    if (height > width && abs(offset.y) < abs(p.y)) {
      d = max(d, spokeDist(translate(p, offset), angle, num_of_spokes, gap));
    }
  }
  return d;
}

float boxThermalOpenCornersDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width) {

  // if angle is a multiple of 90 degrees,
  if (mod(angle, 90.0) == 0.0) {
    return boxThermalDist(p, width, height, angle, num_of_spokes, gap, line_width);
  }

  // if angle is a multiple of 45 degrees, draw 4 rects
  if (mod(angle, 45.0) == 0.0) {
    vec4 corners = openCorners(angle, num_of_spokes);

    float topWidth = width - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.y * (gap * sin(radians(45.0)) + line_width));
    float botWidth = width - (corners.z * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
    vec2 topLocation = vec2(corners.y * (width / 2.0 - topWidth / 2.0) - corners.x * (width / 2.0 - topWidth / 2.0), height / 2.0 - line_width / 2.0);
    vec2 botLocation = vec2(corners.z * (width / 2.0 - botWidth / 2.0) - corners.w * (width / 2.0 - botWidth / 2.0), -height / 2.0 + line_width / 2.0);

    float topBox = boxDist(translate(p, topLocation), vec2(topWidth, line_width));
    float botBox = boxDist(translate(p, botLocation), vec2(botWidth, line_width));

    float leftHeight = height - (corners.y * (gap * sin(radians(45.0)) + line_width)) - (corners.z * (gap * sin(radians(45.0)) + line_width));
    float rightHeight = height - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
    vec2 leftLocation = vec2(-width / 2.0 + line_width / 2.0, corners.z * (height / 2.0 - leftHeight / 2.0) - corners.y * (height / 2.0 - leftHeight / 2.0));
    vec2 rightLocation = vec2(width / 2.0 - line_width / 2.0, corners.w * (height / 2.0 - rightHeight / 2.0) - corners.x * (height / 2.0 - rightHeight / 2.0));

    float leftBox = boxDist(translate(p, leftLocation), vec2(line_width, leftHeight));
    float rightBox = boxDist(translate(p, rightLocation), vec2(line_width, rightHeight));

    float tb = merge(topBox, botBox);
    float lr = merge(leftBox, rightBox);
    return merge(lr, tb);
  }

  return 0.0;
}

float lineThermalDist(in vec2 p, in float outerDia, in float innerDia, in float angle, in float num_of_spokes, in float gap) {

  float width = outerDia;
  float height = outerDia;

  // https://odbplusplus.com/wp-content/uploads/sites/2/2021/02/odb_spec_user.pdf
  // angle is always 45 degrees
  // num of spokes is always 4
  float line_width = (outerDia - innerDia) / 2.0;

  // if angle is a multiple of 45 degrees, draw 4 rects
  vec4 corners = openCorners(angle, num_of_spokes);
  float topWidth = width - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.y * (gap * sin(radians(45.0)) + line_width));
  float botWidth = width - (corners.z * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
  vec2 topLocation = vec2(corners.y * (width / 2.0 - topWidth / 2.0) - corners.x * (width / 2.0 - topWidth / 2.0), height / 2.0 - line_width / 2.0);
  vec2 botLocation = vec2(corners.z * (width / 2.0 - botWidth / 2.0) - corners.w * (width / 2.0 - botWidth / 2.0), -height / 2.0 + line_width / 2.0);
  float topLine = roundBoxDist(translate(p, topLocation), vec2(topWidth, line_width), line_width / 2.0);
  float botLine = roundBoxDist(translate(p, botLocation), vec2(botWidth, line_width), line_width / 2.0);

  float leftHeight = height - (corners.y * (gap * sin(radians(45.0)) + line_width)) - (corners.z * (gap * sin(radians(45.0)) + line_width));
  float rightHeight = height - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
  vec2 leftLocation = vec2(-width / 2.0 + line_width / 2.0, corners.z * (height / 2.0 - leftHeight / 2.0) - corners.y * (width / 2.0 - leftHeight / 2.0));
  vec2 rightLocation = vec2(width / 2.0 - line_width / 2.0, corners.w * (height / 2.0 - rightHeight / 2.0) - corners.x * (width / 2.0 - rightHeight / 2.0));
  float leftLine = roundBoxDist(translate(p, leftLocation), vec2(line_width, leftHeight), line_width / 2.0);
  float rightLine = roundBoxDist(translate(p, rightLocation), vec2(line_width, rightHeight), line_width / 2.0);

  float tb = merge(topLine, botLine);
  float lr = merge(leftLine, rightLine);
  return merge(lr, tb);
}

float oblongThermalDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width, in float rounded) {
  float OuterOval = roundBoxDist(p, vec2(width, height), min(height, width) / 2.0);
  float InnerOval = roundBoxDist(p, vec2(width - line_width * 2.0, height - line_width * 2.0), min(height, width) / 2.0 - line_width);
  float d = substract(InnerOval, OuterOval);
  vec2 offset = vec2(max(0.0, width - height) / 2.0, max(0.0, height - width) / 2.0);
  offset.x = p.x > 0.0 ? offset.x : -offset.x;
  offset.y = p.y > 0.0 ? offset.y : -offset.y;

  if (width > height) {

    if (mod(angle, 180.0) == 0.0 && num_of_spokes == 2.0) {
      if (rounded == 1.0) {
        if (abs(offset.x) < abs(p.x)) {
          d = roundedRoundThermalDist(translate(p, offset), height, height - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 90.0) == 0.0 && num_of_spokes == 2.0) {
      if (rounded == 1.0) {
        if ((line_width + gap) / 2.0 > abs(p.x)) {
          d = circleDist(translate(abs(p), vec2((line_width + gap) / 2.0, (height - line_width) / 2.0)), line_width / 2.0);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 90.0) == 0.0) {
      if (rounded == 1.0) {
        if ((line_width + gap) / 2.0 > abs(p.x)) {
          d = circleDist(translate(abs(p), vec2((line_width + gap) / 2.0, (height - line_width) / 2.0)), line_width / 2.0);
        }
        if (abs(offset.x) < abs(p.x)) {
          d = roundedRoundThermalDist(translate(p, offset), height, height - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 45.0) == 0.0 && num_of_spokes == 4.0) {
      if (rounded == 1.0) {
        if (abs(offset.x) < abs(p.x)) {
          d = roundedRoundThermalDist(translate(p, offset), height, height - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        if (abs(offset.x) < abs(p.x)) {
          d = roundThermalDist(translate(p, offset), height, height - line_width * 2.0, angle, num_of_spokes, gap);
        }
      }
      return d;
    } else {
      return 0.0;
    }
  } else {
    if (mod(angle, 180.0) == 0.0 && num_of_spokes == 2.0) {
      if (rounded == 1.0) {
        if ((line_width + gap) / 2.0 > abs(p.y)) {
          d = circleDist(translate(abs(p), vec2((width - line_width) / 2.0, (line_width + gap) / 2.0)), line_width / 2.0);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 90.0) == 0.0 && num_of_spokes == 2.0) {
      if (rounded == 1.0) {
        if (abs(offset.y) < abs(p.y)) {
          d = roundedRoundThermalDist(translate(p, offset), width, width - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 90.0) == 0.0) {
      if (rounded == 1.0) {
        if ((line_width + gap) / 2.0 > abs(p.y)) {
          d = circleDist(translate(abs(p), vec2((width - line_width) / 2.0, (line_width + gap) / 2.0)), line_width / 2.0);
        }
        if (abs(offset.y) < abs(p.y)) {
          d = roundedRoundThermalDist(translate(p, offset), width, width - line_width * 2.0, angle + 90.0, num_of_spokes - 2.0, gap);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 45.0) == 0.0 && num_of_spokes == 4.0) {
      if (rounded == 1.0) {
        if (abs(offset.y) < abs(p.y)) {
          d = roundedRoundThermalDist(translate(p, offset), width, width - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        if (abs(offset.y) < abs(p.y)) {
          d = roundThermalDist(translate(p, offset), width, width - line_width * 2.0, angle, num_of_spokes, gap);
        }
      }
      return d;
    } else {
      return 0.0;
    }
  }
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

float moireDist(vec2 p, float ring_width, float ring_gap, float num_rings, float line_width, float line_length, float angle) {

  float a = ((ring_width + ring_gap) / 2.0);
  // -1.0 < m < 1.0
  // ratio of the width of the ring to the width of the gap
  // float m = 0.0;
  float m = (ring_width - ring_gap) * 2.0;

  // f = frequency of rings
  float f = 1.0;

  float period = (a / 2.0) * m;

  float rings = (a / PI) * asin(sin((PI / a) * ((length(p) / f) + period))) - period;
  float rings_edge = circleDist(p, ((ring_width + ring_gap) * num_rings));
  rings = max(rings, rings_edge);

  float lines = -spokeDist(p, angle, 4.0, line_width);
  float lines_edge = boxDist(p * rotate2d(-radians(angle)), vec2(line_length, line_length));
  lines = max(lines, lines_edge);

  return min(rings, lines);
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

float draw(float dist, bool outline) {
  if (DEBUG == 1) {
    return dist;
  }
  if (dist > 0.0) {
    discard;
  }
  float scale = u_InverseTransform[0][0];
  if (dist * float(outline) < -scale * u_PixelSize) {
    discard;
  }
  // if(outline) {
  //   if(dist < -scale * u_PixelSize) {
  //     discard;
  //   }
  // }
  return dist;
}

float pullParam(int offset) {
  vec2 texcoord = (vec2(float(offset), v_SymNum) + 0.5) / u_SymbolsTextureDimensions;
  vec4 pixelValue = texture2D(u_SymbolsTexture, texcoord);
  return pixelValue.x;
}

float pullParam(float offset) {
  vec2 texcoord = (vec2(offset, v_SymNum) + 0.5) / u_SymbolsTextureDimensions;
  vec4 pixelValue = texture2D(u_SymbolsTexture, texcoord);
  return pixelValue.x;
}

void main() {

  float t_Symbol = pullParam(u_Parameters.symbol);
  float t_Width = pullParam(u_Parameters.width);
  float t_Height = pullParam(u_Parameters.height);
  float t_Corner_Radius = pullParam(u_Parameters.corner_radius);
  float t_Corners = pullParam(u_Parameters.corners);
  float t_Outer_Dia = pullParam(u_Parameters.outer_dia);
  float t_Inner_Dia = pullParam(u_Parameters.inner_dia);
  float t_Line_Width = pullParam(u_Parameters.line_width);
  float t_Line_Length = pullParam(u_Parameters.line_length);
  float t_Angle = pullParam(u_Parameters.angle);
  float t_Gap = pullParam(u_Parameters.gap);
  float t_Num_Spokes = pullParam(u_Parameters.num_spokes);
  float t_Round = pullParam(u_Parameters.round);
  // float t_Cut_Size = pullParam(u_Parameters.cut_size);
  float t_Ring_Width = pullParam(u_Parameters.ring_width);
  float t_Ring_Gap = pullParam(u_Parameters.ring_gap);
  float t_Num_Rings = pullParam(u_Parameters.num_rings);

  // gl_FragColor = vec4(v_Color, 0.4);
  // // gl_FragColor = vec4(v_TexColor, v_TexColor, v_TexColor, 1.0);
  // return;

  float scale = u_InverseTransform[0][0];

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec3 AspectPosition = vec3(TransformedPosition.x / v_Aspect, TransformedPosition.y, 1);
  vec2 OffsetPosition = AspectPosition.xy - v_Location;
  // vec2 SizedPosition = OffsetPosition * vec2(v_Width, v_Height);
  vec2 FragCoord = OffsetPosition * rotate2d(radians(-v_Rotation));

  vec3 color = v_Color;
  // vec3 color = u_Color;
  // vec3 color = vec3(1.0);

  float Alpha = v_Polarity * ALPHA;
  if (u_OutlineMode) {
    Alpha = ALPHA;
  }

  float dist = 0.0;

  if (t_Symbol == u_Shapes.Round || t_Symbol == u_Shapes.Hole) {
    dist = circleDist(FragCoord.xy, t_Outer_Dia / 2.0);
  } else if (t_Symbol == u_Shapes.Square || t_Symbol == u_Shapes.Rectangle) {
    dist = boxDist(FragCoord.xy, vec2(t_Width, t_Height));
  } else if (t_Symbol == u_Shapes.Rounded_Rectangle) {
    dist = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
  } else if (t_Symbol == u_Shapes.Oval) {
    dist = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
  } else if (t_Symbol == u_Shapes.Chamfered_Rectangle) {
    dist = chamferedBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
  } else if (t_Symbol == u_Shapes.Diamond) {
    dist = diamonDist(FragCoord.xy, vec2(t_Width, t_Height));
  } else if (t_Symbol == u_Shapes.Octagon) {
    dist = chamferedBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, 15.0);
  } else if (t_Symbol == u_Shapes.Round_Donut) {
    float InnerCircle = circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    float OuterCircle = circleDist(FragCoord.xy, t_Outer_Dia / 2.0);
    dist = substract(InnerCircle, OuterCircle);
  } else if (t_Symbol == u_Shapes.Square_Donut) {
    float InnerSquare = boxDist(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia));
    float OuterSquare = boxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia));
    dist = substract(InnerSquare, OuterSquare);
  } else if (t_Symbol == u_Shapes.SquareRound_Donut) {
    float InnerCircle = circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    float OuterCircle = boxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia));
    dist = substract(InnerCircle, OuterCircle);
  } else if (t_Symbol == u_Shapes.Rounded_Square_Donut) {
    float InnerSquare = roundBoxDist(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia), t_Corner_Radius - (t_Outer_Dia - t_Inner_Dia) / 2.0, t_Corners);
    float OuterSquare = roundBoxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia), t_Corner_Radius, t_Corners);
    dist = substract(InnerSquare, OuterSquare);
  } else if (t_Symbol == u_Shapes.Rectange_Donut) {
    float InnerRect = boxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0));
    float OuterRect = boxDist(FragCoord.xy, vec2(t_Width, t_Height));
    dist = substract(InnerRect, OuterRect);
  } else if (t_Symbol == u_Shapes.Rounded_Rectangle_Donut) {
    float OuterRect = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    float InnerRect = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), t_Corner_Radius - t_Line_Width, t_Corners);
    dist = substract(InnerRect, OuterRect);
  } else if (t_Symbol == u_Shapes.Oval_Donut) {
    float OuterOval = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
    float InnerOval = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), min(t_Height, t_Width) / 2.0 - t_Line_Width);
    dist = substract(InnerOval, OuterOval);
  } else if (t_Symbol == u_Shapes.Horizontal_Hexagon) {
    dist = horizHexagonDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius);
  } else if (t_Symbol == u_Shapes.Vertical_Hexagon) {
    dist = verticalHexagonDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius);
  } else if (t_Symbol == u_Shapes.Butterfly) {
    dist = butterflyDist(FragCoord.xy, t_Outer_Dia / 2.0);
  } else if (t_Symbol == u_Shapes.Square_Butterfly) {
    dist = squareButterflydist(FragCoord.xy, t_Width / 2.0);
  } else if (t_Symbol == u_Shapes.Triangle) {
    dist = triangleDist(FragCoord.xy, t_Width, t_Height);
  } else if (t_Symbol == u_Shapes.Half_Oval) {
    dist = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Height / 2.0, 9.0);
  } else if (t_Symbol == u_Shapes.Rounded_Round_Thermal) {
    dist = roundedRoundThermalDist(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Shapes.Squared_Round_Thermal) {
    dist = roundThermalDist(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Shapes.Square_Thermal) {
    dist = squareThermalDist(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Shapes.Open_Corners_Square_Thermal) {
    dist = boxThermalOpenCornersDist(FragCoord.xy, t_Outer_Dia, t_Outer_Dia, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
  } else if (t_Symbol == u_Shapes.Line_Thermal) {
    dist = lineThermalDist(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Shapes.Square_Round_Thermal) {
    float outerbox = boxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia));
    float innercircle = circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    float d = substract(innercircle, outerbox);
    float therm = max(d, spokeDist(FragCoord.xy, t_Angle, t_Num_Spokes, t_Gap));
    dist = therm;
  } else if (t_Symbol == u_Shapes.Rectangular_Thermal) {
    dist = boxThermalDist(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
  } else if (t_Symbol == u_Shapes.Rectangular_Thermal_Open_Corners) {
    dist = boxThermalOpenCornersDist(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
  } else if (t_Symbol == u_Shapes.Rounded_Square_Thermal || t_Symbol == u_Shapes.Rounded_Square_Thermal_Open_Corners) {
    float OuterRect = roundBoxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia), t_Corner_Radius, t_Corners);
    float InnerRect = roundBoxDist(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia), t_Corner_Radius - (t_Outer_Dia - t_Inner_Dia) / 2.0, t_Corners);
    float d = substract(InnerRect, OuterRect);
    float therm = max(d, spokeDist(FragCoord.xy, t_Angle, t_Num_Spokes, t_Gap));
    dist = therm;
  } else if (t_Symbol == u_Shapes.Rounded_Rectangular_Thermal) {
    float OuterRect = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    float InnerRect = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), t_Corner_Radius - t_Line_Width, t_Corners);
    float d = substract(InnerRect, OuterRect);
    float therm = max(d, spokeDist(FragCoord.xy, t_Angle, t_Num_Spokes, t_Gap));
    dist = therm;
  } else if (t_Symbol == u_Shapes.Oval_Thermal) {
    float OuterOval = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
    float InnerOval = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), min(t_Height, t_Width) / 2.0 - t_Line_Width);
    float d = substract(InnerOval, OuterOval);
    float therm = max(d, spokeDist(FragCoord.xy, t_Angle, t_Num_Spokes, t_Gap));
    dist = therm;
  } else if (t_Symbol == u_Shapes.Oblong_Thermal) {
    dist = oblongThermalDist(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width, t_Round);
  } else if (t_Symbol == u_Shapes.Ellipse) {
    dist = ellipseDist(FragCoord.xy, vec2(t_Width / 2.0, t_Height / 2.0));
  } else if (t_Symbol == u_Shapes.Moire) {
    dist = moireDist(FragCoord.xy, t_Ring_Width, t_Ring_Gap, t_Num_Rings, t_Line_Width, t_Line_Length, t_Angle);
  }

  draw(dist, u_OutlineMode);

  // float Alpha = v_Polarity * ALPHA;
  // if(u_OutlineMode == 1.0) {
  //   if(d < v_Radius - u_PixelSize) {
  //     discard;
  //   }
  //   Alpha = ALPHA;
  // }

  if (DEBUG == 1) {
    // if(dist < 0.0 && dist > -u_PixelSize * scale) {
    //   dist = 1.0;
    // }
    // gl_FragColor = vec4(-dist, dist, dist, 1.0);
    vec3 col = (dist > 0.0) ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
    col *= 1.0 - exp(-6.0 * abs(dist));
    col *= 0.8 + 0.5 * cos(500.0 * dist);
    // col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, u_PixelSize * scale, abs(dist)));
    if (dist < 0.0 && dist > -u_PixelSize * scale) {
      col = vec3(1.0, 1.0, 1.0);
    }
    gl_FragColor = vec4(col, 1.0);
    return;
  }
  gl_FragColor = vec4(color, Alpha);
}
