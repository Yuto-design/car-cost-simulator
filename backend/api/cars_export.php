<?php
header('Content-Type: text/csv; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  exit;
}

$segment = isset($_GET['segment']) ? trim((string) $_GET['segment']) : '';
if ($segment !== 'gasoline_hybrid' && $segment !== 'plugin_ev' && $segment !== 'all') {
  http_response_code(400);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'segment クエリに gasoline_hybrid / plugin_ev / all を指定してください']);
  exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/cars_schema.php';

if ($segment === 'all') {
  $filename = 'cars_all.csv';
} elseif ($segment === 'plugin_ev') {
  $filename = 'cars_plugin_ev.csv';
} else {
  $filename = 'cars_gasoline_hybrid.csv';
}
header('Content-Disposition: attachment; filename="' . $filename . '"');

$out = fopen('php://output', 'w');
if ($out === false) {
  http_response_code(500);
  exit;
}

fprintf($out, "\xEF\xBB\xBF");

try {
  $pdo = getPdo();
  ensure_cars_extended_columns($pdo);
  migrate_electric_km_per_kwh_to_wh_per_km($pdo);
  migrate_gasoline_powertrain_to_powertrain($pdo);

  if ($segment === 'all') {
    $stmt = $pdo->query(
      "SELECT segment, maker, model, powertrain, fuel, engine, price, inspection, " .
      "COALESCE(electric_wh_per_km, 0), COALESCE(hydrogen_km_per_kg, 0) FROM cars ORDER BY segment, maker, model"
    );
    fputcsv(
      $out,
      [
        'segment',
        'maker',
        'model',
        'powertrain',
        'fuel',
        'engine',
        'price',
        'inspection',
        'electric_wh_per_km',
        'hydrogen_km_per_kg',
      ],
      ',',
      '"',
      ''
    );
  } elseif ($segment === 'gasoline_hybrid') {
    $stmt = $pdo->query(
      "SELECT maker, model, powertrain, fuel, engine, price, inspection FROM cars WHERE segment = 'gasoline_hybrid' ORDER BY maker, model"
    );
    fputcsv($out, ['maker', 'model', 'powertrain', 'fuel', 'engine', 'price', 'inspection'], ',', '"', '');
  } else {
    $stmt = $pdo->query(
      "SELECT maker, model, powertrain, electric_wh_per_km, fuel, hydrogen_km_per_kg, engine, price, inspection FROM cars WHERE segment = 'plugin_ev' ORDER BY maker, model"
    );
    fputcsv(
      $out,
      ['maker', 'model', 'powertrain', 'electric_wh_per_km', 'fuel', 'hydrogen_km_per_kg', 'engine', 'price', 'inspection'],
      ',',
      '"',
      ''
    );
  }

  $rows = $stmt->fetchAll(PDO::FETCH_NUM);
  foreach ($rows as $row) {
    fputcsv($out, $row, ',', '"', '');
  }
} catch (PDOException $e) {
  fclose($out);
  http_response_code(500);
  exit;
}

fclose($out);
