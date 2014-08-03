var fs = require("fs");
var thjs = require("./thjs.js");
exports.debug = thjs.debug;
exports.info = thjs.info;

function install(self, args)
{
  // crypto
  require("telehash-cs1a").install(self, args);
  require("telehash-cs2a").install(self, args);
  require("telehash-cs3a").install(self, args);

  // networking
  require("telehash-ipv4").install(self, args);
  require("telehash-ipv6").install(self, args);
  require("telehash-http").install(self, args);

  // extensions
  require("telehash-stream").install(self, args);
  require("telehash-telesocket").install(self, args);
  require("telehash-thtp").install(self, args);

}

exports.init = function(args, cbDone)
{
  if(!args) args = {};
  var self = new thjs.switch();

  install(self, args);

  function seed()
  {
    self.online(function(err){
      cbDone(err, self);      
    });
  }

  if(args.router)
  {
    if(typeof args.router == "string" && fs.existsSync(args.router)) args.router = require(args.router);
    if(typeof args.router == "object")
    {
      Object.keys(args.router).forEach(function(id){self.addRouter(args.router[id])});
    }
  }

  if(args.id)
  {
    if(typeof args.id == "string" && fs.existsSync(args.id)) args.id = require(args.id);
    if(typeof args.id == "object")
    {
      var err;
      if((err = self.load(args.id))) return cbDone("error loading id, "+err+": "+JSON.stringify(args.id));
      seed();
      return self;
    }
  }

  self.make(function(err,id){
    if(err) return cbDone("error creating id, "+err);
    if(typeof args.id == "string") fs.writeFileSync(args.id, JSON.stringify(id, null, 4));
    args.id = id;
    self.load(id);
    seed();      
  });
  
  return self;
}
