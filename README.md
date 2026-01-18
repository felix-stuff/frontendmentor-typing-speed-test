# Frontend Mentor - Typing Speed Test solution

This is a solution to the [Typing Speed Test challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/typing-speed-test). Frontend Mentor challenges help you improve your coding skills by building realistic projects. 

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

## Overview

### The challenge

#### Test Controls

Users should be able to:
- Start a test by clicking the start button or by clicking the passage and typing
- Select a difficulty level (Easy, Medium, Hard) for passages of varying complexity
- Switch between "Timed (60s)" mode and "Passage" mode (timer counts up, no limit)
- Restart at any time to get a new random passage from the selected difficulty

#### Typing Experience

- See real-time WPM, accuracy, and time stats while typing
- See visual feedback showing correct characters (green), errors (red/underlined), and cursor position
- Correct mistakes with backspace (original errors still count against accuracy)

#### Results & Progress

- View results showing WPM, accuracy, and characters (correct/incorrect) after completing a test
- See a "Baseline Established!" message on their first test, setting their personal best
- See a "High Score Smashed!" celebration with confetti when beating their personal best
- Have their personal best persist across sessions via localStorage

#### UI & Responsiveness

- View the optimal layout depending on their device's screen size
- See hover and focus states for all interactive elements

- View the optimal layout for the interface depending on their device's screen size
- See hover and focus states for all interactive elements on the page

Read more in the [challenge brief](./challenge-brief.md).

### Screenshot

![](./typing-speed-test-screenshot.png)

### Links

- Solution URL: [View my solution on Frontend Mentor](https://www.frontendmentor.io/challenges/typing-speed-test)
- Live Site URL: [View my solution Live Site](https://felix-stuff.github.io/frontendmentor-typing-speed-test)

## My process

### Built with

- Semantic HTML5 markup
- Tailwind CSS
- Flexbox
- CSS Grid
- Mobile-first workflow
- Vanilla JS

### What I learned

My focus for this challenge was to stick to Vanilla JS for the complex state handling and UI updates to get more into the challenges and limitations of JavaScript without any Frameworks like React or Vue.
I learned a lot about handling the states with a global game object and also how to simplify things with using a config to gather required UI changes and keep the UI update functions as "dumb" as possible .
Looking at my solution I am sure there's still a lot to improve, but I am happy I made it in time to submit the solution in the [Frontend Mentor Hackathon](https://www.frontendmentor.io/articles/fm30-hackathon-typing-speed-test) just for fun.


Additionally I used Tailwind CSS even if its not the most fitting tool for static HTML / Vanilla JS I wanted to practice the Tailwind syntax and learn about limitations for styling interactive components.

### Continued development

I think about adding a blind mode for non-seeing users and sighted users alike: In this mode the device screen reader reads the passage users need to type in a chunk of a few words limited to a number of characters.
The visible passage should be hidden in this mode and the user cannot correct his typed passage. After the whole passage was typed or the time is up, the user receives a summary of words per minute, accuracy and correct / worng characters ratio like in the regular modes.

## Author

- Frontend Mentor [@felix-stuff](https://www.frontendmentor.io/profile/felix-stuff)


## Acknowledgments

My thanks go out to the Frontend Mentor team for organizing this challenge as part of the [Frontend Mentor Hackathon](https://www.frontendmentor.io/articles/fm30-hackathon-typing-speed-test).
