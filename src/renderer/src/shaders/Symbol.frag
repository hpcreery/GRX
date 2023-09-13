precision mediump float;

#define PI 3.1415926535897932384626433832795
#define DEBUG 1

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
  float Open_Cornders_Square_Thermal;
  float Line_Thermal;
  float Square_Round_Thermal;
  float Rectangular_Thermal;
  float Rectangular_thermal_Open_Corners;
  float Rounded_Square_Thermal;
  float Rounded_Square_Thermal_Open_Corners;
  float Rounded_Rectangular_Thermal;
  float Oval_Thermal;
  float Oblong_Thermal;
  float Home_Plate;
  float Inverted_Home_Plate;
  float Flat_Home_Plate;
  float Radiused_Inverted_Home_Plate;
  float Radiused_Home_Plate;
  float Cross;
  float Dogbone;
  float DPack;
  float Ellipse;
  float Moire;
} u_Shapes;

uniform struct parameters {
  int symbol;
  int index;
  int polarity;
  int x;
  int y;
  int width;
  int height;
  int rotation;
  int mirror;
  int corner_radius;
  int corners;
  int outer_dia;
  int inner_dia;
  int line_width;
  int angle;
  int gap;
  int num_spokes;
  int round;
  int cut_size;
} u_Parameters;

// #pragma glslify: parameters = require('./modules/test.frag')
// uniform parameters u_Parameters;
//  = parameters(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18);

uniform sampler2D u_Features;
uniform vec2 u_FeaturesDimensions;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform vec2 u_Screen;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;
uniform float u_Scale;

varying float v_Symbol;
varying vec3 v_Color;
varying float v_Polarity;
// varying float v_Radius;
varying vec2 v_Position;
varying float v_Aspect;
varying vec2 v_Location;
varying float v_Width;
varying float v_Height;
varying float v_Rotation;
varying float v_Mirror;
varying float v_Corner_Radius;
varying float v_Corners;
varying float v_Outer_Dia;
varying float v_Inner_Dia;
varying float v_Line_Width;
varying float v_Angle;
varying float v_Gap;
varying float v_Num_Spokes;

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

