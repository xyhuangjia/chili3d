// Copyright 2022-2023 the Chili authors. All rights reserved. AGPL-3.0 license.

import { CurveType, IShape, Id, JoinType, Matrix4, Orientation, Plane, ShapeType, XYZ } from "chili-core";
import {
    GeomAbs_JoinType,
    Geom_Curve,
    TopAbs_ShapeEnum,
    TopoDS_Shape,
    gp_Ax2,
    gp_Ax3,
    gp_Dir,
    gp_Pln,
    gp_Pnt,
    gp_Trsf,
    gp_Vec,
} from "../occ-wasm/chili_occ";

import {
    OccCompound,
    OccCompoundSolid,
    OccEdge,
    OccFace,
    OccShape,
    OccShell,
    OccSolid,
    OccVertex,
    OccWire,
} from "./occShape";

export class OccHelps {
    static toXYZ(p: gp_Pnt | gp_Dir | gp_Vec): XYZ {
        return new XYZ(p.X(), p.Y(), p.Z());
    }

    static toDir(value: XYZ) {
        return new occ.gp_Dir_4(value.x, value.y, value.z);
    }

    static toPnt(value: XYZ) {
        return new occ.gp_Pnt_3(value.x, value.y, value.z);
    }

    static toVec(value: XYZ) {
        return new occ.gp_Vec_4(value.x, value.y, value.z);
    }

    static fromAx2(ax: gp_Ax2): Plane {
        return new Plane(
            OccHelps.toXYZ(ax.Location()),
            OccHelps.toXYZ(ax.Direction()),
            OccHelps.toXYZ(ax.XDirection()),
        );
    }

    static toAx2(plane: Plane): gp_Ax2 {
        return new occ.gp_Ax2_2(
            OccHelps.toPnt(plane.origin),
            OccHelps.toDir(plane.normal),
            OccHelps.toDir(plane.xvec),
        );
    }

    static toAx3(plane: Plane): gp_Ax3 {
        return new occ.gp_Ax3_3(
            OccHelps.toPnt(plane.origin),
            OccHelps.toDir(plane.normal),
            OccHelps.toDir(plane.xvec),
        );
    }

    static toPln(plane: Plane): gp_Pln {
        return new occ.gp_Pln_2(OccHelps.toAx3(plane));
    }

    static hashCode(shape: TopoDS_Shape) {
        return shape.HashCode(2147483647); // max int
    }

    static convertFromMatrix(matrix: Matrix4): gp_Trsf {
        const arr = matrix.toArray();
        let trsf = new occ.gp_Trsf_1();
        trsf.SetValues(
            arr[0],
            arr[4],
            arr[8],
            arr[12],
            arr[1],
            arr[5],
            arr[9],
            arr[13],
            arr[2],
            arr[6],
            arr[10],
            arr[14],
        );
        return trsf;
    }

    static convertToMatrix(matrix: gp_Trsf): Matrix4 {
        const arr: number[] = [
            matrix.Value(1, 1),
            matrix.Value(2, 1),
            matrix.Value(3, 1),
            0,
            matrix.Value(1, 2),
            matrix.Value(2, 2),
            matrix.Value(3, 2),
            0,
            matrix.Value(1, 3),
            matrix.Value(2, 3),
            matrix.Value(3, 3),
            0,
            matrix.Value(1, 4),
            matrix.Value(2, 4),
            matrix.Value(3, 4),
            1,
        ];
        return Matrix4.fromArray(arr);
    }

    static getCurveType(curve: Geom_Curve): CurveType {
        let isType = (type: string) => curve.IsInstance_2(type);
        if (isType("Geom_Line")) return CurveType.Line;
        else if (isType("Geom_Circle")) return CurveType.Circle;
        else if (isType("Geom_Ellipse")) return CurveType.Ellipse;
        else if (isType("Geom_Hyperbola")) return CurveType.Hyperbola;
        else if (isType("Geom_Parabola")) return CurveType.Parabola;
        else if (isType("Geom_BezierCurve")) return CurveType.BezierCurve;
        else if (isType("Geom_BSplineCurve")) return CurveType.BSplineCurve;
        else if (isType("Geom_OffsetCurve")) return CurveType.OffsetCurve;
        else return CurveType.OtherCurve;
    }

