import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Komponent dla okienka popup (Modal) ---
function Modal({ title, children, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h3>{title}</h3>
                <div className="modal-scrollable-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

// --- Komponent dla widoku szczegółowego (Etap 2) ---
function DetailsView({ przedmiot, onBack }) {
    const [detailsData, setDetailsData] = useState({ labels: [], datasets: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [contractorList, setContractorList] = useState([]);
    const [isListLoading, setIsListLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState('');

    useEffect(() => {
        setIsLoading(true);
        axios.get(`http://localhost:5001/api/statystyki/wersje-per-program`, { params: { przedmiot } })
            .then(response => {
                const data = response.data;
                setDetailsData({
                    labels: data.map(item => item.nr_wersji),
                    datasets: [{
                        label: 'Liczba wystąpień',
                        data: data.map(item => item.ilosc),
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    }]
                });
            })
            .finally(() => setIsLoading(false));
    }, [przedmiot]);

    // Poprawiona funkcja kliknięcia dla wykresu szczegółowego
    const handleDetailsChartClick = (event, elements) => {
    if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const clickedLabel = detailsData.labels[elementIndex]; // np. "Wersja 1.1"

        // --- NOWA LINIA: Wycinamy sam numer wersji ---
        const versionNumber = clickedLabel.replace('Wersja ', ''); 

        setSelectedVersion(clickedLabel); // Dla tytułu modala zostawiamy pełną nazwę
        setIsListModalOpen(true);
        setIsListLoading(true);

        // Do API wysyłamy już tylko czysty numer wersji
        axios.get(`http://localhost:5001/api/statystyki/kontrahenci-per-wersja`, { params: { przedmiot, wersja: versionNumber } })
            .then(response => {
                setContractorList(response.data);
            })
            .finally(() => setIsListLoading(false));
    }
};

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: handleDetailsChartClick, // Podpinamy nową, bezpieczną funkcję
        plugins: {
            title: { display: true, text: `Rozkład wersji dla: ${przedmiot}`, color: '#333', font: { size: 16 } },
            legend: { display: false }
        },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    };

    return (
        <>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <button onClick={onBack} className="chart-back-button">← Powrót do widoku głównego</button>
                {isLoading ? <p>Ładowanie danych...</p> : (
                    <div style={{ flexGrow: 1, position: 'relative' }}>
                        <Bar data={detailsData} options={options} />
                    </div>
                )}
            </div>
            {isListModalOpen && (
                <Modal title={`Kontrahenci z wersją ${selectedVersion} dla ${przedmiot}`} onClose={() => setIsListModalOpen(false)}>
                    {isListLoading ? <p>Wczytywanie listy...</p> : (
                        <ul>
                            {contractorList.map((item, index) => <li key={index}>{item.nazwa_kontrahenta}</li>)}
                        </ul>
                    )}
                </Modal>
            )}
        </>
    );
}


// --- Główny komponent wykresu (Etap 1) ---
function ProgramWersjeChart() {
    const [mainChartData, setMainChartData] = useState({ labels: [], datasets: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('main');
    const [selectedPrzedmiot, setSelectedPrzedmiot] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        axios.get(`http://localhost:5001/api/statystyki/aktualne-wersje-programow`)
            .then(response => {
                const dataFromApi = response.data;
                const programy = [...new Set(dataFromApi.map(item => item.przedmiot))];
                const wersje = [...new Set(dataFromApi.map(item => item.nr_wersji))];
                const colors = ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)'];

                setMainChartData({
                    labels: programy,
                    datasets: wersje.map((wersja, index) => ({
                        label: `Wersja ${wersja}`,
                        data: programy.map(program => dataFromApi.find(d => d.przedmiot === program && d.nr_wersji === wersja)?.ilosc || 0),
                        backgroundColor: colors[index % colors.length],
                    }))
                });
                setError(null);
            })
            .catch(err => {
                console.error("Błąd pobierania danych dla wykresu Program-Wersje!", err);
                setError("Błąd pobierania danych.");
            })
            .finally(() => setIsLoading(false));
    }, []);

    // Poprawiona funkcja kliknięcia dla wykresu głównego
    const handleChartClick = (event, elements) => {
        if (elements.length > 0) {
            const elementIndex = elements[0].index;
            const clickedPrzedmiot = mainChartData.labels[elementIndex];
            setSelectedPrzedmiot(clickedPrzedmiot);
            setViewMode('details');
        }
    };

    const mainChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: handleChartClick,
        plugins: {
            title: { display: true, text: 'Liczba aktualnych wersji programów u kontrahentów', color: '#333', font: { size: 18 } },
            legend: { display: false }
        },
        scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
        }
    };

    if (isLoading) return <p>Ładowanie danych...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (mainChartData.labels.length === 0) return <p>Brak danych do wyświetlenia.</p>;

    return (
        <div style={{ height: '550px', position: 'relative' }}>
            {viewMode === 'main' ? (
                <Bar data={mainChartData} options={mainChartOptions} />
            ) : (
                <DetailsView przedmiot={selectedPrzedmiot} onBack={() => setViewMode('main')} />
            )}
        </div>
    );
}

export default ProgramWersjeChart;