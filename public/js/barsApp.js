/* File: barsApp.js
 * Author: Jonah Dubbs-Nadeau
 * Description: Contains all of the functionality specific to the Bars application.
 * Sources referenced:
 * https://davidwalsh.name/event-delegate
 * https://www.w3schools.com/jsref/prop_pushbutton_disabled.asp
 */

 // Code to keep Bars link active
document.getElementById("barsLink").classList.toggle("activeLink");

// CODE FOR BAR ROUTINE

var id = 0; // unique identifier for each skill stack; incremented every time a new stack is created
var currentBar = null;
var currentlyFacing = null;
var skillsInOrder = [];
var notes = [];

/* Function that returns the bar (low or high) that the gymnast will be on following execution of a particular skill.
 * Params: the bar the gymnast is currently on, the skill to execute
 * Returns: the bar (low or high) that the gymnast will be on following execution of the skill
 */

function updateBar(currentBar, skill) {
    if (!currentBar) {
        return skill.properties.endsOn;
    } else if (skill.properties.endsOn == "other") {
        if (currentBar == "high") {
            return "low";
        } else {
            return "high";
        }
    } else {
        return currentBar;
    }
}

/* Function that returns the bar (low or high) that the gymnast will be facing following execution of a particular skill.
 * Params: the bar the gymnast is currently facing, the skill to execute
 * Returns: the bar (low or high) that the gymnast will be facing following execution of the skill
 */

function updateFacing(currentlyFacing, skill) {
    if (!currentlyFacing) {
        return skill.properties.endsFacing;
    } else if (skill.properties.endsFacing == "other") {
        if (currentlyFacing == "high") {
            return "low";
        } else {
            return "high";
        }
    } else {
        return currentlyFacing;
    }
}

// Count of skills in the routine that start from the same root.
// Reset each time a skill is added or removed and the new D-Score is calculated.
var roots = {
    "Clear hip bwd": 0,
    "Clear hip fwd": 0,
    "Stalder bwd"  : 0,
    "Stalder fwd"  : 0,
    "Inbar bwd"    : 0,
    "Inbar fwd"    : 0,
    "Toe-on bwd"   : 0,
    "Toe-on fwd"   : 0
};

function resetRoots() {
    for (var key in roots) {
        roots[key] = 0;
    }
}

/* Constructors for BarRoutine, BarStack, BarSkill */

function BarRoutine() {
    this.stacks = []; // array of BarStacks
    this.all = []; // array of skills
}

function BarStack(index) {
    this.skills = [];
    this.index = index;
    this.connectionValue = 0;
    this.currentGrip = "regular";
    this.beginsOn = currentBar;
    this.currentBar = currentBar;
    this.beginsFacing = currentlyFacing;
    this.currentlyFacing = currentlyFacing;
}

function BarSkill(skillPrototype) {
    this.properties = skillPrototype;
    this.shouldNotReceiveDV = false;
    this.shouldNotReceiveCV = false;
    this.shouldNotReceiveCR = false;
}

/* Function that resets the skill's restrictions. Should be called on each skill every time the new D-Score is calculated.
 * Post: the restrictions on whether or not the skill should receive credit are reset
 */

BarSkill.prototype.reset = function() {
    this.shouldNotReceiveDV = false;
    this.shouldNotReceiveCV = false;
    this.shouldNotReceiveCR = false;
}

/* Helper function that determines whether the skill is considered a "flight element".
 * Returns: true if the skill is a flight element, false otherwise
 */

BarSkill.prototype.hasFlight = function() {
    return (this.properties.cat == "Release Moves" || this.properties.cat == "Transitions");
}

/* Function that gets the top of the skill stack.
 * Returns: the skill at the top of the stack
 */

BarStack.prototype.top = function() {
    return this.skills[this.skills.length - 1];
}

/* Function that determines whether or not a stack is empty.
 * Returns: true if the stack is empty, false otherwise
 */

