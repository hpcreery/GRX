precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Symbols.glsl')
uniform Symbols u_Symbols;

#pragma glslify: import('../modules/structs/SnapModes.glsl')
uniform SnapModes u_SnapModes;
uniform int u_SnapMode;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;

// COMMON UNIFORMS
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform float u_QtyFeatures;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform mat4 u_Transform3D;
uniform float u_ZOffset;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform bool u_SkeletonMode;
uniform vec3 u_Color;
uniform float u_Alpha;
uniform float u_Polarity;
uniform vec2 u_PointerPosition;
uniform bool u_PointerDown;
uniform bool u_QueryMode;
uniform bool u_Perspective3D;

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

#pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Symbols=u_Symbols,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

//////////////////////////////
//     Draw functions       //
//////////////////////////////

float draw(float dist, float pixel_size) {
  // if (DEBUG == 1) {
  //   return dist;
  // }
  if (dist > pixel_size / 2.0) {
    discard;
  }
  if (dist * float(u_OutlineMode || u_SkeletonMode) < -pixel_size / 2.0) {
    discard;
  }
  return dist;
}

#pragma glslify: transformLocation3D = require('../modules/Transform3D.frag',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)
#pragma glslify: transformLocation3DVert = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)

vec2 transformLocation(vec2 pixel_coord) {
  vec2 normal_frag_coord = ((pixel_coord / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);

  vec3 transformed_position = transformLocation3D(normal_frag_coord).xyz;
  transformed_position = u_InverseTransform * vec3(transformed_position.xy, 1.0);

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
  // float pixel_size = u_PixelSize / scale;
  vec4 v = transformLocation3DVert(((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0));
  float pixel_size = u_PixelSize * (v.z + 1.0) / (scale);

  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  vec3 color = u_Color * max(float(u_OutlineMode || u_SkeletonMode), polarity);
  float alpha = u_Alpha * max(float(u_OutlineMode || u_SkeletonMode), polarity);

  vec2 FragCoord = transformLocation(gl_FragCoord.xy);
  if (u_QueryMode) {
    FragCoord = transformLocation(u_PointerPosition);
  }

  float dist = drawShape(FragCoord, v_SymNum) * v_ResizeFactor;


  // intuitive way to calculate the distance to the border of the shape at an angle/axis
  // float x = 0.0;
  // float y = 0.0;
  // float angle = 0.0;
  // float offset = dist;
  // float offsetRight = drawShape(FragCoord + vec2(cos(angle), sin(angle)) * 0.01, v_SymNum) * v_ResizeFactor;
  // float offsetLeft = drawShape(FragCoord - vec2(cos(angle), sin(angle)) * 0.01, v_SymNum) * v_ResizeFactor;
  // float direction = sign(offsetLeft - offsetRight);
  // if (direction == 0.0) {
  //   direction = 1.0;
  // }
  // #pragma unroll 1
  // for (int i = 0; i < 4; i += 1) {
  //   x = FragCoord.x + cos(angle) * offset * direction;
  //   y = FragCoord.y + sin(angle) * offset * direction;
  //   offset += abs(drawShape(vec2(x, y), v_SymNum)) * v_ResizeFactor;
  //   if (offset < 0.0) {
  //     break;
  //   }
  // }
  // dist = offset * direction;

  if (u_QueryMode) {
    if (gl_FragCoord.xy == vec2(mod(v_Index, u_Resolution.x) + 0.5, floor(v_Index / u_Resolution.x) + 0.5)) {
      if (dist > pixel_size * SNAP_DISTANCE_PIXELS) {
        discard;
        return;
      }
      if (u_SnapMode == u_SnapModes.EDGE) {
        // vec2 direction = normalize(vec2(
        //     (drawShape(FragCoord + vec2(1, 0) * EPSILON, v_SymNum) * v_ResizeFactor - drawShape(FragCoord + vec2(-1, 0) * EPSILON, v_SymNum) * v_ResizeFactor),
        //     (drawShape(FragCoord + vec2(0, 1) * EPSILON, v_SymNum) * v_ResizeFactor - drawShape(FragCoord + vec2(0, -1) * EPSILON, v_SymNum) * v_ResizeFactor)
        // ));
        // direction = rotateCW(direction, radians(v_Rotation));
        // if (v_Mirror_X == 1.0) {
        //   direction.x = -direction.x;
        // }
        // if (v_Mirror_Y == 1.0) {
        //   direction.y = -direction.y;
        // }
        // the first value is the distance to the border of the shape
        // the second value is the direction of the border of the shape
        // the third value is the indicator of a measurement
        // gl_FragColor = vec4(dist, direction, 1.0);
        gl_FragColor = vec4(dist, 0.0, 0.0, 1.0);
        return;
      }
      if (u_SnapMode == u_SnapModes.CENTER) {
        dist = length(FragCoord) * v_ResizeFactor;
        // vec2 direction = normalize(vec2(
        //     (length(FragCoord + vec2(1, 0) * EPSILON) * v_ResizeFactor - length(FragCoord + vec2(-1, 0) * EPSILON) * v_ResizeFactor),
        //     (length(FragCoord + vec2(0, 1) * EPSILON) * v_ResizeFactor - length(FragCoord + vec2(0, -1) * EPSILON) * v_ResizeFactor)
        // ));
        // direction = rotateCW(direction, radians(v_Rotation));
        // if (v_Mirror_X == 1.0) {
        //   direction.x = -direction.x;
        // }
        // if (v_Mirror_Y == 1.0) {
        //   direction.y = -direction.y;
        // }
        // the first value is the distance to the border of the shape
        // the second value is the direction of the border of the shape
        // the third value is the indicator of a measurement
        // gl_FragColor = vec4(dist, direction, 1.0);
        gl_FragColor = vec4(dist, 0.0, 0.0, 1.0);
        return;
      }
      if (u_SnapMode == u_SnapModes.OFF) {
        // If snap mode is off, just return 0 distance
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
      discard;
    } else {
      discard;
    }
  }

  #pragma glslify: import('../modules/Debug.glsl')

  dist = draw(dist, pixel_size);

  gl_FragColor = vec4(color, alpha);
}
