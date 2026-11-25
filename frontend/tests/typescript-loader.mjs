import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { transform } from "sucrase";
registerHooks({
  load(url, context, nextLoad) {
    if (!url.endsWith(".ts")) return nextLoad(url, context);
    return {
      format: "module",
      source: transform(readFileSync(new URL(url), "utf8"), {
        transforms: ["typescript"],
      }).code,
      shortCircuit: true,
    };
  },
});
