var TOTAL_ROW = 12,
    BOX_SIZE = Math.floor(window.innerWidth / TOTAL_ROW),
    MAX_ROW = Math.floor(window.innerWidth / BOX_SIZE) - 2,
    MAX_COLUMN = Math.floor(window.innerHeight / BOX_SIZE) - 2,
    WIDTH = MAX_ROW * BOX_SIZE,
    HEIGHT = MAX_COLUMN * BOX_SIZE,
    MAX_POINT = MAX_ROW * MAX_COLUMN,
    MAX_PICKFOOD_RETRY = 500;

var s,
    food,
    haveToMoveNext = false,
    drawing = true,
    pickFoodRetry = 0,
    freePickFoodMode = false,
    drawPrevious = false;

function setup() {
    createCanvas(WIDTH, HEIGHT);
    s = new Snake();
    frameRate(8);
    pickFoodLocation();


    // set options to prevent default behaviors for swipe, pinch, etc
    var options = {
        preventDefault: true
    };

    // document.body registers gestures anywhere on the page
    var hammer = new Hammer(document.body, options);
    hammer.get('swipe').set({
        direction: Hammer.DIRECTION_ALL
    });

    hammer.on("swipe", swiped);
}

function absLength(a, b, length) {
    var l = Math.abs(a - b);
    if (l > length / 2) {
        l = length - l;
    }
    return l;
}

function draw() {
    if (!drawing) return;
    background(0);
    s.update();
    drawFood();
    //autoMove();
}

function autoMoveX() {
    return s.dir(chooseDir(food.x, s.getX(), WIDTH), 0);
}

function autoMoveY() {
    return s.dir(0, chooseDir(food.y, s.getY(), HEIGHT));
}

function autoMove() {
    if (haveToMoveNext) {
        // post after eat a food. decide how to move.
        if (absLength(food.x, s.getX()) < absLength(food.y, s.getY())) {
            if (!autoMoveX()) {
                autoMoveY();
            }
        } else {
            if (!autoMoveY()) {
                autoMoveX();
            }
        }
        haveToMoveNext = false;
    }
    if (food.x == s.getX() && food.y == s.getY()) {
        haveToMoveNext = true;
        return;
    }
    if (food.x == s.getX()) {
        autoMoveY();

    } else if (food.y == s.getY()) {
        autoMoveX();
    }
}

function chooseDir(fPos, sPos, length) {

    var short = Math.abs(fPos - sPos) > length / 2;

    if (fPos > sPos) {
        return 1 * (short ? -1 : 1);
    } else {
        return -1 * (short ? -1 : 1);
    }
}

function keyPressed() {
    if (keyCode == LEFT_ARROW) {
        s.dir(-1, 0);
    } else if (keyCode == RIGHT_ARROW) {
        s.dir(1, 0);
    } else if (keyCode == UP_ARROW) {
        s.dir(0, -1);
    } else if (keyCode == DOWN_ARROW) {
        s.dir(0, 1);
    }
}

function drawFood() {
    renderPoint(food.x, food.y, '#fae');
}

function pickFoodLocation() {
    pickFoodRetry++;
    food = createVector(
        floor(random(0, MAX_ROW)) * BOX_SIZE,
        floor(random(0, MAX_COLUMN)) * BOX_SIZE
    );
    if (pickFoodRetry > MAX_PICKFOOD_RETRY) {
        freePickFoodMode = true;
    }
    if (!freePickFoodMode && s.checkCollide(food.x, food.y)) {
        pickFoodLocation();
    } else {
        pickFoodRetry = 0;
    }
}

function Snake() {
    var x = 0;
    var y = 0;
    var xSpeed = 1;
    var ySpeed = 0;
    var tailTotal = 0;
    var tail = [];
    var previousEat = false;

    this.checkCollide = function(checkX, checkY) {
        if (dist(x, y, checkX, checkY) < 1) {
            return true;
        }
        for (var i = 0; i < tail.length; i++) {
            if (dist(tail[i].x, tail[i].y, checkX, checkY) < 1) {
                return true;
            }
        }
        return false;
    }

    this.update = function() {
        checkEat();
        updatePos();
        checkDeath();
        show();
    }
    this.dir = function(newX, newY) {
        if (xSpeed != 0 & newX == 0 || ySpeed != 0 & newY == 0) {
            xSpeed = newX;
            ySpeed = newY;
            return true;
        } else {
            return xSpeed == newX && ySpeed == newY;
        }
    }

    this.increase = function() {
        tailTotal++;
    }

    function checkDeath() {
        for (var i = tail.length - 1; i >= 0; i--) {
            if (tail[i].x == x && tail[i].y == y) {
                drawing = false;
            }
        }
    }

    function checkEat() {
        if ((dist(x, y, food.x, food.y)) < BOX_SIZE / 2) {
            pickFoodLocation();
            previousEat = createVector(x, y);
            tailTotal++;
            if (tailTotal >= MAX_POINT * 2) {
                resetSnake();
            }
        }
    }

    function resetSnake() {
        tailTotal = 0;
        freePickFoodMode = false;
    }

    function updatePos() {
        tail.unshift(createVector(x, y));
        tail = tail.slice(0, tailTotal);

        x += xSpeed * BOX_SIZE + WIDTH;
        y += ySpeed * BOX_SIZE + HEIGHT;

        x %= WIDTH;
        y %= HEIGHT;

    }

    function checkMapRepeat(repeatMap, point) {
        if (!repeatMap.hasOwnProperty("" + point.x)) {
            repeatMap["" + point.x] = new Object();
            repeatMap["" + point.x]["" + point.y] = 1;
            return 0;
        }
        if (!repeatMap["" + point.x].hasOwnProperty("" + point.y)) {
            repeatMap["" + point.x]["" + point.y] = 1;
            return 0;
        }
        repeatMap["" + point.x]["" + point.y] = repeatMap["" + point.x]["" + point.y] + 1;
        return repeatMap["" + point.x]["" + point.y] - 1;
    }

    function show() {
        var repeatMap = new Object();
        for (var i = 0; i < tail.length; i++) {
            var tailPoint = tail[i];
            var color = Math.max(0, 255 - checkMapRepeat(repeatMap, tailPoint) * 40);
            var colorCode = 'rgb(255,255,' + color + ')';
            renderPoint(tailPoint.x, tailPoint.y, colorCode);
        }
        renderPoint(x, y, 'rgb(255,0,0)')
        if (drawPrevious && previousEat) {
            renderPoint(previousEat.x, previousEat.y, 'rgb(0,255,0)');
        }
    }
    this.getX = function() {
        return x
    };
    this.getY = function() {
        return y
    };
}

function mouseClicked() {
    //console.log("food:" + food.x + "," + food.y);
    //drawing = !drawing;
}

function renderPoint(rectX, rectY, colorCode) {
    fill(colorCode);
    rect(rectX, rectY, BOX_SIZE, BOX_SIZE);
}

function swiped(event) {
    if (event.direction == 4) {
        //msg = "you swiped right";
        s.dir(1, 0);
    } else if (event.direction == 8) {
        //msg = "you swiped up";
        s.dir(0, -1);
    } else if (event.direction == 16) {
        //msg = "you swiped down";
        s.dir(0, 1);
    } else if (event.direction == 2) {
        //msg = "you swiped left";
        s.dir(-1, 0);
    }
}