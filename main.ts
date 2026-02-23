#!/usr/bin/env -S ${HOME}/.local/share/mise/shims/deno run --allow-all

import $ from "dax";
import yargs from "yargs";

type Win = Record<string, unknown>;

function getStr(o: Win, keys: string[]) {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string") return v;
  }
}

function getNum(o: Win, keys: string[]) {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number") return v;
    if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  }
}

const argv = await yargs(Deno.args)
  .usage("Usage: $0 <next|prev> [--debug]")
  .command("next", "Cycle to next window")
  .command("prev", "Cycle to previous window")
  .option("debug", {
    alias: "d",
    type: "boolean",
    default: false,
    description: "Enable debug logging",
  })
  .demandCommand(1, "direction (next|prev) is required")
  .strict()
  .help()
  .parseAsync();

const dir = argv._[0] as string;
if (!["next", "prev"].includes(dir)) {
  console.error("direction must be next|prev");
  Deno.exit(1);
}

const debug = (msg: string, ...data: unknown[]) => {
  if (argv.debug) console.debug(`[DEBUG] ${msg}`, ...data);
};

/* 1. フォーカス中のウィンドウ取得 */

const focused: Win[] = JSON.parse(
  await $`aerospace list-windows --focused --json`.text(),
);
if (!focused[0]) {
  console.error("No focused window");
  Deno.exit(1);
}

const focusedId = getNum(focused[0], ["window-id", "window_id", "id"]);
const focusedApp = getStr(focused[0], ["app-name", "app_name", "app"]);
debug("focusedId=%o, focusedApp=%s", focusedId, focusedApp);

if (!focusedId || !focusedApp) {
  console.error("Cannot determine focused window");
  Deno.exit(1);
}

/* 2. 同一アプリのウィンドウ一覧取得 */

const windows: Win[] = JSON.parse(
  await $`aerospace list-windows --monitor focused --json`.text(),
);
debug("windows=%o", windows);

const ids = windows
  .filter(
    (w) =>
      getStr(w, ["app-name", "app_name", "app"])?.toLowerCase() ===
      focusedApp.toLowerCase(),
  )
  .map((w) => getNum(w, ["window-id", "window_id", "id"])!)
  .filter((id) => id !== undefined);
debug("same app window ids=%o", ids);

if (ids.length <= 1) {
  debug("only one window, nothing to cycle");
  Deno.exit(0);
}

/* 3. 次のウィンドウにフォーカス */

const idx = ids.indexOf(focusedId);
const n = ids.length;
const nextId =
  dir === "next" ? ids[(idx + 1) % n] : ids[(idx - 1 + n) % n];
debug("focusing window id=%d (idx=%d, dir=%s)", nextId, idx, dir);

await $`aerospace focus --window-id ${nextId}`;
