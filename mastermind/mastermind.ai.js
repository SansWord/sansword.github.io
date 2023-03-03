function Guess() {
    let history = [],
        possibleAnswers = [],
        nextPossibleAnswer = [0],
        currentGuess;

    const reset = () => {
        history = [];
        nextPossibleAnswer = [0]
        for (var i = 0; i < 10000; i++) {
            if (isValidGuess(i)) {
                possibleAnswers.push(i);
            }
        }
        console.log("starts with " + possibleAnswers.length + " possible answers.")
    };
    const submit = (response) => {
        history.push([currentGuess, response])
        // TODO try remove possible answer from this response
        calculateNextPossibleAnswers(response);
        var isPossible = nextPossibleAnswer.length!=0;
        if(isPossible) {
            possibleAnswers = nextPossibleAnswer;
            console.log("possibleAnswer left:", possibleAnswers.length);
        }
        return [isPossible, possibleAnswers.length];
    };
    const getCurrentGuess = () => {
        return currentGuess;
    };
    const getNextGuess = () => {
        currentGuess = possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];
        return currentGuess;
    };
    const getHistory = () => {
        return history;
    };
    const getPossibleAnswers = () => {
        return possibleAnswers;
    }

    function calculateNextPossibleAnswers(response) {
        nextPossibleAnswer = [];
        var pseudoAnswer = intToDigits(currentGuess);
        for(var i = 0; i<possibleAnswers.length; i++) {
            var pseudoResponse = calculateGuessResult(possibleAnswers[i], pseudoAnswer);
            if(pseudoResponse[0]==response[0] && pseudoResponse[1]==response[1]) {
                nextPossibleAnswer.push(possibleAnswers[i]);
            }
        }
    }

    return {
        reset,
        submit,
        getCurrentGuess,
        getNextGuess,
        getHistory,
        getPossibleAnswers
    }
}

let guess = Guess(),
    currentRow = 0,
    currentInputFieldSelector = "#A";

const inputPattern = new RegExp("^[0-9]{4}$");

function start() {
    console.log("start");


    $(document).keypress(function(e) {

        var targetId = $(e.target).attr("id");
        if (targetId == "userAnswer") {
            if (whichKey == "Enter") {
                calculateUserResponse();
            }
            return;
        }

        var whichKey = e.key;
        if (whichKey == "Enter") {
            if ($(".success").length == 0) {
                submit();
            }
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        // number is press, append into input.
        if (whichKey >= 0 && whichKey <= 4) {
            var inputDigit = whichKey;
            console.log("number is pressed, help you input");
            $(currentInputFieldSelector).val(whichKey);
            if (currentInputFieldSelector == "#A") {
                currentInputFieldSelector = "#B";
                $(currentInputFieldSelector).val(-1);
            } else {
                currentInputFieldSelector = "#A";
            }
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

            if (currentInputFieldSelector == "#A") {
                currentInputFieldSelector = "#B";
                $(currentInputFieldSelector).val(-1);
            } else {
                currentInputFieldSelector = "#A";
                $(currentInputFieldSelector).val(-1);
            }
        }
    });

    $("#userAnswer").on("input", function(e) {
        // handle answer special logic
        calculateUserResponse();
    });

    runUnitTests();
    reset();
}

function reset() {
    currentRow = 0;
    clearHistoryUI();
    clearCalculator();
    guess.reset();
    generateNewRow();
    $("#startingRow").children().last().html("Starts with " + guess.getPossibleAnswers().length +" possible answers.");
}

function clearHistoryUI() {
    $("#history tr").next().next().remove();
}

// [x, y] as xA yB
function calculateGuessResult(guess, expectedDigits=4) {
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
    var response = getInput();
    var validInput = inputIsValid();
    if (validInput) {
        var submitResult = guess.submit(response),
            possible = submitResult[0];
        displayCurrentRow(guess.getCurrentGuess(), response, validInput, submitResult);
        if (possible) {
            $("#currentRow .error").removeClass("error");
            if (response[0] != 4) {
                generateNewRow();
            }
        }
    } else {
        notifyUserError("input is invalid");
    }
}

function notifyUserError(msg) {
    $("#currentRow td:nth-child(4)").addClass("error").html(msg);
}

function inputIsValid() {
    var aVal = parseInt($("#A").val()),
        bVal = parseInt($("#B").val());
    return aVal != -1 && bVal != -1 && aVal + bVal <= 4;
}

function getInput() {
    var aVal = parseInt($("#A").val()),
        bVal = parseInt($("#B").val());
    return [aVal, bVal];
}

function clearUserInput() {
    $("#A").val(-1);
    $("#B").val(-1);
}

function isValidGuess(input) {
    var inputStr = "" + input;
    if (!inputPattern.test(inputStr)) {
        return false;
    }
    inputDigits = intToDigits(inputStr, 4);
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

function intToDigits(val, digitNum=4) {
    var digits = [];
    for (var i = 0; i < digitNum; i++) {
        digits.push(val % 10);
        val = Math.floor(val / 10);
    }
    return digits;
}

function displayCurrentRow(guess, response, inputIsValid, guessSubmitResponse) {
    var guessTD = $("#currentRow td:nth-child(2)"),
        responseTD = $("#currentRow td:nth-child(3)"),
        descriptionTD = $("#currentRow td:nth-child(4)");
    guessTD.html(pad(guess, 4));
    console.log("before html");
    responseTD.html(response[0] + "A" + response[1] + "B");
    console.log("after html");
    if (!inputIsValid) {
        descriptionTD.html("Invalid Input!!!!");
        clearUserInput();
    } else if (response[0] == 4) {
        descriptionTD.html("Sucess!!!");
        $("#currentRow").addClass("success")
    } else if(guessSubmitResponse[0]){
        descriptionTD.html("Keep going!!! " + guessSubmitResponse[1] + " choices left");
    } else {
        notifyUserError("This is impossible, don't lie me");
    }
}

function generateNewRow(useCurrentGuess = false) {
    $("#currentRow").attr("id", "");
    currentRow = currentRow + 1;
    currentInputFieldSelector = "#A";
    if (!useCurrentGuess) {
        guess.getNextGuess();
    }
    $('<tr id="currentRow"><td>' + currentRow + '</td><td id="guess"> ' + pad(guess.getCurrentGuess()) + '  </td><td><select id="A" name="A"><option value="-1">-</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select> A, <select id="B" name="B"><option value="-1">-</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select> B <input type="button" name="submit" value="submit" onclick="submit()" /></td><td>-</td></tr>').insertAfter($('#history tr').parent().children().last());
    calculateUserResponse();
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

function pad(str, max = 4) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
}

function calculateUserResponse() {
    var userInputAnswer = $("#userAnswer").val();
    var autoInput = $('input[name=auto_input]:checked').val();
    if (isValidGuess(userInputAnswer)) {
        console.log("calculating user response");
        var userInputAnswerDigits = intToDigits(parseInt(userInputAnswer));
        var response = calculateGuessResult(guess.getCurrentGuess(), userInputAnswerDigits);
        $("#calculatedResponse").html(response[0] + " A "+response[1]+" B");
        if(autoInput == "yes") {
            $("#A").val(response[0]);
            $("#B").val(response[1]);
        }
    } else {
        $("#calculatedResponse").html("- A - B");
        if(autoInput == "yes") {
            clearUserInput();
        }
    }
}

function clearCalculator() {
    $("#userAnswer").val("");
    $("#calculatedResponse").html("- A - B");
    $('#yes').prop("checked", true);
    $('#no').prop('checked', false);
}




















