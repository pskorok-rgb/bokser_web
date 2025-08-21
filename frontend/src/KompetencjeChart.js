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

function KompetencjeChart({ startDate, endDate, dzialy }) {
    const [apiData, setApiData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!startDate || !endDate || !dzialy || dzialy.length === 0) {
            setApiData([]);
            return;
        }
        setIsLoading(true);
        setSelectedTechnician(null); 
        const params = new URLSearchParams();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        params.append('dzialy', dzialy.join(','));

        axios.get(`http://localhost:5001/api/statystyki/kompetencje`, { params })
            .then(response => setApiData(response.data))
            .catch(err => console.error("Błąd pobierania danych kompetencji!", err))
            .finally(() => setIsLoading(false));
    }, [startDate, endDate, dzialy]);

    const { data: chartData, options } = useMemo(() => {
        if (selectedTechnician) {
            // --- WIDOK SZCZEGÓŁOWY (PO KLIKNIĘCIU) ---
            const techData = apiData
                .filter(item => item.serwisant === selectedTechnician)
                .sort((a, b) => b.liczba_zadan - a.liczba_zadan);
            
            const detailedData = {
                labels: techData.map(item => item.przedmiot),
                datasets: [{
                    label: 'Liczba zadań',
                    data: techData.map(item => item.liczba_zadan),
                    backgroundColor: vibrantColors,
                }],
            };
            const detailedOptions = {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: `Szczegóły - ${selectedTechnician}`, font: { size: 18 } },
                    legend: { display: false },
                },
                scales: {
                    x: { title: { display: true, text: 'Przedmiot' } },
                    y: { title: { display: true, text: 'Liczba zadań' } },
                },
            };
            return { data: detailedData, options: detailedOptions };
        } else {
            // --- WIDOK OGÓLNY (DOMYŚLNY) ---
            const technicians = [...new Set(apiData.map(item => item.serwisant))];
            const subjects = [...new Set(apiData.map(item => item.przedmiot))];
            
            const datasets = subjects.map((subject, index) => {
                const data = technicians.map(tech => {
                    const record = apiData.find(item => item.serwisant === tech && item.przedmiot === subject);
                    return record ? record.liczba_zadan : 0;
                });
                return {
                    label: subject,
                    data: data,
                    backgroundColor: vibrantColors[index % vibrantColors.length],
                };
            });

            const generalData = { labels: technicians, datasets };
            const generalOptions = {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Kompetencje serwisantów', font: { size: 18 } },
                    legend: { display: false },
                },
                scales: {
                    x: { stacked: true, title: { display: true, text: 'Serwisant' } },
                    y: { stacked: true, title: { display: true, text: 'Liczba zadań' } },
                },
            };
            return { data: generalData, options: generalOptions };
        }
    }, [apiData, selectedTechnician]);

    const onClick = (event) => {
        if (!chartRef.current || selectedTechnician) return;
        const element = getElementAtEvent(chartRef.current, event);
        if (element.length > 0) {
            const technicianName = chartData.labels[element[0].index];
            setSelectedTechnician(technicianName);
        }
    };

    if (isLoading) return <p>Ładowanie danych...</p>;
    if (!apiData || apiData.length === 0) return <p>Brak danych dla wybranych filtrów.</p>;

    return (
        <div style={{ position: 'relative' }}>
            {selectedTechnician && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '5px' }}>
                    <button onClick={() => setSelectedTechnician(null)} className="back-button">
                        &larr; Powrót do widoku ogólnego
                    </button>
                </div>
            )}
            <div style={{ height: '540px' }}>
                <Bar ref={chartRef} options={options} data={chartData} onClick={onClick} />
            </div>
        </div>
    );
}

export default KompetencjeChart;
