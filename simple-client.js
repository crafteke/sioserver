
const
    io = require("socket.io-client"),
    ioClient = io.connect("http://localhost:4567");

//ioClient.onAny(function(event,data) {console.log(data)});

ioClient.on("Command", (msg)=> {console.log(msg)});

var toggle=0
function periodic_function(){
  ioClient.emit("Command",{controller_id:"lift_button_start",value:toggle});
  toggle++
  toggle=toggle%2
  //console.log("beboop");
}
setInterval(periodic_function,1000);
