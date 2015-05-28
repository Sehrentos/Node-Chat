@echo off
copy "AUTHORS" "distribution/" /Y
copy "LICENSE" "distribution/" /Y
copy "credits.html" "distribution/" /Y
xcopy "locales" "distribution/locales" /EY
copy /B "app.exe" "distribution/" /Y
copy "d3dcompiler_47.dll" "distribution/" /Y
copy "ffmpegsumo.dll" "distribution/" /Y
copy "icudtl.dat" "distribution/" /Y
copy "libEGL.dll" "distribution/" /Y
copy "libGLESv2.dll" "distribution/" /Y
copy "nw.pak" "distribution/" /Y
copy "pdf.dll" "distribution/" /Y