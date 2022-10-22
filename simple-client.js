
const
    io = require("socket.io-client"),
    ioClient = io.connect("http://face6core.local:4567");
    readline = require('readline');


//ioClient.onAny(function(event,data) {console.log(data)});

//ioClient.on("Command", (msg)=> {console.log(msg)});

var toggle=0
function periodic_function(){
  ioClient.emit("Command",{controller_id:"lift_button_start",value:toggle});
  toggle++
  toggle=toggle%2
  //console.log("beboop");
}
//setInterval(periodic_function,1000);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});




rl.on('close', function () {
  console.log('\nBYE BYE !!!');
  process.exit(0);
});


rl.question('controller_id:', function (c_id) {
    rl.question('Value:', function (c_value) {
      console.log(`${c_id}, value ${c_value} sent.`);
      ioClient.emit("Command",{controller_id:c_id,value:c_value});
      //rl.close();
    });
  });
