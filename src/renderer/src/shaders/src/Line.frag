precision mediump float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Shapes.glsl')
uniform Shapes u_Shapes;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;

// COMMIN UNIFORMS
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform vec2 u_Screen;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;

// COMMON VARYINGS
varying float v_Aspect;

// LINE VARYINGS
varying float v_Index;
varying float v_SymNum;
varying vec2 v_Start_Location;
varying vec2 v_End_Location;
varying float v_Polarity;

const float ALPHA = 1.0;

//////////////////////////////////////
// Combine distance field functions //
//////////////////////////////////////

float merge(float d1, float d2) {
  return min(d1, d2);
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

float boxDist(vec2 p, vec2 size) {
  size /= 2.0;
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}



#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)
#pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)


//////////////////////////////
//     Draw functions       //
//////////////////////////////


float draw(float dist) {
  if (DEBUG == 1) {
    return dist;
  }
  if (dist > 0.0) {
    discard;
  }
  float scale = u_InverseTransform[0][0];
  if (dist * float(u_OutlineMode) < -scale * u_PixelSize) {
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

  // gl_FragColor = vec4(1.0,1.0,1.0, 1.0);
  // return;

  float scale = u_InverseTransform[0][0];

  vec2 Center_Location = (v_Start_Location + v_End_Location) / 2.0;

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec2 OffsetPosition = TransformedPosition.xy - Center_Location;
  vec2 FragCoord = OffsetPosition;

  // vec3 color = vec3(1.0);
  vec3 color = u_Color * max(float(u_OutlineMode), v_Polarity);
  float Alpha = ALPHA * max(float(u_OutlineMode), v_Polarity);

  // ? which one to go by for line width...
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, int(v_SymNum));
  float t_Width = pullSymbolParameter(u_Parameters.width, int(v_SymNum));

  float dX = v_Start_Location.x - v_End_Location.x;
  float dY = v_Start_Location.y - v_End_Location.y;
  float len = distance(v_Start_Location, v_End_Location);
  float angle = atan(dY/dX);
  float start = drawShape(translate(FragCoord, (v_Start_Location - Center_Location)) * rotateCW(-angle), int(v_SymNum));
  float end = drawShape(translate(FragCoord, (v_End_Location - Center_Location)) * rotateCW(-angle), int(v_SymNum));
  float con = boxDist(FragCoord * rotateCW(-angle), vec2(len, t_Width));
  float dist = merge(start,end);
  dist = merge(dist, con);


  #pragma glslify: import('../modules/Debug.glsl')
  dist = draw(dist);

  gl_FragColor = vec4(color, Alpha);
}
