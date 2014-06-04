var me;
var log;
exports.init = function(self,l)
{
  me = self;
  log = l;

  self.listen("bulk", function(err, arg, chan, cb){
    log("bulk started from",chan.hashname);
    chan.wrap("bulk");
    chan.onBulk = function(err, data){
      if(err) return log("bulk error",err);
      log("bulk received:",data);
    };
    chan.send({js:{tft:true}});
    cb();
  });

  self.socket("/", function(socket){
    log("TS new",socket.id,socket.hashname);
    socket.onmessage = function(msg){log("TS",socket.id,msg.data)};
    socket.onclose = function(){log("TS close",socket.id)};
  });

};

var cmds = exports.command = {};

cmds.help = cmds["?"] = function(arg){
  log("'quit|exit'","exit the app");
  log("'whoami'","your info");
  log("'seek hashname'","look for that hashname in the DHT");  
  log("'ping hashname'","try to connect to and get response from that hashname");
  log("'a|all'","show all connected hashnames");
  log("'h hashname'","show known details about a hashname");
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
    log(hn.hashname);
    log("    paths",hn.paths.filter(function(p){return p.recvAt}).map(function(p){return p.type}).join(","));
    log("    channels",Object.keys(hn.chans).map(function(cid){return hn.chans[cid].type}).join(","));
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
    log("pong",hn.hashname,Date.now()-start);
  });
}
cmds.h = function(arg){
  var host = me.whois(arg[0]);
  if(!host) return log("invalid hashname",arg[0]);
  if(host.relayChan) log("relaying: true");
  host.paths.forEach(function(path){
    log("path",(hn.to==path)?"(primary)":"",Math.floor((Date.now()-path.recvAt)/1000),Math.floor((Date.now()-path.sentAt)/1000),JSON.stringify(path.json));
  });
  Object.keys(host.chans).forEach(function(c){
   if(!host.chans[c]) return; // dead
   log("chan",c,host.chans[c].isOut?"out":"in",
     host.chans[c].type,
     Math.floor((Date.now()-host.chans[c].sentAt)/1000),
     Math.floor((Date.now()-host.chans[c].recvAt)/1000));
  });
}
cmds.bulk = function(arg)
{
  var hn = me.whois(arg.shift());
  if(!hn) return log("invalid hashname");
  hn.start("bulk",{js:{tft:true}},function(err,packet,chan,cb){
    cb();
    if(err) return log("bulk failed",hn.hashname,err);
    chan.wrap("bulk");
    chan.bulk(arg.join(" "), function(err){
      log("bulked",err);
    })
  });
}
cmds.ticket = function(arg)
{
  var hn = me.whois(arg[0]);
  if(!hn) return log("invalid hashname",arg[0]);
  var tik = hn.ticket({js:{"tft":arg[1]}});
  if(!tik) return log("ticket failed");
  log(tik.toString("base64"));
}

cmds.ticketed = function(arg)
{
  var hn = me.whois(arg[0]);
  if(!hn) return log("invalid hashname",arg[0]);
  var buf = new Buffer(arg[1],"base64");
  if(!buf) return log("ticket parse failed");
  var packet = hn.ticketed(buf);
  if(!packet) return log("ticket failed");
  log(JSON.stringify(packet.js));
}

