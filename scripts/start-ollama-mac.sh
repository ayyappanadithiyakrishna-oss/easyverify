#!/bin/sh
# Keeps Ollama local; permits only the EasyVerify domain and local development.
export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_ORIGINS=https://easyverify.vercel.app,http://localhost:3000,http://127.0.0.1:3000
export OLLAMA_NO_CLOUD=1
exec /Applications/Ollama.app/Contents/Resources/ollama serve
