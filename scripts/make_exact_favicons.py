import base64
from PIL import Image

def create_exact_favicons():
    src_img = Image.open('src/assets/wepsun-shield.png').convert('RGB')
    w, h = src_img.size

    # The image is 946x926. Make it a perfect 1:1 square by extending white padding equally
    max_dim = max(w, h)
    sq_img = Image.new('RGB', (max_dim, max_dim), (255, 255, 255))
    offset_x = (max_dim - w) // 2
    offset_y = (max_dim - h) // 2
    sq_img.paste(src_img, (offset_x, offset_y))

    # Resize to standard favicon resolutions with high quality LANCZOS
    fav16 = sq_img.resize((16, 16), Image.Resampling.LANCZOS)
    fav32 = sq_img.resize((32, 32), Image.Resampling.LANCZOS)
    fav48 = sq_img.resize((48, 48), Image.Resampling.LANCZOS)
    fav64 = sq_img.resize((64, 64), Image.Resampling.LANCZOS)
    fav128 = sq_img.resize((128, 128), Image.Resampling.LANCZOS)
    fav256 = sq_img.resize((256, 256), Image.Resampling.LANCZOS)
    fav512 = sq_img.resize((512, 512), Image.Resampling.LANCZOS)

    # Save ICO
    fav256.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    fav256.save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

    # Save PNGs
    fav256.save('public/wepsun-shield.png', 'PNG', quality=100)
    fav512.save('public/wepsun-logo.png', 'PNG', quality=100)
    fav256.save('wepsun-shield.png', 'PNG', quality=100)
    fav512.save('wepsun-logo.png', 'PNG', quality=100)

    # Save SVG with embedded high-res PNG
    with open('public/wepsun-shield.png', 'rb') as f:
        b64_str = base64.b64encode(f.read()).decode('utf-8')

    svg_code = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><rect width="256" height="256" rx="32" fill="#ffffff"/><image href="data:image/png;base64,{b64_str}" width="256" height="256"/></svg>'

    with open('public/favicon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_code)

    print('Exact crisp favicon assets generated successfully!')

if __name__ == '__main__':
    create_exact_favicons()
