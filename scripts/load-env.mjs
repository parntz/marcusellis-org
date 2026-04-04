import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const root = process.cwd();
if (existsSync(resolve(root, ".env"))) {
  config({ path: resolve(root, ".env") });
}
if (existsSync(resolve(root, ".env.local"))) {
  config({ path: resolve(root, ".env.local"), override: true });
}
