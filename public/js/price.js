/**
 * Created by LRQ on 2017/5/1.
 */
function radioShow(){
    var myradio=document.getElementsByName("myradio");
    var div=document.getElementById("price").getElementsByTagName("div");
    for(i=0;i<div.length;i++){
        if(myradio[i].checked){
            div[i].style.display="block";
        }
        else{
            div[i].style.display="none";
        }
    }
}