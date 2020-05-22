# Word Snake

Create a snake of words between a _tail word_ and the _head one_.

## Install

- `git clone https://github.com/aoloe/js-words-snake.git snake`
- `cd api`
  - `wget https://raw.githubusercontent.com/aoloe/php-tiny-rest/master/src/TinyRest.php`
  - `mkdir db`
- `cd js`
  - `wget https://cdn.jsdelivr.net/npm/vue/dist/vue.js`
  - `wget https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js`
  - `wget https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js`
  - `wget https://cdnjs.cloudflare.com/ajax/libs/Vue.Draggable/2.20.0/vuedraggable.umd.min.js`
  - create a `config.php` based on `config-demo.php`

## Todo

- avoid backspace
  - <https://stackoverflow.com/questions/1495219/how-can-i-prevent-the-backspace-key-from-navigating-back#comment18441045_8218367>
  - simpler:

    ```
    window.onkeydown = function(e) {
    if (e.keyCode == 8 && e.target == document.body)
      e.preventDefault();
    }
    ```
  - for now: if somebody does not want to go back with backspace, she should disable it in the browser.

- zustand vom spiel in localstorage
- improve the editor
  - create a database of words and links between them
  - give hints for the current word
