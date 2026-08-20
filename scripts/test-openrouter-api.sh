#!/usr/bin/env bash

set -euo pipefail

IMAGE="${1:-}"
RUNS="${2:-5}"
URL="${OPENROUTER_TEST_URL:-http://100.74.236.102:5173/ai/analyze-garment}"

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

SUM=0
SUCCESS=0

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

  if [[ "$HTTP" == "200" ]]; then
    SUCCESS=$((SUCCESS + 1))
    SUM=$(awk -v a="$SUM" -v b="$TOTAL" 'BEGIN { printf "%.6f", a + b }')
  fi

  API_MS=$(python3 - "$TMP_RESPONSE" <<'PY'
import json, sys
try:
    with open(sys.argv[1], encoding='utf-8') as fh:
        data = json.load(fh)
    print(data.get('latencyMs', '-'))
except Exception:
    print('-')
PY
)

  printf 'Prueba %d | HTTP %s | TTFB %.2fs | Total %.2fs | OpenRouter %sms\n' \
    "$i" "$HTTP" "$TTFB" "$TOTAL" "$API_MS"
done

if [[ "$SUCCESS" -gt 0 ]]; then
  AVG=$(awk -v total="$SUM" -v runs="$SUCCESS" 'BEGIN { printf "%.2f", total / runs }')
  printf '\nPromedio exitoso: %ss (%d/%d HTTP 200)\n' "$AVG" "$SUCCESS" "$RUNS"
else
  printf '\nNo hubo respuestas HTTP 200. Última respuesta:\n'
  cat "$TMP_RESPONSE"
  printf '\n'
fi
