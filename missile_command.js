var MissileCommand = (function(){

  // Game ********************************************
  function Game(){

    // Variables
    var that = this;
    that.CANVAS_X = $("#canvas").width();
    that.CANVAS_Y = $("#canvas").height();
    that.AMMO = 10;
    that.MISSILE_VELOCITY = 20;
    that.GAME_SPEED = 1000/32;
    that.TICS = 0; // TEMPORARY, prevents infinite loops

    // Set up storage arrays (missiles on board)
    that.enemyMissiles = (function(){
      var missiles = [];
      for(var i = 0; i < that.AMMO; i++){
        missiles.push(new Missile({pos: {x: Math.random()*that.CANVAS_X, y: 0 }}));
      }
      return missiles;
    })();

    that.ourBattery = new OurBattery(that);
    that.missiles = (function(){
      var missiles = [];
      for(var i = 0; i < that.AMMO; i++){
        missiles.push(new Missile(that.ourBattery));
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
      that.ourBattery.draw();
      that.drawCollection(that.enemyMissiles);
      that.drawCollection(that.explosions);
    }

    // Bind event handlers
      // Mouse click => Fire a missile to that coordinates (if we have any)
    $("canvas#canvas").click(function(e){
      var nearestMissile;
      var target = { pos: { x: e.pageX, y: e.pageY } };

      $.each(that.missiles, function(i, missile){
        if(missile.target == null){
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
    });

    // INITIALIZE GAME

    // GAME LOOP (set interval timer) &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
    var interval = setInterval(function(){

      // Check for game ending conditions
        // When all enemy missiles have crossed the baseline or been destroyed
          // So basically, when the array of enemy missiles is empty
      that.TICS++;
      if(that.TICS > 200){
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
      if(that.enemyMissiles.length > 0){
        if(Math.random() < .1){
          console.log("FIRE ENEMY MISSILE");
          Missile.fireMissile(that.enemyMissiles.pop(), { pos: {x: Math.random()*that.CANVAS_X}, y: that.CANVAS_Y}, that.MISSILE_VELOCITY/4);
          console.log(that.enemyMissiles);
        }
      }

      // If it was an enemy missile, increment score


      // Redraw the board
      that.draw();
    }, that.GAME_SPEED);

  }



  // Enemy Missile (starts at random point, to a random point on bottom of board)
    // velocity X, Y
    // position
    // target XXXX
    // Draw
    // Update


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
    this.context.stroke();
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
  function Missile(battery){

    var that = this;
    that.battery = battery;
    that.color = "rgba(0, 0, 255, .5)";
    that.radius = 5;

    // velocity
    that.vel = {
      x: 0,
      y: 0
    }
    // position
    that.pos = {
      x: that.battery.pos.x,
      y: that.battery.pos.y
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
    var ratio = (missile.pos.y - target.pos.y) / (target.pos.x - missile.pos.x);
    var angle = Math.atan(ratio);
    if(angle<0){
      angle += Math.PI;
    }
    missile.vel.x = velocity*Math.cos(angle);
    missile.vel.y = -velocity*Math.sin(angle);
    missile.target = target;
  }

  // Our Battery ********************************************
  function OurBattery(game){

    var that = this;
    that.radius = 50;
    that.color = "rgba(255,0,0,.5)";

    // Coordinates (middle of screen)
    that.pos = {
      x: game.CANVAS_X/2,
      y: game.CANVAS_Y
    }

    // Draw TODO: Circle follows the mouse direction
    that.draw = function(){
      Helper.drawCircle(that);
    }

    // Update
  }

  // Enemy Battery ********************************************
    // Ammo
    // Update

  // Explosion ********************************************
  function Explosion(pos){

    var that = this;

    // position
    that.pos = pos;
    // Fixed max size
    that.MAX_RADIUS = 100;
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
    that.TURNS = 50;
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