    static getShapeType(shape: TopoDS_Shape): ShapeType {
        switch (shape.ShapeType()) {
            case occ.TopAbs_ShapeEnum.TopAbs_COMPOUND:
                return ShapeType.Compound;
            case occ.TopAbs_ShapeEnum.TopAbs_COMPSOLID:
                return ShapeType.CompoundSolid;
            case occ.TopAbs_ShapeEnum.TopAbs_SOLID:
                return ShapeType.Solid;
            case occ.TopAbs_ShapeEnum.TopAbs_SHELL:
                return ShapeType.Shell;
            case occ.TopAbs_ShapeEnum.TopAbs_FACE:
                return ShapeType.Face;
            case occ.TopAbs_ShapeEnum.TopAbs_WIRE:
                return ShapeType.Wire;
            case occ.TopAbs_ShapeEnum.TopAbs_EDGE:
                return ShapeType.Edge;
            case occ.TopAbs_ShapeEnum.TopAbs_VERTEX:
                return ShapeType.Vertex;
            default:
                return ShapeType.Shape;
        }
    }

    static getOrientation(shape: TopoDS_Shape): Orientation {
        switch (shape.Orientation_1()) {
            case occ.TopAbs_Orientation.TopAbs_FORWARD:
                return Orientation.FORWARD;
            case occ.TopAbs_Orientation.TopAbs_REVERSED:
                return Orientation.REVERSED;
            case occ.TopAbs_Orientation.TopAbs_INTERNAL:
                return Orientation.INTERNAL;
            case occ.TopAbs_Orientation.TopAbs_EXTERNAL:
                return Orientation.EXTERNAL;
            default:
                return Orientation.FORWARD;
        }
    }

    static getJoinType(joinType: JoinType) {
        switch (joinType) {
            case JoinType.arc:
                return occ.GeomAbs_JoinType.GeomAbs_Arc as GeomAbs_JoinType;
            case JoinType.intersection:
                return occ.GeomAbs_JoinType.GeomAbs_Intersection as GeomAbs_JoinType;
            case JoinType.tangent:
                return occ.GeomAbs_JoinType.GeomAbs_Tangent as GeomAbs_JoinType;
            default:
                throw new Error("Unknown join type: " + joinType);
        }
    }

    static getShapeEnum(shapeType: ShapeType): TopAbs_ShapeEnum {
        switch (shapeType) {
            case ShapeType.Compound:
                return occ.TopAbs_ShapeEnum.TopAbs_COMPOUND as TopAbs_ShapeEnum;
            case ShapeType.CompoundSolid:
                return occ.TopAbs_ShapeEnum.TopAbs_COMPSOLID as TopAbs_ShapeEnum;
            case ShapeType.Solid:
                return occ.TopAbs_ShapeEnum.TopAbs_SOLID as TopAbs_ShapeEnum;
            case ShapeType.Shell:
                return occ.TopAbs_ShapeEnum.TopAbs_SHELL as TopAbs_ShapeEnum;
            case ShapeType.Face:
                return occ.TopAbs_ShapeEnum.TopAbs_FACE as TopAbs_ShapeEnum;
            case ShapeType.Wire:
                return occ.TopAbs_ShapeEnum.TopAbs_WIRE as TopAbs_ShapeEnum;
            case ShapeType.Edge:
                return occ.TopAbs_ShapeEnum.TopAbs_EDGE as TopAbs_ShapeEnum;
            case ShapeType.Vertex:
                return occ.TopAbs_ShapeEnum.TopAbs_VERTEX as TopAbs_ShapeEnum;
            case ShapeType.Shape:
                return occ.TopAbs_ShapeEnum.TopAbs_SHAPE as TopAbs_ShapeEnum;
            default:
                throw new Error("Unknown shape type: " + shapeType);
        }
    }

