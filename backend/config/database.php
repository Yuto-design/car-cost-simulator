<?php
define('DB_DRIVER', strtolower((string) (getenv('DB_DRIVER') ?: 'sqlite')));
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'car_cost_simulator');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');
define('SQLITE_DB_PATH', getenv('SQLITE_DB_PATH') ?: (__DIR__ . '/../../database/car_cost_simulator.sqlite'));

function getPdo(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    if (DB_DRIVER === 'mysql') {
      $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
      $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      ]);
    } else {
      $dir = dirname(SQLITE_DB_PATH);
      if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
      }
      $pdo = new PDO('sqlite:' . SQLITE_DB_PATH, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      ]);
      $pdo->exec('PRAGMA foreign_keys = ON');
    }
    ensure_cars_table($pdo);
  }
  return $pdo;
}

function is_sqlite(PDO $pdo): bool {
  return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
}

function ensure_cars_table(PDO $pdo): void {
  if (is_sqlite($pdo)) {
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        segment TEXT NOT NULL DEFAULT 'gasoline_hybrid',
        powertrain TEXT NULL,
        maker TEXT NOT NULL,
        model TEXT NOT NULL,
        fuel REAL NOT NULL,
        electric_wh_per_km REAL NULL,
        hydrogen_km_per_kg REAL NULL,
        engine REAL NOT NULL,
        price INTEGER NOT NULL,
        inspection INTEGER NULL
      )"
    );
    return;
  }

  $pdo->exec(
    "CREATE TABLE IF NOT EXISTS cars (
      id INT AUTO_INCREMENT PRIMARY KEY,
      segment ENUM('gasoline_hybrid','plugin_ev') NOT NULL DEFAULT 'gasoline_hybrid' COMMENT 'リスト区分',
      powertrain ENUM('bev','phev','fcv') NULL COMMENT 'plugin_ev のみ',
      maker VARCHAR(50) NOT NULL COMMENT 'メーカー名（例: Toyota, Honda）',
      model VARCHAR(100) NOT NULL COMMENT '車種名・グレード（例: Aqua X, N-BOX Base）',
      fuel DECIMAL(4,1) NOT NULL COMMENT 'GHV: km/L / PHEV: ガソリン時 km/L / BEV・FCVは0可',
      electric_wh_per_km DECIMAL(7,2) NULL COMMENT '電費 Wh/km（BEV・PHEV・カタログ表記に合わせる）',
      hydrogen_km_per_kg DECIMAL(6,2) NULL COMMENT '水素費 km/kg（FCV）',
      engine DECIMAL(5,3) NOT NULL COMMENT '排気量 L（小数点以下3桁）',
      price INT NOT NULL COMMENT '車両価格 円',
      inspection INT DEFAULT NULL COMMENT '車検費用目安（2年分）円'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
  );
}
