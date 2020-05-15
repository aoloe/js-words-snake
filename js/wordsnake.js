WordSnake = function() {
}

WordSnake.relationships = {
  identic: {symbol: '=', legend: 'Identical'},
  anagram: {symbol: '∞', legend: 'Anagram'},
  change: {symbol: '≈', legend: 'Change a character'},
  drop: {symbol: '–', legend: 'Drop a character'},
  add: {symbol: '+', legend: 'Add a character'},
  other: {symbol: '↷', legend: 'Others (synonym, antonym, association)'}
}

WordSnake.split_input = function(text) {
  text = text.trim();
  if (text === '') {
    return [];
  }
  if (text.includes(',')) {
    return text.split(',').map(s => s.trim()).filter(s => s !== '');
  } else {
    return [text];
  }
}

WordSnake.is_anagram = function(a, b) {
  return a.split('').sort().join('') ===
    b.split('').sort().join('');
}

WordSnake.has_single_difference = function(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let difference = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      if (difference) {
        return false;
      } else {
        difference = true;
      }
    }
  }
  return difference;
}

WordSnake.has_single_add_remove = function(a, b) {
  if (Math.abs(a.length - b.length) !== 1) {
    return false;
  }
  let j = null;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      j = i;
      break;
    }
  }
  if (j === null) {
    return true;
  }
  if (a[j] === b[j + 1]) {
    return a.substring(j)  === b.substring(j + 1);
  }
  if (a[j + 1] === b[j]) {
    return a.substring(j + 1)  === b.substring(j);
  }
  return false;
}

WordSnake.get_relationships = function(a, b) {
  if (a === b) {
    return 'identic';
  }
  if (WordSnake.has_single_difference(a, b)) {
    return 'change';
  }
  if (WordSnake.has_single_add_remove(a, b)) {
    if (a.length > b.length) {
      return 'drop';
    } else {
      return 'add';
    }
  }
  if (WordSnake.is_anagram(a, b)) {
    return 'anagram';
  }
  return 'other';
}

WordSnake.get_basedir = function(url) {
  return url.slice(-1) == '/' ? url.slice(0, -1) : url.split('/').slice(0,-1).join('/');
}

// https://stackoverflow.com/a/2117523/5239250
WordSnake.uuidv4 = function() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/// https://github.com/kvz/locutus/blob/master/src/php/strings/sha1.js
WordSnake.sha1 = function(str) {
  //  discuss at: https://locutus.io/php/sha1/
  // original by: Webtoolkit.info (https://www.webtoolkit.info/)
  // improved by: Michael White (https://getsprink.com)
  // improved by: Kevin van Zonneveld (https://kvz.io)
  //    input by: Brett Zamir (https://brett-zamir.me)
  //      note 1: Keep in mind that in accordance with PHP, the whole string is buffered and then
  //      note 1: hashed. If available, we'd recommend using Node's native crypto modules directly
  //      note 1: in a steaming fashion for faster and more efficient hashing
  //   example 1: sha1('Kevin van Zonneveld')
  //   returns 1: '54916d2e62f65b3afa6e192e6a601cdbe5cb5897'

  var hash
  try {
    var crypto = require('crypto')
    var sha1sum = crypto.createHash('sha1')
    sha1sum.update(str)
    hash = sha1sum.digest('hex')
  } catch (e) {
    hash = undefined
  }

  if (hash !== undefined) {
    return hash
  }

  var _rotLeft = function (n, s) {
    var t4 = (n << s) | (n >>> (32 - s))
    return t4
  }

  var _cvtHex = function (val) {
    var str = ''
    var i
    var v

    for (i = 7; i >= 0; i--) {
      v = (val >>> (i * 4)) & 0x0f
      str += v.toString(16)
    }
    return str
  }

  var blockstart
  var i, j
  var W = new Array(80)
  var H0 = 0x67452301
  var H1 = 0xEFCDAB89
  var H2 = 0x98BADCFE
  var H3 = 0x10325476
  var H4 = 0xC3D2E1F0
  var A, B, C, D, E
  var temp

  // utf8_encode
  str = unescape(encodeURIComponent(str))
  var strLen = str.length

  var wordArray = []
  for (i = 0; i < strLen - 3; i += 4) {
    j = str.charCodeAt(i) << 24 |
      str.charCodeAt(i + 1) << 16 |
      str.charCodeAt(i + 2) << 8 |
      str.charCodeAt(i + 3)
    wordArray.push(j)
  }

  switch (strLen % 4) {
    case 0:
      i = 0x080000000
      break
    case 1:
      i = str.charCodeAt(strLen - 1) << 24 | 0x0800000
      break
    case 2:
      i = str.charCodeAt(strLen - 2) << 24 | str.charCodeAt(strLen - 1) << 16 | 0x08000
      break
    case 3:
      i = str.charCodeAt(strLen - 3) << 24 |
        str.charCodeAt(strLen - 2) << 16 |
        str.charCodeAt(strLen - 1) <<
      8 | 0x80
      break
  }

  wordArray.push(i)

  while ((wordArray.length % 16) !== 14) {
    wordArray.push(0)
  }

  wordArray.push(strLen >>> 29)
  wordArray.push((strLen << 3) & 0x0ffffffff)

  for (blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
    for (i = 0; i < 16; i++) {
      W[i] = wordArray[blockstart + i]
    }
    for (i = 16; i <= 79; i++) {
      W[i] = _rotLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1)
    }

    A = H0
    B = H1
    C = H2
    D = H3
    E = H4

    for (i = 0; i <= 19; i++) {
      temp = (_rotLeft(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff
      E = D
      D = C
      C = _rotLeft(B, 30)
      B = A
      A = temp
    }

    for (i = 20; i <= 39; i++) {
      temp = (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff
      E = D
      D = C
      C = _rotLeft(B, 30)
      B = A
      A = temp
    }

    for (i = 40; i <= 59; i++) {
      temp = (_rotLeft(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff
      E = D
      D = C
      C = _rotLeft(B, 30)
      B = A
      A = temp
    }

    for (i = 60; i <= 79; i++) {
      temp = (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff
      E = D
      D = C
      C = _rotLeft(B, 30)
      B = A
      A = temp
    }

    H0 = (H0 + A) & 0x0ffffffff
    H1 = (H1 + B) & 0x0ffffffff
    H2 = (H2 + C) & 0x0ffffffff
    H3 = (H3 + D) & 0x0ffffffff
    H4 = (H4 + E) & 0x0ffffffff
  }

  temp = _cvtHex(H0) + _cvtHex(H1) + _cvtHex(H2) + _cvtHex(H3) + _cvtHex(H4)
  return temp.toLowerCase()
}
