#!/usr/bin/env bash

input=$(cat)

model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
current_dir=$(echo "$input" | jq -r '.workspace.current_dir // ""')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

folder=$(basename "$current_dir")

branch=""
if [ -n "$current_dir" ] && [ -d "$current_dir/.git" ] || git -C "$current_dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch=$(git -C "$current_dir" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)
fi

output="[$model] 📁 $folder"

if [ -n "$branch" ]; then
  output="$output | 🌿 $branch"
fi

if [ -n "$used_pct" ]; then
  printf_pct=$(printf "%.0f" "$used_pct" 2>/dev/null || echo "$used_pct")
  output="$output | ctx ${printf_pct}%"
fi

echo "$output"
