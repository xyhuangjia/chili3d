// Copyright 2022-2023 the Chili authors. All rights reserved. AGPL-3.0 license.

import { ClassMap, ISerialize, Serialized, Serializer } from "../serialize";
import { MathUtils } from "./mathUtils";
import { Plane } from "./plane";
import { Quaternion } from "./quaternion";
import { XYZ } from "./xyz";

/**
 * Matrix in column-major order
 */
@ClassMap.key("Matrix4")
export class Matrix4 implements ISerialize {
    private readonly array: Float32Array = new Float32Array(16);

    public determinant(): number {
        let [a00, a01, a02, a03] = [this.array[0], this.array[1], this.array[2], this.array[3]];
        let [a10, a11, a12, a13] = [this.array[4], this.array[5], this.array[6], this.array[7]];
        let [a20, a21, a22, a23] = [this.array[8], this.array[9], this.array[10], this.array[11]];
        let [a30, a31, a32, a33] = [this.array[12], this.array[13], this.array[14], this.array[15]];

        let b0 = a00 * a11 - a01 * a10;
        let b1 = a00 * a12 - a02 * a10;
        let b2 = a01 * a12 - a02 * a11;
        let b3 = a20 * a31 - a21 * a30;
        let b4 = a20 * a32 - a22 * a30;
        let b5 = a21 * a32 - a22 * a31;
        let b6 = a00 * b5 - a01 * b4 + a02 * b3;
        let b7 = a10 * b5 - a11 * b4 + a12 * b3;
        let b8 = a20 * b2 - a21 * b1 + a22 * b0;
        let b9 = a30 * b2 - a31 * b1 + a32 * b0;

        return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
    }

    serialize(): Serialized {
        return {
            classKey: "Matrix4",
            constructorParameters: {
                array: this.toArray(),
            },
            properties: {},
        };
    }

    @Serializer.deserializer()
    static from({ array }: { array: number[] }) {
        return Matrix4.fromArray(array);
    }

    public toArray(): readonly number[] {
        return [...this.array];
    }

    public add(other: Matrix4): Matrix4 {
        let result = new Matrix4();
        for (let index = 0; index < 16; index++) {
            result.array[index] = this.array[index] + other.array[index];
        }
        return result;
    }

    public invert(): Matrix4 | undefined {
        let [a00, a01, a02, a03] = [this.array[0], this.array[1], this.array[2], this.array[3]];
        let [a10, a11, a12, a13] = [this.array[4], this.array[5], this.array[6], this.array[7]];
        let [a20, a21, a22, a23] = [this.array[8], this.array[9], this.array[10], this.array[11]];
        let [a30, a31, a32, a33] = [this.array[12], this.array[13], this.array[14], this.array[15]];
        let b00 = a00 * a11 - a01 * a10;
        let b01 = a00 * a12 - a02 * a10;
        let b02 = a00 * a13 - a03 * a10;
        let b03 = a01 * a12 - a02 * a11;
        let b04 = a01 * a13 - a03 * a11;
        let b05 = a02 * a13 - a03 * a12;
        let b06 = a20 * a31 - a21 * a30;
        let b07 = a20 * a32 - a22 * a30;
        let b08 = a20 * a33 - a23 * a30;
        let b09 = a21 * a32 - a22 * a31;
        let b10 = a21 * a33 - a23 * a31;
        let b11 = a22 * a33 - a23 * a32;

        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (det === 0) return undefined;
        det = 1.0 / det;

        return Matrix4.fromArray([
            (a11 * b11 - a12 * b10 + a13 * b09) * det,
            (a02 * b10 - a01 * b11 - a03 * b09) * det,
            (a31 * b05 - a32 * b04 + a33 * b03) * det,
            (a22 * b04 - a21 * b05 - a23 * b03) * det,
            (a12 * b08 - a10 * b11 - a13 * b07) * det,
            (a00 * b11 - a02 * b08 + a03 * b07) * det,
            (a32 * b02 - a30 * b05 - a33 * b01) * det,
            (a20 * b05 - a22 * b02 + a23 * b01) * det,
            (a10 * b10 - a11 * b08 + a13 * b06) * det,
            (a01 * b08 - a00 * b10 - a03 * b06) * det,
            (a30 * b04 - a31 * b02 + a33 * b00) * det,
            (a21 * b02 - a20 * b04 - a23 * b00) * det,
            (a11 * b07 - a10 * b09 - a12 * b06) * det,
            (a00 * b09 - a01 * b07 + a02 * b06) * det,
            (a31 * b01 - a30 * b03 - a32 * b00) * det,
            (a20 * b03 - a21 * b01 + a22 * b00) * det,
        ]);
    }

    position(x: number, y: number, z: number): Matrix4 {
        let transform = this.clone();
        transform.array[12] = x;
        transform.array[13] = y;
        transform.array[14] = z;
        return transform;
    }

    getPosition(): XYZ {
        return new XYZ(this.array[12], this.array[13], this.array[14]);
    }

