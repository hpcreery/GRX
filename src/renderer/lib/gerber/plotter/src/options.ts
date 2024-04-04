import type {
  GerberTree,
  UnitsType,
  Format,
  ZeroSuppression,
} from '@hpcreery/tracespace-parser'
import {
  UNITS,
  COORDINATE_FORMAT,
  GRAPHIC,
  COMMENT,
  LEADING,
  TRAILING,
  IN,
} from '@hpcreery/tracespace-parser'

export interface PlotOptions {
  units: UnitsType
  coordinateFormat: Format
  zeroSuppression: ZeroSuppression
}

const FORMAT_COMMENT_RE = /FORMAT={?(\d):(\d)/

export function getPlotOptions(tree: GerberTree): PlotOptions {
  const {children: treeNodes} = tree
  let units: UnitsType | undefined
  let coordinateFormat: Format | undefined
  let zeroSuppression: ZeroSuppression | undefined
  let index = 0

  while (
    index < treeNodes.length &&
    (units === undefined ||
      coordinateFormat === undefined ||
      zeroSuppression === undefined)
  ) {
    const node = treeNodes[index]

    switch (node.type) {
      case UNITS: {
        units = node.units
        break
      }

      case COORDINATE_FORMAT: {
        coordinateFormat = node.format ?? undefined
        zeroSuppression = node.zeroSuppression ?? undefined
        break
      }

      case GRAPHIC: {
        const {coordinates} = node

        for (const coordinate of Object.values(coordinates)) {
          if (zeroSuppression !== undefined) break

          if (
            coordinate?.endsWith('0') === true ||
            coordinate?.includes('.') === true
          ) {
            zeroSuppression = LEADING
          } else if (coordinate?.startsWith('0') === true) {
            zeroSuppression = TRAILING
          }
        }

        break
      }

      case COMMENT: {
        const {comment} = node
        const formatMatch = FORMAT_COMMENT_RE.exec(comment)

        if (/suppress trailing/i.test(comment)) {
          zeroSuppression = TRAILING
        } else if (/(suppress leading|keep zeros)/i.test(comment)) {
          zeroSuppression = LEADING
        }

        if (formatMatch !== null) {
          coordinateFormat = [Number(formatMatch[1]), Number(formatMatch[2])]
        }

        break
      }

      default:
    }

    index += 1
  }

  return {
    units: units ?? IN,
    coordinateFormat: coordinateFormat ?? [2, 4],
    zeroSuppression: zeroSuppression ?? LEADING,
  }
}
