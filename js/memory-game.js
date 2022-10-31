'use strict';

/** Memory game: find matching pairs of cards and flip both of them. */

const FOUND_MATCH_WAIT_MSECS = 1000;
const COLORS_PER_PATTERN = 2;
const MIN_CARDS = 8;
const MAX_CARDS = 100;

const startPage = document.getElementById('startPage');
const startBestScoreText = document.getElementById('startBestScore');
const playBtn = document.getElementById('playBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
const subtractCardsBtn = document.getElementById('subtractCardsBtn');
const addCardsBtn = document.getElementById('addCardsBtn');
const numCardsText = document.getElementById('numCards');

const gameBoard = document.getElementById('game');
const currentScoreText = document.getElementById('currentScore');
const gameBestScoreText = document.getElementById('gameBestScore');

const winScreen = document.getElementById('winScreen');
const winMsgText = document.getElementById('winMsg');
const replayBtn = document.getElementById('replayBtn');

let bestScores = {};
let bestScore;
let numPairs = 8; // Default is 16 cards
let score = 0;
let cardsRevealed = 0;
let cardsMatched = 0;
let firstCard;
let firstPattern;

document.addEventListener('DOMContentLoaded', function () {
  loadBestScore();
  loadStartPage();
});

/** Load localStorage data if it exists and update the best score */

function loadBestScore() {
  if (localStorage.getItem('leaderboard')) {
    bestScores = JSON.parse(localStorage.getItem('leaderboard'));
  }
  updateBestScore();
}

/** Update the best score fields based on the localStorage data if available
 *
 * Fills fields with an em-dash if no best score exists
 */

function updateBestScore() {
  if (bestScores[numPairs * 2]) {
    bestScore = bestScores[numPairs * 2];
  } else {
    bestScore = undefined;
  }
  startBestScoreText.innerHTML = bestScore ? bestScore : '&mdash;';
  gameBestScoreText.innerHTML = bestScore ? bestScore : '&mdash;';
}

/** Populate text fields on the start page and add event listeners to elements */

function loadStartPage() {
  numCardsText.innerText = numPairs * 2;
  currentScoreText.innerText = score;
  playBtn.addEventListener('click', startGame);
  settingsBtn.addEventListener('click', toggleSettings);
  subtractCardsBtn.addEventListener('click', changeNumCards);
  addCardsBtn.addEventListener('click', changeNumCards);
}

/** Handler for settings button to show and hide the settings menu */

function toggleSettings(evt) {
  settingsMenu.classList.toggle('menu-hidden');
  settingsBtn.classList.toggle('settings-spin');
}

/** Handler for add/subtract cards buttons to change the number of cards in the game
 * Calls updateBestScore() to update the best score based on the number of cards
 */

function changeNumCards(evt) {
  let prevNumCards = parseInt(numCardsText.innerText);

  if (evt.target.classList.contains('subtract-cards')) {
    numCardsText.innerText = Math.max(prevNumCards - 4, MIN_CARDS);
  } else if (evt.target.classList.contains('add-cards')) {
    numCardsText.innerText = Math.min(prevNumCards + 4, MAX_CARDS);
  }

  numPairs = parseInt(numCardsText.innerText) / 2;
  updateBestScore();
}

/** Start the game by hiding the start page and creating cards */

function startGame() {
  // Disable play button so event can only be triggered once
  playBtn.disabled = true;
  startPage.classList.add('hidden');
  let cardPatterns = shuffle(createPatterns(numPairs));
  createCards(cardPatterns);
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
    let patternStr = Math.floor(Math.random() * 360) + 'deg';
    for (let i = 0; i < COLORS_PER_PATTERN; i++) {
      patternStr += ', #' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }
    patternSet.add(patternStr);
  }

  // Duplicate items in the set and return as an array
  return Array.from(patternSet).reduce(function (acc, next) {
    return acc.concat([next, next]);
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
  for (let pattern of cardPatterns) {
    let newCardSpace = document.createElement('div');
    newCardSpace.className = 'card-space';

    let newCard = document.createElement('div');
    newCard.className = 'card';

    let newCardFront = document.createElement('div');
    newCardFront.classList.add('card-face');
    newCardFront.classList.add('card-front');
    newCardFront.innerHTML = '<i class="fa-solid fa-star"></i>';

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

/** Handle clicking on a card: this could be first-card or second-card. */

function handleCardClick(evt) {
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
    updateScore(score + 1);
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

/** Decrement the number of cards revealed */

function decrementRevealed(evt) {
  evt.target.removeEventListener('transitionend', decrementRevealed);
  cardsRevealed--;
}

/** Update the current score */

function updateScore(num) {
  score = num;
  currentScoreText.innerText = score;
}

/** Check current state for a win condition and trigger win screen if met */

function checkForWin(evt) {
  evt.target.removeEventListener('transitionend', checkForWin);
  if (cardsMatched === numPairs * 2) {
    if (bestScore === undefined || (bestScore && score < bestScore)) {
      bestScore = score;
      storeBestScore();
      winMsgText.innerText = `You got a new best score of ${score}!`;
    } else {
      winMsgText.innerText = `You got a score of ${score}!`;
    }

    //Show win screen
    displayWinScreen();
  }
}

/** Store a new best score in localStorage */

function storeBestScore() {
  bestScores[numPairs * 2] = bestScore;
  localStorage.setItem('leaderboard', JSON.stringify(bestScores));
}

/** Display the win screen with active replay button */

function displayWinScreen() {
  winScreen.classList.add('show');
  replayBtn.addEventListener('click', restartGame);
}

/** Restart the game with the same settings */

function restartGame() {
  // Clear existing board
  while (gameBoard.firstChild) {
    gameBoard.lastChild.remove();
  }

  // Hide the win screen
  winScreen.classList.remove('show');

  // Update best score; reset variables
  loadBestScore();
  updateScore(0);
  cardsRevealed = 0;
  cardsMatched = 0;
  firstCard = undefined;
  firstPattern = undefined;

  // Create a new board
  let cardPatterns = shuffle(createPatterns(numPairs));
  createCards(cardPatterns);
}