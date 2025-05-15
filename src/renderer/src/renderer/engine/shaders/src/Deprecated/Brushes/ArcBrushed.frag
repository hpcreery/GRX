precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Shapes.glsl')
uniform Shapes u_Shapes;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;


// COMMON UNIFORMS
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform float u_QtyFeatures;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;
uniform float u_Polarity;

// COMMON VARYINGS
varying float v_Aspect;

// ARC VARYINGS
varying float v_Index;
varying float v_SymNum;
varying vec2 v_Start_Location;
varying vec2 v_End_Location;
varying vec2 v_Center_Location;
varying float v_Clockwise;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror_X;
varying float v_Mirror_Y;

//////////////////////////////////////
// Combine distance field functions //
//////////////////////////////////////


float merge(float d1, float d2) {
  return min(d1, d2);
}

float substract(float d1, float d2) {
  return max(-d1, d2);
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

vec2 resize(vec2 p, float r) {
  return p * r;
}


vec2 mirror_x(float m) {
  return vec2(m == 1.0 ? -1.0 : 1.0, 1.0);
}

vec2 mirror_y(float m) {
  return vec2(1.0, m == 1.0 ? -1.0 : 1.0);
}

//////////////////////////////
// Distance field functions //
//////////////////////////////

float pie(vec2 p, float angle) {
  angle = radians(angle) / 2.0;
  vec2 n = vec2(cos(angle), sin(angle));
  return abs(p).x * n.x + p.y * n.y;
}

float sdPie(in vec2 p, in float angle, in float radius) {
  vec2 c = vec2(sin(angle), cos(angle));
  p.x = abs(p.x);
  float l = length(p) - radius;
  float m = length(p - c * clamp(dot(p, c), 0.0, radius));
  return max(l, m * sign(c.y * p.x - c.x * p.y));
}

float slice(in vec2 p, in float angle) {
  vec2 c = vec2(cos(angle), sin(angle));
  //p.x = abs(p.x);
  p.y = abs(p.y);
  float n = length(p - c * dot(p, c));
  return n * sign(c.y * p.x - c.x * p.y);
}

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
}

#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)
#pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)


float brushStartDist(vec2 p) {
  float start = drawShape(translate(p, (v_Start_Location - v_Center_Location)) * (1.0/v_ResizeFactor) * rotateCW(radians(v_Rotation)) * mirror_x(v_Mirror_X) * mirror_y(v_Mirror_Y), int(v_SymNum));
  return start * v_ResizeFactor;
}

float brushEndDist(vec2 p) {
  float end = drawShape(translate(p, (v_End_Location - v_Center_Location)) * (1.0/v_ResizeFactor) * rotateCW(radians(v_Rotation)) * mirror_x(v_Mirror_X) * mirror_y(v_Mirror_Y), int(v_SymNum));
  return end * v_ResizeFactor;
}


//////////////////////////////
//     Draw functions       //
//////////////////////////////

const int BRUSH_ITERATIONS = 64;
float brush(vec2 FragCoord)
{
  float r = distance(v_Start_Location, v_Center_Location);
  float start_angle = atan(v_Start_Location.y - v_Center_Location.y, v_Start_Location.x - v_Center_Location.x);
  float end_angle = atan(v_End_Location.y - v_Center_Location.y, v_End_Location.x - v_Center_Location.x);

	// distance traveled
	float distance_traveled = 0.0;
  float return_value = 0.0;
  float signed_distance = 0.0;
  vec2 prev_p = vec2(0,0);
  float start_v = distance(FragCoord, v_Start_Location) < distance(FragCoord, v_End_Location) ? -1.0 : 1.0;
  // int end = distance(FragCoord, v_End_Location) < distance(FragCoord, v_Start_Location) ? 1 : 0;
  bool start = distance(FragCoord, v_Start_Location) < distance(FragCoord, v_End_Location);
  // bool end = distance(FragCoord, v_End_Location) < distance(FragCoord, v_Start_Location);
	float prev_signed_distance = signed_distance;
  for (int i = 0; i < BRUSH_ITERATIONS; ++i)
	{
    float angle = (distance_traveled / r);
    if (angle > radians(190.0)) {
      break;
    }
    prev_signed_distance = signed_distance;
    if (start) {
      float angle = ((distance_traveled / r) + (radians(90.0) * start_v) - start_angle);
      prev_p = vec2(r * sin(angle), r * cos(angle)) + (FragCoord + (v_Start_Location - v_Center_Location));
      signed_distance = brushStartDist(prev_p);
    } else {
      float angle = ((distance_traveled / r) + (radians(90.0) * start_v) + end_angle);
      prev_p = vec2(r * sin(-angle), r * cos(-angle)) + (FragCoord + (v_End_Location - v_Center_Location));
      signed_distance = brushEndDist(prev_p);
    }

    if (signed_distance <= 0.0) {
      return_value = 1.0;
      break;
    }

    // distance_traveled += max(u_PixelSize, abs(signed_distance)) * (v_Clockwise == 0.0 ? -1.0 : 1.0);
    distance_traveled += min(max(u_PixelSize, abs(signed_distance)), r / 20.0) * (v_Clockwise == 0.0 ? -1.0 : 1.0);
	}
	return return_value;
}

float draw(float dist) {
  if (dist > 0.0) {
    discard;
  }
  if (dist * float(u_OutlineMode) < -u_PixelSize) {
    discard;
  }
  return dist;
}

void main() {

  vec2 Center_Location = (v_Start_Location + v_End_Location) / 2.0;

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec2 OffsetPosition = TransformedPosition.xy - v_Center_Location;
  // vec2 SizedPosition = OffsetPosition * vec2(v_Width, v_Height);
  vec2 FragCoord = OffsetPosition;

  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  vec3 color = u_Color * max(float(u_OutlineMode), polarity);
  float alpha = ALPHA * max(float(u_OutlineMode), polarity);


  float dist = merge(brushStartDist(FragCoord), brushEndDist(FragCoord));


  float br = brush(FragCoord);
  if (br == 1.0) {
    dist = min(dist, -u_PixelSize / 2.0);
    // dist = -u_PixelSize / 2.0;
  }

  #pragma glslify: import('../modules/Debug.glsl')
  dist = draw(dist);

  gl_FragColor = vec4(color, alpha);
}
