precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Symbols.glsl')
uniform Symbols u_Symbols;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;

#pragma glslify: import('../modules/structs/SnapModes.glsl')
uniform SnapModes u_SnapModes;
uniform int u_SnapMode;

// COMMIN UNIFORMS
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

// COMMON VARYINGS
varying float v_Aspect;

// LINE VARYINGS
varying float v_Index;
varying float v_SymNum;
varying vec2 v_Start_Location;
varying vec2 v_End_Location;
varying float v_Polarity;
varying float v_ResizeFactor;

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

// float boxDist(vec2 p, vec2 size) {
//   size /= 2.0;
//   vec2 d = abs(p) - size;
//   return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
// }

// float circleDist(vec2 p, float radius) {
//   return length(p) - radius;
// }

float segmentDist( in vec2 p, in vec2 a, in vec2 b, in float thickness )
{
  vec2 pa = p-a, ba = b-a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - thickness;
}

float orientedBoxDist( in vec2 p, in vec2 a, in vec2 b, float thickness )
{
    float l = length(b-a);
    vec2  d = (b-a)/l;
    vec2  q = (p-(a+b)*0.5);
          q = mat2(d.x,-d.y,d.y,d.x)*q;
          q = abs(q)-vec2(l,thickness)*0.5;
    return length(max(q,0.0)) + min(max(q.x,q.y),0.0);
}




#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)


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

float lineDistMain(vec2 coord) {
  vec2 Center_Location = (v_Start_Location + v_End_Location) / 2.0;
  float t_Symbol = pullSymbolParameter(u_Parameters.symbol, v_SymNum);
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, v_SymNum);
  float t_Width = pullSymbolParameter(u_Parameters.width, v_SymNum);
  float t_Height = pullSymbolParameter(u_Parameters.height, v_SymNum);
  float OD = max(t_Outer_Dia, max(t_Width, t_Height));

  float dX = v_Start_Location.x - v_End_Location.x;
  float dY = v_Start_Location.y - v_End_Location.y;
  float angle = atan(dY, dX);

  float dist = SDF_FAR_AWAY;


  // Lines can only be drawn with squares and circles, and null symbols
  if (t_Symbol == u_Symbols.Round || t_Symbol == u_Symbols.Hole) {
    dist = segmentDist(coord, v_Start_Location, v_End_Location, OD/2.0);
  } else if (t_Symbol == u_Symbols.Square || t_Symbol == u_Symbols.Rectangle) {
    vec2 start_coord = translate(v_Start_Location, -t_Height * 0.5 * vec2(cos(angle), sin(angle)));
    vec2 end_coord = translate(v_End_Location, t_Height * 0.5 * vec2(cos(angle), sin(angle)));
    dist = orientedBoxDist(coord, start_coord, end_coord, t_Width);
  } else {
    dist = orientedBoxDist(coord, v_Start_Location, v_End_Location, OD);
  }
  return dist;
}

float lineDistSkeleton(vec2 coord) {
  vec2 Center_Location = (v_Start_Location + v_End_Location) / 2.0;
  float dist = segmentDist(coord, v_Start_Location, v_End_Location, 0.0);
  return dist;
}

float lineDist(vec2 coord) {
  float dist = lineDistMain(coord);
  if (u_SkeletonMode) {
    float skeleton = lineDistSkeleton(coord);
    if (u_OutlineMode) {
      dist = max(dist, -skeleton);
    } else {
      dist = skeleton;
    }
  }
  return dist;
}

#pragma glslify: transformLocation3D = require('../modules/Transform3D.frag',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)
#pragma glslify: transformLocation3DVert = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)


vec2 transformLocation(vec2 pixel_coord) {
  vec2 normal_frag_coord = ((pixel_coord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 transformed_position = transformLocation3D(normal_frag_coord).xyz;
  transformed_position = u_InverseTransform * vec3(transformed_position.xy, 1.0);
  return transformed_position.xy;
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

  float dist = lineDist(FragCoord);

  if (u_QueryMode) {
    if (gl_FragCoord.xy == vec2(mod(v_Index, u_Resolution.x) + 0.5, floor(v_Index / u_Resolution.x) + 0.5)) {
      if (dist > pixel_size * SNAP_DISTANCE_PIXELS) {
        discard;
        return;
      }
      if (u_SnapMode == u_SnapModes.EDGE) {
        // vec2 direction = normalize(vec2(
        //     (lineDist(FragCoord + vec2(1, 0) * EPSILON) - lineDist(FragCoord + vec2(-1, 0) * EPSILON)),
        //     (lineDist(FragCoord + vec2(0, 1) * EPSILON) - lineDist(FragCoord + vec2(0, -1) * EPSILON))
        // ));
        // // the first value is the distance to the border of the shape
        // // the second value is the direction of the border of the shape
        // // the third value is the indicator of a measurement
        // gl_FragColor = vec4(dist, direction, 1.0);
        gl_FragColor = vec4(dist, 0.0, 0.0, 1.0);
        return;
      }
      if (u_SnapMode == u_SnapModes.CENTER) {
        vec2 center_location = (v_Start_Location + v_End_Location) / 2.0;
        FragCoord = FragCoord - center_location;
        dist = length(FragCoord);
        // vec2 direction = normalize(vec2(
        //     (length(FragCoord + vec2(1, 0) * EPSILON) - length(FragCoord + vec2(-1, 0) * EPSILON)),
        //     (length(FragCoord + vec2(0, 1) * EPSILON) - length(FragCoord + vec2(0, -1) * EPSILON))
        // ));
        // // the first value is the distance to the border of the shape
        // // the second value is the direction of the border of the shape
        // // the third value is the indicator of a measurement
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
