import type * as Shapes from "@grx/artwork-format/shape"
import { FeatureTypeIdentifier, type FeatureTypeIdentifiers } from "@grx/artwork-format/types"
import DxfParser from "dxf-parser"
import { expect } from "@std/expect";
import * as converter from "./converter"

const EPSILON = 0.0001

// import line from '../testdata/gen_dxf_tests/output/test_line_00_11.dxf?raw'

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
    dxfFileName: "../testdata/gen_dxf_tests/output/test_LINE.dxf",
    layer: "MyLayer",
    shapeType: FeatureTypeIdentifier.LINE,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.Line
      expect(shape.xs).toEqual(0)
      expect(shape.ys).toEqual(0)
      expect(shape.xe).toEqual(1)
      expect(shape.ye).toEqual(1)
    },
  },
  POLYLINE: {
    dxfFileName: "../testdata/gen_dxf_tests/output/test_POLYLINE.dxf",
    layer: "MyLayer",
    shapeType: FeatureTypeIdentifier.POLYLINE,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.PolyLine
      expect(shape.lines.length).toEqual(3)
      expect(shape.xs).toEqual(0)
      expect(shape.ys).toEqual(0)
      expect(shape.lines[0].x).toEqual(0)
      expect(shape.lines[0].y).toEqual(0)
      expect(shape.lines[1].x).toEqual(1)
      expect(shape.lines[1].y).toEqual(1)
      expect(shape.lines[2].x).toEqual(1)
      expect(shape.lines[2].y).toEqual(0)
    },
  },
  CIRCLE: {
    dxfFileName: "../testdata/gen_dxf_tests/output/test_CIRCLE.dxf",
    layer: "MyLayer",
    shapeType: FeatureTypeIdentifier.ARC,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.Arc
      expect(shape.xc).toEqual(0)
      expect(shape.yc).toEqual(0)
      expect(shape.xs).toEqual(1)
      expect(shape.ys).toEqual(0)
      expect(shape.xe).toBeCloseTo(1, EPSILON)
      expect(shape.ye).toBeCloseTo(0, EPSILON)
    },
  },
  ARC: {
    dxfFileName: "../testdata/gen_dxf_tests/output/test_ARC.dxf",
    layer: "MyLayer",
    shapeType: FeatureTypeIdentifier.ARC,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.Arc
      expect(shape.xc).toEqual(0)
      expect(shape.yc).toEqual(0)
      expect(shape.xs).toEqual(1)
      expect(shape.ys).toEqual(0)
      expect(shape.xe).toBeCloseTo(0, EPSILON)
      expect(shape.ye).toBeCloseTo(1, EPSILON)
    },
  },
  // 'SPLINE (fit points)': {
  //   dxfFileName: '../testdata/gen_dxf_tests/output/test_SPLINE_fit_points.dxf',
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
    dxfFileName: "../testdata/gen_dxf_tests/output/test_SPLINE_control_points_NURBS.dxf",
    layer: "MyLayer",
    shapeType: FeatureTypeIdentifier.POLYLINE,
    testShape: (shape: AnyShape): void => {
      shape = shape as Shapes.PolyLine
      // console.log(shape)
      expect(shape.xs).toEqual(0)
      expect(shape.ys).toEqual(0)
      expect(shape.lines[0].x).toEqual(0)
      expect(shape.lines[0].y).toEqual(0)
      expect(shape.lines[shape.lines.length - 1].x).toEqual(0)
      expect(shape.lines[shape.lines.length - 1].y).toEqual(1)
    },
  },
  // 'INSERT': {
  //   dxfFileName: '../testdata/gen_dxf_tests/output/test_INSERT.dxf',
  //   layer: 'MyLayer',
  //   shapeType: FeatureTypeIdentifier.STEP_AND_REPEAT,
  //   testShape: (shape: AnyShape): void => {
  //     shape = shape as Shapes.StepAndRepeat
  //     console.log(shape)
  //   }
  // },
}

// @ts-ignore unknown type DxfParser
const parser = new DxfParser()

