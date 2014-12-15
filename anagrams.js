var MAX_POOL_SIZE = 12;
var MERCY_LETTER_COUNT = 5;
var FANG_DIFFERENCE = 100;

var dict = {}; //dictionary of valid english words
var hamsterDict = {}; //does not have to be the same as the dictionary of valid words
var anagramMap = {}; //map of sorted letter combinations to words
		     //for use by hamster
var letterTable = []; //stores letters according to frequency
var score = 0;
var hamsterScore = 0;
var alreadyPlayed = {}; //dictionary of words already played
var letterId = 0; //count of all letters played to create unique identifiers
var wordId = 0; //count of all the words on the board to create unique identifiers
		//starts at 1 to account for the word placed initially on the board
var mustPlay = {}; //words that have been altered and must be played before getting new letter
var hamsterPic = 'hamster'; //updated when hamster transforms

// 
// Handles necessary game initialization: loads dictionary and anagram maps,
// establishes sortable letters and words, initializes buttons, gets starting letters
//
$(document).ready(function() {
	$('.inPlay').hide();
    loadDictionary('2of12inf.txt', dict);
    loadAnagramMap('2of12inf.txt', hamsterDict, anagramMap);

    $(':button').button({});
    $('.letter').css('cursor', 'move');
       
    //build the letter frequency table
    buildLetterTable();

    runIntro();
});

//
// Runs the intro animation, calls setUpGame
//
function runIntro() {
	$('#hamster').attr('src', 'images/' +  hamsterPic + 'normal.png');

	var list = ['PAY HOP SHADILY', 'A LADYSHIP HYPO', 'HAPPY HOLIDAYS', ''];  // list of blurbs

	var txt = $('#txtlzr');  // The container in which to render the list

	var options = {
  		duration: 300,          // Time (ms) each blurb will remain on screen
  		rearrangeDuration: 700, // Time (ms) a character takes to reach its position
  		effect: 'slideTop', // Animation effect the characters use to appear
  		hideEffect: 'slideTop',        
  		centered: true           // Centers the text relative to its container
	}

	txt.textualizer(list, options); // textualize it!
	txt.textualizer('start', setTimeout(function(){setUpGame()}, 13500)); // start

	
}


//
// Sets up the pool and starting word, fades in the text and buttons
//
function setUpGame() {
	$('#txtlzr').remove();

	//make the letter pool sortable
	$('#pool').sortable({items: 'td', tolerance: 'pointer', connectWith: $('.connect'), dropOnEmpty: true, opacity: 1, start: function(ui) {
		$('.word').addClass('highlight');
	}, stop: function() {
		$('.word').removeClass('highlight');
	}});

	getStartingWordsAndLetters();
	$('.inPlay').hide();
	$('.inPlay').fadeIn(800);

	setTimeout(function(){$('#hamster').attr('src', 'images/' +  hamsterPic + '.png');}, 2200)
}

//
// Puts the first word slot and opening four letters on the board 
//
function getStartingWordsAndLetters() {
	//make the first word sortable
	makeNewWord();
	makeSortableWord(0);

	//get the starting 4 letters
	for (var i = 0; i < 4; i++) {
		getRandomLetter(false);
	}
}

//
// Makes a word sortable, given the word count number. 
// Assumes this word has already been added to the html
// Also initially disables the Play Word button for this word
//
function makeSortableWord(num) {
	$('#word' + num).sortable({items: 'td', tolerance: 'pointer', dropOnEmpty: true, opacity: 1, start: function () {
		$(this).addClass('highlight');
	}, stop: function() {
		$(this).removeClass('highlight');
	}, update: function() {
		//enable the Play Word button when word is 4 letters long (plus 5th 'none' character)
	       var currWord = $(this).sortable('toArray');
		if (currWord.length == 5) {
			var wordNum = (this.id).substring(4);
			$('#playWord' + wordNum).attr('disabled', false).css('opacity', '1');
		}
	
	       //disallow new letter and add this word to the must play list
	       if (!alreadyPlayed[getWordFromArr(currWord)]) {
			$('#newLetter').attr('disabled', true).css('opacity', '0.5');
			mustPlay[this.id] = true;
	       } else {
			$('#newLetter').attr('disabled', false).css('opacity', '1');
			if (mustPlay[this.id]) delete mustPlay[this.id];
	       }
	}});

	$('#playWord' + num).attr('disabled', true).css('opacity', '0.5');
}

