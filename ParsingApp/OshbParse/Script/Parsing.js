/**
* @fileOverview Parsing is the JavaScript controller for OSHB parsing.
* @version 1.0
* @author David
*/
(function() {
// Ajax library.
    var Ajax = function()
    {
        var url, responseFunction, postData;
        // Method to set the URL.
        this.setUrl = function(value)
        {
            url = value;
        };
        // Method to set the response function.
        this.setResponseFunction = function(value)
        {
            responseFunction = value;
        };
        // Method to set the post data.
        this.setPostData = function(value)
        {
            postData = value;
        };
        // Gets the XMLHttpRequest.
        var getXhr = function()
        {
            var xhr = false;
            if (window.XMLHttpRequest) {
                xhr = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                try {
                    xhr = new ActiveXObject("Msxml2.XMLHTTP");
                }
                catch(e) {
                    try {
                        xhr = new ActiveXObject("Microsoft.XMLHTTP");
                    }
                    catch(e) {
                        xhr = false;
                    }
                }
            }
            return xhr;
        };
        // Gets the response.
        this.getResponse = function()          // DHS
        {  var request = getXhr();
            if (request) {
                request.onreadystatechange = function() { parseResponse(request); };
                if (postData) { 
                    request.open("POST", url, true);
                    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                    request.send(postData);
                } else {
                    request.open("GET", url, true);
                    request.send(null);
                }
            }
        };
        // Parses the response.
        var parseResponse = function(request)
        {
            if (request.readyState === 4) {
                if (request.status === 200 || request.status === 304) {
                    responseFunction(request);
                }
                else { alert("Error status=" + request.status + " response=" + request.responseText); }
            }
        };
    };// Summary of Hebrew morphology codes.
    var morphCodes = {
        'partOfSpeech': {
            'A': 'Adjective',
            'C': 'Conjunction',
            'D': 'Adverb',
            'N': 'Noun',
            'P': 'Pronoun',
            'R': 'Preposition',
            'S': 'Suffix',
            'T': 'Particle',
            'V': 'Verb'
        },
        'adjectiveType': {
            'a': 'adjective',
            'c': 'cardinal number',
            'g': 'gentilic',
            'o': 'ordinal number',
            'x': ''
        },
        'nounType': {
            'c': 'common',
            'g': 'gentilic',
            'p': 'proper name',
            'x': ''
        },
        'pronounType': {
            'd': 'demonstrative',
            'f': 'indefinite',
            'i': 'interrogative',
            'p': 'personal',
            'r': 'relative',
            'x': ''
        },
	'prepositionType': {
            'd': 'definite article'
	},
        'suffixType': {
            'd': 'directional he',
            'h': 'paragogic he',
            'n': 'paragogic nun',
            'p': 'pronominal',
            'x': ''
        },
        'particleType': {
            'a': 'affirmation',
            'd': 'definite article',
            'e': 'exhortation',
            'i': 'interrogative',
            'j': 'interjection',
            'm': 'demonstrative',
            'n': 'negative',
            'o': 'direct object marker',
            'p': 'definite article with inseparable preposition',
            'r': 'relative'
        },
        'verbStemHebrew': {
            'q': 'qal',
            'N': 'niphal',
            'p': 'piel',
            'P': 'pual',
            'h': 'hiphil',
            'H': 'hophal',
            't': 'hithpael',
            'o': 'polel',
            'O': 'polal',
            'r': 'hithpolel',
            'm': 'poel',
            'M': 'poal',
            'k': 'palel',
            'K': 'pulal',
            'Q': 'qal passive',
            'l': 'pilpel',
            'L': 'polpal',
            'f': 'hithpalpel',
            'D': 'nithpael',
            'j': 'pealal',
            'i': 'pilel',
            'u': 'hothpaal',
            'c': 'tiphil',
            'v': 'hishtaphel',
            'w': 'nithpalel',
            'y': 'nithpoel',
            'z': 'hithpoel',
            'x': ''
        },
        'verbStemAramaic': {
            'q': 'peal',
            'Q': 'peil',
            'u': 'hithpeel',
            'N': 'niphal',
            'p': 'pael',
            'P': 'ithpaal',
            'M': 'hithpaal',
            'a': 'aphel',
            'h': 'haphel',
            's': 'saphel',
            'e': 'shaphel',
            'H': 'hophal',
            'i': 'ithpeel',
            't': 'hishtaphel',
            'v': 'ishtaphel',
            'w': 'hithaphel',
            'o': 'polel',
            'z': 'ithpoel',
            'r': 'hithpolel',
            'f': 'hithpalpel',
            'b': 'hephal',
            'c': 'tiphel',
            'm': 'poel',
            'l': 'palpel',
            'L': 'ithpalpel',
            'O': 'ithpolel',
            'G': 'ittaphal',
            'x': ''
        },
        'verbAspect': {
            'p': 'perfect',
            'q': 'sequential perfect',
            'i': 'imperfect',
            'w': 'sequential imperfect',
            'h': 'cohortative',
            'j': 'jussive',
            'v': 'imperative',
            'r': 'participle active',
            's': 'participle passive',
            'a': 'infinitive absolute',
            'c': 'infinitive construct',
            'x': ''
        },
        'adjCase': {
            'a': 'accusative',
            'n': 'nominative',
            'x': ''
        },
        'person': {
            '1': 'first person',
            '2': 'second person',
            '3': 'third person',
            'x': ''
        },
        'gender': {
            'b': 'both',
            'c': 'common',
            'f': 'feminine',
            'm': 'masculine',
            'x': ''
        },
        'number': {
            'd': 'dual',
            'p': 'plural',
            's': 'singular',
            'x': ''
        },
        'state': {
            'a': 'absolute',
            'c': 'construct',
            'd': 'determined'
        },
        'language': {
            'H': 'Hebrew',
            'A': 'Aramaic'
        }
    };
// Parser for morphology codes.
    var MorphParse = function()
    {
        var language, nextName;
        /**
         * Parses the given code.
         * @param {string} code A morph code
         * @returns (string} The morphology
         */
        this.Parse = function(code) {
            if (!code) {return {"morph": "", "next": "language", "segs": 0};}
            language = code.charAt(0);
            if (!morphCodes.language.hasOwnProperty(language)) {
                return {"morph": "Unknown language", "next": "error", "segs": 0};
            }
            var morph = morphCodes.language[language];
            code = code.substr(1);
            if (code) {
                var parts = code.split('/'), i = 1, len = parts.length;
                morph += ':<br />' + parseCode(parts[0]);
                for (; i < len; i++) {
                    morph += '<br />' + parseCode(parts[i]);
                }
            } else {
                nextName = 'partOfSpeech';
            }
            len = len ? len - 1 : 0;
            return {"morph": morph, "next": nextName, "segs": len};
        };
        // Parses the code.
        var parseCode = function(code) {
            if (!code) {
                nextName = 'partOfSpeech';
                return '';
            }
            var pos = code.charAt(0);
            if (!morphCodes.partOfSpeech.hasOwnProperty(pos)) {
                nextName = 'error';
                return "Unknown part of speech";
            }
            var morph = morphCodes.partOfSpeech[pos];
            if (code.length > 1) {
                switch (pos) {
                    case 'A':
                        morph += ' ' + parseAdjective(code);
                        break;
                    case 'C':
                        nextName = 'error';
                        morph += ' ' + "Unknown separator";
                        break;
                    case 'D':
                        nextName = 'error';
                        morph += ' ' + "Unknown separator";
                        break;
                    case 'N':
                        morph += ' ' + parseNoun(code);
                        break;
                    case 'P':
                        morph += ' ' + parsePronoun(code);
                        break;
                    case 'R':
                        morph += ' ' + parsePreposition(code);
                        break;
                    case 'S':
                        morph += ' ' + parseSuffix(code);
                        break;
                    case 'T':
                        morph += ' ' + parseParticle(code);
                        break;
                    case 'V':
                        morph += ' ' + parseVerb(code);
                        break;
                    default:
                        morph += ' Unknown part of speech in ' + code;
                }
            } else {
                switch (pos) {
                    case 'A':
                        nextName = 'adjectiveType';
                        break;
                    case 'C':
                        nextName = 'separator';
                        break;
                    case 'D':
                        nextName = 'separator';
                        break;
                    case 'N':
                        nextName = 'nounType';
                        break;
                    case 'P':
                        nextName = 'pronounType';
                        break;
                    case 'R':
                        nextName = 'prepositionType';
                        break;
                    case 'S':
                        nextName = 'suffixType';
                        break;
                    case 'T':
                        nextName = 'particleType';
                        break;
                    case 'V':
                        if (language === 'H') {
                            nextName = 'verbStemHebrew';
                        } else {
                            nextName = 'verbStemAramaic';
                        }
                        break;
                    default:
                        nextName = 'error';
                }
            }
            return morph;
        };
        // Parses the adjective code.
        var parseAdjective = function(code) {
            if (!morphCodes.adjectiveType.hasOwnProperty(code.charAt(1))) {
                nextName = 'error';
                return "Unknown adjective type";
            }
            var morph = morphCodes.adjectiveType[code.charAt(1)];
            if (code.length > 2) {
                morph += ' ' + parseGender(code, 2);
            } else {
                nextName = 'gender';
            }
            return morph;
        };
        // Parses the noun code.
        var parseNoun = function(code) {
            if (!morphCodes.nounType.hasOwnProperty(code.charAt(1))) {
                nextName = 'error';
                return "Unknown noun type";
            }
            var morph = morphCodes.nounType[code.charAt(1)];
            if (code.length > 2) {
                morph += ' ' + parseGender(code, 2);
            } else {
                nextName = 'gender';
            }
            return morph;
        };
        // Parses the pronoun code.
        var parsePronoun = function(code) {
            if (!morphCodes.pronounType.hasOwnProperty(code.charAt(1))) {
                nextName = 'error';
                return "Unknown pronoun type";
            }
            var morph = morphCodes.pronounType[code.charAt(1)];
            if (code.length > 2) {
                morph += ' ' + parsePerson(code, 2);
            } else {
                nextName = 'person';
            }
            return morph;
        };
        // Parse the preposition code.
        var parsePreposition = function(code) {
            if (!morphCodes.prepositionType.hasOwnProperty(code.charAt(1))) {
                nextName = 'error';
                return "Unknown preposition type";
            }
            var morph = morphCodes.prepositionType[code.charAt(1)];
            if (code.length > 2) {
                nextName = 'error';
                return "Unknown separator";
            } else {
                nextName = 'separator';
            }
            return morph;
        };
        // Parses the suffix code.
        var parseSuffix = function(code) {
            if (!morphCodes.suffixType.hasOwnProperty(code.charAt(1))) {
                nextName = 'error';
                return "Unknown suffix type";
            }
            var morph = morphCodes.suffixType[code.charAt(1)];
            if (code.length > 2) {
                morph += ' ' + parsePerson(code, 2);
            } else {
                nextName = 'person';
            }
            return morph;
        };
        // Parses the participle code.
        var parseParticle = function(code) {
            if (!morphCodes.particleType.hasOwnProperty(code.charAt(1))) {
                nextName = 'error';
                return "Unknown particle type";
            }
            var morph = morphCodes.particleType[code.charAt(1)];
            if (code.length > 2) {
                nextName = 'error';
                return "Unknown separator";
            } else {
                nextName = 'separator';
            }
            return morph;
        };
        // Parses the verb code.
        var parseVerb = function(code) {
            var morph, isMorph;
            if (language === 'H') {
                isMorph = morphCodes.verbStemHebrew.hasOwnProperty(code.charAt(1));
                morph = morphCodes.verbStemHebrew[code.charAt(1)];
            } else {
                isMorph = morphCodes.verbStemAramaic.hasOwnProperty(code.charAt(1));
                morph = morphCodes.verbStemAramaic[code.charAt(1)];
            }
            if (!isMorph) {
                nextName = 'error';
                return "Unknown verb stem";
            }
            if (code.length > 2) {
                morph += ' ' + parseAspect(code);
            } else {
                nextName = 'verbAspect';
            }
            return morph;
        };
        // Parses the aspect code.
        var parseAspect = function(code) {
            if (!morphCodes.verbAspect.hasOwnProperty(code.charAt(2))) {
                nextName = 'error';
                return "Unknown verb aspect";
            }
            var morph = morphCodes.verbAspect[code.charAt(2)];
            if (morph === 'participle active' || morph === 'participle passive') {
                if (code.length > 3) {
                    morph += ' ' + parseGender(code, 3);
                } else {
                    nextName = 'gender';
                }
            } else if (morph === 'infinitive absolute' || morph === 'infinitive construct') {
                if (code.length > 3) {
                    nextName = 'error';
                    return "Unknown field";
                } else {
                    nextName = 'separator';
                }
            } else {
                if (code.length > 3) {
                    morph += ' ' + parsePerson(code, 3);
                } else {
                    nextName = 'person';
                }
            }
            return morph;
        };
        // Parses the person code.
        var parsePerson = function(code, pos) {
            if (!morphCodes.person.hasOwnProperty(code.charAt(pos))) {
                nextName = 'error';
                return "Unknown person";
            }
            var morph = morphCodes.person[code.charAt(pos)];
            pos++;
            if (code.length > pos) {
                morph += ' ' + parseGender(code, pos);
            } else {
                nextName = 'gender';
            }
            return morph;
        };
        // Parses the gender code.
        var parseGender = function(code, pos) {
            if (!morphCodes.gender.hasOwnProperty(code.charAt(pos))) {
                nextName = 'error';
                return "Unknown gender";
            }
            var morph = morphCodes.gender[code.charAt(pos)];
            pos++;
            if (code.length > pos) {
                morph += ' ' + parseNumber(code, pos);
            } else {
                nextName = 'number';
            }
            return morph;
        };
        // Parses the number code.
        var parseNumber = function(code, pos) {
            if (!morphCodes.number.hasOwnProperty(code.charAt(pos))) {
                nextName = 'error';
                return "Unknown number";
            }
            var morph = morphCodes.number[code.charAt(pos)];
            pos++;
            if (code.length > pos) {
                    morph += ' ' + parseState(code, pos);
                } else if (code.charAt(0) === 'V') {
                    if (code.charAt(2) === 'r' || code.charAt(2) === 's') {
                            nextName = 'state';
                    } else {
                            nextName = 'separator';
                    }
                } else if (code.charAt(0) === 'P' || code.charAt(0) === 'S') {
                    nextName = 'separator';
                } else {
                    nextName = 'state';
                }
            return morph;
        };
        // Parses the state code.
        var parseState = function(code, pos) {
            if (!morphCodes.state.hasOwnProperty(code.charAt(pos))) {
                nextName = 'error';
                return "Unknown state";
            }
            var morph = morphCodes.state[code.charAt(pos)];
            pos++;
            if (code.length > pos) {
                nextName = 'error';
                return "Unknown separator";
            } else {
                nextName = 'separator';
            }
            return morph;
        };
    };

// END Parser for morphology codes.


// Interface elements.
    (function() {
        var books = {"Gen": "50", "Exod": "40", "Lev": "27", "Num": "36", "Deut": "34", "Josh": "24", "Judg": "21", "1Sam": "31", "2Sam": "24", "1Kgs": "22", "2Kgs": "25", "Isa": "66", "Jer": "52", "Ezek": "48", "Hos": "14", "Joel": "4", "Amos": "9", "Obad": "1", "Jonah": "4", "Mic": "7", "Nah": "3", "Hab": "3", "Zeph": "3", "Hag": "2", "Zech": "14", "Mal": "3", "Ps": "150", "Prov": "31", "Job": "42", "Song": "8", "Ruth": "4", "Lam": "5", "Eccl": "12", "Esth": "10", "Dan": "12", "Ezra": "10", "Neh": "13", "1Chr": "29", "2Chr": "36"};
        var wordList = [];
        // Retains references to frequently used elements.
        var elements = {
            "parser":    document.getElementById('parser'),
            "text":      document.getElementById('text'),
            "wordBox":   document.getElementById('wordBox'),
            "morph":     document.getElementById('morph'),
            "morphHint": document.getElementById('morphHint'),
            "morphText": document.getElementById('morphText'),
            "foreWord":  document.getElementById('foreWord'),
            "backWord":  document.getElementById('backWord'),
            "apply":     document.getElementById('apply'),
            "book":      document.getElementById('book'),
            "chapter":   document.getElementById('chapter'),
            "startword": document.getElementById('startword'),  // DHS added: startword and scrollTop are hidden inputs
            "scrollTop": document.getElementById('scrollTop')   // provided by ParseView from the DB reference bookmark. 
        };
        var currentbookname = 'Gen';    // DHS: initialize the buffers for ChapterReference
        var currentchapter =   1;       // these will be refreshed immediately by getChapter on window.load.

    // Utility functions.
        // Utility function to clear child nodes from an element.
        var clearNodes = function(elem) {
            while (elem.childNodes.length > 0) {
                elem.removeChild(elem.firstChild);
            }
        };
        // Utility to find the position of an element.
        var position = function(element) {
            var pos = {top: 0, left: 0};
            while (element) {
                pos.top += element.offsetTop;
                pos.left += element.offsetLeft;
                element = element.offsetParent;
            }
            return pos;
        };
        // Checks if Enter is pressed.
        var enterKey = function(e) {
            e = e ? e : event;
            var keycode = e.keyCode;
            return (keycode === 13);
        };
        // Sets or removes an additional class name.
        var setClass = function(node, name) {
            var names = node.className.split(' ');
            name = name ? names[0] + ' ' + name : names[0];
            node.className = name;
        };
        // Sets or removes an additional title.
        var setTitle = function(node, title) {
            var titles = node.title.split("\n");
            title = title ? titles[0] + "\n" + title : titles[0];
            node.title = title;
        };
        // Gets the parsing from Hebrew span title and refreshes Hebrew span additional class.
        var getParsing = function(node)                         // DHS
        { var titles     = node.title.split("\n");              // node.title contains LEMMA and optional MORPH submission.
          var wordstatus = node.parentNode.title;               // parent.title contains word "status".
          
          if (!(document.getElementById('stoped_button')))      // Not an editor in editing mode     
          { if (titles.length <= 1) return '';                  // IF  we have no MORPH, THEN return an empty string
            setClass(node, (wordstatus === 'verified') ? wordstatus : 'done');  // ELSE node.class = 'verifed' or 'done'
            return titles[1];                                   // return the MORPH.
          }
                                                                // An editor in editing mode, so handle things differently.
          if (wordstatus === 'none') return '';                 // IF   we have no MORPH, THEN return an empty string
          setClass(node,wordstatus); return titles[1];          // ELSE node.class = word "status" && return the MORPH.
        };
    // Word handling.
        // Maintains word data in word list and stacks.
        var wordObject = function(node) {
            var parsing = getParsing(node);                     // Refreshes Hebrew span additional class.
            return {
                getNode: function()         { return node; },
                setParsing: function(value) {                   // DHS modified HERENOW
                  parsing = value; 
                  setTitle(node, parsing);
                  if (!document.getElementById('stoped_button')) return;
                  var sibs = node.parentNode.childNodes;        // An editor is editing we must update the sibling morph span
                  for (var i = 0; i < sibs.length; i++) 
                  { if (sibs[i].className === 'morph') { sibs[i].innerHTML = parsing; break; } }
                },  
                getParsing: function()      { return parsing; }
            };
        };


// Maintains the index of the current word.     DHS HERE
var currentWord = function() 
{ var index = -1;
  return {
    getIndex: function() { return index; },
    setIndex: function(i) 
    { if (index >= 0) 
      { var node = wordList[index].getNode();
        node.className = node.className.replace(' current', '');    // DHS node is no longer "current"
        getParsing(node);                                           // DHS restore its class ("done" or "status" value).
      }
      index = i;
      setClass(scrollIntoView(wordList[index].getNode()), 'current');
      return wordList[index].getParsing();
    }
  };
}();
// Scroll the node into view.
var scrollIntoView = function(node) 
{ var textBottom = position(elements.text).top + elements.text.offsetHeight;
  var nodeBottom = position(node).top + node.offsetHeight;
  if (nodeBottom - elements.text.scrollTop > textBottom) { elements.text.scrollTop = nodeBottom - textBottom + 160; }
  return node;
};

        // Manages word segments.
        var wordSegments = function() {
            var segmentNodes = [], currentIndex = 0, last;
            return {
                setWord: function(word) {
                    var segments = word.split('/'), i = 0, len = segments.length;
                    last = segments.length - 1;
                    clearNodes(elements.wordBox);
                    segmentNodes = [];
                    for (; i <= last; i++) {
                        var span = document.createElement('span');
                        span.className = 'seg';
                        span.appendChild(document.createTextNode(segments[i]));
                        wordBox.appendChild(span);
                        segmentNodes.push(span);
                    }
                    currentIndex = 0;
                    setClass(segmentNodes[0], 'current');
                },
                selectSegment: function(index) {
                    if (index <= last) {
                        var currentNode = segmentNodes[currentIndex];
                        setClass(currentNode, '');
                        currentIndex = index;
                        setClass(segmentNodes[index], 'current');
                    }
                },
                isLast: function() {
                    return currentIndex === last;
                }
            };
        }();
        // Converts camel case name to title case.
        var nameTitle = function(name) {
            function insertSpace(match) {
                return ' ' + match;
            };
            var spaced = name.replace(/[A-Z]/g, insertSpace);
            return spaced.charAt(0).toUpperCase() + spaced.slice(1);
        };
        // Constructs a list item for the hint dropdown.
        var hintLine = function(code, value) {
            var text = code + ': ' + value;
            var item = document.createElement('li');
            item.appendChild(document.createTextNode(text));
            item.setAttribute('title', code);
            item.addEventListener("click", function() {
                elements.morph.value += this.title;
                elements.morphHint.style.display = 'none';
                morphChange();
            }, false);
            return item;
        };
        // Constructs a list item for the hint dropdown.
        var enterLine = function() {
            var item = document.createElement('li');
            item.appendChild(document.createTextNode('Enter: Apply parsing'));
            item.setAttribute('title', 'Enter');
            item.addEventListener("click", function() {
                elements.morphHint.style.display = 'none';
                submitMorph();
            }, false);
            return item;
        };
        // Sets up the hint dropdown.
        var hintDropdown = function(name) {
            elements.morph.className = '';
            clearNodes(elements.morphHint);
            var ed = document.createElement('div');
            var title = document.createElement('h3');
            title.appendChild(document.createTextNode(nameTitle(name)));
            ed.appendChild(title);
            // Append hints.
            var list = document.createElement('ul');
            var obj = morphCodes[name];
            for (var code in obj) {
                list.appendChild(hintLine(code, obj[code]));
            }
            if (name !== 'language') {
                if (wordSegments.isLast()) {
                    list.appendChild(enterLine());
                } else {
                    list.appendChild(hintLine('/', 'Morphological separator'));
                }
            }
            ed.appendChild(list);
            elements.morphHint.appendChild(ed);
            // Display the dropdown.
            var pos = position(elements.morph);
            elements.morphHint.style.top = pos.top + elements.morph.offsetHeight + 'px';
            elements.morphHint.style.left = pos.left + 'px';
            elements.morphHint.style.display = 'block';
        };
        // Manages language selection.
        var lang = function() {
            var code = 'H';
            return {
                hebClick: function() { code = 'H'; },
                arcClick: function() { code = 'A'; },
                getCode: function()  { return code; }
            };
        }();
        // An instance of MorphParse.
        var parser = new MorphParse;

        // Change handler for the morphology input box.
        var morphChange = function() 
        { var verbal = parser.Parse(elements.morph.value);
          wordSegments.selectSegment(verbal.segs);
          elements.morphText.innerHTML = verbal.morph;
          if (verbal.next === 'error') 
          { elements.morph.className = 'error'; 
            elements.morphHint.style.display = 'none'; 
          } 
          else { hintDropdown(verbal.next); }
          elements.morph.focus();
        };

//===========================================================================================================================
// LOAD A CHAPTER'S MARKUP into the PARSER PANEL ARTICLE.text EVENT HANDLERS 
//   getReference(), getNewChapter(), getChapter() 
//   wordSelectPost()
//===========================================================================================================================
var getReference = function()
{ currentbookname = elements.book.value;                                            // Refresh current ChapterReference with
  currentchapter  = elements.chapter.options[elements.chapter.selectedIndex].text;  // nav form inputs' ChapterReference
//  alert(currentbookname + '.' + currentchapter);
  return (currentbookname + '.' + currentchapter);
}

var getNewChapter = function()              // Nav form event handler to get a new chapter from the chapter select input.
{ postReference();
  elements.startword.value = 0;                                     // Reset startword to 1st word in chapter (0) and
  elements.text.scrollTop = elements.scrollTop.value = 0;           // scrollTop to 0 
//  if (newbookname != currentbookname || newchapter != currentchapter)   // IF   NOT same as current loaded chapter
//  window.location.reload();
   getChapter();
}

// Window onLoad event handler to get the chapter text referenced by the nav form input's ChapterReference.
// Send an Httprequest for the chapter's markup and process it for displaying and indexing the text article (DHS).
var getChapter = function()                                                     
{ var responseFunction = function(request)
  { var response = request.responseText;
    elements.text.innerHTML = response;                     // This loads the entire chapter markup from server.
    processWords(); 
    // elements.text.scrollTop = elements.scrollTop.value;  // DHS: Set text scrollTop (may be overridden)
  };
  var ajax = new Ajax();
  ajax.setUrl('index.php?ref=' + encodeURIComponent(getReference()));
  ajax.setResponseFunction(responseFunction);
  ajax.getResponse();
};

// Process the HTTPrequest response for chapter text.
var processWords = function() 
{ elements.parser.style.visibility = 'visible';                                 // Initialize globals.
  elements.morph.value = '';      
  wordList = [];        

  var spans = elements.text.getElementsByTagName('span'), len = spans.length;   // Get text html spans.
  for (var i = 0, start = -1, wordstatus = 'none'; i < len; i++)                // Scan them.
  { if (spans[i].className === 'chapter')                                       // Chapter span: update alertstatus span
    { document.getElementById('alertstatus').textContent = spans[i].title; continue; }
    if (spans[i].className === 'Hebrew')                                        // Hebrew span: add click event handler
    { (function(n) { spans[i].addEventListener("click", function() { wordSelectPost(this, n); }, false); })(wordList.length);
      wordList.push(wordObject(spans[i]));                                      // Push a wordObject for into wordList.

      // See if this word qualifies as the start word.

      if (start > -1) continue;                             // If start word already selected, we are done with this word.

      wordstatus = spans[i].parentNode.title;                   // parent.title contains word "status".
      if (!(document.getElementById('stoped_button')))          // IF   not an editor in editing mode
      { if (wordstatus !== 'none') continue; }                  // THEN start word is 1st unparsed word (no MORPH submission)
      else if (document.getElementById('usePos'))               // ELSE IF   usePos is set
      { start = parseInt(elements.startword.value); continue; }     //  THEN use last word looked at as the start word. 
      else if (wordstatus === 'none' || wordstatus === 'verified')  //  ELSE start word is 1st parsed word NOT verified. 
        continue;
      
      // Qualified start word found: start = this span's index.

      start  = wordList.length - 1;                         
    }
  }
  if (!(start > -1)) { start = 0; } 
  wordSelectPost(wordList[start].getNode(), start); 
};

// Sets the node as selected.       DHS HERE
var wordSelectPost = function(node, index) 
{ var parsing = currentWord.setIndex(index);
  wordSegments.setWord(node.innerHTML);
  elements.morph.focus();
  if (parsing) { elements.morph.value = parsing; } else { elements.morph.value = lang.getCode(); }
  morphChange();
       
  // DHS added: update wordstatus span
  var wsbox  = document.getElementById('wordstatus');
  if (wsbox) wsbox.textContent = node.parentNode.title;
  postPosition(node, index);  
};

var postPosition = function(node, index)                     // Post current position to server for DB store.
{ var responseFunction = function(request)
  { var response = request.responseText; 
    response = response.slice(1);                           // (httprequest returns prepended junk that has to be sliced.)
    if (response == 0) { alert("Failure to post position to server: " + response); } 
    var el = document.getElementById('editormorph');         
    if (el) 
    { el.innerHTML = response; 
      var options = el.getElementsByTagName('option');      // Get text html options.
      el.size = options.length;   
    }
  };
  elements.startword.value = index;                                   // Refresh hidden inputs in chapter select form,
  elements.scrollTop.value = elements.text.scrollTop;

  var postData = 'pos=' + node.id + '.' + elements.scrollTop.value; 
  postal(postData, responseFunction);                               
};


//===========================================================================================================================
// WORD NAVIGATION EVENT HANDLERS and POSITION Posts.
//  nextWord(), previousWord(), nextEditWord(),
//  postReference(), postal()
//  getReference()
//===========================================================================================================================
var nextWord = function()                                                               // Advance to the next word.
{ var index = parseInt(currentWord.getIndex());
  if (++index < wordList.length)    { wordSelectPost(wordList[index].getNode(), index); }
  else alert('You are at the last word in the chapter!');
};
var previousWord = function()                                                           // Move back to the previous word.
  { var index = parseInt(currentWord.getIndex());
    if (--index >= 0)                 { wordSelectPost(wordList[index].getNode(), index); }   // DHS changed >= 0
    else alert('You are at the first word in the chapter!');
  };

var nextEditWord = function()                                       // Advance to the next Edit word.
{ var index = parseInt(currentWord.getIndex());
  if (findEditWord(index)) return;
  alert('No more words left to edit beyond what you just verified! Rescrolling from the first word in the chapter.');
  if (findEditWord(0)) return;
  alert('No more words left to edit in the chapter!');
  changeAlert('alertOpen');                                         // Set chapter ALERT status to 'open', errtoken=cleared.
};
var findEditWord = function(index)                                 // Find the next Edit word.
{ while (++index < wordList.length)    
  { var wordstatus = wordList[index].getNode().parentNode.title;    // parent.title contains word "status".
    if (wordstatus === 'none' || wordstatus == 'verified') continue;
    wordSelectPost(wordList[index].getNode(), index);               // select word & post position. 
    return (true);
  }
  return (false);
};

var postReference = function()                                      // Post ChapterReference to server for DB store.
{ var responseFunction = function(request)
  { var response = request.responseText; 
    response = response.slice(1);                           // (httprequest returns prepended junk that has to be sliced.)
    if (response.length != 0) { alert("Failure to post Chapter Reference to server: " + response + ' length=' +response.length); } 
  };
  var postData = 'chapterSav=' + getReference();     
  postal(postData, responseFunction);
};

function postal(postData, responseFunction)                         // Post an HTTPrequest.
{ var ajax = new Ajax();
  ajax.setUrl('index.php');

  ajax.setResponseFunction(responseFunction);
  ajax.setPostData(encodeURI(postData));
  ajax.getResponse();
};

//===========================================================================================================================
// MORPHOLOGY SUBMISSION TO THE SERVER ('apply' button click, etc.) EVENT HANDLERS 
//  morphKeyup(), submitMorph()
//===========================================================================================================================
var morphKeyup = function(event)                        // morph text input box keyup handler.
{ var enter = enterKey(event); 
  if (enter) { submitMorph(); return false; }           // IF   ENTER key pressed, submit morph.
  morphChange(); return true;                           // ELSE process key as a morph change.
};
        
var submitMorph = function()                        
{ var responseFunction = function(request)                  
  { var response = request.responseText;
    response = response.slice(1);                           // (httprequest returns prepended junk that has to be sliced.)
    switch (response)                                       // Valid server response is a word "status" (one of these:) .   
    { case 'single': case 'conflict': case 'error': case 'confirmed': case 'verified': 
      { var node = wordList[parseInt(currentWord.getIndex())].getNode();    // Current node (a "Hebrew" span).           
        node.parentNode.title = response;                   // Update it's parent (a "word" span) title with word "status".

      // Hebrew span class is dependent on whether user is an editor in editing mode or not.

        setClass(node, document.getElementById('stoped_button') ? response : 'done');
        document.getElementById('alertstatus').textContent = 'status: changed';
        nextWord();
      } break;
      case 'ignored': nextword(); break;                    // Member submitted same parsing again so ignore it.  
      default: alert("The last parsing was not saved properly: " + response); 
    }
  };

  if (document.getElementById('alertstatus').textContent == 'status: closed')
  { alert('This chapter is closed to morphology submissions'); return; }        // Chapter is closed to further submissions.

  var morph = elements.morph.value; 
  if (!morph || morph === 'H') { alert('Invalid morph: ' + morph); return; }    // No morph to submit.

  var index = parseInt(currentWord.getIndex());             
  wordList[index].setParsing(morph);                        // Update current WordObject parsing and node title with morph. 
  // DHS ERROR TODO update span class morph innerHTML with morph if editor is editing.
  var postData = 'data=' + wordList[index].getNode().id + ' ' + morph;
  postal(postData, responseFunction);
};
//===========================================================================================================================
// EDITOR SUBMIT A VERIFIED MORPHOLOGY OR ERROR STATUS TO THE SERVER EVENT HANDLERS
//   verifyClick(), errorClick()
//===========================================================================================================================
var verifyClick = function()
{ var el = document.getElementById('editormorph');         
  if (el) 
  { // var morph = getWordMorph(); 
    var morph = el.options[el.selectedIndex].value;  
    if (morph === '&nbsp;' || morph === 'H') { alert('Invalid morph: ' + morph); return; }
    postWordStatus(morph,'verified'); 

  }
};

var errorClick = function()
{ var morph = getWordMorph(); if (morph === '&nbsp;') { alert('There is no submitted morph to flag as an error!'); return; }
  postWordStatus(morph,'error');
};

var notesClick = function()
{ var vwref = wordList[parseInt(currentWord.getIndex())].getNode().id;    // Current node (a "Hebrew" span).           
  window.location='Editor/index.php?wordNotes='+vwref;
};

var getWordMorph = function()
{ var node = wordList[parseInt(currentWord.getIndex())].getNode();    // Current node (a "Hebrew" span).           
  var spans = node.parentNode.getElementsByTagName('span');
  return(spans[2].innerHTML);
}

var postWordStatus = function(morph, wordstatus)                
{ var responseFunction = function(request)
  { var response = request.responseText; 
    response = response.slice(1);                           // (httprequest returns prepended junk that has to be sliced.)
    switch (response)                                       // Valid server response is a word "status" (one of these:) .   
    { case 'error': case 'verified': 
      { var node = wordList[parseInt(currentWord.getIndex())].getNode();    // Current node (a "Hebrew" span).           
        node.parentNode.title = response;                   // Update it's parent (a "word" span) title with word "status".
        setClass(node, response);                           // Update Hebrew span class
        nextEditWord(); 
      } break;
      default: alert("The parsing status was not saved properly: " + response); 
    }
  };

  var index = parseInt(currentWord.getIndex());             
  wordList[index].setParsing(morph);                        // Update current WordObject parsing and node title with morph. 
  var postData = wordstatus + '=' + wordList[index].getNode().id + ' ' + morph;
  postal(postData, responseFunction);
};
//===========================================================================================================================
// EDITOR CLOSE OR OPEN A CHAPTER TO MORPHOLOGY SUBMISSIONS VIA ALERT UPDATE POST EVENT HANDLERS
//   closeClick(), openClick()
//===========================================================================================================================
var closeClick = function() { changeAlert('alertClose'); };
var openClick  = function() { changeAlert('alertOpen'); };

// changeAlert() -- POST a chapter alert change to the SERVER to set Alert status as 'closed' or 'open'
// args:            alertpost: { 'alertClose',  'alertOpen' }
//                  errtoken:  { 'closed',     {'cleared', 'opened'}}

var changeAlert = function(alertpost)                       
{ var responseFunction = function(request)                  
  { var response = request.responseText;
    response = response.slice(1);                           // (httprequest returns prepended junk that has to be sliced.)
    switch (response)                                       // Valid server response is an alert "status" (one of these:).
    { case 'closed': case 'open':
      { var title = 'status: ' + response;
        var chapters = document.getElementsByClassName("chapter");
        chapters[0].title = title;
        document.getElementById('alertstatus').textContent = title; 
      } break;
      default: alert("The chapter alert was not updated properly: " + response); 
    }
  }; 
  var postData = alertpost + '=' + currentbookname + "." + currentchapter;
  postal(postData, responseFunction);
};

//===========================================================================================================================
// Navigation elements.
// Sets the chapter options.
var setChapters = function() 
{ var i = 1, num = parseInt(books[elements.book.value]);  
  clearNodes(elements.chapter);
  for (; i <= num; i++) { elements.chapter.options[elements.chapter.options.length] = new Option(i); }
  elements.chapter[initialChapter].selected = "selected";
  initialChapter = 0;
  elements.chapter.focus(); 
};

// Keyup handler for the chapter select.
var chapterKeyup = function(event) 
{ var enter = enterKey(event);
//if (enter) { getNewChapter(); return false; }
  return true;
};

//===========================================================================================================================
// Initialize.
//===========================================================================================================================
        var onLoadDHS = function() 
        { // setTimeout(function() { getChapter();},1250);
          getChapter(); 
        };

        var initialChapter = elements.chapter.value - 1;
        elements.foreWord.onclick = nextWord;
        elements.backWord.onclick = previousWord;
        var el = document.getElementById('verify_button'); if (el) { el.onclick = verifyClick; }
        var el = document.getElementById('error_button');  if (el) { el.onclick = errorClick; }
        var el = document.getElementById('notes_button');  if (el) { el.onclick = notesClick; }
        elements.apply.onclick = submitMorph;
        elements.morph.onkeyup = morphKeyup;                                                     
        document.getElementById('heb').onclick = lang.hebClick;
        document.getElementById('arc').onclick = lang.arcClick;

        elements.book.onchange = setChapters;
        elements.chapter.onchange = getNewChapter; 
        elements.chapter.onkeyup = chapterKeyup;
 //       document.getElementById('select').onclick = getNewChapter;  // unnecessary because select submits the form.
        setChapters();
        var el = document.getElementById('close_button'); if (el) { el.onclick = closeClick; }
        var el = document.getElementById('open_button');  if (el) { el.onclick = openClick; }
        window.onload = onLoadDHS;     // DHS
    })();
})();
