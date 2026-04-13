import sys
import os
from PIL import Image

def resize_and_pad(image_path, target_size=(1284, 2778)):
    img = Image.open(image_path)
    # Original is square 1024x1024
    # We want to fit it to target_size by width
    target_w, target_h = target_size
    img_w, img_h = img.size
    
    # Scale to target width
    scale = target_w / img_w
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Sample background color from top-left
    bg_color = img.getpixel((0, 0))
    
    # Create new canvas
    new_img = Image.new('RGB', target_size, bg_color)
    
    # Paste resized image in the center
    paste_x = (target_w - new_w) // 2
    paste_y = (target_h - new_h) // 2
    new_img.paste(img_resized, (paste_x, paste_y))
    
    # Save back
    new_img.save(image_path)
    print(f"Resized {image_path} to {target_size}")

if __name__ == "__main__":
    assets_dir = "app-store-assets"
    for filename in os.listdir(assets_dir):
        if filename.endswith(".png") and "screenshot" in filename:
            path = os.path.join(assets_dir, filename)
            resize_and_pad(path)