    scale(x: number, y: number, z: number) {
        let matrix = this.clone();
        matrix.array[0] = x;
        matrix.array[5] = y;
        matrix.array[10] = z;
        return matrix;
    }

    getScale(): XYZ {
        let m11 = this.array[0];
        let m12 = this.array[1];
        let m13 = this.array[2];
        let m21 = this.array[4];
        let m22 = this.array[5];
        let m23 = this.array[6];
        let m31 = this.array[8];
        let m32 = this.array[9];
        let m33 = this.array[10];

        let sx = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
        const det = this.determinant();
        if (det < 0) {
            sx = -sx;
        }

        return new XYZ(
            sx,
            Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23),
            Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33),
        );
    }

    eulerAngles(pitch: number, yaw: number, roll: number) {
        let matrix = this.clone();
        const sp = Math.sin(pitch);
        const cp = Math.cos(pitch);
        const sy = Math.sin(yaw);
        const cy = Math.cos(yaw);
        const sr = Math.sin(roll);
        const cr = Math.cos(roll);
        matrix.array[0] = cy * cr + sy * sp * sr;
        matrix.array[1] = cp * sr;
        matrix.array[2] = -sy * cr + cy * sp * sr;
        matrix.array[4] = cy * sr - sy * sp * cr;
        matrix.array[5] = cp * cr;
        matrix.array[6] = sy * sr + cy * sp * cr;
        matrix.array[8] = sy * cp;
        matrix.array[9] = -sp;
        matrix.array[10] = cy * cp;
        return matrix;
    }

    getEulerAngles(): { pitch: number; yaw: number; roll: number } {
        const pitch = -Math.asin(this.array[9]);
        let yaw = 0.0,
            roll = 0.0;
        if (this.array[9] < 1.0) {
            if (this.array[9] > -1.0) {
                yaw = Math.atan2(this.array[8], this.array[10]);
                roll = Math.atan2(this.array[1], this.array[5]);
            } else {
                yaw = -Math.atan2(-this.array[2], this.array[0]);
                roll = 0.0;
            }
        } else {
            yaw = Math.atan2(-this.array[2], this.array[0]);
            roll = 0.0;
        }
        return { pitch, yaw, roll };
    }

    getRotation() {
        const [m11, m12, m13] = [this.array[0], this.array[4], this.array[8]];
        const [m21, m22, m23] = [this.array[1], this.array[5], this.array[9]];
        const [m31, m32, m33] = [this.array[2], this.array[6], this.array[10]];
        const trace = m11 + m22 + m33;
        let s, x, y, z, w;
        if (trace > 0) {
            s = 0.5 / Math.sqrt(trace + 1.0);
            w = 0.25 / s;
            x = (m32 - m23) * s;
            y = (m13 - m31) * s;
            z = (m21 - m12) * s;
        } else if (m11 > m22 && m11 > m33) {
            s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
            w = (m32 - m23) / s;
            x = 0.25 * s;
            y = (m12 + m21) / s;
            z = (m13 + m31) / s;
        } else if (m22 > m33) {
            s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
            w = (m13 - m31) / s;
            x = (m12 + m21) / s;
            y = 0.25 * s;
            z = (m23 + m32) / s;
        } else {
            s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
            w = (m21 - m12) / s;
            x = (m13 + m31) / s;
            y = (m23 + m32) / s;
            z = 0.25 * s;
        }

        return new Quaternion(x, y, z, w);
    }

    public multiply(other: Matrix4): Matrix4 {
        const array = new Array(16).fill(0);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    array[i * 4 + j] += this.array[i * 4 + k] * other.array[k * 4 + j];
                }
            }
        }
        return Matrix4.fromArray(array);
    }

    public equals(value: Matrix4): boolean {
        for (let i = 0; i < 16; i++) {
            if (!MathUtils.almostEqual(this.array[i], value.array[i])) return false;
        }
        return true;
    }

    public clone(): Matrix4 {
        return Matrix4.fromArray([...this.array]);
    }

    public static fromArray(array: ArrayLike<number>): Matrix4 {
        let result = new Matrix4();
        for (let index = 0; index < 16; index++) {
            result.array[index] = array[index];
        }
        return result;
    }

    public static identity(): Matrix4 {
        return Matrix4.fromArray([
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
        ]);
    }

    public static zero(): Matrix4 {
        return Matrix4.fromArray(new Array(16).fill(0));
    }

    static compose(translation: XYZ, rotation: Quaternion, scale: XYZ): Matrix4 {
        let matrix = new Matrix4();
        const { x, y, z, w } = rotation;
        const x2 = x + x,
            y2 = y + y,
            z2 = z + z;
        const xx = x * x2,
            xy = x * y2,
            xz = x * z2;
        const yy = y * y2,
            yz = y * z2,
            zz = z * z2;
        const wx = w * x2,
            wy = w * y2,
            wz = w * z2;
        const sx = scale.x,
            sy = scale.y,
            sz = scale.z;

        matrix.array[0] = (1 - (yy + zz)) * sx;
        matrix.array[1] = (xy + wz) * sx;
        matrix.array[2] = (xz - wy) * sx;

        matrix.array[4] = (xy - wz) * sy;
        matrix.array[5] = (1 - (xx + zz)) * sy;
        matrix.array[6] = (yz + wx) * sy;

        matrix.array[8] = (xz + wy) * sz;
        matrix.array[9] = (yz - wx) * sz;
        matrix.array[10] = (1 - (xx + yy)) * sz;

        matrix.array[12] = translation.x;
        matrix.array[13] = translation.y;
        matrix.array[14] = translation.z;
        matrix.array[15] = 1;

        return matrix;
    }

    public static createRotationAt(center: XYZ, normal: XYZ, angle: number): Matrix4 {
        let unit = normal.normalize();
        if (unit === undefined) throw new TypeError("invalid vector");

        let { x, y, z } = unit;
        let s = Math.sin(-angle);
        let c = Math.cos(-angle);
        let t = 1 - c;

        const array = [
            t * x * x + c,
            t * x * y - z * s,
            t * x * z + y * s,
            0,
            t * x * y + z * s,
            t * y * y + c,
            t * y * z - x * s,
            0,
            t * x * z - y * s,
            t * y * z + x * s,
            t * z * z + c,
            0,
            0,
            0,
            0,
            1,
        ];

        array[12] = center.x - center.x * array[0] - center.y * array[4] - center.z * array[8];
        array[13] = center.y - center.x * array[1] - center.y * array[5] - center.z * array[9];
        array[14] = center.z - center.x * array[2] - center.y * array[6] - center.z * array[10];

        return Matrix4.fromArray(array);
    }

    public static createScale(x: number, y: number, z: number): Matrix4 {
        return Matrix4.fromArray([x, 0.0, 0.0, 0.0, 0.0, y, 0.0, 0.0, 0.0, 0.0, z, 0.0, 0.0, 0.0, 0.0, 1.0]);
    }

    public static createTranslation(x: number, y: number, z: number): Matrix4 {
        return Matrix4.fromArray([1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, x, y, z, 1.0]);
    }

    public static createMirrorWithPlane(plane: Plane): Matrix4 {
        let d = -plane.origin.dot(plane.normal);
        const x = plane.normal.x;
        const y = plane.normal.y;
        const z = plane.normal.z;
        const temp = -2 * x;
        const temp2 = -2 * y;
        const temp3 = -2 * z;
        return Matrix4.fromArray([
            temp * x + 1,
            temp2 * x,
            temp3 * x,
            0.0,
            temp * y,
            temp2 * y + 1,
            temp3 * y,
            0.0,
            temp * z,
            temp2 * z,
            temp3 * z + 1,
            0.0,
            temp * d,
            temp2 * d,
            temp3 * d,
            1.0,
        ]);
    }

    public transpose(): Matrix4 {
        let result = new Matrix4();
        result.array[0] = this.array[0];
        result.array[1] = this.array[4];
        result.array[2] = this.array[8];
        result.array[3] = this.array[12];

        result.array[4] = this.array[1];
        result.array[5] = this.array[5];
        result.array[6] = this.array[9];
        result.array[7] = this.array[13];

        result.array[8] = this.array[2];
        result.array[9] = this.array[6];
        result.array[10] = this.array[10];
        result.array[11] = this.array[14];

        result.array[12] = this.array[3];
        result.array[13] = this.array[7];
        result.array[14] = this.array[11];
        result.array[15] = this.array[15];

        return result;
    }

    ofPoints(points: number[]): number[] {
        let result: number[] = [];
        for (let i = 0; i < points.length / 3; i++) {
            let x =
                points[3 * i] * this.array[0] +
                points[3 * i + 1] * this.array[4] +
                points[3 * i + 2] * this.array[8] +
                this.array[12];
            let y =
                points[3 * i] * this.array[1] +
                points[3 * i + 1] * this.array[5] +
                points[3 * i + 2] * this.array[9] +
                this.array[13];
            let z =
                points[3 * i] * this.array[2] +
                points[3 * i + 1] * this.array[6] +
                points[3 * i + 2] * this.array[10] +
                this.array[14];
            let w =
                points[3 * i] * this.array[3] +
                points[3 * i + 1] * this.array[7] +
                points[3 * i + 2] * this.array[11] +
                this.array[15];
            result.push(x / w, y / w, z / w);
        }
        return result;
    }

    public ofPoint(point: XYZ): XYZ {
        let result = this.ofPoints([point.x, point.y, point.z]);
        return new XYZ(result[0], result[1], result[2]);
    }

    public ofVector(vector: XYZ): XYZ {
        let x = vector.x * this.array[0] + vector.y * this.array[4] + vector.z * this.array[8];
        let y = vector.x * this.array[1] + vector.y * this.array[5] + vector.z * this.array[9];
        let z = vector.x * this.array[2] + vector.y * this.array[6] + vector.z * this.array[10];
        return new XYZ(x, y, z);
    }
}
