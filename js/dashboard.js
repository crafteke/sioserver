function generate_label(k,v){
  switch (k) {
    case 'status':
      if(v=='active'){
        return '<span class="label label-success">'+v+'</span>'
      }
      else{
        return '<span class="label label-error">'+v+'</span>'
      }
      break;
    case 'sio_status':
      if(v=='UP'){
        return '<span class="label label-success">'+v+'</span>'
      }
      if(v=='DOWN'){
        return '<span class="label label-error">'+v+'</span>'
      }
      if(!v){
        return '<span class="label">'+'No'+'</span>'

      }
      break;
    case 'error':
      return ''
      break
    default:
      return v
    //case 'notify'
  }

}
function getcheckout(){
  $.getJSON("/co_status", function (data){
    $.each(data, function(k,v) {
      //
      // console.log("-----"+Object.keys(v)[0])
      var content=''

      var tbl_row="<tr>"
  //var tbl_row = "<tr><td>"+Object.keys(v)[0]+'</td>';
   $.each(v, function() {
        var name=''
       $.each(this, function(k , v) {
            if(k=='name'){ name=v}
            tbl_row+='<td>'+generate_label(k,v)+'</td>'
       });
       //content += "<tr class=\""+( odd_even ? "odd" : "even")+"\">"+tbl_row+"</tr>";
       //tbl_row+='<i class="icon icon-menu"></i>'
       tbl_row+='<td><i class="icon icon-2x icon-more-horiz"></i></td>'
       tbl_row+='<td><button onclick="click_restart(this)" class="btn" data-rpi-controller='+k+'-'+name+'>Restart</button></td>'
       tbl_row+='</tr>'
       content+=tbl_row
       //odd_even = !odd_even;
   });
   $('#'+k).html(tbl_row)
    // $("#content").html("> "++"</br> > ");     //console.log(data)
  })
});

}



function refreshServicesStatus(data){
    //k is rpi, v is service
    $.each(data, function(k,v) {
      // k is rpi name
      // console.log("-----"+Object.keys(v)[0])
  var tbl_row="<tr>"
  //var tbl_row = "<tr><td>"+Object.keys(v)[0]+'</td>';

   $.each(v['services'], function() {
     //systemd services
       var name=''
        $.each(this, function(k , v) {
             if(k=='name'){ name=v}
             tbl_row+='<td>'+generate_label(k,v)+'</td>'
        });
        //content += "<tr class=\""+( odd_even ? "odd" : "even")+"\">"+tbl_row+"</tr>";
        //tbl_row+='<i class="icon icon-menu"></i>'
        tbl_row+='<td><button onclick="click_getjournal(this)" class="btn btn-primary btn-action btn-lg" data-rpi-service='+k+'-'+name+'><i class="icon icon icon-more-horiz"></i></button></td>'
        tbl_row+='<td><button onclick="click_restart(this)" class="btn" data-rpi-service='+k+'-'+name+'>Restart</button></td>'
        tbl_row+='</tr>'
       //odd_even = !odd_even;
   });
   $('#'+k).html(tbl_row)
  })
}
function refresh_ping_ssh(data){
  $.each(data, function(k,v) {
    console.log(JSON.stringify(v['ping']));
    if(v['ping']){
      $('#'+k+'_ping').addClass("label-success");
      $('#'+k+'_ping').removeClass("label-error");
    } else{
      $('#'+k+'_ping').removeClass("label-success");
      $('#'+k+'_ping').addClass("label-error");
    }
    if(v['ssh']){
      $('#'+k+'_ssh').addClass("label-success");
      $('#'+k+'_ssh').removeClass("label-error");
    } else{
      $('#'+k+'_ssh').removeClass("label-success");
      $('#'+k+'_ssh').addClass("label-error");
    }
  })
}

function click_getjournal(btn){
  console.log($(btn).data('rpi-service') + ' got clicked.')
  var service = $(btn).data('rpi-service')
  $("#modal-logs").toggleClass('active');
  $.get('/get_journal/'+service, function(data){
    $("#log_title").html(service)
    $("#log_content").removeClass('loading loading-lg')
    $("#log_content").html("<div style='white-space:pre'>"+data.content+"</div>")
    console.log(JSON.stringify(data))})
}

function click_restart(btn){
  console.log($(btn).data('rpi-service') + ' got clicked.')
  var service = $(btn).data('rpi-service')
  $.get('/restart_service/'+service,function(data){console.log('ok')})
}
function close_logs_modal(){
  $("#modal-logs").toggleClass("active");
  $("#log_content").html("");
  $("#log_content").addClass("loading loading-lg");
  $("#log_title").html("Loading...")
}
$(document).ready(function () {
  $("button.powercyclepi").click(function(){
    var rpi=$(this).data('rpi');
    $.post("/powercyclepi",
       {
          rpi:rpi
       },
       function (data, status) {
         console.log('Powercycling:'+rpi);
       });
  })

  //setInterval("getcheckout()", 2000);
});
$(document).ready(function () {
  $("button.restartpi").click(function(){
    var rpi=$(this).data('rpi');
    $.post("/restartpi",
       {
          rpi:rpi
       },
       function (data, status) {
         console.log('Powercycling:'+rpi);
       });
  })

  //setInterval("getcheckout()", 2000);
});
/*this is not working*/
// window.onload = function(){
//   var source = new EventSource('/stream');
//   source.onmessage = function(e) {
//           var jsonData = JSON.parse(e);
//           console.log(JSON.stringify(jsonData));
//           //alert("My message: " + jsonData.msg);
//   };
// }

(async () => {
  const response = await fetch("/stream_services");

  if (!response.ok) {
    throw Error(response.status);
  }

  for (const reader = response.body.getReader();;) {
    const {value, done} = await reader.read();

    if (done) {
      break;
    }
  json=JSON.parse(new TextDecoder().decode(value));
  refreshServicesStatus(json)
  refresh_ping_ssh(json)
  //console.log(JSON.stringify(json));
  //console.log(new TextDecoder().decode(value));
  //$('#stream').html(new TextDecoder().decode(value));
  }
})();
