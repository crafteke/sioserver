(async () => {
  const response = await fetch("/stream_commands");

  if (!response.ok) {
    throw Error(response.status);
  }

  for (const reader = response.body.getReader();;) {
    const {value, done} = await reader.read();

    if (done) {
      break;
    }
  console.log(new TextDecoder().decode(value));
  json=JSON.parse(new TextDecoder().decode(value));
  //refreshServicesStatus(json)
  console.log(JSON.stringify(json));
  td_element=$('tr#'+json.controller_id+' td[data-value='+json.value+'] span')
  td_element.removeClass("label-error")
  td_element.addClass("label-success")
  console.log("id",json.controller_id,"val",json.value)
  //console.log(new TextDecoder().decode(value));
  //$('#stream').html(new TextDecoder().decode(value));
  }
})();
$(document).ready(function () {

$("select").change(function (event) {
  element=$(this).children("option:selected")
  controller_id=element.data('controller_id')
   value=element.val()
if(value != 'none'){
  $(this).val('none')
  $.post("/send_command",
   {
      controller_id: controller_id,
      value:value
   },
   function (data, status) {
     //$("#logs_content").prepend('Timer paused <br>')
     console.log("Command sent.")
     //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
   });
}
 });
});
