#!/bin/bash
#call this on windows with a shortcut with "C:\Program Files\Git\git-bash.exe" --cd=./Desktop/sioserver/ -c ./launch.sh
#node server.js
node server.js 2>&1 | tee -a sioserver.log
