#!/usr/bin/env -S deno run --quiet --allow-run

import $ from "dax";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

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

const argv = await yargs(hideBin(Deno.args))
  .usage("Usage: $0 <next|prev> <app...>")
  .command("next <app..>", "Cycle to next window of the given app(s)")
  .command("prev <app..>", "Cycle to previous window of the given app(s)")
  .option("debug", {
    alias: "d",
    type: "boolean",
    default: false,
    description: "Enable debug logging",
  })
  .demandCommand(1, "dir (next|prev) and at least one app name are required")
  .strict()
  .help()
  .parse();

const debug = (msg: string, ...data: unknown[]) => {
  if (argv.debug) console.debug(`[DEBUG] ${msg}`, ...data);
};

const [dir, ...apps] = argv._ as [string, ...string[]];
if (!["next", "prev"].includes(dir)) {
  console.error("dir must be next|prev");
  Deno.exit(1);
}

const needles = apps.map((a) => String(a).toLowerCase());
debug("dir=%s, apps=%o, needles=%o", dir, apps, needles);

/* --------------------------
   1. ウィンドウ一覧取得
--------------------------- */

const windows: Win[] = JSON.parse(
  await $`aerospace list-windows --monitor focused --json`.text()
);
debug("windows=%o", windows);

/* --------------------------
   2. フォーカス中取得
--------------------------- */

let focusedId: number | undefined;

try {
  const focused: Win[] = JSON.parse(
    await $`aerospace list-windows --focused --json`.text()
  );
  if (focused[0]) {
    focusedId = getNum(focused[0], ["window-id", "window_id", "id"]);
  }
  debug("focusedId=%o", focusedId);
} catch {
  debug("no focused window");
}

/* --------------------------
   3. 対象アプリ絞り込み
--------------------------- */

const targets = windows
  .map((w) => {
    const id = getNum(w, ["window-id", "window_id", "id"]);
    const app =
      getStr(w, ["app-name", "app_name", "app"])?.toLowerCase() ?? "";
    return { id, app };
  })
  .filter((w) => w.id && needles.some((n) => w.app.includes(n)));

debug("targets=%o", targets);

if (targets.length === 0) {
  console.error("No matching windows");
  Deno.exit(1);
}

const ids = targets.map((t) => t.id!) as number[];

const idx = focusedId ? ids.indexOf(focusedId) : -1;

let nextId: number;
if (idx < 0) {
  nextId = ids[0];
} else {
  const n = ids.length;
  nextId =
    dir === "next"
      ? ids[(idx + 1) % n]
      : ids[(idx - 1 + n) % n];
}

/* --------------------------
   4. フォーカス実行
--------------------------- */

debug("focusing window id=%d (idx=%d, dir=%s)", nextId, idx, dir);
await $`aerospace focus --window-id ${nextId}`;