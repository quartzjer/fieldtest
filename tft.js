#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var tele = require("telehash");
var argv = require("optimist")
  .usage("Usage: $0 --id id.json --seeds seeds.json")
  .default("id", "./id.json")
  .default("v", "./debug.log")
  .argv;

// write all debug output to a log
var vlog = fs.createWriteStream(path.join(process.cwd(),argv.v), {flags:"a"});
vlog.write("starting with "+JSON.stringify(argv)+"\n");
tele.debug(function(){
  var args = arguments;
  args = Object.keys(arguments).map(function(k){return args[k]});
  args.unshift(new Date().toISOString());
  vlog.write(args.join(" ")+"\n");
});
tele.info(function(){log.apply(console,arguments)});

// set up our readline interface
rl = require("readline").createInterface(process.stdin, process.stdout, null);
function log(){
  // hacks!
  rl.output.write("\x1b[2K\r");
  var args = arguments;
  args = Object.keys(arguments).map(function(k){return args[k]});
  console.log(args.join(" "));
  rl._refreshLine()
}
process.stdin.on("keypress", function(s, key){
  if(key && key.ctrl && key.name == "c") process.exit(0);
  if(key && key.ctrl && key.name == "d") process.exit(0);
})
log("starting...");

// load or generate our crypto id
argv.id = path.join(process.cwd(),argv.id);
tele.init(argv, init);

var me = {};
function init(err, self)
{
  if(!self)
  {
    log("startup failed",err);
    process.exit(1);
  }
  me = self;

  console.log("START",me.hashname);
  rl.setPrompt(me.hashname.substr(0,6)+"> ");
  rl.prompt();
}


// our chat handler
rl.on('line', function(line) {
  var parts = line.split(" ");
  var cmd = parts.shift();
  if(cmds[cmd]) cmds[cmd](parts);
  else log("I don't know how to "+cmd);
  rl.prompt();
});

var cmds = {};
cmds.help = cmds["?"] = function(arg){
  log("'quit|exit'","exit the app");
  log("'whoami'","your info");
  log("'seek hashname'","look for that hashname in the DHT");  
  log("'ping hashname'","try to connect to and get response from that hashname");
  log("'a|all'","show all connected hashnames");
  log("'h hashname'","show known details about a hashname");
}
cmds.quit = cmds.exit = function(arg){
  if(arg[0]) log(arg[0]);
  process.exit();
}
cmds.whoami = function(){
  log("I am",me.hashname,JSON.stringify(me.paths));
}
cmds["42"] = function(){
  log("I hash, therefore I am.");
}
cmds.all = cmds.a = function()
{
  Object.keys(me.lines).forEach(function(line){
    var hn = me.lines[line];
    log(hn.address,Object.keys(hn.chans).length);
  });
}

cmds.seek = function(arg)
{
  var hn = me.whois(arg[0]);
  if(!hn) return log("invalid hashname",arg[0]);
  me.seek(hn, function(err){
    if(err) return log("seek failed",hn.hashname,err);
    log("seek",hn.hashname,JSON.stringify(hn.vias));
  });
}
cmds.ping = function(arg)
{
  var hn = me.whois(arg[0]);
  if(!hn) return log("invalid hashname",arg[0]);
  var start = Date.now();
  hn.seek(me.hashname,function(err){
    if(err) return log("ping failed",hn.hashname,err);
    log("ping",hn.address,Date.now()-start);
  });
}
cmds.h = function(arg){
  var host = me.whois(arg[0]);
  if(!host) return log("invalid hashname",arg[0]);
  if(host.relay) log("relay",JSON.stringify(host.relay));
  Object.keys(host.paths).forEach(function(id){
    log("path",JSON.stringify(host.paths[id]));                        
  });
  Object.keys(host.chans).forEach(function(c){
    log("chan",host.chans[c].type,host.chans[c].id);
  });
}
