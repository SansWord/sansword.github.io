var TOTAL_ROW = 40,
    scl = Math.floor(window.innerWidth/TOTAL_ROW);
var MAX_ROW=Math.floor(window.innerWidth/scl),
    MAX_COLUMN=Math.floor(window.innerHeight/scl),
    WIDTH = MAX_ROW*scl,
    HEIGHT = MAX_COLUMN*scl,
    MAX_POINT= MAX_ROW*MAX_COLUMN;


var pickFoodRetry=0,
    MAX_PICKFOOD_RETRY=500;

var s;

var food;
var haveToMoveNext = false;
var drawing=true;
function setup() {
  createCanvas(WIDTH, HEIGHT);
  s = new Snake();
  frameRate(30);
  pickFoodLocation();
}

function absLength(a, b, length) {
  var l = Math.abs(a-b);
  if(l>length/2) {
    l = length -l;
  }
  return l;
}

function draw() {
  if(!drawing) return;
  background(0);
  s.update();
  drawFood();
  autoMove();
}

function autoMoveX() {
  return s.dir(chooseDir(food.x, s.getX(), WIDTH), 0);
}

function autoMoveY() {
  return s.dir(0, chooseDir(food.y, s.getY(), HEIGHT));
}

function autoMove() {
  if(haveToMoveNext) {
    // post after eat a food. decide how to move.
    if(absLength(food.x,s.getX())<absLength(food.y,s.getY())) {
      if(!autoMoveX()){
        autoMoveY();
      }
    } else {
      if(!autoMoveY()){
        autoMoveX();
      }
    }
    haveToMoveNext = false;
  }
  if(food.x==s.getX() && food.y==s.getY()) {
    haveToMoveNext=true;
    return;
  }
  if(food.x == s.getX()) {
    autoMoveY();

  } else if(food.y == s.getY()) {
    autoMoveX();
  }
}

function chooseDir(fPos, sPos, length) {

  var short = Math.abs(fPos-sPos)>length/2;

  if(fPos>sPos) {
    return 1 * (short?-1:1);
  } else {
    return -1 * (short?-1:1);
  }
}

function keyPressed() {
  if(keyCode==LEFT_ARROW) {
    s.dir(-1,0);
  } else if(keyCode==RIGHT_ARROW) {
    s.dir(1,0);
  } else if(keyCode==UP_ARROW) {
    s.dir(0, -1);
  } else if(keyCode==DOWN_ARROW) {
    s.dir(0, 1);
  }
}

function drawFood() {
  renderPoint(food.x, food.y, '#fae');
}
function pickFoodLocation() {
  pickFoodRetry++;
  console.log(pickFoodRetry);
  food=createVector(
    floor(random(0,WIDTH/scl-1))*scl,
    floor(random(0,HEIGHT/scl-1))*scl
  );
  if(pickFoodRetry<=MAX_PICKFOOD_RETRY && s.checkCollide(food.x, food.y)) {
    pickFoodLocation();
  } else {
    pickFoodRetry=0;
  }
}

function Snake() {
  var x = 0;
  var y = 0;
  var xSpeed = 1;
  var ySpeed = 0;
  var tailTotal = 0;
  var tail=[];
  var previousEat = false;

  this.checkCollide = function(checkX, checkY) {
    if(dist(x, y, checkX, checkY)<1) {
      return true;
    }
    for(var i = 0;i<tail.length;i++) {
      if(dist(tail[i].x, tail[i].y, checkX, checkY)<1) {
        return true;
      }
    }
    return false;
  }

  this.update = function() {
    checkEat();
    updatePos();
    show();
  }
  this.dir = function(newX, newY) {
    if(xSpeed!=0&newX==0 ||ySpeed!=0&newY==0) {
      xSpeed=newX;
      ySpeed=newY;
      return true;
    } else {
      return xSpeed==newX&&ySpeed==newY;
    }
  }

  this.increase = function() {
    totalTail++;
  }

  function checkEat() {
    if((dist(x, y, food.x, food.y))<scl/2) {
      pickFoodLocation();
      previousEat=createVector(x, y);
      tailTotal++;
      if(tailTotal >= MAX_POINT*2) {
        tailTotal=0;
      }
    }
  }

  function updatePos() {
    tail.unshift(createVector(x, y));
    tail = tail.slice(0, tailTotal);
    //console.log(tail.length);

    x+= xSpeed * scl + WIDTH;
    y+= ySpeed * scl + HEIGHT;

    x %= WIDTH;
    y %= HEIGHT;

  }
  function show() {
    for(var i=0;i<tail.length;i++) {
      var tailPoint = tail[i];
      renderPoint(tailPoint.x, tailPoint.y, 255);
    }
    renderPoint(x, y, 'rgb(255,0,0)')
    if(previousEat) {
      renderPoint(previousEat.x, previousEat.y, 'rgb(0,255,0)');
    }
  }
  this.getX = function() {return x};
  this.getY = function() {return y};
}

function mouseClicked() {
  console.log("food:" + food.x +"," + food.y);
  drawing=!drawing;
}

function renderPoint(rectX, rectY, colorCode) {
  fill(colorCode);
  rect(rectX, rectY, scl, scl);
}