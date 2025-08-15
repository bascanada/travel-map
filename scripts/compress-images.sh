#!/bin/bash

# Image compression script for travel photos
# This will compress JPEG files while maintaining good quality

# Usage function
usage() {
    echo "Usage: $0 <data_directory> [--restore]"
    echo "Compress: $0 ../my-travel-site/data"
    echo "Restore:  $0 ../my-travel-site/data --restore"
    echo "Example: $0 ./data"
    exit 1
}

echo "🖼️  Starting image compression..."

# Check if data directory argument is provided
if [ $# -eq 0 ]; then
    echo "❌ No data directory specified."
    usage
fi

DATA_DIR="$1"
RESTORE_MODE=false

# Check for restore flag
if [ "$2" = "--restore" ]; then
    RESTORE_MODE=true
fi

# Check if the directory exists
if [ ! -d "$DATA_DIR" ]; then
    echo "❌ Data directory '$DATA_DIR' not found."
    usage
fi

# Restore function
restore_images() {
    local backup_dir="$DATA_DIR/backup-original"
    
    if [ ! -d "$backup_dir" ]; then
        echo "❌ No backup directory found at $backup_dir"
        exit 1
    fi
    
    echo "🔄 Restoring images from backup..."
    
    # Find all backup files and restore them to original locations
    find "$backup_dir" -name "*.jpg" -type f | while read backup_file; do
        # Get just the filename
        filename=$(basename "$backup_file")
        path_info_file="$backup_dir/$filename.path"
        
        if [ -f "$path_info_file" ]; then
            # Read the original relative path
            relative_path=$(cat "$path_info_file")
            original_file="$DATA_DIR/$relative_path"
            
            # Create directory if it doesn't exist
            mkdir -p "$(dirname "$original_file")"
            
            cp "$backup_file" "$original_file"
            echo "✅ Restored: $relative_path"
        else
            # Fallback: try to find the file by name
            original_file=$(find "$DATA_DIR" -name "$filename" -not -path "$backup_dir/*" | head -1)
            
            if [ -n "$original_file" ]; then
                cp "$backup_file" "$original_file"
                echo "✅ Restored (fallback): $filename"
            else
                echo "⚠️  Could not find original location for: $filename"
            fi
        fi
    done
    
    echo "🎉 Restore complete!"
    exit 0
}

# If restore mode, run restore and exit
if [ "$RESTORE_MODE" = true ]; then
    restore_images
fi

# Create backup directory
mkdir -p "$DATA_DIR/backup-original"

# Function to get file size (works on both macOS and Linux)
get_file_size() {
    if command -v stat >/dev/null 2>&1; then
        if stat -f%z "$1" >/dev/null 2>&1; then
            # macOS
            stat -f%z "$1"
        else
            # Linux
            stat -c%s "$1"
        fi
    else
        # Fallback
        wc -c < "$1"
    fi
}

# Function to compress a single image
compress_image() {
    local input_file="$1"
    
    # Create relative path from DATA_DIR to preserve directory structure in backup
    local relative_path="${input_file#$DATA_DIR/}"
    local backup_file="$DATA_DIR/backup-original/$(basename "$input_file")"
    
    # Store the relative path info for restoration
    local path_info_file="$DATA_DIR/backup-original/$(basename "$input_file").path"
    echo "$relative_path" > "$path_info_file"
    
    # Create backup
    cp "$input_file" "$backup_file"
    
    # Get original size
    original_size=$(get_file_size "$input_file")
    
    # First, use exiftool to auto-rotate the image pixels based on EXIF orientation
    # This bakes the rotation into the actual image data, then removes the orientation tag
    if command -v exiftool >/dev/null 2>&1; then
        # Auto-rotate image based on EXIF orientation and remove EXIF data except orientation initially
        exiftool -overwrite_original -orientation -n "$input_file" 2>/dev/null || true
    fi
    
    # Use ImageMagick to auto-rotate if available (more reliable than exiftool for rotation)
    if command -v magick >/dev/null 2>&1; then
        # Auto-orient the image (rotates pixels and removes orientation EXIF)
        magick "$input_file" -auto-orient "$input_file"
    elif command -v convert >/dev/null 2>&1; then
        # Older ImageMagick command
        convert "$input_file" -auto-orient "$input_file"
    fi
    
    # Now compress the properly oriented image
    jpegoptim --max=85 --preserve "$input_file"
    
    # Remove all remaining EXIF data since orientation is now baked into pixels
    if command -v exiftool >/dev/null 2>&1; then
        exiftool -overwrite_original -all= "$input_file" 2>/dev/null || true
    fi
    
    # Get new size
    new_size=$(get_file_size "$input_file")
    
    # Calculate savings
    savings=$((original_size - new_size))
    percentage=$((savings * 100 / original_size))
    
    echo "✅ $(basename "$input_file"): $(numfmt --to=iec $original_size 2>/dev/null || echo "${original_size} bytes") → $(numfmt --to=iec $new_size 2>/dev/null || echo "${new_size} bytes") (${percentage}% saved)"
}

# Check if jpegoptim is installed
if ! command -v jpegoptim &> /dev/null; then
    echo "❌ jpegoptim not found."
    if command -v brew &> /dev/null; then
        echo "Installing via Homebrew..."
        brew install jpegoptim
    elif command -v apk &> /dev/null; then
        echo "Installing via apk..."
        apk add --no-cache jpegoptim
    else
        echo "Please install jpegoptim manually."
        exit 1
    fi
fi

# Check for ImageMagick (for proper image rotation)
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Image orientation may not be fixed properly."
    if command -v brew &> /dev/null; then
        echo "💡 Install with: brew install imagemagick"
    elif command -v apk &> /dev/null; then
        echo "💡 Install with: apk add --no-cache imagemagick"
    fi
fi

# Check if exiftool is available for EXIF removal
if ! command -v exiftool &> /dev/null; then
    echo "⚠️  exiftool not found. EXIF data will not be removed."
    if command -v brew &> /dev/null; then
        echo "💡 Install with: brew install exiftool"
    elif command -v apk &> /dev/null; then
        echo "💡 Install with: apk add --no-cache exiftool"
    fi
fi

# Find and compress all JPEG files
total_original=0
total_compressed=0

echo "📁 Processing images in $DATA_DIR directory..."

while IFS= read -r -d '' file; do
    if [[ -f "$file" ]]; then
        original_size=$(get_file_size "$file")
        total_original=$((total_original + original_size))
        
        compress_image "$file"
        
        new_size=$(get_file_size "$file")
        total_compressed=$((total_compressed + new_size))
    fi
done < <(find "$DATA_DIR" -name "*.jpg" -print0)

# Calculate total savings
total_savings=$((total_original - total_compressed))
total_percentage=$((total_savings * 100 / total_original))

echo ""
echo "🎉 Compression complete!"
echo "📊 Total original size: $(numfmt --to=iec $total_original 2>/dev/null || echo "${total_original} bytes")"
echo "📊 Total compressed size: $(numfmt --to=iec $total_compressed 2>/dev/null || echo "${total_compressed} bytes")"
echo "💾 Total space saved: $(numfmt --to=iec $total_savings 2>/dev/null || echo "${total_savings} bytes") (${total_percentage}%)"
echo ""
echo "💡 Original files backed up to $DATA_DIR/backup-original/"
