#!/usr/bin/env bash
# Re-encodes project videos, posters and captures. Run from portfolio/. Does not delete sources.
set -euo pipefail

# folder:slug:landscape video:landscape poster:vertical video
MAP=(
  "sport-event:sport-event:brag.mp4:brag.jpg:brag-vertical.mp4"
  "ps5kitsune:ps5kitsune:brag-landscape.mp4:brag-landscape.jpg:brag-vertical.mp4"
  "pr_description:pr-description:brag.mp4:brag.jpg:brag-vertical.mp4"
  "vente-sites:vente-sites:brag.mp4:brag.jpg:brag-vertical.mp4"
)

ff() { ffmpeg -y -loglevel error "$@"; }

enc() { # src out ffmpeg-args...
  local src="$1" out="$2"; shift 2
  local tmp="${out%.*}.tmp.${out##*.}"
  ff -i "$src" "$@" "$tmp"
  mv "$tmp" "$out"
}

for entry in "${MAP[@]}"; do
  IFS=: read -r folder slug land poster vert <<<"$entry"
  src="public/videos/$folder"
  dst="public/videos/$slug"
  mkdir -p "$dst"
  vposter="${vert%.mp4}.jpg"

  # Encode from sources into temp names, so in-place folders are safe
  enc "$src/$land" "$dst/landscape.mp4" -vf scale=-2:1080 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart
  enc "$src/$land" "$dst/landscape-loop.mp4" -vf scale=-2:720 -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -an -movflags +faststart
  enc "$src/$vert" "$dst/vertical.mp4" -vf scale=720:-2 -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart
  enc "$src/$poster" "$dst/landscape.webp" -vf scale=1280:-2 -quality 80
  enc "$src/$vposter" "$dst/vertical.webp" -vf scale=720:-2 -quality 80

  for png in public/images/"$slug"/*.png; do
    [ -e "$png" ] || continue
    enc "$png" "${png%.png}.webp" -vf "scale='min(1600,iw)':-2" -quality 80
  done
done
