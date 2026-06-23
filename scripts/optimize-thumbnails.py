import os
from PIL import Image

THUMBNAILS_DIR = 'public/thumbnails'

def get_file_size_kb(filepath):
    return os.path.getsize(filepath) / 1024.0

def main():
    if not os.path.exists(THUMBNAILS_DIR):
        print(f"Directory {THUMBNAILS_DIR} not found.")
        return

    files = [f for f in os.listdir(THUMBNAILS_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"Found {len(files)} thumbnails to optimize in {THUMBNAILS_DIR}.\n")

    total_before = 0
    total_after = 0

    print(f"{'Filename':<30} | {'Original':<12} | {'Optimized':<12} | {'Reduction':<10} | {'New Size'}")
    print("-" * 80)

    for filename in sorted(files):
        filepath = os.path.join(THUMBNAILS_DIR, filename)
        size_before = get_file_size_kb(filepath)
        total_before += size_before

        try:
            with Image.open(filepath) as img:
                # Calculate new size maintaining aspect ratio
                max_size = 512
                width, height = img.size
                
                if width > max_size or height > max_size:
                    if width > height:
                        new_width = max_size
                        new_height = int(height * (max_size / width))
                    else:
                        new_height = max_size
                        new_width = int(width * (max_size / height))
                    
                    # Use Resampling.LANCZOS for high quality downscaling
                    img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                else:
                    img_resized = img
                    new_width, new_height = width, height

                # Determine file format based on extension to match the filename
                ext = os.path.splitext(filename)[1].lower()
                
                if ext == '.png':
                    # Convert to palette mode for adaptive color quantization (reduces PNG size drastically)
                    if img_resized.mode != 'P':
                        if img_resized.mode in ('RGBA', 'LA'):
                            img_resized = img_resized.quantize(colors=256)
                        else:
                            img_resized = img_resized.convert('RGB').quantize(colors=256)
                    # Save as PNG with optimization
                    img_resized.save(filepath, format='PNG', optimize=True)
                elif ext in ('.jpg', '.jpeg'):
                    # Save as JPEG with high quality compression
                    img_resized.save(filepath, format='JPEG', quality=80, optimize=True)
                else:
                    # Fallback to detected format
                    img_resized.save(filepath, optimize=True)

            size_after = get_file_size_kb(filepath)
            total_after += size_after
            
            diff = size_before - size_after
            pct = (diff / size_before) * 100 if size_before > 0 else 0
            
            print(f"{filename:<30} | {size_before:7.1f} KB | {size_after:7.1f} KB | {pct:7.1f}% | {new_width}x{new_height}")

        except Exception as e:
            print(f"Error optimizing {filename}: {e}")

    reduction = total_before - total_after
    pct_reduction = (reduction / total_before) * 100 if total_before > 0 else 0
    print("-" * 80)
    print(f"{'TOTAL':<30} | {total_before:7.1f} KB | {total_after:7.1f} KB | {pct_reduction:7.1f}% |")

if __name__ == '__main__':
    main()
