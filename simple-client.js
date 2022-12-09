
const readline = require('readline');

const io=require("socket.io-client");

const URL = "ws://face6core.local:4567";
const socket = io.connect(URL, { autoConnect: true });

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



// ioClient.on('connection',function(){
//   console.log('bou')
// })
// ioClient.on("connection", (socket) => {
//   console.log('connected!')
//   socket.data.username = "alice";
// });
// ioClient = io.connect("http://");
//
// rl.on('close', function () {
//   console.log('\nBYE BYE !!!');
//   process.exit(0);
// });

socket.on("connect", () => {
  console.log('connected!')
  //socket.data.name="mr biere" not working

});

socket.on("disconnect", () => {
  console.log('disconnected!')
});

rl.question('controller_id:', function (c_id) {
    rl.question('Value:', function (c_value) {
      console.log(`${c_id}, value ${c_value} sent.`);
      ioClient.emit("Command",{controller_id:c_id,value:c_value});
      //rl.close();
    });
  });
