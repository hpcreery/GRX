precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/SnapModes.glsl')
uniform SnapModes u_SnapModes;
uniform int u_SnapMode;

// COMMON UNIFORMS
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
uniform vec2 u_PointerPosition;
uniform bool u_PointerDown;
uniform bool u_QueryMode;
uniform float u_Polarity;
uniform bool u_Perspective3D;

// SURFACE UNIFORMS
uniform sampler2D u_Vertices;
uniform vec2 u_VerticesDimensions;

// SURFACE VARYINGS
varying vec3 v_Indicies;
varying float v_QtyVerts;
varying float v_ContourIndex;
varying float v_ContourPolarity;
varying float v_ContourOffset;
varying float v_SurfaceIndex;
varying float v_SurfacePolarity;
varying float v_SurfaceOffset;




vec4 texelFetch(sampler2D tex, vec2 texSize, vec2 pixelCoord) {
  vec2 uv = (pixelCoord + 0.5) / texSize;
  return texture2D(tex, uv);
}

vec2 getVertexPosition(float index) {
  float xcol = mod(index, u_VerticesDimensions.x);
  float xrow = floor(index / u_VerticesDimensions.x);
  float x = float(texelFetch(u_Vertices, u_VerticesDimensions, vec2(xcol, xrow)));
  float ycol = mod(index + 1.0, u_VerticesDimensions.x);
  float yrow = floor((index + 1.0) / u_VerticesDimensions.x);
  float y = float(texelFetch(u_Vertices, u_VerticesDimensions, vec2(ycol, yrow)));
  return vec2(x, y);
}

vec2 getVertexPosition(int index) {
  return getVertexPosition(float(index));
}



float sdfSegment(vec2 p, vec2 a, vec2 b) {
  float h = min(1.0, max(0.0, dot(p - a, b - a) / dot(b - a, b - a))); //dot(b - a, b - a) == b-a * b-a
  return length(p - (a + h * (b - a))); // return distance from point to line

  // alternate method ( line extends beyond the segment )
  // float angle = atan(b.y - a.y, b.x - a.x);
  // float dist = cos(angle) * (p.y - a.y) - sin(angle) * (p.x - a.x);
  // return abs(dist);
}

//////////////////////////////
//     Draw functions       //
//////////////////////////////

float draw(float dist, float pixel_size) {
  if (dist * float(u_OutlineMode || u_SkeletonMode) > pixel_size) {
    discard;
  }
  return dist;
}

// vec2 transformLocation(vec2 pixel_coord) {
//   vec2 normal_frag_coord = ((pixel_coord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
//   vec3 transformed_position = u_InverseTransform * vec3(normal_frag_coord, 1.0);
//   return transformed_position.xy;
// }

#pragma glslify: transformLocation3D = require('../modules/Transform3D.frag',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)
#pragma glslify: transformLocation3DVert = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)


