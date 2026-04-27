<?php

require_once __DIR__ . '/cars_schema.php';

function get_vehicle_tax(int $engineCc): int {
  if ($engineCc <= 1000) {
    return 25000;
  }
  if ($engineCc <= 1500) {
    return 30500;
  }
  if ($engineCc <= 2000) {
    return 36000;
  }
  if ($engineCc <= 2500) {
    return 43500;
  }
  if ($engineCc <= 3000) {
    return 50000;
  }
  return 57000;
}

/**
 * @param array<string, mixed> $input
 * @return array<string, mixed>
 */
function calculate_car_cost(array $input): array {
  $calcModeRaw = isset($input['calc_mode']) ? trim((string) $input['calc_mode']) : 'combustion';
  $calcMode = normalize_stored_segment($calcModeRaw);
  if ($calcMode === null) {
    throw new InvalidArgumentException('calc_mode は combustion または electric です（従来の gasoline_hybrid / plugin_ev も指定可能です）');
  }

  $distance = (int) ($input['distance'] ?? 0);
  $insurance = (int) ($input['insurance'] ?? 0);
  $parking = (int) ($input['parking'] ?? 0);
  $engineL = (float) ($input['engine'] ?? 0);
  $inspection = (int) ($input['inspection'] ?? 0);
  $price = (int) ($input['price'] ?? 0);
  $ownershipYears = (int) ($input['ownership_years'] ?? 10);

  $engineCc = (int) round($engineL * 1000);
  $tax = get_vehicle_tax($engineCc);
  $inspectionAnnual = (int) ($inspection / 2);
  $parkingAnnual = $parking * 12;
  $ownershipYears = $ownershipYears > 0 ? $ownershipYears : 1;
  $vehicleAnnual = (int) round($price / $ownershipYears);

  if ($calcMode === 'combustion') {
    $fuel = (float) ($input['fuel'] ?? 0);
    $gasPrice = (int) ($input['gas_price'] ?? 0);
    $gasCost = $fuel > 0 ? (int) round($distance / $fuel * $gasPrice) : 0;

    $total = $gasCost + $tax + $inspectionAnnual + $insurance + $parkingAnnual;
    $monthly = (int) round($total / 12);
    $totalWithVehicle = $total + $vehicleAnnual;
    $monthlyWithVehicle = (int) round($totalWithVehicle / 12);

    return [
      'calc_mode' => 'combustion',
      'gas_cost' => $gasCost,
      'tax' => $tax,
      'inspection_annual' => $inspectionAnnual,
      'insurance' => $insurance,
      'parking_annual' => $parkingAnnual,
      'total' => $total,
      'monthly' => $monthly,
      'vehicle_annual' => $vehicleAnnual,
      'total_with_vehicle' => $totalWithVehicle,
      'monthly_with_vehicle' => $monthlyWithVehicle,
    ];
  }

  $powertrain = isset($input['powertrain']) ? strtolower(trim((string) $input['powertrain'])) : '';
  if (!in_array($powertrain, ['bev', 'phev', 'fcv'], true)) {
    throw new InvalidArgumentException('powertrain は bev / phev / fcv のいずれかです');
  }

  $fuel = (float) ($input['fuel'] ?? 0);
  $electricWhPerKm = (float) ($input['electric_wh_per_km'] ?? 0);
  $hydrogenKmPerKg = (float) ($input['hydrogen_km_per_kg'] ?? 0);
  $electricityPrice = (int) ($input['electricity_price'] ?? 0);
  $gasPrice = (int) ($input['gas_price'] ?? 0);
  $hydrogenPrice = (int) ($input['hydrogen_price'] ?? 0);
  $phevEvRatio = (float) ($input['phev_ev_ratio'] ?? 0.5);
  if ($phevEvRatio < 0) {
    $phevEvRatio = 0;
  }
  if ($phevEvRatio > 1) {
    $phevEvRatio = 1;
  }

  $electricityCost = 0;
  $gasolineCost = 0;
  $hydrogenCost = 0;

  if ($powertrain === 'bev') {
    if ($electricWhPerKm <= 0) {
      throw new InvalidArgumentException('electric_wh_per_km は正の数である必要があります');
    }
    $electricityCost = (int) round(($distance * $electricWhPerKm / 1000) * $electricityPrice);
  } elseif ($powertrain === 'fcv') {
    if ($hydrogenKmPerKg <= 0) {
      throw new InvalidArgumentException('hydrogen_km_per_kg は正の数である必要があります');
    }
    $hydrogenCost = (int) round($distance / $hydrogenKmPerKg * $hydrogenPrice);
  } else {
    if ($electricWhPerKm <= 0) {
      throw new InvalidArgumentException('electric_wh_per_km は正の数である必要があります');
    }
    if ($fuel <= 0) {
      throw new InvalidArgumentException('PHEV では fuel（ガソリン時 km/L）が正の数である必要があります');
    }
    $dEv = $distance * $phevEvRatio;
    $dGas = $distance * (1 - $phevEvRatio);
    $electricityCost = (int) round(($dEv * $electricWhPerKm / 1000) * $electricityPrice);
    $gasolineCost = (int) round($dGas / $fuel * $gasPrice);
  }

  $energyCost = $electricityCost + $gasolineCost + $hydrogenCost;
  $total = $energyCost + $tax + $inspectionAnnual + $insurance + $parkingAnnual;
  $monthly = (int) round($total / 12);
  $totalWithVehicle = $total + $vehicleAnnual;
  $monthlyWithVehicle = (int) round($totalWithVehicle / 12);

  return [
    'calc_mode' => 'electric',
    'powertrain' => $powertrain,
    'electricity_cost' => $electricityCost,
    'gasoline_cost' => $gasolineCost,
    'hydrogen_cost' => $hydrogenCost,
    'energy_cost' => $energyCost,
    'gas_cost' => 0,
    'tax' => $tax,
    'inspection_annual' => $inspectionAnnual,
    'insurance' => $insurance,
    'parking_annual' => $parkingAnnual,
    'total' => $total,
    'monthly' => $monthly,
    'vehicle_annual' => $vehicleAnnual,
    'total_with_vehicle' => $totalWithVehicle,
    'monthly_with_vehicle' => $monthlyWithVehicle,
  ];
}
