// Game
  // Set up storage arrays (missiles on board)
    // Enemy missiles
    // Our missiles
    // Explosions
    // Points
  // Build our battery
  // Build enemy battery
  // Draw initial board once
  // Bind event handlers
    // Mouse click => Fire a missile to that coordinates (if we have any)
  // GAME LOOP (set interval timer)
    // Check for game ending conditions
      // When all enemy missiles have crossed the baseline or been destroyed
        // So basically, when the array of enemy missiles is empty
    // Increment positions
      // For missiles and explosions, calling their own increment functions
    // check for collisions with explosions
      // If a missile collides with an explosion, it becomes an explosion
      // If it was an enemy missile, increment score
    // Redraw the board


// Enemy Missile (starts at random point, to a random point on bottom of board)
  // velocity X, Y
  // position
  // target XXXX
  // Draw
  // Update

// Our Missile (starts at our battery, moving to target)
  // velocity
  // position
  // target
  // Draw
  // Update

// Our Battery
  // Ammo
  // Coordinates (middle of screen)
  // Update

// Enemy Battery
  // Ammo
  // Update

// Explosion
  // position
  // Fixed max size
  // rate of expansion
  // Draw
  // Update