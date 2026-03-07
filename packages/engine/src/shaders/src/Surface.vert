precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

// COMMON UNIFROMS
uniform mat3 u_Transform;
uniform mat4 u_Transform3D;
uniform float u_ZOffset;
uniform vec2 u_Resolution;
uniform float u_QtyFeatures;
uniform float u_PixelSize;
uniform float u_IndexOffset;
uniform bool u_PointerDown;
uniform bool u_QueryMode;
uniform bool u_Perspective3D;

// COMMON ATTRIBUTES
attribute vec2 a_VertexPosition;

// SURFACE UNIFORMS
uniform sampler2D u_Vertices;
uniform vec2 u_VerticesDimensions;

// SURFACE ATTRIBUTES
attribute float a_ContourIndex;
attribute float a_ContourPolarity;
attribute float a_ContourOffset;
attribute vec3 a_Indicies;
attribute float a_QtyVerts;
attribute float a_QtyContours;
attribute float a_SurfaceIndex;
attribute float a_SurfacePolarity;
attribute float a_SurfaceOffset;

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
  float x = texelFetch(u_Vertices, u_VerticesDimensions, vec2(xcol, xrow)).z;
  float ycol = mod(index + 1.0, u_VerticesDimensions.x);
  float yrow = floor((index + 1.0) / u_VerticesDimensions.x);
  float y = texelFetch(u_Vertices, u_VerticesDimensions, vec2(ycol, yrow)).z;
  // if (x < y+0.1 && x > y-0.1) {
  //   x = mod(index, u_VerticesDimensions.x);
  //   y = mod(index, u_VerticesDimensions.x);
  // }
  return vec2(x, y);
}

#pragma glslify: transformLocation3D = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)


