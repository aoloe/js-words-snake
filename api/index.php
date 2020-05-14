<?php
// require __DIR__ . '/vendor/autoload.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$config = include_once("config.php");
include_once("TinyRest.php");
include_once("WordsSnake.php");

/*
function get_pusher($config) {
    $pusher = new Pusher\Pusher(
        $config['pusher']['key'],
        $config['pusher']['secret'],
        $config['pusher']['app_id'],
        [
            'cluster' => $config['pusher']['cluster'],
            'useTLS' => $config['pusher']['useTLS']
        ]
  );

  return $pusher;
}
*/

$app = new Aoloe\TinyRest\App('action');
$request = Aoloe\TinyRest\HttpRequest::create();
$response = new Aoloe\TinyRest\HttpResponse();

$app->get('list', function() use($config, $request, $response) {
    $list = [];
    $snake = new WordsSnake($config['db']);
    foreach ($snake->get_list($request->get('author')) as $item) {
        $list[] = [
            'snake_id' => $item['hash'],
            'title' => $item['title'],
            'language' => $item['language'],
            'editable' => $item['editable']
        ];
    }

    $response->respond($list);
});

$app->get('get', function() use($config, $request, $response) {
    $snake = new WordsSnake($config['db']);
    [$hash, $title, $words, $language, $snake_author] = $snake->get($request->get('id'));
    $sort = true;
    $author = null;
    if ($request->has('sort') && $request->has('author')) {
        $sort = $request->get('sort') === 'false' ? false : true;
        $author = $request->get('author');
    }
    if ($sort === false) {
        $response->respond(['snake_id' => $hash, 'title' => $title, 'words' => ($author === $snake_author ? $words : null), 'language' => $language]);
    } else {
        $solution = null;
        $first = null;
        $last = null;
        if (isset($words)) {
            $first = array_shift($words);
            $last = array_pop($words);
            $solution = hash('sha1', json_encode($words));
            shuffle($words);
        }
        $response->respond(['snake_id' => $hash, 'title' => $title, 'first' => $first, 'last' => $last, 'words' => $words, 'language' => $language, 'solution_hash' => $solution, 'sort' => is_bool($sort)]);
    }
});

$app->post('create', function() use($config, $request, $response) {
    $snake = new WordsSnake($config['db']);
    [$id, $hash] = $snake->add(
        $request->get('title'),
        $request->get('language'),
        $request->get('words'),
        $request->get('author')
    );
    $response->respond(['id' => $hash]);
});

$app->post('update', function() use($config, $request, $response) {
    $snake = new WordsSnake($config['db']);
    [$id, $hash] = $snake->set(
        $request->get('id'),
        $request->get('title'),
        $request->get('language'),
        $request->get('words'),
        $request->get('author')
    );
    $response->respond(['id' => $hash]);
});

$app->post('delete', function() use($config, $request, $response) {
    $snake = new WordsSnake($config['db']);
    [$hash] = $snake->delete(
        $request->get('id'),
        $request->get('author')
    );
    $response->respond(['hash' => $hash]);
});

$app->post('share', function() use($config, $request, $response) {
    $snake = new WordsSnake($config['db']);
    $share_hash = $snake->share(
        $request->get('id')
    );
    $response->respond(['share_key' => $share_hash]);
});

$app->post('join_shared', function() use($config, $request, $response) {
    $snake = new WordsSnake($config['db']);
    $snake_hash = $snake->get_shared_game(
        $request->get('key')
    );
    $response->respond(['id' => $snake_hash]);
});

$app->post('typing', function() use($config, $request, $response) {
    /*
    $pusher = get_pusher($config);
    $key = $request->get('share_key');
    $c = $request->get('c');
    $i = $request->get('i');
    $pusher->trigger('snake', 'typing', ['share_key' => $key, 'c' => $c, 'i' => $i]);
    $response->respond([$key, $c, $i]);
    */
});

if (!$app->run($request)) {
    $response->respond($app->error_message);
}
