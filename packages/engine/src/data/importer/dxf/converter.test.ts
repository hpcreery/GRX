import type * as Shapes from "@src/data/shape/shape"
import { FeatureTypeIdentifier, type FeatureTypeIdentifiers } from "@src/types"
import DxfParser from "dxf-parser"
import { describe, expect, it } from "vitest"
import * as converter from "./converter"

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
  LINE: {
    dxfFileName: "./testdata/gen_dxf_tests/output/test_LINE.dxf",
    layer: "MyLayer",
    shapeType: FeatureTypeIdentifier.LINE,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.Line
      expect(shape.xs).to.equal(0)
      expect(shape.ys).to.equal(0)
      expect(shape.xe).to.equal(1)
      expect(shape.ye).to.equal(1)
    },
  },
  POLYLINE: {
    dxfFileName: "./testdata/gen_dxf_tests/output/test_POLYLINE.dxf",
    layer: "MyLayer",
    shapeType: FeatureTypeIdentifier.POLYLINE,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.PolyLine
      expect(shape.lines.length).to.equal(3)
      expect(shape.xs).to.equal(0)
      expect(shape.ys).to.equal(0)
      expect(shape.lines[0].x).to.equal(0)
      expect(shape.lines[0].y).to.equal(0)
      expect(shape.lines[1].x).to.equal(1)
      expect(shape.lines[1].y).to.equal(1)
      expect(shape.lines[2].x).to.equal(1)
      expect(shape.lines[2].y).to.equal(0)
    },
  },
  CIRCLE: {
    dxfFileName: "./testdata/gen_dxf_tests/output/test_CIRCLE.dxf",
    layer: "MyLayer",
    shapeType: FeatureTypeIdentifier.ARC,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.Arc
      expect(shape.xc).to.equal(0)
      expect(shape.yc).to.equal(0)
      expect(shape.xs).to.equal(1)
      expect(shape.ys).to.equal(0)
      expect(shape.xe).to.closeTo(1, EPSILON)
      expect(shape.ye).to.closeTo(0, EPSILON)
    },
  },
  ARC: {
    dxfFileName: "./testdata/gen_dxf_tests/output/test_ARC.dxf",
    layer: "MyLayer",
    shapeType: FeatureTypeIdentifier.ARC,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.Arc
      expect(shape.xc).to.equal(0)
      expect(shape.yc).to.equal(0)
      expect(shape.xs).to.equal(1)
      expect(shape.ys).to.equal(0)
      expect(shape.xe).to.closeTo(0, EPSILON)
      expect(shape.ye).to.closeTo(1, EPSILON)
    },
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
  "SPLINE (control points, NURBS)": {
    dxfFileName: "./testdata/gen_dxf_tests/output/test_SPLINE_control_points_NURBS.dxf",
    layer: "MyLayer",
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
    },
  },
  // 'INSERT': {
  //   dxfFileName: './testdata/gen_dxf_tests/output/test_INSERT.dxf',
  //   layer: 'MyLayer',
  //   shapeType: FeatureTypeIdentifier.STEP_AND_REPEAT,
  //   testShape: (shape: AnyShape): void => {
  //     shape = shape as Shapes.StepAndRepeat
  //     console.log(shape)
  //   }
  // },
}

const parser = new DxfParser()

function basicEntityTest(entity: BasicEntityTest, name: string): void {
  describe(`${name} basic entity`, async () => {
    const dxfFile = await import(`${entity.dxfFileName}?raw`).then((module) => module.default)
    const dxf = parser.parse(dxfFile)
    if (!dxf) {
      throw new Error("dxf is undefined")
    }
    const units = converter.getUnits(dxf)
    const layerHierarchy = converter.convert(dxf)
    it("should have entities", () => {
      expect(dxf.entities).toBeDefined()
    })
    it("should be in inches", () => {
      expect(units).to.equal("inch")
    })
    it("should have correct layer", () => {
      expect(Object.keys(layerHierarchy)).to.include(entity.layer)
    })
    it("should have correct shape", () => {
      // expect(layerHierarchy[entity.layer].shapes.length).to.equal(1)
      expect(layerHierarchy[entity.layer].shapes[0].type).to.equal(entity.shapeType)
      const shape = layerHierarchy[entity.layer].shapes[0]
      entity.testShape(shape)
    })
  })
}

function insertTest(): void {
  describe("INSERT basic entity", async () => {
    const dxfFile = await import("./testdata/gen_dxf_tests/output/test_INSERT.dxf?raw").then((module) => module.default)
    const dxf = parser.parse(dxfFile)
    if (!dxf) {
      throw new Error("dxf is undefined")
    }
    const layerHierarchy = converter.convert(dxf)
    it("should have correct layer", () => {
      expect(Object.keys(layerHierarchy)).to.include("MyLayer")
    })
    it("should have correct shape", () => {
      expect(layerHierarchy["MyLayer"].shapes.length).to.equal(3)
      const insert0 = layerHierarchy["MyLayer"].shapes[0] as Shapes.StepAndRepeat
      const insert1 = layerHierarchy["MyLayer"].shapes[1] as Shapes.StepAndRepeat
      const insert2 = layerHierarchy["MyLayer"].shapes[2] as Shapes.StepAndRepeat
      const shape0 = insert0.shapes[0] as Shapes.Line
      const shape1 = insert1.shapes[0] as Shapes.Line
      const shape2 = insert2.shapes[0] as Shapes.Line
      expect(insert0.type).to.equal(FeatureTypeIdentifier.STEP_AND_REPEAT)
      expect(shape0.type).to.equal(FeatureTypeIdentifier.LINE)
      expect(shape0.xs).to.equal(0)
      expect(shape0.ys).to.equal(0)
      expect(shape0.xe).to.equal(1)
      expect(shape0.ye).to.equal(1)
      expect(shape0.ye).to.equal(1)
      expect(insert0.repeats[0].datum[0]).to.equal(0)
      expect(insert0.repeats[0].datum[1]).to.equal(0)
      expect(insert1.type).to.equal(FeatureTypeIdentifier.STEP_AND_REPEAT)
      expect(shape1.type).to.equal(FeatureTypeIdentifier.LINE)
      expect(shape1.xs).to.equal(0)
      expect(shape1.ys).to.equal(0)
      expect(shape1.xe).to.equal(1)
      expect(shape1.ye).to.equal(1)
      expect(insert1.repeats[0].datum[0]).to.equal(1)
      expect(insert1.repeats[0].datum[1]).to.equal(0)
      expect(insert2.type).to.equal(FeatureTypeIdentifier.STEP_AND_REPEAT)
      expect(shape2.type).to.equal(FeatureTypeIdentifier.LINE)
      expect(shape2.xs).to.equal(0)
      expect(shape2.ys).to.equal(0)
      expect(shape2.xe).to.equal(1)
      expect(shape2.ye).to.equal(1)
      expect(insert2.repeats[0].datum[0]).to.equal(0)
      expect(insert2.repeats[0].datum[1]).to.equal(0)
      expect(insert2.repeats[0].rotation).to.equal(90)
    })
  })
}

for (const [name, entity] of Object.entries(basicEntities)) {
  basicEntityTest(entity, name)
  insertTest()
}
