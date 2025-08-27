// frontend/src/WorkloadSprawyChart.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function WorkloadSprawyChart({ startDate, endDate, dzialy }) {
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!startDate || !endDate || !dzialy || dzialy.length === 0) return;

        const params = new URLSearchParams({
            startDate,
            endDate,
            dzialy: dzialy.join(','),
        });

        setIsLoading(true);
        axios.get(`http://localhost:5001/api/statystyki/obciazenie-sprawy`, { params })
            .then(response => {
                const dataFromApi = response.data;
                setChartData({
                    labels: dataFromApi.map(item => item.serwisant),
                    datasets: [{
                        label: 'Liczba zamkniętych spraw',
                        data: dataFromApi.map(item => item.liczba_spraw),
                        backgroundColor: 'rgba(153, 102, 255, 0.7)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                    }]
                });
                setError(null);
            })
            .catch(err => {
                console.error("Błąd pobierania danych dla wykresu Obciążenie-Sprawy!", err);
                setError("Błąd pobierania danych.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [startDate, endDate, dzialy]);

    const options = {
        indexAxis: 'y', // Obraca wykres na poziomy
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: { display: true, text: 'Liczba zamkniętych spraw per serwisant', color: '#333', font: { size: 18 } },
            legend: { display: false } // Ukrywamy legendę, bo jest tylko jedna seria danych
        },
        scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
    };

    if (isLoading) return <p>Ładowanie danych...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (chartData.labels.length === 0) return <p>Brak danych dla wybranych filtrów.</p>;

    return <div style={{ height: '550px' }}>
    <Bar data={chartData} options={options} /></div>;
    
}

export default WorkloadSprawyChart;