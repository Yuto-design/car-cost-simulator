import './App.css'
import AppHeader from './features/app/components/layout/AppHeader.jsx'
import AppFooter from './features/app/components/layout/AppFooter.jsx'
import SpaLeftNav from './features/app/components/layout/SpaLeftNav.jsx'
import SimulatorIntro from './features/carCostSimulator/components/intro/SimulatorIntro.jsx'
import SimulatorInputGasolineHybrid from './features/carCostSimulator/components/input/SimulatorInputGasolineHybrid.jsx'
import SimulatorInputPluginEv from './features/carCostSimulator/components/input/SimulatorInputPluginEv.jsx'
import ComparisonPage from './features/carCostSimulator/components/compare/ComparisonPage.jsx'
import ResultSectionGasolineHybrid from './features/carCostSimulator/components/result/ResultSectionGasolineHybrid.jsx'
import ResultSectionPluginEv from './features/carCostSimulator/components/result/ResultSectionPluginEv.jsx'
import { useCarCostSimulator } from './features/carCostSimulator/hooks/useCarCostSimulator.js'
import {
  SEGMENT_COMBUSTION,
  SEGMENT_ELECTRIC,
  isElectricSegment,
} from './features/carCostSimulator/segments.js'

function App() {
  const {
    state,
    selectedCarName,
    fileInputRef,
    makerOptions,
    modelOptions,
    handleMakerChange,
    handleModelChipSelect,
    handleCalculate,
    handleExportCsv,
    handleImportCsv,
    addCurrentResultToComparison,
    removeComparisonItem,
    clearComparisonItems,
    downloadComparisonCsv,
    handleEngineBlur,
    navigateToFooterSection,
    selectSimulatorMode,
    setActiveView,
    patch,
  } = useCarCostSimulator()

  const {
    activeView,
    simulatorMode,
    selectedCarId,
    distance,
    gasPrice,
    insurance,
    parking,
    inspection,
    ownershipYears,
    fuel,
    engine,
    price,
    result,
    loading,
    error,
    importMessage,
    importLoading,
    selectedMaker,
    powertrain,
    electricWhPerKm,
    hydrogenKmPerKg,
    electricityPrice,
    hydrogenPrice,
    phevEvRatio,
    comparisonItems,
  } = state

  const errorAlert =
    error != null && error !== '' ? (
      <p className="error" role="alert">
        {error}
      </p>
    ) : null

  const navItems = [
    { id: 'intro', label: '概要', icon: 'fa-circle-info' },
    { id: 'input', label: '入力', icon: 'fa-keyboard' },
    { id: 'result', label: '結果', icon: 'fa-chart-pie', disabled: !result },
    { id: 'compare', label: `比較 (${comparisonItems.length})`, icon: 'fa-code-compare' },
  ]

  const renderMainContent = () => {
    if (activeView === 'intro') {
      return (
        <SimulatorIntro
          onSelectGasoline={() => selectSimulatorMode(SEGMENT_COMBUSTION)}
          onSelectPlugin={() => selectSimulatorMode(SEGMENT_ELECTRIC)}
        />
      )
    }
    if (activeView === 'input') {
      const inputCommon = {
        fileInputRef,
        importLoading,
        importMessage,
        onExportCsv: handleExportCsv,
        onImportCsv: handleImportCsv,
        selectedMaker,
        makerOptions,
        onMakerChange: handleMakerChange,
        modelOptions,
        onModelChipSelect: handleModelChipSelect,
        selectedCarId,
        distance,
        setDistance: (v) => patch({ distance: v }),
        insurance,
        setInsurance: (v) => patch({ insurance: v }),
        parking,
        setParking: (v) => patch({ parking: v }),
        inspection,
        setInspection: (v) => patch({ inspection: v }),
        ownershipYears,
        setOwnershipYears: (v) => patch({ ownershipYears: v }),
        onCalculate: handleCalculate,
        loading,
        onSelectInputMode: (next) => {
          if (next === simulatorMode) return
          selectSimulatorMode(next)
        },
      }

      const inputProps = {
        ...inputCommon,
        fuel,
        setFuel: (v) => patch({ fuel: v }),
        gasPrice,
        setGasPrice: (v) => patch({ gasPrice: v }),
        price,
        setPrice: (v) => patch({ price: v }),
        engine,
        setEngine: (v) => patch({ engine: v }),
        onEngineBlur: handleEngineBlur,
        powertrain,
        setPowertrain: (v) => patch({ powertrain: v }),
      }

      return (
        <main className="main">
          {simulatorMode === SEGMENT_COMBUSTION ? (
            <SimulatorInputGasolineHybrid {...inputProps} />
          ) : (
            <SimulatorInputPluginEv
              {...inputProps}
              electricWhPerKm={electricWhPerKm}
              setElectricWhPerKm={(v) => patch({ electricWhPerKm: v })}
              hydrogenKmPerKg={hydrogenKmPerKg}
              setHydrogenKmPerKg={(v) => patch({ hydrogenKmPerKg: v })}
              electricityPrice={electricityPrice}
              setElectricityPrice={(v) => patch({ electricityPrice: v })}
              hydrogenPrice={hydrogenPrice}
              setHydrogenPrice={(v) => patch({ hydrogenPrice: v })}
              phevEvRatio={phevEvRatio}
              setPhevEvRatio={(v) => patch({ phevEvRatio: v })}
            />
          )}
          {errorAlert}
        </main>
      )
    }
    if (activeView === 'compare') {
      return (
        <ComparisonPage
          items={comparisonItems}
          onRemove={removeComparisonItem}
          onClear={clearComparisonItems}
          onDownload={downloadComparisonCsv}
        />
      )
    }
    if (!result) {
      return (
        <main className="main">
          <p className="error" role="alert">
            先に入力画面で計算を実行してください。
          </p>
        </main>
      )
    }

    const isPlugin = isElectricSegment(result.calc_mode)
    const assumptionsBase = {
      carName: selectedCarName,
      distance,
      fuel,
      gasPrice,
      engine,
      price,
      insurance,
      parking,
      inspection,
      ownershipYears,
    }

    return (
      <main className="main">
        {isPlugin ? (
          <ResultSectionPluginEv
            result={result}
            onAddToComparison={addCurrentResultToComparison}
            assumptions={{
              ...assumptionsBase,
              powertrain,
              electricWhPerKm,
              hydrogenKmPerKg,
              electricityPrice,
              hydrogenPrice,
              phevEvRatio,
            }}
          />
        ) : (
          <ResultSectionGasolineHybrid
            result={result}
            onAddToComparison={addCurrentResultToComparison}
            assumptions={assumptionsBase}
          />
        )}
      </main>
    )
  }

  return (
    <div className="app">
      <AppHeader hasResult={Boolean(result)} showNav={false} />
      <div className="spa-layout">
        <SpaLeftNav items={navItems} activeId={activeView} onSelect={setActiveView} />
        <section className="content-pane">{renderMainContent()}</section>
      </div>
      <AppFooter hasResult={Boolean(result)} onNavigateToSection={navigateToFooterSection} />
    </div>
  )
}

export default App
