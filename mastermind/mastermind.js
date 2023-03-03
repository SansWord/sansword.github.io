function Answer() {
    let secretDigits = [];

    const reset = () => {
        secretDigits = generateRandomAnswer();
    };
    const respond = (guess) => {
        return calculateGuessResult(guess, secretDigits);
    };
    return {
        reset,
        respond
    }
}

let answer = Answer(),
    currentRow = 0;
const inputPattern = new RegExp("^[0-9]{4}$");

function start() {
    console.log("start");
    $(document).keypress(function(e) {
        var whichKey = e.key;
        if (whichKey == "Enter") {
            console.log('You pressed enter, submit current guess');
            if ($(".success").length == 0) {
                submit();
            }
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        if ($(e.target).attr("id") == "guess") {
            // already focus on input
            return;
        }
        // number is press, append into input.
        if (whichKey >= 0 && whichKey <= 9) {
            var inputDigit = whichKey;
            console.log("number is pressed, help you input");
            var newValue;
            if (!jQuery("#guess").val()) {
                newValue = "";
            } else {
                newValue = jQuery("#guess").val();
            }
            newValue += inputDigit;
            jQuery("#guess").val(newValue);

        }
    });

    $(document).keydown(function(e) {
        var whichKey = e.key;

        if (e.key == "Escape") {
            console.log('You pressed escape, restart a new game');
            reset();
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        if (e.key == "Backspace") {
            if ($(e.target).attr("id") == "guess") {
                // already focus on input
                return;
            }
            // backspace is pressed, remove last char of input
            var currentInput = jQuery("#guess").val();
            if (!currentInput || currentInput.length == 0) {
                return
            } else {
                var newValue = currentInput.substring(0, currentInput.length - 1);
                jQuery("#guess").val(newValue);
            }
        }
    })


    runUnitTests();
    reset();
}

function reset() {
    currentRow = 0;
    clearHistory();
    generateNewRow();
    answer.reset();
    $("#reset").focusout();
}

function clearHistory() {
    $("#history tr").next().remove();
}

// [x, y] as xA yB
function calculateGuessResult(guess, expectedDigits) {
    var guessDigits = intToDigits(guess, 4);
    var a = 0,
        b = 0;
    for (var i = 0; i < 4; i++) {
        var currentGuessDigit = guessDigits[i];
        if (currentGuessDigit == expectedDigits[i]) {
            a++;
        } else if (expectedDigits.indexOf(currentGuessDigit) != -1) {
            b++;
        }
    }
    return [a, b];
}

function submit() {
    // display on screen
    var rawInput = $("#guess").val();
    var validInput = isValidGuess(rawInput);
    var response = ["-", "-"];
    if (validInput) {
        guess = parseInt(rawInput);
        response = answer.respond(guess);
    } else {
        guess = 0;
    }
    displayCurrentRow(guess, response, validInput);
    if (response[0] != 4) {
        generateNewRow();
    }
    displayPossibleAnswers()
}

function isValidGuess(input) {
    if (!inputPattern.test(input)) {
        return false;
    }
    inputDigits = intToDigits(input, 4);
    return (new Set(inputDigits)).size == 4;
}

function generateRandomAnswer() {
    var canidate = 0;
    // pick a number as number until it is valid.
    while (!answerIsValid(canidate)) {
        canidate = Math.floor(Math.random() * (10000 - 123) + 123);
    }
    var digits = intToDigits(canidate, 4);
    return digits;
}

function intToDigits(val, digitNum) {
    var digits = [];
    for (var i = 0; i < digitNum; i++) {
        digits.push(val % 10);
        val = Math.floor(val / 10);
    }
    return digits;
}

function displayCurrentRow(guess, response, inputIsValid) {
    var inputTD = $("#currentRow td:nth-child(2)"),
        responseTD = $("#currentRow td:nth-child(3)"),
        descriptionTD = $("#currentRow td:nth-child(4)");
    inputTD.html(pad(guess, 4));
    responseTD.html(response[0] + "A" + response[1] + "B");
    if (!inputIsValid) {
        descriptionTD.html("Invalid Input!!!!");
    } else if (response[0] == 4) {
        descriptionTD.html("Sucess!!!");
        $("#currentRow").addClass("success")
    } else {
        descriptionTD.html("Keep going!!!");
    }
}

function generateNewRow() {
    $("#currentRow").attr("id", "");
    currentRow = currentRow + 1;
    $("<tr id='currentRow'><td>" + currentRow + "</td><td><input id='guess' type='text' value=''/><input type='button' name='submit' value='submit' onclick='submit()'/></td><td>-</td><td>-</td></tr>").insertAfter($('#history tr').parent().children().last());
}

// check if canidate is a 4-digit number without repetition
function answerIsValid(canidate) {
    // magic number: anything small than 123 is a 4-digit number with at least 2 digit with the same number.
    if ((canidate < 123) || (canidate >= 10000)) {
        return false;
    }
    var digits = [];
    for (var i = 0; i < 4; i++) {
        var currentDigit = canidate % 10;
        if (digits.indexOf(currentDigit) != -1) {
            return false;
        }
        digits.push(currentDigit);
        canidate = Math.floor(canidate / 10)
    }
    return true;
}

function displayPossibleAnswers() {
    
}

function runUnitTests() {
    testAnswerIsValid();
}

function testAnswerIsValid() {
    var cases = [
        [0, false],
        [930, false],
        [1234, true]
    ];
    for (var i = 0; i < cases.length; i++) {
        var testSubject = cases[i][0],
            expectedResult = cases[i][1];
        if (answerIsValid(testSubject) != expectedResult) {
            console.log("test case failed: " + testSubject);
        }
    }
}

function pad(str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
}