/** 車リスト・シミュレーター区分（DB/API と同一の単一トークン） */
export const SEGMENT_COMBUSTION = 'combustion'
export const SEGMENT_ELECTRIC = 'electric'

/** 比較リスト等に残る旧 calc_mode / segment との互換 */
export function isElectricSegment(mode) {
  return mode === SEGMENT_ELECTRIC || mode === 'plugin_ev'
}

export function isCombustionSegment(mode) {
  return mode === SEGMENT_COMBUSTION || mode === 'gasoline_hybrid'
}
