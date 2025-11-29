from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    draw.ellipse([0, 0, size, size], fill='#667eea')
    
    gradient_steps = 50
    for i in range(gradient_steps):
        color = (102 + int(i * (118 - 102) / gradient_steps), 
                 126 + int(i * (75 - 126) / gradient_steps), 
                 234 + int(i * (162 - 234) / gradient_steps))
        y = int(i * size / gradient_steps)
        height = int(size / gradient_steps) + 1
        draw.ellipse([0, y, size, y + height * 2], fill=color)
    
    try:
        font_size = size // 2
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "⚡"
    
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size - text_width) // 2 - bbox[0], (size - text_height) // 2 - bbox[1])
    
    draw.text(position, text, fill='white', font=font)
    
    img.save(f'icons/{filename}', 'PNG')
    print(f'Created {filename} ({size}x{size})')

create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')

print('\n✅ All icons created successfully!')
