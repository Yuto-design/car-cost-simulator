<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class CalcServiceTest extends TestCase {
  public function testCombustionCalculationReturnsExpectedTotals(): void {
    $result = calculate_car_cost([
      'calc_mode' => 'combustion',
      'distance' => 10000,
      'fuel' => 20,
      'gas_price' => 180,
      'insurance' => 80000,
      'parking' => 5000,
      'engine' => 1.5,
      'inspection' => 100000,
      'price' => 3000000,
      'ownership_years' => 5,
    ]);

    $this->assertSame('combustion', $result['calc_mode']);
    $this->assertSame(90000, $result['gas_cost']);
    $this->assertSame(30500, $result['tax']);
    $this->assertSame(60000, $result['parking_annual']);
    $this->assertSame(310500, $result['total']);
    $this->assertSame(25875, $result['monthly']);
  }

  public function testBevCalculationReturnsEnergyAndTotals(): void {
    $result = calculate_car_cost([
      'calc_mode' => 'electric',
      'powertrain' => 'bev',
      'distance' => 12000,
      'electric_wh_per_km' => 140,
      'electricity_price' => 31,
      'insurance' => 70000,
      'parking' => 8000,
      'engine' => 0,
      'inspection' => 100000,
      'price' => 4200000,
      'ownership_years' => 7,
    ]);

    $this->assertSame('electric', $result['calc_mode']);
    $this->assertSame('bev', $result['powertrain']);
    $this->assertSame(52080, $result['electricity_cost']);
    $this->assertSame(0, $result['gasoline_cost']);
    $this->assertSame(0, $result['hydrogen_cost']);
    $this->assertSame(293080, $result['total']);
  }

  public function testPhevRequiresPositiveFuel(): void {
    $this->expectException(InvalidArgumentException::class);
    $this->expectExceptionMessage('PHEV では fuel（ガソリン時 km/L）が正の数である必要があります');

    calculate_car_cost([
      'calc_mode' => 'electric',
      'powertrain' => 'phev',
      'distance' => 10000,
      'electric_wh_per_km' => 160,
      'fuel' => 0,
    ]);
  }

  public function testFcvRequiresPositiveHydrogenKmPerKg(): void {
    $this->expectException(InvalidArgumentException::class);
    $this->expectExceptionMessage('hydrogen_km_per_kg は正の数である必要があります');

    calculate_car_cost([
      'calc_mode' => 'electric',
      'powertrain' => 'fcv',
      'distance' => 10000,
      'hydrogen_km_per_kg' => 0,
    ]);
  }
}
