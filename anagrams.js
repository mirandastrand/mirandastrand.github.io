var dict = {}; //dictionary of valid english words
var hamsterDict = {}; //dictionary of hamster's words
var anagramMap = {}; //dictionary of all sorted letter combinations
var hamsterAnagramMap = {};
var letterTable = []; //stores letters according to frequency
var score = 0; //player's score
var hamsterScore = 0;
var alreadyPlayed = {}; //dictionary of words already played
var letterId = 0; //count of all letters played to create unique identifiers
var wordId = 1; //count of all the words on the board to create unique identifiers

$(document).ready(function() {
	//load the dictionary asynchronously
	$.get( "longdict.txt", function( txt ) {
    		//Get an array of all the words
    		var words = txt.split( "\n" );
 
    		//Add them as properties to the dict to allow for fast lookup
    		for ( var i = 0; i < words.length; i++ ) {
        		dict[ words[i] ] = true;
	
			//sort each 4+ letter word to account for it in the anagram map
			if (words[i].length >= 4) {
				var sortedWordArr = words[i].split(''); //make array
				sortedWordArr = sortedWordArr.sort();
				var sortedWord = sortedWordArr.join('');
				if (anagramMap.hasOwnProperty(sortedWord)) {
					anagramMap[sortedWord][anagramMap[sortedWord].length] = words[i]; //add word to the array
				} else {
					anagramMap[sortedWord] = [words[i]];
				}
			}
    		}
		console.log('loaded and ready');
	});

	//load hamster's dictionary asynchronously as well
	$.get( "longdict.txt", function( txt ) {
    		//Get an array of all the words
    		var hwords = txt.split( "\n" );
 
    		//Add them as properties to the dict to allow for fast lookup
    		for ( var h = 0; h < hwords.length; h++ ) {
        		dict[ hwords[h] ] = true;
	
			//sort each 4+ letter word to account for it in the anagram map
			if (hwords[h].length >= 4) {
				var hsortedWordArr = hwords[h].split(''); //make array
				hsortedWordArr = hsortedWordArr.sort();
				var hsortedWord = hsortedWordArr.join('');
				if (hamsterAnagramMap.hasOwnProperty(hsortedWord)) {
					hamsterAnagramMap[hsortedWord][hamsterAnagramMap[hsortedWord].length] = hwords[h]; //add word to the array
				} else {
					hamsterAnagramMap[hsortedWord] = [hwords[h]];
				}
			}
    		}
		console.log('hamster map loaded and ready');
	});

	$(':button').button({});

	//build the letter frequency table
	buildLetterTable();

	//get the starting 4 letters now that dictionary must be loaded
	for (var i = 0; i < 4; i++) {
		getRandomLetter(false);
	}

	//make the letter pool sortable
	$('#pool').sortable({items: 'td', tolerance: 'pointer', connectWith: $('.connect'), dropOnEmpty: true, opacity: 1, start: function() {
		$('.word').addClass('highlight');
	}, stop: function() {
		$('.word').removeClass('highlight');
	}});

	//make the first word sortable
	makeSortableWord(0);

	$('.letter').css('cursor', 'move');
});

// Makes a word sortable, given the word count number. Assumes this word has already been added to the html
// Also initially disables the Play Word button for this word
function makeSortableWord(num) {
	$('#word' + num).sortable({items: 'td', tolerance: 'pointer', dropOnEmpty: true, opacity: 1, start: function () {
		$(this).addClass('highlight');
	}, stop: function() {
		$(this).removeClass('highlight');
	}, update: function() {
		//enable the Play Word button when word is 4 letters long (plus 5th 'none' character)
		if ($(this).sortable('toArray').length == 5) {
			//console.log('3+ letter word');
			var wordNum = (this.id).substring(4);
			console.log(wordNum);
			$('#playWord' + wordNum).attr('disabled', false).css('opacity', '1');
		}
	}});

	$('#playWord' + num).attr('disabled', true).css('opacity', '0.5');
}

// Gets a random letter out of the letter table and adds it to the pool
// If given 'true', plays a hamster turn first
function getRandomLetter(hamsterTurn) {
	if (hamsterTurn) playHamsterTurn();
	var i = Math.floor(Math.random()*letterTable.length);
	var letter = letterTable[i];
	var rowNum = Math.floor(Math.random()*2 + 1);
	$('#pool').find('tr').after('<td id = \"letter' + letterId + '\" class = \"circle LETTER_' + letter + '\" width = "80">' + letter + '</td>');
	letterId++;
}

// Sets up a new word
function makeNewWord() {
	var html = '<p><table id = \"table' + wordId + '\"><tr><td><table id = \"word' + wordId + '\" class = \"word connect\"><tr><td id = \"none\"></td></tr></table></td><td width = \"20\"></td><td><button id = \"playWord' + wordId + '\" onclick = \"playWord(' + wordId + ')\">Play Word</button></td></tr></table>';
	console.log(html);
	
	//add new html, make the button, and make the new word sortable
	$('#topWord').after(html);
	$('#playWord' + wordId).button({});
	makeSortableWord(wordId);

	//refresh the pool to be connected with the new word
	$('#pool').sortable('option', 'connectWith', $('.connect'));

	//update the word count
	wordId++;
}

// Plays the current word. Checks if it is a valid word. If so, adds points according
// to the number of letters. If not, subtracts points.
function playWord(num) {
	var idArr = $('#word' + num).sortable('toArray');
	var word = getWordFromArr(idArr);
	console.log(word);
	if (alreadyPlayed[word]) return; //ignore words already played
	if (dict[word]) {
		console.log('real word!');
		score += word.length * word.length;
		alreadyPlayed[word] = true;
	} else {
		notifyPlayer(word + ' is not a real word!', 'fool');
	       score -= word.length * word.length;
	       $('#table' + num).remove();
	}
	$('#score').html('Player: ' + score);
}

