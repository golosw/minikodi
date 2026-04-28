from PIL import Image, ImageDraw, ImageFont
import os

# Crear icono 256x256 para Linux
img = Image.new('RGB', (256, 256), color='#1a1a2e')
draw = ImageDraw.Draw(img)

# Dibujar un play button simple
points = [(80, 60), (80, 196), (200, 128)]
draw.polygon(points, fill='#00d4ff')

# Borde
draw.polygon(points, outline='#ffffff', width=3)

# Texto "MK"
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
    draw.text((100, 200), "MK", fill='#ffffff', font=font)
except:
    pass

img.save('icon.png')
print("icon.png created: 256x256")

# Crear ICO para Windows (multi-size)
sizes = [16, 32, 48, 64, 128, 256]
images = []

for size in sizes:
    img = Image.new('RGBA', (size, size), color=(26, 26, 46, 255))
    draw = ImageDraw.Draw(img)
    
    # Play button escalado
    margin = size // 8
    points = [
        (margin, margin * 2),
        (margin, size - margin * 2),
        (size - margin, size // 2)
    ]
    draw.polygon(points, fill=(0, 212, 255, 255))
    draw.polygon(points, outline=(255, 255, 255, 255), width=max(1, size // 64))
    
    images.append(img)

# Guardar como ICO
images[0].save('icon.ico', sizes=[(s, s) for s in sizes], append_images=images[1:])
print("icon.ico created with sizes:", sizes)
