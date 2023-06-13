# sioserver

This includes an all-in-one central server for the escape game Dystopia. 

## Features

 Markup : - IR Cameras monitoring
          - Hint triggering
          - Puzzle bypassing
          - Devices monitoring (micro-controllers, running services, single computer boards...)
          - Devices restart and powercycling
          - Logs access
          - DMX outputs diagnostic
          
## Customize

Hints can be customized into the file hints.csv. Index must match the ones specified in the game engine.
DMX universes JSON file let you introduce your universes for easy diagnostics.
In server.js, you can can register your board controller name and ip in the variable hosts_ip and their running services in rpi_services.


          
