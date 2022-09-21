const http = require('http');
const express = require('express');
const path = require('path');
var events = require('events');
var event_emitter = new events.EventEmitter();
const app = express();
const util = require('node:util');
const { exec } = require("child_process");
const exec_async = util.promisify(require('node:child_process').exec);
var dmxlib=require('dmxnet');
var dmxnet = new dmxlib.dmxnet();
const commands= require('./commands.json')
const dmx_universes=require('./dmx_universes.json')
//write a all blink method that set all channels to 255 on everybody
const rpi_services={'liftpi':["controller","dmx2pwm"],
'halpi':['controller','dmx2pwm','uv4l_raspicam'],
'counterpadpi':['controller','uv4l_raspicam'],
'lockerspi':['controller','dmx2pwm','elwire_controller','uv4l_raspicam'],
'rfidpi':['controller','dmx2pwm'],
'incalpi':['controller','dmx2pwm','incal_animator','uv4l_raspicam'],
'roofpi':['dmxspi'],
'room01lightpi':['dmx2pwm'],
'watchpi':['uv4l_raspicam'],
'cubepi':['controller']}
const hosts_ip={'roofpi':'10.0.0.238','rfidpi':'10.0.0.211','incalpi':'10.0.0.213',
'lockerspi':'10.0.0.214','liftpi':'10.0.0.215','room01lightpi':'10.0.0.216',
 'halpi':'10.0.0.210','counterpadpi':'10.0.0.212','watchpi':'10.0.0.204',"cubepi":"10.0.0.201"}

// const rpi_services={'10.0.0.215':["controller","dmx2pwm"],
// '10.0.0.210':['controller','dmx2pwm'],
// '10.0.0.212':['controller'],
// '10.0.0.214':['controller','dmx2pwm','elwire_controller'],
// '10.0.0.211':['controller','dmx2pwm'],
// '10.0.0.213':['controller','dmx2pwm','incal_animator'],
// '10.0.0.238':['dmxspi'],
// '10.0.0.216':['dmx2pwm']}
let rpis_status={}

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
router.get('/masterize',function(req,res){
  //res.sendFile(path.join(__dirname+'/html/camera.html'));
  var commands_filtered = Object.keys(commands).filter((key) =>  key == 'hints' || key == 'bypass').reduce((obj, key) => {return Object.assign(obj,{ [key]:commands[key]});},{});
  //commands_filtered={}
  res.render('masterize',{level_commands: commands_filtered})

  //__dirname : It will resolve to your project folder.
});
router.get('/dashboard',function(req,res){
  res.render('dashboard',{rpi_services: rpi_services})
  //res.sendFile(path.join(__dirname+'/html/checkout.html'));
  //__dirname : It will resolve to your project folder.
});
router.get('/checkup',function(req,res){
  var commands_filtered = Object.keys(commands).filter((key) =>  key != 'hints' && key != 'bypass').reduce((obj, key) => {return Object.assign(obj,{ [key]:commands[key]});},{});
  //commands_filtered={}
  res.render('checkup',{level_commands: commands_filtered})
  //res.sendFile(path.join(__dirname+'/html/checkout.html'));
  //__dirname : It will resolve to your project folder.
});
router.get('/dmx',function(req,res){
  var commands_filtered = Object.keys(commands).filter((key) =>  key != 'hints' && key != 'bypass').reduce((obj, key) => {return Object.assign(obj,{ [key]:commands[key]});},{});
  //commands_filtered={}
  res.render('dmx_tests',{dmx_universes: dmx_universes})
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
app.get('/sio_status',(req,res)=>{
  res.json(clients)
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
app.get('/get_journal/:service',async (req,res)=>{
  var service = req.params.service
  console.log("Get journal request:"+service)
  service = service.split('-')
  var logs = await getlogs_rpi_service(service[0],service[1])
  res.json({content:logs})
})



app.post("/send_command", (req, res) => {
  console.log("Sending command:",req.body);
  event_emitter.emit('SIO_Command',req.body)
    io.emit("Command",req.body);
   res.json([{
      status: 'ok'
   }])
})
app.post("/shutdown_control", (req, res) => {
  console.log("Shutdowning computer.",req.body);

  exec(`shutdown /s /f /t 0`, (error, stdout, stderr) => {
      return stdout=='ok'
    })
   res.json([{
      status: 'ok'
   }])
})
app.post("/start_unity", (req, res) => {
  console.log("Starting unity.",req.body);

  exec(`start /s /f /t 0`, (error, stdout, stderr) => {
      console.log(error)
      console.log(stdout)
      console.log(stderr)
    })
   res.json([{
      status: 'ok'
   }])
})

app.post("/set_dmx", (req, res) => {
  json=req.body
  setDMX(json.ip,json.universe,json.channels,json.value)
   res.json([{
      status: 'ok'
   }])
})
//curl 10.0.0.241:3000/stream_commands --no-buffer
app.get("/stream_commands", (req, res) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
    });
    res.flushHeaders();
    event_emitter.on("SIO_Command", (data) => {
        console.log('command event')
        res.write(JSON.stringify(data)+'\n')
    });
    res.on("close", () => {
      res.end();
    });
  })

app.get("/stream_services", (req, res) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
    });
    res.flushHeaders();

    const interval = setInterval(() => {
      res.write(JSON.stringify(rpis_status))
    }, 1000);

    res.on("close", () => {
      clearInterval(interval);
      res.end();
    });
  })
