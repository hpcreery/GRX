precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

//////////////////////////////////////
// Combine distance field functions //
//////////////////////////////////////

float smoothMerge(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

float merge(float d1, float d2) {
  return min(d1, d2);
}

float mergeExclude(float d1, float d2) {
  return min(max(-d1, d2), max(-d2, d1));
}

float substract(float d1, float d2) {
  return max(-d1, d2);
}

float intersect(float d1, float d2) {
  return max(d1, d2);
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

float pieDist(vec2 p, float angle) {
  angle = radians(angle) / 2.0;
  vec2 n = vec2(cos(angle), sin(angle));
  return abs(p).x * n.x + p.y * n.y;
}

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
}

float triangleDist( in vec2 p, float width, float height )
{
    p += vec2(0.0, -height/2.0);
    vec2 q = vec2(width/2.0, -height);
    p.x = abs(p.x);
    vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
    vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
    float s = -sign( q.y );
    vec2 d = min( vec2( dot(a,a), s*(p.x*q.y-p.y*q.x) ),
                  vec2( dot(b,b), s*(p.y-q.y)  ));
    return -sqrt(d.x)*sign(d.y);
}

float semiCircleDist(vec2 p, float radius, float angle, float width) {
  width /= 2.0;
  radius -= width;
  return substract(pieDist(p, angle), abs(circleDist(p, radius)) - width);
}

float lineDist(vec2 p, vec2 start, vec2 end, float width) {
  vec2 dir = start - end;
  float lngth = length(dir);
  dir /= lngth;
  vec2 proj = max(0.0, min(lngth, dot((start - p), dir))) * dir;
  return length((start - p) - proj) - (width / 2.0);
}

float boxDist(vec2 p, vec2 size) {
  size /= 2.0;
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec4 roundedCornersVector(float corners) {
  // CORNERS IS A VALUE FROM 0 TO 15, 1,2,4,8 indicate the chamfered corner and the sum of the values is between 0 and 15 base 2 added up

  // r.x = roundness top-right
  // r.y = roundness top-left
  // r.z = roundness bottom-left
  // r.w = roundness bottom-right
  vec4 r = vec4(0.0, 0.0, 0.0, 0.0);

  // default to all corners
  corners = mod(corners, 16.0);
  if (corners == 0.0) {
    corners = 15.0;
  }
  // bottom-right
  r.w = step(8.0, corners);
  corners = mod(corners, 8.0);
  // bottom-left
  r.z = step(4.0, corners);
  corners = mod(corners, 4.0);
  // top-left
  r.y = step(2.0, corners);
  corners = mod(corners, 2.0);
  // top-right
  r.x = step(1.0, corners);
  corners = mod(corners, 1.0);
  return r;
}

// this only works if angle is a factor of 45 and num_of_spokes is 1,2,4
// returns vec4 indicating ur, ul, bl, br
vec4 openCorners(in float angle, in float num_of_spokes) {
  vec4 a = vec4(45.0, 315.0, 225.0, 135.0);
  vec4 b = step(mod((a - 45.0) + (angle - 45.0), (360.0 / num_of_spokes)), vec4(0.0));
  return b;
}

// Round Box with rounded all corners
float roundBoxDist(vec2 p, vec2 size, float radius) {
  size /= 2.0;
  size -= vec2(radius);
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;
}

// Round box with vec4 of rounded corners
float roundBoxDist(vec2 p, vec2 size, vec4 corners) {
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  vec2 q = abs(p) - size + corners.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - corners.x;
}

// Round box with uniform corner radius and float of corners rounded, see roundedCornersVector
float roundBoxDist(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return roundBoxDist(p, size, r);
}

float segmentDist( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

float segmentSideDist( in vec2 p, in vec2 a, in vec2 b )
{
    float dist = segmentDist(p,a,b);

    //https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line
    //Given a line a--b and point c
    //(b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x) > 0;
    float side = (b.x - a.x)*(p.y - a.y) - (b.y - a.y)*(p.x - a.x);

    return dist*sign(side);
}

// Chamfered box with vec4 of rounded corners
float chamferedBoxDist(vec2 p, vec2 size, vec4 corners) {
  float box = boxDist(p, size);
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  float chamfer = segmentSideDist(abs(p), size - vec2(corners.x, 0.0), size - vec2(0.0, corners.x));
  if (corners.x == 0.0) {
    return box;
  }
  if (abs(p.x) < size.x - corners.x) {
    if (abs(p.y) > size.y) {
      return box;
    }
  }
  if (abs(p.y) < size.y - corners.x) {
    if (abs(p.x) > size.x) {
      return box;
    }
  }
  return max(chamfer, box);
}

// Chamfered box with uniform corner radius and float of corners rounded, see roundedCornersVector
float chamferedBoxDist(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return chamferedBoxDist(p, size, r);
}

float ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }

// Diamond
float diamonDist(vec2 p, vec2 size) {
  p = abs(p);
  float h = clamp( ndot(size-2.0*p,size)/dot(size,size), -1.0, 1.0 );
  float d = length( p-0.5*size*vec2(1.0-h,1.0+h) );
  return d * sign( p.x*size.y + p.y*size.x - size.x*size.y );
}

// Vertical Hexagon
float verticalHexagonDist(vec2 p, vec2 size, float radius) {
  float box = boxDist(p, size);
  size /= 2.0;
  float chamfer = segmentSideDist(abs(p), vec2(0.0, size.y), vec2(size.x, size.y - radius));
  if (abs(p.y) < size.y - radius) {
    if (abs(p.x) > size.x) {
      return box;
    }
  }
  return max(chamfer, box);
}

// Horizontal Hexagon
float horizHexagonDist(vec2 p, vec2 size, float radius) {
  float box = boxDist(p, size);
  size /= 2.0;
  float chamfer = segmentSideDist(abs(p), vec2(size.x - radius, size.y), vec2(size.x, 0.0));
  if (abs(p.x) < size.x - radius) {
    if (abs(p.y) > size.y) {
      return box;
    }
  }
  return max(chamfer, box);
}

float butterflyDist(vec2 p, float dist) {
  float d = circleDist(p, dist);
  float ulSquareDist = boxDist(p - vec2(-0.5 * dist, 0.5 * dist), vec2(dist, dist));
  float lrSquareDist = boxDist(p - vec2(0.5 * dist, -0.5 * dist), vec2(dist, dist));
  float ul = max(d, ulSquareDist);
  float lr = max(d, lrSquareDist);
  d = min(ul, lr);
  return d;
}

float squareButterflydist(vec2 p, float dist) {
  float ul = boxDist(p - vec2(-0.5 * dist, 0.5 * dist), vec2(dist, dist));
  float lr = boxDist(p - vec2(0.5 * dist, -0.5 * dist), vec2(dist, dist));
  float d = min(ul, lr);
  return d;
}

// used
float sqaureRoundThermalDist(in vec2 p, in vec2 outer_size, in float id, in float angle, in float num_of_spokes, in float gap) {

  float inner_size = id / 2.0;
  float outersquare = boxDist(p, outer_size);
  float innercircle = circleDist(p, inner_size);
  float d = substract(innercircle, outersquare);

  if (num_of_spokes == 0.0) {
    return d;
  }

  float r_angle = radians(angle);
  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * n_angle));
  // return n_angle;

  float near_spoke_angle = atan(p.y, p.x) - n_angle;
  // nomalize angle
  near_spoke_angle = atan(sin(near_spoke_angle), cos(near_spoke_angle));


  vec2 sc = vec2(cos(near_spoke_angle), sin(near_spoke_angle));
  vec2 sc_tangent = vec2(cos(near_spoke_angle + PI/2.0), sin(near_spoke_angle + PI/2.0));

  // rotate p by n_angle to get the spoke at 0 degrees
  vec2 p_rotated_spoke_zero = rotateCCW(p, n_angle);

  // cheeky ray marching
  float outer_movement_rotate_up = 0.0;
  float outer_movement_rotate_down = 0.0;
  float inner_movement_rotate_up = 0.0;
  float inner_movement_rotate_down = 0.0;

  for (int i = 0; i < 10; i++) {
    vec2 outer_up = outer_movement_rotate_up * sc + gap/2.0 * sc_tangent;
    vec2 outer_down = outer_movement_rotate_down * sc - gap/2.0 * sc_tangent;
    vec2 inner_up = inner_movement_rotate_up * sc + gap/2.0 * sc_tangent;
    vec2 inner_down = inner_movement_rotate_down * sc - gap/2.0 * sc_tangent;

    outer_movement_rotate_up += boxDist(p_rotated_spoke_zero - outer_up, outer_size);
    outer_movement_rotate_down += boxDist(p_rotated_spoke_zero - outer_down, outer_size);
    inner_movement_rotate_up += circleDist(p_rotated_spoke_zero - inner_up, inner_size);
    inner_movement_rotate_down += circleDist(p_rotated_spoke_zero - inner_down, inner_size);
  }

  vec2 a1 = vec2(abs(length(p_rotated_spoke_zero)) - outer_movement_rotate_up, 0.0 );
  vec2 a2 = vec2(abs(length(p_rotated_spoke_zero)) - inner_movement_rotate_up, 0.0 );
  vec2 b1 = vec2(abs(length(p_rotated_spoke_zero)) - outer_movement_rotate_down, 0.0);
  vec2 b2 = vec2(abs(length(p_rotated_spoke_zero)) - inner_movement_rotate_down, 0.0);

  // rotate p by near_spoke_angle to get the spoke at the correct angle
  vec2 p_rotated = rotateCCW(p, near_spoke_angle);

  float spoke_up = segmentSideDist(p_rotated + vec2(0.0, gap/2.0), a2, a1);
  float spoke_down = segmentSideDist(p_rotated - vec2(0.0, gap/2.0), b1, b2);
  float spoke = min(min(spoke_up, spoke_down), p_rotated.x);

  const float eps = 0.001;
  vec2 pLeft = p + vec2(-eps, 0);
  vec2 pRight = p + vec2(eps, 0);
  vec2 pUp = p + vec2(0, eps);
  vec2 pDown = p + vec2(0, -eps);

  float distLeft = substract(circleDist(pLeft, inner_size), boxDist(pLeft, outer_size));
  float distRight = substract(circleDist(pRight, inner_size), boxDist(pRight, outer_size));
  float distUp = substract(circleDist(pUp, inner_size), boxDist(pUp, outer_size));
  float distDown = substract(circleDist(pDown, inner_size), boxDist(pDown, outer_size));
  vec2 grad = normalize(vec2(
      (distRight - distLeft),
      (distUp - distDown)
  ));

  if (d < 0.0) {
    return max(d, spoke);
  }

  vec2 p_on_edge = p - grad * d;
  vec2 p_on_edge_rotated = rotateCCW(p_on_edge, near_spoke_angle);
  vec2 p_on_edge_rotated_rotated_up = p_on_edge_rotated + vec2(0.0, gap/2.0);
  vec2 p_on_edge_rotated_rotated_down =  p_on_edge_rotated - vec2(0.0, gap/2.0);
  float s_up = p_on_edge_rotated_rotated_up.y;
  float s_down = -p_on_edge_rotated_rotated_down.y;

  float cutoff = min(min(s_up, s_down), p_on_edge_rotated.x);
  if (cutoff > 0.0) {
    return min(abs(spoke_up), abs(spoke_down));
  } else {
    return d;
  }

  return d;
}

