import { defineConfig } from "@twind/core";
import presetAutoprefix from "https://esm.sh/@twind/preset-autoprefix@1.0.7";
// @deno-types="https://unpkg.com/@twind/preset-radix-ui@1.0.7/colors.d.ts"
import * as colors from "https://unpkg.com/@twind/preset-radix-ui@1.0.7/colors.js";
import darkColor from "https://esm.sh/@twind/preset-radix-ui@1.0.7/darkColor";
import presetTailwind from "https://esm.sh/@twind/preset-tailwind@1.1.4/base";

export default defineConfig({
  presets: [
    presetAutoprefix(),
    presetTailwind({
      colors: {
        brand: colors.cyan,
        brandDark: colors.cyanDark,
        accent: colors.plum,
        accentDark: colors.plumDark,
        neutral: colors.slate,
        neutralDark: colors.slateDark,
        error: colors.tomato,
        errorDark: colors.tomatoDark,
        success: colors.green,
        successDark: colors.greenDark,
        warning: colors.amber,
        warningDark: colors.amberDark,
      },
    }),
  ],
  darkColor,
});

export const configURL = import.meta.url;
