<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method Not Allowed']);
  exit;
}

require_once __DIR__ . '/../lib/cars_schema.php';

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$calcModeRaw = isset($input['calc_mode']) ? trim((string) $input['calc_mode']) : 'combustion';
$calcMode = normalize_stored_segment($calcModeRaw);
if ($calcMode === null) {
  http_response_code(400);
  echo json_encode(['error' => 'calc_mode は combustion または electric です（従来の gasoline_hybrid / plugin_ev も指定可能です）']);
  exit;
}

$distance = (int) ($input['distance'] ?? 0);
$insurance = (int) ($input['insurance'] ?? 0);
$parking = (int) ($input['parking'] ?? 0);
$engine_l = (float) ($input['engine'] ?? 0);
$inspection = (int) ($input['inspection'] ?? 0);
$price = (int) ($input['price'] ?? 0);
$ownership_years = (int) ($input['ownership_years'] ?? 10);

function getVehicleTax(int $engine_cc): int {
  if ($engine_cc <= 1000) {
    return 25000;
  }
  if ($engine_cc <= 1500) {
    return 30500;
  }
  if ($engine_cc <= 2000) {
    return 36000;
  }
  if ($engine_cc <= 2500) {
    return 43500;
  }
  if ($engine_cc <= 3000) {
    return 50000;
  }
  return 57000;
}

$engine_cc = (int) round($engine_l * 1000);
$tax = getVehicleTax($engine_cc);
$inspection_annual = (int) ($inspection / 2);
$parking_annual = $parking * 12;
$ownership_years = $ownership_years > 0 ? $ownership_years : 1;
$vehicle_annual = (int) round($price / $ownership_years);

if ($calcMode === 'combustion') {
  $fuel = (float) ($input['fuel'] ?? 0);
  $gas_price = (int) ($input['gas_price'] ?? 0);
  $gas_cost = $fuel > 0 ? (int) round($distance / $fuel * $gas_price) : 0;

  $total = $gas_cost + $tax + $inspection_annual + $insurance + $parking_annual;
  $monthly = (int) round($total / 12);
  $total_with_vehicle = $total + $vehicle_annual;
  $monthly_with_vehicle = (int) round($total_with_vehicle / 12);

  echo json_encode([
    'calc_mode' => 'combustion',
    'gas_cost' => $gas_cost,
    'tax' => $tax,
    'inspection_annual' => $inspection_annual,
    'insurance' => $insurance,
    'parking_annual' => $parking_annual,
    'total' => $total,
    'monthly' => $monthly,
    'vehicle_annual' => $vehicle_annual,
    'total_with_vehicle' => $total_with_vehicle,
    'monthly_with_vehicle' => $monthly_with_vehicle,
  ]);
  exit;
}

// electric（BEV / PHEV / FCV）
$powertrain = isset($input['powertrain']) ? strtolower(trim((string) $input['powertrain'])) : '';
if (!in_array($powertrain, ['bev', 'phev', 'fcv'], true)) {
  http_response_code(400);
  echo json_encode(['error' => 'powertrain は bev / phev / fcv のいずれかです']);
  exit;
}

$fuel = (float) ($input['fuel'] ?? 0);
$electric_wh_per_km = (float) ($input['electric_wh_per_km'] ?? 0);
$hydrogen_km_per_kg = (float) ($input['hydrogen_km_per_kg'] ?? 0);
$electricity_price = (int) ($input['electricity_price'] ?? 0);
$gas_price = (int) ($input['gas_price'] ?? 0);
$hydrogen_price = (int) ($input['hydrogen_price'] ?? 0);
$phev_ev_ratio = (float) ($input['phev_ev_ratio'] ?? 0.5);
if ($phev_ev_ratio < 0) {
  $phev_ev_ratio = 0;
}
if ($phev_ev_ratio > 1) {
  $phev_ev_ratio = 1;
}

$electricity_cost = 0;
$gasoline_cost = 0;
$hydrogen_cost = 0;

if ($powertrain === 'bev') {
  if ($electric_wh_per_km <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'electric_wh_per_km は正の数である必要があります']);
    exit;
  }
  $electricity_cost = (int) round(($distance * $electric_wh_per_km / 1000) * $electricity_price);
} elseif ($powertrain === 'fcv') {
  if ($hydrogen_km_per_kg <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'hydrogen_km_per_kg は正の数である必要があります']);
    exit;
  }
  $hydrogen_cost = (int) round($distance / $hydrogen_km_per_kg * $hydrogen_price);
} else {
  // phev
  if ($electric_wh_per_km <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'electric_wh_per_km は正の数である必要があります']);
    exit;
  }
  if ($fuel <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'PHEV では fuel（ガソリン時 km/L）が正の数である必要があります']);
    exit;
  }
  $d_ev = $distance * $phev_ev_ratio;
  $d_gas = $distance * (1 - $phev_ev_ratio);
  $electricity_cost = (int) round(($d_ev * $electric_wh_per_km / 1000) * $electricity_price);
  $gasoline_cost = (int) round($d_gas / $fuel * $gas_price);
}

$energy_cost = $electricity_cost + $gasoline_cost + $hydrogen_cost;

$total = $energy_cost + $tax + $inspection_annual + $insurance + $parking_annual;
$monthly = (int) round($total / 12);
$total_with_vehicle = $total + $vehicle_annual;
$monthly_with_vehicle = (int) round($total_with_vehicle / 12);

echo json_encode([
  'calc_mode' => 'electric',
  'powertrain' => $powertrain,
  'electricity_cost' => $electricity_cost,
  'gasoline_cost' => $gasoline_cost,
  'hydrogen_cost' => $hydrogen_cost,
  'energy_cost' => $energy_cost,
  'gas_cost' => 0,
  'tax' => $tax,
  'inspection_annual' => $inspection_annual,
  'insurance' => $insurance,
  'parking_annual' => $parking_annual,
  'total' => $total,
  'monthly' => $monthly,
  'vehicle_annual' => $vehicle_annual,
  'total_with_vehicle' => $total_with_vehicle,
  'monthly_with_vehicle' => $monthly_with_vehicle,
]);
