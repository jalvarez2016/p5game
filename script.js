/*global Ball, mouseIsPressed, text, canvasPressed, loadSound, random, 
soundFormats, ellipse, createCanvas, colorMode, background, fill, 
HSB width height rect, mouseX, mouseY, noStroke frameCount collideRectCircle, noLoop
keyCode keyIsPressed UP_ARROW DOWN_ARROW LEFT_ARROW RIGHT_ARROW rotate
collideRectRect rectMode CENTER*/

let player;
let player2;
let bullets = [];
let asteroids = [];
let particles = [];
let shootSound, explodeSound, flipSound, backgroundSound;

let paused = false;
let gameStart;

//socket stuff not being used
let socket;

function preload(){  
  soundFormats("wav");
  // shootSound = loadSound('assets/shoot.wav');
  shootSound = loadSound('assets/shoot.wav');
  explodeSound = loadSound('assets/explosion.wav');
  flipSound = loadSound('assets/flip.wav');
  backgroundSound = loadSound('assets/Background.wav');
}

function setup() {
  // Canvas & color settings
  textFont("Audiowide");
  gameStart = false;
  backgroundSound.loop();
  createCanvas(600, 600);
  colorMode(HSB, 360, 100, 100);
  rectMode(CENTER);
  player = new PlayerShip();
  player2 = new PlayerShip2();
  for (let i = 0; i < 10; i++) {
    asteroids.push(new Asteroid());
  }

  //socket stuff
  socket = io.connect();
}

function draw() {
  if(paused){
    textSize(40);
    text('Game Paused', width/2- 140, height/2);
    textSize(12);
  } else if (!gameStart) {
      background(95);
      textSize(40);
      text('New Asteroids', 70, 150);
      textSize(20);
      text('Retro Remix', width / 3, 200);
      text('Developed By Jason and Jason', 10, 250);
  } else {

    let backgroundColor = color(20,30,90);
    background(backgroundColor);

    for (let i = 0; i < bullets.length; i++) {
      bullets[i].display();
      bullets[i].move();
      let hit = bullets[i].checkPlayerHit(
        player
      );
      let hitPlayer2 = bullets[i].checkPlayerHit(player2);

      if(hit && bullets[i].color !== player.color){
        player2.score += 1;
      } else if( hitPlayer2 && bullets[i].color !== player2.color){
        player.score += 1;
      } else if(hit && bullets[i].color == player.color){
        player.special +=1;
      } else if(hitPlayer2 && bullets[i].color == player2.color){
        player2.special +=1;
      }

      if (bullets[i].y < 0 || bullets[i].y > height || hit|| hitPlayer2 ) {
        bullets[i].explode();
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
          bullets[y].explode();         
          bullets.splice(y, 1); 
        }
      }
    }

    for(let p=0; p<particles.length; p++){
      let part = particles[p];
      part.display();
      part.fall()
      if(part.x <0 || part.x > width || part.y <0 || part.y >height){
        particles.splice(p,1);
      }
    }

    
    if ((player.score || player2.score) == 25) {
      gameOver = true;
      textSize(40);
      text('GAME OVER', width / 2 - 140, height / 2);
    }

    fill(0);
    text("Player 1 Score: " +  player.score, 10,20);
    player.display();
    player.displayCharge();
    player.move();
    player.update();

    fill(0);
    text("Player 2 Score: " +  player2.score, 10,380);
    player2.displayCharge();
    player2.display();
    player2.move();
    player2.update();
  }
}

function keyPressed() {
  gameStart = true;
  player.flip();
  player.shoot();
  player.specialMove();
  player2.shoot();
  player2.flip();
  player2.specialMove();

  if(keyCode == 27){
    if(paused){
      paused = false
    } else {
      paused = true
    }
  }
  
  if (gameOver) {
    gameStart = false;
    gameOver = false;    
    player = new PlayerShip();
    player2 = new PlayerShip2();
    asteroids = [];
    for (let i = 0; i < 3; i++) {
      asteroids.push(new Asteroid());
    }
  } 
}

