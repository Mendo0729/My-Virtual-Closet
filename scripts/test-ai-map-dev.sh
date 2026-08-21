#!/usr/bin/env bash

set -euo pipefail

IMAGE="${1:-}"
RUNS="${2:-3}"
URL="${AI_TEST_URL:-http://100.74.236.102:5173/ai/segment-garment}"

if [[ -z "$IMAGE" || ! -f "$IMAGE" ]]; then
  echo "Uso: $0 /ruta/imagen.jpg [cantidad_pruebas]"
  exit 1
fi

case "${IMAGE##*.}" in
  jpg|JPG|jpeg|JPEG) MIME="image/jpeg" ;;
  png|PNG) MIME="image/png" ;;
  webp|WEBP) MIME="image/webp" ;;
  *)
    echo "Formato no soportado. Usa JPG, PNG o WEBP."
    exit 1
    ;;
esac

BASE64_IMAGE=$(base64 -w 0 "$IMAGE")
TMP_RESPONSE=$(mktemp)
trap 'rm -f "$TMP_RESPONSE"' EXIT

printf 'URL: %s\nImagen: %s\nPruebas: %s\n\n' "$URL" "$IMAGE" "$RUNS"

for i in $(seq 1 "$RUNS"); do
  RESULT=$(curl -sS \
    -o "$TMP_RESPONSE" \
    -w '%{http_code} %{time_starttransfer} %{time_total}' \
    -X POST "$URL" \
    -H 'Content-Type: application/json' \
    --data-binary "{\"image\":\"data:${MIME};base64,${BASE64_IMAGE}\"}")

  HTTP=$(awk '{print $1}' <<< "$RESULT")
  TTFB=$(awk '{print $2}' <<< "$RESULT")
  TOTAL=$(awk '{print $3}' <<< "$RESULT")

  read -r PROVIDER MODEL API_MS LABEL MASK FG BG CONFIDENCE COST <<< "$(python3 - "$TMP_RESPONSE" <<'PY'
import json, sys
try:
    with open(sys.argv[1], encoding='utf-8') as fh:
        data = json.load(fh)
    segmentation = data.get('segmentation') or {}
    values = [
        data.get('provider', '-'),
        data.get('model', '-'),
        data.get('latencyMs', '-'),
        str(segmentation.get('label', '-')).replace(' ', '_'),
        len(segmentation.get('mask') or []),
        len(segmentation.get('foreground_points') or []),
        len(segmentation.get('background_points') or []),
        segmentation.get('confidence', '-'),
        data.get('costUsd', '-'),
    ]
    print(*values)
except Exception:
    print('-', '-', '-', '-', '-', '-', '-', '-', '-')
PY
)"

  printf 'Prueba %d | HTTP %s | Total %.2fs | provider=%s | model=%s | API=%sms | %s | mask=%s | fg=%s | bg=%s | confidence=%s | cost=%s\n' \
    "$i" "$HTTP" "$TOTAL" "$PROVIDER" "$MODEL" "$API_MS" "$LABEL" "$MASK" "$FG" "$BG" "$CONFIDENCE" "$COST"

  if [[ "$HTTP" != "200" ]]; then
    printf 'Respuesta: '
    cat "$TMP_RESPONSE"
    printf '\n'
  fi
done
