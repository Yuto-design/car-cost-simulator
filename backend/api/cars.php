<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['error' => 'Method Not Allowed']);
  exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/cars_schema.php';

$segment = isset($_GET['segment']) ? trim((string) $_GET['segment']) : '';
$allowed = ['gasoline_hybrid', 'plugin_ev', ''];
if ($segment !== '' && !in_array($segment, ['gasoline_hybrid', 'plugin_ev'], true)) {
  http_response_code(400);
  echo json_encode(['error' => 'segment は gasoline_hybrid または plugin_ev です']);
  exit;
}

try {
  $pdo = getPdo();
  ensure_cars_extended_columns($pdo);
  migrate_electric_km_per_kwh_to_wh_per_km($pdo);
  migrate_gasoline_powertrain_to_powertrain($pdo);
  migrate_gasoline_hybrid_null_energy_to_zero($pdo);

  $sql = 'SELECT id, segment, powertrain, maker, model, fuel, electric_wh_per_km, hydrogen_km_per_kg, engine, price, inspection FROM cars';
  if ($segment === 'gasoline_hybrid' || $segment === 'plugin_ev') {
    $sql .= ' WHERE segment = ' . $pdo->quote($segment);
  }
  $sql .= ' ORDER BY maker, model';

  $stmt = $pdo->query($sql);
  $cars = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($cars);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Database error']);
}
