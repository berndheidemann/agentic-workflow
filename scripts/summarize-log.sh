#!/bin/bash

# Summarizes a stream-json iteration log into a compact Markdown summary.
# Used by the Opus validation loop to review what the agent did.
#
# Usage: ./scripts/summarize-log.sh .agent/logs/iter-001.jsonl
# Output: Markdown to stdout (~2-3 pages per iteration)

set -euo pipefail

LOG_FILE="${1:?Usage: summarize-log.sh <iter-log.jsonl>}"

if [ ! -f "$LOG_FILE" ]; then
  echo "Error: $LOG_FILE not found"
  exit 1
fi

ITER_NAME=$(basename "$LOG_FILE" .jsonl)

echo "## $ITER_NAME"
echo ""

# Extract model info
MODEL=$(jq -r 'select(.type == "system") | .model // empty' "$LOG_FILE" 2>/dev/null | head -1)
[ -n "$MODEL" ] && echo "**Model:** $MODEL"

# Extract cost and duration from result
RESULT_LINE=$(jq -c 'select(.type == "result")' "$LOG_FILE" 2>/dev/null | tail -1)
if [ -n "$RESULT_LINE" ]; then
  COST=$(echo "$RESULT_LINE" | jq -r '.total_cost_usd // "?"')
  DURATION=$(echo "$RESULT_LINE" | jq -r '.duration_ms // 0')
  DURATION_S=$(LC_NUMERIC=C awk "BEGIN{printf \"%.0f\", ${DURATION:-0}/1000}")
  echo "**Cost:** \$${COST} | **Duration:** ${DURATION_S}s"
fi
echo ""

# Extract agent reasoning (text blocks) and tool calls in order
echo "### Agent-Verlauf"
echo ""

jq -r '
  select(.type == "assistant") |
  .message.content[]? |
  if .type == "text" then
    "💬 " + (.text | gsub("\n"; " ") | .[:200])
  elif .type == "tool_use" then
    "🔧 **" + .name + "**" + (
      if .name == "Read" or .name == "Write" then " `" + (.input.file_path // "?") + "`"
      elif .name == "Edit" then " `" + (.input.file_path // "?") + "`"
      elif .name == "Glob" then " `" + (.input.pattern // "?") + "`"
      elif .name == "Grep" then " `" + (.input.pattern // "?") + "`"
      elif .name == "Bash" then " `" + ((.input.command // "?") | gsub("\n"; " ") | .[:80]) + "`"
      elif .name == "Task" then " [" + (.input.model // "opus") + "] " + (.input.description // "")
      elif (.name | startswith("mcp__playwright__")) then " " + (.name | sub("mcp__playwright__browser_"; ""))
      else ""
      end
    )
  else empty
  end
' "$LOG_FILE" 2>/dev/null | head -150

echo ""

# Extract status blocks
echo "### Status-Block"
echo ""
STATUS=$(jq -r '
  select(.type == "assistant") |
  .message.content[]? |
  select(.type == "text") |
  .text | capture("(?<block>===STATUS===.*?===END_STATUS===)"; "s") |
  .block
' "$LOG_FILE" 2>/dev/null | tail -1)

if [ -n "$STATUS" ]; then
  echo '```'
  echo "$STATUS"
  echo '```'
else
  echo "_Kein Status-Block gefunden._"
fi

echo ""

# Extract errors (tool results with errors)
ERRORS=$(jq -r '
  select(.type == "result" or .type == "tool_result") |
  if .error then "❌ " + (.error | tostring | .[:200])
  elif .is_error then "❌ " + (.content // .output // "" | tostring | .[:200])
  else empty
  end
' "$LOG_FILE" 2>/dev/null | head -10)

if [ -n "$ERRORS" ]; then
  echo "### Fehler"
  echo ""
  echo "$ERRORS"
  echo ""
fi

# Model usage breakdown
if [ -n "$RESULT_LINE" ]; then
  HAS_USAGE=$(echo "$RESULT_LINE" | jq '.modelUsage | length // 0' 2>/dev/null)
  if [ "${HAS_USAGE:-0}" -gt 0 ]; then
    echo "### Model-Usage"
    echo ""
    echo "$RESULT_LINE" | jq -r '
      .modelUsage | to_entries[] |
      "- **" + (.key | sub("claude-"; "") | sub("-20[0-9]+"; "")) + "**: $" +
      (.value.costUSD // 0 | tostring | .[:6]) +
      " (in:" + (.value.inputTokens // 0 | tostring) +
      " out:" + (.value.outputTokens // 0 | tostring) +
      " cache:" + ((.value.cacheReadInputTokens // 0) + (.value.cacheCreationInputTokens // 0) | tostring) + ")"
    ' 2>/dev/null
    echo ""
  fi
fi
