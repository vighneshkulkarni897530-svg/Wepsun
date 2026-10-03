import os
from PIL import Image, ImageDraw

def generate_icons():
    # Source image
    src_path = 'src/assets/wepsun-shield.png'
    src_img = Image.open(src_path).convert('RGBA')
    
    # 1. Mipmap Icon Sizes (Legacy & Round & Foreground)
    res_base = 'android/app/src/main/res'
    
    densities = {
        'mipmap-mdpi': {'legacy': 48, 'foreground': 108},
        'mipmap-hdpi': {'legacy': 72, 'foreground': 162},
        'mipmap-xhdpi': {'legacy': 96, 'foreground': 216},
        'mipmap-xxhdpi': {'legacy': 144, 'foreground': 324},
        'mipmap-xxxhdpi': {'legacy': 192, 'foreground': 432},
    }
    
    # Prepare trimmed / clean shield emblem with transparent background for adaptive foreground
    # Make near-white pixels transparent for foreground
    pixels = src_img.load()
    w, h = src_img.size
    transparent_shield = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    t_pixels = transparent_shield.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r > 240 and g > 240 and b > 240:
                t_pixels[x, y] = (255, 255, 255, 0)
            else:
                t_pixels[x, y] = (r, g, b, a)

    # Crop to content
    bbox = transparent_shield.getbbox()
    cropped_shield = transparent_shield.crop(bbox)
    cw, ch = cropped_shield.size

    for folder, sizes in densities.items():
        dir_path = os.path.join(res_base, folder)
        os.makedirs(dir_path, exist_ok=True)
        
        # --- A. Adaptive Foreground (ic_launcher_foreground.png) ---
        fg_size = sizes['foreground']
        fg_canvas = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        
        # Fit inside 66% of foreground size (safe zone is 72/108 = 66.6%)
        target_size = int(fg_size * 0.64)
        aspect = cw / ch
        if aspect > 1:
            nw = target_size
            nh = int(target_size / aspect)
        else:
            nh = target_size
            nw = int(target_size * aspect)
            
        resized_shield = cropped_shield.resize((nw, nh), Image.Resampling.LANCZOS)
        paste_x = (fg_size - nw) // 2
        paste_y = (fg_size - nh) // 2
        fg_canvas.paste(resized_shield, (paste_x, paste_y), resized_shield)
        
        fg_path = os.path.join(dir_path, 'ic_launcher_foreground.png')
        fg_canvas.save(fg_path, 'PNG')
        print(f"Generated {fg_path} ({fg_size}x{fg_size})")
        
        # --- B. Legacy Icon (ic_launcher.png) - White background with shield ---
        leg_size = sizes['legacy']
        leg_canvas = Image.new('RGBA', (leg_size, leg_size), (255, 255, 255, 255))
        
        # Shield inside 82% of legacy icon
        target_leg_size = int(leg_size * 0.82)
        if aspect > 1:
            nw_leg = target_leg_size
            nh_leg = int(target_leg_size / aspect)
        else:
            nh_leg = target_leg_size
            nw_leg = int(target_leg_size * aspect)
            
        resized_leg_shield = cropped_shield.resize((nw_leg, nh_leg), Image.Resampling.LANCZOS)
        leg_x = (leg_size - nw_leg) // 2
        leg_y = (leg_size - nh_leg) // 2
        leg_canvas.paste(resized_leg_shield, (leg_x, leg_y), resized_leg_shield)
        
        leg_path = os.path.join(dir_path, 'ic_launcher.png')
        leg_canvas.save(leg_path, 'PNG')
        print(f"Generated {leg_path} ({leg_size}x{leg_size})")
        
        # --- C. Round Icon (ic_launcher_round.png) ---
        round_canvas = Image.new('RGBA', (leg_size, leg_size), (0, 0, 0, 0))
        # Draw white filled circle
        draw = ImageDraw.Draw(round_canvas)
        draw.ellipse((0, 0, leg_size - 1, leg_size - 1), fill=(255, 255, 255, 255))
        # Paste shield inside round canvas
        round_target_size = int(leg_size * 0.72)
        if aspect > 1:
            nw_rnd = round_target_size
            nh_rnd = int(round_target_size / aspect)
        else:
            nh_rnd = round_target_size
            nw_rnd = int(round_target_size * aspect)
        resized_rnd_shield = cropped_shield.resize((nw_rnd, nh_rnd), Image.Resampling.LANCZOS)
        rnd_x = (leg_size - nw_rnd) // 2
        rnd_y = (leg_size - nh_rnd) // 2
        round_canvas.paste(resized_rnd_shield, (rnd_x, rnd_y), resized_rnd_shield)
        
        rnd_path = os.path.join(dir_path, 'ic_launcher_round.png')
        round_canvas.save(rnd_path, 'PNG')
        print(f"Generated {rnd_path} ({leg_size}x{leg_size})")

    # 2. Splash Screens (drawable-*)
    splash_configs = {
        'drawable': (480, 320),
        'drawable-land-hdpi': (800, 480),
        'drawable-land-mdpi': (480, 320),
        'drawable-land-xhdpi': (1280, 720),
        'drawable-land-xxhdpi': (1600, 960),
        'drawable-land-xxxhdpi': (1920, 1280),
        'drawable-port-hdpi': (480, 800),
        'drawable-port-mdpi': (320, 480),
        'drawable-port-xhdpi': (720, 1280),
        'drawable-port-xxhdpi': (960, 1600),
        'drawable-port-xxxhdpi': (1280, 1920),
    }

    navy_bg = (11, 37, 69, 255) # #0b2545

    for folder, (sw, sh) in splash_configs.items():
        dir_path = os.path.join(res_base, folder)
        os.makedirs(dir_path, exist_ok=True)
        splash_img = Image.new('RGBA', (sw, sh), navy_bg)
        
        # Centered shield
        max_dim = min(sw, sh)
        shield_target = int(max_dim * 0.40)
        if aspect > 1:
            nw_s = shield_target
            nh_s = int(shield_target / aspect)
        else:
            nh_s = shield_target
            nw_s = int(shield_target * aspect)
            
        resized_s = cropped_shield.resize((nw_s, nh_s), Image.Resampling.LANCZOS)
        sx = (sw - nw_s) // 2
        sy = (sh - nh_s) // 2
        splash_img.paste(resized_s, (sx, sy), resized_s)
        
        s_path = os.path.join(dir_path, 'splash.png')
        splash_img.save(s_path, 'PNG')
        print(f"Generated {s_path} ({sw}x{sh})")

    # 3. Update public icons & root icons
    public_192 = cropped_shield.resize((192, 192), Image.Resampling.LANCZOS)
    public_512 = cropped_shield.resize((512, 512), Image.Resampling.LANCZOS)
    
    # Save to public and root
    src_img.save('public/wepsun-shield.png', 'PNG')
    src_img.save('public/wepsun-logo.png', 'PNG')
    src_img.save('wepsun-shield.png', 'PNG')
    src_img.save('wepsun-logo.png', 'PNG')
    print("Updated public/ & root icons.")

if __name__ == '__main__':
    generate_icons()
