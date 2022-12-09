#!/usr/local/bin/node
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
//const csv = require('csv')
const fs = require("fs");
const { parse } = require("csv-parse");
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
 'halpi':'10.0.0.210','counterpadpi':'10.0.0.212','watchpi':'10.0.0.204','cubepi':'10.0.0.201'}

switch_ports={'roofpi':8,'rfidpi':18,'incalpi':14,'lockerspi':10,'liftpi':12,'room01lightpi':6,
 'halpi':4,'counterpadpi':16,'watchpi':46}
// const rpi_services={'10.0.0.215':["controller","dmx2pwm"],
// '10.0.0.210':['controller','dmx2pwm'],
// '10.0.0.212':['controller'],
// '10.0.0.214':['controller','dmx2pwm','elwire_controller'],
// '10.0.0.211':['controller','dmx2pwm'],
// '10.0.0.213':['controller','dmx2pwm','incal_animator'],
// '10.0.0.238':['dmxspi'],
// '10.0.0.216':['dmx2pwm']}
//FOR production set to true
var ONLINE_MODE=true;

let rpis_status={}
hints={}
fs.createReadStream("./hints.csv")
  .pipe(parse({ delimiter: "," }))
  .on("data", function (row) {
    hint={text:row[0],index:row[2]}
    if(hints[row[1]] != undefined){
      hints[row[1]].push(hint)
    }
    else{
      hints[row[1]]=[hint]
    }
  //  console.log(row);
  })
  .on("end", function () {
    console.log("Importing hints: done.");
    //console.log(JSON.stringify(hints))
  })
  .on("error", function (error) {
    console.log("error on hints import:",error.message);
  });

app.use(express.urlencoded({ extended: true }));
const router = express.Router();

app.use(express.json());

app.use(express.static('css'));
app.use(express.static('js'));
app.use(express.static('img'));

app.set('view engine', 'pug');

