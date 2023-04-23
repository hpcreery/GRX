const geometry = {
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
  }
}

export default geometry