//
// Gets a random letter out of the letter table and adds it to the pool
// If given 'true', plays a hamster turn first
//
function getRandomLetter(hamsterTurn) {
	if (hamsterTurn) playHamsterTurn();

	var i = Math.floor(Math.random()*letterTable.length);
	var letter = letterTable[i];
	//var rowNum = Math.floor(Math.random()*2 + 1);
	addLetter(letter);
}

//
// Adds the given letter to the pool
//
function addLetter(letter) {
	$('#pool').find('tr').after('<td id = \"letter' + letterId + '\" class = \"circle LETTER_' + letter + '\" width = "80">' + letter + '</td>');
	letterId++;

	//remove last letter if there are over 12
	var poolLetters = getWordFromArr($('#pool').sortable('toArray'));
	if (poolLetters.length > MAX_POOL_SIZE) {
		$('#pool').find('td:last').remove();
	}

}

//
// Sets up a new word block
//
function makeNewWord() {
	var html = '<p><table id = \"table' + wordId + '\" class = \"inPlay\"><tr><td rowspan = \"2\"><table id = \"word' + wordId + '\" class = \"word connect inPlay\"><tr><td id = \"none\"></td></tr></table></td><td width = \"20\"></td><td><button class = \"inPlay\" id = \"playWord' + wordId + '\" onclick = \"playWord(' + wordId + ')\">Play Word</button></tr><tr><td></td><td><button class = \"inPlay\" id = \"removeWord' + wordId + '\" onclick = \"removeWord(' + wordId + ')\">Remove</button></td></tr></table>';
	
	//add new html, make the buttons, and make the new word sortable
	$('#topWord').after(html);
	$('#playWord' + wordId).button({});
        $('#removeWord' + wordId).button({});
	makeSortableWord(wordId);

	//refresh the pool to be connected with the new word
	$('#pool').sortable('option', 'connectWith', $('.connect'));

	//update the word count
	wordId++;
}

//
// Plays the current word. Checks if it is a valid word. If so, adds points according
// to the number of letters. If not, subtracts points.
//
function playWord(num) {
	var wordId = 'word' + num;
	var idArr = $('#' + wordId).sortable('toArray');
	var word = getWordFromArr(idArr);
	if (alreadyPlayed[word]) return; //ignore words already played
	var value = word.length * word.length;
	if (dict[word]) {
		score += value;
		alreadyPlayed[word] = true;
	       animateScore(value, num, true);
	} else {
		notifyPlayer(word + ' is not a real word!', 'fool');
	       score -= value;
	      animateScore((-1 * value), num, true);
	       $('#table' + num).remove();
	}
	
	//remove from the must play group
	delete mustPlay[wordId];
	if ($.isEmptyObject(mustPlay)) {
		$('#newLetter').attr('disabled', false).css('opacity', '1');
	}

	//remove the remove button
	$('#removeWord' + num).remove();
	
	//defang if appropriate
	giveFangs();
}


// 
// Animation to increase the player or hamster's score by the word value
//
function animateScore(value, wordNum, player) {
	//Get the starting offset for the score value
	var wordOffset;
	if (wordNum == -1) {
		wordOffset = $('#pool').offset();
	} else {
		wordOffset = $('#word' + wordNum).offset();
	}
	if (player) {
		wordOffset.left += $('#table' + wordNum).width();
	} else {
		if (wordNum == -1) {
			wordOffset.left += ($('#pool').width() / 2);
		} else {
			wordOffset.left -= 25;
		}
	}

	//Get the ending offset for the score value
	var scoreOffset;
	if (player) {
		scoreOffset = $('#score').offset();
		scoreOffset.left += ($('#score').width() - $('#valueScore').width() - 40);
	} else {
		scoreOffset = $('#hamsterScore').offset();
		scoreOffset.left += 100;
	}

	//Reverse the direction if points are being lost
	if (value < 0) {
		wordOffset.left = scoreOffset.left;
		wordOffset.top = scoreOffset.top;
		scoreOffset.left -= 200;
		scoreOffset.top += 200;
	}


	//Animate the score addition
	$('<div id = \"scoreValue\">' + value + '</div>').appendTo('body').offset(wordOffset);
	$('#scoreValue').animate({left: scoreOffset.left + 'px', top: scoreOffset.top + 'px', 'font-size': '40px'}, {duration: 300, always: function() {
		$('#scoreValue').remove();
		if (player) {
			$('#score').html('Human: ' + score);
		} else {
			$('#hamsterScore').html('Hamster: ' + hamsterScore);
		}
	}});
}

