import os
import time
import subprocess
from playwright.sync_api import sync_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL = "https://www.suanle.cc"
OUTPUT_DIR = "promo/assets/video"
RAW_DIR = "promo/assets/video_raw"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs("public/promo/video", exist_ok=True)

def record_clip(name, actions_func):
    temp_dir = os.path.join(RAW_DIR, name)
    os.makedirs(temp_dir, exist_ok=True)
    
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
        
        try:
            actions_func(page)
        except Exception as e:
            print(f"Error in {name}: {e}")
            
        page.wait_for_timeout(1000)
        context.close()
        browser.close()
        
    # Find recorded webm file
    files = [f for f in os.listdir(temp_dir) if f.endswith(".webm")]
    if files:
        raw_webm = os.path.join(temp_dir, files[0])
        mp4_out = os.path.join(OUTPUT_DIR, f"{name}.mp4")
        pub_out = os.path.join("public/promo/video", f"{name}.mp4")
        
        # Convert webm to h264 mp4
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
        print(f"✓ Generated {mp4_out}")

# Clip 1: Home page exploration & divination
def clip_home(page):
    # Gentle scroll down
    for _ in range(3):
        page.mouse.wheel(0, 300)
        page.wait_for_timeout(800)
    page.wait_for_timeout(1000)
    # Scroll back up
    for _ in range(3):
        page.mouse.wheel(0, -300)
        page.wait_for_timeout(800)
    page.wait_for_timeout(1200)

# Clip 2: Let-go ritual (typing worry, crumple, throw)
def clip_letgo(page):
    # Click 算了 tab
    suanle_tab = page.locator("button:has-text('算了')").last
    suanle_tab.click()
    page.wait_for_timeout(1500)
    
    # Locate textarea
    textarea = page.locator("textarea")
    if textarea.count() > 0:
        textarea.first.click()
        page.wait_for_timeout(500)
        page.keyboard.type("放不下昨晚的失眠与焦虑，心里总像压着石头……", delay=70)
        page.wait_for_timeout(1000)
        
        # Click 揉掉它
        crumple_btn = page.locator("button:has-text('揉掉它')").first
        if crumple_btn.count() > 0:
            crumple_btn.click()
            page.wait_for_timeout(4000)

# Clip 3: Chat consultation
def clip_chat(page):
    chat_btn = page.locator("button:has-text('聊聊')").first
    chat_btn.click()
    page.wait_for_timeout(2000)
    # Scroll down dialogue
    page.mouse.wheel(0, 250)
    page.wait_for_timeout(1500)

print("Starting promo clips recording...")
record_clip("01_home_navigation", clip_home)
record_clip("02_chat_consultation", clip_chat)
record_clip("03_letgo_paper_crumple", clip_letgo)
print("All promo clips recorded successfully!")