app.use('/', router);
const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('Server listening on port ' + port);

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
    //old time when we stream tcp package to roof
		//socket.to(clients["roof_controller"]).emit("MessageIn",data)
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
      //log="Command from:"+clientName+", id:"+data.controller_id+", value:"+data.value
      //console.log(log)
      // if(data.controller_id != "corridor_padled_state"){
      //   logs = log+"\n"+logs
      //   logs=logs.split("\n").slice(0,30).join("\n");
      // }
      event_emitter.emit('SIO_Command',data)
      io.emit("Command",data)
      //socket.emit("beboop",json_message);
	});
  socket.on("Register", (data) => {
		  console.log("Registration received:"+data);
      clients[data.toLowerCase()]=socketId;
      clientName=data.toLowerCase();
	});
  socket.once('disconnect', function () {
    clients[clientName]=false;
  });


});

function check_clients(){
  console.log(JSON.stringify(clients))
  Object.entries(clients).forEach(([name,s_id])=>{
    if(s_id) {
      console.log(name+":"+'connected');
    }
    else{
      console.log(name+":"+'disconnected');

    }
})
}
//setInterval(check_clients,2000);


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
        exec("ssh -o \"StrictHostKeyChecking=no\" pi@" +hosts_ip[rpi]+ " 'sudo systemctl show "+service+" --no-page'", (error, stdout, stderr) => {
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
              if(service=='controller'){
                statuses_json['sio_status']=clients[rpi] ? 'UP' : 'DOWN';
              }
              else{
                statuses_json['sio_status']=false
              }
              rpis_status[rpi][service]=statuses_json
            });
          })

    })
}
function generate_debug_data(){
  Object.entries(rpi_services).forEach(([rpi,services])=>
  {
      services.forEach(service=>{
        //maybe add -i ~/.ssh/face6 or id_rsa
        var statuses_json={}
        statuses_json['name']=service
        statuses_json['status']='active'
        statuses_json['notify']='sio:1'
        if(service=='controller'){
          statuses_json['sio_status']='DOWN'
        }
        else{
          statuses_json['sio_status']=false
        }
          rpis_status[rpi][service]=statuses_json
        })

    })

}
//for debug
// function output(){
//   console.log(JSON.stringify(rpis_status))
// }
//setInterval(output,2000);
var ONLINE_MODE=true;
if(ONLINE_MODE){ //set to true for production
  restart_all_controllers();
  checkup()
  setInterval(checkup,10000);
}
//this is for offline dev, populate & simulate datachange
else{
  generate_debug_data()
  var status=['active','inactive']
  setInterval(function(){rpis_status['liftpi']['controller']['status']=status[Math.floor(Math.random()*2)]},2000)
}

function restart_rpi_service(rpi,service){
  exec("ssh -o \"StrictHostKeyChecking=no\" pi@" +hosts_ip[rpi]+ " 'sudo systemctl restart "+ service +"'", (error, stdout, stderr) => {
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


async function getlogs_rpi_service(rpi,service){
  const { stdout, stderr } = await exec_async("ssh -o \"StrictHostKeyChecking=no\" pi@" +hosts_ip[rpi]+ " 'journalctl -u "+ service +".service | tail -n200'")
   //console.log(stdout)
   logs=stdout+stderr //will do better one day
   return logs
}
// function getlogs_rpi_service(rpi,services,successCallback, errorCallback){
//    exec("ssh -o \"StrictHostKeyChecking=no\" pi@" +hosts_ip[rpi]+ " 'journalctl -u "+ service +".service | tail -n200'", (error, stdout, stderr) => {
//       if (error) {
//           console.log(`error: ${error.message}`);
//           errorCallback(error.message)
//           // return;
//       }
//       if (stderr) {
//           console.log(`stderr: ${stderr}`);
//           errorCallback(stderr)
//           //return;
//       }
//       successCallback(stdout);
//     })
// }

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

function setDMX(ip,universe,number_of_channels,value){
  var sender=dmxnet.newSender({ip: ip, //IP to send to, default 255.255.255.255
    subnet: 0, //Destination subnet, default 0
    universe: universe, //Destination universe, default 0
    net: 0, //Destination net, default 0
    port: 6454, //Destination UDP Port, default 6454
    base_refresh_interval: 0 // Default interval for sending unchanged ArtDmx
    });
  console.log("Setting dmx:",ip,"-",number_of_channels,"-",value)
  //sender.setChannel(3,value);

  sender.fillChannels(0,number_of_channels-1,value);
  sender.transmit();
  setTimeout(function() {
  sender.stop();
  }, 2000);
  // if(value==0){
  //   sender.reset();
  // }
}


// {
//     lift:{button_up:{released:0, pushed:1},button_down:{released:0, pushed:1}},
//     hal:{circuit_0:{unplugged:0, good:1,wrong:-1},circuit_1:{unplugged:0, good:1,wrong:-1},circuit_2:{unplugged:0, good:1,wrong:-1},circuit_3:{unplugged:0, good:1,wrong:-1},hal_button:{released:0, pushed:1}},
//     corridor:{push_pad:{good:"0101101",wrong:"0111101"}},
//     room_01:{knob_0:{left:-1,right:1},button_0:{released:0, pushed:1},plug_0:{released:0, plugged:1}},
//     roomt_02:{rfid_0:{removed:0,present:1},rfid_1:{removed:0,present:1},rfid_2:{removed:0,present:1},rfid_3:{removed:0,present:1},rfid_4:{removed:0,present:1},rfid_5:{removed:0,present:1},rfid_validation_button:{released:0, pushed:1}}
// }
