import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const getInitialData = () => ({
    labels: [],
    datasets: [{
        label: 'Liczba zamkniętych zadań',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
    }]
});

function WorkloadChart({ startDate, endDate, dzialy }) {
    const [chartData, setChartData] = useState(getInitialData());
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!startDate || !endDate || !dzialy || dzialy.length === 0) {
            setChartData(getInitialData());
            return;
        }

        setIsLoading(true);
        const params = new URLSearchParams();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        params.append('dzialy', dzialy.join(','));

        axios.get(`http://localhost:5001/api/statystyki/obciazenie-wykonawcow`, { params })
            .then(response => {
                const apiData = response.data;
                setChartData({
                    labels: apiData.map(item => item.serwisant),
                    datasets: [{ ...getInitialData().datasets[0], data: apiData.map(item => item.liczba_zadan) }]
                });
                setError(null);
            })
            .catch(err => {
                console.error("Błąd pobierania danych o serwisantach!", err);
                setError("Błąd pobierania danych.");
                setChartData(getInitialData());
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [startDate, endDate, dzialy]);

    const options = {
        indexAxis: 'y',
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Liczba zamkniętych zadań', color: '#333', font: { size: 18 } },
        },
    };
    
    if (isLoading) return <p>Ładowanie danych...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (chartData.datasets[0].data.length === 0) return <p>Brak danych dla wybranych filtrów.</p>;

    return <Bar options={options} data={chartData} />;
}

export default WorkloadChart;
