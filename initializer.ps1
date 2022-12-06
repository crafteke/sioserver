Function Set-Speaker($Volume){$wshShell = new-object -com wscript.shell;1..50 | % {$wshShell.SendKeys([char]174)};1..$Volume | % {$wshShell.SendKeys([char]175)}}
Set-Speaker(17)

while($true){
  if(Test-Path C:\Users\Crafteke\UNITY_START -PathType Leaf){
    echo "Starting Unity"
    Remove-Item C:\Users\Crafteke\UNITY_START
    Start-Process "C:\Users\Crafteke\Desktop\dystopia_latest\Face6.exe"
  }
  if(Test-Path C:\Users\Crafteke\UNITY_STOP -PathType Leaf){
    echo "Killing Unity"
    Remove-Item C:\Users\Crafteke\UNITY_STOP
    Stop-Process -Name Face6 -Force
  }
  if(Test-Path C:\Users\Crafteke\SYSTEM_SHUTDOWN -PathType Leaf){
    echo "Shutdown computer"
    Remove-Item C:\Users\Crafteke\SYSTEM_SHUTDOWN
    Stop-Computer
    #Start-Process shutdown.exe -ArgumentList "/s /t /f 0"
  }
  if(Test-Path C:\Users\Crafteke\SYSTEM_RESTART -PathType Leaf){
    echo "Restart computer"
    Remove-Item C:\Users\Crafteke\SYSTEM_RESTART
    Restart-Computer
    #Start-Process shutdown.exe -ArgumentList "/s /r /f /t 0"
  }
  echo "Monitoring commands..."
  Start-Sleep -Seconds 5
}
