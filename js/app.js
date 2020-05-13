function get_basedir(url) {
  return url.slice(-1) == '/' ? url.slice(0, -1) : url.split('/').slice(0,-1).join('/');
}

basedir = get_basedir(window.location.pathname);

/*
var Pusher_channel_factory = (function() {
  var pusher_instance = null;
  var channels = new Map();
  return {
    get_instance: function(channel_name) {
      if (pusher_instance === null) {
        Pusher.logToConsole = false;
        pusher = new Pusher(
          '1e754324fb908641cba9', {
            cluster: 'eu',
            forceTLS: true
        });
      }
      if (!channels.has(channel_name)) {
          channels.set(channel_name, pusher.subscribe(channel_name));
      }
      return channels.get(channel_name);
    }
  }
})();

*/

// https://stackoverflow.com/a/2117523/5239250
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

const app = new Vue({
  el: '#app',
  data: {
    languages: {'de': 'Deutsch', 'it': 'Italiano', 'en': 'English', 'fr': 'Français'},
    list: null,
    snake: null,
    snake_id: null,
    editing: false,
    share_key: null,
  },
  mounted() {
    if (localStorage.snake_player_id) { 
      this.player_id = localStorage.snake_player_id;
    } else {
      this.player_id = uuidv4();
      localStorage.setItem('snake_player_id', this.player_id);
    }
    if (localStorage.snake_id) {
      this.snake_id = localStorage.snake_id;
    } else if (localStorage.snake_editor_words) {
      this.editing = true;
    }
    this.get_list();
  },
  methods: {
    get_list: function() {
      axios
        .get(basedir+'/api/', {
          params: {
            action: 'list',
            author: this.player_id
          }
        })
        .then(response => {
          this.list = response.data;
        });
    },
    // there seems to be no garantee that the items in $refs are in the correct order: we cannot pos as the index
    edit: function() {
      this.editing = true;
      this.snake = [];
    },
    update: function(list) {
      this.snake = new SnakeWords(list);
    },
    select: function(id = null) {
      if (id === null) {
        this.snake_id = null;
        localStorage.removeItem('snake_id');
        localStorage.removeItem('snake_editor_words');
        this.share_key = null;
        localStorage.removeItem('snake_share_key');
        this.editing = false;
      } else {
        this.snake_id = id;
        localStorage.setItem('snake_id', id);
        if (localStorage.snake_share_key) {
          this.share_key = localStorage.snake_share_key;
          this.activate_sharing();
        }
      }
    },
    activate_sharing: function() {
      /*
      var pusher_channel = Pusher_channel_factory.get_instance('snake');
      pusher_channel.bind('adding', function(data) {
        if (data.share_key === app.share_key) {
          // app.add_shared_character(data.c, data.i);
        }
      });
      */
    },
    share: function() {
      axios
        .post(basedir+'/api/', {
          action: 'share',
          id: this.cipher_id
        })
        .then(response => {
          this.share_key = response.data.share_key;
          localStorage.setItem('snake_share_key', this.share_key);
        })
    },
    join_shared: function() {
      axios
        .post(basedir+'/api/', {
          action: 'join_shared',
          key: this.share_key
        })
        .then(response => {
          localStorage.setItem('share_key', this.share_key);
          this.select(response.data.id);
          this.activate_sharing();
        })
    },
    create: function(language, words) {
      list = words.split(',').map(function(e) {return e.trim();});
      title = list[0]+' → '+list[list.length - 1];

      axios
        .post(basedir+'/api/', {
          action: 'create',
          title: title,
          language: language,
          words: list,
          author: this.player_id
        })
        .then(response => {
            this.get_list();
            this.snake = null;
            this.editing = false;
        });
    }
  }
});