BarStack.prototype.isEmpty = function() {
    return this.skills.length <= 0;
}

/* Function that analyzes a bar stack to determine what credit it should receive.
 * Each time this function is called, all prior credit calculations or restrictions on credit are reset.
 * Adds each skill in the stack to the list of skills in order and determines if the skill has been repeated and whether or not it should receive credit.
 * Also calculates and returns the total connection value of the stack.
 * Post: the list of skills in order is updated, the roots object is updated, the stack's connection value is reset and updated
 * Returns: the connection value of the stack
 */

BarStack.prototype.analyze = function() {
    this.connectionValue = 0;

    for (var i = 0; i < this.skills.length; i++) {
        var currentSkill = this.skills[i];
        currentSkill.reset();

        let root = currentSkill.properties.root;
        if (roots[root] != undefined && roots[root] != null) {
            if (roots[root] >= 3) {
                currentSkill.shouldNotReceiveDV = true;
                currentSkill.shouldNotReceiveCV = true;
                currentSkill.shouldNotReceiveCR = true;
                notes.push("NOTE: " + currentSkill.properties.name + " will not receive credit because there are already 3 or more skills with the same root");
            }
            roots[root] += 1;
        }

        let count = skillCount(currentSkill, skillsInOrder);

        if (count == 1) {
            currentSkill.shouldNotReceiveDV = true;
            currentSkill.shouldNotReceiveCR = true;
            notes.push("NOTE: " + currentSkill.properties.name + " repeated once; will not be credited for DV or CR");
        } else if (count >= 2) {
            currentSkill.shouldNotReceiveDV = true;
            currentSkill.shouldNotReceiveCR = true;
            currentSkill.shouldNotReceiveCV = true;
            notes.push("NOTE: " + currentSkill.properties.name + " repeated more than once; will not be credited");
        }

        skillsInOrder.push(currentSkill);

        var previousSkill = null;

        if (i >= 1) {
            previousSkill = this.skills[i - 1];
        }

        if (previousSkill && previousSkill.shouldNotReceiveCV == false && currentSkill.shouldNotReceiveCV == false && previousSkill.properties.numVal >= 4) {
            switch (currentSkill.properties.alphaVal) {
                case "C":
                    if (previousSkill.hasFlight() &&
                        this.currentBar == "high" &&
                        currentSkill.properties.endsOn == "same" &&
                        (currentSkill.properties.halfTurn || currentSkill.hasFlight())) {
                            this.connectionValue += 2;
                    }
                    break;
                case "D":
                    if (previousSkill.hasFlight() &&
                        previousSkill.properties.numVal > 4 &&
                        currentSkill.hasFlight()) {
                            this.connectionValue += 2;
                            break;
                    }
        
                    if (previousSkill.hasFlight() &&
                        this.currentBar == "high" &&
                        currentSkill.properties.endsOn == "same" &&
                        (currentSkill.properties.halfTurn || currentSkill.hasFlight())) {
                            this.connectionValue += 2;
                            break;
                    }
        
                    if ((previousSkill.properties.halfTurn || previousSkill.hasFlight()) &&
                        (currentSkill.properties.halfTurn || currentSkill.hasFlight())) {
                            this.connectionValue += 1;
                    }
                    break;
                case "E":
                case "F":
                case "G":
                    if (previousSkill.hasFlight() &&
                        currentSkill.hasFlight()) {
                            this.connectionValue += 2;
                            break;
                    }
        
                    if (previousSkill.hasFlight() &&
                        this.currentBar == "high" &&
                        currentSkill.properties.endsOn == "same" &&
                        (currentSkill.properties.halfTurn || currentSkill.hasFlight())) {
                            this.connectionValue += 2;
                            break;
                    }
        
                    if ((previousSkill.properties.halfTurn || previousSkill.hasFlight()) &&
                        (currentSkill.properties.halfTurn || currentSkill.hasFlight())) {
                        this.connectionValue += 1;
                    }   
                    break;
                default:
                    break;
            }
        }
    }

    return this.connectionValue;
}

