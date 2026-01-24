vec4 transformLocation3D(vec2 ndc) {
  // if u_Transform3D is identity, skip the transformation
  if (u_Transform3D == mat4(1.0)) {
    return vec4(ndc.xy, 0.0, 1.0);
  }

    // -----------------------
  // Non-perspective branch
  // -----------------------
  // Inverse the 3D transform analytically for the orthographic case
  if (!u_Perspective3D) {
    // Extract columns (mat4 is column-major)
    vec4 c0 = u_Transform3D[0];
    vec4 c1 = u_Transform3D[1];
    vec4 c2 = u_Transform3D[2];
    vec4 c3 = u_Transform3D[3];

    // constant term from z-offset
    float bx = c2.x * u_ZOffset + c3.x;
    float by = c2.y * u_ZOffset + c3.y;

    // coefficients for cx, cy
    float a_x1 = c0.x; float a_x2 = c1.x;
    float a_y1 = c0.y; float a_y2 = c1.y;

    // Linear system:
    // a_x1 * cx + a_x2 * cy + bx = ndc.x
    // a_y1 * cx + a_y2 * cy + by = ndc.y
    float m00 = a_x1;
    float m01 = a_x2;
    float m10 = a_y1;
    float m11 = a_y2;

    float r0 = ndc.x - bx;
    float r1 = ndc.y - by;

    float det = m00 * m11 - m01 * m10;

    // If determinant is near-zero, solver unreliable -> drop fragment
    if (abs(det) < 1e-8) {
      discard;
    }

    vec2 sol = vec2((r0 * m11 - m01 * r1) / det, (m00 * r1 - r0 * m10) / det);
    float cx = sol.x;
    float cy = sol.y;

    return vec4(cx, cy, u_ZOffset, 1.0);
  }

  // Extract columns of the 4x4 transform (mat4 is column-major)
  vec4 c0 = u_Transform3D[0];
  vec4 c1 = u_Transform3D[1];
  vec4 c2 = u_Transform3D[2];
  vec4 c3 = u_Transform3D[3];

  // t = coord.x * c0 + coord.y * c1 + u_ZOffset * c2 + c3
  // Precompute b = u_ZOffset * c2 + c3 (constant term)
  float bx = c2.x * u_ZOffset + c3.x;
  float by = c2.y * u_ZOffset + c3.y;
  float bz = c2.z * u_ZOffset + c3.z;

  // A entries (coefficients multiplying coord.x/coord.y)
  float a_x1 = c0.x; float a_x2 = c1.x;
  float a_y1 = c0.y; float a_y2 = c1.y;
  float a_z1 = c0.z; float a_z2 = c1.z;

  // perspective correction factor
  float f = 1.0;

  // Build 2x2 linear system: M * [cx,cy] = r
  float m00 = a_x1 - ndc.x * f * a_z1;
  float m01 = a_x2 - ndc.x * f * a_z2;
  float m10 = a_y1 - ndc.y * f * a_z1;
  float m11 = a_y2 - ndc.y * f * a_z2;

  // Right-hand side: move constants to RHS: cx*m00 + cy*m01 = - (ndc.x*(1+bw) - bx)
  float r0 = ndc.x * (1.0 + f * bz) - bx;
  float r1 = ndc.y * (1.0 + f * bz) - by;

  float det = m00 * m11 - m01 * m10;

  // If determinant is near-zero, drop this fragment (solver unreliable)
  if (abs(det) < 1e-8) {
    discard;
  }

  // Solve 2x2
  vec2 sol = vec2((r0 * m11 - m01 * r1) / det, (m00 * r1 - r0 * m10) / det);
  float cx = sol.x;
  float cy = sol.y;

  // Reconstruct t and return (consistent with vertex-side transformLocation3D)
  vec4 tvec = vec4(cx, cy, u_ZOffset, 1.0);

  // reprojection check
  vec4 reproj = u_Transform3D * tvec;
  if ((1.0 + reproj.w) < 0.0) {
    discard;
  }

  return tvec;
}

#pragma glslify: export(transformLocation3D)