//
// Removes the given word from the board, returning letters to the pool and enabling
// the new letter button
//
function removeWord(num) {
	var word = getWordFromArr($('#word' + num).sortable('toArray')).toUpperCase();
	for (var i = 0; i < word.length; i++) {
		addLetter(word.charAt(i));
	}
	$('#table' + num).remove();
	delete mustPlay['word' + num];
	if ($.isEmptyObject(mustPlay)) {
		$('#newLetter').attr('disabled', false).css('opacity', '1');
	}
}

//
// Given an array of ids of letters (as returned by sortable's toArray), 
// gets the word that they spell
//
function getWordFromArr(arr) {
	var word = '';
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] != 'none') {
			var block = '#' + arr[i];
			var letter = getType(block, 'letter');
			word += letter;
		}
	}
	word = word.toLowerCase();
	return word;
}

//
// Finds words on the board and steals them for the hamster
// Looks for anagrams of the player's words, words in the pool if
// it contains at least 6 letters, and words that can be made by 
// adding one letter to the player's words. Steals at most one word.
//
function playHamsterTurn() {
	var stolenWord = '';
	var hamsterWord = '';
	var removeLetters = ''; //to remove from the pool

    //
	// Checks the anagram map for anagrams of a given word. Sets hamsterWord to be
    // be the first one found. Makes sure the anagram has not already been played
    //
	function findAnagram(str) {
		var strArr = str.split('');
		strArr = strArr.sort();
		var sortedStr = strArr.join('');
		if (anagramMap.hasOwnProperty(sortedStr)) {
			for (var l = 0; l < anagramMap[sortedStr].length; l++) {
				if (str !== anagramMap[sortedStr][l] && !alreadyPlayed[anagramMap[sortedStr][l]]) {
					hamsterWord = anagramMap[sortedStr][l];
					return true;
				}
			}
		} else {
			return false;
		}
	}

	//
	// Find all subsets by enumerating an integer and taking the letters 
	// corresponding to the bits that are set in each integer
	//
	function findSubsetAnagrams(str) {
		//loop over subsets, prioritizing using all letters
		for (var flag = Math.pow(2, str.length) - 1; flag >= 1; flag--) {
			var letterSet = '';
			for (var i = 0; i < str.length; i++) {
				var mask = 1 << i;
				if (flag & mask) letterSet += str.charAt(i);
			}

			//try to add to the player's words
			for (i = wordId; i >= 0; i--) {
				var wordArray = $('#word' + i).sortable('toArray');
				var word = getWordFromArr(wordArray);
	       		if (word.length > 0) {
					if (findAnagram(letterSet + word)) {
						removeLetters = letterSet;
						stolenWord = word;
						$('#table' + i).remove(); //remove from the board
						return true;
					}
				}
			}

			//steal from the pool if there are more than 5 letters in it
			if (str.length > MERCY_LETTER_COUNT && letterSet.length >= 4 && findAnagram(letterSet)) {
				removeLetters = letterSet;
				return true;
			}
		}
		return false;
	}

	//loop through the players words to try to use them
	for (var j = 0; j < wordId; j++) {
		var wordArr = $('#word' + j).sortable('toArray');
		var word = getWordFromArr(wordArr);
	       if (word.length > 0) {
			//look for anagrams of the words themselves first
			if (findAnagram(word)) {
				stolenWord = word;
				hamsterScore += hamsterWord.length * hamsterWord.length;
				alreadyPlayed[hamsterWord] = true;
			    animateScore((hamsterWord.length * hamsterWord.length), j, false);
			    $('#table' + j).remove();
				notifyPlayer('Hamster rearranged ' + stolenWord + ' to make ' + hamsterWord, 'victory');
				return; //return early. only need to find one word
			}
		}	
	}

	var poolArr = $('#pool').sortable('toArray');
	var poolLetters = getWordFromArr(poolArr);

	//check the pool for words using and not using the player's words
	if (findSubsetAnagrams(poolLetters)) { //poolLetters.length > 5 && 
		//remove letters from pool
		for (var k = 0; k < removeLetters.length; k++) {
			var letterClass = 'LETTER_' + (removeLetters.toUpperCase()).charAt(k);
			$('#pool').find('td.' + letterClass).first().remove();
		}

		//update hamster score and words
		hamsterScore += hamsterWord.length * hamsterWord.length;
		alreadyPlayed[hamsterWord] = true;
		animateScore((hamsterWord.length * hamsterWord.length), -1, false);

		//notify player
		if (stolenWord == '') {
			notifyPlayer('Hamster made ' + hamsterWord + ' from the pool', 'victory');	
		} else {
			notifyPlayer('Hamster added ' + removeLetters + ' to ' + stolenWord + ' to make ' + hamsterWord, 'victory', 2400);
		}

		$('#pool').sortable('refreshPositions');
		return; //found a word
	}
}

