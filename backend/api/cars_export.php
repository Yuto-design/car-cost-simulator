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

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/cars_schema.php';

$segment = isset($_GET['segment']) ? trim((string) $_GET['segment']) : '';
$segLower = strtolower($segment);
$exportScope = null;
if ($segLower === 'all') {
  $exportScope = 'all';
} elseif (($norm = normalize_stored_segment($segLower)) !== null) {
  $exportScope = $norm;
} else {
  http_response_code(400);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'segment クエリに combustion / electric / all を指定してください（従来の gasoline_hybrid / plugin_ev も可）']);
  exit;
}

if ($exportScope === 'all') {
  $filename = 'cars_all.csv';
} elseif ($exportScope === 'electric') {
  $filename = 'cars_electric.csv';
} else {
  $filename = 'cars_combustion.csv';
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
  migrate_gasoline_hybrid_null_energy_to_zero($pdo);

  if ($exportScope === 'all') {
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
  } elseif ($exportScope === 'combustion') {
    $stmt = $pdo->query(
      "SELECT maker, model, powertrain, fuel, engine, price, inspection FROM cars WHERE segment = 'combustion' ORDER BY maker, model"
    );
    fputcsv($out, ['maker', 'model', 'powertrain', 'fuel', 'engine', 'price', 'inspection'], ',', '"', '');
  } else {
    $stmt = $pdo->query(
      "SELECT maker, model, powertrain, electric_wh_per_km, fuel, hydrogen_km_per_kg, engine, price, inspection FROM cars WHERE segment = 'electric' ORDER BY maker, model"
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
