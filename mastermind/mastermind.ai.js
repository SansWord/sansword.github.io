function Guess() {
    let history = [],
        possibleAnswers = [],
        nextPossibleAnswer = [0],
        currentGuess;

    const reset = () => {
        history = [];
        nextPossibleAnswer = [0];
        possibleAnswers = [];
        for (var i = 0; i < 10000; i++) {
            if (isValidGuess(pad(""+i))) {
                possibleAnswers.push([i, intToDigits(i)]);
            }
        }
        console.log("starts with " + possibleAnswers.length + " possible answers.")
    };
    const submit = (response) => {
        history.push([currentGuess, response])
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
        var currentGuessDigits = currentGuess[1];
        for(var i = 0; i<possibleAnswers.length; i++) {
            var currentPossibleAnswer = possibleAnswers[i];
            var currentPossibleAnswerDigits = currentPossibleAnswer[1];
            var pseudoResponse = fastCalculateGuessResult(currentGuessDigits, currentPossibleAnswerDigits);
            if(isListEqual(pseudoResponse, response)) {
                nextPossibleAnswer.push(currentPossibleAnswer);
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
            // TODO buggy, can't work
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
        console.log("trigger input event");
        // handle answer special logic
        calculateUserResponse();
    });

    reset();
}

function reset() {
    currentRow = 0;
    clearHistoryUI();
    clearCalculator();
    guess.reset();
    generateNewRow();
    $("#startingRow").children().last().html("Starts with " + guess.getPossibleAnswers().length +" possible answers.");
    togglePossibleAnswers(false);
}

function clearHistoryUI() {
    $("#history tr").next().next().remove();
}

// [x, y] as xA yB
function calculateGuessResult(guess, expectedDigits) {
    var guessDigits = intToDigits(guess, 4);
    return fastCalculateGuessResult(guessDigits, expectedDigits);
}

function fastCalculateGuessResult(guessDigits, expectedDigits) {
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
        displayCurrentRow(response, validInput, submitResult);
        if (possible) {
            $("#currentRow .error").removeClass("error");
        }
        if (response[0] != 4) {
            generateNewRow();
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
    if (!inputPattern.test(input)) {
        return false;
    }
    inputDigits = intToDigits(parseInt(input));
    return (new Set(inputDigits)).size == 4;
}

function intToDigits(val, digitNum=4) {
    var digits = [];
    for (var i = 0; i < digitNum; i++) {
        digits.push(val % 10);
        val = Math.floor(val / 10);
    }
    return digits;
}

function displayCurrentRow(response, inputIsValid, guessSubmitResponse) {
    var guessTD = $("#currentRow td:nth-child(2)"),
        responseTD = $("#currentRow td:nth-child(3)"),
        descriptionTD = $("#currentRow td:nth-child(4)");
    guessTD.html(pad(guess.getCurrentGuess()[0]));
    responseTD.html(response[0] + "A" + response[1] + "B");
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
    $('<tr id="currentRow"><td>' + currentRow + '</td><td id="guess"> ' + pad(guess.getCurrentGuess()[0]) + '  </td><td><select id="A" name="A"><option value="-1">-</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select> A, <select id="B" name="B"><option value="-1">-</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select> B <input type="button" name="submit" value="submit" onclick="submit()" /></td><td>-</td></tr>').insertAfter($('#history tr').parent().children().last());
    calculateUserResponse();
    const chunkSize = 10;
    var chunks = []
    var arr = guess.getPossibleAnswers();
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        chunks.push(chunk.map(function(e) {return pad(e[0]);}).join(", "));
    }

    $("#possibleAnswers").html(chunks.join("</br>"));
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
        var response = fastCalculateGuessResult(
            guess.getCurrentGuess()[1],
            userInputAnswerDigits
            );
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

function togglePossibleAnswers(isShow) {
    $("#possibleAnswers").toggle(isShow);
}

function isListEqual(list1, list2) {
    if(list1.length!=list2.length) {
        return false;
    }
    for(var i = 0; i <list1.length; i++) {
        if(list1[i]!=list2[i]) {
            return false;
        }
    }
    return true;
}
















