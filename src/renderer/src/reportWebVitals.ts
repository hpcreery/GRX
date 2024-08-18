import type { MetricType } from "web-vitals"
import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals"

const reportWebVitals = (onPerfEntry?: (metric: MetricType) => void): void => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry)
    onINP(onPerfEntry)
    onFCP(onPerfEntry)
    onLCP(onPerfEntry)
    onTTFB(onPerfEntry)
  }
}

export default reportWebVitals
