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
uniform float u_Alpha;
uniform float u_Polarity;
uniform vec2 u_PointerPosition;
uniform bool u_PointerDown;
uniform bool u_QueryMode;

// COMMON VARYTINGS
varying float v_Aspect;

// PAD VARYINGS
varying float v_Index;
varying float v_SymNum;
varying vec2 v_Location;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror_X;
varying float v_Mirror_Y;

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

#pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

//////////////////////////////
//     Draw functions       //
//////////////////////////////

float draw(float dist, float pixel_size) {
  if (DEBUG == 1) {
    return dist;
  }
  if (dist > pixel_size / 2.0) {
    discard;
  }
  if (dist * float(u_OutlineMode) < -pixel_size / 2.0) {
    discard;
  }
  return dist;
}

vec2 transformLocation(vec2 pixel_coord) {
  vec2 normal_frag_coord = ((pixel_coord / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 transformed_position = u_InverseTransform * vec3(normal_frag_coord, 1.0);
  vec2 offset_position = transformed_position.xy - v_Location;
  if (v_Mirror_X == 1.0) {
    offset_position.x = -offset_position.x;
  }
  if (v_Mirror_Y == 1.0) {
    offset_position.y = -offset_position.y;
  }
  vec2 true_coord = offset_position * rotateCCW(radians(v_Rotation)) / v_ResizeFactor;
  return true_coord;
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  float pixel_size = u_PixelSize / scale;

  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  vec3 color = u_Color * max(float(u_OutlineMode), polarity);
  float alpha = u_Alpha * max(float(u_OutlineMode), polarity);

  vec2 FragCoord = transformLocation(gl_FragCoord.xy);
  float dist = drawShape(FragCoord, int(v_SymNum)) * v_ResizeFactor;

  if (u_QueryMode) {
    vec2 PointerPosition = transformLocation(u_PointerPosition);
    float PointerDist = drawShape(PointerPosition, int(v_SymNum)) * v_ResizeFactor;

    if (PointerDist < pixel_size) {
      if (gl_FragCoord.xy == vec2(mod(v_Index, u_Resolution.x) + 0.5, floor(v_Index / u_Resolution.x) + 0.5)) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
      } else {
        discard;
      }
    } else {
      discard;
    }
  }

  #pragma glslify: import('../modules/Debug.glsl')

  dist = draw(dist, pixel_size);

  gl_FragColor = vec4(color, alpha);
}