function basicEntityTest(entity: BasicEntityTest, name: string): void {
  Deno.test(`${name} basic entity`, async (t) => {
    const dxfFile = await Deno.readTextFile(new URL(entity.dxfFileName, import.meta.url))
    const dxf = parser.parse(dxfFile)
    if (!dxf) {
      throw new Error("dxf is undefined")
    }
    const units = converter.getUnits(dxf)
    const layerHierarchy = converter.convert(dxf)
    await t.step("should have entities", () => {
      expect(dxf.entities).toBeDefined()
    })
    await t.step("should be in inches", () => {
      expect(units).toEqual("inch")
    })
    await t.step("should have correct layer", () => {
      expect(Object.keys(layerHierarchy)).toContain(entity.layer)
    })
    await t.step("should have correct shape", () => {
      // expect(layerHierarchy[entity.layer].shapes.length).to.equal(1)
      expect(layerHierarchy[entity.layer].shapes[0].type).toEqual(entity.shapeType)
      const shape = layerHierarchy[entity.layer].shapes[0]
      entity.testShape(shape)
    })
  })
}

function insertTest(): void {
  Deno.test("INSERT basic entity", async (t) => {
    const dxfFile = await Deno.readTextFile(new URL("../testdata/gen_dxf_tests/output/test_INSERT.dxf", import.meta.url))
    const dxf = parser.parse(dxfFile)
    if (!dxf) {
      throw new Error("dxf is undefined")
    }
    const layerHierarchy = converter.convert(dxf)
    await t.step("should have correct layer", () => {
      expect(Object.keys(layerHierarchy)).toContain("MyLayer")
    })
    await t.step("should have correct shape", () => {
      expect(layerHierarchy["MyLayer"].shapes.length).toEqual(3)
      const insert0 = layerHierarchy["MyLayer"].shapes[0] as Shapes.StepAndRepeat
      const insert1 = layerHierarchy["MyLayer"].shapes[1] as Shapes.StepAndRepeat
      const insert2 = layerHierarchy["MyLayer"].shapes[2] as Shapes.StepAndRepeat
      const shape0 = insert0.shapes[0] as Shapes.Line
      const shape1 = insert1.shapes[0] as Shapes.Line
      const shape2 = insert2.shapes[0] as Shapes.Line
      expect(insert0.type).toEqual(FeatureTypeIdentifier.STEP_AND_REPEAT)
      expect(shape0.type).toEqual(FeatureTypeIdentifier.LINE)
      expect(shape0.xs).toEqual(0)
      expect(shape0.ys).toEqual(0)
      expect(shape0.xe).toEqual(1)
      expect(shape0.ye).toEqual(1)
      expect(shape0.ye).toEqual(1)
      expect(insert0.repeats[0].datum[0]).toEqual(0)
      expect(insert0.repeats[0].datum[1]).toEqual(0)
      expect(insert1.type).toEqual(FeatureTypeIdentifier.STEP_AND_REPEAT)
      expect(shape1.type).toEqual(FeatureTypeIdentifier.LINE)
      expect(shape1.xs).toEqual(0)
      expect(shape1.ys).toEqual(0)
      expect(shape1.xe).toEqual(1)
      expect(shape1.ye).toEqual(1)
      expect(insert1.repeats[0].datum[0]).toEqual(1)
      expect(insert1.repeats[0].datum[1]).toEqual(0)
      expect(insert2.type).toEqual(FeatureTypeIdentifier.STEP_AND_REPEAT)
      expect(shape2.type).toEqual(FeatureTypeIdentifier.LINE)
      expect(shape2.xs).toEqual(0)
      expect(shape2.ys).toEqual(0)
      expect(shape2.xe).toEqual(1)
      expect(shape2.ye).toEqual(1)
      expect(insert2.repeats[0].datum[0]).toEqual(0)
      expect(insert2.repeats[0].datum[1]).toEqual(0)
      expect(insert2.repeats[0].rotation).toEqual(90)
    })
  })
}

for (const [name, entity] of Object.entries(basicEntities)) {
  basicEntityTest(entity, name)
  insertTest()
}
