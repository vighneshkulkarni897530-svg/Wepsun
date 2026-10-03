import os
import base64
from PIL import Image

def generate_favicons():
    src_path = 'src/assets/wepsun-shield.png'
    img = Image.open(src_path).convert('RGBA')

    # Crop transparent/white edges
    pixels = img.load()
    w, h = img.size
    t_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    t_pix = t_img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r > 240 and g > 240 and b > 240:
                t_pix[x, y] = (255, 255, 255, 0)
            else:
                t_pix[x, y] = (r, g, b, a)

    bbox = t_img.getbbox()
    cropped = t_img.crop(bbox)

    # Create square canvases with shield centered
    def make_square(sz):
        sq = Image.new('RGBA', (sz, sz), (0, 0, 0, 0))
        cw, ch = cropped.size
        aspect = cw / ch
        if aspect > 1:
            nw = sz
            nh = int(sz / aspect)
        else:
            nh = sz
            nw = int(sz * aspect)
        res = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
        x = (sz - nw) // 2
        y = (sz - nh) // 2
        sq.paste(res, (x, y), res)
        return sq

    # Save multi-size favicon.ico
    sq16 = make_square(16)
    sq32 = make_square(32)
    sq48 = make_square(48)
    sq64 = make_square(64)
    sq128 = make_square(128)
    sq256 = make_square(256)
    sq512 = make_square(512)

    sq256.save('public/favicon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
    sq256.save('favicon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
    
    sq256.save('public/wepsun-shield.png', 'PNG')
    sq512.save('public/wepsun-logo.png', 'PNG')
    sq256.save('wepsun-shield.png', 'PNG')
    sq512.save('wepsun-logo.png', 'PNG')

    # Generate crisp SVG with base64 PNG embedded
    with open('public/wepsun-shield.png', 'rb') as f:
        b64_data = base64.b64encode(f.read()).decode('utf-8')

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <image href="data:image/png;base64,{b64_data}" width="256" height="256" />
</svg>'''

    with open('public/favicon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)

    print('Favicon ICO, SVG, and PNG files successfully generated!')

if __name__ == '__main__':
    generate_favicons()
