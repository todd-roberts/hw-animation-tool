"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quaternionToEuler = void 0;
const quaternionToEuler = (q) => {
    const [x, y, z, w] = q;
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);
    const sinp = 2 * (w * y - z * x);
    const pitch = Math.abs(sinp) >= 1 ? (Math.sign(sinp) * Math.PI) / 2 : Math.asin(sinp);
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);
    return [
        roll * (180 / Math.PI),
        pitch * (180 / Math.PI),
        yaw * (180 / Math.PI),
    ];
};
exports.quaternionToEuler = quaternionToEuler;
