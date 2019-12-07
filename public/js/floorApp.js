/* File: floorApp.js
 * Author: Jonah Dubbs-Nadeau
 * Description: Contains all of the functionality specific to the Floor application.
 * Sources referenced:
 * https://davidwalsh.name/event-delegate
 * https://www.w3schools.com/jsref/prop_pushbutton_disabled.asp
 */

// Code to keep Floor link active
document.getElementById("floorLink").classList.toggle("activeLink");

// CODE FOR FLOOR ROUTINE

var id = 0; // unique identifier for each skill stack; incremented every time a new stack is created
var skillsInOrder = [];
var notes = [];

var acroLines = []; // list of stack indices of stacks considered "acro lines"

/* Constructors for FloorRoutine, FloorStack, FloorSkill */

function FloorRoutine() {
    this.stacks = []; // array of FloorStacks
    this.all = []; // array of skills
}

function FloorStack(index) {
    this.skills = [];
    this.index = index;
    this.connectionValue = 0;
}

function FloorSkill(skillPrototype, connected) {
    this.properties = skillPrototype;
    this.shouldNotReceiveDV = false;
    this.shouldNotReceiveCV = false;
    this.shouldNotReceiveCR = false;
    this.connected = connected;
}

/* Function that resets the skill's restrictions. Should be called on each skill every time the new D-Score is calculated.
 * Post: the restrictions on whether or not the skill should receive credit are reset
 */

FloorSkill.prototype.reset = function() {
    this.shouldNotReceiveDV = false;
    this.shouldNotReceiveCV = false;
    this.shouldNotReceiveCR = false;
}

/* Function that gets the top of the skill stack.
 * Returns: the skill at the top of the stack
 */

FloorStack.prototype.top = function() {
    return this.skills[this.skills.length - 1];
}

/* Function that determines whether or not a stack is empty.
 * Returns: true if the stack is empty, false otherwise
 */

FloorStack.prototype.isEmpty = function() {
    return this.skills.length <= 0;
}

/* Function that analyzes a floor stack to determine what credit it should receive.
 * Each time this function is called, all prior credit calculations or restrictions on credit are reset.
 * Determines whether the stack is an acro line and whether the acro line limit (4) has been exceeded.
 * Adds each skill in the stack to the list of skills in order and determines if the skill has been repeated and whether or not it should receive credit.
 * Also calculates the total connection value of the stack, and determines whether the stack fulfills CR #1.
 * Post: the list of skills in order is updated, the list of acro lines is updated, the stack's connection value is reset and updated
 * Returns: the total connection value, true if the stack fulfills CR #1 (false otherwise)
 */

