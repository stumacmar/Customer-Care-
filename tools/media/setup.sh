#!/usr/bin/env bash
# One-time setup for the media pipeline. Everything it fetches lands in
# tools/media/.cache (git-ignored). Re-run at any time; it is idempotent.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
CACHE="$HERE/.cache"
mkdir -p "$CACHE/voice" "$CACHE/stt"

# System tools: ffmpeg/ffprobe (video), pdftoppm (guide covers), Chromium via Playwright.
if ! command -v ffmpeg >/dev/null || ! command -v pdftoppm >/dev/null; then
  echo "Installing ffmpeg and poppler-utils (needs apt)…"
  sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg poppler-utils
fi

# Text to speech: piper, with the en_GB "alba" voice.
python3 -c "import piper" 2>/dev/null || pip install piper-tts
VOICE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium"
[ -f "$CACHE/voice/en_GB-alba-medium.onnx" ] || curl -sSL -o "$CACHE/voice/en_GB-alba-medium.onnx" "$VOICE_URL/en_GB-alba-medium.onnx"
[ -f "$CACHE/voice/en_GB-alba-medium.onnx.json" ] || curl -sSL -o "$CACHE/voice/en_GB-alba-medium.onnx.json" "$VOICE_URL/en_GB-alba-medium.onnx.json"

# Speech to text, to check every video says what its script says.
python3 -c "import vosk" 2>/dev/null || pip install vosk || pip install --no-deps vosk
if [ ! -d "$CACHE/stt/vosk-model-small-en-gb-0.15" ]; then
  curl -sSL -o "$CACHE/stt/model.zip" https://alphacephei.com/vosk/models/vosk-model-small-en-gb-0.15.zip
  (cd "$CACHE/stt" && unzip -q model.zip && rm model.zip)
fi

# Playwright (the recorder). The repo does not depend on it; a global install is enough.
node -e "require('playwright')" 2>/dev/null || npm ls -g playwright >/dev/null 2>&1 || npm install -g playwright
echo "Media pipeline ready."
