import * as fs from "fs";
import * as path from "path";

import { parseGLTF } from "./parseGLTF";

const INPUT_DIR = path.join(__dirname, "../input");
const OUTPUT_DIR = path.join(__dirname, "../output");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const getGLTFFromInput = (): string | null => {
  const files = fs
    .readdirSync(INPUT_DIR)
    .filter((file) => file.endsWith(".gltf"));
  return files.length > 0 ? path.join(INPUT_DIR, files[0]) : null;
};

const main = () => {
  const gltfFile = getGLTFFromInput();

  if (!gltfFile) {
    console.error("❌ No .gltf file found in /input. Please add one.");
    return;
  }

  console.log(`🔍 Processing file: ${gltfFile}`);
  const parsedData = parseGLTF(gltfFile);

  if (!parsedData) {
    console.error("❌ Failed to parse animations.");
    return;
  }

  // Write JSON output file
  const jsonOutputFile = path.join(
    OUTPUT_DIR,
    path.basename(gltfFile, ".gltf") + ".json"
  );
  fs.writeFileSync(jsonOutputFile, JSON.stringify(parsedData, null, 2));

  // Write TS file
  const tsOutputFile = path.join(
    OUTPUT_DIR,
    path.basename(gltfFile, ".gltf") + ".ts"
  );
  const tsContent = `export const animations = ${JSON.stringify(
    parsedData,
    null,
    2
  )} as const;`;
  fs.writeFileSync(tsOutputFile, tsContent);

  console.log(`✅ JSON output written: ${jsonOutputFile}`);
  console.log(`✅ TypeScript output written: ${tsOutputFile}`);
};

main();
