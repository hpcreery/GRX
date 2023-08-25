precision mediump float;

#define PI 3.1415926535897932384626433832795

struct shapes {
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
  float Hole;
} Shapes;

varying float v_Symbol;
varying vec3 v_Color;
varying float v_Polarity;
varying vec2 v_Center;
varying float v_Radius;
varying vec2 v_Position;
varying float v_Aspect;
varying float v_X;
varying float v_Y;
varying float v_Width;
varying float v_Height;
varying float v_Rotation;
varying float v_Mirror;

uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform vec2 u_Screen;
uniform float u_PixelSize;
uniform float u_OutlineMode;
uniform vec3 u_Color;
uniform float u_Scale;
uniform shapes u_Shapes;

const float ALPHA = 0.8;

const float True = 1.0;
const float False = 0.0;

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
  vec2 n = normalize(vec2(height, width / 2.0));
  return max(abs(p).x * n.x + p.y * n.y - (height * n.y), -p.y);
}

float semiCircleDist(vec2 p, float radius, float angle, float width) {
  width /= 2.0;
  radius -= width;
  return substract(pie(p, angle), abs(circleDist(p, radius)) - width);
}

float boxDist(vec2 p, vec2 size, float radius) {
  size -= vec2(radius);
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;
}

float lineDist(vec2 p, vec2 start, vec2 end, float width) {
  vec2 dir = start - end;
  float lngth = length(dir);
  dir /= lngth;
  vec2 proj = max(0.0, min(lngth, dot((start - p), dir))) * dir;
  return length((start - p) - proj) - (width / 2.0);
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

void main() {
  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);

  float scale = u_InverseTransform[0][0];

  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec3 AspectPosition = vec3(TransformedPosition.x / v_Aspect, TransformedPosition.y, 1);
  vec2 OffsetPosition = AspectPosition.xy - vec2(v_X, v_Y);
  // vec2 SizedPosition = OffsetPosition * vec2(v_Width, v_Height);
  vec2 T_FragCoord = OffsetPosition * rotate2d(sin(2.0 * PI - u_Scale) * PI);

  vec2 ab = vec2(0.0);

  // vec3 color = u_Color;
  vec3 color = vec3(1.0);
  float Alpha = v_Polarity * ALPHA;
  if(u_OutlineMode == True) {
    Alpha = ALPHA;
  }

  if(v_Symbol == u_Shapes.Round) {
    float dist = circleDist(T_FragCoord.xy, v_Width);
    if(dist > 0.0) {
      discard;
    }
    if(u_OutlineMode == True) {
      if(dist < -scale * u_PixelSize) {
        discard;
      }
    }

  } else if(v_Symbol == u_Shapes.Square) {
    float dist = boxDist(T_FragCoord.xy, vec2(v_Width, v_Height), 0.0);
    if(dist > 0.0) {
      discard;
    }
    if(u_OutlineMode == True) {
      if(dist < -scale * u_PixelSize) {
        discard;
      }
    }
  }
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

  gl_FragColor = vec4(color, Alpha);
}
