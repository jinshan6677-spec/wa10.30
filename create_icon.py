#!/usr/bin/env python3
"""
Create a simple placeholder icon for the WhatsApp Language Enhancement application
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size=512, output_path='assets/icon.png'):
    """Create a simple green icon with 'W' letter"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # WhatsApp green color
    bg_color = (37, 211, 102, 255)  # WhatsApp green
    text_color = (255, 255, 255, 255)  # White

    # Draw rounded rectangle background
    margin = size // 10
    draw.rounded_rectangle(
        [(margin, margin), (size - margin, size - margin)],
        radius=size // 8,
        fill=bg_color
    )

    # Draw 'W' text
    try:
        # Try to use a system font
        font_size = size // 2
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()

    text = "W"
    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Center the text
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]

    draw.text((x, y), text, fill=text_color, font=font)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Save the icon
    img.save(output_path, 'PNG')
    print(f"Icon created successfully at {output_path}")
    print(f"Size: {size}x{size} pixels")

if __name__ == '__main__':
    create_icon()