// Given an array of ids of letters (as returned by sortable's toArray), gets the word that they spell
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

// Finds anagrams on the board and steals the for the hamster
function playHamsterTurn() {
	var stolenWord = '';
	var hamsterWord = '';

	// Checks the hamsterAnagramMap for anagrams of a given word. Sets hamsterWord to be
	// be the first one found. Makes sure the anagram has not already been played
	function findAnagram(str) {
		var strArr = str.split('');
		strArr = strArr.sort();
		var sortedStr = strArr.join('');
		if (hamsterAnagramMap.hasOwnProperty(sortedStr)) {
			for (var l = 0; l < hamsterAnagramMap[sortedStr].length; l++) {
				if (str !== hamsterAnagramMap[sortedStr][l] && !alreadyPlayed[hamsterAnagramMap[sortedStr][l]]) {
					hamsterWord = hamsterAnagramMap[sortedStr][l];
					return true;
				}
			}
		} else {
			return false;
		}
	}

	// Finds all subsets of a string and checks them for anagrams
	function findSubsetAnagrams(str) {
		if (str.length < 4) return false;
		if (findAnagram(str)) return true;
		for (var p = 0; p < str.length; p++) {
			var noP = str.substring(0, p) + str.substring(p+1);
			if (findSubsetAnagrams(noP)) return true;
		}
		return false;
	}

	//loop through the players words to try to use them
	for (var j = 0; j < wordId; j++) {
		var wordArr = $('#word' + j).sortable('toArray');
		var word = getWordFromArr(wordArr);
		
		//look for anagrams of the words themselves first
		if (findAnagram(word)) {
			stolenWord = word;
			console.log('hamster rearranged ' + stolenWord + ' to make ' + hamsterWord);
			$('#table' + j).remove();
			hamsterScore += hamsterWord.length * hamsterWord.length;
			alreadyPlayed[hamsterWord] = true;
		       $('#hamsterScore').html('Hamster: ' + hamsterScore);
			//notify player
			notifyPlayer('Hamster rearranged ' + stolenWord + ' to make ' + hamsterWord, 'victory')
			return; //return early. only need to find one word
		}	
	}
	
	//check the pool for words
	var poolArr = $('#pool').sortable('toArray');
	var poolLetters = getWordFromArr(poolArr);
	if (poolLetters.length > 5 && findSubsetAnagrams(poolLetters)) {
		//remove letters from pool
		for (var k = 0; k < hamsterWord.length; k++) {
			var letterClass = 'LETTER_' + (hamsterWord.toUpperCase()).charAt(k);
			$('#pool').find('td.' + letterClass).first().remove();
		}

		console.log('hamster made ' + hamsterWord + ' from the pool');
		hamsterScore += hamsterWord.length * hamsterWord.length;
		alreadyPlayed[hamsterWord] = true;
		$('#hamsterScore').html('Hamster: ' + hamsterScore);
		notifyPlayer('Hamster made ' + hamsterWord + ' from the pool', 'victory');
		return; //found a word
	}

	//check the words with one letter added from the pool
	for (var pool = 0; pool < poolLetters.length; pool++) {
		for (var wordNum = 0; wordNum < wordId; wordNum++) {
			wordArr = $('#word' + wordNum).sortable('toArray');
			word = getWordFromArr(wordArr);
			checkWord = word + poolLetters.charAt(pool);
			if ((hamsterDict[checkWord] && !alreadyPlayed[checkWord]) || findAnagram(checkWord)) {
				console.log('hamster added ' + poolLetters.charAt(pool) + ' to ' + word + ' to make ' + hamsterWord);
				$('#table' + wordNum).remove();
				letterClass = 'LETTER_' + (hamsterWord.toUpperCase()).charAt(pool);
				$('#pool').find('td.' + letterClass).remove();
				hamsterScore += hamsterWord.length * hamsterWord.length;
				alreadyPlayed[hamsterWord] = true;
		       		$('#hamsterScore').html('Hamster: ' + hamsterScore);
				notifyPlayer('Hamster added ' + poolLetters.charAt(pool) + ' to ' + word + ' to make ' + hamsterWord, 'victory');
				return; //return early. only need to find one word
			}	
		}
	}
	
}

// Prints a message for the player
function notifyPlayer(message, pic) {
	if (pic === 'victory') {
		$('#hamster').attr('src', 'images/hamstervictory.png');
	} else if (pic === 'fool') {
		$('#hamster').attr('src', 'images/hamsterfool.png');
	}
	$('<div id = \"message\">&nbsp;' + message + '&nbsp;</div>').appendTo('body');
	setTimeout(function () {
            $('#message').remove();
	    $('#hamster').attr('src', 'images/hamster.png');
        }, 1900);
}

// Returns the type of a particular class. Example, LETTER_A will return 'A' for 
// the 'letter' attribute
function getType(block, attribute) {
	attribute = attribute.toUpperCase();
	var classes = $(block).attr('class');
	var start = classes.indexOf(attribute) + attribute.length + 1; //+1 to account for _ between attribute name and particular type
	var end = classes.indexOf(' ', start);
	if (start < 0) return;
	if (end < 0) return classes.substring(start);
	return classes.substring(start, end);
}

// Builds the letter table according to english letter frequencies. For example,
// E is listed in 127 out of 1000 places. So randomly indexing into the table
// will return letters at roughly their frequency of use. Frequency of the least 
// common letters has been adjusted - they are listed 1-2 extra times
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