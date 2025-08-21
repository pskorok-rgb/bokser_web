import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Funkcja tworząca pusty, ale poprawny strukturalnie obiekt danych dla wykresu
const getInitialData = () => ({
    labels: [],
    datasets: [{
        label: 'Liczba spraw',
        data: [],
        backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 206, 86, 0.7)',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
    }],
});

function StatusPieChart({ startDate, endDate, dzialy }) {
    const [chartData, setChartData] = useState(getInitialData());
    const [apiData, setApiData] = useState([]); // Przechowujemy surowe dane dla dymków
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!startDate || !endDate || !dzialy || dzialy.length === 0) {
            setChartData(getInitialData());
            setApiData([]);
            return;
        }
        
        setIsLoading(true);
        const params = new URLSearchParams();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        params.append('dzialy', dzialy.join(','));

        axios.get(`http://localhost:5001/api/statystyki/statusy-spraw`, { params })
            .then(response => {
                const dataFromApi = response.data;
                setApiData(dataFromApi); // Zapisujemy surowe dane
                setChartData({
                    labels: dataFromApi.map(item => item.status_opis),
                    datasets: [{ ...getInitialData().datasets[0], data: dataFromApi.map(item => item.liczba) }]
                });
                setError(null);
            })
            .catch(err => {
                console.error("Błąd pobierania danych dla wykresu statusów!", err);
                setError("Błąd pobierania danych dla wykresu statusów.");
                setChartData(getInitialData()); // Resetujemy dane w razie błędu
                setApiData([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [startDate, endDate, dzialy]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: { display: true, text: 'Nowe sprawy w okresie (wg statusu)', color: '#333', font: { size: 18 } },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const fullLabel = `${label}: ${value}`;
                        const dataPoint = apiData[context.dataIndex];
                        if (dataPoint && dataPoint.numery_spraw) {
                            const issues = dataPoint.numery_spraw.split(', ').join('\n');
                            return [fullLabel, '', 'Numery spraw:', issues];
                        }
                        return fullLabel;
                    }
                }
            }
        },
    };

    if (isLoading) return <p>Ładowanie danych...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (chartData.datasets[0].data.length === 0) return <p>Brak danych dla wybranych filtrów.</p>;

    return (
        <div style={{ height: '300px' }}>
            <Doughnut data={chartData} options={options} />
        </div>
    );
}

export default StatusPieChart;