void main() {

  vec2 pointx = getVertexPosition(a_Indicies.x * 2.0 + a_ContourOffset + a_SurfaceOffset);
  vec2 pointy = getVertexPosition(a_Indicies.y * 2.0 + a_ContourOffset + a_SurfaceOffset);
  vec2 pointz = getVertexPosition(a_Indicies.z * 2.0 + a_ContourOffset + a_SurfaceOffset);

  // float indx = mod(a_Indicies.x, a_QtyVerts);
  // float indy = mod(a_Indicies.y, a_QtyVerts);
  // float indz = mod(a_Indicies.z, a_QtyVerts);
  // float indx1 = mod(a_Indicies.x + 1.0, a_QtyVerts);
  // float indy1 = mod(a_Indicies.y + 1.0, a_QtyVerts);
  // float indz1 = mod(a_Indicies.z + 1.0, a_QtyVerts);
  // float indx2 = mod(a_Indicies.x - 1.0, a_QtyVerts);
  // float indy2 = mod(a_Indicies.y - 1.0, a_QtyVerts);
  // float indz2 = mod(a_Indicies.z - 1.0, a_QtyVerts);
  // vec2 pointx = getVertexPosition(indx * 2.0 + a_ContourOffset + a_SurfaceOffset);
  // vec2 pointy = getVertexPosition(indy * 2.0 + a_ContourOffset + a_SurfaceOffset);
  // vec2 pointz = getVertexPosition(indz * 2.0 + a_ContourOffset + a_SurfaceOffset);
  // vec2 pointx1 = getVertexPosition(indx1 * 2.0 + a_ContourOffset + a_SurfaceOffset);
  // vec2 pointy1 = getVertexPosition(indy1 * 2.0 + a_ContourOffset + a_SurfaceOffset);
  // vec2 pointz1 = getVertexPosition(indz1 * 2.0 + a_ContourOffset + a_SurfaceOffset);
  // vec2 pointx2 = getVertexPosition(indx2 * 2.0 + a_ContourOffset + a_SurfaceOffset);
  // vec2 pointy2 = getVertexPosition(indy2 * 2.0 + a_ContourOffset + a_SurfaceOffset);
  // vec2 pointz2 = getVertexPosition(indz2 * 2.0 + a_ContourOffset + a_SurfaceOffset);
  // vec2 directionx = normalize(normalize(abs(normalize(pointx1) - normalize(pointx))) + normalize(abs(normalize(pointx2) - normalize(pointx))));
  // vec2 directiony = normalize(normalize(abs(normalize(pointy1) - normalize(pointy))) + normalize(abs(normalize(pointy2) - normalize(pointy))));
  // vec2 directionz = normalize(normalize(abs(normalize(pointz1) - normalize(pointz))) + normalize(abs(normalize(pointz2) - normalize(pointz))));
  // vec2 centroid = (pointx + pointy + pointz) / 3.0;
  // float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  // float pixel_size = u_PixelSize / scale;
  // directionx = directionx * sign(pointx - centroid);
  // directiony = directiony * sign(pointy - centroid);
  // directionz = directionz * sign(pointz - centroid);
  // pointx = pointx + directionx * (pixel_size * SNAP_DISTANCE_PIXELS);
  // pointy = pointy + directiony * (pixel_size * SNAP_DISTANCE_PIXELS);
  // pointz = pointz + directionz * (pixel_size * SNAP_DISTANCE_PIXELS);

  vec2 OffsetPosition = vec2(0.0, 0.0);
  if (a_VertexPosition.x == 0.0)
    OffsetPosition = pointx;
  else if (a_VertexPosition.x == 1.0)
    OffsetPosition = pointy;
  else if (a_VertexPosition.x == 2.0)
    OffsetPosition = pointz;

  // vec2 OffsetPosition = getVertexPosition(index * 2.0 + a_ContourOffset);
  vec3 FinalPosition = u_Transform * vec3(OffsetPosition.x, OffsetPosition.y, 1);
  vec4 FinalPosition3D = transformLocation3D(FinalPosition.xy);

  v_ContourIndex = a_ContourIndex;
  v_ContourPolarity = a_ContourPolarity;
  v_ContourOffset = a_ContourOffset;
  v_Indicies = a_Indicies;
  v_QtyVerts = a_QtyVerts;
  v_SurfaceIndex = a_SurfaceIndex;
  v_SurfacePolarity = a_SurfacePolarity;
  v_SurfaceOffset = a_SurfaceOffset;



  if (u_QueryMode) {
    vec2 New_Vertex_Position = vec2(0.0, 0.0);
    if (a_VertexPosition.x == 0.0)
      New_Vertex_Position = vec2(1.0, -1.0);
    else if (a_VertexPosition.x == 1.0)
      New_Vertex_Position = vec2(-1.0, 1.0);
    else if (a_VertexPosition.x == 2.0)
      New_Vertex_Position = vec2(1.0, 1.0);
    // if (a_VertexPosition.x == 0.0)
    //   New_Vertex_Position = vec2(0.0, 0.0);
    // else if (a_VertexPosition.x == 1.0)
    //   New_Vertex_Position = vec2(1.0, 0.0);
    // else if (a_VertexPosition.x == 2.0)
    //   New_Vertex_Position = vec2(0.0, 1.0);
    FinalPosition3D.xy = ((((New_Vertex_Position + vec2(mod(a_SurfaceIndex, u_Resolution.x) + 0.5, floor(a_SurfaceIndex / u_Resolution.x))) / u_Resolution) * 2.0) - vec2(1.0,1.0));
    FinalPosition3D.zw = vec2(0.0);
  }

  float Index = u_IndexOffset + (a_SurfaceIndex / u_QtyFeatures + a_ContourIndex / (a_QtyContours * u_QtyFeatures));
  // float Index = u_IndexOffset + (a_Index / u_QtyFeatures);
  // affix the index to the z position, this sorts the rendering order without perspective issues
  FinalPosition3D.z = Index;
  // add 1.0 to w to avoid issues with w=0 in perspective divide
  FinalPosition3D.w += 1.0;
  gl_Position = vec4(FinalPosition3D);
}
