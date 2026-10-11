---
name: 2gif
version: 1.0.0
type: hybrid
description: >
  Convert videos, image sequences, or existing GIFs into optimized animated GIFs with
  fine-grained quality control. Use this skill whenever the user wants to: convert any
  video (mp4, mov, avi, webm, etc.) to GIF, turn a sequence of images into an animation,
  compress or re-process an existing GIF, control fps/size/duration/file-size of a GIF,
  or asks anything like "转成GIF", "make a GIF", "video to gif", "gif压缩", "gif优化",
  "图片序列转动图". Trigger even if the user just uploads a video and says "make this
  a gif" without further detail.
compatibility: "requires ffmpeg (bash tool)"
---

# to-gif Skill

Convert videos, image sequences, or existing GIFs into high-quality, size-controlled animated GIFs.

## Step 1: Verify ffmpeg is available

```bash
ffmpeg -version 2>/dev/null | head -1 || echo "NOT_FOUND"
```

If not found, tell the user how to install it:
- macOS: `brew install ffmpeg`
- Ubuntu/Debian: `sudo apt install ffmpeg`
- Windows: https://ffmpeg.org/download.html

---

## Step 2: Identify input type and branch

| Input | Detected by | Section |
|-------|-------------|---------|
| Video file | `.mp4 .mov .avi .webm .mkv .flv` | → [Video to GIF](#video-to-gif) |
| Image sequence | Multiple numbered images (`frame_001.png` …) | → [Image Sequence to GIF](#image-sequence-to-gif) |
| Existing GIF | `.gif` file | → [Re-process GIF](#re-process-gif) |

If the input type is ambiguous, ask the user before proceeding.

---

## Video to GIF

Use the two-pass palette method for best color quality.

### Default command

```bash
ffmpeg \
  -ss {START} \
  -t {DURATION} \
  -i "{INPUT}" \
  -vf "fps={FPS},scale={WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop {LOOP} \
  "{OUTPUT}.gif"
```

### Parameters and defaults

| Param | Default | Notes |
|-------|---------|-------|
| `{START}` | `0` | Start time. Format: `00:00:05` or seconds `5`. Omit `-ss` if not needed. |
| `{DURATION}` | *(whole file)* | Duration in seconds. Omit `-t` if not clipping. |
| `{FPS}` | `10` | Frames per second. 8–15 is a good range; higher = smoother but bigger. |
| `{WIDTH}` | `480` | Output width in pixels; height auto-scales. |
| `{LOOP}` | `0` | `0` = infinite loop, `1` = play once, `N` = play N+1 times. |
| `{OUTPUT}` | Same stem as input | Output filename without extension. |

### Example — clip seconds 5–10, 480px wide, 10 fps

```bash
ffmpeg -ss 5 -t 5 -i "input.mp4" \
  -vf "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 "output.gif"
```

---

## Image Sequence to GIF

Use when the user has multiple numbered frames (e.g., `frame_001.png`, `frame_002.png`).

```bash
ffmpeg \
  -framerate {FPS} \
  -i "{PATTERN}" \
  -vf "scale={WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop {LOOP} \
  "{OUTPUT}.gif"
```

`{PATTERN}` examples:
- `frame_%03d.png` — matches frame_001.png, frame_002.png …
- `img_%04d.jpg` — matches img_0001.jpg, img_0002.jpg …

If the files aren't numbered sequentially, ask the user how they are named before building the command.

---

## Re-process GIF

### Compress to reduce file size

```bash
ffmpeg -i "{INPUT}.gif" \
  -vf "fps={FPS},scale={WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors={COLORS}[p];[s1][p]paletteuse=dither=bayer" \
  -loop {LOOP} \
  "{OUTPUT}_compressed.gif"
```

Default `{COLORS}`: `128` (range 16–256; fewer = smaller file, less color accuracy).

### Change playback speed

```bash
# 2× faster
ffmpeg -i input.gif -vf "setpts=0.5*PTS" output_fast.gif

# 0.5× slower
ffmpeg -i input.gif -vf "setpts=2.0*PTS" output_slow.gif
```

### Crop a region

```bash
ffmpeg -i input.gif -vf "crop={W}:{H}:{X}:{Y}" output_cropped.gif
# e.g. 200×150 region starting at (10,10):
ffmpeg -i input.gif -vf "crop=200:150:10:10" output_cropped.gif
```

---

## File size reduction strategy

When the user wants to hit a target file size, apply these levers in order:

1. **Lower fps** — try `fps=8`, then `fps=6`, then `fps=4`
2. **Shrink dimensions** — `scale=360:-1`, then `scale=240:-1`
3. **Reduce palette** — `palettegen=max_colors=128`, then `64`, then `32`
4. **Stronger dithering** — `paletteuse=dither=bayer:bayer_scale=5`

Check output size after each attempt:
```bash
ls -lh "{OUTPUT}.gif"
```

Stop when the target is met or quality is no longer acceptable.

---

## After conversion — always report

Once the GIF is created, tell the user:
- Output file path
- File size (`ls -lh`)
- Dimensions and fps used
- If the file is large (>5 MB for typical use), proactively suggest the size reduction strategy above.
