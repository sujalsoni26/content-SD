// Removes the .next build folder before a production build.
// Why: inside a OneDrive-synced folder, OneDrive turns directories into cloud placeholders (reparse points).
// Node treats those as symlinks and fails with EPERM when Next.js clears its old output, so a second
// build in the same folder breaks. Windows' own rmdir handles placeholders correctly.
import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const dir = ".next";
if (existsSync(dir)) {
  if (process.platform === "win32") {
    spawnSync("cmd", ["/c", "rmdir", "/s", "/q", dir], { stdio: "inherit" });
  } else {
    rmSync(dir, { recursive: true, force: true });
  }
}
if (existsSync(dir)) {
  console.error(`Could not remove ${dir}. Close any running "next dev"/"next start" and try again.`);
  process.exit(1);
}
