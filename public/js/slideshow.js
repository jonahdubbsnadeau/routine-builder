/* File: slideshow.js
 * Author: Jonah Dubbs-Nadeau
 * Description: Contains the implementation of the picture carousel animation/slideshow effect on the home page.
 * Sources referenced: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_slideshow
 */

var images = [
    "url('/images/barsStock.jpeg')",
    "url('/images/beamStock.jpeg')",
    "url('/images/floorStock.jpeg')"
];

// Show the first slide.
var current = 0;
showSlide(current);

// Show the next slide every 5 seconds.
setInterval(function() {
    showSlide(current);
}, 5000);

/* Function for showing a slide of the slideshow.
 * Params: the index of the slide to show
 * Post: the background image of the page is updated and the correct dot icon is made active
 * Sources referenced:  https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_slideshow
 */

function showSlide(index) {
    let slideshow = document.getElementById("slideshow");
    let dots = document.getElementsByClassName("dot");

    // Reset all dots
    for (var i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" activeDot", "");
    }

    // Update the background image and active dot
    slideshow.style.backgroundImage = images[index];
    dots[index].className += " activeDot";

    // Increment current
    current = index;
    current++;
    if (current == images.length) {
        current = 0;
    }
}