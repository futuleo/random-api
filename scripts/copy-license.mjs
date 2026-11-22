import { copyFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const destination = process.argv[2];
if (destination !== "LICENSE" && destination !== "public/LICENSE.txt")
  throw new TypeError(
    "License destination must be LICENSE or public/LICENSE.txt.",
  );
await mkdir(dirname(destination), { recursive: true });
await copyFile(new URL("../LICENSE", import.meta.url), destination);