// used
float roundedBoxThermalDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width, in float radius, in float corners, in float rounded) {

  vec2 outer_size = vec2(width, height);
  vec2 inner_size = outer_size - line_width * 2.0;
  float inner_radius = max(0.0, radius - line_width);
  float outersquare = roundBoxDist(p, outer_size, radius, corners);
  float innersquare = roundBoxDist(p, inner_size, inner_radius, corners);
  float d = substract(innersquare, outersquare);

  if (num_of_spokes == 0.0) {
    return d;
  }

  if (rounded == 1.0) {
    gap += line_width;
    radius = max(0.0, radius - line_width/2.0);
    inner_radius = radius;
    outer_size = vec2(width - line_width, height - line_width);
    inner_size = outer_size;
  }

  float r_angle = radians(angle);
  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * n_angle));
  // return n_angle;

  float near_spoke_angle = atan(p.y, p.x) - n_angle;
  // nomalize angle
  near_spoke_angle = atan(sin(near_spoke_angle), cos(near_spoke_angle));


  vec2 sc = vec2(cos(near_spoke_angle), sin(near_spoke_angle));
  vec2 sc_tangent = vec2(cos(near_spoke_angle + PI/2.0), sin(near_spoke_angle + PI/2.0));

  // rotate p by n_angle to get the spoke at 0 degrees
  vec2 p_rotated_spoke_zero = rotateCCW(p, n_angle);

  // cheeky ray marching
  float outer_movement_rotate_up = 0.0;
  float outer_movement_rotate_down = 0.0;
  float inner_movement_rotate_up = 0.0;
  float inner_movement_rotate_down = 0.0;

  for (int i = 0; i < 10; i++) {
    vec2 outer_up = outer_movement_rotate_up * sc + gap/2.0 * sc_tangent;
    vec2 outer_down = outer_movement_rotate_down * sc - gap/2.0 * sc_tangent;
    vec2 inner_up = inner_movement_rotate_up * sc + gap/2.0 * sc_tangent;
    vec2 inner_down = inner_movement_rotate_down * sc - gap/2.0 * sc_tangent;

    outer_movement_rotate_up += roundBoxDist(p_rotated_spoke_zero - outer_up, outer_size, radius, corners);
    outer_movement_rotate_down += roundBoxDist(p_rotated_spoke_zero - outer_down, outer_size, radius, corners);
    inner_movement_rotate_up += roundBoxDist(p_rotated_spoke_zero - inner_up, inner_size, inner_radius, corners);
    inner_movement_rotate_down += roundBoxDist(p_rotated_spoke_zero - inner_down, inner_size, inner_radius, corners);
  }

  vec2 a1 = vec2(abs(length(p_rotated_spoke_zero)) - outer_movement_rotate_up, 0.0);
  vec2 a2 = vec2(abs(length(p_rotated_spoke_zero)) - inner_movement_rotate_up, 0.0);
  vec2 b1 = vec2(abs(length(p_rotated_spoke_zero)) - outer_movement_rotate_down, 0.0);
  vec2 b2 = vec2(abs(length(p_rotated_spoke_zero)) - inner_movement_rotate_down, 0.0);

  // rotate p by near_spoke_angle to get the spoke at the correct angle
  vec2 p_rotated = rotateCCW(p, near_spoke_angle);

  float spoke_up = segmentSideDist(p_rotated + vec2(0.0, gap/2.0), a2, a1);
  float spoke_down = segmentSideDist(p_rotated - vec2(0.0, gap/2.0), b1, b2);
  float spoke = min(min(spoke_up, spoke_down), p_rotated.x);

  if (rounded == 1.0) {
    vec2 middlea = (a1 + a2) / 2.0;
    vec2 middleb = (b1 + b2) / 2.0;
    spoke_up = circleDist(p_rotated + vec2(-a1.x, (gap)/2.0), line_width/2.0);
    spoke_down = circleDist(p_rotated + vec2(-b1.x, -(gap)/2.0), line_width/2.0);
    spoke = min(spoke_up, spoke_down);
  }

  const float eps = 0.001;
  vec2 pLeft = p + vec2(-eps, 0);
  vec2 pRight = p + vec2(eps, 0);
  vec2 pUp = p + vec2(0, eps);
  vec2 pDown = p + vec2(0, -eps);

  float distLeft = substract(roundBoxDist(pLeft, inner_size, inner_radius, corners), roundBoxDist(pLeft, outer_size, radius, corners));
  float distRight = substract(roundBoxDist(pRight, inner_size, inner_radius, corners), roundBoxDist(pRight, outer_size, radius, corners));
  float distUp = substract(roundBoxDist(pUp, inner_size, inner_radius, corners), roundBoxDist(pUp, outer_size, radius, corners));
  float distDown = substract(roundBoxDist(pDown, inner_size, inner_radius, corners), roundBoxDist(pDown, outer_size, radius, corners));
  float newD = d;
  if (rounded == 1.0) {
    distLeft = abs(roundBoxDist(pLeft, outer_size, radius, corners));
    distRight = abs(roundBoxDist(pRight, outer_size, radius, corners));
    distUp = abs(roundBoxDist(pUp, outer_size, radius, corners));
    distDown = abs(roundBoxDist(pDown, outer_size, radius, corners));
    newD = abs(roundBoxDist(p, outer_size, radius, corners));
  }



  vec2 grad = normalize(vec2(
      (distRight - distLeft),
      (distUp - distDown)
  ));

  if (rounded == 0.0) {
    if (d < 0.0) {
      return max(d, spoke);
    }
  }

  vec2 p_on_edge = p - grad * newD;
  vec2 p_on_edge_rotated = rotateCCW(p_on_edge, near_spoke_angle);
  vec2 p_on_edge_rotated_rotated_up = p_on_edge_rotated + vec2(0.0, gap/2.0);
  vec2 p_on_edge_rotated_rotated_down =  p_on_edge_rotated - vec2(0.0, gap/2.0);
  float s_up = p_on_edge_rotated_rotated_up.y;
  float s_down = -p_on_edge_rotated_rotated_down.y;

  float cutoff = min(min(s_up, s_down), p_on_edge_rotated.x);
  if (cutoff > 0.0) {
    if (rounded == 1.0) {
      return min(spoke_up, spoke_down);
    }
    return min(abs(spoke_up), abs(spoke_down));
  } else {
    return d;
  }

  return spoke;
}

