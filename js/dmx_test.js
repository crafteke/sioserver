function click_action(btn){
  console.log($(btn).data('ip') + ' got clicked.')
  var ip = $(btn).data('ip')
  var universe=$(btn).data('universe')
  var channels=$(btn).data('channels')
  var value=$(btn).data('value')
  if(value==255){
    $(btn).html('Off')
    $(btn).attr('data-value',0)
  }else{
    $(btn).html('On')
    $(btn).attr('data-value',255)
   }
  $.post("/set_dmx",
     {
        ip:ip,
        universe:universe,
        channels:channels,
        value:value
     },
     function (data, status) {
       console.log('action sent.')
      // $("#").prepend("Command sent - "+controller_id+" : "+action_text+"<br>");
     });
}
