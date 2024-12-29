precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

//////////////////////////////////////
// Combine distance field functions //
//////////////////////////////////////

float merge(float d1, float d2) {
  return min(d1, d2);
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

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
}

vec3 circleSDG(in vec2 p, in float r)
{
    float d = length(p);
    return vec3( d-r, p/d );
}

// float lineDist(vec2 p, vec2 start, vec2 end, float width) {
//   vec2 dir = start - end;
//   float lngth = length(dir);
//   dir /= lngth;
//   vec2 proj = max(0.0, min(lngth, dot((start - p), dir))) * dir;
//   return length((start - p) - proj) - (width / 2.0);
// }

float boxDist(vec2 p, vec2 size) {
  size /= 2.0;
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec3 boxSDG( in vec2 p, in vec2 size ) {
  size /= 2.0;
  vec2 w = abs(p) - size;
  vec2 s = vec2(p.x < 0.0 ? -1 : 1, p.y < 0.0 ? -1 : 1);
  float g = max(w.x, w.y);
  vec2  q = max(w, 0.0);
  float l = length(q);
  return vec3((g > 0.0) ? l : g, s * ((g > 0.0) ? q / l : ((w.x > w.y) ? vec2(1, 0) : vec2(0, 1))));
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

// Round Box with rounded all corners
vec3 roundBoxSDG(vec2 p, vec2 size, float radius) {
  size -= (radius * 2.0);
  vec3 dis_gra = boxSDG(p, size);
  return vec3( dis_gra.x - radius, dis_gra.yz );
}

// Round box with vec4 of rounded corners
float roundBoxDist(vec2 p, vec2 size, vec4 corners) {
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  vec2 q = abs(p) - size + corners.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - corners.x;
}

// Round box with vec4 of rounded corners
vec3 roundBoxSDG(vec2 p, vec2 size, vec4 corners) {
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  // vec2 q = abs(p) - size + corners.x;
  // return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - corners.x;
  vec3 dis_gra = boxSDG(p, size - (corners.x * 2.0));
  return vec3( dis_gra.x - corners.x, dis_gra.yz );
}

// Round box with uniform corner radius and float of corners rounded, see roundedCornersVector
float roundBoxDist(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return roundBoxDist(p, size, r);
}

// Round box with uniform corner radius and float of corners rounded, see roundedCornersVector
vec3 roundBoxSDG(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return roundBoxSDG(p, size, r);
}

// Chamfered box with vec4 of chamfered corners
float chamferedBoxDist(vec2 p, vec2 size, vec4 corners) {
  float distb = boxDist(p ,size);
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  float dista = (abs(p.x) + abs(p.y) - (size.x + size.y) + corners.x) / sqrt(2.0);
  // vec2 d = abs(p) - size;
  return intersect(distb, dista);
}

vec3 segmentSDF( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 ba = b-a;
    vec2 pa = p-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    vec2  q = pa-h*ba;
    float d = length(q);

    //https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line
    //Given a line a--b and point c
    //(b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x) > 0;
    float side = (b.x - a.x)*(p.y - a.y) - (b.y - a.y)*(p.x - a.x);

    return vec3(d*sign(side),q/d*sign(side));
}

vec3 mergeSDG( in vec3 fill, in vec3 remove) {
  if (fill.x > remove.x) {
    return fill;
  }
  return remove;
}

// Chamfered box with vec4 of chamfered corners
vec3 chamferedBoxSDG(vec2 p, vec2 size, vec4 corners) {
  // float dist = chamferedBoxDist(p, size, corners);
  // const float eps = 0.001;
  // vec2 grad = normalize(vec2(
  //     (chamferedBoxDist(p+vec2(1,0)*eps, size, corners)-chamferedBoxDist(p+vec2(-1,0)*eps, size, corners)),
  //     (chamferedBoxDist(p+vec2(0,1)*eps, size, corners)-chamferedBoxDist(p+vec2( 0,-1)*eps, size, corners))
  // ));
  // return vec3(dist, grad);

  vec3 box = boxSDG(p, size);
  size /= 2.0;
  corners.xy = (p.y > 0.0) ? corners.xy : corners.wz;
  corners.x = (p.x > 0.0) ? corners.x : corners.y;
  vec3 chamfer = segmentSDF(abs(p), size - vec2(corners.x, 0.0), size - vec2(0.0, corners.x));
  if (box.x > chamfer.x) {
    return box;
  } else {
    if (abs(p.x) < size.x - corners.x && chamfer.x >= 0.0) {
      return box;
    }
    if (abs(p.y) < size.y - corners.x && chamfer.x >= 0.0) {
      return box;
    }
    return chamfer * vec3(1.0, sign(p.x), sign(p.y));
  }
}

// Chamfered box with uniform corner radius and float of corners rounded, see roundedCornersVector
float chamferedBoxDist(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return chamferedBoxDist(p, size, r);
}

// Chamfered box with uniform corner radius and float of corners rounded, see roundedCornersVector
vec3 chamferedBoxSDG(vec2 p, vec2 size, float radius, float corners) {
  vec4 r = radius * roundedCornersVector(corners);
  return chamferedBoxSDG(p, size, r);
}

float spokeDist(vec2 p, float angle, float num_spokes, float gap) {

  float r_angle = radians(angle);
  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_spokes) * atan(tan((num_spokes / 2.0) * n_angle));

  float leng = length(p);

  float da = (leng * sin(n_angle) + gap / 2.0);
  float db = (-leng * sin(n_angle) + gap / 2.0);
  float spokes = min(da, db);
  if (num_spokes == 1.0) {
    p = rotateCW(r_angle) * p;
    spokes = min(spokes, p.x);
  }

  return spokes;
}

float roundedRoundThermalDist(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  // radius
  float radius = (od / 2.0 + id / 2.0) / 2.0;

  // line width
  float lw = (od / 2.0 - id / 2.0) / 2.0;

  // correct rotation
  angle += (90.0) / num_of_spokes;

  float n = num_of_spokes * 2.0;
  float r_angle = radians(angle);
  float r = length(p);

  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / n) * atan(tan((n / 2.0) * n_angle));
  vec2 s = vec2(r * cos(n_angle), r * sin(n_angle));

  // find angle of offset from chord length (gap)
  gap += 2.0 * lw;
  float angle_of_gap = degrees(asin(gap / (2.0 * radius)));
  float offset = radians(angle_of_gap) - radians(180.0) / n;

  vec2 sincos2 = vec2(sin(radians(90.0) - offset), cos(radians(90.0) - offset));

  return (n_angle < offset ? length(s - sincos2 * radius) : abs(length(s) - radius)) - lw;
  // return length(s - sincos2 * radius) - lw; // round ends
  // return abs(length(s) - radius) - lw; // outer circle
}

