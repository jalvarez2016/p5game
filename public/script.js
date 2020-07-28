/*global Ball, mouseIsPressed, text, canvasPressed, loadSound, random, 
soundFormats, ellipse, createCanvas, colorMode, background, fill, 
HSB width height rect, mouseX, mouseY, noStroke frameCount collideRectCircle, noLoop
keyCode keyIsPressed UP_ARROW DOWN_ARROW LEFT_ARROW RIGHT_ARROW rotate
collideRectRect rectMode CENTER*/

let player;
let player2;
let bullets = [];
let asteroids = [];

//socket stuff
let socket;

function setup() {
  // Canvas & color settings
  createCanvas(400, 400);
  colorMode(HSB, 360, 100, 100);
  rectMode(CENTER);
  player = new PlayerShip();
  for (let i = 0; i < 3; i++) {
    asteroids.push(new Asteroid());
  }

  //socket stuff
  socket = io.connect('http://localhost:3000');
}

function draw() {
  background(95);

  for (let i = 0; i < bullets.length; i++) {
    bullets[i].display();
    bullets[i].move();
    let hit = bullets[i].checkHit(
      player
    );
    if (bullets[i].y < 0 || bullets[i].y > height || hit ) {
      bullets.splice(i, 1);
    }
  }

  for (let x = 0; x < asteroids.length; x++) {
    let asteroid = asteroids[x];
    asteroid.display();
    asteroid.move();
    for (let y = 0; y < bullets.length; y++) {
      let bullet = bullets[y];
      let asteroidHit = bullet.checkHit(asteroid);
       if(asteroidHit){
         bullets.splice(y, 1); 
       }
    }
  }

  player.display();
  player.move();
}

function keyPressed() {
  player.flip();
  player.shoot();
}

class PlayerShip {
  constructor() {
    this.x = width / 2;
    this.y = height - 50;
    this.height = 25;
    this.width = 25;
    this.health = 3;
    this.color = 0;
  }

  display() {
    fill(this.color);
    rect(this.x, this.y, this.width, this.height);
  }

  move() {
    if (keyIsPressed) {
      if (keyCode == UP_ARROW && this.y - 10 > (3 * height) / 4) {
        this.y -= 10;
      } else if (keyCode == DOWN_ARROW && this.y + this.height + 10 < height) {
        this.y += 10;
      } else if (keyCode == LEFT_ARROW && this.x - 10 > 0) {
        this.x -= 10;
      } else if (keyCode == RIGHT_ARROW && this.x + this.width + 10 < width) {
        this.x += 10;
      }
    }
  }

  flip() {
    if (keyCode == 90) {
      if (this.color == 0) {
        this.color = 360;
      } else {
        this.color = 0;
      }
    }
  }

  shoot() {
    if (keyCode == 88) {
      bullets.push(new Bullet(this.x, this.y - 20, this.color, -10));
    }
  }
}

class PlayerShip2 {
  constrtor()
}

class Bullet {
  constructor(x, y, color, speed) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 20;
    this.color = color;
    this.speed = speed;
  }

  display() {
    fill(this.color);
    rect(this.x, this.y, this.width, this.height);
  }

  move() {
    this.y += this.speed;
  }

  checkHit(obsticale) {
    return collideRectRect(
      this.x,
      this.y,
      this.width,
      this.height,
      obsticale.x,
      obsticale.y,
      obsticale.width,
      obsticale.height
    );
  }
}

class Asteroid {
  constructor() {
    this.x = random(width);
    this.y = random(height / 4, (3 * height) / 4);
    this.width = random(30, 50);
    this.height = random(30, 50);
    this.xSpeed = random(-2, 2);
    this.ySpeed = random(-2, 2);
    this.rotate = 0;
  }

  display() {
    // translate(150, 150);
    // rotate(radians(frameCount));
    fill(360);
    rect(this.x, this.y, this.width, this.height);
  }

  move() {
    if (
      this.x + this.width < 0 ||
      this.x > width ||
      this.y > height ||
      this.y + this.height < 0
    ) {
      this.x = random(width);
      this.y = random(height / 4, (3 * height) / 4);
      this.width = random(30, 50);
      this.height = random(30, 50);
      this.xSpeed = random(-2, 2);
      this.ySpeed = random(-2, 2);
    }
    this.x += this.xSpeed;
    this.y += this.ySpeed;
  }
}

