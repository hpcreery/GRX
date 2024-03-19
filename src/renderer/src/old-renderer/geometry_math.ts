const geometry = {
  /**
   * @deprectated not used
   * @param x
   * @param y
   * @param poly
   * @returns
   */
  pointInsidePolygon(x: number, y: number, poly: number[]): boolean {
    let inside = false
    let angle = 0
    for (let i = 0; i < poly.length; i += 2) {
      const p1 = { x: poly[i] - x, y: poly[i + 1] - y }
      const p2 = {
        x: poly[(i + 2) % poly.length] - x,
        y: poly[(i + 3) % poly.length] - y
      }
      angle += this.angle2D(p1.x, p1.y, p2.x, p2.y)
    }
    if (Math.abs(angle) > Math.PI) {
      inside = true
    }
    return inside
  },

  /**
   * @deprectated not used
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   * @returns
   */
  angle2D(x1: number, y1: number, x2: number, y2: number): number {
    const theta1 = Math.atan2(y1, x1)
    const theta2 = Math.atan2(y2, x2)
    let dtheta = theta2 - theta1
    while (dtheta > Math.PI) {
      dtheta -= 2 * Math.PI
    }
    while (dtheta < -Math.PI) {
      dtheta += 2 * Math.PI
    }
    return dtheta
  },

  // alternat method
  /**
   * @deprectated not used
   * @param x
   * @param y
   * @param poly
   * @returns
   */
  pointInsidePolygon2(x: number, y: number, poly: number[]): boolean {
    // use winding number algorithm
    // https://en.wikipedia.org/wiki/Point_in_polygon#Winding_number_algorithm
    let wn = 0 // the winding number counter
    // loop through all edges of the polygon
    for (let i = 0; i < poly.length; i += 2) {
      // edge from V[i] to V[i+1]
      const x1 = poly[i]
      const y1 = poly[i + 1]
      const x2 = poly[(i + 2) % poly.length]
      const y2 = poly[(i + 3) % poly.length]
      if (y1 <= y) {
        // start y <= P.y
        if (y2 > y) {
          // an upward crossing
          if (this.isLeft(x1, y1, x2, y2, x, y) > 0) {
            // P left of edge
            ++wn // have a valid up intersect
          }
        }
      } else {
        // start y > P.y (no test needed)
        if (y2 <= y) {
          // a downward crossing
          if (this.isLeft(x1, y1, x2, y2, x, y) < 0) {
            // P right of edge
            --wn // have a valid down intersect
          }
        }
      }
    }
    return wn !== 0
  },

  /**
   * @deprectated not used
   * @param x0
   * @param y0
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   * @returns
   */
  isLeft(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): number {
    return (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
  }
}

export default geometry
