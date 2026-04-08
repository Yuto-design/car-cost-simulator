import { useState } from 'react'
import SpaSectionLead from '../../../../components/SpaSectionLead.jsx'
import CsvExportButton from '../../../../components/CsvExportButton.jsx'
import CsvImportButton from '../../../../components/CsvImportButton.jsx'
import CalcButton from '../../../../components/CalcButton.jsx'
import { carFieldMeta } from '../../../../schemas/carFields.js'
import ModelPickerModal from './ModelPickerModal.jsx'
import SimulatorInputModeSwitch from './SimulatorInputModeSwitch.jsx'
import { SEGMENT_COMBUSTION } from '../../segments.js'
import './SimulatorInput.css'

const GH_PT_LABEL = { gasoline: 'ガソリン', hybrid: 'ハイブリッド', diesel: 'ディーゼル' }

export default function SimulatorInputGasolineHybrid({
  fileInputRef,
  importLoading,
  importMessage,
  onExportCsv,
  onImportCsv,
  selectedMaker,
  makerOptions,
  onMakerChange,
  modelOptions,
  onModelChipSelect,
  selectedCarId,
  distance,
  setDistance,
  fuel,
  setFuel,
  gasPrice,
  setGasPrice,
  price,
  setPrice,
  engine,
  setEngine,
  onEngineBlur,
  powertrain,
  setPowertrain,
  insurance,
  setInsurance,
  parking,
  setParking,
  inspection,
  setInspection,
  ownershipYears,
  setOwnershipYears,
  onCalculate,
  loading,
  onSelectInputMode,
}) {
  const [modelPickerOpen, setModelPickerOpen] = useState(false)

  const selectedModelLabel =
    modelOptions.find((model) => model.id === selectedCarId)?.label || '車種を選択'

  const handleMakerSelect = (e) => {
    onMakerChange(e)
    setModelPickerOpen(false)
  }

  return (
    <section className="form-section" id="simulation-input">
      <div className="form-section-header">
        <SpaSectionLead eyebrow="Input · ガソリン/HEV">入力</SpaSectionLead>
        <div className="csv-tools">
          <CsvExportButton onClick={onExportCsv} />
          <CsvImportButton
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onImportCsv}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      <SimulatorInputModeSwitch mode={SEGMENT_COMBUSTION} onSelectMode={onSelectInputMode} />
      <div className="input-block">
        <h3 className="input-block-title">車・スペック</h3>
        <p className="field-hint">
          メーカーから車種を選ぶと、車両価格・排気量・燃費などが自動入力されます。
        </p>
        <div className="form-grid form-grid--car-spec">
          <label className="car-spec-row-wide">
            メーカー
            <select value={selectedMaker} onChange={handleMakerSelect}>
              <option value="">メーカーを選択</option>
              {makerOptions.map((maker) => (
                <option key={maker} value={maker}>
                  {maker}
                </option>
              ))}
            </select>
          </label>
          {selectedMaker && (
            <label className="car-spec-row-wide model-select-row model-select-row--appear">
              車種（選択）
              <button
                type="button"
                className="model-picker-trigger"
                onClick={() => setModelPickerOpen(true)}
                disabled={modelOptions.length === 0}
              >
                {selectedModelLabel}
              </button>
            </label>
          )}
          <label>
            区分
            <select
              value={powertrain}
              onChange={(e) => setPowertrain(e.target.value)}
            >
              <option value="">選択してください</option>
              <option value="gasoline">{GH_PT_LABEL.gasoline}</option>
              <option value="hybrid">{GH_PT_LABEL.hybrid}</option>
              <option value="diesel">{GH_PT_LABEL.diesel}</option>
            </select>
          </label>
          <label>
            車両価格（円）
            <input
              type="number"
              min="0"
              placeholder="例: 2500000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label>
            排気量（L）
            <input
              type="number"
              min="0"
              step="0.001"
              placeholder="例: 1.500"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              onBlur={onEngineBlur}
            />
          </label>
          <label>
            燃費（km/L）
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="例: 20.5"
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="input-block">
        <h3 className="input-block-title">走行・ガソリン</h3>
        <p className="field-hint">
          ガソリン価格は地域や時期で変わるため、入力値は目安の例です。
        </p>
        <div className="form-grid">
          <label>
            年間走行距離（km）
            <input
              type="number"
              min="0"
              max={carFieldMeta.distance.max}
              step={carFieldMeta.distance.step}
              placeholder="例: 10000"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </label>
          <label>
            ガソリン価格（円/L）
            <input
              type="number"
              min="0"
              placeholder="例: 170（相場は変動します）"
              value={gasPrice}
              onChange={(e) => setGasPrice(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="input-block">
        <h3 className="input-block-title">毎年かかるお金</h3>
        <div className="form-grid">
          <label>
            任意保険（円/年）
            <input
              type="number"
              min="0"
              placeholder="例: 80000"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
            />
          </label>
          <label>
            駐車場（円/月）
            <input
              type="number"
              min="0"
              placeholder="例: 5000"
              value={parking}
              onChange={(e) => setParking(e.target.value)}
            />
          </label>
          <label>
            車検費用（2年分・円）
            <input
              type="number"
              min="0"
              placeholder="例: 100000（2年分の目安）"
              value={inspection}
              onChange={(e) => setInspection(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="input-block">
        <h3 className="input-block-title">シミュレーションの前提</h3>
        <div className="form-grid">
          <label>
            保有年数（年）
            <input
              type="number"
              min="1"
              step="1"
              placeholder="例: 5"
              value={ownershipYears}
              onChange={(e) => setOwnershipYears(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="form-actions">
        <CalcButton onClick={onCalculate} loading={loading} />
      </div>
      {importMessage && (
        <p className={importMessage.type === 'success' ? 'import-success' : 'error'}>
          {importMessage.text}
        </p>
      )}
      <ModelPickerModal
        open={modelPickerOpen}
        onClose={() => setModelPickerOpen(false)}
        modelOptions={modelOptions}
        selectedCarId={selectedCarId}
        onPick={(id) => {
          onModelChipSelect(id)
          setModelPickerOpen(false)
        }}
      />
    </section>
  )
}
