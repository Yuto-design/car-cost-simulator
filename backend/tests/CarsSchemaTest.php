<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class CarsSchemaTest extends TestCase {
  public function testNormalizeStoredSegmentSupportsLegacyValues(): void {
    $this->assertSame('combustion', normalize_stored_segment('combustion'));
    $this->assertSame('combustion', normalize_stored_segment('gasoline_hybrid'));
    $this->assertSame('electric', normalize_stored_segment('electric'));
    $this->assertSame('electric', normalize_stored_segment('plugin_ev'));
    $this->assertNull(normalize_stored_segment('unknown'));
  }
}