FloorStack.prototype.analyze = function() {
    this.connectionValue = 0;

    var result = {
        CV: 0,
        fulfillsCR1: false
    };

    var isAcroLine = false;
    var noDV = false;

    for (var i = 0; i < this.skills.length; i++) {
        var currentSkill = this.skills[i];
        currentSkill.reset();

        if (isAcroLine == false && currentSkill.properties.acro == true && currentSkill.properties.isAerial == false) {
            if (acroLines.length < 4) {
                isAcroLine = true;
                acroLines.push(this.index);
            } else {
                noDV = true;
            }
        }

        if (noDV == true) {
            currentSkill.shouldNotReceiveDV = true;
            currentSkill.shouldNotReceiveCV = true;
            currentSkill.shouldNotReceiveCR = true;
            notes.push("NOTE: More than four acro lines; " + currentSkill.properties.name + " will not receive any credit.");
        } else {
            let count = skillCount(currentSkill, skillsInOrder);
            
            if (count == 1) {
                currentSkill.shouldNotReceiveDV = true;
                currentSkill.shouldNotReceiveCR = true;
                if (currentSkill.properties.acro == false) {
                    currentSkill.shouldNotReceiveCV = true;
                    notes.push("NOTE: " + currentSkill.properties.name + " (dance element) repeated; will not be credited");
                } else {
                    notes.push("NOTE: " + currentSkill.properties.name + " repeated; will not be credited for DV or CR");
                }
            } else if (count >= 2) {
                currentSkill.shouldNotReceiveDV = true;
                currentSkill.shouldNotReceiveCR = true;
                currentSkill.shouldNotReceiveCV = true;
                notes.push("NOTE: " + currentSkill.properties.name + " repeated more than once; will not be credited");
            }
        }

        skillsInOrder.push(currentSkill);

        var previousSkill = null;

        if (i >= 1) {
            previousSkill = this.skills[i - 1];
        }        

        if (previousSkill) {
            if (result.fulfillsCR1 == false && 
                previousSkill.shouldNotReceiveCR == false &&
                currentSkill.shouldNotReceiveCR == false &&
                (previousSkill.properties.cat == "Leaps" || previousSkill.properties.cat == "Hops") &&
                (currentSkill.properties.cat == "Leaps" || currentSkill.properties.cat == "Hops") &&
                (previousSkill.properties.hits180 == true || currentSkill.properties.hits180 == true)) {
                    result.fulfillsCR1 = true;
            }

            if (previousSkill.shouldNotReceiveCV == false && currentSkill.shouldNotReceiveCV == false) {
                var first = previousSkill.properties.numVal;
                var second = currentSkill.properties.numVal;
        
                if (currentSkill.connected == "directly") {
                    if (first >= 5 || second >= 5) {
                        this.connectionValue += 2; // A + E
                    } else if (first >= 4 || second >= 4) {
                        if (first >= 4 && second >= 3) {
                            this.connectionValue += 2; // C + D
                        } else if (first >= 3 && second >= 4) {
                            this.connectionValue += 2; // C + D
                        } else {
                            this.connectionValue += 1; // A + D
                        }
                    } else if (first >= 3 && second >= 3) {
                        this.connectionValue += 1; // C + C
                    }
                } 
                
                else if (currentSkill.connected == "indirectly") {
                    if (i >= 2) {
                        if (first >= 5 || second >= 5) {
                            this.connectionValue += 2; // A + A + E
                        } else if (first >= 4 || second >= 4) {
                            this.connectionValue += 1; // A + A + D
                        }
                    } else {
                        if (first >= 4 && second >= 4) {
                            this.connectionValue += 2; // D + D
                        } else if ((first >= 5 && second >= 3) || (first >= 3 && second >= 5)) {
                            this.connectionValue += 2; // C + E
                        } else if ((first >= 2 && second >= 4) || (first >= 4 && second >= 2)) {
                            this.connectionValue += 1; // B/C + D
                        }
                    }
                } 
                
                else {
                    if (previousSkill.properties.acro == true && currentSkill.properties.acro == false) {
                        if (first >= 5 && second >= 1) {
                            this.connectionValue += 1; // E + A
                        } else if (first >= 4 && second >= 2) {
                            this.connectionValue += 1; // D + B
                        }
                    } else if (previousSkill.properties.cat == "Turns" && currentSkill.properties.cat == "Turns") {
                        if (first >= 2 && second >= 2) {
                            this.connectionValue += 1; // B + B (no step), D + B
                        }
                    }
                }
            }
        }
    }

    result.CV = this.connectionValue;
    return result;
}

/* Function to push a skill on the top of the stack.
 * Params: the skill to push
 */

FloorStack.prototype.pushSkill = function(skill) {
    this.skills.push(skill);
}

/* Function to remove the skill on the top of the stack.
 * Returns: the removed skill
 */

FloorStack.prototype.popSkill = function() {
    return this.skills.pop();
}

/* Helper function that returns the number of stacks in the routine.
 * Returns: the number of stacks
 */

FloorRoutine.prototype.numStacks = function() {
    return this.stacks.length;
}

/* Helper function that determines the actual index (in the array of stacks) of a particular stack.
 * This function is needed because the stack's ID might not always match its index in the stacks array, due to removal of stacks.
 * Params: the stack's ID
 * Returns: the actual index of the stack in the stacks array
 */

FloorRoutine.prototype.getStackIndex = function(index) {
    for (var i = 0; i < this.stacks.length; i++) {
        if (this.stacks[i].index == index) {
            return i;
        }
    }
}

/* Function to add an entirely new skill (not connected) to the routine.
 * Creates and adds a new stack, adds the skill to the list of all skills sorted by difficulty value, and updates the D-Score of the routine.
 * Params: the skill to add
 * Post: the stacks array, the array of all skills sorted by difficulty value, and the D-Score are all updated
 */

