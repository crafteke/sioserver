$(document).ready(function () {
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
}

});
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
$("#speech_action").click(function() {
  msg=$("#input-speech").val()
  $.post("/send_speech",
     {
       controller_id:"speech_command",
       value: msg
     },
     function (data, status) {
       console.log("Speech command.");
       //console.log("timer started.")
       //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
     });
});
$("#speech_clear").click(function(){
  $("#input-speech").val("");
  console.log("Clear text")
})

$("select.selectable").change(function (event) {
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
  //setInterval("getcheckout()", 2000);
});
