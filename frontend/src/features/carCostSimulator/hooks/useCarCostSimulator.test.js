import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SEGMENT_ELECTRIC } from '../segments.js'
import { useCarCostSimulator } from './useCarCostSimulator.js'

describe('useCarCostSimulator', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.requestAnimationFrame = vi.fn((cb) => cb())
    window.history.replaceState = vi.fn()
  })

  it('electricモードでpowertrain未選択時は計算せずエラーを出す', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => [],
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useCarCostSimulator())

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/cars.php?segment=combustion')
    })

    act(() => {
      result.current.patch({ simulatorMode: SEGMENT_ELECTRIC, powertrain: '' })
    })
    act(() => {
      result.current.handleCalculate()
    })

    await waitFor(() => {
      expect(result.current.state.error).toBe('区分を選択してください')
    })
    expect(fetchMock).not.toHaveBeenCalledWith('/api/calc.php', expect.anything())
  })

  it('electricモードで計算時に必要なリクエストbodyを組み立てる', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        json: async () => [],
      })
      .mockResolvedValueOnce({
        json: async () => [],
      })
      .mockResolvedValueOnce({
        json: async () => ({ calc_mode: 'electric', total: 1234 }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useCarCostSimulator())

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/cars.php?segment=combustion')
    })

    act(() => {
      result.current.patch({
        simulatorMode: SEGMENT_ELECTRIC,
        distance: '12000',
        insurance: '70000',
        parking: '8000',
        engine: '1.8',
        inspection: '120000',
        price: '4200000',
        ownershipYears: '7',
        powertrain: 'bev',
        fuel: '0',
        electricWhPerKm: '140',
        hydrogenKmPerKg: '0',
        electricityPrice: '33',
        gasPrice: '185',
        hydrogenPrice: '1100',
        phevEvRatio: '0.6',
      })
    })
    act(() => {
      result.current.handleCalculate()
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/calc.php',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    const calcCall = fetchMock.mock.calls.find(([url]) => url === '/api/calc.php')
    const body = JSON.parse(calcCall[1].body)
    expect(body).toEqual({
      distance: 12000,
      insurance: 70000,
      parking: 8000,
      engine: 1.8,
      inspection: 120000,
      price: 4200000,
      ownership_years: 7,
      calc_mode: 'electric',
      powertrain: 'bev',
      fuel: 0,
      electric_wh_per_km: 140,
      hydrogen_km_per_kg: 0,
      electricity_price: 33,
      gas_price: 185,
      hydrogen_price: 1100,
      phev_ev_ratio: 0.6,
    })
  })
})
