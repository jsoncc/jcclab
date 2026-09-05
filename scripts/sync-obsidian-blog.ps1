param(
  [switch]$DryRun,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$sourceBlog = 'D:\Administrator\Notes\blog'
$sourceImages = 'D:\Administrator\Notes\images'
$targetBlog = 'D:\projects\jcclab\src\assets\blog'
$targetImages = 'D:\projects\jcclab\src\assets\images\blog'

foreach ($dir in @($sourceBlog, $sourceImages, $targetBlog, $targetImages)) {
  if (-not (Test-Path -LiteralPath $dir)) { throw "Directory not found: $dir" }
}

function Get-RelativeFiles($root, $filter) {
  Get-ChildItem -LiteralPath $root -Recurse -File -Filter $filter | ForEach-Object {
    $_.FullName.Substring($root.Length).TrimStart('\')
  }
}

function Normalize-Images($text, $fileName) {
  $text = [regex]::Replace($text, '!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', {
    param($m)
    $image = $m.Groups[1].Value.Trim()
    $alt = if ($m.Groups[2].Success) { $m.Groups[2].Value.Trim() } else { [IO.Path]::GetFileNameWithoutExtension($image) }
    "![$alt](images/blog/$image)"
  })
  return $text
}

function Get-Hash($path) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($path))).Replace('-', '')) }
  finally { $sha.Dispose() }
}

$blogFiles = @(Get-RelativeFiles $sourceBlog '*.md')
$imageFiles = @(Get-RelativeFiles $sourceImages '*') | Where-Object { $_ -match '\.(png|jpe?g|gif|webp|svg)$' }
$changes = @()
$sourceSet = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$blogFiles | ForEach-Object { [void]$sourceSet.Add($_) }
$targetOnly = @(Get-RelativeFiles $targetBlog '*.md' | Where-Object { -not $sourceSet.Contains($_) })

foreach ($rel in $blogFiles) {
  $src = Join-Path $sourceBlog $rel
  $dst = Join-Path $targetBlog $rel
  $content = Normalize-Images ([IO.File]::ReadAllText($src)) $rel
  $old = if (Test-Path -LiteralPath $dst) { [IO.File]::ReadAllText($dst) } else { $null }
  if ($old -ne $content) { $changes += "Markdown: $rel"; if (-not $DryRun) { New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null; [IO.File]::WriteAllText($dst, $content, [Text.UTF8Encoding]::new($false)) } }
}

foreach ($rel in $imageFiles) {
  $src = Join-Path $sourceImages $rel
  $dst = Join-Path $targetImages ([IO.Path]::GetFileName($rel))
  $same = Test-Path -LiteralPath $dst
  if ($same) { $same = (Get-Hash $src) -eq (Get-Hash $dst) }
  if (-not $same) { $changes += "Image: $rel"; if (-not $DryRun) { Copy-Item -LiteralPath $src -Destination $dst -Force } }
}

Write-Output "Detected $($changes.Count) change(s)."
$changes | ForEach-Object { Write-Output "- $_" }
if ($targetOnly.Count) {
  Write-Output "Target-only Markdown files (kept, not deleted):"
  $targetOnly | ForEach-Object { Write-Output "- $_" }
}
if ($DryRun) { Write-Output 'Dry-run: target directory was not modified.'; exit 0 }

$missing = @()
foreach ($rel in $blogFiles) {
  $content = [IO.File]::ReadAllText((Join-Path $targetBlog $rel))
  foreach ($m in [regex]::Matches($content, 'images/blog/([^\)]+)')) {
    if (-not (Test-Path -LiteralPath (Join-Path $targetImages $m.Groups[1].Value))) { $missing += "$rel -> $($m.Groups[1].Value)" }
  }
}
if ($missing.Count) {
  $details = $missing -join "`n"
  throw "Missing image reference(s):`n$details"
}
Write-Output 'Image reference validation passed.'
if (-not $SkipBuild) { npm run build }