/* Function to push a skill on the top of the stack and update the stack's current grip, bar, and facing accordingly.
 * Params: the skill to push
 * Post: the stack's current grip, bar, and facing are updated to the gymnast's state following execution of the skill
 */

BarStack.prototype.pushSkill = function(skill) {
    this.skills.push(skill);
    this.currentGrip = this.top().properties.endGrip;
    this.currentBar = updateBar(this.currentBar, this.top());
    this.currentlyFacing = updateFacing(this.currentlyFacing, this.top());
}

/* Function to remove the skill on the top of the stack and update the stack's current grip, bar, and facing accordingly.
 * Post: the stack's current grip, bar, and facing are updated to the gymnast's state following execution of the skill
 * Returns: the removed skill
 */

BarStack.prototype.popSkill = function() {
    var popped = this.skills.pop();
    if (!this.isEmpty()) {
        this.currentGrip = this.top().properties.endGrip;
        this.currentBar = updateBar(this.currentBar, popped);
        this.currentlyFacing = updateFacing(this.currentlyFacing, popped);
    }
    return popped;
}

/* Helper function that returns the number of stacks in the routine.
 * Returns: the number of stacks
 */

BarRoutine.prototype.numStacks = function() {
    return this.stacks.length;
}

/* Helper function that determines the actual index (in the array of stacks) of a particular stack.
 * This function is needed because the stack's ID might not always match its index in the stacks array, due to removal of stacks.
 * Params: the stack's ID
 * Returns: the actual index of the stack in the stacks array
 */

BarRoutine.prototype.getStackIndex = function(index) {
    for (var i = 0; i < this.stacks.length; i++) {
        if (this.stacks[i].index == index) {
            return i;
        }
    }
}

/* Function to add an entirely new skill (not connected) to the routine.
 * Creates and adds a new stack, adds the skill to the list of all skills sorted by difficulty value, updates the routine's current bar and facing, and updates the D-Score of the routine.
 * Params: the skill to add
 * Post: the stacks array, the array of all skills sorted by difficulty value, the current bar, the bar the gymnast is currently facing, and the D-Score are all updated
 */

BarRoutine.prototype.addSkill = function(skill) {
    var newStack = new BarStack(id);
    newStack.pushSkill(skill);
    this.stacks.push(newStack);

    this.all.push(skill);
    sortSkills(this.all);

    currentBar = updateBar(currentBar, skill);
    currentlyFacing = updateFacing(currentlyFacing, skill);

    updateScore();
}

/* Function to add a connected skill to an existing stack in the routine.
 * Adds the skill to the correct stack, adds the skill to the list of all skills sorted by difficulty value, updates the routine's current bar and facing, and updates the D-Score of the routine.
 * Params: the skill to add, the index of the stack to add to
 * Post: the stack, the array of all skills sorted by difficulty value, the current bar, the bar the gymnast is currently facing, and the D-Score are all updated
 */

BarRoutine.prototype.addConnectedSkill = function(skill, stackIndex) {
    this.stacks[stackIndex].pushSkill(skill);

    if (stackIndex == this.stacks.length - 1) {
        currentBar = updateBar(currentBar, this.stacks[this.stacks.length - 1].top());
        currentlyFacing = updateFacing(currentlyFacing, this.stacks[this.stacks.length - 1].top());
    }

    this.all.push(skill);
    sortSkills(this.all);

    updateScore();
}

/* Function to remove a skill from an existing stack in the routine.
 * Removes the skill from the correct stack, removges the skill from the list of all skills sorted by difficulty value, updates the routine's current bar and facing, and updates the D-Score of the routine.
 * Params: the index of the stack to remove from
 * Post: the stack, the array of all skills sorted by difficulty value, the current bar, the bar the gymnast is currently facing, and the D-Score are all updated
 */

