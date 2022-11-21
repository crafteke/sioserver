#!/bin/bash
echo "Checking SIO server status"
service sioserver status 2> /dev/null

if [ $? -eq 3 ]
then
  echo "Not running. Start..."
  service sioserver start
fi

service sioserver status
if [ $? -eq 0 ]
then
  echo "Running!"
else
  echo "Still not running..."
fi
