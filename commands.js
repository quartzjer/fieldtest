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
    log("\tpaths",hn.paths.filter(function(p){return p.lastIn}).map(function(p){return p.type}).join(","));
    log("\tchannels",Object.keys(hn.chans).map(function(cid){return hn.chans[cid].type}).join(","));
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
