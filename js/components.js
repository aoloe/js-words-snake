Vue.component('snake-list', {
  template: `<div>
    <ul class="snake-list">
      <li v-for="item in paginated_list" v-on:click="select(item.snake_id)">
        {{item.title}}
        ({{item.language}})
        <a href="#" v-if="item.editable === true" v-on:click="edit(item.snake_id)">✎</a>
      </li>
    </ul>
    <button type="button" class="page-link" v-if="page > 0" v-on:click="page--"> Previous </button>
    <button type="button" class="page-link" v-if="page <= page_n" v-on:click="page++"> Next </button>
  </div>`,
  props: {
    list: Array,
    languages: Object
  },
  data: function() {
    return {
      page: 0,
      page_n: 0,
      per_page: 10,
      filter: 'all'
    }
  },
  mounted() {
    if (localStorage.snake_filter) { 
      this.filter = localStorage.snake_filter;
    }
  },
  computed: {
    paginated_list() {
      if (this.list === null) {
        return [];
      }
      if (this.filter === 'all') {
        list = this.list.slice();
      } else if (this.filter === 'mine') {
        list = this.list.filter(f => f.editable === true);
      } else {
        list = this.list.filter(f => f.language === this.filter);
      }
      start = this.page * this.per_page;
      list = list.slice(start, start + this.per_page);
      page_n = Math.trunc(list.length / this.per_page);
      return list;
    }
  },
  methods: {
    edit: function() {
      this.$emit('edit', '');
    },
    select: function(snake_id) {
      this.$emit('select', snake_id);
    }
  }
});

Vue.component('editor-word', {
  template: `<div v-if="edit === null"
          class="word"
          v-on:click="make_editable"
          >{{word}}
    </div>
    <input v-else v-model="edit" ref="edit_word" v-on:keyup.enter="store" v-on:blur="store" class="word" v-bind:style="{width: edit.length + 'ch'}">
  </template>`,
  props: {
    word: String,
    i: Number
  },
  data: function() {
    return {
      edit: null
    }
  },
  methods: {
    make_editable: function() {
      this.edit = this.word;
      Vue.nextTick(function() {this.$refs.edit_word.focus();}.bind(this));
    },
    store: function() {
      this.$emit('set_word', this.i, this.edit.trim());
      this.edit = null;
    }
  }
});

Vue.component('editor', {
  template: `<div class="snake-editor">
    <select v-model="language" required>
      <option v-for="(value, key) in languages" v-bind:value="key">
        {{value}}
      </option>
    </select><br>
    <div class="words">
      <editor-word
        v-for="(word, i) in words"
        v-bind:key="i"
        v-on:set_word="set_word"
        :word="word"
        :i="i">
      </editor-word>
      <input v-model="new_word" v-on:keyup.enter="add" class="word" v-bind:style="{width: new_word.length + 'ch', minWidth: '3ch'}"><br>
    </div>
    <input type="button" value="Create" :disabled="language === null || words.length < 3" v-on:click="create"">
  </div>`,
  props: {
    languages: Object
  },
  data: function() {
    return {
      words: [],
      new_word: '',
      language: null,
    }
  },
  mounted() {
    if (localStorage.snake_editor_words) {
      this.words = JSON.parse(localStorage.snake_editor_words);
    }
  },
  watch: {
    words: {
      handler(val) {
        localStorage.setItem('snake_editor_words', JSON.stringify(this.words));
      }
    }
  },
  methods: {
    create: function() {
      localStorage.removeItem('snake_editor_words');
      this.$emit('create', this.language, this.words.join(', '));
    },
    get_words_from_input(text) {
      text = text.trim();
      if (text === '') {
        return [];
      }
      if (text.includes(',')) {
        return text.split(',').map(s => s.trim()).filter(s => s !== '');
      } else {
        return [text];
      }
    },
    add: function() {
      let words = this.get_words_from_input(this.new_word);
      if (words.length > 0) {
        this.words.push(...words);
      }
      this.new_word = '';
    },
    set_word: function(i, word) {
      let words = this.get_words_from_input(word);
      if (words.length > 0) {
        this.words.splice(i, 1, ...this.get_words_from_input(word));
      } else {
        this.words.splice(i, 1);
      }
    }
  }
});

Vue.component('words-snake', {
  template: `<div class="words-snake">
      <div class="snake-box">
        <div class="left" v-bind:class="{'snake-solved': solved}">
          <div class="snake-top">
            <div class="word first">{{first_snake}}</div>
            <div
              class="word"
              v-for="(word, i) in snake_top"
              v-on:click="snake_remove(snake_top, i)"
              >{{word}}</div>
            <draggable
              v-model="target_top"
              v-on:add="drop('top')"
              v-if="!solved"
              group="snake-words"
              :emptyInsertThreshold="20"
              class="snake-drop-target">
               <div v-for="word in target_top">{{word}}</div>
            </draggable>
            <div v-if="!solved" class="snake-drop-placeholder">×</div>
          </div>
          <hr v-if="!solved">
          <div class="snake-bottom">
            <div v-if="!solved" class="snake-drop-placeholder">×</div>
            <draggable
              v-model="target_bottom"
              v-on:add="drop('bottom')"
              v-if="!solved"
              group="snake-words"
              :emptyInsertThreshold="20"
              class="snake-drop-target">
               <div v-for="word in target_top">{{word}}</div>
            </draggable>
            <div
              class="word"
              v-for="(word, i) in snake_bottom"
              v-on:click="snake_remove(snake_bottom, i)"
              >{{word}}</div>
            <div class="word last">{{last_snake}}</div>
          </div>
        </div>
        <draggable
          v-model="words"
          v-if="!solved"
          group="snake-words"
          drag-class="active-target"
          ghost-class="sortable-source"
          class="right snake-words">
           <div
             v-for="(word, i) in words"
             class="word"
             >{{word}}</div>
        </draggable>
      </div>
    </div>`,
  props: {
    snake_id: String
  },
  mounted() {
    this.get_snake(this.snake_id);
  },
  data: function() {
    return {
      first_snake: [],
      last_snake: [],
      snake_top: [],
      snake_bottom: [],
      words: [],
      target_top: [],
      target_bottom: [],
      solution_hash: null,
      share_key: null,
      solved: false
    }
  },
  watch: {
    snake_top: function(val) {
      this.check_solved();
    },
    snake_bottom: function(val) {
      this.check_solved();
    }
  },
  methods: {
    check_solved: function() {
      if (this.words.length === 0) {
        this.solved = sha1(JSON.stringify(this.snake_top.concat(this.snake_bottom))) === this.solution_hash;
      } else {
        this.solved = false;
      }
    },
    snake_remove: function(source, i) {
      if (!this.solved) {
        var item = source.splice(i, 1)[0];
        this.words.push(item);
      }
    },
    drop: function(target) {
      console.log(target);
      if (target === 'top') {
        this.snake_top.push(this.target_top.splice(0, 1)[0]);
      } else {
        this.snake_bottom.unshift(this.target_bottom.splice(0, 1)[0]);
      }
    },
    get_snake: function(id) {
      axios
        .get(basedir+'/api/', {
          params: {
            action: 'get',
            id: id,
          }
        })
        .then(response => {
          this.first_snake = response.data.first;
          this.last_snake = response.data.last;
          this.snake_top = [];
          this.snake_bottom = [];
          this.words = response.data.words;
          this.title = response.data.title;
          this.solution_hash = response.data.solution_hash;
        });
    }
  }
});

/// https://github.com/kvz/locutus/blob/master/src/php/strings/sha1.js
function sha1(str) {
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
