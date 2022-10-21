#!/bin/bash
switch=192.168.1.254
port=22                 # port
connect_timeout=5       # Connection timeout

# Declare an array of string with type
declare -a ServerArray=("192.168.1.160" "192.168.1.133" "192.168.1.126" "192.168.1.104" "192.168.1.103" )
declare -a InterfaceArray=("16" "25" "10" "6" "4" )
 
# Iterate the string array using for loop
for server in ${ServerArray[@]}; do
	timeout $connect_timeout bash -c "</dev/tcp/$server/$port"
	if [ $? == 0 ];then
	   echo "SSH Connection to $server over port $port is possible"
	else
	   echo "SSH down, on reboot "$server
	   #./reboot_int.sh $switch ${InterfaceArray[@]}
   
	fi
done
