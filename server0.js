const http = require('http');
const express = require('express');
const path = require('path');
const app = express();
const { exec } = require("child_process");

const rpi_services={'liftpi':["controller","dmx2pwm"],
'halpi':['controller','dmx2pwm'],
'counterpadPi':['controller'],
'lockerspi':['controller','dmx2pwm','elwire_controller'],
'rfidpi':['controller','dmx2pwm'],
'incalpi':['controller','dmx2pwm','incal_animator'],
'roofpi':['dmxspi'],
'room01lightpi':['dmx2pwm']}
let rpis_status={}

//restart_all_controllers();

app.use(express.urlencoded({ extended: true }));
const router = express.Router();

app.use(express.json());

app.use(express.static('css'));
app.use(express.static('js'));
app.set('view engine', 'pug');

router.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/html/index.html'));
  //__dirname : It will resolve to your project folder.
});
router.get('/cameras',function(req,res){
  res.sendFile(path.join(__dirname+'/html/camera.html'));
  //__dirname : It will resolve to your project folder.
});
router.get('/dashboard',function(req,res){
  res.render('dashboard',{rpi_services: rpi_services})
  //res.sendFile(path.join(__dirname+'/html/checkout.html'));
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
app.get('/co_status',(req,res)=>{
  res.json(rpis_status)
})
app.get('/restart_service/:service',(req,res)=>{
  var service = req.params.service
  console.log("Restart request:"+service)
  service = service.split('-')
  restart_rpi_service(service[0],service[1])
  res.json([{
     status: 'ok'
  }])
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
		  //console.log("Message sending from:"+clientName+" to:"+data.to + " on socketid:"+clients[data.to]);
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
      if(data.controller_id != "corridor_padled_state"){
        logs = log+"\n"+logs
        logs=logs.split("\n").slice(0,30).join("\n");
      }
      io.emit("Command",data)
      //socket.emit("beboop",json_message);
	});
  socket.on("Register", (data) => {
		  console.log("Registration received:"+data);
      clients[data]=socketId;
      clientName=data;
	});

});
function ping(host){
exec(`ping -c 1 ${host} > /dev/null && echo 'ok' ||  echo 'ko'`, (error, stdout, stderr) => {
    return stdout=='ok'
  })
}
//initialize
Object.entries(rpi_services).forEach(([rpi,services])=>
{
    rpis_status[rpi]={}
})
function checkup(){
  Object.entries(rpi_services).forEach(([rpi,services])=>
  {
      services.forEach(service=>{
        //maybe add -i ~/.ssh/face6 or id_rsa
        var statuses_json={}
        exec("ssh -o \"StrictHostKeyChecking=no\" pi@" +rpi+ " 'sudo systemctl show "+service+" --no-page'", (error, stdout, stderr) => {
            if (error) {
                console.log(`check error: ${error.message}`);
                statuses_json+={name:service,'error':error.message}
                return;
            }
            if (stderr) {
                console.log(`check stderr: ${stderr}`);
                statuses_json+={name:service,'error':stderr}
                return;
            }
            var regex_name= /Names=.*/
            var regex_status= /StatusText=.*/
            var regex_active= /ActiveState=.*/
            // if(regex_name.test(stdout)){
            //     statuses_json["name"]=regex_name.exec(stdout)[0].split('=')[1]
            // }
            statuses_json['name']=service

              if(regex_active.test(stdout)){
                statuses_json['status']=regex_active.exec(stdout)[0].split('=')[1]
              }
              statuses_json['notify']=''

              if(regex_status.test(stdout)){
                statuses_json['notify']=regex_status.exec(stdout)[0].split('=')[1]
              }
              rpis_status[rpi][service]=statuses_json
            });
          })

    })
}
//for debug
// function output(){
//   console.log(JSON.stringify(rpis_status))
// }
//setInterval(output,2000);

setInterval(checkup,5000);


function restart_rpi_service(rpi,service){
  exec("ssh -o \"StrictHostKeyChecking=no\" pi@" +rpi+ ".local 'sudo systemctl restart "+ service +"'", (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
      }
      console.log(`${rpi} service ${service} Restarted. ${stdout}`);
    })
}
function restart_all_controllers(){
  Object.entries(rpi_services).forEach(([rpi,services])=>
  {
    console.log('Restarting services RPi:'+rpi)

    services.forEach(service=>{
      //maybe add -i ~/.ssh/face6 or id_rsa
      restart_rpi_service(rpi,service)
  })

  //
  // services.forEach(rpi => {
  //   console.log(`Restart rpi controller: ${rpi}...`)
  //
  //   });
});

}


// {
//     lift:{button_up:{released:0, pushed:1},button_down:{released:0, pushed:1}},
//     hal:{circuit_0:{unplugged:0, good:1,wrong:-1},circuit_1:{unplugged:0, good:1,wrong:-1},circuit_2:{unplugged:0, good:1,wrong:-1},circuit_3:{unplugged:0, good:1,wrong:-1},hal_button:{released:0, pushed:1}},
//     corridor:{push_pad:{good:"0101101",wrong:"0111101"}},
//     room_01:{knob_0:{left:-1,right:1},button_0:{released:0, pushed:1},plug_0:{released:0, plugged:1}},
//     roomt_02:{rfid_0:{removed:0,present:1},rfid_1:{removed:0,present:1},rfid_2:{removed:0,present:1},rfid_3:{removed:0,present:1},rfid_4:{removed:0,present:1},rfid_5:{removed:0,present:1},rfid_validation_button:{released:0, pushed:1}}
// }