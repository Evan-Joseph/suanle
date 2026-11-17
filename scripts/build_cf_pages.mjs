#!/usr/bin/env node
/**
 * 零破坏双模静态导出构建脚本：
 * 1. 构建前将 Next.js API Route Handlers (src/app/api) 暂存至 .cache/api_route_stash，
 *    使 `output: "export"` 能顺利生成纯粹前端静态资源到 ./out/；
 * 2. 注册 exit/SIGINT/SIGTERM 恢复保护，确保无论成功或失败 src/app/api 100% 原位恢复；
 * 3. 在 out/_headers 写入 Cloudflare Pages 生产安全响应头，并校验零 sk- 密钥泄漏。
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const apiDir = path.join(root, "src", "app", "api");
const stashDir = path.join(root, ".cache", "api_route_stash");
const outDir = path.join(root, "out");

let stashed = false;

function restoreApiDir() {
  if (stashed && fs.existsSync(stashDir) && !fs.existsSync(apiDir)) {
    fs.renameSync(stashDir, apiDir);
    stashed = false;
  }
}

for (const sig of ["SIGINT", "SIGTERM", "exit"]) {
  process.on(sig, () => {
    restoreApiDir();
    if (sig !== "exit") process.exit(1);
  });
}

function scanSecrets(dir) {
  const stack = [dir];
  const re = /sk-[a-zA-Z0-9]{20,}/;
  while (stack.length > 0) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
      } else if (/\.(html|js|css|json|txt|webmanifest)$/i.test(ent.name)) {
        const text = fs.readFileSync(p, "utf8");
        if (re.test(text)) {
          throw new Error(`Secret pattern detected in static export: ${p}`);
        }
      }
    }
  }
}

function main() {
  if (fs.existsSync(stashDir) && !fs.existsSync(apiDir)) {
    fs.renameSync(stashDir, apiDir);
  }
  if (fs.existsSync(apiDir)) {
    fs.mkdirSync(path.dirname(stashDir), { recursive: true });
    if (fs.existsSync(stashDir)) {
      fs.rmSync(stashDir, { recursive: true, force: true });
    }
    fs.renameSync(apiDir, stashDir);
    stashed = true;
  }

  try {
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
    execSync("npx next build", {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, NEXT_STATIC_EXPORT: "1" },
    });
  } finally {
    restoreApiDir();
  }

  const headersContent = `/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`;
  fs.writeFileSync(path.join(outDir, "_headers"), headersContent, "utf8");
  scanSecrets(outDir);
  console.log("Static Cloudflare Pages build complete -> out/ (0 secrets verified).");
}

main();
