precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

uniform struct parameters {
  highp int width;
  highp int height;
} u_Parameters;

// COMMON UNIFORMS
uniform float u_QtyFeatures;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;
uniform float u_Polarity;

// COMMON VARYINGS
varying float v_Aspect;

// SURFACE UNIFORMS
uniform sampler2D u_ContoursTexture;
uniform vec2 u_ContoursTextureDimensions;

uniform float u_EndSurfaceId;
uniform float u_ContourId;
uniform float u_EndContourId;
uniform float u_LineSegmentId;
uniform float u_ArcSegmentId;

// ['id', 'xs', 'ys', 'poly_type']
uniform struct contour_parameters {
  highp int id;
  highp int xs;
  highp int ys;
  highp int poly_type;
} u_ContourParameters;

// ['id', 'x', 'y']
uniform struct line_segment_parameters {
  highp int id;
  highp int x;
  highp int y;
} u_LineSegmentParameters;

// ['id', 'x', 'y', 'xc', 'yc', 'clockwise']
uniform struct arc_segment_parameters {
  highp int id;
  highp int x;
  highp int y;
  highp int xc;
  highp int yc;
  highp int clockwise;
} u_ArcSegmentParameters;

// SURFACE VARYINGS
varying float v_Index;
varying float v_Polarity;

float dot2(in vec2 v) {
  return dot(v, v);
}
float cross2d(in vec2 v0, in vec2 v1) {
  return v0.x * v1.y - v0.y * v1.x;
}

const int N = 50000;
// #define N 5.0


