import os
import sys
import time
from playwright.sync_api import sync_playwright

OUT_DIR = "/Users/joseph/.gemini/antigravity/brain/b4854453-0090-47be-92cc-3ffccad4c3b4/cards"
os.makedirs(OUT_DIR, exist_ok=True)

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL = "https://www.suanle.cc"

def run_audit():
    print(">>> 启动 Playwright 无头环境进行线上全盘视觉审计...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH if os.path.exists(CHROME_PATH) else None,
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )

        # -----------------------------------------------------------------
        # 1. 移动端前台审计 (iPhone 14 Pro 视口: 393 x 852, 2x DPR)
        # -----------------------------------------------------------------
        mobile_ctx = browser.new_context(
            viewport={"width": 393, "height": 852},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        )
        page = mobile_ctx.new_page()

        print(f"访问线上首页: {BASE_URL}")
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(1800)

        # 1.1 首页
        page.screenshot(path=os.path.join(OUT_DIR, "audit_01_mobile_home.png"))
        print("✓ audit_01_mobile_home.png 已落盘")

        # 1.2 占一占 Tab
        div_tab = page.locator("button:has-text('占一占')").first
        if div_tab.is_visible():
            div_tab.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(OUT_DIR, "audit_02_mobile_tools.png"))
            print("✓ audit_02_mobile_tools.png 已落盘")

        # 1.3 算了 Tab (解脱纸篓)
        letgo_tab = page.locator("button:has-text('算了')").first
        if letgo_tab.is_visible():
            letgo_tab.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(OUT_DIR, "audit_03_mobile_letgo.png"))
            print("✓ audit_03_mobile_letgo.png 已落盘")

        # 1.4 我 Tab
        me_tab = page.locator("button:has-text('我')").first
        if me_tab.is_visible():
            me_tab.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(OUT_DIR, "audit_04_mobile_me.png"))
            print("✓ audit_04_mobile_me.png 已落盘")

            # 打开小档案弹窗
            profile_btn = page.locator("button:has-text('小档案')").first
            if profile_btn.is_visible():
                profile_btn.click()
                page.wait_for_timeout(800)
                page.screenshot(path=os.path.join(OUT_DIR, "audit_04_mobile_profile_sheet.png"))
                print("✓ audit_04_mobile_profile_sheet.png 已落盘")
                # 关闭 sheet
                close_btn = page.locator("button[aria-label='关闭']").first
                if close_btn.is_visible():
                    close_btn.click()
                page.wait_for_timeout(400)

            # 打开随喜心意弹窗
            tip_btn = page.locator("button:has-text('心意'), button:has-text('随喜'), button:has-text('赞赏')").first
            if tip_btn.is_visible():
                tip_btn.click()
                page.wait_for_timeout(1000)
                page.screenshot(path=os.path.join(OUT_DIR, "audit_05_mobile_pay.png"))
                print("✓ audit_05_mobile_pay.png 已落盘")

        mobile_ctx.close()

        # -----------------------------------------------------------------
        # 2. 桌面端后台管理审计 (1440 x 900, 2x DPR)
        # -----------------------------------------------------------------
        admin_ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        admin_page = admin_ctx.new_page()

        curator_url = f"{BASE_URL}/curator"
        print(f"访问线上后台: {curator_url}")
        admin_page.goto(curator_url, wait_until="networkidle")
        admin_page.wait_for_timeout(1200)

        # 若在登录页，自动输入密码
        pwd_input = admin_page.locator("input[type='password']").first
        if pwd_input.is_visible():
            print("输入管理员密钥进入后台...")
            pwd_input.fill("suanle_curator_hk_2026")
            submit_btn = admin_page.locator("button[type='submit']").first
            submit_btn.click()
            try:
                admin_page.wait_for_selector("text=24小时对话量", timeout=8000)
            except Exception:
                admin_page.wait_for_timeout(3000)
            admin_page.wait_for_timeout(1000)

        # 2.1 后台首页驾驶舱 (Cockpit: 重点核验 Sparkline 走势图与服务器资源)
        admin_page.screenshot(path=os.path.join(OUT_DIR, "audit_06_curator_cockpit.png"))
        print("✓ audit_06_curator_cockpit.png 已落盘")

        # 2.2 缘友台账 Tab (Users: 重点核验自填称呼、八字生辰、城市与IP)
        users_btn = admin_page.locator("button:has-text('缘友台账')").first
        if users_btn.is_visible():
            users_btn.click()
            admin_page.wait_for_timeout(1800)
            admin_page.screenshot(path=os.path.join(OUT_DIR, "audit_07_curator_users.png"))
            print("✓ audit_07_curator_users.png 已落盘")

        # 2.3 会话记录 Tab (Chats)
        chats_btn = admin_page.locator("button:has-text('会话记录')").first
        if chats_btn.is_visible():
            chats_btn.click()
            admin_page.wait_for_timeout(1500)
            admin_page.screenshot(path=os.path.join(OUT_DIR, "audit_08_curator_chats.png"))
            print("✓ audit_08_curator_chats.png 已落盘")

        # 2.4 解脱纸篓 Tab (Letgos)
        letgos_btn = admin_page.locator("button:has-text('解脱纸篓')").first
        if letgos_btn.is_visible():
            letgos_btn.click()
            admin_page.wait_for_timeout(1500)
            admin_page.screenshot(path=os.path.join(OUT_DIR, "audit_09_curator_letgos.png"))
            print("✓ audit_09_curator_letgos.png 已落盘")

        admin_ctx.close()
        browser.close()
        print(">>> 全链路高清视觉审计截图已全部完成！")

if __name__ == "__main__":
    run_audit()