FloorRoutine.prototype.addSkill = function(skill) {
    var newStack = new FloorStack(id);
    newStack.pushSkill(skill);
    this.stacks.push(newStack);

    this.all.push(skill);
    sortSkills(this.all);

    updateScore();
}

/* Function to add a connected skill to an existing stack in the routine.
 * Adds the skill to the correct stack, adds the skill to the list of all skills sorted by difficulty value, and updates the D-Score of the routine.
 * Params: the skill to add, the index of the stack to add to
 * Post: the stack, the array of all skills sorted by difficulty value, and the D-Score are all updated
 */

FloorRoutine.prototype.addConnectedSkill = function(skill, stackIndex) {
    this.stacks[stackIndex].pushSkill(skill);

    this.all.push(skill);
    sortSkills(this.all);

    updateScore();
}

/* Function to remove a skill from an existing stack in the routine.
 * Removes the skill from the correct stack, removges the skill from the list of all skills sorted by difficulty value, and updates the D-Score of the routine.
 * Params: the index of the stack to remove from
 * Post: the stack, the array of all skills sorted by difficulty value, and the D-Score are all updated
 */

FloorRoutine.prototype.removeSkill = function(stackIndex) {
    var skill = this.stacks[stackIndex].popSkill();

    let indexInAll = findSkill(skill, this.all);
    if (indexInAll >= 0) { // should always evaluate to true
        this.all.splice(indexInAll, 1);
    }

    updateScore();
}

/* Function to remove an entire stack of skills from the routine
 * Removes each skill in the chosen stack from the stack and  from the list of all skills sorted by difficulty value.
 * Params: the index of the stack to remove
 * Post: the stacks array, the array of all skills sorted by difficulty value, and the D-Score are all updated
 */

FloorRoutine.prototype.removeStack = function(stackIndex) {
    let numSkills = this.stacks[stackIndex].skills.length;

    for (var i = 0; i < numSkills; i++) {
        var skill = this.stacks[stackIndex].popSkill();

        let indexInAll = findSkill(skill, this.all);
        if (indexInAll >= 0) { // should always evaluate to true
            this.all.splice(indexInAll, 1);
        }
    }

    this.stacks.splice(stackIndex, 1);

    updateScore();
}

/* Helper function to determine if a routine is blank
 * Returns: true if the routine is blank, false otherwise
 */

FloorRoutine.prototype.isBlank = function() {
    if (this.stacks.length <= 0) {
        return true;
    } else {
        return false;
    }
}

/* Calculates the D-Score of the routine. Should be called every time a skill is added or removed from the routine.
 * Each time the D-Score is calculated, it is calculated from zero; all previous calculations and/or details are erased.
 * Post: all prior determinations of credit are reset. The list of skills in order, list of acro lines, and list of notes are all reset.
 * Returns: an object containing the details of the D-Score - the difficulty values (both acro and dance), the total CV, and the total CR.
 */