vec3 roundedRoundThermalSDG(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float dist = roundedRoundThermalDist(p, od, id, angle, num_of_spokes, gap);
  const float eps = 0.001;
  vec2 grad = normalize(vec2(
      (roundedRoundThermalDist(p + vec2(1, 0) * eps, od, id, angle, num_of_spokes, gap) - roundedRoundThermalDist(p + vec2(-1, 0) * eps, od, id, angle, num_of_spokes, gap)),
      (roundedRoundThermalDist(p + vec2(0, 1) * eps, od, id, angle, num_of_spokes, gap) - roundedRoundThermalDist(p + vec2(0, -1) * eps, od, id, angle, num_of_spokes, gap))
  ));
  return vec3(dist, grad);
}

// float thermalDistOrig(vec2 p, float radius) {
//   float id = radius * 0.8;
//   float outercircle = circleDist(p, radius);
//   float innercircle = circleDist(p, id);
//   float d = substract(innercircle, outercircle);
//   float therm = max(d, spokeDist(p, 45.0, 3.0, radius / 4.0));

//   return therm;
// }

float roundThermalDist(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float outercircle = circleDist(p, od / 2.0);
  float innercircle = circleDist(p, id / 2.0);
  float d = substract(innercircle, outercircle);
  float therm = max(d, spokeDist(p, angle, num_of_spokes, gap));
  return therm;
}

float roundThermalExactDist(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float outercircle = circleDist(p, od / 2.0);
  float innercircle = circleDist(p, id / 2.0);
  float d = substract(innercircle, outercircle);

  float r_angle = radians(angle);
  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * n_angle));

  float leng = length(p);

  // p1, p2 are the x, y coordinates of the point p rotated by the angle of the spoke in relation to the quantity of spokes
  float p1 = (leng * sin(n_angle));
  float p2 = (leng * cos(n_angle));

  float ir = id / 2.0;
  float or = od / 2.0;
  float offset_od = or - or * (cos(asin((gap * 0.5) / or)));
  float offset_id = ir - ir * (cos(asin((gap * 0.5) / ir)));

  vec2 sc = vec2(sin(gap/2.0), cos(gap/2.0));
  float corner1 = length(vec2(p1, p2) - vec2(gap/2.0, ((id * 0.5) - offset_id)));
  float corner2 = length(vec2(p1, p2) - vec2(-gap/2.0, ((id * 0.5) - offset_id)));
  float corner3 = length(vec2(p1, p2) - vec2(gap/2.0, ((od * 0.5) - offset_od)));
  float corner4 = length(vec2(p1, p2) - vec2(-gap/2.0, ((od * 0.5) - offset_od)));
  float corners = min(min(corner1, corner2), min(corner3, corner4));


  float da = (leng * sin(n_angle) + gap / 2.0);
  float db = (-leng * sin(n_angle) + gap / 2.0);
  float spokes = min(da, db);
  if (num_of_spokes == 1.0) {
    p = rotateCW(r_angle) * p;
    spokes = min(spokes, p.x);
  }


  if (length(abs(p2)) + offset_od >= or) {
    if (atan(abs(p2), abs(p1)) < asin((gap * 0.5) / or)) {
      return corners;
    }
    if (atan(abs(p1), abs(p2)) < asin((gap * 0.5) / or)) {
      return corners;
    }
  }
  if (length(abs(p2)) + offset_id <= ir) {
    if (atan(abs(p2), abs(p1)) < asin((gap * 0.5) / ir)) {
      return corners;
    }
    if (atan(abs(p1), abs(p2)) < asin((gap * 0.5) / ir)) {
      return corners;
    }
  }

  float a = max(d, spokes);
  return a;

}

vec3 roundThermalSDG(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float dist = roundThermalExactDist(p, od, id, angle, num_of_spokes, gap);
  const float eps = 0.001;
  vec2 grad = normalize(vec2(
      (roundThermalExactDist(p + vec2(1, 0) * eps, od, id, angle, num_of_spokes, gap) - roundThermalExactDist(p + vec2(-1, 0) * eps, od, id, angle, num_of_spokes, gap)),
      (roundThermalExactDist(p + vec2(0, 1) * eps, od, id, angle, num_of_spokes, gap) - roundThermalExactDist(p + vec2(0, -1) * eps, od, id, angle, num_of_spokes, gap))
  ));
  return vec3(dist, grad);
}

float squareThermalDist(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float outersquare = boxDist(p, vec2(od, od));
  float innersquare = boxDist(p, vec2(id, id));
  float d = substract(innersquare, outersquare);
  float therm = max(d, spokeDist(p, angle, num_of_spokes, gap));
  return therm;
}

float segmentDist( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 ba = b-a;
    vec2 pa = p-a;
    float h =clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length(pa-h*ba);
}