router.get('/v1',function(req,res){
  res.sendFile(path.join(__dirname+'/html/index.html'));
  //__dirname : It will resolve to your project folder.
});
router.get('/',function(req,res){
  res.redirect('masterize')
});
router.get('/masterize',function(req,res){
  var hints_filtered = Object.keys(commands).filter((key) => key == 'hints').reduce((obj, key) => {return Object.assign(obj,{ [key]:commands[key]});},{});
  var bypass_filtered = Object.keys(commands).filter((key) => key == 'bypass').reduce((obj, key) => {return Object.assign(obj,{ [key]:commands[key]});},{});
  res.render('masterize',{title:'masterize',hints_commands: hints,bypass_commands:bypass_filtered})
  //__dirname : It will resolve to your project folder.
});
router.get('/dashboard',function(req,res){
  res.render('dashboard',{title:'dashboard',rpi_services: rpis_status})
  //res.sendFile(path.join(__dirname+'/html/checkout.html'));
  //__dirname : It will resolve to your project folder.
});
router.get('/checkup',function(req,res){
  var commands_filtered = Object.keys(commands).filter((key) =>  key != 'hints' && key != 'bypass').reduce((obj, key) => {return Object.assign(obj,{ [key]:commands[key]});},{});
  //commands_filtered={}
  res.render('checkup',{title:'checkup',level_commands: commands_filtered})
  //res.sendFile(path.join(__dirname+'/html/checkout.html'));
  //__dirname : It will resolve to your project folder.
});
router.get('/dmx',function(req,res){
  var commands_filtered = Object.keys(commands).filter((key) =>  key != 'hints' && key != 'bypass').reduce((obj, key) => {return Object.assign(obj,{ [key]:commands[key]});},{});
  //commands_filtered={}
  res.render('dmx_tests',{title:'dmx_tests',dmx_universes: dmx_universes})
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
app.post("/send_speech", (req, res) => {
  console.log("Sending speech:",req.body);
    io.emit("Speech",req.body);
   res.json([{
      status: 'ok'
   }])
})
app.post("/shutdown_control", async (req, res) => {
  console.log("Shutdowning computer and pis.",req.body);
  //wait for all pis to be off
  //await asyncAllPiCommand('sudo shutdown');
  //kill unity
  //Taskkill.exe /IM "Face6.exe" /F
  //halt_them_all()
  //await getlogs_rpi_service("","")
  //await exec_async(`shutdown.exe /s /f /t 0`, (error, stdout, stderr) => {
  await exec_async(`touch /mnt/c/Users/Crafteke/SYSTEM_SHUTDOWN`, (error, stdout, stderr) => {
    console.log(error)
    console.log(stdout)
    console.log(stderr)
  //exec(`echo "bobouboub"`, (error, stdout, stderr) => {
      return stdout=='ok'
    })
   res.json([{
      status: 'ok'
   }])
})
app.post("/restart_control", async (req, res) => {
  console.log("Restarting computer and pis.",req.body);
  //wait for all pis to be off
  //await asyncAllPiCommand('sudo reboot');
  //kill unity
  //Taskkill.exe /IM "Face6.exe" /F
  //halt_them_all()
  //await getlogs_rpi_service("","")
  //await exec_async(`shutdown.exe /s /f /t 0`, (error, stdout, stderr) => {
  await exec_async(`touch /mnt/c/Users/Crafteke/SYSTEM_RESTART`, (error, stdout, stderr) => {
    console.log(error)
    console.log(stdout)
    console.log(stderr)
  //exec(`echo "bobouboub"`, (error, stdout, stderr) => {
      return stdout=='ok'
    })
   res.json([{
      status: 'ok'
   }])
})
app.post("/powercyclepi", async (req, res) => {
  console.log("Powercycling pi:",req.body['rpi']);
  powerCyclePi(req.body['rpi'])
   res.json([{
      status: 'ok'
   }])
})

app.post("/restartpi", async (req, res) => {
  console.log("Restarting pi:",req.body['rpi']);
  restartPi(req.body['rpi'])
   res.json([{
      status: 'ok'
   }])
})


app.post("/start_unity", (req, res) => {
  console.log("Starting unity.",req.body);
  //for linux WSL
  // /mnt/c/Users/Crafteke/Desktop/dystopia_latest/Face6.exe &
  //exec(`start C:\\Users\\Crafteke\\Desktop\\dystopia_latest\\Face6.exe`, (error, stdout, stderr) => {
  exec("touch /mnt/c/Users/Crafteke/UNITY_START", (error, stdout, stderr) => {
      console.log(error)
      console.log(stdout)
      console.log(stderr)
    })
   res.json([{
      status: 'ok'
   }])
})
app.post("/stop_unity", (req, res) => {
  console.log("Stopping unity.",req.body);
  //for linux WSL
  // /mnt/c/Users/Crafteke/Desktop/dystopia_latest/Face6.exe &
  //exec(`start C:\\Users\\Crafteke\\Desktop\\dystopia_latest\\Face6.exe`, (error, stdout, stderr) => {
  exec("touch /mnt/c/Users/Crafteke/UNITY_STOP", (error, stdout, stderr) => {
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
        //console.log('command event')
        res.write(JSON.stringify(data)+'\n')
    });
    res.on("close", () => {
      res.end();
    });
  })

app.get("/stream_services", (req, res) => {
    // res.set({
    //   "Access-Control-Allow-Origin": "*",
    //   "Cache-Control": "no-cache",
    //   "Connection": "keep-alive",
    //   "Content-Type": "text/event-stream",
    // });
    res.json(rpi_status)
    // res.flushHeaders();
    //
    //
    // const interval = setInterval(() => {
    //   res.write(JSON.stringify(rpis_status))
    // }, 1000);
    //
    // res.on("close", () => {
    //   //clearInterval(interval);
    //   res.end();
    // });
  })
app.use('/', router);
const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('Server listening on port ' + port);

var logs=""

/*--------SOCKET IO Server ----------*/
var io = require('socket.io')({});

//io.attach(4567,{pingTimeout:50000,pingInterval:10000});
io.attach(4567);
var clients={};
var sio_socket;

io.on('connection',  function (socket) {
  var clientIp = socket.request.connection.remoteAddress;
  const socketId = socket.id;
  var clientName='';
  console.log(timestamp(),'New connection from ' + clientIp + " with socket ID:"+socketId);
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
      r=/corridor_/
      if(!r.test(data.controller_id)){
        log="Command from:"+clientName+", id:"+data.controller_id+", value:"+data.value
        console.log(timestamp(),log)
      }
      // if(data.controller_id != "corridor_padled_state"){
      //   logs = log+"\n"+logs
      //   logs=logs.split("\n").slice(0,30).join("\n");
      // }
      //commands_logs=Object.keys(data).filter((key) =>  key != 'corridor_padled_state' && key != 'hint_').reduce((obj, key) => {return Object.assign(obj,{ [key]:commands[key]});},{});
      event_emitter.emit('SIO_Command',data)
      io.emit("Command",data)
      //socket.emit("beboop",json_message);
	});
  // socket.on("Speech", (data) => {
  //   console.log("Speech:"+data)
  //     //log="Command from:"+clientName+", id:"+data.controller_id+", value:"+data.value
  //     //console.log(log)
  //     // if(data.controller_id != "corridor_padled_state"){
  //     //   logs = log+"\n"+logs
  //     //   logs=logs.split("\n").slice(0,30).join("\n");
  //     // }
  //     //commands_logs=Object.keys(data).filter((key) =>  key != 'corridor_padled_state' && key != 'hint_').reduce((obj, key) => {return Object.assign(obj,{ [key]:commands[key]});},{});
  //     //event_emitter.emit('SIO_Command',data)
  //     io.emit("Speech",data)
  //     //socket.emit("beboop",json_message);
  // });
  socket.on("Register", (data) => {
		  console.log(timestamp(),"Registration received:"+data);
      clients[data.toLowerCase()]=socketId;
      clientName=data.toLowerCase();
	});
  // socket.conn.on('packet', function (packet) {
  //   console.log('packeeet',clientName,'type',packet.type)
  //   if (packet.type === 'pong') console.log('received ping');
  // });
  //
  // socket.conn.on('packetCreate', function (packet) {
  //   if (packet.type === 'pong') console.log('sending pong');
  // });
  socket.on("disconnect", (reason) => {
    console.log(timestamp(),"Client disconnected:",clientName, ' reason:',reason)
    clients[clientName]=false;
    restart_rpi_service(clientName,'controller')
  });
  // socket.once('disconnect', function () {
  //
  //   clients[clientName]=false;
  // });


});