FloorRoutine.prototype.calculate = function() {
    var totalCount = 0;
    var acroCount = 0;
    var acroString = "Acro: ";
    var danceCount = 0;
    var danceString = "Dance: ";
    
    var totalDV = 0;
    var acroDV = 0;
    var danceDV = 0;
    
    var CR = [ false, false, false, false ];
    var fwd = false;
    var bwd = false;
    
    var totalCV = 0;

    // Reset
    skillsInOrder = [];
    notes = [];
    acroLines = [];

    // Iterate through each stack first to determine whether each skill receives credit or not.
    this.stacks.forEach(stack => {
        var stackValue = stack.analyze();
        totalCV += stackValue.CV;

        if (CR[0] == false && stackValue.fulfillsCR1 == true) {
            CR[0] = true;
        }
    });

    var dismount = null;

    if (acroLines.length >= 2) {
        let indexOfDismountLine = acroLines[acroLines.length - 1];
        let stackIndexOfDismountLine = this.getStackIndex(indexOfDismountLine);
        let dismountLine = this.stacks[stackIndexOfDismountLine];

        dismountLine.skills.forEach(skill => {
            if (skill.properties.acro == true && skill.properties.isAerial == false && skill.shouldNotReceiveDV == false) {
                if (!dismount || skill.properties.numVal > dismount.properties.numVal) {
                    dismount = skill;
                }
            }
        });
    }

    var dismountString = "Dismount: ";
    if (dismount != null) {
        dismountString += dismount.properties.alphaVal;
    }

    // Then, iterate through all skills sorted by value
    this.all.forEach(skill => {
        if (totalCount < 7 && !skill.shouldNotReceiveDV && skill != dismount) {
            if (skill.properties.acro == true && acroCount < 4) {
                acroDV += skill.properties.numVal;
                acroString += skill.properties.alphaVal + " ";
                acroCount++;
            } else if (skill.properties.acro == false && danceCount < 5) {
                danceDV += skill.properties.numVal;
                danceString += skill.properties.alphaVal + " ";
                danceCount++;
            }
            totalCount++;
        }
    
        if (!skill.shouldNotReceiveCR) {
            if (CR[1] == false && skill.properties.hasFullTwist == true) {
                CR[1] = true;
            }

            if (CR[2] == false && skill.properties.isDoubleSalto == true) {
                CR[2] = true;
            }
    
            if (CR[3] == false) {
                if (fwd == false && skill.properties.cat == "Forward Saltos" && skill.properties.isAerial == false) {
                    fwd = true;
                }
    
                if (bwd == false && skill.properties.cat == "Backward Saltos" && skill.properties.isAerial == false) {
                    bwd = true;
                }
    
                if (fwd == true && bwd == true) {
                    CR[3] = true;
                }
            }
        }
    });
    
    
    totalDV = acroDV + danceDV;
    if (!dismount) {
        notes.push("NOTE: Routine has no dismount; will incur a 0.5 deduction from the final score");
    } else {
        totalDV += dismount.properties.numVal;
    }
    
    var totalCR = 0;
    
    CR.forEach(requirement => {
        if (requirement == true) {
            totalCR += 5;
        }
    });
    
    return {
        "DV": totalDV,
        "acroValues": acroString,
        "danceValues": danceString,
        "dismount": dismountString,
        "CV": totalCV,
        "CR": totalCR,
    };
}

// Routine created when page is loaded
var routine = new FloorRoutine();

// CODE FOR UPDATING PAGE

// Add functionality of "Add Skill" button
document.getElementById("addSkill").addEventListener("click", function(event) {
    buildCatTable(null);
    event.preventDefault();
});

// Add functionality of "Start Over" button
document.getElementById("restart").addEventListener("click", function(event) {
    var choice = confirm("Are you sure you want to start over?");

    if (choice == true) {
        // Reset
        id = 0;
        routine = new FloorRoutine();
        acroLines = [];
    
        // Remove stacks from display
        var skills = document.getElementById("skills");
        while (skills.firstChild) {
            skills.removeChild(skills.firstChild);
        }
    
        // Reset score display
        document.getElementById("scoreTotal").textContent = "0.0";
        document.getElementById("acroDV").textContent = "";
        document.getElementById("danceDV").textContent = "";
        document.getElementById("dismountDV").textContent = "";
        document.getElementById("scoreCR").textContent = "";
        document.getElementById("scoreCV").textContent = "";
        document.getElementById("scoreNotes").textContent = "";

        updateButtons();
    }

    event.preventDefault();
});

/* Function to display new row of skills. Increments ID.
 * Params: the properties of the first skill of the new row
 * Post: ID is incremented
 */

function writeStack(skillProps) {
    var stackIndex = id;
    var stackDiv = document.createElement("div");
    stackDiv.setAttribute("class", "stack");

    var deleteButton = document.createElement("button");
    deleteButton.textContent = "\u24CD";
    deleteButton.setAttribute("class", "delStack");
    deleteButton.setAttribute("id", "del" + stackIndex);
    stackDiv.appendChild(deleteButton);

    var stackText = document.createElement("span");
    if (skillProps.nickname) {
        stackText.textContent += skillProps.nickname;
    } else {
        stackText.textContent += skillProps.name;
    }
    stackText.textContent += " (" + skillProps.alphaVal + ")";
    stackDiv.appendChild(stackText);

    var popButton = document.createElement("button");
    popButton.textContent = "\u232B";
    popButton.setAttribute("class", "popStack");
    popButton.setAttribute("id", "pop" + stackIndex);
    stackDiv.appendChild(popButton);

    var addButton = document.createElement("button");
    addButton.textContent = "\uFF0B";
    addButton.setAttribute("class", "addStack");
    addButton.setAttribute("id", "add" + stackIndex);
    stackDiv.appendChild(addButton);
    document.getElementById("skills").appendChild(stackDiv);

    id++;
}

