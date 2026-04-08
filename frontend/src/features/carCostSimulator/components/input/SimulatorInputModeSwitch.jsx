import { SEGMENT_COMBUSTION, SEGMENT_ELECTRIC } from '../../segments.js'

/**
 * @param {object} props
 * @param {'combustion' | 'electric'} props.mode
 * @param {(mode: 'combustion' | 'electric') => void} props.onSelectMode
 */
export default function SimulatorInputModeSwitch({ mode, onSelectMode }) {
  return (
    <div className="input-mode-switch" role="tablist" aria-label="入力画面の区分">
      <button
        type="button"
        role="tab"
        aria-selected={mode === SEGMENT_COMBUSTION}
        className={`input-mode-switch__btn${mode === SEGMENT_COMBUSTION ? ' is-active' : ''}`}
        onClick={() => onSelectMode(SEGMENT_COMBUSTION)}
      >
        ガソリン・HEV
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === SEGMENT_ELECTRIC}
        className={`input-mode-switch__btn${mode === SEGMENT_ELECTRIC ? ' is-active' : ''}`}
        onClick={() => onSelectMode(SEGMENT_ELECTRIC)}
      >
        BEV・PHEV・FCV
      </button>
    </div>
  )
}
