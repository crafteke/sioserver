
$(document).ready(function () {

})
  function click_action(btn){
    console.log($(btn).data('ip') + ' got clicked.')
    var ip = $(btn).data('ip')
    var universe=$(btn).data('universe')
    var channels=$(btn).data('channels')
    var value=$(btn).data('value')
    //if().hasClass( "foo" )
    $(btn).toggleClass('btn-primary')
    $(btn).siblings().toggleClass('btn-primary')
    // if(value==255){
    //   $(btn).html('Off')
    //   $(btn).data('value',0)
    // }else{
    //   $(btn).html('On')
    //   $(btn).data('value',255)
    //  }
     console.log("Sending DMX to IP:",ip,",universe:",universe,',value:',value)
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