float squareThermalExactDist(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {

  float min_id = gap/(tan(radians(180.0/num_of_spokes)));
  id = max(id, min_id);
  float outersquare = boxDist(p, vec2(od, od));
  float innersquare = boxDist(p, vec2(id, id));
  float d = substract(innersquare, outersquare);

  float r_angle = radians(angle);

  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * n_angle));
  // return n_angle;

  float near_spoke_angle = atan(p.y, p.x) - n_angle;
  // nomalize angle
  near_spoke_angle = atan(sin(near_spoke_angle), cos(near_spoke_angle));

  float offset_x = (gap / 2.0) * cos(near_spoke_angle + PI/2.0);
  float offset_y = (gap / 2.0) * sin(near_spoke_angle + PI/2.0);

  float outer_square_width = od / 2.0;
  float outer_square_height = od / 2.0;

  float x_side = near_spoke_angle >= -PI/2.0 && near_spoke_angle <= PI/2.0 ? 1.0 : -1.0;
  float y_side = near_spoke_angle >= 0.0 ? 1.0 : -1.0;

  float offset_outer_square_edge_a = min((x_side * outer_square_width + offset_x)/cos(near_spoke_angle), (y_side * outer_square_height + offset_y)/sin(near_spoke_angle));
  float offset_outer_square_edge_b = min((x_side * outer_square_width - offset_x)/cos(near_spoke_angle), (y_side * outer_square_height - offset_y)/sin(near_spoke_angle));

  float inner_square_width = id / 2.0;
  float inner_square_height = id / 2.0;

  float offset_inner_square_edge_a = min((x_side * inner_square_width + offset_x)/cos(near_spoke_angle), (y_side * inner_square_height + offset_y)/sin(near_spoke_angle));
  float offset_inner_square_edge_b = min((x_side * inner_square_width - offset_x)/cos(near_spoke_angle), (y_side * inner_square_height - offset_y)/sin(near_spoke_angle));


  float ir = id / 2.0;
  float or = od / 2.0;
  float offset_od = or - or * (cos(asin((gap * 0.5) / or)));
  float offset_id = ir - ir * (cos(asin((gap * 0.5) / ir)));

  // distance from angle to edge of square
  float point_angle = 0.0;
  float r_od = min(1.0/abs(cos(point_angle)*od), 1.0/abs(sin(point_angle))*od);
  float r_id = min(1.0/abs(cos(point_angle)*id), 1.0/abs(sin(point_angle))*id);

  vec2 sc = vec2(sin(gap/2.0), cos(gap/2.0));

  vec2 a1 = vec2(gap/2.0, (offset_outer_square_edge_b));
  vec2 a2 = vec2(gap/2.0, (offset_inner_square_edge_b));
  vec2 b1 = vec2(-gap/2.0, (offset_outer_square_edge_a));
  vec2 b2 = vec2(-gap/2.0, (offset_inner_square_edge_a));

  float leng = length(p);
  // p1, p2 are the x, y coordinates of the point p rotated by the angle of the spoke in relation to the quantity of spokes
  float p1 = (leng * sin(n_angle));
  float p2 = (leng * cos(n_angle));
  vec2 ap = vec2(p1, p2);

  float side1 = segmentDist(ap, a1, a2);
  float side2 = segmentDist(ap, b1, b2);
  float side = min(side1, side2);

  float da = (leng * sin(n_angle) + gap / 2.0);
  float db = (-leng * sin(n_angle) + gap / 2.0);
  float spokes = min(da, db);

  if (num_of_spokes == 1.0) {
    vec2 p1 = rotateCW(r_angle) * p;
    spokes = min(spokes, p1.x);
  }
  if (d <= 0.0){
    if (spokes >= 0.0) {
      return side;
    }
    return max(d, -side);
  }

  if (outersquare > 0.0) {
    vec2 p_outside = vec2(min(abs(p.x), od / 2.0) * sign(p.x), min(abs(p.y), od / 2.0) * sign(p.y));
    float near_outside_angle = atan(p_outside.y, p_outside.x) - r_angle;
    near_outside_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * near_outside_angle));
    float leng_outer = length(p_outside);
    float dist_outer_gapa = (leng_outer * sin(near_outside_angle) + gap / 2.0);
    float dist_outer_gapb = (-leng_outer * sin(near_outside_angle) + gap / 2.0);
    float dist_outer_gap = min(dist_outer_gapa, dist_outer_gapb);
    if (num_of_spokes == 1.0) {
      vec2 p1_outer = rotateCW(r_angle) * p_outside;
      dist_outer_gap = min(dist_outer_gap, p1_outer.x);
    }
    if (dist_outer_gap >= 0.0) {
      return side;
    }
  }

  vec2 p_inside = p;
  if (abs(abs(p.x) - id/2.0) > abs(abs(p.y) - id/2.0)) {
    p_inside = vec2(p.x, id/2.0 * sign(p.y));
  } else {
    p_inside = vec2(id/2.0 * sign(p.x), p.y);
  }
  if (innersquare < 0.0){
    float near_inside_angle = atan(p_inside.y, p_inside.x) - r_angle;
    near_inside_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * near_inside_angle));
    float leng_inner = length(p_inside);
    float dist_inner_gapa = (leng_inner * sin(near_inside_angle) + gap / 2.0);
    float dist_inner_gapb = (-leng_inner * sin(near_inside_angle) + gap / 2.0);
    float dist_inner_gap= min(dist_inner_gapa, dist_inner_gapb);
    if (num_of_spokes == 1.0) {
      vec2 p1_inner = rotateCW(r_angle) * p_inside;
      dist_inner_gap = min(dist_inner_gap, p1_inner.x);
    }
    if (dist_inner_gap >= 0.0) {
      return side;
    }
  }



  float a = max(d, spokes);
  return d;

}

vec3 squareThermalSDG(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float dist = squareThermalExactDist(p, od, id, angle, num_of_spokes, gap);
  const float eps = 0.001;
  vec2 grad = normalize(vec2(
      (squareThermalExactDist(p + vec2(1, 0) * eps, od, id, angle, num_of_spokes, gap) - squareThermalExactDist(p + vec2(-1, 0) * eps, od, id, angle, num_of_spokes, gap)),
      (squareThermalExactDist(p + vec2(0, 1) * eps, od, id, angle, num_of_spokes, gap) - squareThermalExactDist(p + vec2(0, -1) * eps, od, id, angle, num_of_spokes, gap))
  ));
  return vec3(dist, grad);
}



