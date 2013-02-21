var MissileCommand = (function(){

  // Game ********************************************
  function Game(){

    // Variables
    var that = this;
    that.CANVAS_X = $("#canvas").width();
    that.CANVAS_Y = $("#canvas").height();
    that.AMMO = 50;
    that.MISSILE_VELOCITY = 20;
    that.GAME_SPEED = 1000/32;
    that.TICS = 0; // TEMPORARY, prevents infinite loops

    // Set up storage arrays (missiles on board)
    that.enemyMissiles = [];
    that.ourBattery = new OurBattery(that);
    that.ourMissiles = (function(){
      var missiles = [];
      for(var i = 0; i < that.AMMO; i++){
        missiles.push(new OurMissile(that.ourBattery));
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
      that.drawCollection(that.ourMissiles);
      that.ourBattery.draw();
      // drawEnemyMissiles();
      // drawExplosions();
    }

    // Bind event handlers
      // Mouse click => Fire a missile to that coordinates (if we have any)
    $("canvas#canvas").click(function(e){
      var nearestMissile;
      target = { pos: { x: e.pageX, y: e.pageY } };

      $.each(that.ourMissiles, function(i, missile){
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
      OurMissile.fireMissile(nearestMissile, target, that.MISSILE_VELOCITY);
    });

    // INITIALIZE GAME

    // GAME LOOP (set interval timer)
    var interval = setInterval(function(){
      // Check for game ending conditions
        // When all enemy missiles have crossed the baseline or been destroyed
          // So basically, when the array of enemy missiles is empty
      that.TICS++;
      if(that.TICS > 200){
        clearInterval(interval);
      }

      // Increment positions
      $.each(that.ourMissiles, function(i, missile){
        missile.interval();
      });
        // For missiles and explosions, calling their own increment functions
      // check for collisions with explosions
        // If a missile collides with an explosion, it becomes an explosion
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
    this.context.fillStyle = obj.color;
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

  Helper.context = null;


  // Our Missile ********************************************
  function OurMissile(battery){

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

  OurMissile.fireMissile = function(missile, target, velocity){
    var ratio = (missile.pos.y - target.pos.y) / (target.pos.x - missile.pos.x);
    var angle = Math.atan(ratio);
    if(angle<0){
      angle += Math.PI;
    }
    missile.vel.x = velocity*Math.cos(angle);
    missile.vel.y = -velocity*Math.sin(angle);
    missile.target = target.pos;
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
    // position
    // Fixed max size
    // rate of expansion
    // Draw
    // Update

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