// used
float fixedAngleRoundedBoxThermalDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width, in float radius, in float corners, in float rounded) {
  float inner_radius = max(0.0, radius - line_width);
  float outerbox = roundBoxDist(p, vec2(width, height), radius, corners);
  float innerbox = roundBoxDist(p, vec2(width, height) - line_width * 2.0, inner_radius, corners);
  float d = substract(innerbox, outerbox);
  angle = mod(floor((angle / 45.0) + 0.5) * 45.0, 90.0);
  num_of_spokes = min(4.0, num_of_spokes);
  if (num_of_spokes == 3.0) {
    num_of_spokes = 4.0;
  }
  if (angle == 0.0 && mod(num_of_spokes, 2.0) == 0.0) {
    d = roundedBoxThermalDist(p, width, height, angle, num_of_spokes, gap, line_width, radius, corners, rounded);
    return d;
  }
  vec2 offset = vec2(max(0.0, width - height) / 2.0, max(0.0, height - width) / 2.0);
  offset.x = p.x > 0.0 ? offset.x : -offset.x;
  offset.y = p.y > 0.0 ? offset.y : -offset.y;
  if (abs(offset.x) > abs(p.x)) {
    return d;
  }
  if (abs(offset.y) > abs(p.y)) {
    return d;
  }
  p = translate(p, offset);
  d = roundedBoxThermalDist(p, min(width, height), min(width, height), angle, num_of_spokes, gap, line_width, radius, corners, rounded);
  return d;
}

