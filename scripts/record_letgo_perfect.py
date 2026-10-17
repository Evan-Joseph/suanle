import os
import subprocess
from playwright.sync_api import sync_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL = "https://www.suanle.cc"
OUTPUT_DIR = "promo/assets/video"
RAW_DIR = "promo/assets/video_raw"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs("public/promo/video", exist_ok=True)

def record_letgo_perfect():
    name = "03_letgo_paper_crumple"
    temp_dir = os.path.join(RAW_DIR, name)
    os.makedirs(temp_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True
        )
        context = browser.new_context(
            viewport={"width": 430, "height": 932},
            device_scale_factor=2,
            record_video_dir=temp_dir,
            record_video_size={"width": 860, "height": 1864}
        )
        page = context.new_page()
        page.goto(BASE_URL)
        page.wait_for_timeout(2000)
        
        # Click 算了 tab
        suanle_tab = page.locator("button:has-text('算了')").last
        suanle_tab.click()
        page.wait_for_timeout(1000)
        
        # Locate the lined paper textarea
        ta = page.locator("textarea[placeholder*='放不下']")
        ta.wait_for(state="visible", timeout=10000)
        ta.click()
        page.wait_for_timeout(400)
        page.keyboard.type("放不下昨晚的失眠与焦虑，心里总像压着石头……", delay=65)
        page.wait_for_timeout(1000)
        
        # Click 揉掉它
        crumple_btn = page.locator("button:has-text('揉掉它')")
        crumple_btn.click()
        page.wait_for_timeout(1600)
        
        # Now paper ball appears in aim stage
        ball = page.locator("div.cursor-grab")
        ball.wait_for(state="visible", timeout=10000)
        page.wait_for_timeout(800)
        # Tap ball to launch ideal throw into bin
        ball.click()
        
        # Wait for flying, landing into bin, and done stage
        page.wait_for_timeout(5000)
        
        context.close()
        browser.close()
        
    files = [f for f in os.listdir(temp_dir) if f.endswith(".webm")]
    if files:
        # Pick the latest webm
        files.sort(key=lambda x: os.path.getmtime(os.path.join(temp_dir, x)), reverse=True)
        raw_webm = os.path.join(temp_dir, files[0])
        mp4_out = os.path.join(OUTPUT_DIR, f"{name}.mp4")
        pub_out = os.path.join("public/promo/video", f"{name}.mp4")
        
        cmd = [
            "/opt/homebrew/bin/ffmpeg", "-y",
            "-i", raw_webm,
            "-c:v", "libx264",
            "-preset", "slow",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            mp4_out
        ]
        subprocess.run(cmd, check=True)
        subprocess.run(["cp", mp4_out, pub_out], check=True)
        print(f"✓ Perfectly generated {mp4_out}")

record_letgo_perfect()