vec2 transformLocation(vec2 pixel_coord) {
  vec2 normal_frag_coord = ((pixel_coord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 transformed_position = transformLocation3D(normal_frag_coord).xyz;
  transformed_position = u_InverseTransform * vec3(transformed_position.xy, 1.0);
  return transformed_position.xy;
}

float surfaceDistMain(vec2 FragCoord) {
  float dist = SDF_FAR_AWAY;
  for (float i = -6.0; i <= 5.0; i += 1.0) {
    float indx = mod(v_Indicies.x + i, v_QtyVerts);
    float indx1 = mod(v_Indicies.x + i + 1.0, v_QtyVerts);
    vec2 point1_p = getVertexPosition(indx * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 point1_n = getVertexPosition(indx1 * 2.0 + v_ContourOffset + v_SurfaceOffset);
    dist = min(dist, sdfSegment(FragCoord, point1_n, point1_p));
    float indy = mod(v_Indicies.y + i, v_QtyVerts);
    float indy1 = mod(v_Indicies.y + i + 1.0, v_QtyVerts);
    vec2 point2_p = getVertexPosition(indy * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 point2_n = getVertexPosition(indy1 * 2.0 + v_ContourOffset + v_SurfaceOffset);
    dist = min(dist, sdfSegment(FragCoord, point2_n, point2_p));
    float indz = mod(v_Indicies.z + i, v_QtyVerts);
    float indz1 = mod(v_Indicies.z + i + 1.0, v_QtyVerts);
    vec2 point3_p = getVertexPosition(indz * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 point3_n = getVertexPosition(indz1 * 2.0 + v_ContourOffset + v_SurfaceOffset);
    dist = min(dist, sdfSegment(FragCoord, point3_n, point3_p));
  }
  return dist;
}

float sign(vec2 p1, vec2 p2, vec2 p3)
{
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

bool pointInTriangle(vec2 pt, vec2 v1, vec2 v2, vec2 v3)
{
    float d1, d2, d3;
    bool has_neg, has_pos;

    d1 = sign(pt, v1, v2);
    d2 = sign(pt, v2, v3);
    d3 = sign(pt, v3, v1);

    has_neg = (d1 < 0.0) || (d2 < 0.0) || (d3 < 0.0);
    has_pos = (d1 > 0.0) || (d2 > 0.0) || (d3 > 0.0);

    return !(has_neg && has_pos);
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  // float pixel_size = u_PixelSize / scale;
  vec4 v = transformLocation3DVert(((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0));
  float pixel_size = u_PixelSize * (v.z + 1.0) / (scale);


  // v_ContourPolarity = Island (1) or Hole (0)
  // v_SurfacePolarity = Positive (1) or Negative (0)
  float polarity = 1.0 - abs(v_ContourPolarity - v_SurfacePolarity);
  polarity = 1.0 - abs(polarity - u_Polarity);
  // this is equivalent to:
  // float polarity = bool(v_ContourPolarity) ^^ bool(v_SurfacePolarity) ? 0.0 : 1.0;
  // polarity = bool(polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  // float polarity = bool(1) ^^ bool(1) ? 0.0 : 1.0;
  // first | second | result
  // -----------------------
  // 0     | 0      | 1
  // 0     | 1      | 0
  // 1     | 0      | 0
  // 1     | 1      | 1
  vec3 color = u_Color * max(float(u_OutlineMode || u_SkeletonMode), polarity);
  float alpha = u_Alpha * max(float(u_OutlineMode || u_SkeletonMode), polarity);

  vec2 FragCoord = transformLocation(gl_FragCoord.xy);
  if (u_QueryMode) {
    FragCoord = transformLocation(u_PointerPosition);
  }

  // float dist = surfaceDistMain(FragCoord);
  float dist = SDF_FAR_AWAY;


  if (u_QueryMode) {
    // dist = surfaceDistMain(FragCoord);
    // vec2 pointx = getVertexPosition(v_Indicies.x * 2.0 + v_ContourOffset + v_SurfaceOffset);
    // vec2 pointy = getVertexPosition(v_Indicies.y * 2.0 + v_ContourOffset + v_SurfaceOffset);
    // vec2 pointz = getVertexPosition(v_Indicies.z * 2.0 + v_ContourOffset + v_SurfaceOffset);

    // resize the triangle to make it easier to snap
    float indx = mod(v_Indicies.x, v_QtyVerts);
    float indy = mod(v_Indicies.y, v_QtyVerts);
    float indz = mod(v_Indicies.z, v_QtyVerts);
    float indx1 = mod(v_Indicies.x + 1.0, v_QtyVerts);
    float indy1 = mod(v_Indicies.y + 1.0, v_QtyVerts);
    float indz1 = mod(v_Indicies.z + 1.0, v_QtyVerts);
    float indx2 = mod(v_Indicies.x - 1.0, v_QtyVerts);
    float indy2 = mod(v_Indicies.y - 1.0, v_QtyVerts);
    float indz2 = mod(v_Indicies.z - 1.0, v_QtyVerts);
    vec2 pointx = getVertexPosition(indx * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 pointy = getVertexPosition(indy * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 pointz = getVertexPosition(indz * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 pointx1 = getVertexPosition(indx1 * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 pointy1 = getVertexPosition(indy1 * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 pointz1 = getVertexPosition(indz1 * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 pointx2 = getVertexPosition(indx2 * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 pointy2 = getVertexPosition(indy2 * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 pointz2 = getVertexPosition(indz2 * 2.0 + v_ContourOffset + v_SurfaceOffset);
    vec2 directionx = normalize(normalize(abs(normalize(pointx1) - normalize(pointx))) + normalize(abs(normalize(pointx2) - normalize(pointx))));
    vec2 directiony = normalize(normalize(abs(normalize(pointy1) - normalize(pointy))) + normalize(abs(normalize(pointy2) - normalize(pointy))));
    vec2 directionz = normalize(normalize(abs(normalize(pointz1) - normalize(pointz))) + normalize(abs(normalize(pointz2) - normalize(pointz))));
    vec2 centroid = (pointx + pointy + pointz) / 3.0;
    directionx = directionx * sign(pointx - centroid);
    directiony = directiony * sign(pointy - centroid);
    directionz = directionz * sign(pointz - centroid);
    // disabled for now because it is causing issues.
    // pointx = pointx + directionx * (pixel_size * SNAP_DISTANCE_PIXELS);
    // pointy = pointy + directiony * (pixel_size * SNAP_DISTANCE_PIXELS);
    // pointz = pointz + directionz * (pixel_size * SNAP_DISTANCE_PIXELS);


    if (gl_FragCoord.xy == vec2(mod(v_SurfaceIndex, u_Resolution.x) + 0.5, floor(v_SurfaceIndex / u_Resolution.x) + 0.5)) {
      if (u_SnapMode == u_SnapModes.EDGE) {
        if (pointInTriangle(FragCoord, pointx, pointy, pointz)) {
          // vec2 direction = normalize(vec2(
          //     (surfaceDistMain(FragCoord + vec2(1, 0) * EPSILON) - surfaceDistMain(FragCoord + vec2(-1, 0) * EPSILON)),
          //     (surfaceDistMain(FragCoord + vec2(0, 1) * EPSILON) - surfaceDistMain(FragCoord + vec2(0, -1) * EPSILON))
          // ));
          // the first value is the distance to the border of the shape
          // the second value is the direction of the border of the shape
          // the third value is the indicator of a measurement
          // gl_FragColor = vec4(-dist, -direction, 1.0);
          dist = surfaceDistMain(FragCoord);
          gl_FragColor = vec4(-dist, 0.0, 0.0, 1.0);
          return;
        } else {
          discard;
        }
      }
      if (u_SnapMode == u_SnapModes.CENTER) {
        // If snap mode is center, also return 0, not yet able to compute the center of a contour
        if (pointInTriangle(FragCoord, pointx, pointy, pointz)) {
          gl_FragColor = vec4(SDF_FAR_AWAY, 0.0, 0.0, 1.0);
          return;
        } else {
          discard;
        }
      }
      if (u_SnapMode == u_SnapModes.OFF) {
        // If snap mode is off, just return 0 distance
        if (pointInTriangle(FragCoord, pointx, pointy, pointz)) {
          gl_FragColor = vec4(SDF_FAR_AWAY, 0.0, 0.0, 1.0);
          return;
        } else {
          discard;
        }
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