// used
float boxThermalOpenCornersDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width) {

  angle = mod(floor((angle / 45.0) + 0.5) * 45.0, 90.0);
  num_of_spokes = max(min(4.0, num_of_spokes), 1.0);

  // if angle is a multiple of 90 degrees,
  if (mod(angle, 90.0) == 0.0) {
    return roundedBoxThermalDist(p, width, height, angle, num_of_spokes, gap, line_width, 0.0, 0.0, 0.0);
  }

  // if angle is a multiple of 45 degrees, draw 4 rects
  if (mod(angle, 45.0) == 0.0) {
    vec4 corners = openCorners(angle, num_of_spokes);

    float topWidth = width - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.y * (gap * sin(radians(45.0)) + line_width));
    float botWidth = width - (corners.z * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
    vec2 topLocation = vec2(corners.y * (width / 2.0 - topWidth / 2.0) - corners.x * (width / 2.0 - topWidth / 2.0), height / 2.0 - line_width / 2.0);
    vec2 botLocation = vec2(corners.z * (width / 2.0 - botWidth / 2.0) - corners.w * (width / 2.0 - botWidth / 2.0), -height / 2.0 + line_width / 2.0);

    float topBox = boxDist(translate(p, topLocation), vec2(topWidth, line_width));
    float botBox = boxDist(translate(p, botLocation), vec2(botWidth, line_width));

    float leftHeight = height - (corners.y * (gap * sin(radians(45.0)) + line_width)) - (corners.z * (gap * sin(radians(45.0)) + line_width));
    float rightHeight = height - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
    vec2 leftLocation = vec2(-width / 2.0 + line_width / 2.0, corners.z * (height / 2.0 - leftHeight / 2.0) - corners.y * (height / 2.0 - leftHeight / 2.0));
    vec2 rightLocation = vec2(width / 2.0 - line_width / 2.0, corners.w * (height / 2.0 - rightHeight / 2.0) - corners.x * (height / 2.0 - rightHeight / 2.0));

    float leftBox = boxDist(translate(p, leftLocation), vec2(line_width, leftHeight));
    float rightBox = boxDist(translate(p, rightLocation), vec2(line_width, rightHeight));

    float tb = merge(topBox, botBox);
    float lr = merge(leftBox, rightBox);
    return merge(lr, tb);
  }

  return 0.0;
}


