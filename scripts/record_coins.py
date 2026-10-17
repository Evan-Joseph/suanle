import os
import time
import subprocess
from playwright.sync_api import sync_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL = "https://www.suanle.cc"
OUTPUT_DIR = "assets/promo/videos"
RAW_DIR = "promo/assets/video_raw"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(RAW_DIR, exist_ok=True)

temp_dir = os.path.join(RAW_DIR, "coins")
os.makedirs(temp_dir, exist_ok=True)

# Clean temp_dir
for f in os.listdir(temp_dir):
    try:
        os.remove(os.path.join(temp_dir, f))
    except Exception:
        pass

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME_PATH,
        headless=True,
        args=["--disable-web-security", "--allow-running-insecure-content"]
    )
    context = browser.new_context(
        viewport={"width": 430, "height": 932},
        device_scale_factor=2,
        record_video_dir=temp_dir,
        record_video_size={"width": 860, "height": 1864}
    )
    page = context.new_page()
    page.goto(BASE_URL)
    page.wait_for_timeout(2500)
    
    # 1. Click explore tab (占一占)
    print("Clicking 占一占 tab...")
    page.locator("button[aria-label='占一占']").click()
    page.wait_for_timeout(1500)
    
    # 2. Click 六爻 · 摇一卦
    print("Clicking 六爻 card...")
    page.locator("button:has-text('六爻 · 摇一卦')").click()
    page.wait_for_timeout(1200)
    
    # Optional: Fill question
    q_box = page.locator("textarea[placeholder*='比如']")
    if q_box.count() > 0:
        q_box.first.fill("今年跳槽去新赛道，吉凶如何？")
        page.wait_for_timeout(800)
        
    # 3. Click 想好了，开始摇
    print("Clicking 想好了，开始摇...")
    start_btn = page.locator("button:has-text('想好了，开始摇')")
    if start_btn.count() > 0:
        start_btn.click()
        page.wait_for_timeout(1200)
        
        # 4. Click 一口气摇完
        print("Clicking 一口气摇完...")
        quick_toss = page.locator("button:has-text('一口气摇完')")
        if quick_toss.count() > 0:
            quick_toss.click()
            print("Watching 3D coin tossing...")
            page.wait_for_timeout(7500) # Wait for all 6 tosses to finish and result to show
                    
        # Capture screenshot of completed hexagram
        page.screenshot(path="assets/promo/images/ui_coins_hexagram.png")
        page.screenshot(path="public/promo/ui_coins_hexagram.png")
        print("Captured ui_coins_hexagram.png")
        page.wait_for_timeout(2000)

    context.close()
    browser.close()

# Convert webm to mp4
files = [f for f in os.listdir(temp_dir) if f.endswith(".webm")]
if files:
    raw_webm = os.path.join(temp_dir, files[-1])
    mp4_out = os.path.join(OUTPUT_DIR, "05_coins_divination.mp4")
    pub_out = "public/promo/video/05_coins_divination.mp4"
    
    cmd = [
        "ffmpeg", "-y",
        "-i", raw_webm,
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        mp4_out
    ]
    subprocess.run(cmd, check=True)
    subprocess.run(["cp", mp4_out, pub_out], check=True)
    print(f"✓ Generated {mp4_out} and {pub_out}")
