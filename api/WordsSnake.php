<?php

class WordsSnake
{
    static $db_version = 2;
    var $db = null;

    function __construct($db_file = 'db/cipher.db') {
        // TODO: for the future, just set the version to 1 at the beginnings and if the pragma is 0 do an install
        $install = !file_exists($db_file);

        $this->db = new SQLite3($db_file);

        if ($install) {
            $this->install_db();
        } else {
            $db_version = $this->db->querySingle('PRAGMA user_version');
            if ($db_version < self::$db_version) {
                $this->update_db($db_file);
            }
        }
    }

    function get_list($author = null) {
        $list = [];
        $db_result = $this->db->query('SELECT
            snake_hash, title, language, category, work_in_progress, author
            FROM snake
            ORDER BY snake_id DESC');
        while ($row = $db_result->fetchArray(SQLITE3_NUM)) {
            $list[] = [
                'hash' => $row[0],
                'title' => $row[1],
                'language' => $row[2],
                'category' => json_decode($row[3], true),
                'work_in_progress' => $row[4],
                'editable' => $row[5] === $author
            ];
        }
        return $list;
    }

    function get($hash) {
        $stmt = $this->db->prepare('SELECT
            snake_hash, title, snake, language, category, work_in_progress, author
            FROM snake
            WHERE snake_hash = :hash');
        $stmt->bindValue(':hash', $hash);
        $db_result = $stmt->execute();
        $row = $db_result->fetchArray(SQLITE3_NUM);
        // echo('<pre>row: '.print_r($row, 1).'</pre>');
        if ($row) {
            return [
                $row[0], $row[1], json_decode($row[2], true), $row[3], isset($row[4]) ? json_decode($row[4], true) : [], $row[5], $row[6]];
                
        } else {
            return array_fill(0, 7, null);
        }
    }

    public function add($title, $language, $snake, $category, $work_in_progress, $author) {
        $snake_hash = base64_encode(openssl_random_pseudo_bytes(16));
        $stmt = $this->db->prepare('INSERT INTO snake
            (snake_hash, title, language, snake, category, work_in_progress, author)
            VALUES (:snake_hash, :title, :language, :snake, :category, :work_in_progress, :author)');
        $stmt->bindValue(':snake_hash', $snake_hash, SQLITE3_TEXT);
        $stmt->bindValue(':title', $title, SQLITE3_TEXT);
        $stmt->bindValue(':language', $language, SQLITE3_TEXT);
        $stmt->bindValue(':snake', json_encode($snake), SQLITE3_TEXT);
        $stmt->bindValue(':category', json_encode($category), SQLITE3_TEXT);
        $stmt->bindValue(':work_in_progress', $work_in_progress, SQLITE3_INTEGER);
        $stmt->bindValue(':author', $author, SQLITE3_TEXT);
        $stmt->execute();
        return [$this->db->lastInsertRowid(), $snake_hash];
    }

    public function set($snake_hash, $title, $language, $snake, $category, $work_in_progress, $author) {
        $stmt = $this->db->prepare('UPDATE snake SET
            (title, language, snake, category, work_in_progress) =
                (:title, :language, :snake, :category, :work_in_progress)
            WHERE snake_hash = :snake_hash AND
                author = :author');
        $stmt->bindValue(':title', $title, SQLITE3_TEXT);
        $stmt->bindValue(':language', $language, SQLITE3_TEXT);
        $stmt->bindValue(':snake', json_encode($snake), SQLITE3_TEXT);
        $stmt->bindValue(':category', json_encode($category), SQLITE3_TEXT);
        $stmt->bindValue(':work_in_progress', $work_in_progress, SQLITE3_INTEGER);
        $stmt->bindValue(':snake_hash', $snake_hash, SQLITE3_TEXT);
        $stmt->bindValue(':author', $author, SQLITE3_TEXT);
        $stmt->execute();
        return [$this->db->lastInsertRowid(), $snake_hash];
    }

    /// @return null on success, the original hash otherwise
    public function delete($snake_hash, $author) {
        $stmt = $this->db->prepare('DELETE FROM snake
            WHERE snake_hash = :snake_hash AND
                author = :author');
        $stmt->bindValue(':snake_hash', $snake_hash, SQLITE3_TEXT);
        $stmt->bindValue(':author', $author, SQLITE3_TEXT);
        $stmt->execute();
        // return ['hash' => $this->db->changes() === 1 ? null : $snake_hash];
        return ['hash' => $this->db->changes() === 1 ? null : $snake_hash];
    }

    // https://stackoverflow.com/a/2117523/5239250
    // (it would be good to use random_bytes(),
    // see https://stackoverflow.com/questions/2040240
    private static function uuidv4() {
        $result = preg_replace_callback('/[018]/',
            function($matches) {
                $c = $matches[0];
                return base_convert($c ^ random_int(0, 255) & 15 >> $c / 4, 10, 16);
                },
                '10000000-1000-4000-8000-100000000000');
        print_r($result, 1);
        return $result;
    }

    public function share(string $snake_hash) :?string {
        $share_hash = self::uuidv4();
        $stmt = $this->db->prepare('INSERT INTO share
            (snake_id, share_hash)
            SELECT  snake_id, :share_hash FROM snake WHERE snake_hash = :snake_hash');
        if ($stmt !== false) {
            $stmt->bindValue(':share_hash', $share_hash, SQLITE3_TEXT);
            $stmt->bindValue(':snake_hash', $snake_hash, SQLITE3_TEXT);
            $stmt->execute();
            return $share_hash;
        }
        return null;
    }

    function get_shared_game($hash) {
        $stmt = $this->db->prepare('SELECT
            snake_hash
            FROM snake
            JOIN share ON
                share.snake_id = snake.snake_id
            WHERE share_hash = :hash');
        $stmt->bindValue(':hash', $hash);
        $db_result = $stmt->execute();
        $row = $db_result->fetchArray(SQLITE3_NUM);
        return $row ? $row[0] : null;
    }

    function install_db() {
        $this->db->query("
            CREATE TABLE IF NOT EXISTS snake (
                snake_id INTEGER PRIMARY KEY,
                snake_hash TEXT,
                title TEXT,
                language TEXT,
                snake TEXT,
                category TEXT,
                work_in_progress BOOLEAN,
                author TEXT
            );
        ");
        $this->db->query("
            CREATE TABLE IF NOT EXISTS share (
                share_id INTEGER PRIMARY KEY,
                snake_id INTEGER,
                share_hash TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");
        $this->db->exec('PRAGMA user_version='.self::$db_version);
    }

    function update_db($db_file) {
        $backup = $db_file.'~'.date('Ymd-His');
        exec("sqlite3 '$db_file' '.backup '".$backup."''");

        // $db_version = $db->exec('PRAGMA user_version=0');
        $db_version = $this->db->querySingle('PRAGMA user_version');

        if ($db_version < 2) {
            $this->db->exec('
                ALTER TABLE snake
                    ADD category TEXT
            ');
            $this->db->exec('
                ALTER TABLE snake
                    ADD work_in_progress BOOLEAN
            ');
            $this->db->exec('PRAGMA user_version=2');
        }
    }
}
