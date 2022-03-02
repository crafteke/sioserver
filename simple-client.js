
const
    io = require("socket.io-client"),
    ioClient = io.connect("http://localhost:4567");

//ioClient.onAny(function(event,data) {console.log(data)});

ioClient.on("Command", (msg)=> {console.log(msg)});

function periodic_function(){
  ioClient.emit("Command",{controller_id:"tenfoutraidescontrollerid",action:42});
  console.log("beboop");
}
//setInterval(periodic_function,1000);
