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
uniform vec4 u_Color;
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


// #define FLOAT_MAX  1.70141184e38
// #define FLOAT_MIN  1.17549435e-38

// vec4 encode_float(highp float v) {
//   highp float av = abs(v);

//   //Handle special cases
//   if(av < FLOAT_MIN) {
//     return vec4(0.0, 0.0, 0.0, 0.0);
//   } else if(v > FLOAT_MAX) {
//     return vec4(127.0, 128.0, 0.0, 0.0) / 255.0;
//   } else if(v < -FLOAT_MAX) {
//     return vec4(255.0, 128.0, 0.0, 0.0) / 255.0;
//   }

//   highp vec4 c = vec4(0,0,0,0);

//   //Compute exponent and mantissa
//   highp float e = floor(log2(av));
//   highp float m = av * pow(2.0, -e) - 1.0;
  
//   //Unpack mantissa
//   c[1] = floor(128.0 * m);
//   m -= c[1] / 128.0;
//   c[2] = floor(32768.0 * m);
//   m -= c[2] / 32768.0;
//   c[3] = floor(8388608.0 * m);
  
//   //Unpack exponent
//   highp float ebias = e + 127.0;
//   c[0] = floor(ebias / 2.0);
//   ebias -= c[0] * 2.0;
//   c[1] += floor(ebias) * 128.0; 

//   //Unpack sign bit
//   c[0] += 128.0 * step(0.0, -v);

//   //Scale back to range
//   return c / 255.0;
// }

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  // float pixel_size = u_PixelSize / scale;
  vec4 v = transformLocation3DVert(((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0));
  float pixel_size = u_PixelSize * (v.z + 1.0) / (scale);

  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  vec4 color = u_Color * max(float(u_OutlineMode || u_SkeletonMode), polarity);

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
        gl_FragColor = vec4(dist, 0.0, 0.0, 1.0);
        // *** QUERYING THE DIRECTION FROM THE SHADER IS CURRENTLY DISABLED BECAUSE IT PUTS MORE LOAD ON THE GPU AND ESPECIALLY THE SHADER COMPILER DUE TO UNROLLING, BUT IT IS MORE ACCURATE THAN THE FINITE DIFFERENCE APPROXIMATION ***
        // // the direction is the negative gradient of the distance field, which can be approximated by the finite difference of the distance field in the four cardinal directions, or it can be encoded in the green and blue channels of the texture for more accuracy and performance
        // // value 1 added to position is 1 pixel
        // vec2 direction = normalize(vec2(
        //     (drawShape(transformLocation(u_PointerPosition + vec2(1, 0)), v_SymNum) * v_ResizeFactor - drawShape(transformLocation(u_PointerPosition - vec2(1, 0)), v_SymNum) * v_ResizeFactor),
        //     (drawShape(transformLocation(u_PointerPosition + vec2(0, 1)), v_SymNum) * v_ResizeFactor - drawShape(transformLocation(u_PointerPosition - vec2(0, 1)), v_SymNum) * v_ResizeFactor)
        // ));
        // // the first value is the distance to the border of the shape
        // // the second value is the direction of the border of the shape
        // // the third value is the indicator of a measurement
        // gl_FragColor = vec4(dist, direction, 1.0);
        return;
      }
      if (u_SnapMode == u_SnapModes.CENTER) {
        dist = length(FragCoord) * v_ResizeFactor;
        gl_FragColor = vec4(dist, 0.0, 0.0, 1.0);
        // *** QUERYING THE DIRECTION FROM THE SHADER IS CURRENTLY DISABLED BECAUSE IT PUTS MORE LOAD ON THE GPU AND ESPECIALLY THE SHADER COMPILER DUE TO UNROLLING, BUT IT IS MORE ACCURATE THAN THE FINITE DIFFERENCE APPROXIMATION ***
        // vec2 direction = normalize(vec2(
        //     (length(transformLocation(u_PointerPosition + vec2(1, 0))) * v_ResizeFactor - length(transformLocation(u_PointerPosition - vec2(1, 0))) * v_ResizeFactor),
        //     (length(transformLocation(u_PointerPosition + vec2(0, 1))) * v_ResizeFactor - length(transformLocation(u_PointerPosition - vec2(0, 1))) * v_ResizeFactor)
        // ));
        // gl_FragColor = vec4(dist, direction, 1.0);
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

  gl_FragColor = color;
}
