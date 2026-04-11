# Image Optimization Guide

This guide documents how to optimize images for this project — converting them to WebP and resizing them to appropriate dimensions. Follow these steps whenever you add new images.

---

## Prerequisites

You need **ImageMagick** installed. If you haven't installed it yet:

```bash
brew install imagemagick
```

Verify it's working:

```bash
magick --version
```

---

## Image categories and size rules

| Category | Folder | Max dimensions | Notes |
|---|---|---|---|
| Box art | `images/boxart/` | 250 × 250 px | Aspect ratio is preserved |
| Hero images | `images/hero/` | 1290 × 2796 px | Portrait orientation; full-screen background on flagship phones |
| Monitor photos | `images/monitors/` | 600 × 600 px | Staff photos; source files are usually already small |

All images must be in **WebP** format.

---

## Converting a single image

The general pattern is:

```bash
magick input.jpg -resize WxH> -quality 85 output.webp
```

**Breaking down the flags:**

- `input.jpg` — the source file (can be `.jpg`, `.jpeg`, `.png`, or any other format ImageMagick supports)
- `-resize WxH>` — resize to fit within W×H pixels, **preserving the aspect ratio**. The `>` at the end is important: it means "only shrink, never enlarge". Without it, small images would be upscaled, which increases file size with no quality gain.
- `-quality 85` — WebP compression quality from 0–100. 85 is a good balance: visually indistinguishable from the original at normal viewing distances, but meaningfully smaller than lossless.
- `output.webp` — the output file. Using `.webp` as the extension tells ImageMagick to encode in WebP format.

### Box art example

```bash
magick mygame.png -resize 250x250> -quality 85 mygame.webp
```

### Hero image example

```bash
magick mygame-hero.jpeg -resize 1290x2796> -quality 85 mygame-hero.webp
```

### Monitor photo example

```bash
magick myname.jpg -resize 600x600> -quality 85 myname.webp
```

---

## Converting a batch of images

If you're adding multiple images at once, use a shell loop instead of running the command for each file individually.

Navigate to the folder first, then run the loop:

```bash
cd images/boxart

for f in *.jpg *.jpeg *.png; do
  [ -f "$f" ] || continue        # skip if no files match the pattern
  base="${f%.*}"                 # strip the extension from the filename
  magick "$f" -resize 250x250> -quality 85 "$base.webp"
done
```

The `[ -f "$f" ] || continue` line is a safety check — zsh will error if a glob pattern (like `*.png`) finds no matches, so this skips the iteration gracefully if that happens.

For hero images, change the folder and dimensions accordingly:

```bash
cd images/hero

for f in *.jpg *.jpeg *.png; do
  [ -f "$f" ] || continue
  base="${f%.*}"
  magick "$f" -resize 1290x2796> -quality 85 "$base.webp"
done
```

---

## After converting: clean up the originals

Once you've verified the WebP files look correct, delete the originals:

```bash
# From the project root, delete all .jpg, .jpeg, and .png files in the images folder
find images/ -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -delete
```

Or, if you only want to clean up a specific subfolder:

```bash
rm images/boxart/*.jpg images/boxart/*.jpeg images/boxart/*.png
```

---

## Verifying your results

To check the dimensions and file size of converted images:

```bash
# Check a single file
magick identify -format "%wx%h\n" mygame.webp

# Check all WebP files in a folder with sizes
for f in images/boxart/*.webp; do
  echo "$f: $(magick identify -format '%wx%h' "$f") ($(du -sh "$f" | cut -f1))"
done
```

---

## Updating games.json

After adding and converting new images, update `games.json` to reference the `.webp` files. Edit the relevant entry manually, or — if you renamed a batch of files from another extension — use this command to replace all leftover `.jpg`/`.jpeg`/`.png` references at once:

```bash
sed -i '' -E 's/\.(jpg|jpeg|png)"/\.webp"/g' games.json
```

**What this does:** `sed -i ''` edits the file in-place (the empty `''` is required on macOS). The `-E` flag enables extended regex. The pattern finds any image path ending in `.jpg"`, `.jpeg"`, or `.png"` and replaces the extension with `.webp"`. The `"` at the end of the pattern ensures it only matches inside JSON string values, not random occurrences elsewhere in the file.

---

## Quick reference cheatsheet

```bash
# Install ImageMagick (once)
brew install imagemagick

# Convert one boxart image
magick input.png -resize 250x250> -quality 85 output.webp

# Convert one hero image
magick input.jpeg -resize 1290x2796> -quality 85 output.webp

# Convert one monitor photo
magick input.jpg -resize 600x600> -quality 85 output.webp

# Batch convert a folder (change dimensions as needed)
for f in *.jpg *.jpeg *.png; do [ -f "$f" ] || continue; magick "$f" -resize 250x250> -quality 85 "${f%.*}.webp"; done

# Delete originals after verifying
find images/ -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -delete

# Fix games.json references
sed -i '' -E 's/\.(jpg|jpeg|png)"/\.webp"/g' games.json

# Verify output dimensions and sizes
for f in *.webp; do echo "$f: $(magick identify -format '%wx%h' "$f") ($(du -sh "$f" | cut -f1))"; done
```