async function check_clients(){
  // server B
  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    console.log("check client:",socket.id,' : ', socket.data)
  }
  /*console.log(JSON.stringify(clients))
  Object.entries(clients).forEach(([name,s_id])=>{
    if(s_id) {
      console.log(name+":"+'connected');
    }
    else{
      console.log(name+":"+'disconnected');

    }
})*/
}
//setInterval(check_clients,1000);
rpis_status['engine']={'ping':true,'ssh':true} //engine is not a pi but fuck you i want to play beatsaber
Object.entries(rpi_services).forEach(([rpi,services])=>
{
    rpis_status[rpi]={'ping':false,'ssh':false}

})

function check_ping(rpi){
  //exec('ping -c 1 10.0.0.250').on('exit', code => console.log('final exit code is', code))
// exec(`ping -c 1 ${hosts_ip[rpi]} > /dev/null && echo 'ok' ||  echo 'ko'`, (error, stdout, stderr) => {
//       console.log('debuuuuuug:'+stdout=='ok')
//      rpis_status[rpi]['ping']=(stdout=='ok')
//   })
  exec(`ping -c 1 ${hosts_ip[rpi]}`).on('exit', code => rpis_status[rpi]['ping']=(code==0)) //windows
  //exec(`ping -c 1 ${hosts_ip[rpi]} > /dev/null`).on('exit', code => console.log(code)) //linux
}
function check_ssh_port(rpi){
  exec(`timeout 5 bash -c "</dev/tcp/${hosts_ip[rpi]}/22"`).on('exit', code => rpis_status[rpi]['ssh']=(code==0))
}

