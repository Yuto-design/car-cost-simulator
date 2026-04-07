/**
 * @typedef {Object} Car
 * @property {string|number} id
 * @property {string} [segment]
 * @property {string} [powertrain]
 * @property {string} [maker]
 * @property {string} [model]
 * @property {string} [name]
 * @property {number|string} [fuel]
 * @property {number|string} [electric_wh_per_km]
 * @property {number|string} [hydrogen_km_per_kg]
 * @property {number|string} [engine]
 * @property {number|string} [price]
 * @property {number} [inspection]
 */

/**
 * @typedef {Object} CalcResultGasolineHybrid
 * @property {'gasoline_hybrid'} calc_mode
 * @property {number} total
 * @property {number} monthly
 * @property {number} vehicle_annual
 * @property {number} total_with_vehicle
 * @property {number} monthly_with_vehicle
 * @property {number} gas_cost
 * @property {number} tax
 * @property {number} inspection_annual
 * @property {number} insurance
 * @property {number} parking_annual
 */

/**
 * @typedef {Object} CalcResultPluginEv
 * @property {'plugin_ev'} calc_mode
 * @property {'bev'|'phev'|'fcv'} powertrain
 * @property {number} electricity_cost
 * @property {number} gasoline_cost
 * @property {number} hydrogen_cost
 * @property {number} energy_cost
 * @property {number} gas_cost
 * @property {number} total
 * @property {number} monthly
 * @property {number} vehicle_annual
 * @property {number} total_with_vehicle
 * @property {number} monthly_with_vehicle
 * @property {number} tax
 * @property {number} inspection_annual
 * @property {number} insurance
 * @property {number} parking_annual
 */

/**
 * @typedef {CalcResultGasolineHybrid|CalcResultPluginEv} CalcResult
 */

/**
 * @typedef {Object} ResultAssumptions
 * @property {string} [carName]
 * @property {string|number} [distance]
 * @property {string|number} [fuel]
 * @property {string|number} [gasPrice]
 * @property {string|number} [engine]
 * @property {string|number} [price]
 * @property {string|number} [insurance]
 * @property {string|number} [parking]
 * @property {string|number} [inspection]
 * @property {string|number} [ownershipYears]
 */

/**
 * @typedef {Object} ResultAssumptionsPluginEv
 * @property {string} [carName]
 * @property {string|number} [distance]
 * @property {string|number} [fuel]
 * @property {string|number} [gasPrice]
 * @property {string|number} [engine]
 * @property {string|number} [price]
 * @property {string|number} [insurance]
 * @property {string|number} [parking]
 * @property {string|number} [inspection]
 * @property {string|number} [ownershipYears]
 * @property {string} [powertrain]
 * @property {string|number} [electricWhPerKm]
 * @property {string|number} [hydrogenKmPerKg]
 * @property {string|number} [electricityPrice]
 * @property {string|number} [hydrogenPrice]
 * @property {string|number} [phevEvRatio]
 */

export {}
