#!/usr/bin/env bash

set -euo pipefail

REPO="phananhtuan09/ai-agent-workflow"
BRANCH="${AI_WORKFLOW_BRANCH:-main}"
ARCHIVE_URL="${AI_WORKFLOW_ARCHIVE_URL:-https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js >= 14 is required." >&2
  exit 1
fi

if ! command -v tar >/dev/null 2>&1; then
  echo "tar is required to extract the workflow archive." >&2
  exit 1
fi

if command -v curl >/dev/null 2>&1; then
  download_archive() {
    curl -fsSL "$1" -o "$2"
  }
elif command -v wget >/dev/null 2>&1; then
  download_archive() {
    wget -qO "$2" "$1"
  }
else
  echo "curl or wget is required to download the workflow archive." >&2
  exit 1
fi

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t ai-workflow-init)"
ARCHIVE_FILE="${TMP_DIR}/workflow.tar.gz"
EXTRACT_DIR="${TMP_DIR}/extract"

cleanup() {
  rm -rf "${TMP_DIR}"
}

trap cleanup EXIT INT TERM

mkdir -p "${EXTRACT_DIR}"
download_archive "${ARCHIVE_URL}" "${ARCHIVE_FILE}"
tar -xzf "${ARCHIVE_FILE}" -C "${EXTRACT_DIR}"

REPO_DIR="$(find "${EXTRACT_DIR}" -mindepth 1 -maxdepth 1 -type d | head -n 1)"

if [ -z "${REPO_DIR}" ]; then
  echo "Unable to locate the extracted workflow archive." >&2
  exit 1
fi

node "${REPO_DIR}/cli.js" "$@"
