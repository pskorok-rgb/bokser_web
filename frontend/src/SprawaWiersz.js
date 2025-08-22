import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { Paperclip, ArrowDownFromLine, ArrowUpFromLine, FileText, History, ReceiptText } from 'lucide-react';
import PrintModal from './PrintModal';

// Komponent dla okienka modalnego (popup)
function Modal({ title, children, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h3>{title}</h3>
                {children}
            </div>
        </div>
    );
}

function SprawaWiersz({ sprawa, onContractorClick }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [zadania, setZadania] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalContent, setModalContent] = useState(null); // Dla uwag
    const [printModalData, setPrintModalData] = useState(null); // Dla wydruku
    const [historyModalData, setHistoryModalData] = useState(null); // Dla historii

    const handleToggle = () => {
        const newIsExpanded = !isExpanded;
        setIsExpanded(newIsExpanded);

        if (newIsExpanded && zadania.length === 0) {
            setIsLoading(true);
            axios.get(`http://localhost:5001/api/zadania`, { 
                params: { nr_sprawy: sprawa.nr_sprawy } 
            })
                .then(response => {
                    setZadania(response.data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Błąd pobierania zadań!", err);
                    setIsLoading(false);
                });
        }
    };

    const openPrintModal = async (e) => {
        e.stopPropagation();
        try {
            const response = await axios.get(`http://localhost:5001/api/sprawa-details`, {
                params: { nr_sprawy: sprawa.nr_sprawy }
            });
            setPrintModalData(response.data);
        } catch (error) {
            console.error("Błąd pobierania szczegółów sprawy!", error);
            alert("Nie udało się pobrać danych do wydruku.");
        }
    };

    const openHistoryModal = async (e) => {
        e.stopPropagation();
        try {
            const response = await axios.get(`http://localhost:5001/api/sprawa-history`, {
                params: { nr_sprawy: sprawa.nr_sprawy }
            });
            setHistoryModalData(response.data);
        } catch (error) {
            console.error("Błąd pobierania historii sprawy!", error);
            alert("Nie udało się pobrać historii sprawy.");
        }
    };

    const getRowClassName = (status) => {
        if (status === 'Otwarta') return 'status-row-otwarta';
        if (status === 'Zakończona') return 'status-row-zakończona';
        return '';
    };

    const renderModals = () => (
        <>
            {modalContent && ReactDOM.createPortal(
                <Modal title="Uwagi do zadania" onClose={() => setModalContent(null)}><pre className="modal-text">{modalContent}</pre></Modal>,
                document.body
            )}
            {printModalData && ReactDOM.createPortal(
                <PrintModal details={printModalData} nrSprawy={sprawa.nr_sprawy} onClose={() => setPrintModalData(null)} />,
                document.body
            )}
            {historyModalData && ReactDOM.createPortal(
                <Modal title={`Historia operacji dla sprawy ${sprawa.nr_sprawy}`} onClose={() => setHistoryModalData(null)}>
                    <div className="history-modal-content">
                        <table className="sub-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Kto</th>
                                    <th>Opis</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyModalData.length > 0 ? historyModalData.map((op, index) => (
                                    <tr key={index}>
                                        <td>{new Date(op.data_op).toLocaleString()}</td>
                                        <td>{op.kto}</td>
                                        <td>{op.opis}</td>
                                    </tr>
                                )) : <tr><td colSpan="3">Brak historii operacji.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Modal>,
                document.body
            )}
        </>
    );

    return (
        <>
            {renderModals()}
            <tr className={`main-row ${getRowClassName(sprawa.status_opis)}`} onClick={handleToggle}>
                <td>
                    <button className="expand-btn" style={{ background: 'none', border: 'none', width: 'auto', height: 'auto' }}>
                        {isExpanded ? <ArrowUpFromLine size={16} /> : <ArrowDownFromLine size={16} />}
                    </button>
                    {sprawa.nr_sprawy}
                </td>
                <td className="lista-przedmiotow">{sprawa.lista_przedmiotow}</td>
                <td className="kontrahent-cell">
                    <ReceiptText 
                        size={18} 
                        className="icon-btn-details"
                        title="Pokaż szczegóły kontrahenta"
                        onClick={(e) => {
                        e.stopPropagation();
                        onContractorClick(sprawa.nazwa_kontrahenta);
                        }} 
                    />
                    <span>{sprawa.nazwa_kontrahenta}</span>
                </td>
                <td>{sprawa.kontakt}</td>
                <td>{sprawa.data_plan ? new Date(sprawa.data_plan).toLocaleDateString() : 'Brak'}</td>
                <td><span className={`status status-${sprawa.status_opis.toLowerCase().replace(/ /g, '-')}`}>{sprawa.status_opis}</span></td>
            </tr>

            {isExpanded && (
                <tr className="details-row">
                    <td colSpan="6">
                        <div className="details-container">
                            <div className="details-header">
                                <h4>Zadania przypisane do sprawy</h4>
                                <div className="details-actions">
                                    <button 
                                        className="icon-btn"
                                        onClick={openHistoryModal}
                                        title="Pokaż historię operacji"
                                    >
                                        <History size={16} />
                                    </button>
                                    <button 
                                        className="icon-btn"
                                        onClick={openPrintModal}
                                        disabled={sprawa.status_opis !== 'Zakończona'}
                                        title={sprawa.status_opis === 'Zakończona' ? 'Generuj Kartę Serwisu' : 'Opcja dostępna dla spraw zakończonych'}
                                    >
                                        <FileText size={16} />
                                    </button>
                                </div>
                            </div>

                            {isLoading && <p>Ładowanie zadań...</p>}
                            {!isLoading && zadania.length === 0 && <p>Brak zadań dla tej sprawy.</p>}
                            {zadania.length > 0 && (
                                <table className="sub-table">
                                    <thead>
                                        <tr>
                                            <th>Czynność</th>
                                            <th>Przedmiot</th>
                                            <th>Serwisant</th>
                                            <th>Data wykonania</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {zadania.map((zadanie, index) => (
                                            <tr key={index}>
                                                <td>{zadanie.czynnosc}</td>
                                                <td>
                                                    {zadanie.przedmiot}
                                                    {zadanie.uwagi && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setModalContent(zadanie.uwagi);
                                                            }} 
                                                            className="uwagi-btn"
                                                            title="Pokaż uwagi"
                                                        >
                                                            <Paperclip size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                                <td>{zadanie.serwisant}</td>
                                                <td>{zadanie.data_wyk ? new Date(zadanie.data_wyk).toLocaleDateString() : 'Brak'}</td>
                                                <td>{zadanie.status_opis}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default SprawaWiersz;