BarRoutine.prototype.removeSkill = function(stackIndex) {
    var skill = this.stacks[stackIndex].popSkill();
    
    let indexInAll = findSkill(skill, this.all);
    if (indexInAll >= 0) { // should always evaluate to true
        this.all.splice(indexInAll, 1);
    }

    // Only update the overall routine's bar and facing if this is the last stack
    if (stackIndex == this.stacks.length - 1) {
        currentBar = updateBar(currentBar, skill);
        currentlyFacing = updateFacing(currentlyFacing, skill);
    }

    updateScore();
}

/* Function to remove an entire stack of skills from the routine
 * Removes each skill in the chosen stack from the stack and  from the list of all skills sorted by difficulty value.
 * Params: the index of the stack to remove
 * Post: the stacks array, the array of all skills sorted by difficulty value, and the D-Score are all updated
 */

BarRoutine.prototype.removeStack = function(stackIndex) {
    let numSkills = this.stacks[stackIndex].skills.length;

    for (var i = 0; i < numSkills; i++) {
        var skill = this.stacks[stackIndex].popSkill();
        
        let indexInAll = findSkill(skill, this.all);
        if (indexInAll >= 0) { // should always evaluate to true
            this.all.splice(indexInAll, 1);
        }

        // Only update the overall routine's bar and facing if this is the last stack
        if (stackIndex == this.stacks.length - 1) {
            currentBar = updateBar(currentBar, skill);
            currentlyFacing = updateFacing(currentlyFacing, skill);
        }
    }

    this.stacks.splice(stackIndex, 1);

    updateScore();
}

/* Helper function to determine if a routine is blank
 * Returns: true if the routine is blank, false otherwise
 */

BarRoutine.prototype.isBlank = function() {
    if (this.stacks.length <= 0) {
        return true;
    } else {
        return false;
    }
}

/* Calculates the D-Score of the routine. Should be called every time a skill is added or removed from the routine.
 * Each time the D-Score is calculated, it is calculated from zero; all previous calculations and/or details are erased.
 * Post: all prior determinations of credit are reset. The list of skills in order, roots object, and list of notes are all reset.
 * Returns: an object containing the details of the D-Score - the difficulty values, the total CV, and the total CR.
 */

BarRoutine.prototype.calculate = function() {
    var dismount = null;
    var DV = 0;
    var valueString = "";
    var count = 0;
    var CR = [ false, false, false, false ];

    // Reset
    skillsInOrder = [];
    notes = [];
    resetRoots();

    var totalCV = 0;

    // Iterate through each stack first to determine whether each skill receives credit or not.
    this.stacks.forEach(stack => {
        if (stack.top().properties.isShaposh == true) {
            notes.push("NOTE: Shaposhnikova with/without 1/1 turn followed by kip; will incur a 0.5 deduction for empty swing");
        }
        totalCV += stack.analyze();
    });

    // Then, iterate through all skills sorted by value
    this.all.forEach(skill => {
        if (skill.properties.cat == "Dismounts" && !skill.shouldNotReceiveDV) {
            dismount = skill;
        } else if (count < 7 && !skill.shouldNotReceiveDV) {
            DV += skill.properties.numVal;
            valueString += skill.properties.alphaVal + " ";
            count++;
        }

        if (!skill.shouldNotReceiveCR) {
            if (CR[0] == false && skill.properties.beginsOn == "high" && skill.properties.endsOn == "other") {
                CR[0] = true;
            }

            if (CR[1] == false && skill.properties.cat == "Release Moves") {
                CR[1] = true;
            }

            if (CR[2] == false &&
                skill.properties.startGrip != skill.properties.endGrip &&
                skill.properties.cat != "Mounts" &&
                skill.properties.cat != "Casts" &&
                skill.properties.cat != "Dismounts") {
                CR[2] = true;
            }

            if (CR[3] == false && skill.properties.fullTurn == true && skill.properties.cat != "Mounts") {
                CR[3] = true;
            }
        }
    });

    if (!dismount) {
        notes.push("NOTE: Routine has no dismount; will incur a 0.5 deduction from the final score");
    } else {
        DV += dismount.properties.numVal;
        valueString += dismount.properties.alphaVal + " ";
    }

    var totalCR = 0;

    CR.forEach(requirement => {
        if (requirement == true) {
            totalCR += 5;
        }
    });

    return {
        "DV": DV,
        "values": valueString,
        "CV": totalCV,
        "CR": totalCR,
    };
}

