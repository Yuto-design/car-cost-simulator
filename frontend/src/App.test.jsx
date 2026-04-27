import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SEGMENT_COMBUSTION } from './features/carCostSimulator/segments.js'

const hookMock = vi.fn()

vi.mock('./features/carCostSimulator/hooks/useCarCostSimulator.js', () => ({
  useCarCostSimulator: () => hookMock(),
}))

vi.mock('./features/app/components/layout/AppHeader.jsx', () => ({
  default: () => <div>AppHeader</div>,
}))
vi.mock('./features/app/components/layout/AppFooter.jsx', () => ({
  default: () => <div>AppFooter</div>,
}))
vi.mock('./features/app/components/layout/SpaLeftNav.jsx', () => ({
  default: () => <div>SpaLeftNav</div>,
}))
vi.mock('./features/carCostSimulator/components/intro/SimulatorIntro.jsx', () => ({
  default: () => <div>SimulatorIntro</div>,
}))
vi.mock('./features/carCostSimulator/components/input/SimulatorInputGasolineHybrid.jsx', () => ({
  default: () => <div>SimulatorInputGasolineHybrid</div>,
}))
vi.mock('./features/carCostSimulator/components/input/SimulatorInputPluginEv.jsx', () => ({
  default: () => <div>SimulatorInputPluginEv</div>,
}))
vi.mock('./features/carCostSimulator/components/compare/ComparisonPage.jsx', () => ({
  default: () => <div>ComparisonPage</div>,
}))
vi.mock('./features/carCostSimulator/components/result/ResultSectionGasolineHybrid.jsx', () => ({
  default: () => <div>ResultSectionGasolineHybrid</div>,
}))
vi.mock('./features/carCostSimulator/components/result/ResultSectionPluginEv.jsx', () => ({
  default: () => <div>ResultSectionPluginEv</div>,
}))

import App from './App.jsx'

function buildHookValue(overrides = {}) {
  const mergedState = {
    activeView: 'intro',
    simulatorMode: SEGMENT_COMBUSTION,
    selectedCarId: '',
    distance: 10000,
    gasPrice: 170,
    insurance: 80000,
    parking: 5000,
    inspection: 100000,
    ownershipYears: 5,
    fuel: '',
    engine: '',
    price: '',
    result: null,
    loading: false,
    error: null,
    importMessage: null,
    importLoading: false,
    selectedMaker: '',
    powertrain: '',
    electricWhPerKm: '',
    hydrogenKmPerKg: '',
    electricityPrice: 27,
    hydrogenPrice: 1200,
    phevEvRatio: 0.5,
    comparisonItems: [],
    ...overrides.state,
  }

  return {
    state: mergedState,
    selectedCarName: '',
    fileInputRef: { current: null },
    makerOptions: [],
    modelOptions: [],
    handleMakerChange: vi.fn(),
    handleModelChipSelect: vi.fn(),
    handleCalculate: vi.fn(),
    handleExportCsv: vi.fn(),
    handleImportCsv: vi.fn(),
    addCurrentResultToComparison: vi.fn(),
    removeComparisonItem: vi.fn(),
    clearComparisonItems: vi.fn(),
    downloadComparisonCsv: vi.fn(),
    handleEngineBlur: vi.fn(),
    navigateToFooterSection: vi.fn(),
    selectSimulatorMode: vi.fn(),
    setActiveView: vi.fn(),
    patch: vi.fn(),
  }
}

describe('App', () => {
  it('activeViewがintroのとき概要を表示する', () => {
    hookMock.mockReturnValue(buildHookValue())
    render(<App />)
    expect(screen.getByText('SimulatorIntro')).toBeInTheDocument()
  })

  it('activeViewがcompareのとき比較画面を表示する', () => {
    hookMock.mockReturnValue(buildHookValue({ state: { activeView: 'compare' } }))
    render(<App />)
    expect(screen.getByText('ComparisonPage')).toBeInTheDocument()
  })

  it('resultがないresultビューでは案内文を表示する', () => {
    hookMock.mockReturnValue(buildHookValue({ state: { activeView: 'result', result: null } }))
    render(<App />)
    expect(screen.getByText('先に入力画面で計算を実行してください。')).toBeInTheDocument()
  })
})
