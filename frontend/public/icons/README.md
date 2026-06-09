# BillingBee App Icons

## Generating PNG Icons

The `icon.svg` file is the source icon. Generate PNG icons from it using one of these methods:

### Using ImageMagick
```bash
for size in 72 96 128 144 152 192 384 512; do
  convert -background none icon.svg -resize ${size}x${size} icon-${size}.png
done
```

### Using Inkscape
```bash
for size in 72 96 128 144 152 192 384 512; do
  inkscape icon.svg --export-filename=icon-${size}.png -w ${size} -h ${size}
done
```

### Using a design tool
Open `icon.svg` in Figma, Sketch, or Adobe Illustrator and export at each required size.

### Required sizes
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

Name them `icon-{size}.png` and place in this directory.
