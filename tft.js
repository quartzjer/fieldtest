#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var tele = require("telehash");
var commands = require("./commands.js");
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
if(argv.seeds) argv.seeds = path.join(process.cwd(),argv.seeds);
tele.init(argv, init);

var me;
function init(err, self)
{
  if(err || !self)
  {
    log("startup failed",err);
    process.exit(1);
  }
  me = self;
  commands.init(self, log);

  rl.setPrompt(self.hashname.substr(0,6)+"> ");
  rl.prompt();
}


// our chat handler
rl.on('line', function(line) {
  var parts = line.split(" ");
  var cmd = parts.shift();
  if(!me) return log("not online");
  if(commands.command[cmd]) commands.command[cmd](parts);
  else log("I don't know how to "+cmd);
  rl.prompt();
});

commands.command.quit = commands.command.exit = function(arg){
  if(arg[0]) log(arg[0]);
  process.exit();
}