float boxThermalExactDist(in vec2 p_square, in vec2 p_spoke, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width) {

  vec2 p_diff = p_square - p_spoke;

  float outersquare = boxDist(p_square, vec2(width, height));
  float innersquare = boxDist(p_square, vec2(width - line_width * 2.0, height - line_width * 2.0));
  float d = substract(innersquare, outersquare);

  float r_angle = radians(angle);

  float n_angle = atan(p_square.y, p_square.x) - r_angle;
  n_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * n_angle));
  // return n_angle;

  float near_spoke_angle = atan(p_square.y, p_square.x) - n_angle;
  // nomalize angle
  near_spoke_angle = atan(sin(near_spoke_angle), cos(near_spoke_angle));

  float offset_x = (gap / 2.0) * cos(near_spoke_angle + PI/2.0);
  float offset_y = (gap / 2.0) * sin(near_spoke_angle + PI/2.0);

  float outer_square_width = width / 2.0;
  float outer_square_height = height / 2.0;

  float x_side = near_spoke_angle >= -PI/2.0 && near_spoke_angle <= PI/2.0 ? 1.0 : -1.0;
  float y_side = near_spoke_angle >= 0.0 ? 1.0 : -1.0;

  float offset_outer_square_edge_a = min((x_side * outer_square_width + offset_x - p_diff.x)/cos(near_spoke_angle), (y_side * outer_square_height + offset_y - p_diff.y)/sin(near_spoke_angle));
  float offset_outer_square_edge_b = min((x_side * outer_square_width - offset_x - p_diff.x)/cos(near_spoke_angle), (y_side * outer_square_height - offset_y - p_diff.y)/sin(near_spoke_angle));

  float inner_square_width = (width - line_width * 2.0) / 2.0;
  float inner_square_height = (height - line_width * 2.0) / 2.0;

  float offset_inner_square_edge_a = min((x_side * inner_square_width + offset_x - p_diff.x)/cos(near_spoke_angle), (y_side * inner_square_height + offset_y - p_diff.y)/sin(near_spoke_angle));
  float offset_inner_square_edge_b = min((x_side * inner_square_width - offset_x - p_diff.x)/cos(near_spoke_angle), (y_side * inner_square_height - offset_y - p_diff.y)/sin(near_spoke_angle));


  vec2 a1 = vec2(gap/2.0, (offset_outer_square_edge_b));
  vec2 a2 = vec2(gap/2.0, (offset_inner_square_edge_b));
  vec2 b1 = vec2(-gap/2.0, (offset_outer_square_edge_a));
  vec2 b2 = vec2(-gap/2.0, (offset_inner_square_edge_a));

  float leng = length(p_square);
  // p1, p2 are the x, y coordinates of the point p rotated by the angle of the spoke in relation to the quantity of spokes
  float p1 = (leng * sin(n_angle));
  float p2 = (leng * cos(n_angle));
  vec2 ap = vec2(p1, p2);

  float side1 = segmentDist(ap, a1, a2);
  float side2 = segmentDist(ap, b1, b2);
  float side = min(side1, side2);

  float da = (leng * sin(n_angle) + gap / 2.0);
  float db = (-leng * sin(n_angle) + gap / 2.0);
  float spokes = min(da, db);


  if (num_of_spokes == 1.0) {
    vec2 p1 = rotateCW(r_angle) * p_square;
    spokes = min(spokes, p1.x);
  }
  if (d <= 0.0){
    if (spokes >= 0.0) {
      return side;
    }
    return max(d, -side);
  }



  if (outersquare > 0.0) {
    vec2 p_outside = vec2(min(abs(p_spoke.x), width / 2.0 - abs(p_diff.x)) * sign(p_spoke.x), min(abs(p_spoke.y), height / 2.0 - abs(p_diff.y)) * sign(p_spoke.y));
    // p_outside = p_outside + p_diff;
    float near_outside_angle = atan(p_outside.y, p_outside.x) - r_angle;
    near_outside_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * near_outside_angle));
    float leng_outer = length(p_outside);
    float dist_outer_gapa = (leng_outer * sin(near_outside_angle) + gap / 2.0);
    float dist_outer_gapb = (-leng_outer * sin(near_outside_angle) + gap / 2.0);
    float dist_outer_gap = min(dist_outer_gapa, dist_outer_gapb);
    if (num_of_spokes == 1.0) {
      vec2 p1_outer = rotateCW(r_angle) * p_outside;
      dist_outer_gap = min(dist_outer_gap, p1_outer.x);
    }
    if (dist_outer_gap >= 0.0) {
      return side;
    }
  }

  vec2 p_inside = p_spoke;
  if (abs(abs(p_spoke.x) - inner_square_width) - abs(p_diff.x) > abs(abs(p_spoke.y) - inner_square_height) - abs(p_diff.y)) {
    p_inside = vec2(p_spoke.x, inner_square_height * sign(p_spoke.y) - p_diff.y);
  } else {
    p_inside = vec2(inner_square_width * sign(p_spoke.x) - p_diff.x, p_spoke.y);
  }
  if (innersquare < 0.0){
    float near_inside_angle = atan(p_inside.y, p_inside.x) - r_angle;
    near_inside_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * near_inside_angle));
    float leng_inner = length(p_inside);
    float dist_inner_gapa = (leng_inner * sin(near_inside_angle) + gap / 2.0);
    float dist_inner_gapb = (-leng_inner * sin(near_inside_angle) + gap / 2.0);
    float dist_inner_gap= min(dist_inner_gapa, dist_inner_gapb);
    if (num_of_spokes == 1.0) {
      vec2 p1_inner = rotateCW(r_angle) * p_inside;
      dist_inner_gap = min(dist_inner_gap, p1_inner.x);
    }
    if (dist_inner_gap >= 0.0) {
      return side;
    }
  }



  float a = max(d, spokes);
  return d;
}

float boxThermalDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width) {
  float outerbox = boxDist(p, vec2(width, height));
  float innerbox = boxDist(p, vec2(width - line_width * 2.0, height - line_width * 2.0));
  float d = substract(innerbox, outerbox);
  if (mod(angle, 90.0) == 0.0) {
    // d = max(d, spokeDist(p, angle, num_of_spokes, gap));
    // return d;
    d = boxThermalExactDist(p, p, width, height, angle, num_of_spokes, gap, line_width);
    return d;
  }
  if (mod(angle, 45.0) == 0.0) {
    vec2 offset = vec2(max(0.0, width - height) / 2.0, max(0.0, height - width) / 2.0);
    offset.x = p.x > 0.0 ? offset.x : -offset.x;
    offset.y = p.y > 0.0 ? offset.y : -offset.y;
    if (width > height && abs(offset.x) < abs(p.x)) {
      // d = max(d, spokeDist(translate(p, offset), angle, num_of_spokes, gap));
      d = boxThermalExactDist(p, translate(p, offset), width, height, angle, num_of_spokes, gap, line_width);
    }
    if (height > width && abs(offset.y) < abs(p.y)) {
      // d = max(d, spokeDist(translate(p, offset), angle, num_of_spokes, gap));
      d = boxThermalExactDist(p, translate(p, offset), width, height, angle, num_of_spokes, gap, line_width);
    }
  }
  return d;
}

vec3 boxThermalSDG(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width) {
  float dist = boxThermalDist(p, width, height, angle, num_of_spokes, gap, line_width);
  const float eps = 0.001;
  vec2 grad = normalize(vec2(
      (boxThermalDist(p + vec2(1, 0) * eps, width, height, angle, num_of_spokes, gap, line_width) - boxThermalDist(p + vec2(-1, 0) * eps, width, height, angle, num_of_spokes, gap, line_width)),
      (boxThermalDist(p + vec2(0, 1) * eps, width, height, angle, num_of_spokes, gap, line_width) - boxThermalDist(p + vec2(0, -1) * eps, width, height, angle, num_of_spokes, gap, line_width))
  ));
  return vec3(dist, grad);
  // return vec3(dist, vec2(0.0));
}

float boxThermalOpenCornersExactDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width) {

  float outersquare = boxDist(p, vec2(width, height));
  float innersquare = boxDist(p, vec2(width - line_width * 2.0, height - line_width * 2.0));
  float d = substract(innersquare, outersquare);

  float r_angle = radians(angle);

  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * n_angle));

  float near_spoke_angle = atan(p.y, p.x) - n_angle;
  // nomalize angle
  near_spoke_angle = atan(sin(near_spoke_angle), cos(near_spoke_angle));

  float offset_x = (gap / 2.0) * cos(near_spoke_angle + PI/2.0);
  float offset_y = (gap / 2.0) * sin(near_spoke_angle + PI/2.0);

  float outer_square_width = width / 2.0;
  float outer_square_height = height / 2.0;

  float x_side = near_spoke_angle >= -PI/2.0 && near_spoke_angle <= PI/2.0 ? 1.0 : -1.0;
  float y_side = near_spoke_angle >= 0.0 ? 1.0 : -1.0;

  float offset_outer_square_edge_a = min((x_side * outer_square_width + offset_x)/cos(near_spoke_angle), (y_side * outer_square_height + offset_y)/sin(near_spoke_angle));
  float offset_outer_square_edge_b = min((x_side * outer_square_width - offset_x)/cos(near_spoke_angle), (y_side * outer_square_height - offset_y)/sin(near_spoke_angle));

  float inner_square_width = (width - line_width * 2.0) / 2.0;
  float inner_square_height = (height - line_width * 2.0) / 2.0;

  float offset_inner_square_edge_a = min((x_side * inner_square_width + offset_x)/cos(near_spoke_angle), (y_side * inner_square_height + offset_y)/sin(near_spoke_angle));
  float offset_inner_square_edge_b = min((x_side * inner_square_width - offset_x)/cos(near_spoke_angle), (y_side * inner_square_height - offset_y)/sin(near_spoke_angle));


  vec2 a1 = vec2(gap/2.0 + min(abs(sin(near_spoke_angle)), abs(cos(near_spoke_angle))) * line_width, (offset_inner_square_edge_b) + max(abs(sin(near_spoke_angle)), abs(cos(near_spoke_angle))) * line_width);
  vec2 a2 = vec2(gap/2.0, (offset_inner_square_edge_b));
  vec2 b1 = vec2(-gap/2.0 - min(abs(sin(near_spoke_angle)), abs(cos(near_spoke_angle))) * line_width, (offset_inner_square_edge_a) + max(abs(sin(near_spoke_angle)), abs(cos(near_spoke_angle))) * line_width);
  vec2 b2 = vec2(-gap/2.0, (offset_inner_square_edge_a));

  float leng = length(p);
  // p1, p2 are the x, y coordinates of the point p rotated by the angle of the spoke in relation to the quantity of spokes
  float p1 = (leng * sin(n_angle));
  float p2 = (leng * cos(n_angle));
  vec2 ap = vec2(p1, p2);

  float side1 = segmentDist(ap, a1, a2);
  float side2 = segmentDist(ap, b1, b2);
  float side = min(side1, side2);

  vec2 p_inside = vec2(min(abs(p.x), inner_square_width) * sign(p.x), min(abs(p.y), inner_square_height) * sign(p.y));
  if (innersquare < 0.0) {
    if (abs(abs(p.x) - inner_square_width) > abs(abs(p.y) - inner_square_height)) {
      p_inside = vec2(p.x, inner_square_height * sign(p.y));
    } else {
      p_inside = vec2(inner_square_width * sign(p.x), p.y);
    }
  }
  float near_inside_angle = atan(p_inside.y, p_inside.x) - r_angle;
  near_inside_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * near_inside_angle));
  float leng_inner = length(p_inside);
  float dist_inner_gapa = (leng_inner * sin(near_inside_angle) + gap / 2.0);
  float dist_inner_gapb = (-leng_inner * sin(near_inside_angle) + gap / 2.0);
  float dist_inner_gap = min(dist_inner_gapa, dist_inner_gapb);
  if (num_of_spokes == 1.0) {
    vec2 p1_inner = rotateCW(r_angle) * p_inside;
    dist_inner_gap = min(dist_inner_gap, p1_inner.x);
  }
  if (dist_inner_gap >= 0.0) {
    return side;
  } else {
    if (d <= 0.0){
      return max(d, -side);
    }
  }
  return d;

}

float boxThermalOpenCornersDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width) {

  // if angle is a multiple of 90 degrees,
  if (mod(angle, 90.0) == 0.0) {
    return boxThermalExactDist(p, p, width, height, angle, num_of_spokes, gap, line_width);
  }

  // if angle is a multiple of 45 degrees, draw 4 rects
  if (mod(angle, 45.0) == 0.0) {
    return boxThermalOpenCornersExactDist(p, width, height, angle, num_of_spokes, gap, line_width);
    // vec4 corners = openCorners(angle, num_of_spokes);

    // float topWidth = width - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.y * (gap * sin(radians(45.0)) + line_width));
    // float botWidth = width - (corners.z * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
    // vec2 topLocation = vec2(corners.y * (width / 2.0 - topWidth / 2.0) - corners.x * (width / 2.0 - topWidth / 2.0), height / 2.0 - line_width / 2.0);
    // vec2 botLocation = vec2(corners.z * (width / 2.0 - botWidth / 2.0) - corners.w * (width / 2.0 - botWidth / 2.0), -height / 2.0 + line_width / 2.0);

    // float topBox = boxDist(translate(p, topLocation), vec2(topWidth, line_width));
    // float botBox = boxDist(translate(p, botLocation), vec2(botWidth, line_width));

    // float leftHeight = height - (corners.y * (gap * sin(radians(45.0)) + line_width)) - (corners.z * (gap * sin(radians(45.0)) + line_width));
    // float rightHeight = height - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
    // vec2 leftLocation = vec2(-width / 2.0 + line_width / 2.0, corners.z * (height / 2.0 - leftHeight / 2.0) - corners.y * (height / 2.0 - leftHeight / 2.0));
    // vec2 rightLocation = vec2(width / 2.0 - line_width / 2.0, corners.w * (height / 2.0 - rightHeight / 2.0) - corners.x * (height / 2.0 - rightHeight / 2.0));

    // float leftBox = boxDist(translate(p, leftLocation), vec2(line_width, leftHeight));
    // float rightBox = boxDist(translate(p, rightLocation), vec2(line_width, rightHeight));

    // float tb = merge(topBox, botBox);
    // float lr = merge(leftBox, rightBox);
    // return merge(lr, tb);
  }

  return 0.0;
}

vec3 boxThermalOpenCornersSDG(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width) {
  float dist = boxThermalOpenCornersExactDist(p, width, height, angle, num_of_spokes, gap, line_width);
  const float eps = 0.001;
  vec2 grad = normalize(vec2(
      (boxThermalOpenCornersExactDist(p + vec2(1, 0) * eps, width, height, angle, num_of_spokes, gap, line_width) - boxThermalOpenCornersExactDist(p + vec2(-1, 0) * eps, width, height, angle, num_of_spokes, gap, line_width)),
      (boxThermalOpenCornersExactDist(p + vec2(0, 1) * eps, width, height, angle, num_of_spokes, gap, line_width) - boxThermalOpenCornersExactDist(p + vec2(0, -1) * eps, width, height, angle, num_of_spokes, gap, line_width))
  ));
  return vec3(dist, grad);
  // return vec3(dist, vec2(0.0));
}

