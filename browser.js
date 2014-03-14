var tele = require("telehash");
var commands = require("./commands.js");
var $ = require("jquery-browserify");
require("./jquery.tmpl.min.js");
tele.debug(function(){console.log.apply(console,arguments)});

var args = {};
args.id = "fieldtester";
$(document).ready(function() {
  log("connecting");
  tele.init(args, init);
});

function log(a,b,c,d,e,f){
  var message = [a,b,c,d,e,f].join(" ");
  $("#systemMessageTemplate").tmpl({message: message}).appendTo("#messages");
  $("#messages").scrollTop($("#messages").prop("scrollHeight") - $("#messages").height());
}

function init(err, self)
{
  if(!self)
  {
    $("#error").html = err||"something went wrong";
    $("#error").show();
    return;
  }
  commands.init(self, log);

  $("#message-input").focus();
  $("#message-form").submit(function(ev) {
      ev.preventDefault();
      var message = $("#message-input").val();
      $("#message-input").val("");
      var parts = message.split(" ");
      var cmd = parts.shift();
      if(commands.command[cmd]) commands.command[cmd](parts);
      else log("I don't know how to "+cmd);
  });
}
