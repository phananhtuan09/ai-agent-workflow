param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CliArgs
)

$ErrorActionPreference = "Stop"

$repo = "phananhtuan09/ai-agent-workflow"
$branch = if ($env:AI_WORKFLOW_BRANCH) { $env:AI_WORKFLOW_BRANCH } else { "main" }
$archiveUrl = if ($env:AI_WORKFLOW_ARCHIVE_URL) {
  $env:AI_WORKFLOW_ARCHIVE_URL
} else {
  "https://github.com/$repo/archive/refs/heads/$branch.zip"
}

$node = Get-Command node -ErrorAction Stop
$tmpRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("ai-workflow-init-" + [System.Guid]::NewGuid())
$archiveFile = Join-Path $tmpRoot "workflow.zip"
$extractDir = Join-Path $tmpRoot "extract"
$exitCode = 0

try {
  New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
  Invoke-WebRequest -Uri $archiveUrl -OutFile $archiveFile
  Expand-Archive -Path $archiveFile -DestinationPath $extractDir -Force

  $repoDir = Get-ChildItem -Path $extractDir -Directory | Select-Object -First 1
  if (-not $repoDir) {
    throw "Unable to locate the extracted workflow archive."
  }

  & $node.Source (Join-Path $repoDir.FullName "cli.js") @CliArgs
  $exitCode = $LASTEXITCODE
}
finally {
  if (Test-Path $tmpRoot) {
    Remove-Item -Path $tmpRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}

exit $exitCode
