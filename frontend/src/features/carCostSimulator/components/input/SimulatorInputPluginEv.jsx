import { useState } from 'react'
import SpaSectionLead from '../../../../components/SpaSectionLead.jsx'
import CsvExportButton from '../../../../components/CsvExportButton.jsx'
import CsvImportButton from '../../../../components/CsvImportButton.jsx'
import CalcButton from '../../../../components/CalcButton.jsx'
import { carFieldMeta } from '../../../../schemas/carFields.js'
import ModelPickerModal from './ModelPickerModal.jsx'
import SimulatorInputModeSwitch from './SimulatorInputModeSwitch.jsx'
import { SEGMENT_ELECTRIC } from '../../segments.js'
import './SimulatorInput.css'

const PT_LABEL = { bev: 'BEV', phev: 'PHEV', fcv: '燃料電池（FCV）' }

export default function SimulatorInputPluginEv({
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
  powertrain,
  setPowertrain,
  electricWhPerKm,
  setElectricWhPerKm,
  hydrogenKmPerKg,
  setHydrogenKmPerKg,
  electricityPrice,
  setElectricityPrice,
  hydrogenPrice,
  setHydrogenPrice,
  phevEvRatio,
  setPhevEvRatio,
  onSelectInputMode,
}) {
  const [modelPickerOpen, setModelPickerOpen] = useState(false)

  const selectedModelLabel =
    modelOptions.find((model) => model.id === selectedCarId)?.label || '車種を選択'

  const handleMakerSelect = (e) => {
    onMakerChange(e)
    setModelPickerOpen(false)
  }

  const showElectric = powertrain === 'bev' || powertrain === 'phev'
  const showGasoline = powertrain === 'phev'
  const showHydrogen = powertrain === 'fcv'
  const showPhevRatio = powertrain === 'phev'

  return (
    <section className="form-section" id="simulation-input">
      <div className="form-section-header">
        <SpaSectionLead eyebrow="Input · BEV/PHEV/FCV">入力</SpaSectionLead>
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
      <SimulatorInputModeSwitch mode={SEGMENT_ELECTRIC} onSelectMode={onSelectInputMode} />
      <div className="input-block">
        <h3 className="input-block-title">車・スペック</h3>
        <p className="field-hint">
          メーカーと車種を選ぶと、車両価格・排気量・電費/水素費などが自動入力されます。数値はカタログ目安であり、手で修正できます。
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
            <select value={powertrain} onChange={(e) => setPowertrain(e.target.value)}>
              <option value="">選択してください</option>
              <option value="bev">{PT_LABEL.bev}</option>
              <option value="phev">{PT_LABEL.phev}</option>
              <option value="fcv">{PT_LABEL.fcv}</option>
            </select>
          </label>
          <label>
            車両価格（円）
            <input
              type="number"
              min="0"
              placeholder="例: 4800000"
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
              placeholder="例: 0"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              onBlur={onEngineBlur}
            />
          </label>
          {showElectric && (
            <label>
              電費（Wh/km）
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="例: 6.5"
                value={electricWhPerKm}
                onChange={(e) => setElectricWhPerKm(e.target.value)}
              />
            </label>
          )}
          {showGasoline && (
            <label>
              ガソリン時燃費（km/L）
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="例: 20.5"
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
              />
            </label>
          )}
          {showHydrogen && (
            <label>
              水素費（km/kg）
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="例: 80"
                value={hydrogenKmPerKg}
                onChange={(e) => setHydrogenKmPerKg(e.target.value)}
              />
            </label>
          )}
        </div>
      </div>
      <div className="input-block">
        <h3 className="input-block-title">走行・エネルギー単価</h3>
        <p className="field-hint">
          電気・水素・ガソリンの単価は契約・地域・時期で大きく変わります。PHEV の「電気で走る割合」は実走行と異なる場合があります。
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
          {showElectric && (
            <label>
              電気単価（円/kWh）
              <input
                type="number"
                min="0"
                step="1"
                placeholder="例: 27"
                value={electricityPrice}
                onChange={(e) => setElectricityPrice(e.target.value)}
              />
            </label>
          )}
          {showHydrogen && (
            <label>
              水素単価（円/kg）
              <input
                type="number"
                min="0"
                step="1"
                placeholder="例: 1200"
                value={hydrogenPrice}
                onChange={(e) => setHydrogenPrice(e.target.value)}
              />
            </label>
          )}
          {showGasoline && (
            <label>
              ガソリン価格（円/L）
              <input
                type="number"
                min="0"
                placeholder="例: 170"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
              />
            </label>
          )}
          {showPhevRatio && (
            <label>
              年間走行のうち電気で走る割合（0〜1）
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                placeholder="例: 0.5"
                value={phevEvRatio}
                onChange={(e) => setPhevEvRatio(Number(e.target.value))}
              />
            </label>
          )}
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