float ellipseDist(vec2 p, vec2 ab) {
    // symmetry
  p = abs(p);

    // find root with Newton solver
  vec2 q = ab * (p - ab);
  float w = (q.x < q.y) ? 1.570796327 : 0.0;
  for (int i = 0; i < 5; i++) {
    vec2 cs = vec2(cos(w), sin(w));
    vec2 u = ab * vec2(cs.x, cs.y);
    vec2 v = ab * vec2(-cs.y, cs.x);
    w = w + dot(p - u, v) / (dot(p - u, u) + dot(v, v));
  }

    // compute final point and distance
  float d = length(p - ab * vec2(cos(w), sin(w)));

    // return signed distance
  return (dot(p / ab, p / ab) > 1.0) ? d : -d;
}

float moireODBDist(vec2 p, float ring_width, float ring_gap, float num_rings, float line_width, float line_length, float angle) {

  ring_gap = ring_gap - (ring_width / 2.0);
  float a = ((ring_width + ring_gap) / 2.0);

  float t = (ring_width - ring_gap) / 4.0;
  float offset = ring_gap + (ring_width / 2.0);

  float rings = (a / PI) * asin(sin((PI / a) * (length(p) + t - offset))) - t;
  float rings_edge = circleDist(p, ((ring_width + ring_gap) * num_rings) + (ring_width / 2.0) + ring_gap);

  float target_pad = circleDist(p, ring_width / 2.0);
  float target_pad_clearance = -circleDist(p, (ring_width / 2.0) + (ring_gap * 2.0));
  float target = min(target_pad, target_pad_clearance);

  rings = max(rings, rings_edge);
  rings = max(rings, target);

  float line1 = roundBoxDist(p * rotateCCW(radians(angle)), vec2(line_length, line_width), line_width/2.0, 15.0);
  float line2 = roundBoxDist(p * rotateCCW(radians(angle)), vec2(line_width, line_length), line_width/2.0, 15.0);
  float lines = min(line1, line2);

  return min(rings, lines);
}

