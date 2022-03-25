const http = require('http');
const express = require('express');
const path = require('path');
const app = express();
const { exec } = require("child_process");
restart_all_controllers();
app.use(express.urlencoded({ extended: true }));
const router = express.Router();

app.use(express.json());

app.use(express.static('css'));
app.use(express.static('js'));


router.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/html/index.html'));
  //__dirname : It will resolve to your project folder.
});

app.post("/select_level", (req, res) => {
   res.json({
      commands: commands[req.body.level]
   })
})
app.get('/logs',(req,res)=>{
  res.json({logs_content:logs})
})
app.post("/send_command", (req, res) => {
  console.log("Sending command:",req.body);
    io.emit("Command",req.body);
   res.json([{
      status: 'ok'
   }])
})
app.use('/', router);
const server = http.createServer(app);
const port = 3000;
server.listen(port);console.debug('Server listening on port ' + port);

const commands= require('./commands.json')
var logs=""
/*--------SOCKET IO Server ----------*/
var io = require('socket.io')({});

io.attach(4567,{pingTimeout:50000,pingInterval:10000});

var clients={};
var sio_socket;

io.on('connection',  function (socket) {
  var clientIp = socket.request.connection.remoteAddress;
  const socketId = socket.id;
  var clientName='';
  console.log('New connection from ' + clientIp + " with socket ID:"+socketId);
	socket.on('Binary', (data)=>{
		socket.to(clients["roof_controller"]).emit("MessageIn",data)
	});
  socket.on("Message", (data) => {
		  console.log("Message sending from:"+clientName+" to:"+data.to + " on socketid:"+clients[data.to]);
      socket.to(clients[data.to]).emit("Message",data.msg)
      //socket.emit("beboop",json_message);
	});

  socket.on("Event", (data) => {
    console.log(clientName+" send:"+JSON.stringify(data));
    socket.to(clients["engine"]).emit("Event",clientName,data)
  }
)
  socket.on("Command", (data) => {
      log="Command from:"+clientName+", id:"+data.controller_id+", value:"+data.value
		  console.log(log)
      logs = logs+log+'\n'
      io.emit("Command",data)
      //socket.emit("beboop",json_message);
	});
  socket.on("Register", (data) => {
		  console.log("Registration received:"+data);
      clients[data]=socketId;
      clientName=data;
	});
  function periodic_function(){
    io.emit("Command","it's alive!");
    console.log("beboop");
  }
  //setInterval(periodic_function,2000);
});

function restart_all_controllers(){
  const rpis = ['liftpi', 'halpi'];
  rpis.forEach(rpi => {
    console.log(`Restart rpi controller: ${rpi}...`)
    //maybe add -i ~/.ssh/face6 or id_rsa
    exec("ssh -o \"StrictHostKeyChecking=no\" pi@" +rpi+ ".local 'sudo systemctl restart controller'", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`${rpi} controller Restarted. ${stdout}`);
    });
});

}


// {
//     lift:{button_up:{released:0, pushed:1},button_down:{released:0, pushed:1}},
//     hal:{circuit_0:{unplugged:0, good:1,wrong:-1},circuit_1:{unplugged:0, good:1,wrong:-1},circuit_2:{unplugged:0, good:1,wrong:-1},circuit_3:{unplugged:0, good:1,wrong:-1},hal_button:{released:0, pushed:1}},
//     corridor:{push_pad:{good:"0101101",wrong:"0111101"}},
//     room_01:{knob_0:{left:-1,right:1},button_0:{released:0, pushed:1},plug_0:{released:0, plugged:1}},
//     roomt_02:{rfid_0:{removed:0,present:1},rfid_1:{removed:0,present:1},rfid_2:{removed:0,present:1},rfid_3:{removed:0,present:1},rfid_4:{removed:0,present:1},rfid_5:{removed:0,present:1},rfid_validation_button:{released:0, pushed:1}}
// }