mat2 rotateCCW(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

mat2 rotateCW(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

// float sdSegment( in vec2 p, in vec2 a, in vec2 b )
// {
//     vec2 ba = b-a;
//     vec2 pa = p-a;
//     float h =clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
//     return length(pa-h*ba);
// }

float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

// sc is the sin/cos of the aperture
float sdArc( in vec2 p, in vec2 sc, in float ra )
{
    p.x = abs(p.x);
    return ((sc.y*p.x>sc.x*p.y) ? length(p-sc*ra) :
                                  abs(length(p)-ra));
}


// https://math.stackexchange.com/questions/3020095/signed-angle-in-plane:
// "the ratio of the cross product and scalar product is the tangent of the angle"
// From [1]: "The tangent of the signed angle between a and b is det([ab]) / dot(ab)"
float signedAngle(vec2 a, vec2 b) {
    // atan(y, x) returns the angle whose arctangent is y / x. Value in [-pi, pi]
  return atan(a.x * b.y - a.y * b.x, dot(a, b));
}

vec4 texelFetch(sampler2D tex, vec2 texSize, vec2 pixelCoord) {
  vec2 uv = (pixelCoord + 0.5) / texSize;
  return texture2D(tex, uv);
}

float getValueByIndexFromTexture(float index) {
  float col = mod(index, u_ContoursTextureDimensions.x);
  float row = floor(index / u_ContoursTextureDimensions.x);
  return float(texelFetch(u_ContoursTexture, u_ContoursTextureDimensions, vec2(col, row)));
}

float getValueByIndexFromTexture(int index) {
  return getValueByIndexFromTexture(float(index));
}

float slice(in vec2 p, in float angle) {
  vec2 c = vec2(cos(angle), sin(angle));
  //p.x = abs(p.x);
  p.y = abs(p.y);
  float n = length(p - c * dot(p, c));
  return n * sign(c.y * p.x - c.x * p.y);
}

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
}

float substract(float d1, float d2) {
  return max(-d1, d2);
}

float draw(float dist) {
  if (dist > 0.0) {
    discard;
  }
  if (dist * float(u_OutlineMode) < -u_PixelSize) {
    discard;
  }
  return dist;
}

void main() {

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec2 OffsetPosition = TransformedPosition.xy - vec2(0.0, 0.0);
  vec2 FragCoord = OffsetPosition;

  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  vec3 color = u_Color * max(float(u_OutlineMode), polarity);
  float alpha = ALPHA * max(float(u_OutlineMode), polarity);

  float dist = 12340.0;

  float angle = 0.0;
  // float N = 16.0;


  // float t = speed * iTime;

  // 1.0: island
  // 0.0: hole
  // Default to 0 for outside suface
  float island = 0.0;

  // 1.0: island
  // 0.0: hole
  float current_poly_type = 1.0;

  // float distance = 12340.0;

  int offset = 0;
  vec2 currentPoint;
  vec2 previousPoint = vec2(0.0);
  // #pragma optionNV (unroll 1)
  #pragma unroll 1
  for (int i = 0; i < N; i += 1) {

    // if (i > v_SegmentsCount) {
    //   break;
    // }

    int typeIndex = i + offset;
    float id = getValueByIndexFromTexture(typeIndex);

    // END OF SURFACE
    if (id == u_EndSurfaceId) {
      break;
    }

    // END OF CONTOUR
    if (id == u_EndContourId) {
      if (abs(angle) > 0.0001) {
        island = current_poly_type;
      }
      angle = 0.0;
    }

    // NEW CONTOUR
    if (id == u_ContourId) {
      previousPoint = vec2(getValueByIndexFromTexture(typeIndex + u_ContourParameters.xs), getValueByIndexFromTexture(typeIndex + u_ContourParameters.ys));

      current_poly_type = getValueByIndexFromTexture(typeIndex + u_ContourParameters.poly_type);

      offset += 3;
      continue;
    }

    // NEW LINE SEGMENT
    if (id == u_LineSegmentId) {
      currentPoint = vec2(getValueByIndexFromTexture(typeIndex + u_LineSegmentParameters.x), getValueByIndexFromTexture(typeIndex + u_LineSegmentParameters.y));

      angle += signedAngle(previousPoint - FragCoord, currentPoint - FragCoord);

      // float d = sdSegment(FragCoord, previousPoint, currentPoint);
      // dist = min(d, dist);

      // ** to partially optimize the distance calculation, we can use the midpoint of the segment to determine if the frag is close enough to the segment
      if (distance(previousPoint, currentPoint) * 0.5 + u_PixelSize * 5.0 > distance(((currentPoint + previousPoint) / 2.0), FragCoord)) {
        float d = sdSegment(FragCoord, previousPoint, currentPoint);
        dist = min(d, dist);
      }

      previousPoint = currentPoint;
      offset += 2;
      continue;
    }

    // NEW ARC SEGMENT
    if (id == u_ArcSegmentId) {

      // to determine if a point is inisde an arc, we need to check:
      // 𝑃 is inside the circle: 𝑑(𝑂,𝑃) ≤ 𝑟
      // 𝑃 is to the left of 𝑂𝐴 : 𝑂𝐴×𝑂𝑃 ≥ 0 !! DEEMED NOT NECESSARY
      // 𝑃 is to the right of 𝑂𝐵 : 𝑂𝐵×𝑂𝑃 ≤ 0 !! DEEMED NOT NECESSARY
      // 𝑃 is to the right of 𝐴𝐵 : 𝐴𝐵×𝐴𝑃 ≤ 0

      vec2 center = vec2(getValueByIndexFromTexture(typeIndex + u_ArcSegmentParameters.xc), getValueByIndexFromTexture(typeIndex + u_ArcSegmentParameters.yc));
      vec2 currentPoint = vec2(getValueByIndexFromTexture(typeIndex + u_ArcSegmentParameters.x), getValueByIndexFromTexture(typeIndex + u_ArcSegmentParameters.y));
      float clockwise = getValueByIndexFromTexture(typeIndex + u_ArcSegmentParameters.clockwise);

      vec2 previousSegment = previousPoint - center;
      vec2 currentSegment = currentPoint - center;
      vec2 coordSegment = FragCoord - center;

      float true_radius = (length(currentSegment) + length(previousSegment)) / 2.0;

      // frag is inside the circle
      float inside_circle = length(coordSegment) <= true_radius ? 1.0 : 0.0;

      // frag is to the right or left of the chord (depending on the direction of the arc)
      float side_of_chord = cross2d(previousPoint - currentPoint, previousPoint - FragCoord) * sign(clockwise - 0.5) >= 0.0 ? 1.0 : 0.0;

      // frag is inside the arc
      float p_in_arc = inside_circle * side_of_chord;

      if (p_in_arc == 0.0) {
        angle += signedAngle(previousPoint - FragCoord, currentPoint - FragCoord);
      } else {
        // if (clockwise == 1.0) {
        //   angle += -(2.0 * PI) - abs(signedAngle(previousPoint - FragCoord, currentPoint - FragCoord));
        // } else {
        //   angle += (2.0 * PI) - abs(signedAngle(previousPoint - FragCoord, currentPoint - FragCoord));
        // }
        angle += ((2.0 * PI) - abs(signedAngle(previousPoint - FragCoord, currentPoint - FragCoord))) * -sign(clockwise - 0.5);
      }

      // float sdX = previousPoint.x - center.x;
      // float sdY = previousPoint.y - center.y;
      // float start_angle = atan(sdY, sdX);
      // float edX = currentPoint.x - center.x;
      // float edY = currentPoint.y - center.y;
      // float end_angle = atan(edY, edX);
      // float d = (clockwise == 0.0 ? -1.0 : 1.0) * (start_angle - end_angle >= 0.0 ? 1.0 : -1.0) * slice((FragCoord - center) * rotateCCW(((start_angle + end_angle) / 2.0)), abs(start_angle - end_angle) / 2.0);
      // d = substract(d, abs(circleDist(FragCoord - center, true_radius)));
      // dist = min(d, dist);

      // ** to partially optimize the distance calculation, we can use the midpoint of the segment to determine if the frag is close enough to the segment
      float distance_to_center = distance(FragCoord, center);
      if (distance_to_center < true_radius + u_PixelSize * 5.0 && distance_to_center > true_radius - u_PixelSize * 5.0) {
        float sdX = previousPoint.x - center.x;
        float sdY = previousPoint.y - center.y;
        float start_angle = atan(sdY, sdX);
        float edX = currentPoint.x - center.x;
        float edY = currentPoint.y - center.y;
        float end_angle = atan(edY, edX);
        float d = (clockwise == 0.0 ? -1.0 : 1.0) * (start_angle - end_angle >= 0.0 ? 1.0 : -1.0) * slice((FragCoord - center) * rotateCCW(((start_angle + end_angle) / 2.0)), abs(start_angle - end_angle) / 2.0);
        d = substract(d, abs(circleDist(FragCoord - center, true_radius)));
        dist = min(d, dist);
      }



      previousPoint = currentPoint;
      offset += 5;
      continue;
    }

  }


  if (island == 1.0) {
    dist = -dist;
  }

  #pragma glslify: import('../modules/Debug.glsl')

  dist = draw(dist);
  gl_FragColor = vec4(color, alpha);
}