// Routine created when page is loaded
var routine = new BarRoutine();

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
        // Reset all
        id = 0;
        routine = new BarRoutine();
        currentBar = null;
        currentlyFacing = null;
        resetRoots();

        // Remove stacks from display
        var skills = document.getElementById("skills");
        while (skills.firstChild) {
            skills.removeChild(skills.firstChild);
        }

        // Reset score display
        document.getElementById("scoreTotal").textContent = "0.0";
        document.getElementById("scoreDV").textContent = "";
        document.getElementById("scoreCV").textContent = "";
        document.getElementById("scoreCR").textContent = "";
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
                }
                updateButtons();
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
    var categories = [];
    var stack = routine.stacks[stackIndex];

    if (routine.isBlank()) {
        categories = [ "Mounts" ];
    } else if (stackIndex == null) {
        categories = [ "Casts" ];
    } else if (stack.top().properties.cat == "Mounts") {
        categories = [ "Casts" ];
    } else {
        categories.push("Pirouettes");

        if (stack.currentBar == "high" || stack.currentGrip == "regular") {
            categories.push("Transitions");
        }

        if (stack.currentBar == "high") {
            categories.push("Release Moves");
        }

        if (stackIndex == routine.stacks.length - 1 && (stack.currentBar == "high" || stack.currentGrip == "regular")) {
            categories.push("Dismounts");
        }
    }

    var table = document.createElement("table");
    table.className += "interactiveTable";

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
    var currentStack = null;

    if (stackIndex != null) {
        currentStack = routine.stacks[stackIndex];
    }
    
    var body = { "cat": category };

    if (currentStack) {
        body.grip = currentStack.currentGrip;
        body.bar = currentStack.currentBar;
        body.facing = currentStack.currentlyFacing;
    }
    
    // Fetch skills from database
    var req = new XMLHttpRequest();
    req.open('POST', '/bars', true);
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
                cell.textContent += skill.name + " (" + skill.alphaVal + ")";
        
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
                        routine.addConnectedSkill(new BarSkill(skill), stackIndex);
                        rewriteStack(stackIndex);
                    } else {
                        routine.addSkill(new BarSkill(skill));
                        writeStack(skill);
                    }
               
                    unwindAllViews();
                }
            });

            pushView(table);
        } else {
            console.log("Error in network request: " + req.statusText);
        }
    });
    req.send(JSON.stringify(body));
}

/* Function that enables or disables the buttons on the page, depending on whether or not the functionality should be available to the user.
 * Post: certain buttons are enabled or disabled
 */

