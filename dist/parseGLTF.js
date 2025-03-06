"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGLTF = void 0;
const core_1 = require("@gltf-transform/core");
const extensions_1 = require("@gltf-transform/extensions");
const io = new core_1.NodeIO().registerExtensions(extensions_1.KHRONOS_EXTENSIONS);
// Don't round for now
const round = (num, precision) => num;
const parseGLTF = async (file) => {
    const document = await io.read(file);
    const animations = {};
    for (const animation of document.getRoot().listAnimations()) {
        const animationName = animation.getName() || `Animation${Object.keys(animations).length}`;
        const channels = animation.listChannels();
        let sharedTimeData = [];
        const rotations = {};
        const positions = {};
        // Determine the longest time array
        for (const channel of channels) {
            const sampler = channel.getSampler();
            const times = sampler?.getInput()?.getArray();
            if (!times)
                continue;
            const roundedTimes = Array.from(times).map((t) => round(t, 4));
            if (roundedTimes.length > sharedTimeData.length) {
                sharedTimeData = roundedTimes;
            }
        }
        for (const channel of channels) {
            const sampler = channel.getSampler();
            const node = channel.getTargetNode();
            const targetPath = channel.getTargetPath();
            if (!sampler || !node)
                continue;
            const nodeName = node.getName();
            const times = sampler.getInput()?.getArray();
            const values = sampler.getOutput()?.getArray();
            if (!times || !values)
                continue;
            switch (targetPath) {
                case "rotation":
                    rotations[nodeName] = [];
                    for (let i = 0; i < values.length; i += 4) {
                        rotations[nodeName].push([
                            round(values[i], 5),
                            round(values[i + 1], 5),
                            round(values[i + 2], 5),
                            round(values[i + 3], 5),
                        ]);
                    }
                    break;
                case "translation":
                    positions[nodeName] = [];
                    for (let i = 0; i < values.length; i += 3) {
                        positions[nodeName].push([
                            round(values[i], 5),
                            round(values[i + 1], 5),
                            round(values[i + 2], 5),
                        ]);
                    }
                    break;
            }
        }
        animations[animationName] = {
            times: sharedTimeData,
            rotations,
            positions,
        };
    }
    console.log(JSON.stringify(animations, null, 2)); // Log for debugging
    return animations;
};
exports.parseGLTF = parseGLTF;
