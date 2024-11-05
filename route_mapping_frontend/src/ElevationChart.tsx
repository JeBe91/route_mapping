// ElevationChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface ElevationChartProps {
    elevationData: { distance: number; elevation: number }[];
    maxRoutePosition: number; // New prop for setting maximum x-axis range

}
const ElevationChart: React.FC<ElevationChartProps> = ({ elevationData, maxRoutePosition }) => {
    // console.log(elevationData)
    const option = {
        title: {
            text: 'Elevation Profile',
            left: 'center'
        },
        grid: {
            bottom: 0
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const { data } = params[0];
                return `Distance: ${data[0].toFixed(2)} km<br/>Elevation: ${data[1].toFixed(0)} m`;
            }
        },
        xAxis: {
            position: 'bottom',
            type: 'value',
            data: elevationData.map((point) => point.distance.toFixed(2)),
            // max: (value: any) => Math.ceil(value.max / 10) * 10
            max: maxRoutePosition.toFixed(2) // Use maxRoutePosition to set maximum x-axis value


        },
        yAxis: {
            type: 'value',
            name: 'Elevation (m)',
            // min: (value: any) => Math.floor(value.min / 10) * 10,
            min:0,
            max: (value: any) => Math.ceil(value.max / 10) * 10
        },
        series: [
            {
                type: 'line',
                data: elevationData.map((point) => [point.distance, point.elevation]),
                smooth: true,
                lineStyle: {
                    color: '#3b8dd3'
                },
                areaStyle: {
                    color: 'rgba(59, 141, 211, 0.3)'
                }
            }
        ]
    };

    return <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />;
};

export default ElevationChart;
