@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$files = [System.IO.Directory]::GetFiles($PWD.Path); $names = $files | ForEach-Object { [System.IO.Path]::GetFileName($_) } | Where-Object { $_ -notin @('file_list.bat', 'file_list.txt') }; [System.IO.File]::WriteAllLines([System.IO.Path]::Combine($PWD.Path, 'file_list.txt'), $names, [System.Text.UTF8Encoding]::new($false))"
exit
