var MissileCommand = (function(){

  // Game ********************************************
  function Game(){

    // Variables
    var that = this;
    that.CANVAS_X = $("#canvas").width();
    that.CANVAS_Y = $("#canvas").height();
    that.ammo = 50;
    that.score = that.ammo*100;
    that.MISSILE_VELOCITY = 20;
    that.NUM_BATTERIES = 3;
    that.GAME_SPEED = 1000/32;
    that.TICS = 0; // TEMPORARY, prevents infinite loops

    // Set up storage arrays (missiles on board)
    // that.Battery = new OurBattery(that);
    that.ourBatteries = (function(){
      var batteries = [];
      var spacing = that.CANVAS_X/(that.NUM_BATTERIES+1);
      for(var i = 0; i < that.NUM_BATTERIES; i++){
        batteries.push(new Battery(spacing*(i+1), that));
      }
      return batteries;
    })();
    console.log(that.ourBatteries)

    that.missiles = (function(){
      var missiles = [];

      // Enemy missiles
      for(var i = 0; i < that.ammo; i++){
        missiles.push(new Missile({pos: {x: Math.random()*that.CANVAS_X, y: -100 }}, false));
      }
      // Our missiles
      for(var i = 0; i < that.ammo; i++){
        var rand_battery = that.ourBatteries[Math.floor(Math.random()*(that.NUM_BATTERIES))];
        missiles.push(new Missile(rand_battery, true));
      }
      return missiles;
    })();

    // Explosions
    that.explosions = [];

    // Points
    that.points = [];

    that.drawCollection = function(collection){
      $.each(collection, function(i, item){
        item.draw();
      });
    }

    // Draw initial board once
    that.draw = function(){
      Helper.clearCanvas(that.CANVAS_X, that.CANVAS_Y);
      that.drawCollection(that.missiles);
      that.drawCollection(that.ourBatteries);
      that.drawCollection(that.explosions);
    }


    // Mouse click => Fire a missile to that coordinates (if we have any)
    $("canvas#canvas").click(function(e){
      var nearestMissile;
      var target = { pos: { x: e.pageX, y: e.pageY } };

      $.each(that.missiles, function(i, missile){
        if(missile.target == null && missile.ours){
          if(nearestMissile == undefined){
            nearestMissile = missile;
          }else if(Helper.distBetween(nearestMissile, target) > Helper.distBetween(missile, target)){
            nearestMissile = missile;
          }
        }
      });
      if(nearestMissile == undefined){
        return;
      }
      Missile.fireMissile(nearestMissile, target, that.MISSILE_VELOCITY);
      that.ammo--;
    });


    // GAME LOOP (set interval timer) &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
    var interval = setInterval(function(){

      // Check for game ending conditions
      var gameover = true;
      for(var i = 0; i < that.missiles.length; i++){
        var missile = that.missiles[i];
        console.log(missile)
        if(!missile.ours){
          gameover = false;
        }
      }
      if(gameover){
        clearInterval(interval);
      }

      // Increment positions
      $.each(that.missiles, function(i, missile){
        missile.interval();
      });
      $.each(that.explosions, function(i, explosion){
        explosion.interval();
      });

      // Check for explosions that need to dissipate
      var removedExplosions = [];
      $.each(that.explosions, function(i, explosion){
        if(explosion.radius > explosion.MAX_RADIUS ){
          // Remove from explosions
          removedExplosions.push(explosion);
        }
      });
      that.explosions = Helper.subtractArrays(that.explosions, removedExplosions);

      // Check for missiles that need to be exploded (TODO: Explode unfired missiles too!)
      var removedMissiles = [];
      $.each(that.missiles, function(i, missile){
        if(missile.target != null){
          if(Helper.distBetween(missile, missile.target) < that.MISSILE_VELOCITY/1.5 ){
            // Remove from missiles
            removedMissiles.push(missile);
            // Create new explosion and add to explosions
            that.explosions.push(new Explosion({x: missile.pos.x, y:missile.pos.y}));
            if(!missile.ours){
              that.score -= 100;
            }
          } else {
            // Check if explosion should trigger a missile to explode
            $.each(that.explosions, function(i, explosion){
              if(Helper.distBetween(missile, explosion) < (missile.radius + explosion.radius)){
                // Remove from missiles
                removedMissiles.push(missile);
                // Create new explosion and add to explosions
                that.explosions.push(new Explosion({x: missile.pos.x, y:missile.pos.y}));
              }
            });
          }
        }
      });
      that.missiles = Helper.subtractArrays(that.missiles, removedMissiles);

      // Fire enemy missiles!
      if(Math.random() < .1){
        console.log("FIRE ENEMY MISSILE");
        // Find unfired enemy missile
        for (var i = 0; i < that.missiles.length; i++) {
          var missile = that.missiles[i];
          if(missile.target == null && !missile.ours){
            Missile.fireMissile(missile,
                { pos:
                  {
                    x: Math.random()*that.CANVAS_X,
                    y: that.CANVAS_Y
                  }
                },
                that.MISSILE_VELOCITY/4);
            break;
          }
        };

      }

      // Redraw the board
      that.draw();
      $("#ammo").html("Ammo: " + that.ammo);
      $("#score").html("Score: " + that.score);
    }, that.GAME_SPEED);

  }


  // Helper Functions ********************************************
  var Helper = {};

  Helper.drawCircle = function(obj){
    this.context.beginPath();
    if (obj.color instanceof Function){
      this.context.fillStyle = obj.color();
    }
    else {
      this.context.fillStyle = obj.color;
    }
    this.context.arc(obj.pos.x, obj.pos.y, obj.radius, 0, 2*Math.PI, false );
    this.context.fill();
    // this.context.stroke();
  }

  Helper.distBetween = function(obj1, obj2){
    return Math.sqrt(Math.pow(obj1.pos.x - obj2.pos.x, 2) + Math.pow(obj1.pos.y - obj2.pos.y, 2));
  }

  Helper.clearCanvas = function(x,y){
    this.context.clearRect(0,0,x,y);
  }

  Helper.subtractArrays = function(start_array, removal_array){
    var result;
    result = start_array.filter(function(el){
      return removal_array.indexOf(el) == -1;
    })
    return result;
  }

  Helper.context = null;


  // Our Missile ********************************************
  function Missile(battery, ours_bool){

    var that = this;
    that.battery = battery;
    if(ours_bool){
      that.color = "red"
    }else{
      that.color = "rgba(0, 0, 255, 1)";
    }
    that.radius = 5;
    that.ours = ours_bool; // do we own it?

    // velocity
    that.vel = {
      x: 0,
      y: 0
    }
    // position
    that.pos = {
      x: that.battery.pos.x + (Math.random()-.5)*70,
      y: that.battery.pos.y - that.radius
    }
    // target
    that.target = null;

    // Draw
    that.draw = function(){
      Helper.drawCircle(that);
    }

    // Update
    that.interval = function(){
      that.pos.x += that.vel.x;
      that.pos.y += that.vel.y;
    }
  }

  Missile.fireMissile = function(missile, target, velocity){
    var y_dist = (target.pos.y - missile.pos.y);
    var x_dist = (target.pos.x - missile.pos.x);
    var dist = Helper.distBetween(missile, target);

    missile.vel.y = ( velocity * y_dist ) / dist;
    missile.vel.x = ( velocity * x_dist ) / dist;

    missile.target = target;
  }

  // Our Battery ********************************************
  function Battery(x_pos, game){

    var that = this;
    that.radius = 50;
    that.color = "rgba(255,0,0,.5)";

    // Coordinates (middle of screen)
    that.pos = {
      x: x_pos,
      y: game.CANVAS_Y
    }

    // Draw TODO: Circle follows the mouse direction
    that.draw = function(){
      // Helper.drawCircle(that);
      Helper.context.beginPath();
      Helper.context.rect(that.pos.x-that.radius, that.pos.y-that.radius/4, that.radius*2, that.radius/4);
      Helper.context.fillStyle = that.color;
      Helper.context.fill();
      Helper.context.lineWidth = 5;
      Helper.context.stroke();
    }
  }

  // Explosion ********************************************
  function Explosion(pos){

    var that = this;

    // position
    that.pos = pos;
    // Fixed max size
    that.MAX_RADIUS = 60;
    that.radius = 5;
    that.rgba = {
      r: 255,
      g: 0,
      b: 0,
      a: .5
    };
    that.color = function(){
      var rgba =  "rgba(" +
                  that.rgba.r + "," +
                  that.rgba.g + "," +
                  that.rgba.b + ","
                  + that.rgba.a + ")";
      return rgba;
    };

    // rate of expansion
    that.TURNS = 25;
    that.D_RAD = that.MAX_RADIUS/that.TURNS;
    // Draw
    that.draw = function(){
      Helper.drawCircle(that)
    }
    // Update
    that.interval = function(){
      that.radius += that.D_RAD;
      if(that.rgba.g <= 255){
        that.rgba.g += Math.floor((255/that.TURNS));
      }
      that.rgba.a = that.rgba.a / 1.02;
    }
  }

  return {
    Game: Game,
    Helper: Helper
  }

})();

$(function() {
  var context = $("canvas#canvas")[0].getContext('2d');
  //var missileCommand = new MissileCommand;
  MissileCommand.Helper.context = context;
  var game = new MissileCommand.Game();
  game.draw();
});