float moireGerberDist(vec2 p, float ring_width, float ring_gap, float num_rings, float line_width, float line_length, float angle, float outer_dia) {

  float a = ((ring_width + ring_gap) / 2.0);
  float t = (ring_width - ring_gap) / 4.0;
  float offset = outer_dia / 2.0;

  float rings = (a / PI) * asin(sin((PI / a) * (length(p) + t - offset))) - t;
  float rings_edge = circleDist(p, outer_dia / 2.0);
  float inner_rings_edge = -circleDist(p, (outer_dia / 2.0) - (ring_width * num_rings) - (ring_gap * (num_rings - 1.0)));
  rings = max(inner_rings_edge, max(rings, rings_edge));

  float line1 = roundBoxDist(p * rotateCCW(radians(angle)), vec2(line_length, line_width), 0.0, 0.0);
  float line2 = roundBoxDist(p * rotateCCW(radians(angle)), vec2(line_width, line_length), 0.0, 0.0);
  float lines = min(line1, line2);

  return min(rings, lines);
}

// signed distance to a n-star polygon with external angle en
float regularPolygonDist(in vec2 p, in float r, in int n) {
    // these 4 lines can be precomputed for a given shape
  float an = PI / float(n);
  vec2 acs = vec2(cos(an), sin(an));

    // reduce to first sector
  float bn = mod(atan(p.y, p.x), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));

    // line sdf
  p -= r * acs;
  p.y += clamp(-p.y, 0.0, r * acs.y);
  return length(p) * sign(p.x);
}

///////////////////////
// Masks for drawing //
///////////////////////

float fillMask(float dist) {
  return clamp(-dist, 0.0, 1.0);
}

float innerBorderMask(float dist, float width) {
	//dist += 1.0;
  float alpha1 = clamp(dist + width, 0.0, 1.0);
  float alpha2 = clamp(dist, 0.0, 1.0);
  return alpha1 - alpha2;
}

