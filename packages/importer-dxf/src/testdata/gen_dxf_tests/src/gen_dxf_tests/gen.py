import os.path
import ezdxf

import ezdxf.addons
from ezdxf.addons.drawing import (
    Frontend,
    RenderContext,
    pymupdf,
    layout,
    config,
)
import ezdxf.addons.drawing
import ezdxf.document

# https://help.autodesk.com/view/ACD/2024/ENU/?guid=GUID-7D07C886-FD1D-4A0C-A7AB-B4D21F18E484
# Common Group Codes for Entities (DXF)
# 3DFACE (DXF)
# 3DSOLID (DXF)
# ACAD_PROXY_ENTITY (DXF)
# ARC (DXF)
# ATTDEF (DXF)
# ATTRIB (DXF)
# BODY (DXF)
# CIRCLE (DXF)
# DIMENSION (DXF)
# ELLIPSE (DXF)
# HATCH (DXF)
# HELIX (DXF)
# IMAGE (DXF)
# INSERT (DXF)
# LEADER (DXF)
# LIGHT (DXF)
# LINE (DXF)
# LWPOLYLINE (DXF)
# MESH (DXF)
# MLINE (DXF)
# MLEADERSTYLE (DXF)
# MLEADER (DXF)
# MTEXT (DXF)
# OLEFRAME (DXF)
# OLE2FRAME (DXF)
# POINT (DXF)
# POLYLINE (DXF)
# RAY (DXF)
# REGION (DXF)
# SECTION (DXF)
# SEQEND (DXF)
# SHAPE (DXF)
# SOLID (DXF)
# SPLINE (DXF)
# SUN (DXF)
# SURFACE (DXF)
# TABLE (DXF)
# TEXT (DXF)
# TOLERANCE (DXF)
# TRACE (DXF)
# UNDERLAY (DXF)
# VERTEX (DXF)
# VIEWPORT (DXF)
# WIPEOUT (DXF)
# XLINE (DXF)


OUTPUT_DIR = "./output"
WIDTH = 200
HEIGHT = 200


def export_dark_bg_png(doc: ezdxf.document.Drawing, dir, file_name):
    msp = doc.modelspace()
    # 1. create the render context
    context = RenderContext(doc)
    # 2. create the backend
    backend = pymupdf.PyMuPdfBackend()
    # 3. create the frontend
    cfg = config.Configuration(background_policy=config.BackgroundPolicy.BLACK)
    frontend = Frontend(context, backend, config=cfg)
    # 4. draw the modelspace
    frontend.draw_layout(msp)
    # 5. create a page layout
    page = layout.Page(WIDTH, HEIGHT, layout.Units.mm, margins=layout.Margins.all(0))
    # 6. get the PNG rendering as bytes
    png_bytes = backend.get_pixmap_bytes(page, fmt="png", dpi=96)
    with open(os.path.join(dir, f"{file_name}.png"), "wb") as fp:
        fp.write(png_bytes)


def save_dxf(doc: ezdxf.document.Drawing, dir, file_name):
    doc.saveas(os.path.join(dir, f"{file_name}.dxf"))


def save(doc: ezdxf.document.Drawing, dir, file_name):
    save_dxf(doc, OUTPUT_DIR, file_name)
    export_dark_bg_png(doc, OUTPUT_DIR, file_name)


def generate_test_data():
    # Test LINE
    name = "test_LINE"
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_line((0, 0), (1, 1), dxfattribs={"layer": "MyLayer"})
    save(doc, OUTPUT_DIR, name)

    # Test POLYLINE
    name = "test_POLYLINE"
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_polyline2d(points=[(0, 0), (1, 1), (1, 0)], dxfattribs={"layer": "MyLayer"})
    save(doc, OUTPUT_DIR, name)

    # Test CIRCLE
    name = "test_CIRCLE"
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_circle(center=(0, 0), radius=1, dxfattribs={"layer": "MyLayer"})
    save(doc, OUTPUT_DIR, name)

    # Test ARC
    name = "test_ARC"
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_arc(
        center=(0, 0),
        radius=1,
        start_angle=0,
        end_angle=90,
        dxfattribs={"layer": "MyLayer"},
    )
    save(doc, OUTPUT_DIR, name)

    # Test SPLINE
    name = "test_SPLINE_fit_points"
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_spline(
        fit_points=[(0, 0), (1, 1), (1, 0)],
        dxfattribs={"layer": "MyLayer"},
    )
    save(doc, OUTPUT_DIR, name)

    name = "test_SPLINE_control_points_NURBS"
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_rational_spline(
        control_points=[(0, 0), (1, 1), (1, 0), (0, 1)],
        weights=[1, 1, 1, 1],
        dxfattribs={"layer": "MyLayer"},
    )
    save(doc, OUTPUT_DIR, name)

    # Test INSERT
    name = "test_INSERT"
    doc = ezdxf.new()
    msp = doc.modelspace()

    line = doc.blocks.new(name="LINE")
    line.add_line(start=(0, 0), end=(1, 1))

    msp.add_blockref(
        name="LINE",
        insert=(0, 0),
        dxfattribs={"layer": "MyLayer"},
    )
    msp.add_blockref(
        name="LINE",
        insert=(1, 0),
        dxfattribs={"layer": "MyLayer"},
    )
    msp.add_blockref(
        name="LINE",
        insert=(0, 0),
        dxfattribs={"layer": "MyLayer", "rotation": 90},
    )
    # msp.add_blockref(
    #     name="LINE",
    #     insert=(0, 0),
    #     dxfattribs={"layer": "MyLayer", "xscale": -1},
    # )
    save(doc, OUTPUT_DIR, name)


if __name__ == "__main__":
    generate_test_data()
