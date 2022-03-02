$(document).ready(function () {

   $("a.level_selector").click(function (event) {
     console.log("value:",$(this).data('level'))
      $.post("/select_level",
         {
            level: $(this).data('level')
         },
         function (data, status) {
            console.log(data.commands);
            $("#command_forms").html('')
            html_content=''
            $.each(data.commands,function(key,element){
              controller_infos=key.split("_"); //[LEVEL_ID,CONTROL_TYPE,CONTROL_INDEX]
              html_content+="<form style='min-width: 300px;max-width: 500px'>"
              console.log(controller_infos)
              html_content+="<h2 class='cyberpunk'>"+controller_infos[1]+" "+(controller_infos[2] == null ? "" : controller_infos[2])+"</h2>"
              if(controller_infos[1]=='knob')
              {
                html_content+="<input class='dial' data-controller_id="+key+" data-width='150' data-displayprevious='false' data-fgcolor='#222222' data-bgColor=' #D2D2D2 ' data-displayInput='false' data-stopper='true' data-min='0' data-max='20' data-skin='tron' data-thickness='.2' data-cursor='true' value='0' style='width: 79px; height: 50px; position: absolute; vertical-align: middle; margin-top: 50px; margin-left: -114px; border: 0px none; background: rgba(124, 124, 0, 0) none repeat scroll 0% 0%; font: bold 30px Arial; text-align: center; color: rgb(255, 236, 3); padding: 0px; appearance: none;'>"
              }
              else
              {
                html_content+="<select class='cyberpunk "+($.inArray(controller_infos[1],["knob","button"]) ? controller_infos[1] : '')+"'>"
                $.each(element,function(k,v){
                  html_content+= "<option data-controller_id="+key+" value='"+v+"'>"+k+"</option>"
                })
                html_content+="</select><br/>"
              }

              html_content+="</form>"
            })
            $("#command_forms").append(html_content);
            $(document).trigger("refresh_event")
         });
   });

   previous_v=0;
   $(document).on('refresh_event', function(){
     $(function() {
         $(".dial").knob({
           'change':function(v){
             if(v>previous_v){
               command=1
             }
             else{
               command=-1
             }
             previous_v=v
             $.post("/send_command",
                {
                   controller_id: $(this)[0].$.data('controller_id'),
                   value:command
                },
                function (data, status) {
                  //$("#logs_content").append("Command sent - "+controller_id+" : "+action_text+"</br>");
                });

           }
         });
     });
     $("select").change(function (event) {
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
             $("#logs_content").prepend("Command sent - "+controller_id+" : "+action_text+"</br>");
           });
     });
     $("select.button").mouseup(button_event_handler)
     $("select.button").mousedown(button_event_handler)
     function button_event_handler(event){
       event.preventDefault();
       toggle_on=$(this).children("option:not(:selected)")
       toggle_off=$(this).children("option:selected")
       toggle_off.prop('selected',false)
       toggle_on.prop('selected',true)
       $(this).trigger('change')
     }
  });
  $("#first_level").trigger('click')

});
