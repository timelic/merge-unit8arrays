import { defineConfig } from "father";

export default defineConfig({
  esm: { input: "src" },
  cjs: { input: "src" },
  umd: {
    entry: "src/common/index", // 默认构建入口文件
  },
});
