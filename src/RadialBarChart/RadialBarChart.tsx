import React, { Component, Fragment } from 'react';
import { ChartShallowDataShape, buildChartData, ChartInternalShallowDataShape } from '../common/data';
import { scaleBand, scaleLinear } from 'd3-scale';
import { getYDomain, getGroupDomain } from '../common/utils/domains';
import { RadialBarSeries, RadialBarSeriesProps } from './RadialBarSeries';
import { memoize } from 'lodash-es';
import { ChartProps, ChartContainer, ChartContainerChildProps } from '../common/containers';
import { CloneElement } from '../common/utils/children';
import { RadialAxis } from '../common/Axis/RadialAxis';

export interface RadialBarChartProps extends ChartProps {
  data: ChartShallowDataShape[];
  series: JSX.Element;
  innerRadius: number;
}

export class RadialBarChart extends Component<RadialBarChartProps> {
  static defaultProps: Partial<RadialBarChartProps> = {
    innerRadius: 80,
    series: <RadialBarSeries />
  };

  getScales = memoize((preData: ChartShallowDataShape[], innerRadius: number, outerRadius: number) => {
    const data = buildChartData(preData) as ChartInternalShallowDataShape[];
    const xDomain = getGroupDomain(data as ChartInternalShallowDataShape[], 'x');
    const yDomain = getYDomain({ data, scaled: false });

    const xScale = scaleBand()
      .range([0, 2 * Math.PI])
      .align(0)
      .domain(xDomain as any[]);

    // https://github.com/d3/d3-scale/issues/90
    const y = scaleLinear()
      .range([innerRadius * innerRadius, outerRadius * outerRadius])
      .domain(yDomain);
    const yScale = Object.assign(d => Math.sqrt(y(d)), y);

    return {
      xScale,
      yScale,
      data
    };
  });

 renderChart(containerProps: ChartContainerChildProps) {
    const { chartWidth, chartHeight, id } = containerProps;
    const { innerRadius, series, height } = this.props;
    const outerRadius = Math.min(chartWidth, chartHeight) / 2;
    const { yScale, xScale, data } = this.getScales(this.props.data, innerRadius, outerRadius);

    return (
      <Fragment>
        <CloneElement<RadialBarSeriesProps>
          element={series}
          id={id}
          data={data}
          xScale={xScale}
          yScale={yScale}
          innerRadius={innerRadius}
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
        {props => this.renderChart(props)}
      </ChartContainer>
    );
  }
}
