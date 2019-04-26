import React, { Fragment } from 'react';
import classNames from 'classnames';
import {
  isAxisVisible,
  LinearAxisProps,
  LinearXAxisTickSeries,
  LinearXAxis,
  LinearYAxis
} from '../common/Axis';
import { BarSeries, BarSeriesProps } from './BarSeries';
import {
  ChartDataShape,
  ChartNestedDataShape,
  buildChartData,
  isMultiSeries,
  buildBins,
  buildBarStackData,
  buildMarimekkoData
} from '../common/data';
import { GridlineSeries, GridlineSeriesProps } from '../common/Gridline';
import {
  getXScale,
  getYScale,
  getGroupScale,
  getInnerScale,
  getMarimekkoScale,
  getMarimekkoGroupScale
} from '../common/scales';
import { ChartBrush, ChartBrushProps } from '../common/Brush';
import * as css from './BarChart.module.scss';
import {
  ChartContainer,
  ChartContainerChildProps,
  ChartProps
} from '../common/containers/ChartContainer';
import bind from 'memoize-bind';
import { CloneElement } from '../common/utils/children';

export interface BarChartProps extends ChartProps {
  data: ChartDataShape[];
  series: JSX.Element;
  yAxis: JSX.Element;
  xAxis: JSX.Element;
  gridlines: JSX.Element | null;
  brush: JSX.Element;
  zoomPan: JSX.Element;
  layout: 'horizontal' | 'vertical';
}

export class BarChart extends React.Component<BarChartProps, {}> {
  static defaultProps: Partial<BarChartProps> = {
    data: [],
    xAxis: (
      <LinearXAxis
        type="category"
        tickSeries={<LinearXAxisTickSeries tickSize={20} />}
      />
    ),
    yAxis: <LinearYAxis type="value" />,
    series: <BarSeries />,
    gridlines: <GridlineSeries />,
    brush: <ChartBrush disabled={true} />,
    layout: 'vertical'
  };

  getScalesAndData(chartHeight: number, chartWidth: number) {
    const { yAxis, xAxis, series, layout } = this.props;
    const seriesType = series.props.type;
    const isVertical = layout === 'vertical';

    let data;
    if (seriesType === 'stacked' || seriesType === 'stackedNormalized') {
      data = buildBarStackData(
        this.props.data as ChartNestedDataShape[],
        seriesType === 'stackedNormalized'
      );
    } else if (seriesType === 'marimekko') {
      data = buildMarimekkoData(this.props.data as ChartNestedDataShape[]);
    } else {
      data = buildChartData(
        this.props.data,
        false,
        isVertical ? 'vertical' : 'horizontal'
      );
    }

    const isMulti = isMultiSeries(data);
    const isGrouped = seriesType === 'standard' && isMulti;
    const isMarimekko = seriesType === 'marimekko';

    let yScale;
    let xScale;
    let xScale1;

    if (isVertical) {
      if (isGrouped) {
        const { keyScale, groupScale } = this.getMultiGroupScales(data, chartHeight, chartWidth);
        xScale = groupScale;
        xScale1 = keyScale;
      } else if (isMarimekko) {
        const { keyScale, groupScale } = this.getMarimekkoGroupScales(data, xAxis, chartWidth);
        xScale = groupScale;
        xScale1 = keyScale;
      } else {
        xScale = this.getKeyScale(data, xAxis, chartWidth);
      }

      yScale = this.getValueScale(data, yAxis, chartHeight);
    } else {
      if (isGrouped) {
        const { keyScale, groupScale } = this.getMultiGroupScales(data, chartHeight, chartWidth);
        xScale = groupScale;
        xScale1 = keyScale;
        yScale = this.getValueScale(data, yAxis, chartHeight);
      } else {
        xScale = this.getKeyScale(data, xAxis, chartWidth);
        yScale = this.getValueScale(data, yAxis, chartHeight);
      }
    }

    // If the key axis is a time/number we should bin it...
    data = this.getBinnedData(data, xScale, yScale);

    return { xScale, xScale1, yScale, data };
  }

