precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

// COMMON UNIFORMS
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_QtyContours;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;


// SURFACE UNIFORMS
uniform sampler2D u_Vertices;
uniform vec2 u_VerticesDimensions;
uniform float u_Polarity;


// SURFACE VARYINGS
varying float v_Index;
varying float v_Polarity;
varying float v_Offset;
varying vec3 v_Indicies;
varying float v_QtyVerts;




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


float draw(float dist) {
  if (dist * float(u_OutlineMode) > u_PixelSize) {
    discard;
  }
  return dist;
}

void main() {

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec2 OffsetPosition = TransformedPosition.xy - vec2(0.0, 0.0);
  vec2 FragCoord = OffsetPosition;

  // v_Polarity = Island (1) or Hole (0)
  // u_Polarity = Positive (1) or Negative (0)
  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  // float polarity = bool(1) ^^ bool(1) ? 0.0 : 1.0;
  // first | second | result
  // -----------------------
  // 0     | 0      | 1
  // 0     | 1      | 0
  // 1     | 0      | 0
  // 1     | 1      | 1
  vec3 color = u_Color * max(float(u_OutlineMode), polarity);
  float alpha = ALPHA * max(float(u_OutlineMode), polarity);


  float dist = 100.0;


  for (float i = -5.0; i <= 4.0; i += 1.0) {
    float indx = mod(v_Indicies.x + i, v_QtyVerts);
    float indx1 = mod(v_Indicies.x + i + 1.0, v_QtyVerts);
    vec2 point1_p = getVertexPosition(indx * 2.0 + v_Offset);
    vec2 point1_n = getVertexPosition(indx1 * 2.0 + v_Offset);
    dist = min(dist, sdfSegment(FragCoord, point1_n, point1_p));
    float indy = mod(v_Indicies.y + i, v_QtyVerts);
    float indy1 = mod(v_Indicies.y + i + 1.0, v_QtyVerts);
    vec2 point2_p = getVertexPosition(indy * 2.0 + v_Offset);
    vec2 point2_n = getVertexPosition(indy1 * 2.0 + v_Offset);
    dist = min(dist, sdfSegment(FragCoord, point2_n, point2_p));
    float indz = mod(v_Indicies.z + i, v_QtyVerts);
    float indz1 = mod(v_Indicies.z + i + 1.0, v_QtyVerts);
    vec2 point3_p = getVertexPosition(indz * 2.0 + v_Offset);
    vec2 point3_n = getVertexPosition(indz1 * 2.0 + v_Offset);
    dist = min(dist, sdfSegment(FragCoord, point3_n, point3_p));
  }




  // ** DEBUG **
  // vec3 col = (dist > 0.0) ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
  // col *= 1.0 - exp(-3.0*abs(dist * 0.01 / u_PixelSize));
  // col *= 0.8 + 0.25*cos(dist / u_PixelSize);
  // // col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,u_PixelSize,abs(dist)) );
  // if (dist > 0.0 && dist < u_PixelSize) {
  //   col = vec3(1.0, 1.0, 1.0);
  // }
  // gl_FragColor = vec4(col, 1.0);
  // return;


  dist = draw(dist);
  gl_FragColor = vec4(color, alpha);
}
