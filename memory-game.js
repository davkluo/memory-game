'use strict';

/** Memory game: find matching pairs of cards and flip both of them. */

const FOUND_MATCH_WAIT_MSECS = 1000;
const COLORS = [
  'red', 'blue', 'green', 'orange', 'purple',
  'red', 'blue', 'green', 'orange', 'purple',
];

const colors = shuffle(COLORS);

createCards(colors);

let cardsRevealed = 0;
let firstCard;
let firstColor;


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

function createCards(colors) {
  const gameBoard = document.getElementById('game');

  for (let color of colors) {
    let newCard = document.createElement('div');
    newCard.className = color;
    newCard.addEventListener('click', handleCardClick);
    gameBoard.appendChild(newCard);
  }
}

/** Flip a card face-up. */

function flipCard(card) {
  cardsRevealed++;
  card.style.backgroundColor = card.className;
}

/** Flip a card face-down. */

function unFlipCard(card) {
  cardsRevealed--;
  card.style.backgroundColor = '';
}

/** Handle clicking on a card: this could be first-card or second-card. */

function handleCardClick(evt) {
  let clickedCard = evt.target;

  // Guard against revealing more than 2 cards at a time
  if (cardsRevealed >= 2) {
    return;
  }

  // Guard against clicking a face-up card
  if (COLORS.indexOf(clickedCard.style.backgroundColor) >= 0) {
    return;
  }

  // Flip over the clicked card and increment the cardsRevealed counter
  flipCard(clickedCard);

  // If it is the first card, save the card and its color and mark firstClick as false
  if (cardsRevealed === 1) {
    firstCard = clickedCard;
    firstColor = clickedCard.className;
  }
  // If it is the second card, compare its color to firstColor and decide
  // if the cards should stay face-up or be flipped face-down
  else if (cardsRevealed === 2) {
    if (clickedCard.className === firstColor) {
      cardsRevealed -= 2;
    } else {
      let firstCardTimer = setTimeout(unFlipCard, FOUND_MATCH_WAIT_MSECS, firstCard);
      let secondCardTimer = setTimeout(unFlipCard, FOUND_MATCH_WAIT_MSECS, clickedCard);
    }

    // Reset flags
    firstCard = undefined;
    firstColor = undefined;
  }
}