  getBinnedData(data, xScale, yScale) {
    const { yAxis, xAxis, series, layout } = this.props;

    const isVertical = layout === 'vertical';
    const keyAxis = isVertical ? xAxis : yAxis;
    const keyScale = isVertical ? xScale : yScale;
    const keyAxisType = keyAxis.props.type;

    if (keyAxisType === 'time' || keyAxisType === 'value') {
      data = buildBins(
        keyScale,
        series.props.binThreshold || keyAxis.props.interval,
        data
      );
    }

    return data;
  }

  getMarimekkoGroupScales(data, axis, width: number) {
    const { series } = this.props;

    const keyScale = getMarimekkoScale(width, axis.props.roundDomains);

    const groupScale = getMarimekkoGroupScale({
      width: width,
      padding: series.props.padding,
      data,
      valueScale: keyScale
    });

    return {
      keyScale,
      groupScale
    };
  }

  getMultiGroupScales(data, height: number, width: number) {
    const { series } = this.props;

    const groupScale = getGroupScale({
      height,
      width,
      padding: series.props.groupPadding,
      data
    });

    const keyScale = getInnerScale({
      groupScale: groupScale,
      padding: series.props.padding,
      data
    });

    return {
      groupScale,
      keyScale
    };
  }

  getKeyScale(data, axis, width: number) {
    const { series } = this.props;

    return getXScale({
      width,
      type: axis.props.type,
      roundDomains: axis.props.roundDomains,
      data,
      padding: series.props.padding,
      domain: axis.props.domain
    });
  }

  getValueScale(data, axis, height: number) {
    const { series } = this.props;

    return getYScale({
      roundDomains: axis.props.roundDomains,
      padding: series.props.padding,
      type: axis.props.type,
      height,
      data,
      domain: axis.props.domain
    });
  }

  renderChart(containerProps: ChartContainerChildProps) {
    const { chartHeight, chartWidth, id, updateAxes } = containerProps;
    const { series, xAxis, yAxis, brush, gridlines, layout } = this.props;
    const { xScale, xScale1, yScale, data } = this.getScalesAndData(
      chartHeight,
      chartWidth
    );

    const isVertical = layout === 'vertical';
    const keyAxis = isVertical ? xAxis : yAxis;
    const isCategorical = keyAxis.props.type === 'category';

    return (
      <Fragment>
        {containerProps.chartSized && gridlines && (
          <CloneElement<GridlineSeriesProps>
            element={gridlines}
            height={chartHeight}
            width={chartWidth}
            yScale={yScale}
            xScale={xScale}
            yAxis={yAxis.props}
            xAxis={xAxis.props}
          />
        )}
        <CloneElement<LinearAxisProps>
          element={xAxis}
          height={chartHeight}
          width={chartWidth}
          scale={xScale}
          onDimensionsChange={bind(updateAxes, this, isVertical ? 'horizontal' : 'vertical')}
        />
        <CloneElement<LinearAxisProps>
          element={yAxis}
          height={chartHeight}
          width={chartWidth}
          scale={yScale}
          onDimensionsChange={bind(updateAxes, this, isVertical ? 'vertical' : 'horizontal')}
        />
        {containerProps.chartSized && (
          <CloneElement<ChartBrushProps>
            element={brush}
            height={chartHeight}
            width={chartWidth}
            scale={xScale}
          >
            <CloneElement<BarSeriesProps>
              element={series}
              id={`bar-series-${id}`}
              data={data}
              isCategorical={isCategorical}
              xScale={xScale}
              xScale1={xScale1}
              yScale={yScale}
              layout={layout}
            />
          </CloneElement>
        )}
      </Fragment>
    );
  }

  render() {
    const {
      id,
      width,
      height,
      margins,
      className,
      series,
      xAxis,
      yAxis
    } = this.props;

    return (
      <ChartContainer
        id={id}
        width={width}
        height={height}
        margins={margins}
        xAxisVisible={isAxisVisible(xAxis.props)}
        yAxisVisible={isAxisVisible(yAxis.props)}
        className={classNames(css.barChart, className, css[series.props.type])}
      >
        {props => this.renderChart(props)}
      </ChartContainer>
    );
  }
}