// 
// Gives hamster fangs if he is up by 100 points. Removes them when player catches up
//
function giveFangs() {
	if (hamsterScore - score >= FANG_DIFFERENCE && hamsterPic !== 'fangedhamster') {
		hamsterPic = 'fangedhamster';
		var message = 'Hamster is up ' + FANG_DIFFERENCE + ' points!';
		$('<div id = \"message\">&nbsp;' + message + '&nbsp;</div>').appendTo('body').css('z-index', '900');
		setTimeout(function () {
            		$('#message').remove();
	    		$('#hamster').attr('src', 'images/' +  hamsterPic + '.png');
        	}, 1900);
	} else if (hamsterPic === 'fangedhamster' && score - hamsterScore >= 0) {
		hamsterPic = 'hamster';
		var message = 'You have successfully de-fanged Hamster!';
		$('<div id = \"message\">&nbsp;' + message + '&nbsp;</div>').appendTo('body');
		setTimeout(function () {
            		$('#message').remove();
	    		$('#hamster').attr('src', 'images/' +  hamsterPic + '.png');
        	}, 1900);
	}
}

//
// Prints the given message for the player
// pic specifies the image for a hamster comment
//
function notifyPlayer(message, pic, pause) {
	if (!pause) pause = 1900;
	if (pic === 'victory') {
		$('#hamster').attr('src', 'images/' + hamsterPic + 'victory.png');
	} else if (pic === 'fool') {
		$('#hamster').attr('src', 'images/' + hamsterPic + 'fool.png');
	}
	$('<div id = \"message\">&nbsp;' + message + '&nbsp;</div>').appendTo('body');
	setTimeout(function () {
            $('#message').remove();
	     $('#hamster').attr('src', 'images/' + hamsterPic + '.png');
            setTimeout(function () {
		giveFangs();
	    }, 800);
        }, pause);
}

//
// Returns the type of a particular class. Example, LETTER_A will return 'A' for 
// the 'letter' attribute
//
function getType(block, attribute) {
	attribute = attribute.toUpperCase();
	var classes = $(block).attr('class');
	var start = classes.indexOf(attribute) + attribute.length + 1; //+1 to account for _ between attribute name and particular type
	var end = classes.indexOf(' ', start);
	if (start < 0) return;
	if (end < 0) return classes.substring(start);
	return classes.substring(start, end);
}

//
// Asynchronously loads the dictionary of valid words
//
function loadDictionary(dictName, dictionary) {
	$.get(dictName, function( txt ) {
    		//Get an array of all the words
    		var words = txt.split( "\r\n" ); //use \r\n for 2of12in, and \n for longdict
 
    		//Add them as properties to the dictionary to allow for fast lookup
    		for ( var i = 0; i < words.length; i++ ) {
				if (words[i].charAt(words[i].length - 1) !== '%') {				        		
					dictionary[ words[i] ] = true;
				}
    		}
	});
}

