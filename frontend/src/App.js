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
import SpermAnimation from './SpermAnimation';
import { ListTodo, BarChart4 } from 'lucide-react';
import ProgramSerwisantChart from './ProgramSerwisantChart';
import WorkloadSprawyChart from './WorkloadSprawyChart';
import ProgramWersjeChart from './ProgramWersjeChart';

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

    // Stany dla filtrów, które są wysyłane do API
    const [numerSearch, setNumerSearch] = useState('');
    const [kontrahentSearch, setKontrahentSearch] = useState('');
    const [uwagiSearch, setUwagiSearch] = useState('');

    // NOWE: Stany przechowujące aktualną wartość w polach input
    const [numerInput, setNumerInput] = useState('');
    const [kontrahentInput, setKontrahentInput] = useState('');
    const [uwagiInput, setUwagiInput] = useState('');

    // Pozostałe stany
    const [showAnimation, setShowAnimation] = useState(false);
    const [startDate, setStartDate] = useState(getInitialDates().startDate);
    const [endDate, setEndDate] = useState(getInitialDates().endDate);
    const [allDzialy, setAllDzialy] = useState([]);
    const [selectedDzialy, setSelectedDzialy] = useState(['U1S']);
    const [activePreset, setActivePreset] = useState('day');
    const [selectedChart, setSelectedChart] = useState('status');
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

    const clearSearchFilters = () => {
        setNumerInput('');
        setKontrahentInput('');
        setUwagiInput('');
        setNumerSearch('');
        setKontrahentSearch('');
        setUwagiSearch('');
    };

    const applySearchFilters = () => {
        setStartDate('');
        setEndDate('');
        setActivePreset(null);
        setPokazPrzedawnione(false);

        setNumerSearch(numerInput);
        setKontrahentSearch(kontrahentInput);
        setUwagiSearch(uwagiInput);
    };

    const handleDzialChange = (dzial) => {
        setPokazPrzedawnione(false);
        clearSearchFilters();
        setSelectedDzialy(prevSelected => {
            if (prevSelected.includes(dzial)) {
                return prevSelected.length > 1 ? prevSelected.filter(item => item !== dzial) : prevSelected;
            } else {
                return [...prevSelected, dzial];
            }
        });
    };

    const handlePresetClick = (preset) => {
        setPokazPrzedawnione(false);
        clearSearchFilters();
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
        clearSearchFilters();
        setActivePreset(null);
        if (type === 'start') {
            setStartDate(value);
        } else {
            setEndDate(value);
        }
    };

    const handlePokazPrzedawnione = () => {
        if (przedawnioneCount > 0) {
            clearSearchFilters();
            setStartDate('');
            setEndDate('');
            setActivePreset(null);
            setPokazPrzedawnione(true);
            setActiveTab('sprawy');
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <button 
                    className="main-header" 
                    onClick={() => setShowAnimation(!showAnimation)}
                >
                BOKser_web
                </button>
                {showAnimation && <SpermAnimation />}
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
                                <input type="text" placeholder="Fragment numeru..." value={numerInput} onChange={e => setNumerInput(e.target.value)} />
                                {numerInput && <button onClick={() => setNumerInput('')} className="clear-search-btn">&times;</button>}
                            </div>
                        </div>
                        <div className="search-filter">
                            <label>Kontrahent:</label>
                            <div className="search-input-wrapper">
                                <input type="text" placeholder="Miasto kontrahenta..." value={kontrahentInput} onChange={e => setKontrahentInput(e.target.value)} />
                                {kontrahentInput && <button onClick={() => setKontrahentInput('')} className="clear-search-btn">&times;</button>}
                            </div>
                        </div>
                        <div className="search-filter">
                            <label>Uwagi:</label>
                            <div className="search-input-wrapper">
                                <input type="text" placeholder="Fragment uwagi..." value={uwagiInput} onChange={e => setUwagiInput(e.target.value)} />
                                {uwagiInput && <button onClick={() => setUwagiInput('')} className="clear-search-btn">&times;</button>}
                            </div>
                        </div>
                        <button onClick={applySearchFilters} className="search-apply-btn">Szukaj</button>
                    </div>
                </div>
            </div>

            <div className="tabs-container">
                <div className="div-tabs-buttons">
                    <div
                        className={activeTab === 'sprawy' ? 'active' : ''} 
                        onClick={() => setActiveTab('sprawy')}
                        title="Sprawy"
                    >
                        <ListTodo size={20} />
                    </div>
                    <div
                        className={activeTab === 'wykresy' ? 'active' : ''} 
                        onClick={() => setActiveTab('wykresy')}
                        title="Wykresy"
                    >
                        <BarChart4 size={20} />
                    </div>
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
                            uwagiSearch={uwagiSearch}
                            pokazPrzedawnione={pokazPrzedawnione}
                        />
                    </div>
                )}
                {activeTab === 'wykresy' && (
                    <div className="charts-page-container">
                        <div className="chart-selector-wrapper">
                            <label htmlFor="chart-select">Wybierz wykres:</label>
                            <select 
                                id="chart-select"
                                value={selectedChart} 
                                onChange={(e) => setSelectedChart(e.target.value)}
                            >
                                <option value="status">Wykres Statusów (Kołowy)</option>
                                <option value="kompetencje">Wykres Kompetencji</option>
                                <option value="przedmioty">Wykres Przedmiotów</option>
                                <option value="program-serwisant">Program - Serwisant</option>
                                <option value="roczny">Wykres Roczny</option>
                                <option value="workload">Obciążenie Pracą - zadania</option>
                                <option value="workload-sprawy">Obciążenie pracą - Sprawy</option>
                                <option value="program-wersje">Program - Aktualne wersje</option>
                            </select>
                        </div>
                        <div className="chart-display-area">
                            {selectedChart === 'status' && <StatusPieChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy}/>}
                            {selectedChart === 'kompetencje' && <KompetencjeChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy}/>}
                            {selectedChart === 'przedmioty' && <PrzedmiotyChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy}/>}
                            {selectedChart === 'roczny' && <RocznyWykres startDate={startDate} endDate={endDate} dzialy={selectedDzialy}/>}
                            {selectedChart === 'workload' && <WorkloadChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy}/>}
                            {selectedChart === 'program-serwisant' && <ProgramSerwisantChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy} />}
                            {selectedChart === 'workload-sprawy' && <WorkloadSprawyChart startDate={startDate} endDate={endDate} dzialy={selectedDzialy} />}
                            {selectedChart === 'program-wersje' && <ProgramWersjeChart />}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;