//check system heatlh
function checkup(){
  Object.entries(hosts_ip).forEach(([rpi,ip])=>
  {
    check_ping(rpi);
    check_ssh_port(rpi);
  });
  Object.entries(rpi_services).forEach(([rpi,services])=>
  {
      rpis_status[rpi]["services"]=[]
      if(rpis_status[rpi]['ssh']){
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

                rpis_status[rpi]["services"].push(statuses_json)
              });
            })
          }
    })
    rpis_status['engine']["services"]=[]
    rpis_status['engine']["services"].push({name:'engine',status:'Ready',notify:'',sio_status:clients['engine'] ? 'UP' : 'DOWN'})
}
function generate_debug_data(){
  Object.entries(rpi_services).forEach(([rpi,services])=>
  {
    rpis_status[rpi]["services"]=[]
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
          rpis_status[rpi]['services'].push(statuses_json)
        })

    })

}
//for debug
// function output(){
//   console.log(JSON.stringify(rpis_status))
// }
//setInterval(output,2000);
if(ONLINE_MODE){ //set to true for production
  restart_all_controllers();
  checkup()
  setInterval(checkup,10000);
}
//this is for offline dev, populate & simulate datachange
else{
  generate_debug_data()
  var status=['active','inactive']
  //setInterval(function(){rpis_status['liftpi']['controller']['status']=status[Math.floor(Math.random()*2)]},2000)
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
// async function shutdown_rpis(){
//   rpi_services.forEach(rpi=>{
//   await exec_async("ssh -o \"StrictHostKeyChecking=no\" pi@" +hosts_ip[rpi]+ " 'sudo halt'", (error, stdout, stderr) => {
//       if (error) {
//           console.log(`error: ${error.message}`);
//       }
//       if (stderr) {
//           console.log(`stderr: ${stderr}`);
//       }
//       console.log(`${rpi} service shutdown. ${stdout}`);
//     })
// })
// }
async function asyncAllPiCommand(cmd){
  rpi_names=Object.keys(hosts_ip);
  promises=[]
  for(index in rpi_names){
    //TO FIX/ put quot for cmd_
  promises.push(exec_async("ssh -o \"StrictHostKeyChecking=no\" pi@"+rpi_names[index]+'.local'+ ' '+cmd))
  // debugger;
  }
  await Promise.all(promises)
}
function powerCyclePi(rpi){
    exec("./tplink_commands/reboot_int.sh 10.0.0.254 "+switch_ports[rpi])
}
function restartPi(rpi){
    exec("ssh -o \"StrictHostKeyChecking=no\" pi@"+hosts_ip[rpi]+" 'sudo reboot'")
}
async function getlogs_rpi_service(rpi,service){
  const { stdout, stderr } = await exec_async("ssh -o \"StrictHostKeyChecking=no\" pi@" +hosts_ip[rpi]+ " 'journalctl -u "+ service +".service | tail -n200'")
   //console.log(stdout)
   logs=stdout+stderr //will do better one day
   return logs
}
// async function halt_them_all(){
//   const tasks=[]
//   Object.entries(rpi_services).forEach(([rpi,services])=>
//   {
//     tasks.push(exec_async("ssh -o \"StrictHostKeyChecking=no\" pi@" +hosts_ip[rpi]+ " 'sudo reboot'"));
//   })
// await Promise.all(tasks)
//   return true
// }

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
      if(true || rpis_status[rpi]['ssh']){
      console.log('Restarting services RPi:'+rpi)

      services.forEach(service=>{
        //maybe add -i ~/.ssh/face6 or id_rsa
        restart_rpi_service(rpi,service)
    })
  }
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
function timestamp(){
  let date_ob = new Date();

  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  // current seconds
  let seconds = date_ob.getSeconds();
  return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
}

// {
//     lift:{button_up:{released:0, pushed:1},button_down:{released:0, pushed:1}},
//     hal:{circuit_0:{unplugged:0, good:1,wrong:-1},circuit_1:{unplugged:0, good:1,wrong:-1},circuit_2:{unplugged:0, good:1,wrong:-1},circuit_3:{unplugged:0, good:1,wrong:-1},hal_button:{released:0, pushed:1}},
//     corridor:{push_pad:{good:"0101101",wrong:"0111101"}},
//     room_01:{knob_0:{left:-1,right:1},button_0:{released:0, pushed:1},plug_0:{released:0, plugged:1}},
//     roomt_02:{rfid_0:{removed:0,present:1},rfid_1:{removed:0,present:1},rfid_2:{removed:0,present:1},rfid_3:{removed:0,present:1},rfid_4:{removed:0,present:1},rfid_5:{removed:0,present:1},rfid_validation_button:{released:0, pushed:1}}
// }
