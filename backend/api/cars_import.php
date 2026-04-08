<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  ob_end_clean();
  echo json_encode(['error' => 'Method Not Allowed']);
  exit;
}

require_once __DIR__ . '/../lib/cars_schema.php';

$segment = isset($_GET['segment']) ? trim((string) $_GET['segment']) : (isset($_POST['segment']) ? trim((string) $_POST['segment']) : '');
$segLower = strtolower($segment);
$importScope = null;
if ($segLower === 'all') {
  $importScope = 'all';
} elseif (($norm = normalize_stored_segment($segLower)) !== null) {
  $importScope = $norm;
} else {
  http_response_code(400);
  ob_end_clean();
  echo json_encode(['error' => 'segment に combustion / electric / all を指定してください（従来の gasoline_hybrid / plugin_ev も可）']);
  exit;
}

if (!isset($_FILES['csv']) || $_FILES['csv']['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400);
  ob_end_clean();
  echo json_encode(['error' => 'CSVファイルを選択してください']);
  exit;
}

$tmpPath = $_FILES['csv']['tmp_name'];
$handle = fopen($tmpPath, 'r');
if ($handle === false) {
  http_response_code(400);
  ob_end_clean();
  echo json_encode(['error' => 'ファイルを開けませんでした']);
  exit;
}

$firstRow = fgetcsv($handle, 0, ',', '"', '');
if ($firstRow === false) {
  fclose($handle);
  http_response_code(400);
  ob_end_clean();
  echo json_encode(['error' => 'CSVが空です']);
  exit;
}
$header = array_map('trim', $firstRow);
if (isset($header[0]) && substr($header[0], 0, 3) === "\xEF\xBB\xBF") {
  $header[0] = ltrim($header[0], "\xEF\xBB\xBF");
}
$headerLower = array_map('strtolower', $header);

if ($importScope === 'all') {
  $expected = [
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
  ];
  $expectedMsg = implode(',', $expected);
} elseif ($importScope === 'combustion') {
  $expected = ['maker', 'model', 'powertrain', 'fuel', 'engine', 'price', 'inspection'];
  $expectedMsg = 'maker,model,powertrain,fuel,engine,price,inspection';
} else {
  $expected = ['maker', 'model', 'powertrain', 'electric_wh_per_km', 'fuel', 'hydrogen_km_per_kg', 'engine', 'price', 'inspection'];
  $expectedMsg = 'maker,model,powertrain,electric_wh_per_km,fuel,hydrogen_km_per_kg,engine,price,inspection';
}

foreach ($expected as $col) {
  if (!in_array($col, $headerLower, true)) {
    fclose($handle);
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['error' => "CSVの1行目は {$expectedMsg} である必要があります"]);
    exit;
  }
}

$idx = [];
foreach ($expected as $col) {
  $idx[$col] = array_search($col, $headerLower, true);
}

require_once __DIR__ . '/../config/database.php';