float lineThermalDist(in vec2 p, in float outerDia, in float innerDia, in float angle, in float num_of_spokes, in float gap) {

  float width = outerDia;
  float height = outerDia;

  // https://odbplusplus.com/wp-content/uploads/sites/2/2021/02/odb_spec_user.pdf
  // angle is always 45 degrees
  // num of spokes is always 4
  float line_width = (outerDia - innerDia) / 2.0;

  // if angle is a multiple of 45 degrees, draw 4 rects
  vec4 corners = openCorners(angle, num_of_spokes);
  float topWidth = width - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.y * (gap * sin(radians(45.0)) + line_width));
  float botWidth = width - (corners.z * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
  vec2 topLocation = vec2(corners.y * (width / 2.0 - topWidth / 2.0) - corners.x * (width / 2.0 - topWidth / 2.0), height / 2.0 - line_width / 2.0);
  vec2 botLocation = vec2(corners.z * (width / 2.0 - botWidth / 2.0) - corners.w * (width / 2.0 - botWidth / 2.0), -height / 2.0 + line_width / 2.0);
  float topLine = roundBoxDist(translate(p, topLocation), vec2(topWidth, line_width), line_width / 2.0);
  float botLine = roundBoxDist(translate(p, botLocation), vec2(botWidth, line_width), line_width / 2.0);

  float leftHeight = height - (corners.y * (gap * sin(radians(45.0)) + line_width)) - (corners.z * (gap * sin(radians(45.0)) + line_width));
  float rightHeight = height - (corners.x * (gap * sin(radians(45.0)) + line_width)) - (corners.w * (gap * sin(radians(45.0)) + line_width));
  vec2 leftLocation = vec2(-width / 2.0 + line_width / 2.0, corners.z * (height / 2.0 - leftHeight / 2.0) - corners.y * (width / 2.0 - leftHeight / 2.0));
  vec2 rightLocation = vec2(width / 2.0 - line_width / 2.0, corners.w * (height / 2.0 - rightHeight / 2.0) - corners.x * (width / 2.0 - rightHeight / 2.0));
  float leftLine = roundBoxDist(translate(p, leftLocation), vec2(line_width, leftHeight), line_width / 2.0);
  float rightLine = roundBoxDist(translate(p, rightLocation), vec2(line_width, rightHeight), line_width / 2.0);

  float tb = merge(topLine, botLine);
  float lr = merge(leftLine, rightLine);
  return merge(lr, tb);
}

vec3 lineThermalSDG(in vec2 p, in float outerDia, in float innerDia, in float angle, in float num_of_spokes, in float gap) {
  float dist = lineThermalDist(p, outerDia, innerDia, angle, num_of_spokes, gap);
  const float eps = 0.001;
  vec2 grad = normalize(vec2(
      (lineThermalDist(p + vec2(1, 0) * eps, outerDia, innerDia, angle, num_of_spokes, gap) - lineThermalDist(p + vec2(-1, 0) * eps, outerDia, innerDia, angle, num_of_spokes, gap)),
      (lineThermalDist(p + vec2(0, 1) * eps, outerDia, innerDia, angle, num_of_spokes, gap) - lineThermalDist(p + vec2(0, -1) * eps, outerDia, innerDia, angle, num_of_spokes, gap))
  ));
  return vec3(dist, grad);
}

float sqaureRoundThermalDist(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float outersquare = boxDist(p, vec2(od, od));
  float innercircle = circleDist(p, id / 2.0);
  float d = substract(innercircle, outersquare);

  float r_angle = radians(angle);

  float n_angle = atan(p.y, p.x) - r_angle;
  n_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * n_angle));
  // return n_angle;

  float near_spoke_angle = atan(p.y, p.x) - n_angle;
  // nomalize angle
  near_spoke_angle = atan(sin(near_spoke_angle), cos(near_spoke_angle));

  float offset_x = (gap / 2.0) * cos(near_spoke_angle + PI/2.0);
  float offset_y = (gap / 2.0) * sin(near_spoke_angle + PI/2.0);

  float outer_square_width = od / 2.0;
  float outer_square_height = od / 2.0;

  float x_side = near_spoke_angle >= -PI/2.0 && near_spoke_angle <= PI/2.0 ? 1.0 : -1.0;
  float y_side = near_spoke_angle >= 0.0 ? 1.0 : -1.0;

  float offset_outer_square_edge_a = min((x_side * outer_square_width + offset_x)/cos(near_spoke_angle), (y_side * outer_square_height + offset_y)/sin(near_spoke_angle));
  float offset_outer_square_edge_b = min((x_side * outer_square_width - offset_x)/cos(near_spoke_angle), (y_side * outer_square_height - offset_y)/sin(near_spoke_angle));

  float inner_square_width = id / 2.0;
  float inner_square_height = id / 2.0;

  float offset_inner_square_edge_a = min((x_side * inner_square_width + offset_x)/cos(near_spoke_angle), (y_side * inner_square_height + offset_y)/sin(near_spoke_angle));
  float offset_inner_square_edge_b = min((x_side * inner_square_width - offset_x)/cos(near_spoke_angle), (y_side * inner_square_height - offset_y)/sin(near_spoke_angle));


  float ir = id / 2.0;
  float or = od / 2.0;
  float offset_od = or - or * (cos(asin((gap * 0.5) / or)));
  float offset_id = ir - ir * (cos(asin((gap * 0.5) / ir)));

  float offset_inner_circle_edge_a = ((id * 0.5) - offset_id);
  float offset_inner_circle_edge_b = ((id * 0.5) - offset_id);

  vec2 a1 = vec2(gap/2.0, (offset_outer_square_edge_b));
  vec2 a2 = vec2(gap/2.0, (offset_inner_circle_edge_b));
  vec2 b1 = vec2(-gap/2.0, (offset_outer_square_edge_a));
  vec2 b2 = vec2(-gap/2.0, (offset_inner_circle_edge_a));

  float leng = length(p);
  // p1, p2 are the x, y coordinates of the point p rotated by the angle of the spoke in relation to the quantity of spokes
  float p1 = (leng * sin(n_angle));
  float p2 = (leng * cos(n_angle));
  vec2 ap = vec2(p1, p2);

  float side1 = segmentDist(ap, a1, a2);
  float side2 = segmentDist(ap, b1, b2);
  float side = min(side1, side2);

  float da = (leng * sin(n_angle) + gap / 2.0);
  float db = (-leng * sin(n_angle) + gap / 2.0);
  float spokes = min(da, db);


  if (num_of_spokes == 1.0) {
    vec2 p1 = rotateCW(r_angle) * p;
    spokes = min(spokes, p1.x);
  }
  if (d <= 0.0){
    if (spokes >= 0.0) {
      return side;
    }
    return max(d, -side);
  }

  if (outersquare > 0.0) {
    vec2 p_outside = vec2(min(abs(p.x), od / 2.0) * sign(p.x), min(abs(p.y), od / 2.0) * sign(p.y));
    float near_outside_angle = atan(p_outside.y, p_outside.x) - r_angle;
    near_outside_angle = (2.0 / num_of_spokes) * atan(tan((num_of_spokes / 2.0) * near_outside_angle));
    float leng_outer = length(p_outside);
    float dist_outer_gapa = (leng_outer * sin(near_outside_angle) + gap / 2.0);
    float dist_outer_gapb = (-leng_outer * sin(near_outside_angle) + gap / 2.0);
    float dist_outer_gap = min(dist_outer_gapa, dist_outer_gapb);
    if (num_of_spokes == 1.0) {
      vec2 p1_outer = rotateCW(r_angle) * p_outside;
      dist_outer_gap = min(dist_outer_gap, p1_outer.x);
    }
    if (dist_outer_gap >= 0.0) {
      return side;
    }
  }

  if (length(abs(p2)) <= ir) {
    if (atan(abs(p2), abs(p1)) < asin((gap * 0.5) / ir)) {
      return side;
    }
    if (atan(abs(p1), abs(p2)) < asin((gap * 0.5) / ir)) {
      return side;
    }
  }

  float a = max(d, spokes);
  return d;
}

