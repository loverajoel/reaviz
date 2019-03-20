import React, { Component, Fragment } from 'react';
import { ChartShallowDataShape, buildChartData, ChartInternalShallowDataShape } from '../common/data';
import { scaleTime, scaleLinear } from 'd3-scale';
import { getYDomain, getXDomain } from '../common/utils/domains';
import { memoize } from 'lodash-es';
import { RadialScatterSeries, RadialScatterSeriesProps } from './RadialScatterSeries';
import { ChartProps, ChartContainer, ChartContainerChildProps } from '../common/containers';
import { CloneElement } from '../common/utils/children';

export interface RadialScatterPlotProps extends ChartProps {
  data: ChartShallowDataShape[];
  series: JSX.Element;
  innerRadius: number;
}

export class RadialScatterPlot extends Component<RadialScatterPlotProps> {
  static defaultProps: Partial<RadialScatterPlotProps> = {
    innerRadius: 80,
    series: <RadialScatterSeries />
  };

  getScales = memoize((preData: ChartShallowDataShape[], outerRadius: number, innerRadius: number) => {
    const data = buildChartData(preData) as ChartInternalShallowDataShape[];

    const yDomain = getYDomain({ data, scaled: false });
    const xDomain = getXDomain({ data });

    const xScale = scaleTime()
      .range([0, 2 * Math.PI])
      .domain(xDomain);

    // https://github.com/d3/d3-scale/issues/90
    const y = scaleLinear()
      .range([innerRadius * innerRadius, outerRadius * outerRadius])
      .domain(yDomain);
    const yScale = Object.assign(d => Math.sqrt(y(d)), y);

    return {
      yScale,
      xScale,
      data
    };
  });

 renderChart(containerProps: ChartContainerChildProps) {
    const { chartWidth, chartHeight, id } = containerProps;
    const { innerRadius, series } = this.props;
    const outerRadius = Math.min(chartWidth, chartHeight) / 2;
    const { yScale, xScale, data } = this.getScales(this.props.data, outerRadius, innerRadius);

    return (
      <Fragment>
        <CloneElement<RadialScatterSeriesProps>
          element={series}
          id={id}
          data={data}
          xScale={xScale}
          yScale={yScale}
        />
      </Fragment>
    );
 }

  render() {
    const { id, width, height, margins, className } = this.props;

    return (
      <ChartContainer
        id={id}
        width={width}
        height={height}
        margins={margins}
        xAxisVisible={false}
        yAxisVisible={false}
        center={true}
        className={className}
      >
        {this.renderChart.bind(this)}
      </ChartContainer>
    );
  }
}