function updateButtons() {
    var buttons = document.getElementsByTagName("button");

    for (var i = 0; i < buttons.length; i++) {
        var currentButton = buttons[i];
        if (currentButton.className == "delStack") {
            var index = currentButton.id.substring(3, id.length);
            var stackIndex = routine.getStackIndex(index);
            var currentStack = routine.stacks[stackIndex];

            if (stackIndex == 0) {
                currentButton.disabled = true; // Cannot delete stack containing Mount
            } else {
                var previousStack = null;
                var nextStack = null;

                if (stackIndex > 0) {
                    previousStack = routine.stacks[stackIndex - 1];
                }

                if (stackIndex < routine.numStacks() - 1) {
                    nextStack = routine.stacks[stackIndex + 1];
                }

                if (previousStack && nextStack) {
                    if (previousStack.currentBar != nextStack.beginsOn) {
                        currentButton.disabled = true;
                    } else if (previousStack.currentlyFacing != nextStack.beginsFacing) {
                        currentButton.disabled = true;
                    } else {
                        currentButton.disabled = false;
                    }
                } else {
                    currentButton.disabled = false;
                }
            }

        } else if (currentButton.className == "popStack") {
            var index = currentButton.id.substring(3, id.length);
            var stackIndex = routine.getStackIndex(index);
            var currentStack = routine.stacks[stackIndex];

            if (currentStack.skills.length <= 1) {
                // the whole stack will be deleted upon pop
                if (stackIndex == 0) {
                    currentButton.disabled = true; // Cannot delete stack containing Mount
                } else {
                    var previousStack = null;
                    var nextStack = null;
    
                    if (stackIndex > 0) {
                        previousStack = routine.stacks[stackIndex - 1];
                    }
    
                    if (stackIndex < routine.numStacks() - 1) {
                        nextStack = routine.stacks[stackIndex + 1];
                    }
    
                    if (previousStack && nextStack) {
                        if (previousStack.currentBar != nextStack.beginsOn) {
                            currentButton.disabled = true;
                        } else if (previousStack.currentlyFacing != nextStack.beginsFacing) {
                            currentButton.disabled = true;
                        } else {
                            currentButton.disabled = false;
                        }
                    } else {
                        currentButton.disabled = false;
                    }
                }
            } else {
                var nextStack = null;

                if (stackIndex < routine.numStacks() - 1) {
                    nextStack = routine.stacks[stackIndex + 1];
                }

                if (nextStack) {
                    var barAfterPop;
                    var facingAfterPop;
                    var endsOn = currentStack.top().properties.endsOn;
                    var endsFacing = currentStack.top().properties.endsFacing;

                    if (endsOn == "other" && currentStack.currentBar == "high") {
                        barAfterPop = "low";
                    } else if (endsOn == "other" && currentStack.currentBar == "low") {
                        barAfterPop = "high";
                    } else {
                        barAfterPop = currentStack.currentBar;
                    }

                    if (endsFacing == "other" && currentStack.currentlyFacing == "high") {
                        facingAfterPop = "low";
                    } else if (endsFacing == "other" && currentStack.currentlyFacing == "low") {
                        facingAfterPop = "high";
                    } else {
                        facingAfterPop = currentStack.currentlyFacing;
                    }

                    if (barAfterPop != nextStack.beginsOn) {
                        currentButton.disabled = true;
                    } else if (facingAfterPop != nextStack.beginsFacing) {
                        currentButton.disabled = true;
                    } else {
                        currentButton.disabled = false;
                    }
                } else {
                    currentButton.disabled = false;
                }
            }
        } else if (currentButton.className == "addStack") {
            var index = currentButton.id.substring(3, id.length);
            var stackIndex = routine.getStackIndex(index);
            var currentStack = routine.stacks[stackIndex];

            var nextStack = null;

            if (stackIndex < routine.numStacks() - 1) {
                nextStack = routine.stacks[stackIndex + 1];
            }

            if (nextStack) {
                currentButton.disabled = true;
            } else if (routine.stacks[stackIndex].top().properties.cat == "Dismounts") {
                currentButton.disabled = true;
            } else {
                currentButton.disabled = false;
            }
        } else if (currentButton.id == "addSkill") {
            var stackIndex = routine.numStacks() - 1;

            if (stackIndex >= 0 && routine.stacks[stackIndex].top().properties.cat == "Dismounts") {
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
    document.getElementById("scoreDV").textContent = details.values;
    document.getElementById("scoreCV").textContent = "CV: " + convertToDouble(details.CV);
    document.getElementById("scoreCR").textContent = "CR: " + convertToDouble(details.CR);

    document.getElementById("scoreNotes").textContent = "";
    notes.forEach(note => {
        document.getElementById("scoreNotes").textContent += note + "\r\n";
    });
}