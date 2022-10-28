$(document).ready(function () {
  $("#hint_button").click(function(){
    console.log('modal hint clicked');
    $("#modal-hints").toggleClass('active');
  })

  $( "#shutdown_control" ).click(function() {
    if (confirm("Really sure??")) {
    $.post("/shutdown_control",
       {
          confirm: "false",
       },
       function (data, status) {
         console.log("Shutdown system");
         //console.log("timer started.")
         //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
       });
     }else {
       console.log("Cancel halt system.");
     }
   });
$( "#start_unity" ).click(function() {
  if (confirm("Really sure??")) {
    $.post("/start_unity",
       {
          args: "none",
       },
       function (data, status) {
         console.log("starting unity.");
         //console.log("timer started.")
         //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
       });
} else {
  console.log("Cancel unity launch.");
}});
//TODO: harmonize this and other buttons
$("button.command_button").click(function(){
  var controller_id=$(this).data('controller_id');
  var value = $(this).data('value');
  if(value == undefined){
    value='1'
  }
  $.post("/send_command",
     {
        controller_id:controller_id,
        value:value
     },
     function (data, status) {
       console.log('Control command triggered:'+controller_id+','+value);
     });
})

$( "#start_game" ).click(function() {
  $.post("/send_command",
     {
       controller_id:"lift_button_start",
       value:"1"
     },
     function (data, status) {
       console.log("starting game.");
       //console.log("timer started.")
       //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
     });
});
$( "#stop_game" ).click(function() {
  $.post("/send_command",
     {
       controller_id:"stop_game",
       value:"1"
     },
     function (data, status) {
       console.log("Stoping game session.");
       //console.log("timer started.")
       //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
     });
});

$("#language_select").change(function(event){
  language_id=$("#language_select").val()
  $.post("/send_command",
     {
       controller_id:"select_language",
       value:language_id
     },
     function (data, status) {
       console.log("Changing engine language to:",language_id);
       //console.log("timer started.")
       //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
     });

})
$("#speech_action").click(function() {
  msg=$("#input-speech").val()
  room_id=$("#input-speech-room").val()
  $.post("/send_speech",
     {
       controller_id:"speech_command",
       value: msg,
       room: room_id
     },
     function (data, status) {
       console.log("Speech command.");
       //console.log("timer started.")
       //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
     });
});
$("#hint-room-selector").change(function() {
  msg=$("#input-speech").val()
  room_id=$("#hint-room-selector").val()
  //room_=$(this).children("option:selected").val()

  $.post("/send_speech",
     {
       controller_id:"speech_command",
       value: '',
       room: room_id
     },
     function (data, status) {
       console.log("room select command",room_id);
       //console.log("timer started.")
       //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
     });
});
$("#speech_clear").click(function(){
  $("#input-speech").val("");
  console.log("Clear text")
})

$("select.command").change(function (event) {
  element=$(this).children("option:selected")
   controller_id=element.data('controller_id')
   value=element.val()
   action_text=element.text()
   $.post("/send_command",
      {
         controller_id:controller_id,
         value:value
      },
      function (data, status) {
        console.log("sending command:",controller_id)
        //$("#logs_content").prepend("Command sent - "+controller_id+" : "+action_text+"<br>");
      });
    $(this).val('none')
});

});
