import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const vibrantColors = [
  'rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(255, 159, 64, 0.7)',
  'rgba(153, 102, 255, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
  'rgba(247, 70, 74, 0.7)', 'rgba(50, 168, 82, 0.7)', 'rgba(168, 50, 164, 0.7)',
  'rgba(50, 168, 160, 0.7)',
];

function RocznyWykres({ dzialy }) {
    const [apiData, setApiData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!dzialy || dzialy.length === 0) {
            setApiData([]);
            return;
        }
        setIsLoading(true);
        setSelectedMonthIndex(null); 
        const params = new URLSearchParams();
        params.append('dzialy', dzialy.join(','));

        axios.get(`http://localhost:5001/api/statystyki/roczny-przeglad`, { params })
            .then(response => setApiData(response.data))
            .catch(err => console.error("Błąd pobierania danych rocznych!", err))
            .finally(() => setIsLoading(false));
    }, [dzialy]);

    const { data: chartData, options } = useMemo(() => {
        if (selectedMonthIndex !== null) {
            // --- WIDOK MIESIĘCZNY (PO KLIKNIĘCIU) ---
            const monthName = new Date(2000, selectedMonthIndex, 1).toLocaleString('pl-PL', { month: 'long' });
            const monthData = apiData
                .filter(item => item.miesiac - 1 === selectedMonthIndex)
                .sort((a, b) => b.liczba_zadan - a.liczba_zadan);

            const monthlyData = {
                labels: monthData.map(item => item.przedmiot),
                datasets: [{
                    label: `Liczba zadań`,
                    data: monthData.map(item => item.liczba_zadan),
                    backgroundColor: vibrantColors,
                }],
            };
            const monthlyOptions = {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: `Szczegóły - ${monthName}`, font: { size: 18 } },
                    legend: { display: false },
                },
                scales: {
                    x: { title: { display: true, text: 'Przedmiot' } },
                    y: { title: { display: true, text: 'Liczba zadań' } },
                },
            };
            return { data: monthlyData, options: monthlyOptions };
        } else {
            // --- WIDOK ROCZNY (DOMYŚLNY) ---
            const labels = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
            const przedmioty = [...new Set(apiData.map(item => item.przedmiot))];
            const datasets = przedmioty.map((przedmiot, index) => {
                const data = new Array(12).fill(0);
                apiData.forEach(item => {
                    if (item.przedmiot === przedmiot) data[item.miesiac - 1] = item.liczba_zadan;
                });
                return {
                    label: przedmiot,
                    data: data,
                    backgroundColor: vibrantColors[index % vibrantColors.length],
                };
            });
            const yearlyData = { labels, datasets };
            const yearlyOptions = {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Roczny przegląd zamkniętych zadań (wg przedmiotów)', font: { size: 18 } },
                    legend: { display: false },
                },
                scales: {
                    x: { stacked: true, title: { display: true, text: 'Miesiąc' } },
                    y: { stacked: true, title: { display: true, text: 'Liczba zadań' } },
                },
            };
            return { data: yearlyData, options: yearlyOptions };
        }
    }, [apiData, selectedMonthIndex]);

    const onClick = (event) => {
        if (!chartRef.current || selectedMonthIndex !== null) return;
        const element = getElementAtEvent(chartRef.current, event);
        if (element.length > 0) {
            setSelectedMonthIndex(element[0].index);
        }
    };

    if (isLoading) return <p>Ładowanie danych...</p>;
    if (!apiData || apiData.length === 0) return <p>Brak danych dla wybranych filtrów.</p>;

    return (
        // ZMIANA: Przebudowana struktura dla lepszego pozycjonowania przycisku
        <div>
            {selectedMonthIndex !== null && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '5px' }}>
                    <button onClick={() => setSelectedMonthIndex(null)} className="back-button">
                        &larr; Powrót do widoku rocznego
                    </button>
                </div>
            )}
            <div style={{ height: '540px', position: 'relative' }}>
                <Bar ref={chartRef} options={options} data={chartData} onClick={onClick} />
            </div>
        </div>
    );
}

export default RocznyWykres;
