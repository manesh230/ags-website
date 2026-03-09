@echo off
echo Starting AGS Website Server...
echo.
echo Store:  http://localhost:5500/index.html
echo Admin:  http://localhost:5500/admin.html
echo Email:  http://localhost:3001/health
echo.

REM ---- Start the Node.js SMTP email server in a separate window ----
set NODE_EXE=%ProgramFiles%\nodejs\node.exe
set NPM_CMD=%ProgramFiles%\nodejs\npm.cmd
if not exist "%NODE_EXE%" set NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe
if not exist "%NODE_EXE%" (
  echo [WARNING] Node.js not found at default path. Email sending will not work.
) else (
  if not exist "%~dp0node_modules" (
    echo Installing Node.js dependencies...
    pushd "%~dp0"
    call "%NPM_CMD%" install --silent
    popd
  )
  start "AGS Email Server" cmd /k "cd /d "%~dp0" && "%NODE_EXE%" email-server.js"
)

echo.
echo Press Ctrl+C to stop the static file server.
echo.
start "" "http://localhost:5500/index.html"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$listener = New-Object System.Net.HttpListener;" ^
  "$listener.Prefixes.Add('http://localhost:5500/');" ^
  "$listener.Start();" ^
  "Write-Host 'Server running at http://localhost:5500';" ^
  "while ($listener.IsListening) {" ^
  "  $ctx = $listener.GetContext();" ^
  "  $req = $ctx.Request; $res = $ctx.Response;" ^
  "  $path = $req.Url.LocalPath -replace '/','\\';" ^
  "  if ($path -eq '\\') { $path = '\\index.html' };" ^
  "  $file = Join-Path '%~dp0' $path.TrimStart('\\');" ^
  "  if (Test-Path $file) {" ^
  "    $bytes = [System.IO.File]::ReadAllBytes($file);" ^
  "    $ext = [System.IO.Path]::GetExtension($file);" ^
  "    $mime = @{'.html'='text/html';'.css'='text/css';'.js'='application/javascript';'.png'='image/png';'.jpg'='image/jpeg';'.mp4'='video/mp4';'.webm'='video/webm'}[$ext];" ^
  "    if (-not $mime) { $mime = 'application/octet-stream' };" ^
  "    $res.ContentType = $mime;" ^
  "    $res.ContentLength64 = $bytes.Length;" ^
  "    $res.OutputStream.Write($bytes, 0, $bytes.Length);" ^
  "  } else {" ^
  "    $res.StatusCode = 404;" ^
  "  };" ^
  "  $res.Close();" ^
  "}"
