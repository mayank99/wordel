export function getEmojiGrid(guesses: string[], answer: string, gameNumber: number) {
  const didWin = guesses[guesses.length - 1] === answer;
  const emojis = guesses
    .map((guess) => {
      if (guess === answer) return '🟩🟩🟩🟩🟩';
      return [...guess]
        .map((letter, i) => (letter === answer[i] ? '🟩' : isLetterMisplaced(guess, answer, i) ? '🟨' : '⬛'))
        .join('');
    })
    .join('\n');
  return `wordel ${gameNumber} ${didWin ? guesses.length : 'X'}/6\n${emojis}`;
}

export function getAltText(guesses: string[], answer: string, gameNumber: number) {
  const didWin = guesses[guesses.length - 1] === answer;
  const lines = guesses.map((guess, index) => {
    if (guess === answer) {
      return `Line ${index + 1}: Won!`;
    }
    const correctLetters = [];
    const misplacedLetters = [];
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === answer[i]) {
        correctLetters.push(`${ordinalNumber(i + 1)}`);
      } else if (isLetterMisplaced(guess, answer, i)) {
        misplacedLetters.push(`${ordinalNumber(i + 1)}`);
      }
    }
    const describedLetters = `${correctLetters.length > 0 ? `${joinWithAnd(correctLetters)} correct. ` : ''}${
      misplacedLetters.length > 0 ? `${joinWithAnd(misplacedLetters)} misplaced.` : ''
    }`;
    return `Line ${index + 1}: ${describedLetters || 'All incorrect.'}`;
  });
  return `wordel ${gameNumber}: ${didWin ? guesses.length : 'X'}/6.\n${lines.join('\n')}`;
}

function ordinalNumber(i: number) {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const remainder = i % 100;
  const ordinal = suffix[(remainder - 20) % 10] || suffix[remainder] || suffix[0];
  return `${i}${ordinal}`;
}

function joinWithAnd(words: string[]) {
  if (words.length === 1) {
    return words[0];
  }
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function isLetterMisplaced(guess: string, answer: string, index: number) {
  const letter = guess[index];
  if (letter === answer[index]) return false; // this should already have been checked

  const isDuplicateLetter = [...guess].filter((l) => l === letter).length > 1;
  const answerHasMultiple = [...answer].filter((l) => l === letter).length > 1;

  return answer.includes(letter) && (!isDuplicateLetter || answerHasMultiple);
}