try {
  $pdo = getPdo();
  ensure_cars_extended_columns($pdo);
  migrate_electric_km_per_kwh_to_wh_per_km($pdo);
  migrate_gasoline_powertrain_to_powertrain($pdo);
  migrate_gasoline_hybrid_null_energy_to_zero($pdo);

  $stmtGh = $pdo->prepare(
    'INSERT INTO cars (maker, model, powertrain, fuel, engine, price, inspection, segment, electric_wh_per_km, hydrogen_km_per_kg) VALUES (?, ?, ?, ?, ?, ?, ?, \'combustion\', 0, 0)'
  );
  $stmtPe = $pdo->prepare(
    'INSERT INTO cars (maker, model, powertrain, fuel, electric_wh_per_km, hydrogen_km_per_kg, engine, price, inspection, segment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, \'electric\')'
  );

  $pdo->beginTransaction();

  if ($importScope === 'all') {
    $pdo->exec('DELETE FROM cars');
  } else {
    $segQuoted = $pdo->quote($importScope);
    $pdo->exec("DELETE FROM cars WHERE segment = {$segQuoted}");
  }

  $imported = 0;
  $lineNum = 1;
  $maxIdx = max($idx);

  while (($row = fgetcsv($handle, 0, ',', '"', '')) !== false) {
    $lineNum++;
    if (count($row) <= $maxIdx) {
      if (trim(implode('', $row)) === '') {
        continue;
      }
      $pdo->rollBack();
      fclose($handle);
      http_response_code(400);
      ob_end_clean();
      echo json_encode(['error' => "{$lineNum}行目: 列数が不足しています"]);
      exit;
    }

    $maker = trim($row[$idx['maker']] ?? '');
    $model = trim($row[$idx['model']] ?? '');
    if ($maker === '' && $model === '' && trim(implode('', $row)) === '') {
      continue;
    }

    if ($maker === '') {
      $pdo->rollBack();
      fclose($handle);
      ob_end_clean();
      echo json_encode(['error' => "{$lineNum}行目: メーカー名が空です"]);
      exit;
    }
    if ($model === '') {
      $pdo->rollBack();
      fclose($handle);
      ob_end_clean();
      echo json_encode(['error' => "{$lineNum}行目: 車種名が空です"]);
      exit;
    }

    if ($importScope === 'all') {
      $rowSegRaw = strtolower(trim($row[$idx['segment']] ?? ''));
      $rowSeg = normalize_stored_segment($rowSegRaw);
      if ($rowSeg === null) {
        $pdo->rollBack();
        fclose($handle);
        ob_end_clean();
        echo json_encode(['error' => "{$lineNum}行目: segment は combustion または electric です（従来の gasoline_hybrid / plugin_ev も可）"]);
        exit;
      }
    } else {
      $rowSeg = $importScope;
    }

    if ($rowSeg === 'combustion') {
      $ptGhRaw = trim($row[$idx['powertrain']] ?? '');
      $fuelRaw = trim($row[$idx['fuel']] ?? '');
      $engineRaw = trim($row[$idx['engine']] ?? '');
      $priceRaw = trim($row[$idx['price']] ?? '');
      $inspectionRaw = isset($row[$idx['inspection']]) ? trim($row[$idx['inspection']]) : '';

      $ptRawNormalized = strtolower($ptGhRaw);
      if (!in_array($ptRawNormalized, ['gasoline', 'hybrid', 'diesel'], true)) {
        $pdo->rollBack();
        fclose($handle);
        ob_end_clean();
        echo json_encode(['error' => "{$lineNum}行目: powertrain は gasoline / hybrid / diesel のいずれかです"]);
        exit;
      }

      if ($fuelRaw === '' || !is_numeric($fuelRaw) || (float) $fuelRaw < 0) {
        $pdo->rollBack();
        fclose($handle);
        ob_end_clean();
        echo json_encode(['error' => "{$lineNum}行目: 燃費は0以上の数で入力してください"]);
        exit;
      }
      if ($engineRaw === '' || !is_numeric($engineRaw) || (float) $engineRaw < 0 || (float) $engineRaw > 20) {
        $pdo->rollBack();
        fclose($handle);
        ob_end_clean();
        echo json_encode(['error' => "{$lineNum}行目: 排気量は0以上20以下の数（L）で入力してください"]);
        exit;
      }
      if ($priceRaw === '' || !is_numeric($priceRaw) || (int) $priceRaw < 0) {
        $pdo->rollBack();
        fclose($handle);
        ob_end_clean();
        echo json_encode(['error' => "{$lineNum}行目: 車両価格は0以上の数で入力してください"]);
        exit;
      }

      $fuel = (float) $fuelRaw;
      $engine = round((float) $engineRaw, 3);
      $price = (int) $priceRaw;
      $inspection = $inspectionRaw === '' ? null : (int) $inspectionRaw;
      if ($inspection !== null && $inspection < 0) {
        $inspection = null;
      }

      $stmtGh->execute([$maker, $model, $ptRawNormalized, $fuel, $engine, $price, $inspection]);
    } else {
      $ptRaw = strtolower(trim($row[$idx['powertrain']] ?? ''));
      $elecRaw = trim($row[$idx['electric_wh_per_km']] ?? '');
      $fuelRaw = trim($row[$idx['fuel']] ?? '');
      $hydRaw = trim($row[$idx['hydrogen_km_per_kg']] ?? '');
      $engineRaw = trim($row[$idx['engine']] ?? '');
      $priceRaw = trim($row[$idx['price']] ?? '');
      $inspectionRaw = isset($row[$idx['inspection']]) ? trim($row[$idx['inspection']]) : '';

      if (!in_array($ptRaw, ['bev', 'phev', 'fcv'], true)) {
        $pdo->rollBack();
        fclose($handle);
        ob_end_clean();
        echo json_encode(['error' => "{$lineNum}行目: powertrain は bev / phev / fcv のいずれかです"]);
        exit;
      }

      if ($fuelRaw === '' || !is_numeric($fuelRaw) || (float) $fuelRaw < 0) {
        $pdo->rollBack();
        fclose($handle);
        ob_end_clean();
        echo json_encode(['error' => "{$lineNum}行目: fuel（ガソリン時 km/L）は0以上の数で入力してください"]);
        exit;
      }
      if ($engineRaw === '' || !is_numeric($engineRaw) || (float) $engineRaw < 0 || (float) $engineRaw > 20) {
        $pdo->rollBack();
        fclose($handle);
        ob_end_clean();
        echo json_encode(['error' => "{$lineNum}行目: 排気量は0以上20以下の数（L）で入力してください"]);
        exit;
      }
      if ($priceRaw === '' || !is_numeric($priceRaw) || (int) $priceRaw < 0) {
        $pdo->rollBack();
        fclose($handle);
        ob_end_clean();
        echo json_encode(['error' => "{$lineNum}行目: 車両価格は0以上の数で入力してください"]);
        exit;
      }

      $elec = $elecRaw === '' ? null : (float) $elecRaw;
      $hyd = $hydRaw === '' ? null : (float) $hydRaw;
      $fuel = (float) $fuelRaw;
      $engine = round((float) $engineRaw, 3);
      $price = (int) $priceRaw;
      $inspection = $inspectionRaw === '' ? null : (int) $inspectionRaw;
      if ($inspection !== null && $inspection < 0) {
        $inspection = null;
      }

      if ($ptRaw === 'bev') {
        if ($elec === null || $elec <= 0) {
          $pdo->rollBack();
          fclose($handle);
          ob_end_clean();
          echo json_encode(['error' => "{$lineNum}行目: BEV は electric_wh_per_km（Wh/km）に正の数が必要です"]);
          exit;
        }
      } elseif ($ptRaw === 'phev') {
        if ($elec === null || $elec <= 0) {
          $pdo->rollBack();
          fclose($handle);
          ob_end_clean();
          echo json_encode(['error' => "{$lineNum}行目: PHEV は electric_wh_per_km（Wh/km）に正の数が必要です"]);
          exit;
        }
        if ($fuel <= 0) {
          $pdo->rollBack();
          fclose($handle);
          ob_end_clean();
          echo json_encode(['error' => "{$lineNum}行目: PHEV は fuel（ガソリン時 km/L）に正の数が必要です"]);
          exit;
        }
      } else {
        if ($hyd === null || $hyd <= 0) {
          $pdo->rollBack();
          fclose($handle);
          ob_end_clean();
          echo json_encode(['error' => "{$lineNum}行目: FCV は hydrogen_km_per_kg に正の数が必要です"]);
          exit;
        }
      }

      $stmtPe->execute([$maker, $model, $ptRaw, $fuel, $elec, $hyd, $engine, $price, $inspection]);
    }

    $imported++;
  }

  $pdo->commit();
  fclose($handle);
  ob_end_clean();
  echo json_encode(['success' => true, 'imported' => $imported]);
} catch (PDOException $e) {
  if (isset($pdo) && $pdo->inTransaction()) {
    $pdo->rollBack();
  }
  if (isset($handle) && is_resource($handle)) {
    fclose($handle);
  }
  http_response_code(500);
  ob_end_clean();
  echo json_encode(['error' => 'データベースエラー', 'detail' => $e->getMessage()]);
}
