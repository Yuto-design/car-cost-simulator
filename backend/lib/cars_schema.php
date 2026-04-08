<?php
/**
 * DB・API・CSV で用いる segment / calc_mode を正規化（単一トークン: combustion / electric）。
 * 旧名 gasoline_hybrid / plugin_ev もここで受け付ける。
 *
 * @return 'combustion'|'electric'|null null は不正値
 */
function normalize_stored_segment(string $raw): ?string {
  $t = strtolower(trim($raw));
  if ($t === 'combustion' || $t === 'gasoline_hybrid') {
    return 'combustion';
  }
  if ($t === 'electric' || $t === 'plugin_ev') {
    return 'electric';
  }
  return null;
}

/**
 * 既存 DB の segment 列を combustion / electric へ移行（SQLite TEXT / MySQL は VARCHAR に寄せる）
 */
function migrate_segment_to_single_word(PDO $pdo): void {
  if (!has_column($pdo, 'cars', 'segment')) {
    return;
  }
  if (is_sqlite_driver($pdo)) {
    $pdo->exec("UPDATE cars SET segment = 'combustion' WHERE segment = 'gasoline_hybrid'");
    $pdo->exec("UPDATE cars SET segment = 'electric' WHERE segment = 'plugin_ev'");
    return;
  }
  try {
    $pdo->exec(
      "ALTER TABLE cars MODIFY COLUMN segment VARCHAR(32) NOT NULL DEFAULT 'combustion' COMMENT 'リスト区分'"
    );
  } catch (Throwable $e) {
    // 既に VARCHAR 等の場合は無視
  }
  $pdo->exec("UPDATE cars SET segment = 'combustion' WHERE segment = 'gasoline_hybrid'");
  $pdo->exec("UPDATE cars SET segment = 'electric' WHERE segment = 'plugin_ev'");
}

function ensure_cars_extended_columns(PDO $pdo): void {
  $has = has_column($pdo, 'cars', 'segment');
  if (!$has) {
    if (is_sqlite_driver($pdo)) {
      $pdo->exec("ALTER TABLE cars ADD COLUMN segment TEXT NOT NULL DEFAULT 'combustion'");
      $pdo->exec("ALTER TABLE cars ADD COLUMN powertrain TEXT NULL");
      $pdo->exec("ALTER TABLE cars ADD COLUMN electric_wh_per_km REAL NULL");
      $pdo->exec("ALTER TABLE cars ADD COLUMN hydrogen_km_per_kg REAL NULL");
    } else {
      $pdo->exec(
        "ALTER TABLE cars ADD COLUMN segment VARCHAR(32) NOT NULL DEFAULT 'combustion' COMMENT 'リスト区分' AFTER id"
      );
      $pdo->exec(
        "ALTER TABLE cars ADD COLUMN powertrain ENUM('bev','phev','fcv') NULL COMMENT 'electric 区分のみ' AFTER segment"
      );
      $pdo->exec(
        "ALTER TABLE cars ADD COLUMN electric_wh_per_km DECIMAL(7,2) NULL COMMENT '電費 Wh/km（BEV・PHEV）' AFTER fuel"
      );
      $pdo->exec(
        "ALTER TABLE cars ADD COLUMN hydrogen_km_per_kg DECIMAL(6,2) NULL COMMENT '水素費 km/kg' AFTER electric_wh_per_km"
      );
    }
    $pdo->exec("UPDATE cars SET segment = 'combustion'");
  }
  migrate_segment_to_single_word($pdo);
}

/**
 * electric_km_per_kwh 列を electric_wh_per_km（Wh/km）へ移行（値は km/kWh → Wh/km に換算）
 */
function migrate_electric_km_per_kwh_to_wh_per_km(PDO $pdo): void {
  $hasNew = has_column($pdo, 'cars', 'electric_wh_per_km');
  if ($hasNew) {
    return;
  }
  $hasOld = has_column($pdo, 'cars', 'electric_km_per_kwh');
  if (!$hasOld) {
    return;
  }

  if (is_sqlite_driver($pdo)) {
    $pdo->exec("ALTER TABLE cars ADD COLUMN electric_wh_per_km REAL NULL");
    $pdo->exec('UPDATE cars SET electric_wh_per_km = electric_km_per_kwh');
  } else {
    $pdo->exec(
      "ALTER TABLE cars CHANGE COLUMN electric_km_per_kwh electric_wh_per_km DECIMAL(7,2) NULL COMMENT '電費 Wh/km（BEV・PHEV）'"
    );
  }

  $pdo->exec(
    'UPDATE cars SET electric_wh_per_km = ROUND(1000 / electric_wh_per_km, 2) ' .
    'WHERE electric_wh_per_km IS NOT NULL AND electric_wh_per_km > 0 AND electric_wh_per_km <= 45'
  );
}

/**
 * ガソリン/HEV CSV の powertrain 列（gasoline / hybrid 等）用
 */
function migrate_gasoline_powertrain_to_powertrain(PDO $pdo): void {
  $hasPowertrain = has_column($pdo, 'cars', 'powertrain');
  if (!$hasPowertrain) {
    if (is_sqlite_driver($pdo)) {
      $pdo->exec("ALTER TABLE cars ADD COLUMN powertrain TEXT NULL");
    } else {
      $pdo->exec("ALTER TABLE cars ADD COLUMN powertrain ENUM('gasoline','hybrid','diesel','bev','phev','fcv') NULL COMMENT '共通パワートレイン' AFTER segment");
    }
  }

  if (has_column($pdo, 'cars', 'gasoline_powertrain')) {
    $pdo->exec(
      "UPDATE cars
       SET powertrain = gasoline_powertrain
       WHERE segment = 'combustion'
         AND gasoline_powertrain IS NOT NULL
         AND gasoline_powertrain <> ''
         AND (powertrain IS NULL OR powertrain = '')"
    );
  }
}

/**
 * combustion 区分の行の電気・水素列は CSV と同様 0 を格納（従来 NULL の行を補正）
 */
function migrate_gasoline_hybrid_null_energy_to_zero(PDO $pdo): void {
  if (!has_column($pdo, 'cars', 'electric_wh_per_km') || !has_column($pdo, 'cars', 'hydrogen_km_per_kg')) {
    return;
  }
  $pdo->exec(
    "UPDATE cars SET electric_wh_per_km = 0, hydrogen_km_per_kg = 0 " .
    "WHERE segment = 'combustion' " .
    "AND (electric_wh_per_km IS NULL OR hydrogen_km_per_kg IS NULL)"
  );
}

function is_sqlite_driver(PDO $pdo): bool {
  return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
}

function has_column(PDO $pdo, string $table, string $column): bool {
  if (is_sqlite_driver($pdo)) {
    $stmt = $pdo->query("PRAGMA table_info({$table})");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $col) {
      if (isset($col['name']) && $col['name'] === $column) {
        return true;
      }
    }
    return false;
  }

  $stmt = $pdo->query("SHOW COLUMNS FROM {$table} LIKE " . $pdo->quote($column));
  return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}