class PlayerShip {
  constructor() {
    this.position = createVector(width / 2, height - 50);
    //this.x = width / 2;
    //this.y = height - 50;
    this.nose = 0;
    this.radius = 12;
    this.color = 0;
    this.rotation = 0;
    this.velocity = createVector(0,0);
    this.score = 0;
    this.special = 0;
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.mult(0.95);
  }

  boost() {
    var thruster = p5.Vector.fromAngle(this.nose);
    this.velocity.add(thruster);
  }

  display() {
    push();
    translate(this.position.x, this.position.y);
    rotate(this.nose + PI / 2);
    fill(this.color);
    triangle(-this.radius, this.radius, this.radius, this.radius, 0, -this.radius);
    pop();
  }

  move() {
    if (keyIsPressed) {
      if (keyCode == UP_ARROW) {
        //I dunno...
        this.boost();
      } else if (keyCode == LEFT_ARROW && this.position.x - 10 > 0) {
        this.setRotation(-0.1);
        this.turn();
      } else if (keyCode == RIGHT_ARROW && this.position.x + this.radius + 10 < width) {
        this.setRotation(0.1);
        this.turn();
      }
    }

    if (this.position.x + this.radius < 0) {
      this.position.x = width - this.radius;
    } else if (this.position.x - this.radius > width) {
      this.position.x = 0;
    } else if (this.position.y - this.radius > height) {
      this.position.y = 0;
    } else if (this.position.y + this.radius < 0) {
      this.position.y = height - this.radius;
    }
  }

  turn() {
    this.nose += this.rotation;
  }

  setRotation(angle) {
    this.rotation = angle;
  }

  flip() {
    if (keyCode == 188) {
      flipSound.play();
      if (this.color == 0) {
        this.color = 360;
      } else {
        this.color = 0;
      }
    }
  }

  shoot() {
    if (keyCode == 190) {
      let newX = 25*sin(-1*(this.nose - PI/2)) + this.position.x;
      let newY = 25*cos(-1*(this.nose - PI/2)) + this.position.y;
      bullets.push(new Bullet(newX, newY, this.color, this.nose));
      shootSound.play();
    }
  }

  displayCharge(){
    fill(this.color);
    let position = {
      x: 20,
      y: 30
    }
    for(let i=0; i<this.special; i++){
      rect(position.x, position.y, 5,5);
      position.x += 10;
    }
  }

  specialMove(){
    if(keyCode == 191){
      for(let i =0; i<this.special; i++ ){
        let rotation = random(0,2*PI);
        let x = 25*sin(-rotation) + this.position.x;
        let y = 25*cos(-rotation) + this.position.y;
        bullets.push(new Bullet(x, y, this.color, rotation));
      }
      player.special = 0;
    }
  }
}
class PlayerShip2 {
  constructor() {
    this.position = createVector(width / 2, 50);
    this.nose = 0;
    this.radius = 12;
    this.color = 0;
    this.rotation = 0;
    this.velocity = createVector(0,0);
    this.score = 0;
    this.special = 0;
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.mult(0.95);
  }

  boost() {
    var thruster = p5.Vector.fromAngle(this.nose);
    this.velocity.add(thruster);
  }

  display() {

    //math visual for bullet spawning

    // fill(360);
    // ellipse(this.position.x, this.position.y, 50);
    // let newX = 25*sin(-1*(this.nose - PI/2)) + this.position.x;
    // let newY = 25*cos(-1*(this.nose - PI/2)) + this.position.y;
    // line(this.position.x, this.position.y, newX, newY );

    // push();
    fill(this.color);
    translate(this.position.x, this.position.y);
    rotate(this.nose + PI / 2);
    fill(this.color);
    triangle(-this.radius, this.radius, this.radius, this.radius, 0, -this.radius);
    // pop();

  }

  move() {
    if (keyIsPressed) {
      if (keyCode == 87) {
        //I dunno...
        this.boost();
      } else if (keyCode == 65 && this.position.x - 10 > 0) {
        this.setRotation(-0.1);
        this.turn();
      } else if (keyCode == 68 && this.position.x + this.radius + 10 < width) {
        this.setRotation(0.1);
        this.turn();
      }
    }

    if (this.position.x + this.radius < 0) {
      this.position.x = width - this.radius;
    } else if (this.position.x - this.radius > width) {
      this.position.x = 0;
    } else if (this.position.y - this.radius > height) {
      this.position.y = 0;
    } else if (this.position.y + this.radius < 0) {
      this.position.y = height - this.radius;
    }
  }