float outerBorderMask(float dist, float width) {
	//dist += 1.0;
  float alpha1 = clamp(dist, 0.0, 1.0);
  float alpha2 = clamp(dist - width, 0.0, 1.0);
  return alpha1 - alpha2;
}

#pragma glslify: pullSymbolParameter = require(./PullSymbolParameter.frag,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

float drawShape(vec2 FragCoord, float SymNum) {

  float t_Symbol = pullSymbolParameter(u_Parameters.symbol, SymNum);
  float t_Width = pullSymbolParameter(u_Parameters.width, SymNum);
  float t_Height = pullSymbolParameter(u_Parameters.height, SymNum);
  float t_Corner_Radius = pullSymbolParameter(u_Parameters.corner_radius, SymNum);
  float t_Corners = pullSymbolParameter(u_Parameters.corners, SymNum);
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, SymNum);
  float t_Inner_Dia = pullSymbolParameter(u_Parameters.inner_dia, SymNum);
  float t_Line_Width = pullSymbolParameter(u_Parameters.line_width, SymNum);
  float t_Line_Length = pullSymbolParameter(u_Parameters.line_length, SymNum);
  float t_Angle = pullSymbolParameter(u_Parameters.angle, SymNum);
  float t_Gap = pullSymbolParameter(u_Parameters.gap, SymNum);
  float t_Num_Spokes = pullSymbolParameter(u_Parameters.num_spokes, SymNum);
  float t_Round = pullSymbolParameter(u_Parameters.round, SymNum);
  // float t_Cut_Size = pullSymbolParameter(u_Parameters.cut_size);
  float t_Ring_Width = pullSymbolParameter(u_Parameters.ring_width, SymNum);
  float t_Ring_Gap = pullSymbolParameter(u_Parameters.ring_gap, SymNum);
  float t_Num_Rings = pullSymbolParameter(u_Parameters.num_rings, SymNum);

  float dist = 10.0;

  if (t_Symbol == u_Symbols.Round || t_Symbol == u_Symbols.Hole) {
    dist = circleDist(FragCoord.xy, t_Outer_Dia / 2.0);
    if (t_Inner_Dia != 0.0) {
      float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
      dist = max(dist, hole);
    }
  } else if (t_Symbol == u_Symbols.Square || t_Symbol == u_Symbols.Rectangle) {
    dist = boxDist(FragCoord.xy, vec2(t_Width, t_Height));
    if (t_Inner_Dia != 0.0) {
      float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
      dist = max(dist, hole);
    }
  } else if (t_Symbol == u_Symbols.Rounded_Rectangle) {
    dist = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    if (t_Inner_Dia != 0.0) {
      float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
      dist = max(dist, hole);
    }
  } else if (t_Symbol == u_Symbols.Oval) {
    dist = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
    if (t_Inner_Dia != 0.0) {
      float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
      dist = max(dist, hole);
    }
  } else if (t_Symbol == u_Symbols.Chamfered_Rectangle) {
    dist = chamferedBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    if (t_Inner_Dia != 0.0) {
      float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
      dist = max(dist, hole);
    }
  } else if (t_Symbol == u_Symbols.Diamond) {
    dist = diamonDist(FragCoord.xy, vec2(t_Width, t_Height));
    if (t_Inner_Dia != 0.0) {
      float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
      dist = max(dist, hole);
    }
  } else if (t_Symbol == u_Symbols.Octagon) {
    dist = chamferedBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, 15.0);
    if (t_Inner_Dia != 0.0) {
      float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
      dist = max(dist, hole);
    }
  } else if (t_Symbol == u_Symbols.Round_Donut) {
    float InnerCircle = circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    float OuterCircle = circleDist(FragCoord.xy, t_Outer_Dia / 2.0);
    dist = substract(InnerCircle, OuterCircle);
  } else if (t_Symbol == u_Symbols.Square_Donut) {
    float InnerSquare = boxDist(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia));
    float OuterSquare = boxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia));
    dist = substract(InnerSquare, OuterSquare);
  } else if (t_Symbol == u_Symbols.SquareRound_Donut) {
    float InnerCircle = circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    float OuterCircle = boxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia));
    dist = substract(InnerCircle, OuterCircle);
  } else if (t_Symbol == u_Symbols.Rounded_Square_Donut) {
    float InnerSquare = roundBoxDist(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia), t_Corner_Radius - (t_Outer_Dia - t_Inner_Dia) / 2.0, t_Corners);
    float OuterSquare = roundBoxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia), t_Corner_Radius, t_Corners);
    dist = substract(InnerSquare, OuterSquare);
  } else if (t_Symbol == u_Symbols.Rectangle_Donut) {
    float InnerRect = boxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0));
    float OuterRect = boxDist(FragCoord.xy, vec2(t_Width, t_Height));
    dist = substract(InnerRect, OuterRect);
  } else if (t_Symbol == u_Symbols.Rounded_Rectangle_Donut) {
    float OuterRect = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    float InnerRect = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), t_Corner_Radius - t_Line_Width, t_Corners);
    dist = substract(InnerRect, OuterRect);
  } else if (t_Symbol == u_Symbols.Oval_Donut) {
    float OuterOval = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
    float InnerOval = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), min(t_Height, t_Width) / 2.0 - t_Line_Width);
    dist = substract(InnerOval, OuterOval);
  } else if (t_Symbol == u_Symbols.Horizontal_Hexagon) {
    dist = horizHexagonDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius);
  } else if (t_Symbol == u_Symbols.Vertical_Hexagon) {
    dist = verticalHexagonDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius);
  } else if (t_Symbol == u_Symbols.Butterfly) {
    dist = butterflyDist(FragCoord.xy, t_Outer_Dia / 2.0);
  } else if (t_Symbol == u_Symbols.Square_Butterfly) {
    dist = squareButterflydist(FragCoord.xy, t_Width / 2.0);
  } else if (t_Symbol == u_Symbols.Triangle) {
    dist = triangleDist(FragCoord.xy, t_Width, t_Height);
  } else if (t_Symbol == u_Symbols.Half_Oval) {
    dist = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Height / 2.0, 9.0);
  } else if (t_Symbol == u_Symbols.Circle_Thermal) {
    dist = roundedBoxThermalDist(FragCoord.xy, t_Outer_Dia, t_Outer_Dia, t_Angle, t_Num_Spokes, t_Gap, (t_Outer_Dia - t_Inner_Dia)/2.0, t_Outer_Dia/2.0, 15.0, t_Round);
  } else if (t_Symbol == u_Symbols.Rectangle_Thermal) {
    dist = roundedBoxThermalDist(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width, t_Corner_Radius, t_Corners, t_Round);
  } else if (t_Symbol == u_Symbols.Rectangle_Thermal_Open_Corners) {
    dist = boxThermalOpenCornersDist(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
  } else if (t_Symbol == u_Symbols.Square_Circle_Thermal) {
    dist = sqaureRoundThermalDist(FragCoord.xy, vec2(t_Outer_Dia), t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Symbols.Constrained_Rectangle_Thermal) {
    dist = fixedAngleRoundedBoxThermalDist(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width, t_Corner_Radius, t_Corners, t_Round);
    } else if (t_Symbol == u_Symbols.MoireODB) {
    dist = moireODBDist(FragCoord.xy, t_Ring_Width, t_Ring_Gap, t_Num_Rings, t_Line_Width, t_Line_Length, t_Angle);
  } else if (t_Symbol == u_Symbols.MoireGerber) {
    dist = moireGerberDist(FragCoord.xy, t_Ring_Width, t_Ring_Gap, t_Num_Rings, t_Line_Width, t_Line_Length, t_Angle, t_Outer_Dia);
  } else if (t_Symbol == u_Symbols.Polygon) {
    dist = regularPolygonDist(FragCoord.xy * rotateCW(radians(t_Angle)), t_Outer_Dia / 2.0, int(t_Corners));
    if (t_Line_Width != 0.0) {
      float inner = -1.0 * regularPolygonDist(FragCoord.xy * rotateCW(radians(t_Angle)), (t_Outer_Dia / 2.0) - t_Line_Width, int(t_Corners));
      dist = max(dist, inner);
    }
    if (t_Inner_Dia != 0.0) {
      float hole = -1.0 * circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
      dist = max(dist, hole);
    }
  } else {
    // u_Symbols.Null
    dist = SDF_FAR_AWAY;
  }
  return dist;
}

#pragma glslify: export(drawShape)
