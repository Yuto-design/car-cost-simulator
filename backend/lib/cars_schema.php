<?php
function ensure_cars_extended_columns(PDO $pdo): void {
  $has = has_column($pdo, 'cars', 'segment');
  if ($has) {
    return;
  }

  if (is_sqlite_driver($pdo)) {
    $pdo->exec("ALTER TABLE cars ADD COLUMN segment TEXT NOT NULL DEFAULT 'gasoline_hybrid'");
    $pdo->exec("ALTER TABLE cars ADD COLUMN powertrain TEXT NULL");
    $pdo->exec("ALTER TABLE cars ADD COLUMN electric_wh_per_km REAL NULL");
    $pdo->exec("ALTER TABLE cars ADD COLUMN hydrogen_km_per_kg REAL NULL");
  } else {
    $pdo->exec(
      "ALTER TABLE cars ADD COLUMN segment ENUM('gasoline_hybrid','plugin_ev') NOT NULL DEFAULT 'gasoline_hybrid' COMMENT 'リスト区分' AFTER id"
    );
    $pdo->exec(
      "ALTER TABLE cars ADD COLUMN powertrain ENUM('bev','phev','fcv') NULL COMMENT 'plugin_ev のみ' AFTER segment"
    );
    $pdo->exec(
      "ALTER TABLE cars ADD COLUMN electric_wh_per_km DECIMAL(7,2) NULL COMMENT '電費 Wh/km（BEV・PHEV）' AFTER fuel"
    );
    $pdo->exec(
      "ALTER TABLE cars ADD COLUMN hydrogen_km_per_kg DECIMAL(6,2) NULL COMMENT '水素費 km/kg' AFTER electric_wh_per_km"
    );
  }
  $pdo->exec("UPDATE cars SET segment = 'gasoline_hybrid'");
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
       WHERE segment = 'gasoline_hybrid'
         AND gasoline_powertrain IS NOT NULL
         AND gasoline_powertrain <> ''
         AND (powertrain IS NULL OR powertrain = '')"
    );
  }
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
