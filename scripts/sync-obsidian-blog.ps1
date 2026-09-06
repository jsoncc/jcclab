param(
  [switch]$DryRun,
  [switch]$SkipBuild
)

$nodeArgs = @('scripts/sync-obsidian-blog.mjs')
if ($DryRun) { $nodeArgs += '--dry-run' }
if ($SkipBuild) { $nodeArgs += '--skip-build' }
& node @nodeArgs
exit $LASTEXITCODE
