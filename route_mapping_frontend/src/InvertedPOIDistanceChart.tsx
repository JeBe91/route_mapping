// src/InvertedPOIDistanceChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { POI } from './POIs';

interface InvertedPOIDistanceChartProps {
    nearbyPOIs: POI[];
    maxRoutePosition: number;
}

const InvertedPOIDistanceChart: React.FC<InvertedPOIDistanceChartProps> = ({ nearbyPOIs, maxRoutePosition }) => {
    // Map types to specific colors
    const typeColors: { [key: string]: string } = {
        house: '#3399ff',
        tent: '#ff7f50',
        hotel: '#66cdaa',
        // Add more types and colors as needed
    };

    const options = {
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const poi = params[0].data;
                return `<strong>${poi.name}</strong><br>Route Position: ${poi.value[0].toFixed(2)} km<br>Distance to Route: ${poi.value[1].toFixed(2)} km`;
            }
        },
        grid: {
            top: 0
        },
        xAxis: {
            type: 'value',
            name: 'Distance (km)',
            nameLocation: 'center',
            nameGap: 30,
            max: maxRoutePosition.toFixed(2)
        },
        yAxis: {
            type: 'value',
            name: 'Distance to Route (km)',
            nameLocation: 'center',
            nameGap: 40,
            inverse: true
        },
        series: [
            {
                name: 'Nearby POIs',
                type: 'scatter',
                data: nearbyPOIs.map(poi => ({
                    value: [poi.routePosition, poi.minDistance],
                    name: poi.name,
                    itemStyle: {
                        color: typeColors[poi.type] || '#cccccc' // Default color if type not found
                    }
                })),
                symbolSize: 10,
                emphasis: {
                    itemStyle: {
                        borderColor: '#000',
                        borderWidth: 2
                    }
                }
            }
        ]
    };

    return <ReactECharts option={options} style={{ height: '300px', width: '100%' }} />;
};

export default InvertedPOIDistanceChart;
