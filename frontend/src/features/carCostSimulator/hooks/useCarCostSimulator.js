import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { flushSync } from 'react-dom'
import { API_BASE } from '../../../config/constants.js'
import { escapeCsvCell } from '../../../utils/csv.js'
import { formatEngineToThreeDecimals } from '../../../utils/numberFormat.js'
import { initialSimulatorState } from '../stores/initialState.js'
import { simulatorReducer } from '../stores/simulatorReducer.js'

function normalizeValue(v) {
  return v == null ? '' : v
}

function formatDateForFileName() {
  return new Date().toISOString().slice(0, 10)
}

export function useCarCostSimulator() {
  const [state, dispatch] = useReducer(simulatorReducer, initialSimulatorState)
  const fileInputRef = useRef(null)

  const patch = useCallback((payload) => {
    dispatch({ type: 'UPDATE', payload })
  }, [])

  const fetchCars = useCallback(() => {
    const seg = state.simulatorMode
    return fetch(`${API_BASE}/cars.php?segment=${encodeURIComponent(seg)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) {
          patch({ error: data.error })
          return []
        }
        const list = Array.isArray(data) ? data : []
        patch({ cars: list, error: null })
        return list
      })
      .catch(() => {
        patch({ error: '車一覧の取得に失敗しました' })
        return []
      })
  }, [patch, state.simulatorMode])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

  useEffect(() => {
    if (!state.selectedCarId || !state.cars.length) return
    const car = state.cars.find((c) => String(c.id) === state.selectedCarId)
    if (car) {
      dispatch({ type: 'HYDRATE_FROM_CAR', payload: car })
    }
  }, [state.selectedCarId, state.cars])

  const carDisplayName = (c) => (c.maker && c.model ? `${c.maker} ${c.model}` : c.name || '')

  const makerOptions = useMemo(
    () => [...new Set(state.cars.map((c) => c.maker).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja')),
    [state.cars]
  )

  const carsByMaker = useMemo(
    () => (state.selectedMaker ? state.cars.filter((c) => c.maker === state.selectedMaker) : []),
    [state.cars, state.selectedMaker]
  )

  const modelOptions = useMemo(
    () =>
      carsByMaker.map((c) => ({
        id: String(c.id),
        label:
          c.segment === 'plugin_ev' && c.powertrain
            ? `${c.name || c.model || carDisplayName(c)} [${String(c.powertrain).toUpperCase()}]`
            : c.name || c.model || carDisplayName(c),
      })),
    [carsByMaker]
  )

  const selectedCarName = useMemo(() => {
    const c = state.cars.find((x) => String(x.id) === state.selectedCarId)
    if (!c) return ''
    return c.name || c.model || carDisplayName(c)
  }, [state.cars, state.selectedCarId])

  const handleCarSelect = useCallback(
    (car) => {
      patch({ selectedCarId: String(car.id), selectedMaker: car.maker || '' })
    },
    [patch]
  )

  const handleMakerChange = useCallback(
    (e) => {
      patch({
        selectedMaker: e.target.value,
        selectedCarId: '',
        powertrain: '',
      })
    },
    [patch]
  )

  const handleModelChipSelect = useCallback(
    (nextCarId) => {
      const selected = carsByMaker.find((c) => String(c.id) === nextCarId)
      if (selected) handleCarSelect(selected)
    },
    [carsByMaker, handleCarSelect]
  )

  const handleCalculate = useCallback(() => {
    if (state.simulatorMode === 'plugin_ev') {
      const pt = String(state.powertrain ?? '')
        .trim()
        .toLowerCase()
      if (!['bev', 'phev', 'fcv'].includes(pt)) {
        patch({ error: '区分を選択してください', result: null })
        return
      }
    }
    patch({ error: null, result: null, loading: true })
    const baseBody = {
      distance: Number(state.distance) || 0,
      insurance: Number(state.insurance) || 0,
      parking: Number(state.parking) || 0,
      engine: Number(state.engine) || 0,
      inspection: Number(state.inspection) || 0,
      price: Number(state.price) || 0,
      ownership_years: Number(state.ownershipYears) || 1,
    }

    const body =
      state.simulatorMode === 'plugin_ev'
        ? {
            ...baseBody,
            calc_mode: 'plugin_ev',
            powertrain: state.powertrain,
            fuel: Number(state.fuel) || 0,
            electric_wh_per_km: Number(state.electricWhPerKm) || 0,
            hydrogen_km_per_kg: Number(state.hydrogenKmPerKg) || 0,
            electricity_price: Number(state.electricityPrice) || 0,
            gas_price: Number(state.gasPrice) || 0,
            hydrogen_price: Number(state.hydrogenPrice) || 0,
            phev_ev_ratio: Number.isFinite(Number(state.phevEvRatio)) ? Number(state.phevEvRatio) : 0.5,
          }
        : {
            ...baseBody,
            calc_mode: 'gasoline_hybrid',
            fuel: Number(state.fuel) || 0,
            gas_price: Number(state.gasPrice) || 0,
          }

    fetch(`${API_BASE}/calc.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        flushSync(() => {
          dispatch({ type: 'UPDATE', payload: { result: data, activeView: 'result' } })
        })
        window.requestAnimationFrame(() => {
          document.getElementById('simulation-result')?.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
          })
        })
      })
      .catch(() => patch({ error: '計算に失敗しました' }))
      .finally(() => {
        dispatch({ type: 'UPDATE', payload: { loading: false } })
      })
  }, [
    state.simulatorMode,
    state.distance,
    state.fuel,
    state.gasPrice,
    state.insurance,
    state.parking,
    state.engine,
    state.inspection,
    state.price,
    state.ownershipYears,
    state.powertrain,
    state.electricWhPerKm,
    state.hydrogenKmPerKg,
    state.electricityPrice,
    state.hydrogenPrice,
    state.phevEvRatio,
    patch,
  ])

  const handleExportCsv = useCallback(() => {
    const seg = state.simulatorMode
    fetch(`${API_BASE}/cars_export.php?segment=${encodeURIComponent(seg)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.text()
      })
      .then((text) => {
        const blob = new Blob(['\uFEFF' + text], { type: 'text/csv; charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = seg === 'plugin_ev' ? 'cars_plugin_ev.csv' : 'cars_gasoline_hybrid.csv'
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() =>
        patch({
          error: 'エクスポートに失敗しました。バックエンドが起動しているか確認してください（npm run dev）。',
        })
      )
  }, [patch, state.simulatorMode])

  const handleImportCsv = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      patch({ importMessage: null, importLoading: true })
      const formData = new FormData()
      formData.append('csv', file)
      const seg = state.simulatorMode
      fetch(`${API_BASE}/cars_import.php?segment=${encodeURIComponent(seg)}`, {
        method: 'POST',
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            const text = data.detail ? `${data.error}: ${data.detail}` : data.error
            patch({ importMessage: { type: 'error', text } })
            return
          }
          patch({ importMessage: { type: 'success', text: `${data.imported} 件インポートしました` } })
          fetchCars()
        })
        .catch(() => patch({ importMessage: { type: 'error', text: 'インポートに失敗しました' } }))
        .finally(() => {
          patch({ importLoading: false })
          e.target.value = ''
        })
    },
    [patch, fetchCars, state.simulatorMode]
  )

  const addCurrentResultToComparison = useCallback(() => {
    if (!state.result) return
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      addedAt: new Date().toISOString(),
      mode: state.result.calc_mode,
      carName: selectedCarName || '',
      inputs: {
        distance: normalizeValue(state.distance),
        fuel: normalizeValue(state.fuel),
        gasPrice: normalizeValue(state.gasPrice),
        price: normalizeValue(state.price),
        engine: normalizeValue(state.engine),
        insurance: normalizeValue(state.insurance),
        parking: normalizeValue(state.parking),
        inspection: normalizeValue(state.inspection),
        ownershipYears: normalizeValue(state.ownershipYears),
        powertrain:
          normalizeValue(state.powertrain),
        electricWhPerKm: normalizeValue(state.electricWhPerKm),
        hydrogenKmPerKg: normalizeValue(state.hydrogenKmPerKg),
        electricityPrice: normalizeValue(state.electricityPrice),
        hydrogenPrice: normalizeValue(state.hydrogenPrice),
        phevEvRatio: normalizeValue(state.phevEvRatio),
      },
      result: state.result,
    }
    dispatch({ type: 'ADD_COMPARISON_ITEM', payload: item })
  }, [
    state.result,
    state.distance,
    state.fuel,
    state.gasPrice,
    state.price,
    state.engine,
    state.insurance,
    state.parking,
    state.inspection,
    state.ownershipYears,
    state.powertrain,
    state.electricWhPerKm,
    state.hydrogenKmPerKg,
    state.electricityPrice,
    state.hydrogenPrice,
    state.phevEvRatio,
    selectedCarName,
  ])

  const removeComparisonItem = useCallback((id) => {
    dispatch({ type: 'REMOVE_COMPARISON_ITEM', payload: id })
  }, [])

  const clearComparisonItems = useCallback(() => {
    dispatch({ type: 'CLEAR_COMPARISON_ITEMS' })
  }, [])

  const downloadComparisonCsv = useCallback(() => {
    if (!state.comparisonItems.length) return
    const headers = [
      '追加日時',
      '計算モード',
      '車種',
      'パワートレイン',
      '年間走行距離(km)',
      '燃費(km/L)',
      'ガソリン価格(円/L)',
      '電費(Wh/km)',
      '水素費(km/kg)',
      '電気単価(円/kWh)',
      '水素単価(円/kg)',
      'PHEV電気走行割合',
      '車両価格(円)',
      '排気量(L)',
      '任意保険(円/年)',
      '駐車場(円/月)',
      '車検費用(2年分・円)',
      '保有年数(年)',
      '年間維持費(円)',
      '月間維持費(円)',
      '車両価格年換算(円)',
      '年間合計(維持費+車両価格)(円)',
      '月間合計(維持費+車両価格)(円)',
      '電気代(円)',
      'ガソリン(円)',
      '水素(円)',
      'エネルギー計(円)',
      '税金(円)',
      '車検(円)',
      '保険(円)',
      '駐車場(円)',
    ]
    const rows = state.comparisonItems.map((item) => {
      const r = item.result || {}
      const i = item.inputs || {}
      const modeName = item.mode === 'plugin_ev' ? 'BEV/PHEV/FCV' : 'ガソリン/HEV'
      return [
        item.addedAt,
        modeName,
        item.carName,
        i.powertrain,
        i.distance,
        i.fuel,
        i.gasPrice,
        i.electricWhPerKm,
        i.hydrogenKmPerKg,
        i.electricityPrice,
        i.hydrogenPrice,
        i.phevEvRatio,
        i.price,
        i.engine,
        i.insurance,
        i.parking,
        i.inspection,
        i.ownershipYears,
        r.total,
        r.monthly,
        r.vehicle_annual,
        r.total_with_vehicle,
        r.monthly_with_vehicle,
        r.electricity_cost,
        r.calc_mode === 'plugin_ev' ? r.gasoline_cost : r.gas_cost,
        r.hydrogen_cost,
        r.energy_cost,
        r.tax,
        r.inspection_annual,
        r.insurance,
        r.parking_annual,
      ].map(escapeCsvCell)
    })
    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `維持費比較結果_${formatDateForFileName()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [state.comparisonItems])

  const handleEngineBlur = useCallback(() => {
    if (state.engine === '') return
    patch({ engine: formatEngineToThreeDecimals(state.engine) })
  }, [state.engine, patch])

  const navigateToInput = useCallback(() => {
    flushSync(() => {
      dispatch({ type: 'UPDATE', payload: { activeView: 'input' } })
    })
    window.requestAnimationFrame(() => {
      document.getElementById('simulation-input')?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      })
      window.history.replaceState(null, '', '#simulation-input')
    })
  }, [])

  const selectSimulatorMode = useCallback((mode) => {
    flushSync(() => {
      dispatch({
        type: 'UPDATE',
        payload: {
          simulatorMode: mode,
          activeView: 'input',
          result: null,
          selectedCarId: '',
          selectedMaker: '',
          powertrain: '',
          error: null,
        },
      })
    })
    window.requestAnimationFrame(() => {
      document.getElementById('simulation-input')?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      })
      window.history.replaceState(null, '', '#simulation-input')
    })
  }, [])

  const navigateToFooterSection = useCallback(
    (view, sectionId) => {
      const scrollTo = () => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.replaceState(null, '', `#${sectionId}`)
      }
      if (state.activeView === view) {
        window.requestAnimationFrame(scrollTo)
        return
      }
      flushSync(() => {
        dispatch({ type: 'UPDATE', payload: { activeView: view } })
      })
      window.requestAnimationFrame(scrollTo)
    },
    [state.activeView]
  )

  const setActiveView = useCallback(
    (v) => {
      patch({ activeView: v })
    },
    [patch]
  )

  return {
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
    navigateToInput,
    navigateToFooterSection,
    selectSimulatorMode,
    setActiveView,
    patch,
  }
}
