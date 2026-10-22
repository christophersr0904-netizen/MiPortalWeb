Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = Chr(34) & strPath & "\iniciar-widget.bat" & Chr(34)
WshShell.CurrentDirectory = strPath
WshShell.Run "cmd /c " & batPath, 0, False
Set WshShell = Nothing
Set fso = Nothing