vec4 roundedCornersVector(float corners) {
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
  corners.xy = (p.x > 0.0) ? corners.xy : corners.zw;
  corners.x = (p.y > 0.0) ? corners.x : corners.y;
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
  corners.xy = (p.x > 0.0) ? corners.xy : corners.zw;
  corners.x = (p.y > 0.0) ? corners.x : corners.y;
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
float hexagonDist(vec2 p, vec2 size, float radius) {
  float dist = abs(p.x) * (size.y - (size.y - radius * 2.0)) + abs(p.y) * size.x - size.x * size.y * 0.5;
  dist = dist / (size.x + size.y) * 2.0;
  return max(dist, boxDist(p, size));
}

// Vertical Hexagon
float hexagonVDist(vec2 p, vec2 size, float radius) {
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

float spokeDist(vec2 p, float angle, float num_spokes, float gap) {

  float r_angle = radians(angle);
  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_spokes) * asin(sin((num_spokes / 2.0) * n_angle));

  float leng = length(p);

  // r = ro * cos(n_angle − theta1) + √( 𝑅^2 − (ro^2) * sin^2(n_angle − theta1))
  float off = gap * 3.0;
  float R = gap / 3.0;
  // float ro = sqrt(off * off + R * R);
  float ro = gap * 1.0;
  // float theta1 = atan(R / off);
  float theta1 = 0.0;

  float r = ro * cos(n_angle - theta1) + sqrt(R * R - ro * ro * sin(n_angle - theta1) * sin(n_angle - theta1));
  vec2 cart = vec2(off * cos(r_angle), off * sin(r_angle));
  // return length(p - cart);
  // return circleDist(p - cart, gap / 2.0);
  return leng - r;
  // float r = 0.4;
  // float l = sqrt(r * r - ro * ro - 2.0 * ro * r * cos(n_angle - theta1));
  // return leng - l;

  float da = (leng * sin(n_angle) + gap / 2.0);
  float db = (-leng * sin(n_angle) + gap / 2.0);
  float spokes = min(da, db);
  if (num_spokes == 1.0) {
    p = rotate2d(r_angle) * p;
    spokes = min(spokes, p.x);
  }

  return spokes;
}

float spokeDistSimple(vec2 p, float angle, float num_spokes, float gap) {

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
float roundedRoundThermalDist(in vec2 p, in float od, in float id, in float ang, in float num_of_spokes, in float gap) {
  // radius
  float dia = (od + id) / 2.0;

  // line width
  float lw = (od - id) / 2.0;

  // number of spokes
  // float num_of_spokes = 1.0;

  // inital angle
  // float ang = 0.0;

  // spoke gap width
  // float gap = 0.0;

  // correct rotation
  ang += (90.0) / num_of_spokes;

  float n = num_of_spokes * 2.0;
  float r_angle = radians(ang);
  float r = length(p);

  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / n) * asin(sin((n / 2.0) * n_angle));
  vec2 s = vec2(r * cos(n_angle), r * sin(n_angle));

  // find angle of offset from chord length (gap)
  gap += 2.0 * lw;
  float angle_of_gap = degrees(asin(gap / (2.0 * dia)));
  float offset = radians(angle_of_gap) - radians(180.0) / n;

  vec2 sincos2 = vec2(sin(radians(90.0) - offset), cos(radians(90.0) - offset));

  return (n_angle < offset ? length(s - sincos2 * dia) : abs(length(s) - dia)) - lw;
}

float thermalDist(vec2 p, float radius) {

  float ang = 0.0;
  vec2 sincos = vec2(sin(ang), cos(ang));
  return length(p - sincos * 0.5 * radius) - radius / 6.0;

  float id = radius * 0.8;
  // float outercircle = circleDist(p, radius);
  // float innercircle = circleDist(p, id);
  float circle = abs(circleDist(p, (radius + id) / 2.0));
  float spokes = spokeDist(p, 0.0, 2.0, radius / 2.0);
  float therm = max(circle, spokes);

  return spokes;// - ((radius - id) / 2.0);
  // return spokeDist(p, 45.0, 3.0, radius / 4.0);
}

float thermalDistOrig(vec2 p, float radius) {
  float id = radius * 0.8;
  float outercircle = circleDist(p, radius);
  float innercircle = circleDist(p, id);
  float d = substract(innercircle, outercircle);
  float therm = max(d, spokeDist(p, 45.0, 3.0, radius / 4.0));

  return therm;
  // return spokeDist(p, 45.0, 3.0, radius / 4.0);
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

void main() {

  // gl_FragColor = vec4(v_Color, 0.4);
  // // gl_FragColor = vec4(v_TexColor, v_TexColor, v_TexColor, 1.0);
  // return;

  float scale = u_InverseTransform[0][0];

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec3 AspectPosition = vec3(TransformedPosition.x / v_Aspect, TransformedPosition.y, 1);
  vec2 OffsetPosition = AspectPosition.xy - v_Location;
  // vec2 SizedPosition = OffsetPosition * vec2(v_Width, v_Height);
  // vec2 T_FragCoord = OffsetPosition * rotate2d(radians(-u_Scale * 30.0));
  vec2 T_FragCoord = OffsetPosition * rotate2d(radians(-v_Rotation));

  vec3 color = v_Color;
  // vec3 color = u_Color;
  // vec3 color = vec3(1.0);

  float Alpha = v_Polarity * ALPHA;
  if (u_OutlineMode) {
    Alpha = ALPHA;
  }

  float dist = 0.0;

  if (v_Symbol == u_Shapes.Round) {
    dist = circleDist(T_FragCoord.xy, v_Outer_Dia / 2.0);
  } else if (v_Symbol == u_Shapes.Square || v_Symbol == u_Shapes.Rectangle) {
    dist = boxDist(T_FragCoord.xy, vec2(v_Width, v_Height));
  } else if (v_Symbol == u_Shapes.Rounded_Rectangle) {
    dist = roundBoxDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Corner_Radius, v_Corners);
  } else if (v_Symbol == u_Shapes.Oval) {
    dist = roundBoxDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Height / 2.0);
  } else if (v_Symbol == u_Shapes.Chamfered_Rectangle) {
    dist = chamferedBoxDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Corner_Radius, v_Corners);
  } else if (v_Symbol == u_Shapes.Diamond) {
    dist = diamonDist(T_FragCoord.xy, vec2(v_Width, v_Height));
  } else if (v_Symbol == u_Shapes.Octagon) {
    dist = chamferedBoxDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Corner_Radius, 15.0);
  } else if (v_Symbol == u_Shapes.Round_Donut) {
    float InnerCircle = circleDist(T_FragCoord.xy, v_Inner_Dia / 2.0);
    float OuterCircle = circleDist(T_FragCoord.xy, v_Outer_Dia / 2.0);
    dist = substract(InnerCircle, OuterCircle);
  } else if (v_Symbol == u_Shapes.Square_Donut) {
    float InnerSquare = boxDist(T_FragCoord.xy, vec2(v_Inner_Dia, v_Inner_Dia));
    float OuterSquare = boxDist(T_FragCoord.xy, vec2(v_Width, v_Height));
    dist = substract(InnerSquare, OuterSquare);
  } else if (v_Symbol == u_Shapes.SquareRound_Donut) {
    float InnerCircle = circleDist(T_FragCoord.xy, v_Inner_Dia / 2.0);
    float OuterCircle = boxDist(T_FragCoord.xy, vec2(v_Width, v_Height));
    dist = substract(InnerCircle, OuterCircle);
  } else if (v_Symbol == u_Shapes.Rounded_Square_Donut) {
    float InnerSquare = roundBoxDist(T_FragCoord.xy, vec2(v_Inner_Dia, v_Inner_Dia), v_Corner_Radius - (v_Width - v_Inner_Dia) / 2.0, v_Corners);
    float OuterSquare = roundBoxDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Corner_Radius, v_Corners);
    dist = substract(InnerSquare, OuterSquare);
  } else if (v_Symbol == u_Shapes.Rectange_Donut) {
    float InnerRect = boxDist(T_FragCoord.xy, vec2(v_Width - v_Line_Width * 2.0, v_Height - v_Line_Width * 2.0));
    float OuterRect = boxDist(T_FragCoord.xy, vec2(v_Width, v_Height));
    dist = substract(InnerRect, OuterRect);
  } else if (v_Symbol == u_Shapes.Rounded_Rectangle_Donut) {
    float InnerRect = roundBoxDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Corner_Radius, v_Corners);
    float OuterRect = roundBoxDist(T_FragCoord.xy, vec2(v_Width - v_Inner_Dia, v_Height - v_Inner_Dia), v_Corner_Radius, v_Corners);
    dist = substract(InnerRect, OuterRect);
  } else if (v_Symbol == u_Shapes.Oval_Donut) {
    float InnerOval = roundBoxDist(T_FragCoord.xy, vec2(v_Width - v_Line_Width * 2.0, v_Height - v_Line_Width * 2.0), v_Height / 2.0 - v_Line_Width);
    float OuterOval = roundBoxDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Height / 2.0);
    dist = substract(InnerOval, OuterOval);
  } else if (v_Symbol == u_Shapes.Horizontal_Hexagon) {
    dist = hexagonDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Corner_Radius);
  } else if (v_Symbol == u_Shapes.Vertical_Hexagon) {
    dist = hexagonVDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Corner_Radius);
  } else if (v_Symbol == u_Shapes.Butterfly) {
    dist = butterflyDist(T_FragCoord.xy, v_Outer_Dia / 2.0);
  } else if (v_Symbol == u_Shapes.Square_Butterfly) {
    dist = squareButterflydist(T_FragCoord.xy, v_Width / 2.0);
  } else if (v_Symbol == u_Shapes.Triangle) {
    dist = triangleDist(T_FragCoord.xy, v_Width, v_Height);
  } else if (v_Symbol == u_Shapes.Half_Oval) {
    dist = roundBoxDist(T_FragCoord.xy, vec2(v_Width, v_Height), v_Height / 2.0, 9.0);
  } else if (v_Symbol == u_Shapes.Rounded_Round_Thermal) {
    dist = roundedRoundThermalDist(T_FragCoord.xy, v_Outer_Dia, v_Inner_Dia, v_Angle, v_Num_Spokes, v_Gap);
  }

  // dist = clamp(u_Shapes.Round / v_Symbol, 0.0, 1.0) * circleDist(T_FragCoord.xy, v_Width);
  // dist = clamp(u_Shapes.Square / v_Symbol, 0.0, 1.0) * boxDist(T_FragCoord.xy, vec2(v_Width, v_Height), 0.0);

  draw(dist, u_OutlineMode);
  // float d = distance(v_Position, v_Center);

  // if(d > v_Radius) {
  //   discard;
  // }

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