/* Function to update existing row of skills. To called any time a stack is added to or removed from.
 * Params: the index of the stack to display
 */

function rewriteStack(stackIndex) {
    var stackDiv = document.getElementById("skills").children[stackIndex];
    var stackText = stackDiv.children[1];
    stackText.textContent = "";
    var skills = routine.stacks[stackIndex].skills;
    
    for (var i = 0; i < skills.length; i++) {
        if (i > 0) {
            stackText.textContent += " + ";
        }

        if (skills[i].properties.nickname) {
            stackText.textContent += skills[i].properties.nickname;
        } else {
            stackText.textContent += skills[i].properties.name;
        }
        stackText.textContent += " (" + skills[i].properties.alphaVal + ")";
    }

    // If the stack earns connection value, display that as well
    if (routine.stacks[stackIndex].connectionValue >= 1) {
        stackText.textContent += " [" + convertToDouble(routine.stacks[stackIndex].connectionValue) + "]";
    }
}

/* Function to remove existing row of skills. To called any time an entire stack is removed.
 * Params: the index of the stack to remove from the display
 */

function deleteStack(stackIndex) {
    var stackDivToDelete = document.getElementById("skills").children[stackIndex];
    document.getElementById("skills").removeChild(stackDivToDelete);
}

// Add functionality to add, pop, and delete buttons for each row of skills.
// Sources referenced: https://davidwalsh.name/event-delegate
document.getElementById("skills").addEventListener("click", function(event) {
    if (event.target && event.target.nodeName == "BUTTON") {
        var idString = event.target.id;
        var index = idString.substring(3, idString.length);
        var stackIndex = routine.getStackIndex(index);  

        if (event.target.className == "addStack") {        
            buildCatTable(stackIndex);
        } else if (event.target.className == "popStack") {
            var choice = confirm("Are you sure you want to delete?");
            if (choice == true) {
                var stack = routine.stacks[stackIndex];
                if (stack.skills.length <= 1) {
                    deleteStack(stackIndex);
                    routine.removeStack(stackIndex);
                } else {
                    routine.removeSkill(stackIndex);
                    rewriteStack(stackIndex);
                    updateButtons();
                }    
            }
        } else if (event.target.className == "delStack") {
            var choice = confirm("Are you sure you want to delete?");
            if (choice == true) {
                deleteStack(stackIndex);
                routine.removeStack(stackIndex);
                updateButtons();
            }
        }        
    }
    event.preventDefault();
});

// Stack of views to be displayed in right pane/view container
var viewStack = [];

/* Function to push a new view onto the view stack and display it.
 * Params: the new view to push
 * Post: the view stack is updated, certain buttons are disabled
 * Sources referenced: https://www.w3schools.com/jsref/prop_pushbutton_disabled.asp
 */

function pushView(newView) {
    if (viewStack.length == 0) {
        // Add navigation buttons
        var backButton = document.createElement("button");
        backButton.className += "mainButton";
        backButton.setAttribute("id", "backButton");
        backButton.textContent = "< Back";
        document.getElementById("viewNav").appendChild(backButton);

        backButton.addEventListener("click", function(event) {
            popView();
            event.preventDefault();
        });

        var cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.className += "mainButton";
        cancelButton.setAttribute("id", "cancelButton");
        document.getElementById("viewNav").appendChild(cancelButton);

        cancelButton.addEventListener("click", function(event) {
            unwindAllViews();
            event.preventDefault();
        });
    }
    
    var container = document.getElementById("viewContainer");
    var currentView = container.firstElementChild;
    viewStack.push(currentView);
    container.removeChild(currentView);
    container.appendChild(newView);

    // Disable all buttons except for navigation buttons
    var buttons = document.getElementsByTagName("button");
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].id != "backButton" && buttons[i].id != "cancelButton") {
            buttons[i].disabled = true;
        }
    }    
}

/* Function to pop a view off of the view stack and display the previous view.
 * Post: the view stack is updated, certain buttons are enabled/disabled
 */

