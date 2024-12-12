import React, { useEffect, useRef, forwardRef, useCallback } from 'react'
import { Chart as ChartJS } from 'chart.js'
import type { ChartType, DefaultDataPoint } from 'chart.js'

import type { ForwardedRef, ChartProps, BaseChartComponent } from './types.js'
import {
  reforwardRef,
  cloneData,
  setOptions,
  setLabels,
  setDatasets,
} from './utils.js'

function ChartComponent<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown,
>(
  props: ChartProps<TType, TData, TLabel>,
  ref: ForwardedRef<ChartJS<TType, TData, TLabel>>,
) {
  const {
    height = 150,
    width = 300,
    redraw = false,
    datasetIdKey,
    type,
    data,
    options,
    plugins = [],
    fallbackContent,
    updateMode,
    ...canvasProps
  } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS<TType, TData, TLabel> | null>(null)

  const renderChart = useCallback(() => {
    if (!canvasRef.current) return

    chartRef.current = new ChartJS<TType, TData, TLabel>(canvasRef.current, {
      type,
      data: cloneData(data, datasetIdKey),
      options: options && { ...options },
      plugins,
    })

    reforwardRef(ref, chartRef.current)
  }, [data, datasetIdKey, options, plugins, ref, type])

  const destroyChart = useCallback(() => {
    reforwardRef(ref, null)

    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }
  }, [ref])

  useEffect(() => {
    if (!redraw && chartRef.current && options) {
      setOptions(chartRef.current, options)
    }
  }, [redraw, options])

  useEffect(() => {
    if (!redraw && chartRef.current) {
      setLabels(chartRef.current.config.data, data.labels)
    }
  }, [redraw, data.labels])

  useEffect(() => {
    if (!redraw && chartRef.current && data.datasets) {
      setDatasets(chartRef.current.config.data, data.datasets, datasetIdKey)
    }
  }, [redraw, data.datasets, datasetIdKey])

  useEffect(() => {
    if (!chartRef.current) return

    if (redraw) {
      destroyChart()
      setTimeout(renderChart)
    } else {
      chartRef.current.update(updateMode)
    }
  }, [
    redraw,
    options,
    data.labels,
    data.datasets,
    updateMode,
    destroyChart,
    renderChart,
  ])

  useEffect(() => {
    if (!chartRef.current) return

    destroyChart()
    setTimeout(renderChart)
  }, [destroyChart, renderChart, type])

  useEffect(() => {
    renderChart()

    return () => destroyChart()
  }, [destroyChart, renderChart])

  return (
    <canvas
      ref={canvasRef}
      role='img'
      height={height}
      width={width}
      {...canvasProps}
    >
      {fallbackContent}
    </canvas>
  )
}

export const Chart = forwardRef(ChartComponent) as BaseChartComponent
