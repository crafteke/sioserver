$(document).ready(function () {
  $( "#shutdown_control" ).click(function() {
    $.post("/shutdown_control",
       {
          confirm: "false",
       },
       function (data, status) {
         console.log("Shutdown system");
         //console.log("timer started.")
         //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
       });
});
  //setInterval("getcheckout()", 2000);
});
