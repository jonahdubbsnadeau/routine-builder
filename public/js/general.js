/* File: general.js
 * Author: Jonah Dubbs-Nadeau
 * Description: Contains general functions utilized by each appratus application.
 * Sources referenced:
 * https://www.w3schools.com/howto/howto_js_collapsible.asp
 * https://en.wikipedia.org/wiki/Quicksort
 * https://stackoverflow.com/questions/1726630/formatting-a-number-with-exactly-two-decimals-in-javascript
 */

/* Helper code for implementing the collapsible score details.
 * Sources referenced: https://www.w3schools.com/howto/howto_js_collapsible.asp
 */

var collapsible = document.getElementsByClassName("collapsible");

for (var i = 0; i < collapsible.length; i++) {
    collapsible[i].addEventListener("click", function() {
        this.classList.toggle("activeIcon");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
}

/* Function for searching an array for a particular skill.
 * Params: the target skill, the array to search
 * Returns: the index of the target skill if it is found, otherwise -1
 */

function findSkill(target, array) {
    for (var i = 0; i < array.length; i++) {
        if (target.properties.id == array[i].properties.id) {
            return i;
        }
    }
    return -1;
}

/* Function that returns how many times a particular skill appears in an array.
 * Skills with different ID's are considered the same if they are designated as such in the Code of Points.
 * Params: the target skill, the array to search
 * Returns: the count of the instances of the target skill
 */

function skillCount(target, array) {
    var count = 0;

    for (var i = 0; i < array.length; i++) {
        if (target.properties.id == array[i].properties.id) {
            count++;
        } else if (target.properties.receivesCreditOnce != undefined &&
                   target.properties.receivesCreditOnce != null && 
                   target.properties.receivesCreditOnce == true &&
                   target.properties.code == array[i].properties.code) {
                       count++;
        }
    }
    
    return count;
}

/* Function that sorts an array of skills in descending order by difficulty value.
 * Params: the array to sort
 * Post: the array is sorted
 */

function sortSkills(array) {
    quickSort(skillComparator, array, 0, array.length - 1);
}

/* Function that implements the quick sort algorithm to sort an array.
 * Params: a comparator function, the array to sort, the first index, the last index
 * Post: the array is sorted
 * Sources referenced: https://en.wikipedia.org/wiki/Quicksort
 */

function quickSort(comparator, array, first, last) {
    if (first < last) {
        var p = partition(comparator, array, first, last);
        quickSort(comparator, array, first, p - 1);
        quickSort(comparator, array, p + 1, last);
    }
}

/* Helper function for the quick sort algorithm.
 * Params: a comparator function, the array to sort, the first index, the last index
 * Sources referenced: https://en.wikipedia.org/wiki/Quicksort
 */

function partition(comparator, array, start, end) {
    var pivot = array[end];
    var i = start;
    var temp;

    for (var j = start; j <= end; j++) {
        var greater = comparator(array[j], pivot);
        if (greater) {
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
            i++;
        }
    }

    temp = array[i];
    array[i] = array[end];
    array[end] = temp;

    return i;
}

/* Helper comparator function that compares two skills by their difficulty value.
 * Params: the first skill to compare, the second skill to compare
 * Returns: true if the first skill has a greater difficulty value than the second, otherwise false
 */

function skillComparator(skill1, skill2){
    if (skill1.properties.numVal > skill2.properties.numVal){
        return true;
    } else {
        return false;
    }
}

/* Helper function that converts an integer value to its proper double representation.
 * Params: the integer value to convert
 * Returns: the same value divided by 10 (extended to one decimal place only)
 * Sources referenced: https://stackoverflow.com/questions/1726630/formatting-a-number-with-exactly-two-decimals-in-javascript
 */

function convertToDouble(value) {
    var converted = value / 10.0;
    return converted.toFixed(1);
}