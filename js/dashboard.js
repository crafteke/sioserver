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

function click_restart(btn){
  console.log($(btn).data('rpi-controller') + 'got clicked.')
  var service = $(btn).data('rpi-controller')
  $.get('/restart_service/'+service,function(data){console.log('ok')})
}

$(document).ready(function () {
  setInterval("getcheckout()", 2000);
});
