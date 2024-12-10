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

vec3 draw(vec3 dist, float pixel_size) {
  if (DEBUG == 1) {
    return dist;
  }
  if (dist.x > pixel_size / 2.0) {
    discard;
  }
  if (dist.x * float(u_OutlineMode) < -pixel_size / 2.0) {
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
  vec3 sdg = drawShape(FragCoord, int(v_SymNum)) * v_ResizeFactor;
  float dist = sdg.x;

  if (u_QueryMode) {

    // if (PointerDist.x < pixel_size) {
    if (gl_FragCoord.xy == vec2(mod(v_Index, u_Resolution.x) + 0.5, floor(v_Index / u_Resolution.x) + 0.5)) {
      vec2 PointerPosition = transformLocation(u_PointerPosition);
      vec3 PointerSDG = drawShape(PointerPosition, int(v_SymNum)) * v_ResizeFactor;
      // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      float direction = 0.0;
      if (PointerSDG.x < pixel_size) {
        direction = 1.0;
      }
      gl_FragColor = vec4(abs(PointerSDG.x), PointerSDG.yz * 0.5 + 0.5, direction);
      return;
    } else {
      discard;
    }
    // } else {
    //   discard;
    // }
  }

  if (DEBUG == 1) {
    // float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
    // float pixel_size = u_PixelSize / scale;
    // vec3 col = (dist > 0.0) ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
    // col *= 1.0 - exp(-3.0*abs(dist * 0.01 / pixel_size));
    // col *= 0.8 + 0.25*cos(dist / pixel_size);
    // // col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,u_PixelSize,abs(dist)) );
    // if (dist < 0.0 && dist > -pixel_size) {
    //   col = vec3(1.0, 1.0, 1.0);
    // }
    // gl_FragColor = vec4(col, 1.0);
    float d = sdg.x;
    vec2 g = sdg.yz;
    vec3 col = (d>0.0) ? vec3(0.9,0.6,0.3) : vec3(0.4,0.7,0.85);
    col *= 1.0 + vec3(0.5*g,0.0);
  //col = vec3(0.5+0.5*g,1.0);
    col *= 1.0 - 0.5*exp(-16.0*abs(d));
    col *= 0.9 + 0.1*cos(150.0*d);
    // col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(d)) );
    if (d < 0.0 && d > -pixel_size) {
      col = vec3(1.0, 1.0, 1.0);
    }
    gl_FragColor = vec4(col,1.0);
    return;
  }

  #pragma glslify: import('../modules/Debug.glsl')

  sdg = draw(sdg, pixel_size);

  gl_FragColor = vec4(color, alpha);
}