  turn() {
    this.nose += this.rotation;
  }

  setRotation(angle) {
    this.rotation = angle;
  }

  flip() {
    if (keyCode == 69) {
      flipSound.play();
      if (this.color == 0) {
        this.color = 360;
      } else {
        this.color = 0;
      }
    }
  }

  shoot() {
    if (keyCode == 32) {
      let newX = 25*sin(-1*(this.nose - PI/2)) + this.position.x;
      let newY = 25*cos(-1*(this.nose - PI/2)) + this.position.y;
      bullets.push(new Bullet(newX, newY, this.color, this.nose));
      shootSound.play();
    }
  }

  
  displayCharge(){
    fill(this.color);
    let position = {
      x: 10,
      y: height - 40
    }
    for(let i=0; i<this.special; i++){
      rect(position.x, position.y, 5,5);
      position.x += 10;
    }
  }

  specialMove(){
    if(keyCode == 82){
      for(let i =0; i<this.special; i++ ){
        let rotation = random(-2*PI,2*PI);
        console.log(rotation);
        let x = 25*sin(-rotation) + this.position.x;
        let y = 25*cos(-rotation) + this.position.y;
        bullets.push(new Bullet(x, y, this.color, rotation));
      }
      this.special = 0;
    }
  }
}

class Particles{
  constructor(x, y, color){
    this.x = x;
    this.y = y;
    this.d = 10;
    this.XrepelForce = random(-10, 10);
    this.YrepelForce = random(-10, 10);
    this.color = color;
  }

  display(){
    fill(this.color);
    ellipse(this.x, this.y, this.d);
  }

  fall(){
    this.x += this.XrepelForce;
    this.y += this.YrepelForce;
  }
}

class Bullet {
  constructor(x, y, color, angle) {
    this.position = createVector(x, y);
    this.width = 10;
    this.height = 10;
    this.color = color;
    this.speed = 10;
    this.velocity = p5.Vector.fromAngle(angle);
    this.velocity.mult(10);
  }

  display() {
    fill(this.color);
    ellipse(this.position.x, this.position.y, this.width);
  }

  move() {
    this.position.add(this.velocity);
  }

  explode(){
    for(let i=0; i<10; i++){
      particles.push(new Particles(this.position.x, this.position.y, this.color));
      explodeSound.play();
    }
  }

  checkHit(obsticale) {
    return collideRectRect(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
      obsticale.position.x,
      obsticale.position.y,
      obsticale.width,
      obsticale.height,
    );

    
  }
  
  checkPlayerHit(obsticale){
    return collideRectRect(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
      obsticale.position.x,
      obsticale.position.y,
      obsticale.radius,
      obsticale.radius
    );      
  }
}

class Asteroid {
  constructor() {
    this.position = {
      x: random(width),
      y: random(height/4, (3*height/4))
    }
    this.width = random(30, 50);
    this.height = random(30, 50);
    this.xSpeed = random(-2, 2);
    this.ySpeed = random(-2, 2);
    this.offset = [];
    this.color = random(360);
    for (var i = 0; i < 10; i++) {
      this.offset[i] = random(-3, 3);
    }
  }

  display() {
    push();
    translate(this.position.x, this.position.y);
    fill(this.color, 40, 90); 
    beginShape();
    for (var i = 0; i < 10; i++) {
      var angle = map(i, 0, 10, 0, TWO_PI);
      var x = (this.width + this.offset[i]) * cos(angle);
      var y = (this.height + this.offset[i]) * sin(angle);
      vertex(x, y);
    }
    endShape(CLOSE);
    pop();
  }

  move() {
    this.position.x += this.xSpeed;
    this.position.y += this.ySpeed;

    if (this.position.x + this.width / 2 < 0) {
      this.position.x = width - this.width
    } else if (this.position.x - this.width / 2 > width) {
      this.position.x = 0;
    } else if (this.position.y - this.height / 2 > height) {
      this.position.y = 0;
    } else if (this.position.y + this.height / 2 < 0) {
      this.position.y = height - this.height;
    }
  }
}

