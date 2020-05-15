Vue.component('snake-list', {
  template: `<div>
    <ul class="snake-list">
      <li v-for="item in paginated_list">
        <a-link href="view" :params="{snake_id: item.snake_id}" class = "label">
          {{item.title}}
          ({{item.language}})
        </a-link>
        <a-link v-if="item.editable" href="edit" :params="{snake_id: item.snake_id}">✎</a-link>
      </li>
    </ul>
    <button type="button" class="page-link" v-if="page > 0" v-on:click="page--"> Previous </button>
    <button type="button" class="page-link" v-if="page <= page_n" v-on:click="page++"> Next </button>
  </div>`,
  props: {
    languages: Object
  },
  data: function() {
    return {
      list: [],
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
    console.log
    this.get_list();
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
    get_list: function() {
      axios
        .get(basedir+'/api/', {
          params: {
            action: 'list',
            author: this.$root.player_id
          }
        })
        .then(response => {
          this.list = response.data;
        });
    },
  }
});

Vue.component('editor-word', {
  template: `<div v-if="edit === null">
      <div
            class="word"
            v-on:click="make_editable"
            >{{word}}</div>
      <div class="relationship">{{relationship}}</div>
    </div>
    <input v-else v-model="edit" ref="edit_word" v-on:keyup.enter="store" v-on:blur="store" class="word" v-bind:style="{width: edit.length + 'ch'}">
  </template>`,
  props: {
    word: String,
    relationship: String,
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
        v-for="(word, i) in words.map((v, i) => [v, relationships[i]])"
        v-bind:key="i"
        v-on:set_word="set_word"
        :word="word[0]"
        :relationship="word[1]"
        :i="i">
      </editor-word>
      <input v-model="new_word" v-on:keyup.enter="add" class="word" v-bind:style="{width: new_word.length + 'ch', minWidth: '3ch'}"><br>
    </div>
    <p v-if="snake_id">
      <button :disabled="language === null || words.length < 3" v-on:click="save">Save</button>
      <button v-on:click="remove">Delete</button>
    </p>
    <button v-else :disabled="language === null || words.length < 3" v-on:click="create">Create</button>
    <div class="legend">
      <ul>
        <li data-bullet=" ">Number of words: {{words.length}}</li>
        <li data-bullet="∞">Anagram: {{stats.anagram}}</li>
        <li data-bullet="≈">Change a character: {{stats.one_difference}}</li>
        <li data-bullet="–">Drop a character: {{stats.one_less}}</li>
        <li data-bullet="+">Add a character: {{stats.one_more}}</li>
        <li data-bullet="↷">Others (synonym, antonym, association) : {{stats.other}}</li>
      </ul>
    </div>
  </div>`,
  props: {
    languages: Object,
    snake_id: {
      required: true,
      validator: p => typeof p === 'string' || p === null
    }
  },
  data: function() {
    return {
      words: [],
      new_word: '',
      language: null,
      stats: {}
    }
  },
  computed: {
    relationships () {
      this.stats = {'one_difference': 0, 'one_less': 0, 'one_more': 0, 'anagram': 0, 'other': 0};
      // return this.words;
      return this.words.map(function(w, i) {
        // do not compare the last one
        if (i > this.words.length - 2) {
          return '.';
        }
        w = w.toLowerCase();
        const next_w = this.words[i+1].toLowerCase();
        if (WordSnake.has_single_difference(w, next_w)) {
          this.stats['one_difference']++;
          return '≈'; // ⭭≚↕
        }
        if (WordSnake.has_single_add_remove(w, next_w)) {
          if (w.length > next_w.length) {
            this.stats['one_less']++;
            return '–';
          } else {
            this.stats['one_more']++;
            return '+'; // —-⊖⊝⊟≪  ⊕⊞≫
          }
        }
        if (WordSnake.is_anagram(w, next_w)) {
          this.stats['anagram']++;
          return '∞'; // ⟳↔≈
        }
        this.stats['other']++;
        return '↷'; // ∞
      }.bind(this));
    }
  },
  mounted() {
    if (this.snake_id !== null) {
      axios
        .get(basedir+'/api/', {
          params: {
            action: 'get',
            id: this.snake_id,
            sort: false,
            author: this.$root.player_id
          }
        })
        .then(response => {
          this.words = response.data.words;
          this.language = response.data.language;
        });
      // TODO: if it fails should we tell root to invalidate snake_id?
      // or simply issue a go('list')?
    }
    // TODO: test the restore while editing an exising snake
    if (localStorage.snake_editor_words) {
      this.words = JSON.parse(localStorage.snake_editor_words);
    }
  },
  destroyed() {
    localStorage.removeItem('snake_editor_words');
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
      title = this.words[0]+' → '+this.words[this.words.length - 1];
      axios
        .post(basedir+'/api/', {
          action: 'create',
          title: title,
          language: this.language,
          words: this.words,
          author: this.$root.player_id
        })
        .then(response => {
            this.$root.go('list');
        });
    },
    save: function() {
      localStorage.removeItem('snake_editor_words');
      title = this.words[0]+' → '+this.words[this.words.length - 1];
      axios
        .post(basedir+'/api/', {
          action: 'update',
          id: this.snake_id,
          title: title,
          language: this.language,
          words: this.words,
          author: this.$root.player_id
        })
        .then(response => {
            this.$root.go('list');
        });
    },
    remove: function() {
      localStorage.removeItem('snake_editor_words');
      axios
        .post(basedir+'/api/', {
          action: 'delete',
          id: this.snake_id,
          author: this.$root.player_id
        })
        .then(response => {
            this.$root.go('list');
        });
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
          <div v-if="snake_top !== null && snake_bottom !== null" class="snake-top">
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
      if (this.words !== null && this.words.length === 0) {
        this.solved = WordSnake.sha1(JSON.stringify(this.snake_top.concat(this.snake_bottom))) === this.solution_hash;
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

// based on https://github.com/chrisvfritz/vue-2.0-simple-routing-example/blob/master/src/components/VLink.vue
// this version does not push the state to the history
Vue.component('a-link', {
  template: `<a
        v-bind:href="href"
        v-bind:class="{ active: isActive }"
        v-on:click="go"
      >
        <slot></slot>
      </a>`,
  props: {
    href: {
      type:String,
      required: true
    },
    params: {
      type: Object,
      default: {}
    }
  },
  computed: {
    isActive () {
      return this.href === this.$root.a_link_target
    }
  },
  methods: {
    go(event) {
      event.preventDefault()
      let vm = this.$parent;
      while (vm) {
        vm.$emit('a_link_event', this.href, this.params);
        vm = vm.$parent;
      }
    }
  }
});
