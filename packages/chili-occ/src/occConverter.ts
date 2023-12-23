// Copyright 2022-2023 the Chili authors. All rights reserved. AGPL-3.0 license.

import { IShape, IShapeConverter, Result } from "chili-core";
import { OccHelps } from "./occHelps";
import { OccShape } from "./occShape";

export class OccShapeConverter implements IShapeConverter {
    convertToBrep(shape: IShape): Result<string> {
        if (!(shape instanceof OccShape)) return Result.error("shape is not an OccShape");
        const fileName = "blob.brep";
        const progress = new occ.Message_ProgressRange_1();
        occ.BRepTools.Write_3(shape.shape, fileName, progress);
        const file = occ.FS.readFile("/" + fileName, { encoding: "utf8" });
        occ.FS.unlink("/" + fileName);
        return Result.success(file);
    }

    convertFromBrep(brep: string): Result<IShape> {
        const fileName = `blob.brep`;
        occ.FS.createDataFile("/", fileName, brep, true, true, true);
        const progress = new occ.Message_ProgressRange_1();
        const builder = new occ.BRep_Builder();
        const shape = new occ.TopoDS_Shape();
        occ.BRepTools.Read_2(shape, fileName, builder, progress);
        occ.FS.unlink("/" + fileName);
        return Result.success(OccHelps.getShape(shape));
    }

    convertToIGES(...shapes: IShape[]): Result<string> {
        const fileName = "blob.iges";
        let writer = new occ.IGESControl_Writer_1();
        const progress = new occ.Message_ProgressRange_1();
        for (const s of shapes) {
            if (s instanceof OccShape) {
                writer.AddShape(s.shape, progress);
            } else {
                throw new Error("Unsupported shape type");
            }
        }
        writer.ComputeModel();
        let success = writer.Write_2(fileName, false);
        const file = occ.FS.readFile("/" + fileName, { encoding: "utf8" });
        occ.FS.unlink("/" + fileName);
        return success ? Result.success(file) : Result.error("export IGES error");
    }

    convertFromIGES(data: string) {
        return this.convertFrom("iges", data);
    }

    convertToSTEP(...shapes: IShape[]): Result<string> {
        const fileName = "blob.step";
        let writer = new occ.STEPControl_Writer_1();
        const progress = new occ.Message_ProgressRange_1();
        for (const s of shapes) {
            if (s instanceof OccShape) {
                let status = writer.Transfer(s.shape, 0 as any, true, progress);
                if (status !== occ.IFSelect_ReturnStatus.IFSelect_RetDone) {
                    return Result.error("Transfer failed");
                }
            } else {
                return Result.error("Unsupported shape type");
            }
        }
        let result = writer.Write(fileName);
        let stepFileText = occ.FS.readFile("/" + fileName, { encoding: "utf8" });
        occ.FS.unlink("/" + fileName);
        if (result === occ.IFSelect_ReturnStatus.IFSelect_RetDone) {
            return Result.success(stepFileText);
        } else {
            return Result.error("WRITE STEP FILE FAILED.");
        }
    }

    convertFromSTEP(data: string) {
        return this.convertFrom("step", data);
    }

    /**
     * 如果原 IWire 仅由一个 IEdge 组成，则从 IWre 反序列化时，会变为 IEdge。暂时认为不是 bug！！！
     * @param format
     * @param data
     * @returns
     */
    private convertFrom(format: "step" | "iges", data: string): Result<IShape[]> {
        const fileName = `blob.${format}`;
        let reader = format === "step" ? new occ.STEPControl_Reader_1() : new occ.IGESControl_Reader_1();
        occ.FS.createDataFile("/", fileName, data, true, true, true);
        let readResult = reader.ReadFile(fileName);
        occ.FS.unlink("/" + fileName);
        if (readResult === occ.IFSelect_ReturnStatus.IFSelect_RetDone) {
            const progress = new occ.Message_ProgressRange_1();
            reader.TransferRoots(progress);
            let shapes: IShape[] = [];
            for (let i = 1; i <= reader.NbShapes(); i++) {
                let shape = reader.Shape(i);
                if (shape instanceof occ.TopoDS_Shape) {
                    shapes.push(OccHelps.getShape(shape));
                }
            }
            return Result.success(shapes);
        } else {
            return Result.error(`Cannot load ${format}`);
        }
    }
}
