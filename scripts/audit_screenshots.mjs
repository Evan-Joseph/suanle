import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = "/Users/joseph/.gemini/antigravity/brain/b4854453-0090-47be-92cc-3ffccad4c3b4/cards";
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function runAudit() {
  console.log("启动无头 Chromium 进行全页面视觉审计...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // 1. 移动端前台审计 (390 x 844 iPhone 13/14 视口)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    isMobile: true,
    hasTouch: true,
  });

  const page = await mobileContext.newPage();
  console.log("正在访问生产环境 https://www.suanle.cc ...");
  await page.goto("https://www.suanle.cc", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // 截图 1: 首页
  await page.screenshot({ path: path.join(OUT_DIR, "audit_01_mobile_home.png") });
  console.log("✓ audit_01_mobile_home.png 已保存");

  // 点击“占一占” Tab
  const toolsTab = page.locator("button:has-text('占一占')").first();
  if (await toolsTab.isVisible()) {
    await toolsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, "audit_02_mobile_tools.png") });
    console.log("✓ audit_02_mobile_tools.png 已保存");
  }

  // 点击“算了” Tab
  const letgoTab = page.locator("button:has-text('算了')").first();
  if (await letgoTab.isVisible()) {
    await letgoTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, "audit_03_mobile_letgo.png") });
    console.log("✓ audit_03_mobile_letgo.png 已保存");
  }

  // 点击“我” Tab
  const meTab = page.locator("button:has-text('我')").first();
  if (await meTab.isVisible()) {
    await meTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, "audit_04_mobile_me.png") });
    console.log("✓ audit_04_mobile_me.png 已保存");

    // 点击小档案
    const profileBtn = page.locator("button:has-text('小档案')").first();
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT_DIR, "audit_04_mobile_profile_sheet.png") });
      console.log("✓ audit_04_mobile_profile_sheet.png 已保存");
      // 关闭 sheet
      const closeBtn = page.locator("button[aria-label='关闭']").first();
      if (await closeBtn.isVisible()) await closeBtn.click();
      await page.waitForTimeout(400);
    }

    // 点击心意/随喜
    const tipBtn = page.locator("button:has-text('心意'), button:has-text('随喜'), button:has-text('赞赏')").first();
    if (await tipBtn.isVisible()) {
      await tipBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT_DIR, "audit_05_mobile_pay.png") });
      console.log("✓ audit_05_mobile_pay.png 已保存");
    }
  }

  await mobileContext.close();

  // 2. 桌面端后台管理审计 (1440 x 900)
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const adminPage = await adminContext.newPage();

  console.log("正在访问后台 https://www.suanle.cc/curator ...");
  await adminPage.goto("https://www.suanle.cc/curator", { waitUntil: "networkidle" });
  await adminPage.waitForTimeout(1000);

  // 若在登录页，输入密码登录
  const pwdInput = adminPage.locator("input[type='password']");
  if (await pwdInput.isVisible()) {
    console.log("输入管理员密钥登录后台...");
    await pwdInput.fill("suanle_curator_hk_2026");
    const submitBtn = adminPage.locator("button:has-text('核验通关')");
    await submitBtn.click();
    await adminPage.waitForTimeout(2000);
  }

  // 截图 6: 后台首页 Cockpit (包含 CPU / 内存 Sparkline)
  await adminPage.screenshot({ path: path.join(OUT_DIR, "audit_06_curator_cockpit.png") });
  console.log("✓ audit_06_curator_cockpit.png 已保存");

  // 截图 7: 缘友台账 Tab
  const usersTab = adminPage.locator("button:has-text('缘友台账')");
  if (await usersTab.isVisible()) {
    await usersTab.click();
    await adminPage.waitForTimeout(1500);
    await adminPage.screenshot({ path: path.join(OUT_DIR, "audit_07_curator_users.png") });
    console.log("✓ audit_07_curator_users.png 已保存");
  }

  // 截图 8: 会话记录 Tab
  const chatsTab = adminPage.locator("button:has-text('会话记录')");
  if (await chatsTab.isVisible()) {
    await chatsTab.click();
    await adminPage.waitForTimeout(1200);
    await adminPage.screenshot({ path: path.join(OUT_DIR, "audit_08_curator_chats.png") });
    console.log("✓ audit_08_curator_chats.png 已保存");
  }

  // 截图 9: 解脱纸篓 Tab
  const letgosTab = adminPage.locator("button:has-text('解脱纸篓')");
  if (await letgosTab.isVisible()) {
    await letgosTab.click();
    await adminPage.waitForTimeout(1200);
    await adminPage.screenshot({ path: path.join(OUT_DIR, "audit_09_curator_letgos.png") });
    console.log("✓ audit_09_curator_letgos.png 已保存");
  }

  await adminContext.close();
  await browser.close();
  console.log("全量视觉截图审计执行完毕！");
}

runAudit().catch((err) => {
  console.error("审计执行报错:", err);
  process.exit(1);
});
