import { AnimationChannel, NodeIO } from "@gltf-transform/core";

import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);

type QuaternionFrames = [number, number, number, number][];
type Vector3Frames = [number, number, number][];

export type AnimationData = {
  [animationName: string]: AnimationNodeData;
};

export type AnimationNodeData = {
  times: number[]; // Shared time array across all nodes
  rotations: Record<string, QuaternionFrames>; // Per-node rotations
  positions: Record<string, Vector3Frames>; // Per-node positions
};

// Don't round for now
const round = (num: number, precision: number) => num;

export const parseGLTF = async (file: string) => {
  const document = await io.read(file);
  const animations: AnimationData = {};

  for (const animation of document.getRoot().listAnimations()) {
    const animationName =
      animation.getName() || `Animation${Object.keys(animations).length}`;
    const channels: AnimationChannel[] = animation.listChannels();

    let sharedTimeData: number[] = [];

    const rotations: Record<string, QuaternionFrames> = {};
    const positions: Record<string, Vector3Frames> = {};

    // Determine the longest time array
    for (const channel of channels) {
      const sampler = channel.getSampler();
      const times = sampler?.getInput()?.getArray();
      if (!times) continue;

      const roundedTimes = Array.from(times).map((t) => round(t, 4));
      if (roundedTimes.length > sharedTimeData.length) {
        sharedTimeData = roundedTimes;
      }
    }

    for (const channel of channels) {
      const sampler = channel.getSampler();
      const node = channel.getTargetNode();
      const targetPath = channel.getTargetPath();

      if (!sampler || !node) continue;
      const nodeName = node.getName();

      const times = sampler.getInput()?.getArray();
      const values = sampler.getOutput()?.getArray();

      if (!times || !values) continue;

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
