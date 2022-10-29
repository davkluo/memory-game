'use strict';

/** Memory game: find matching pairs of cards and flip both of them. */

const FOUND_MATCH_WAIT_MSECS = 1000;
const COLORS_PER_PATTERN = 2;
let numPairs = 16;

document.addEventListener('DOMContentLoaded', function() {
  loadStartPage();
})

let cardPatterns = shuffle(createPatterns(numPairs));
createCards(cardPatterns);

let cardsRevealed = 0;
let cardsMatched = 0;
let score = 0;
let firstCard;
let firstPattern;

function loadStartPage() {
  let playBtn = document.querySelector('#startPage .play-btn');
  playBtn.addEventListener('click', startGame);
}

function startGame() {
  let startPage = document.getElementById('startPage');
  startPage.style.visibility = 'hidden';
}

/** Randomly generate gradient patterns for the cards (each will appear twice):
 *
 * num - The number of patterns/pairs to generate
 * Returns an array of gradient patterns
 */

function createPatterns(num) {
  // Use a set to ensure we do not end up with duplicate patterns
  let patternSet = new Set();

  // Generate a random gradient direction
  // Generate COLORS_PER_PATTERN number of random colors
  // Generate a string with the gradient direction and colors for the set
  while (patternSet.size < num) {
    let patternStr = Math.floor(Math.random()*360) + 'deg';
    for (let i = 0; i < COLORS_PER_PATTERN; i++) {
      patternStr += ', #' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    }
    patternSet.add(patternStr);
  }

  // Duplicate items in the set and return as an array
  return Array.from(patternSet).reduce(function(acc, next) {
    return acc.concat([next, next])
  }, []);
}

/** Shuffle array items in-place and return shuffled array. */

function shuffle(items) {
  // This algorithm does a "perfect shuffle", where there won't be any
  // statistical bias in the shuffle (many naive attempts to shuffle end up not
  // be a fair shuffle). This is called the Fisher-Yates shuffle algorithm; if
  // you're interested, you can learn about it, but it's not important.

  for (let i = items.length - 1; i > 0; i--) {
    // generate a random index between 0 and i
    let j = Math.floor(Math.random() * i);
    // swap item at i <-> item at j
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

/** Create card for every color in colors (each will appear twice)
 *
 * Each div DOM element will have:
 * - a class with the value of the color
 * - a click event listener for each card to handleCardClick
 */

function createCards(cardPatterns) {
  const gameBoard = document.getElementById('game');

  for (let pattern of cardPatterns) {
    let newCardSpace = document.createElement('div');
    newCardSpace.className = 'card-space';

    let newCard = document.createElement('div');
    newCard.className = 'card';

    let newCardFront = document.createElement('div');
    newCardFront.classList.add('card-face');
    newCardFront.classList.add('card-front');

    let newCardBack = document.createElement('div');
    newCardBack.classList.add('card-face');
    newCardBack.classList.add('card-back');
    newCardBack.style.backgroundImage = `linear-gradient(${pattern})`;

    newCard.appendChild(newCardFront);
    newCard.appendChild(newCardBack);
    newCardSpace.appendChild(newCard);
    newCard.addEventListener('click', handleCardClick);
    gameBoard.appendChild(newCardSpace);
  }
}

/** Flip a card face-up. */

function flipCard(card) {
  cardsRevealed++;
  card.classList.add('flipped-over');
}

/** Flip a card face-down. */

function unFlipCard(card) {
  card.classList.remove('flipped-over');
  card.addEventListener('transitionend', decrementRevealed);
}

function decrementRevealed(evt) {
  evt.target.removeEventListener('transitionend', decrementRevealed);
  cardsRevealed--;
}

function checkForWin(evt) {
  evt.target.removeEventListener('transitionend', checkForWin);
  if (cardsMatched === cardPatterns.length) {
    alert('you win');
  }
}

/** Handle clicking on a card: this could be first-card or second-card. */

function handleCardClick(evt) {
  console.log(cardsRevealed);
  // Guard against revealing more than 2 cards at a time
  if (cardsRevealed >= 2) {
    return;
  }

  // Grab the .card div
  let clickedCard = evt.target;
  while (!clickedCard.classList.contains('card')) {
    clickedCard = clickedCard.parentNode;
  }

  // Guard against clicking a face-up card
  if (clickedCard.classList.contains('flipped-over')) {
    return;
  }

  // Flip over the clicked card and increment the cardsRevealed counter
  flipCard(clickedCard);

  // Grab the .card .card-back div that has the pattern
  let clickedCardBack = clickedCard.querySelector('.card-back');

  // If it is the first card, save the card and its color and mark firstClick as false
  if (cardsRevealed === 1) {
    firstCard = clickedCard;
    firstPattern = clickedCardBack.style.backgroundImage;
  }
  // If it is the second card, compare its color to firstPattern and decide
  // if the cards should stay face-up or be flipped face-down
  else if (cardsRevealed === 2) {
    if (clickedCardBack.style.backgroundImage === firstPattern) {
      cardsRevealed -= 2;
      cardsMatched += 2;
      // Wait for the card flip transition before we check for a win
      clickedCard.addEventListener('transitionend', checkForWin);
    } else {
      let firstCardTimer = setTimeout(unFlipCard, FOUND_MATCH_WAIT_MSECS, firstCard);
      let secondCardTimer = setTimeout(unFlipCard, FOUND_MATCH_WAIT_MSECS, clickedCard);
    }

    // Reset flags
    firstCard = undefined;
    firstPattern = undefined;
  }
}
