// frontend/src/ProgramSerwisantChart.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ProgramSerwisantChart({ startDate, endDate, dzialy }) {
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
        axios.get(`http://localhost:5001/api/statystyki/program-serwisant`, { params })
            .then(response => {
                const dataFromApi = response.data;

                // Transformacja danych dla wykresu grupowanego
                const programy = [...new Set(dataFromApi.map(item => item.przedmiot))];
                const serwisanci = [...new Set(dataFromApi.map(item => item.wykonawca))];

                const colors = [
                    'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
                    'rgba(99, 255, 132, 0.7)'
                ];

                setChartData({
                    labels: programy,
                    datasets: serwisanci.map((serwisant, index) => ({
                        label: serwisant,
                        data: programy.map(program => {
                            const found = dataFromApi.find(d => d.przedmiot === program && d.wykonawca === serwisant);
                            return found ? found.liczba_zadan : 0;
                        }),
                        backgroundColor: colors[index % colors.length],
                    }))
                });
                setError(null);
            })
            .catch(err => {
                console.error("Błąd pobierania danych dla wykresu Program-Serwisant!", err);
                setError("Błąd pobierania danych.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [startDate, endDate, dzialy]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: { display: true, text: 'Liczba zamkniętych zadań (Program / Serwisant)', color: '#333', font: { size: 18 } },
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
    };

    if (isLoading) return <p>Ładowanie danych...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (chartData.labels.length === 0) return <p>Brak danych dla wybranych filtrów.</p>;

    return (
        <div style={{ height: '550px' }}><Bar data={chartData} options={options} /></div>);
}

export default ProgramSerwisantChart;