//
// Asynchronously loads the hamster's dictionary and the anagram map 
// for the hamster to use
//
function loadAnagramMap(mapName, dictionary, map) {
	$.get(mapName, function( txt ) {
    		//Get an array of all the words
    		var words = txt.split( "\r\n" );
 
    		for ( var i = 0; i < words.length; i++ ) {
			if (words[i].charAt(words[i].length - 1) !== '%') {
				dictionary[ words[i] ] = true;
	
				//sort each 4+ letter word to account for it in the anagram map
				if (words[i].length >= 4) {
					var sortedWordArr = words[i].split(''); //make array
					sortedWordArr = sortedWordArr.sort();
					var sortedWord = sortedWordArr.join('');
					if (map.hasOwnProperty(sortedWord)) {
						map[sortedWord][map[sortedWord].length] = words[i]; //add word to the array
					} else {
						map[sortedWord] = [words[i]];
					}
				}
			}
    		}
	});

}

//
// Builds the letter table according to english letter frequencies. For example,
// E is listed in 127 out of 1000 places. So randomly indexing into the table
// will return letters at roughly their frequency of use. Frequency of the least 
// common letters has been adjusted - they are listed 1-2 extra times
//
function buildLetterTable() {
	for (var i = 0; i < 82; i++) {
		letterTable[letterTable.length] = 'A';
	}
	for (i = 0; i < 15; i++) {
		letterTable[letterTable.length] = 'B';
	}
	for (i = 0; i < 28; i++) {
		letterTable[letterTable.length] = 'C';
	}
	for (i = 0; i < 43; i++) {
		letterTable[letterTable.length] = 'D';
	}
	for (i = 0; i < 127; i++) {
		letterTable[letterTable.length] = 'E';
	}
	for (i = 0; i < 22; i++) {
		letterTable[letterTable.length] = 'F';
	}
	for (i = 0; i < 20; i++) {
		letterTable[letterTable.length] = 'G';
	}
	for (i = 0; i < 60; i++) {
		letterTable[letterTable.length] = 'H';
	}
	for (i = 0; i < 70; i++) {
		letterTable[letterTable.length] = 'I';
	}
	for (i = 0; i < 3; i++) {
		letterTable[letterTable.length] = 'J';
	}
	for (i = 0; i < 8; i++) {
		letterTable[letterTable.length] = 'K';
	}
	for (i = 0; i < 40; i++) {
		letterTable[letterTable.length] = 'L';
	}
	for (i = 0; i < 24; i++) {
		letterTable[letterTable.length] = 'M';
	}
	for (i = 0; i < 67; i++) {
		letterTable[letterTable.length] = 'N';
	}
	for (i = 0; i < 75; i++) {
		letterTable[letterTable.length] = 'O';
	}
	for (i = 0; i < 19; i++) {
		letterTable[letterTable.length] = 'P';
	}
	for (i = 0; i < 2; i++) {
		letterTable[letterTable.length] = 'Q';
	}
	for (i = 0; i < 60; i++) {
		letterTable[letterTable.length] = 'R';
	}
	for (i = 0; i < 63; i++) {
		letterTable[letterTable.length] = 'S';
	}
	for (i = 0; i < 90; i++) {
		letterTable[letterTable.length] = 'T';
	}
	for (i = 0; i < 28; i++) {
		letterTable[letterTable.length] = 'U';
	}
	for (i = 0; i < 3; i++) {
		letterTable[letterTable.length] = 'V';
	}
	for (i = 0; i < 24; i++) {
		letterTable[letterTable.length] = 'W';
	}
	for (i = 0; i < 4; i++) {
		letterTable[letterTable.length] = 'X';
	}
	for (i = 0; i < 20; i++) {
		letterTable[letterTable.length] = 'Y';
	}
	for (i = 0; i < 3; i++) {
		letterTable[letterTable.length] = 'Z';
	}
}