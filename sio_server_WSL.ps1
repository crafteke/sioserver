wsl sudo /etc/init.d/ssh start
wsl service sioserver start
wsl sudo /etc/init.d/cron start
wsl -u root service rsyslog start
$wsl_ip = (wsl hostname -I).trim()
Write-Host "WSL Machine IP: ""$wsl_ip"""
netsh interface portproxy reset
netsh interface portproxy add v4tov4 listenport=22 connectport=22 connectaddress=$wsl_ip
#netsh interface portproxy delete v4tov4 listenport=3000
netsh interface portproxy add v4tov4 listenport=3000 connectport=3000 connectaddress=$wsl_ip
netsh interface portproxy add v4tov4 listenport=4567 connectport=4567 connectaddress=$wsl_ip
netsh interface portproxy add v4tov4 listenport=514 connectport=514 connectaddress=$wsl_ip
New-NetFirewallRule -DisplayName "ALLOW TCP PORTS SSH/SOCKETIO/HTTP/rsyslog" -Direction inbound -Profile Any -Action Allow -LocalPort 22,4567,3000,514 -Protocol TCP