function popView() {
    if (viewStack.length > 0) {
        var newView = viewStack.pop();
        var container = document.getElementById("viewContainer");
        var currentView = container.firstElementChild;
        container.removeChild(currentView);
        container.appendChild(newView);

        if (viewStack.length == 0) {
            var nav = document.getElementById("viewNav");
            while (nav.firstChild) {
                nav.removeChild(nav.firstChild);
            }

            updateButtons();
        }
    }
}

/* Function to unwind all views off of the view stack and return the page to its state upon load.
 * Post: the view stack is updated, certain buttons are enabled/disabled
 */

function unwindAllViews() {
    if (viewStack.length > 0) {
        var endingView;
        while (viewStack.length > 0) {
            endingView = viewStack.pop();
        }
        var container = document.getElementById("viewContainer");
        var currentView = container.firstElementChild;
        container.removeChild(currentView);
        container.appendChild(endingView);

        if (viewStack.length == 0) {
            var nav = document.getElementById("viewNav");
            while (nav.firstChild) {
                nav.removeChild(nav.firstChild);
            }
        }
    }

    updateButtons();
}

/* Function that builds the table of categories available to the user, depending on whether a new or connected skill is being added.
 * Params: the index of the stack being added to, if any. If null, new stack is being created.
 * Post: the view stack is updated
 * Sources referenced: https://davidwalsh.name/event-delegate
 */

function buildCatTable(stackIndex) {
    var categories = [ "Leaps", "Hops", "Jumps", "Turns", "Forward Saltos", "Backward Saltos" ];

    var table = document.createElement("table");
    table.className += "interactiveTable";
    var previousCat = null;
    
    if (stackIndex != null) {
        previousCat = routine.stacks[stackIndex].top().properties.cat;
    }

    if (previousCat) {
        switch (previousCat) {
            case "Leaps":
            case "Hops":
                categories = ["Leaps", "Hops", "Jumps"];
                break;
            case "Jumps":
                categories = ["Jumps"];
                break;
            case "Turns":
                categories = ["Jumps", "Turns"];
                break;
            case "Forward Saltos":
            case "Backward Saltos":                
                categories = ["Jumps", "Forward Saltos", "Backward Saltos"];
                break;
            default:
                break;
        }
    }
    
    categories.forEach(category => {
        var row = document.createElement("tr");
        var cell = document.createElement("td");
        cell.className = "interactiveCell";
        cell.textContent = category;
        row.appendChild(cell);
        table.appendChild(row);
    });

    // Add click functionality to each category.
    // Sources referenced: https://davidwalsh.name/event-delegate
    table.addEventListener("click", function(event) {
        if (event.target && event.target.nodeName == "TD") {
            buildSkillTable(event.target.textContent, stackIndex);
        }
    })

    pushView(table);
}

/* Function that builds the table of skills available for the user to choose from.
 * Params: the category of skills to fetch, the index of the stack being added to (if any)
 * Post: the view stack is updated
 * Sources referenced: https://davidwalsh.name/event-delegate
 */

