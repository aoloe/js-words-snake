basedir = WordSnake.get_basedir(window.location.pathname);

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

const modes = [
  'list',
  'view',
  'edit'
];

const app = new Vue({
  el: '#app',
  data: {
    languages: {'de': 'Deutsch', 'it': 'Italiano', 'en': 'English', 'fr': 'Français'},
    categories: WordSnake.categories,
    snake_id: null,
    mode: null,
    // share_key: null,
  },
  mounted() {
    if (localStorage.snake_player_id) { 
      this.player_id = localStorage.snake_player_id;
    } else {
      this.player_id = WordSnake.uuidv4();
      localStorage.setItem('snake_player_id', this.player_id);
    }
    if (localStorage.snake_id) {
      this.snake_id = localStorage.snake_id;
    }
    if (localStorage.snake_mode) {
      this.mode = localStorage.snake_mode;
    }
  },
  methods: {
    go: function(href, params = {}) {
      if (modes.includes(href)) {
        this.mode = href;
        localStorage.setItem('snake_mode', this.mode);
        if ('snake_id' in params) {
          this.snake_id = params.snake_id;
          localStorage.setItem('snake_id', this.snake_id);
        } else {
          this.snake_id = null;
          localStorage.removeItem('snake_id');
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
      /*
      axios
        .post(basedir+'/api/', {
          action: 'share',
          id: this.snake_id
        })
        .then(response => {
          this.share_key = response.data.share_key;
          localStorage.setItem('snake_share_key', this.share_key);
        })
      */
    },
    join_shared: function() {
      /*
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
      */
    }
  }
});
