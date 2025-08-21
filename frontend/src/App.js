import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import StatusPieChart from './StatusPieChart';
import WorkloadChart from './WorkloadChart';
import SprawyTabela from './SprawyTabela';
import PrzedmiotyChart from './PrzedmiotyChart';
import RocznyWykres from './RocznyWykres';
import KompetencjeChart from './KompetencjeChart';
import { ShieldAlert } from 'lucide-react';

const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};

function App() {
    const getInitialDates = () => {
        const today = formatDate(new Date());
        return {
            startDate: today,
            endDate: today,
        };
    };

    const [startDate, setStartDate] = useState(getInitialDates().startDate);
    const [endDate, setEndDate] = useState(getInitialDates().endDate);
    const [allDzialy, setAllDzialy] = useState([]);
    const [selectedDzialy, setSelectedDzialy] = useState(['U1S']);
    const [activePreset, setActivePreset] = useState('day');
    const [selectedChart, setSelectedChart] = useState('status');
    const [numerSearch, setNumerSearch] = useState('');
    const [kontrahentSearch, setKontrahentSearch] = useState('');
    const [przedawnioneCount, setPrzedawnioneCount] = useState(0);
    const [pokazPrzedawnione, setPokazPrzedawnione] = useState(false);
    const [activeTab, setActiveTab] = useState('sprawy');

    useEffect(() => {
        axios.get('http://localhost:5001/api/dzialy')
            .then(response => setAllDzialy(response.data.map(item => item.dzial)))
            .catch(err => console.error("Błąd pobierania listy działów!", err));
        
        axios.get('http://localhost:5001/api/sprawy/przedawnione-count')
            .then(response => setPrzedawnioneCount(response.data.count))
            .catch(err => console.error("Błąd pobierania liczby spraw przedawnionych!", err));
    }, []);

    const clearStandardFilters = () => {
        setStartDate('');
        setEndDate('');
        setActivePreset(null);
        setNumerSearch('');
    };

    const clearKontrahentFilter = () => {
        setKontrahentSearch('');
    };

    const handleDzialChange = (dzial) => {
        setPokazPrzedawnione(false);
        clearKontrahentFilter();
        setSelectedDzialy(prevSelected => {
            if (prevSelected.includes(dzial)) {
                return prevSelected.filter(item => item !== dzial);
            } else {
                return [...prevSelected, dzial];
            }
        });
    };

    const handlePresetClick = (preset) => {
        setPokazPrzedawnione(false);
        clearKontrahentFilter();
        setActivePreset(preset);
        const today = new Date();
        let newStartDate = new Date();

        if (preset === 'day') {
            newStartDate = today;
        } else if (preset === 'month') {
            newStartDate.setMonth(today.getMonth() - 1);
        } else if (preset === '3-months') {
            newStartDate.setMonth(today.getMonth() - 3);
        } else if (preset === 'year') {
            newStartDate.setFullYear(today.getFullYear() - 1);
        }

        setStartDate(formatDate(newStartDate));
        setEndDate(formatDate(today));
    };

    const handleManualDateChange = (value, type) => {
        setPokazPrzedawnione(false);
        clearKontrahentFilter();
        setActivePreset(null);
        if (type === 'start') {
            setStartDate(value);
        } else {
            setEndDate(value);
        }
    };

    const handleNumerSearch = (value) => {
        setPokazPrzedawnione(false);
        clearKontrahentFilter();
        setNumerSearch(value);
    };

    const handleKontrahentSearch = (value) => {
        setPokazPrzedawnione(false);
        clearStandardFilters();
        setKontrahentSearch(value);
    };

    const handlePokazPrzedawnione = () => {
        if (przedawnioneCount > 0) {
            clearStandardFilters();
            clearKontrahentFilter();
            setPokazPrzedawnione(true);
            setActiveTab('sprawy');
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <div className="header-section">
                    <h1 className="main-header">BOKser_web</h1>
                </div>
            </header>

            <div className="filters-panel">
                <div className="filter-row-main">
                    <div className="filter-group">
                        <strong>Daty:</strong>
                        <label>od: <input type="date" value={startDate} onChange={e => handleManualDateChange(e.target.value, 'start')} /></label>
                        <label>do: <input type="date" value={endDate} onChange={e => handleManualDateChange(e.target.value, 'end')} /></label>
                    </div>
                    <div className="filter-group">
                        <strong>Zakres:</strong>
                        <div className="preset-buttons">
                            <button onClick={() => handlePresetClick('day')} className={activePreset === 'day' ? 'active' : ''}>Dzień</button>
                            <button onClick={() => handlePresetClick('month')} className={activePreset === 'month' ? 'active' : ''}>Miesiąc</button>
                            <button onClick={() => handlePresetClick('3-months')} className={activePreset === '3-months' ? 'active' : ''}>3 miesiące</button>
                            <button onClick={() => handlePresetClick('year')} className={activePreset === 'year' ? 'active' : ''}>Rok</button>
                        </div>
                    </div>
                    <div className="filter-group">
                        <strong>Działy:</strong>
                        <div className="checkbox-group">
                            {allDzialy.map(dzial => (
                                <label key={dzial}>
                                    <input
                                        type="checkbox"
                                        value={dzial}
                                        checked={selectedDzialy.includes(dzial)}
                                        onChange={() => handleDzialChange(dzial)}
                                    />
                                    {dzial}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <strong>Szukaj:</strong>
                        <div className="search-filter">
                            <label>Numer:</label>
                            <div className="search-input-wrapper">
                                <input type="text" placeholder="Fragment numeru..." value={numerSearch} onChange={e => handleNumerSearch(e.target.value)} />
                                {numerSearch && <button onClick={() => handleNumerSearch('')} className="clear-search-btn">&times;</button>}
                            </div>
                        </div>
                        <div className="search-filter">
                            <label>Kontrahent:</label>
                            <div className="search-input-wrapper">
                                <input type="text" placeholder="Miasto kontrahenta..." value={kontrahentSearch} onChange={e => handleKontrahentSearch(e.target.value)} />
                                {kontrahentSearch && <button onClick={() => handleKontrahentSearch('')} className="clear-search-btn">&times;</button>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="tabs-container">
                <div className="tabs-buttons">
                    <button 
                        className={`tab-button ${activeTab === 'sprawy' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sprawy')}
                    >
                        Sprawy
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'wykresy' ? 'active' : ''}`}
                        onClick={() => setActiveTab('wykresy')}
                    >
                        Wykresy
                    </button>
                </div>
                <div className={`overdue-box ${przedawnioneCount > 0 ? 'active' : ''}`}>
                    <span>Przedawnione</span>
                    <span className="overdue-count">{przedawnioneCount}</span>
                    <button 
                        onClick={handlePokazPrzedawnione} 
                        disabled={przedawnioneCount === 0} 
                        className="icon-btn"
                        title="Pokaż przedawnione sprawy"
                    >
                        <ShieldAlert size={18} />
                    </button>
                </div>
            </div>

            <main className="main-content">
                {activeTab === 'sprawy' && (
                    <div className="tab-content">
                        <SprawyTabela 
                            startDate={startDate} 
                            endDate={endDate} 
                            dzialy={selectedDzialy}
                            numerSearch={numerSearch}
                            kontrahentSearch={kontrahentSearch}
                            pokazPrzedawnione={pokazPrzedawnione}
                        />
                    </div>
                )}
                {activeTab === 'wykresy' && (
                    <div className="tab-content charts-view-container">
                        <div className="chart-selector-wrapper">
                            <label htmlFor="chart-select">Wybierz wykres:</label>
                            <select 
                                id="chart-select" 
                                value={selectedChart} 
                                onChange={(e) => setSelectedChart(e.target.value)}
                            >
                                <option value="status">Nowe sprawy (wg statusu)</option>
                                <option value="workload">Liczba zamkniętych zadań</option>
                                <option value="subjects">TOP 10 Przedmiotów Zadań</option>
                                <option value="yearly">Przegląd roczny (wg przedmiotów)</option>
                                <option value="competencies">Kompetencje serwisantów</option>
                            </select>
                        </div>
                        
                        <div className="chart-card">
                            {selectedChart === 'status' && <StatusPieChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy} />}
                            {selectedChart === 'workload' && <WorkloadChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy} />}
                            {selectedChart === 'subjects' && <PrzedmiotyChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy} />}
                            {selectedChart === 'yearly' && <RocznyWykres dzialy={selectedDzialy} />}
                            {selectedChart === 'competencies' && <KompetencjeChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy} />}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
