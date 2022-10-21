#!/usr/bin/expect -f

	send "\r"
	send "\r"
        set timeout 2

        set IPaddress [lindex $argv 0]
        set Interface [lindex $argv 1]
        set Action [lindex $argv 2]

        set Username "admin"

        set Password "admin"

        set Directory .

      	log_file -a $Directory/session_$IPaddress.log

        send_log "### /START-SSH-SESSION/ IP: $IPaddress @ [exec date] ###\r"

        spawn ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 -oHostKeyAlgorithms=+ssh-dss -c "3des-cbc" -o "StrictHostKeyChecking no" $Username@$IPaddress
				expect "admin@10.0.0.254's password:"
				send "$Password\n"
        expect ">"

				send "enable\r"

        expect "#"

        send "enable-admin\r"

        expect "#"

        send "conf \r"

        expect "(config)#"

        send "interface gigabitEthernet 1/0/$Interface\r"

        expect "(config-if)#"

        #send "shutdown\r"
				send "power inline supply disable\r"

        expect "(config-if)#"

				sleep 30

        send "interface gigabitEthernet 1/0/$Interface\r"

        expect "(config-if)#"
				send "power inline supply enable\r"
        #send "no shutdown\r"
        expect "(config-if)#"

        send "exit"

        expect "(config)#"

        send "exit"

        expect "#"
        send "exit"

        send_log "\r### /END-SSH-SESSION/ IP: $IPaddress @ [exec date] ###\r"

exit
