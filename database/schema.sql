CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  segment TEXT NOT NULL DEFAULT 'gasoline_hybrid',
  powertrain TEXT NULL,
  maker TEXT NOT NULL,
  model TEXT NOT NULL,
  fuel REAL NOT NULL,
  electric_wh_per_km REAL NULL,
  hydrogen_km_per_kg REAL NULL,
  engine REAL NOT NULL,
  price INTEGER NOT NULL,
  inspection INTEGER NULL
);