    static wrapShape(shape: TopoDS_Shape, id: string = Id.generate()): IShape {
        switch (shape.ShapeType()) {
            case occ.TopAbs_ShapeEnum.TopAbs_COMPOUND:
                return new OccCompound(occ.TopoDS.Compound_1(shape), id);
            case occ.TopAbs_ShapeEnum.TopAbs_COMPSOLID:
                return new OccCompoundSolid(occ.TopoDS.CompSolid_1(shape), id);
            case occ.TopAbs_ShapeEnum.TopAbs_SOLID:
                return new OccSolid(occ.TopoDS.Solid_1(shape), id);
            case occ.TopAbs_ShapeEnum.TopAbs_SHELL:
                return new OccShell(occ.TopoDS.Shell_1(shape), id);
            case occ.TopAbs_ShapeEnum.TopAbs_FACE:
                return new OccFace(occ.TopoDS.Face_1(shape), id);
            case occ.TopAbs_ShapeEnum.TopAbs_WIRE:
                return new OccWire(occ.TopoDS.Wire_1(shape), id);
            case occ.TopAbs_ShapeEnum.TopAbs_EDGE:
                return new OccEdge(occ.TopoDS.Edge_1(shape), id);
            case occ.TopAbs_ShapeEnum.TopAbs_VERTEX:
                return new OccVertex(occ.TopoDS.Vertex_1(shape), id);
            default:
                return new OccShape(shape, id);
        }
    }

    static getActualShape(shape: TopoDS_Shape): TopoDS_Shape {
        switch (shape.ShapeType()) {
            case occ.TopAbs_ShapeEnum.TopAbs_COMPOUND:
                return occ.TopoDS.Compound_1(shape);
            case occ.TopAbs_ShapeEnum.TopAbs_COMPSOLID:
                return occ.TopoDS.CompSolid_1(shape);
            case occ.TopAbs_ShapeEnum.TopAbs_SOLID:
                return occ.TopoDS.Solid_1(shape);
            case occ.TopAbs_ShapeEnum.TopAbs_SHELL:
                return occ.TopoDS.Shell_1(shape);
            case occ.TopAbs_ShapeEnum.TopAbs_FACE:
                return occ.TopoDS.Face_1(shape);
            case occ.TopAbs_ShapeEnum.TopAbs_WIRE:
                return occ.TopoDS.Wire_1(shape);
            case occ.TopAbs_ShapeEnum.TopAbs_EDGE:
                return occ.TopoDS.Edge_1(shape);
            case occ.TopAbs_ShapeEnum.TopAbs_VERTEX:
                return occ.TopoDS.Vertex_1(shape);
            default:
                return shape;
        }
    }

    static findAncestors(subShape: TopoDS_Shape, from: TopoDS_Shape, ancestorType: TopAbs_ShapeEnum) {
        let map = new occ.TopTools_IndexedDataMapOfShapeListOfShape_1();
        occ.TopExp.MapShapesAndAncestors(from, subShape.ShapeType(), ancestorType, map);
        const index = map.FindIndex(subShape);
        let item = map.FindFromIndex(index);
        let shapes: TopoDS_Shape[] = [];
        while (!item.IsEmpty()) {
            shapes.push(this.getActualShape(item.Last_1()));
            item.RemoveFirst();
        }
        return shapes;
    }

    static *findSubShapes(
        shape: TopoDS_Shape,
        shapeType: TopAbs_ShapeEnum,
        unique: boolean,
    ): IterableIterator<TopoDS_Shape> {
        const explorer = new occ.TopExp_Explorer_2(
            shape,
            shapeType,
            occ.TopAbs_ShapeEnum.TopAbs_SHAPE as TopAbs_ShapeEnum,
        );
        const hashes = unique ? new Map() : undefined;
        while (explorer.More()) {
            const item = explorer.Current();
            if (unique) {
                const hash = OccHelps.hashCode(item);
                if (!hashes!.has(hash)) {
                    hashes!.set(hash, true);
                    yield this.getActualShape(item);
                }
            } else {
                yield item;
            }
            explorer.Next();
        }
    }
}