vec3 squareRoundThermalSDG(in vec2 p, in float od, in float id, in float angle, in float num_of_spokes, in float gap) {
  float dist = sqaureRoundThermalDist(p, od, id, angle, num_of_spokes, gap);
  const float eps = 0.001;
  vec2 grad = normalize(vec2(
      (sqaureRoundThermalDist(p + vec2(1, 0) * eps, od, id, angle, num_of_spokes, gap) - sqaureRoundThermalDist(p + vec2(-1, 0) * eps, od, id, angle, num_of_spokes, gap)),
      (sqaureRoundThermalDist(p + vec2(0, 1) * eps, od, id, angle, num_of_spokes, gap) - sqaureRoundThermalDist(p + vec2(0, -1) * eps, od, id, angle, num_of_spokes, gap))
  ));
  return vec3(dist, grad);
}

float oblongThermalDist(in vec2 p, in float width, in float height, in float angle, in float num_of_spokes, in float gap, in float line_width, in float rounded) {
  float OuterOval = roundBoxDist(p, vec2(width, height), min(height, width) / 2.0);
  float InnerOval = roundBoxDist(p, vec2(width - line_width * 2.0, height - line_width * 2.0), min(height, width) / 2.0 - line_width);
  float d = substract(InnerOval, OuterOval);
  vec2 offset = vec2(max(0.0, width - height) / 2.0, max(0.0, height - width) / 2.0);
  offset.x = p.x > 0.0 ? offset.x : -offset.x;
  offset.y = p.y > 0.0 ? offset.y : -offset.y;

  if (width > height) {

    if (mod(angle, 180.0) == 0.0 && num_of_spokes == 2.0) {
      if (rounded == 1.0) {
        if (abs(offset.x) < abs(p.x)) {
          d = roundedRoundThermalDist(translate(p, offset), height, height - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 90.0) == 0.0 && num_of_spokes == 2.0) {
      if (rounded == 1.0) {
        if ((line_width + gap) / 2.0 > abs(p.x)) {
          d = circleDist(translate(abs(p), vec2((line_width + gap) / 2.0, (height - line_width) / 2.0)), line_width / 2.0);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 90.0) == 0.0) {
      if (rounded == 1.0) {
        if ((line_width + gap) / 2.0 > abs(p.x)) {
          d = circleDist(translate(abs(p), vec2((line_width + gap) / 2.0, (height - line_width) / 2.0)), line_width / 2.0);
        }
        if (abs(offset.x) < abs(p.x)) {
          d = roundedRoundThermalDist(translate(p, offset), height, height - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 45.0) == 0.0 && num_of_spokes == 4.0) {
      if (rounded == 1.0) {
        if (abs(offset.x) < abs(p.x)) {
          d = roundedRoundThermalDist(translate(p, offset), height, height - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        if (abs(offset.x) < abs(p.x)) {
          d = roundThermalDist(translate(p, offset), height, height - line_width * 2.0, angle, num_of_spokes, gap);
        }
      }
      return d;
    } else {
      return 0.0;
    }
  } else {
    if (mod(angle, 180.0) == 0.0 && num_of_spokes == 2.0) {
      if (rounded == 1.0) {
        if ((line_width + gap) / 2.0 > abs(p.y)) {
          d = circleDist(translate(abs(p), vec2((width - line_width) / 2.0, (line_width + gap) / 2.0)), line_width / 2.0);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 90.0) == 0.0 && num_of_spokes == 2.0) {
      if (rounded == 1.0) {
        if (abs(offset.y) < abs(p.y)) {
          d = roundedRoundThermalDist(translate(p, offset), width, width - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 90.0) == 0.0) {
      if (rounded == 1.0) {
        if ((line_width + gap) / 2.0 > abs(p.y)) {
          d = circleDist(translate(abs(p), vec2((width - line_width) / 2.0, (line_width + gap) / 2.0)), line_width / 2.0);
        }
        if (abs(offset.y) < abs(p.y)) {
          d = roundedRoundThermalDist(translate(p, offset), width, width - line_width * 2.0, angle + 90.0, num_of_spokes - 2.0, gap);
        }
      } else {
        d = max(d, spokeDist(p, angle, num_of_spokes, gap));
      }
      return d;
    } else if (mod(angle, 45.0) == 0.0 && num_of_spokes == 4.0) {
      if (rounded == 1.0) {
        if (abs(offset.y) < abs(p.y)) {
          d = roundedRoundThermalDist(translate(p, offset), width, width - line_width * 2.0, angle, num_of_spokes, gap);
        }
      } else {
        if (abs(offset.y) < abs(p.y)) {
          d = roundThermalDist(translate(p, offset), width, width - line_width * 2.0, angle, num_of_spokes, gap);
        }
      }
      return d;
    } else {
      return 0.0;
    }
  }
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

  float lines = -spokeDist(p, angle, 4.0, line_width);
  float lines_edge = boxDist(p * rotateCW(-radians(angle)), vec2(line_length, line_length));
  lines = max(lines, lines_edge);

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

  float lines = -spokeDist(p, angle, 4.0, line_width);
  float lines_edge = boxDist(p * rotateCW(-radians(angle)), vec2(line_length, line_length));
  lines = max(lines, lines_edge);

  return min(rings, lines);
}

///////////////////////
// Masks for drawing //
///////////////////////

// float fillMask(float dist) {
//   return clamp(-dist, 0.0, 1.0);
// }

// float innerBorderMask(float dist, float width) {
// 	//dist += 1.0;
//   float alpha1 = clamp(dist + width, 0.0, 1.0);
//   float alpha2 = clamp(dist, 0.0, 1.0);
//   return alpha1 - alpha2;
// }

// float outerBorderMask(float dist, float width) {
// 	//dist += 1.0;
//   float alpha1 = clamp(dist, 0.0, 1.0);
//   float alpha2 = clamp(dist - width, 0.0, 1.0);
//   return alpha1 - alpha2;
// }

// this is an easy polygon of v sides sides
// https://iquilezles.org/articles/distfunctions2d/
// float sdPolygon( in vec2[N] v, in vec2 p )
// {
//     float d = dot(p-v[0],p-v[0]);
//     float s = 1.0;
//     for( int i=0, j=N-1; i<N; j=i, i++ )
//     {
//         vec2 e = v[j] - v[i];
//         vec2 w =    p - v[i];
//         vec2 b = w - e*clamp( dot(w,e)/dot(e,e), 0.0, 1.0 );
//         d = min( d, dot(b,b) );
//         bvec3 c = bvec3(p.y>=v[i].y,p.y<v[j].y,e.x*w.y>e.y*w.x);
//         if( all(c) || all(not(c)) ) s*=-1.0;
//     }
//     return s*sqrt(d);
// }

///////////////////////
//   SDG Utilities   //
///////////////////////

// vec3 onionSDG( in vec2 p, in float r )
// {
//   vec3 dis_gra = sdgShape(p);
//   return vec3( abs(dis_gra.x) - r, sign(dis_gra.x)*dis_gra.yz );
// }

// vec3 mergeSDG( in vec3 fill, in vec3 remove) {
//   if (fill.x > remove.x) {
//     return fill;
//   }
//   return remove * vec3(1.0, 1.0, 1.0);
// }

// vec3 sdgRound( in vec2 p, in float r )
// {
//   vec3 dis_gra = sdgShape(p);
//   return vec3( dis_gra.x - r, dis_gra.yz );
// }

// vec2 gradient(vec2 p)
// {
//     const float eps = 0.001;
//     return normalize(vec2(
//         (shape(p+vec2(1,0)*eps)-shape(p+vec2(-1,0)*eps)),
//         (shape(p+vec2(0,1)*eps)-shape(p+vec2( 0,-1)*eps))
//     ));
// }

#pragma glslify: pullSymbolParameter = require(./PullSymbolParameter.frag,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

vec3 drawShape(vec2 FragCoord, int SymNum) {

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
  vec3 sdg = vec3(10.0,10.0,10.0);

  // SD - Signed Distance (float)
  // SDG - Signed Distance with Gradient (vec3)


  if (t_Symbol == u_Symbols.Rounded_Round_Thermal) {
    // SD Variant
    // dist = roundedRoundThermalDist(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
    // SDG Variant
    sdg = roundedRoundThermalSDG(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Symbols.Squared_Round_Thermal) {
    // SD Variant
    // dist = roundThermalDist(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
    // SDG Variant
    sdg = roundThermalSDG(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Symbols.Square_Thermal) {
    // SD Variant
    // dist = squareThermalDist(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
    // SDG Variant
    sdg = squareThermalSDG(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Symbols.Open_Corners_Square_Thermal) {
    // SD Variant
    // dist = boxThermalOpenCornersExactDist(FragCoord.xy, t_Outer_Dia, t_Outer_Dia, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
    // dist = boxThermalOpenCornersDist(FragCoord.xy, t_Outer_Dia, t_Outer_Dia, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
    // SDG Variant
    sdg = boxThermalOpenCornersSDG(FragCoord.xy, t_Outer_Dia, t_Outer_Dia, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
  } else if (t_Symbol == u_Symbols.Line_Thermal) {
    // SD Variant
    // dist = lineThermalDist(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
    // SDG Variant
    sdg = lineThermalSDG(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Symbols.Square_Round_Thermal) {
    // SD Variant
    // float outerbox = boxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia));
    // float innercircle = circleDist(FragCoord.xy, t_Inner_Dia / 2.0);
    // float d = substract(innercircle, outerbox);
    // float therm = max(d, spokeDist(FragCoord.xy, t_Angle, t_Num_Spokes, t_Gap));
    // dist = therm;
    // SDG Variant
    sdg = squareRoundThermalSDG(FragCoord.xy, t_Outer_Dia, t_Inner_Dia, t_Angle, t_Num_Spokes, t_Gap);
  } else if (t_Symbol == u_Symbols.Rectangular_Thermal) {
    // SD Variant
    // dist = boxThermalDist(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
    // SDG Variant
    sdg = boxThermalSDG(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
  } else if (t_Symbol == u_Symbols.Rectangular_Thermal_Open_Corners) {
    // SD Variant
    // dist = boxThermalOpenCornersDist(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
    // SDG Variant
    sdg = boxThermalOpenCornersSDG(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width);
  } else if (t_Symbol == u_Symbols.Rounded_Square_Thermal || t_Symbol == u_Symbols.Rounded_Square_Thermal_Open_Corners) {
    float OuterRect = roundBoxDist(FragCoord.xy, vec2(t_Outer_Dia, t_Outer_Dia), t_Corner_Radius, t_Corners);
    float InnerRect = roundBoxDist(FragCoord.xy, vec2(t_Inner_Dia, t_Inner_Dia), t_Corner_Radius - (t_Outer_Dia - t_Inner_Dia) / 2.0, t_Corners);
    float d = substract(InnerRect, OuterRect);
    float therm = max(d, spokeDist(FragCoord.xy, t_Angle, t_Num_Spokes, t_Gap));
    dist = therm;
  } else if (t_Symbol == u_Symbols.Rounded_Rectangular_Thermal) {
    float OuterRect = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), t_Corner_Radius, t_Corners);
    float InnerRect = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), t_Corner_Radius - t_Line_Width, t_Corners);
    float d = substract(InnerRect, OuterRect);
    float therm = max(d, spokeDist(FragCoord.xy, t_Angle, t_Num_Spokes, t_Gap));
    dist = therm;
  } else if (t_Symbol == u_Symbols.Oval_Thermal) {
    float OuterOval = roundBoxDist(FragCoord.xy, vec2(t_Width, t_Height), min(t_Height, t_Width) / 2.0);
    float InnerOval = roundBoxDist(FragCoord.xy, vec2(t_Width - t_Line_Width * 2.0, t_Height - t_Line_Width * 2.0), min(t_Height, t_Width) / 2.0 - t_Line_Width);
    float d = substract(InnerOval, OuterOval);
    float therm = max(d, spokeDist(FragCoord.xy, t_Angle, t_Num_Spokes, t_Gap));
    dist = therm;
  } else if (t_Symbol == u_Symbols.Oblong_Thermal) {
    dist = oblongThermalDist(FragCoord.xy, t_Width, t_Height, t_Angle, t_Num_Spokes, t_Gap, t_Line_Width, t_Round);
  } else if (t_Symbol == u_Symbols.MoireODB) {
    dist = moireODBDist(FragCoord.xy, t_Ring_Width, t_Ring_Gap, t_Num_Rings, t_Line_Width, t_Line_Length, t_Angle);
  } else if (t_Symbol == u_Symbols.MoireGerber) {
    dist = moireGerberDist(FragCoord.xy, t_Ring_Width, t_Ring_Gap, t_Num_Rings, t_Line_Width, t_Line_Length, t_Angle, t_Outer_Dia);
  } else {
    // u_Symbols.Null
    dist = SDF_FAR_AWAY;
  }
  // return dist;
  return sdg;
}

#pragma glslify: export(drawShape)
