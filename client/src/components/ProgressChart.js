// 학습 진행률 차트 컴포넌트 (Chart.js 2.x 버전용)
import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';

class ProgressChart extends Component {
    render() {
        const { weeklyData } = this.props;

        if (!weeklyData || weeklyData.length === 0) {
            return (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                    학습 데이터가 없습니다.
                </div>
            );
        }

        const data = {
            labels: weeklyData.map(d => d.date),
            datasets: [
                {
                    label: '학습한 카드 수',
                    data: weeklyData.map(d => d.count),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true
                }
            ]
        };

        const options = {
            responsive: true,
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: '주간 학습 진행률'
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        stepSize: 1
                    }
                }]
            }
        };

        return (
            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
                <Line data={data} options={options} />
            </div>
        );
    }
}

export default ProgressChart;
