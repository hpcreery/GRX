precision mediump float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Shapes.glsl')
uniform Shapes u_Shapes;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;

// COMMON UNIFORMS
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform vec2 u_Screen;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;

// COMMON VARYTINGS
varying float v_Aspect;

// PAD VARYINGS
varying float v_Index;
varying float v_SymNum;
varying vec2 v_Location;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror;



const float ALPHA = 1.0;

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

#pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

void main() {

  float scale = u_InverseTransform[0][0];

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec2 OffsetPosition = TransformedPosition.xy - v_Location;
  vec2 FragCoord = OffsetPosition * rotateCW(radians(-v_Rotation)) / v_ResizeFactor;

  // vec3 color = vec3(1.0);
  vec3 color = u_Color * max(float(u_OutlineMode), v_Polarity);
  float Alpha = ALPHA * max(float(u_OutlineMode), v_Polarity);

  float dist = drawShape(FragCoord, int(v_SymNum));

  #pragma glslify: import('../modules/Debug.glsl')

  dist = draw(dist);


  gl_FragColor = vec4(color, Alpha);
}
