import { describe, it, expect } from 'vitest'
import DxfParser from 'dxf-parser'
import * as converter from './converter'
import * as Shapes from '../../src/renderer/shapes'
import { FeatureTypeIdentifiers, FeatureTypeIdentifier } from '../../src/renderer/types'

const EPSILON = 0.0001

// import line from './testdata/gen_dxf_tests/output/test_line_00_11.dxf?raw'

type AnyShape = Shapes.Shape | Shapes.Primitive
type BasicEntityTest = {
  dxfFileName: string
  layer: string
  shapeType: FeatureTypeIdentifiers
  testShape: (shape: AnyShape) => void
}
type BasicEntityTestList = {
  [name: string]: BasicEntityTest
}

const basicEntities: BasicEntityTestList = {
  'LINE': {
    dxfFileName: './testdata/gen_dxf_tests/output/test_LINE.dxf',
    layer: 'MyLayer',
    shapeType: FeatureTypeIdentifier.LINE,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.Line
      expect(shape.xs).to.equal(0)
      expect(shape.ys).to.equal(0)
      expect(shape.xe).to.equal(1)
      expect(shape.ye).to.equal(1)
    }
  },
  'POLYLINE': {
    dxfFileName: './testdata/gen_dxf_tests/output/test_POLYLINE.dxf',
    layer: 'MyLayer',
    shapeType: FeatureTypeIdentifier.POLYLINE,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.PolyLine
      // console.log(shape)
      expect(shape.lines.length).to.equal(3)
      expect(shape.xs).to.equal(0)
      expect(shape.ys).to.equal(0)
      expect(shape.lines[0].x).to.equal(0)
      expect(shape.lines[0].y).to.equal(0)
      expect(shape.lines[1].x).to.equal(1)
      expect(shape.lines[1].y).to.equal(1)
      expect(shape.lines[2].x).to.equal(1)
      expect(shape.lines[2].y).to.equal(0)
    }
  },
  'CIRCLE': {
    dxfFileName: './testdata/gen_dxf_tests/output/test_CIRCLE.dxf',
    layer: 'MyLayer',
    shapeType: FeatureTypeIdentifier.ARC,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.Arc
      // console.log(shape)
      expect(shape.xc).to.equal(0)
      expect(shape.yc).to.equal(0)
      expect(shape.xs).to.equal(1)
      expect(shape.ys).to.equal(0)
      expect(shape.xe).to.closeTo(1, EPSILON)
      expect(shape.ye).to.closeTo(0, EPSILON)
    }
  },
  'ARC': {
    dxfFileName: './testdata/gen_dxf_tests/output/test_ARC.dxf',
    layer: 'MyLayer',
    shapeType: FeatureTypeIdentifier.ARC,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.Arc
      // console.log(shape)
      expect(shape.xc).to.equal(0)
      expect(shape.yc).to.equal(0)
      expect(shape.xs).to.equal(1)
      expect(shape.ys).to.equal(0)
      expect(shape.xe).to.closeTo(0, EPSILON)
      expect(shape.ye).to.closeTo(1, EPSILON)
    }
  },
  // 'SPLINE (fit points)': {
  //   dxfFileName: './testdata/gen_dxf_tests/output/test_SPLINE_fit_points.dxf',
  //   layer: 'MyLayer',
  //   shapeType: FeatureTypeIdentifier.ARC,
  //   testShape: (shape: AnyShape): void => {
  //     shape = shape as Shapes.PolyLine
  //     console.log(shape)
  //     expect(shape.lines.length).to.equal(3)
  //     expect(shape.xs).to.equal(0)
  //     expect(shape.ys).to.equal(0)
  //     expect(shape.lines[0].x).to.equal(0)
  //     expect(shape.lines[0].y).to.equal(0)
  //     expect(shape.lines[1].x).to.equal(1)
  //     expect(shape.lines[1].y).to.equal(1)
  //     expect(shape.lines[2].x).to.equal(1)
  //     expect(shape.lines[2].y).to.equal(0)
  //   }
  // },
  'SPLINE (control points, NURBS)': {
    dxfFileName: './testdata/gen_dxf_tests/output/test_SPLINE_control_points_NURBS.dxf',
    layer: 'MyLayer',
    shapeType: FeatureTypeIdentifier.POLYLINE,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.PolyLine
      // console.log(shape)
      expect(shape.xs).to.equal(0)
      expect(shape.ys).to.equal(0)
      expect(shape.lines[0].x).to.equal(0)
      expect(shape.lines[0].y).to.equal(0)
      expect(shape.lines[shape.lines.length - 1].x).to.equal(0)
      expect(shape.lines[shape.lines.length - 1].y).to.equal(1)
    }
  }
}

const parser = new DxfParser()

function basicEntityTest(entity: BasicEntityTest, name: string): void {
  describe(`${name} basic entity`, async () => {
    const dxfFile = await import(`${entity.dxfFileName}?raw`).then((module) => module.default)
    const dxf = parser.parse(dxfFile)
    if (!dxf) {
      throw new Error('dxf is undefined')
    }
    const units = converter.getUnits(dxf)
    const layerHierarchy = converter.convert(dxf)
    it('should have entities', () => {
      expect(dxf.entities).toBeDefined()
    })
    it('should be in inches', () => {
      expect(units).to.equal('inch')
    })
    it('should have correct layer', () => {
      // console.log(layerHierarchy)
      expect(Object.keys(layerHierarchy)).to.include(entity.layer)
    })
    it('should have correct shape', () => {
      expect(layerHierarchy[entity.layer].shapes.length).to.equal(1)
      expect(layerHierarchy[entity.layer].shapes[0].type).to.equal(entity.shapeType)
      const shape = layerHierarchy[entity.layer].shapes[0] as Shapes.Line
      // console.log(shape)
      entity.testShape(shape)
    })
  })
}

for (const [name, entity] of Object.entries(basicEntities)) {
  basicEntityTest(entity, name)
}