function buildSkillTable(category, stackIndex) {
    // Fetch skills from database
    var req = new XMLHttpRequest();
    var body = { "cat": category };
    req.open('POST', '/floor', true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.addEventListener('load', function() {
        if (req.status >= 200 && req.status < 400) {
            var skills = JSON.parse(req.responseText);
            var table = document.createElement("table");
            table.className += "interactiveTable";
        
            skills.forEach(skill => {
                var row = document.createElement("tr");
                var cell = document.createElement("td");
                cell.className = "interactiveCell";
                cell.setAttribute("id", skill.id);
        
                if (skill.nickname) {
                    cell.textContent += skill.nickname + " - ";
                }
                cell.textContent += skill.name + " (" + skill.alphaVal + ")"/* + skill.description*/;
        
                row.appendChild(cell);
                table.appendChild(row);
            });
        
            // Add click functionality to each skill cell.
            // Sources referenced: https://davidwalsh.name/event-delegate
            table.addEventListener("click", function(event) {
                if (event.target && event.target.nodeName == "TD") {
                    var skill;

                    // Get ID of skill to add
                    skills.forEach(s => {
                        if (s.id == event.target.id) {
                            skill = s;
                        }
                    });

                    if (stackIndex != null) {
                        var previous = routine.stacks[stackIndex].top();

                        if (skill.acro == true && previous.properties.acro == true) {
                            promptForConnectionType(skill, stackIndex);
                        } else {
                            routine.addConnectedSkill(new FloorSkill(skill, null), stackIndex);
                            rewriteStack(stackIndex);
                            unwindAllViews();
                        }
                    } else {
                        routine.addSkill(new FloorSkill(skill, null));
                        writeStack(skill);
                        unwindAllViews();
                    }
                }
            });

            pushView(table);
        } else {
            console.log("Error in network request: " + req.statusText);
        }
    });
    req.send(JSON.stringify(body));
}

/* If both skills in a new connection are acro, the user must be prompted for the type of the connection (indirect or direct).
 * Function builds this prompt and pushes the view.
 * Params: the skill being connected, the index of the stack being added to (if any)
 * Post: the view stack is updated
 * Sources referenced: https://davidwalsh.name/event-delegate
 */

function promptForConnectionType(skill, stackIndex) {
    var container = document.createElement("div");

    var prompt = document.createElement("h3");
    prompt.textContent = "Is your connection indirect or direct?";
    container.appendChild(prompt);

    var explanation = document.createElement("p");
    explanation.textContent = "Indirect connections contain hand-support elements (e.g. round-off, back handpsring, etc.) performed between saltos. Direct connections do not.";
    container.appendChild(explanation);
 
    var choices = document.createElement("table");
    choices.className += "interactiveTable";

    var indirectRow = document.createElement("tr");
    var indirectCell = document.createElement("td");
    indirectCell.className += "interactiveCell";
    indirectCell.setAttribute("id", "indirect");
    indirectCell.textContent = "Indirect";
    indirectRow.appendChild(indirectCell);
    choices.appendChild(indirectRow);

    var directRow = document.createElement("tr");
    var directCell = document.createElement("td");
    directCell.className += "interactiveCell";
    directCell.setAttribute("id", "direct");
    directCell.textContent = "Direct";
    directRow.appendChild(directCell);
    choices.appendChild(directRow);

    // Add click functionality to each skill cell.
    // Sources referenced: https://davidwalsh.name/event-delegate
    choices.addEventListener("click", function(event) {
        if (event.target && event.target.nodeName == "TD") {
            if (event.target.id == "indirect") {
                routine.addConnectedSkill(new FloorSkill(skill, "indirectly"), stackIndex);
            } else if (event.target.id == "direct") {
                routine.addConnectedSkill(new FloorSkill(skill, "directly"), stackIndex);
            }
            rewriteStack(stackIndex);
            unwindAllViews();
        }
    });

    container.appendChild(choices);
    pushView(container);
}

/* Function that enables or disables the buttons on the page, depending on whether or not the functionality should be available to the user.
 * Post: certain buttons are enabled or disabled
 */

function updateButtons() {
    var buttons = document.getElementsByTagName("button");

    for (var i = 0; i < buttons.length; i++) {
        var currentButton = buttons[i];

        if (currentButton.className == "addStack") {
            var index = currentButton.id.substring(3, id.length);
            var stackIndex = routine.getStackIndex(index);
            if (routine.stacks[stackIndex].top().properties.canConnect == false) {
                currentButton.disabled = true;
            } else {
                currentButton.disabled = false;
            }
        } else {
            currentButton.disabled = false;
        }
    }
}

/* Function that calculates the routine's D-Score and displays the details of the score to the user.
 * Each time the D-Score is calculated, it is calculated from zero; all previous calculations and/or details are erased.
 * Post: the score display is updated. All prior determinations of credit are reset. The list of skills in order, roots object, and list of notes are all reset.
 */

function updateScore() {
    var details = routine.calculate();
    document.getElementById("scoreTotal").textContent = convertToDouble(details.DV + details.CV + details.CR);

    document.getElementById("acroDV").textContent = details.acroValues;
    document.getElementById("danceDV").textContent = details.danceValues;
    document.getElementById("dismountDV").textContent = details.dismount;
    
    document.getElementById("scoreCV").textContent = "CV: " + convertToDouble(details.CV);
    document.getElementById("scoreCR").textContent = "CR: " + convertToDouble(details.CR);
    
    document.getElementById("scoreNotes").textContent = "";
    notes.forEach(note => {
        document.getElementById("scoreNotes").textContent += note + "\r\n";
    });
}