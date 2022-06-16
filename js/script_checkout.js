function getcheckout(){
  $.getJSON("/co_status", function (data){
    var content = "";
    $.each(data, function(k,v) {
      content += "<p>"+k+"</p></br><tbody>";
   var odd_even = false;
   $.each(v, function() {
       var tbl_row = "";
       $.each(this, function(k , v) {
            console.log(k)
           tbl_row += "<td>"+v+"</td>";
       });
       content += "<tr class=\""+( odd_even ? "odd" : "even")+"\">"+tbl_row+"</tr>";
       odd_even = !odd_even;
   });
   content+="</tbody>"
   //console.log("Got json:"+JSON.stringify(data))
    // $("#content").html("> "++"</br> > ");     //console.log(data)
  })
   $("#checkout_out ").html(content);
});
}
$(document).ready(function () {
  setInterval("getcheckout()", 2000);
});
