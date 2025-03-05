import * as fs from "fs";
import * as path from "path";

type AnimationNodeData = {
  times: number[]; // Shared time array
  rotations: Record<string, number[][]>; // Rotations indexed by frame
};

const animations: Record<string, AnimationNodeData> = {};

export const parseGLTF = (gltfFile: string) => {
  const rawData = fs.readFileSync(gltfFile, "utf8");
  const gltf = JSON.parse(rawData);
  const inputDir = path.dirname(gltfFile);

  // Locate the .bin file if needed
  const binFileName = gltf.buffers?.[0]?.uri;
  const binFilePath = binFileName ? path.join(inputDir, binFileName) : null;
  let binData: Buffer | null = null;

  if (binFilePath && fs.existsSync(binFilePath)) {
    binData = fs.readFileSync(binFilePath);
    console.log(`📂 Loaded external binary data from: ${binFilePath}`);
  } else if (!binFileName) {
    console.log(`📂 Using embedded binary data.`);
    binData = Buffer.from(gltf.buffers[0].byteLength);
  } else {
    throw new Error(`❌ Missing .bin file: ${binFilePath}`);
  }

  return extractAllAnimations(gltf, binData);
};

// Extracts all animations, grouping them efficiently
const extractAllAnimations = (gltf: any, binData: Buffer) => {
  if (!gltf.animations || gltf.animations.length === 0) {
    console.warn("⚠️ No animations found.");
    return null;
  }

  const round = (num: number, precision: number) =>
    Number(num.toFixed(precision));

  const animations: Record<string, AnimationNodeData> = {};

  gltf.animations.forEach((animation: any) => {
    const animationName =
      animation.name || `Animation${Object.keys(animations).length}`;
    animations[animationName] = { times: [], rotations: {} };

    let sharedTimeData: number[] | null = null;

    animation.channels.forEach((channel: any) => {
      if (channel.target.path !== "rotation") return;

      const node = gltf.nodes[channel.target.node];
      const nodeName = node.name || `Node${channel.target.node}`;
      const sampler = animation.samplers[channel.sampler];

      // Extract time values
      const timeAccessor = gltf.accessors[sampler.input];
      const timeBufferView = gltf.bufferViews[timeAccessor.bufferView];
      const timeData = new Float32Array(
        binData.buffer,
        timeBufferView.byteOffset,
        timeAccessor.count
      );

      // Extract rotation keyframes (quaternions)
      const rotationAccessor = gltf.accessors[sampler.output];
      const rotationBufferView = gltf.bufferViews[rotationAccessor.bufferView];
      const rotationData = new Float32Array(
        binData.buffer,
        rotationBufferView.byteOffset,
        rotationAccessor.count * 4 // 4 values per quaternion
      );

      // Store times once per animation (rounded to 4 decimal places)
      if (!sharedTimeData) {
        sharedTimeData = Array.from(timeData).map((t) => round(t, 4));
        animations[animationName].times = sharedTimeData;
      }

      // Store rotations as tuples indexed by frame (rounded to 5 decimal places)
      animations[animationName].rotations[nodeName] = [];
      for (let i = 0; i < timeAccessor.count; i++) {
        animations[animationName].rotations[nodeName].push([
          round(rotationData[i * 4], 5),
          round(rotationData[i * 4 + 1], 5),
          round(rotationData[i * 4 + 2], 5),
          round(rotationData[i * 4 + 3], 5),
        ]);
      }
    });
  });

  return animations;
};
