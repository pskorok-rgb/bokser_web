import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

const getInitialData = () => ({
    labels: [],
    datasets: [{
        label: 'Liczba zamkniętych zadań',
        data: [],
        backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#C9CBCF', '#4D5360', '#E7E9ED', '#F7464A',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
    }]
});

function PrzedmiotyChart({ startDate, endDate, dzialy }) {
    const [chartData, setChartData] = useState(getInitialData());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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

        axios.get(`http://localhost:5001/api/statystyki/przedmioty`, { params })
            .then(response => {
                const apiData = response.data;
                setChartData({
                    labels: apiData.map(item => item.przedmiot),
                    datasets: [{ ...getInitialData().datasets[0], data: apiData.map(item => item.liczba_zadan) }]
                });
                setError(null);
            })
            .catch(err => {
                console.error("Błąd pobierania danych o przedmiotach!", err);
                setError("Błąd pobierania danych o przedmiotach.");
                setChartData(getInitialData());
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [startDate, endDate, dzialy]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right' },
            title: { display: true, text: 'TOP 10 Przedmiotów Zadań', color: '#333', font: { size: 18 } },
        },
    };

    if (isLoading) return <p>Ładowanie danych...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (chartData.datasets[0].data.length === 0) return <p>Brak danych o przedmiotach dla wybranych filtrów.</p>;

    return (
        <div style={{ height: '550px' }}>
            <Doughnut options={options} data={chartData} />
        </div>
    );
}

export default PrzedmiotyChart;
