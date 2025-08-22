import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import SprawaWiersz from './SprawaWiersz';
import { ReceiptText } from 'lucide-react';
import ContractorDetailsModal from './ContractorDetailsModal';

function SprawyTabela({ startDate, endDate, dzialy, numerSearch, kontrahentSearch, pokazPrzedawnione }) {
    const [sprawy, setSprawy] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: 'data_plan', direction: 'descending' });
    const [error, setError] = useState(null);
    const recordsPerPage = 15;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContractor, setSelectedContractor] = useState(null);
    const [isLoadingModal, setIsLoadingModal] = useState(false);

    const handleContractorIconClick = (akronim) => {
        if (!akronim) {
            console.error("Brak akronimu kontrahenta!");
            return;
        }
        setIsModalOpen(true);
        setIsLoadingModal(true);
        setSelectedContractor(null);
        axios.get(`http://localhost:5001/api/kontrahenci/${akronim}`)
            .then(response => {
                setSelectedContractor(response.data);
            })
            .catch(error => {
                console.error("Błąd pobierania danych kontrahenta!", error);
            })
            .finally(() => {
                setIsLoadingModal(false);
            });
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [startDate, endDate, dzialy, numerSearch, kontrahentSearch, pokazPrzedawnione]);

    useEffect(() => {
        // ... (Twój kod do pobierania danych pozostaje bez zmian)
        if (!pokazPrzedawnione && !kontrahentSearch && (!startDate || !endDate || !dzialy || dzialy.length === 0)) {
            setSprawy([]);
            setTotalPages(0);
            setTotalRecords(0);
            return;
        }

        const params = new URLSearchParams();
        if (pokazPrzedawnione) {
            params.append('pokazPrzedawnione', true);
        } else if (kontrahentSearch) {
            params.append('kontrahentSearch', kontrahentSearch);
        } else {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('dzialy', dzialy.join(','));
            if (numerSearch) {
                params.append('searchTerm', numerSearch);
            }
        }
        params.append('page', currentPage);
        params.append('limit', recordsPerPage);

        axios.get(`http://localhost:5001/api/sprawy`, { params })
            .then(response => {
                setSprawy(response.data.sprawy);
                setTotalPages(response.data.totalPages);
                setTotalRecords(response.data.totalRecords);
                setError(null);
            })
            .catch(err => {
                console.error("Błąd pobierania listy spraw!", err);
                setError("Nie udało się pobrać listy spraw.");
            });
    }, [startDate, endDate, dzialy, currentPage, numerSearch, kontrahentSearch, pokazPrzedawnione]);
    
    const sortedSprawy = useMemo(() => {
        // ... (Twoja logika sortowania, w tym ta dla daty+godziny, pozostaje bez zmian)
        let sortableItems = [...sprawy];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'data_plan') {
                    const dateTimeA = new Date(a.data_plan);
                    if (a.godz_plan) {
                        const timeA = new Date(a.godz_plan);
                        dateTimeA.setUTCHours(timeA.getUTCHours(), timeA.getUTCMinutes(), timeA.getUTCSeconds());
                    }
                    const dateTimeB = new Date(b.data_plan);
                    if (b.godz_plan) {
                        const timeB = new Date(b.godz_plan);
                        dateTimeB.setUTCHours(timeB.getUTCHours(), timeB.getUTCMinutes(), timeB.getUTCSeconds());
                    }
                    if (sortConfig.direction === 'ascending') {
                        return dateTimeA - dateTimeB;
                    } else {
                        return dateTimeB - dateTimeA;
                    }
                } else {
                    if (a[sortConfig.key] < b[sortConfig.key]) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (a[sortConfig.key] > b[sortConfig.key]) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                    return 0;
                }
            });
        }
        return sortableItems;
    }, [sprawy, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    if (error) return <div className="table-container"><p style={{color: 'red'}}>{error}</p></div>;

    // === POCZĄTEK POPRAWIONEJ STRUKTURY JSX ===
    return (
        <>
            <div className="table-container">
                <div className="table-header">
                    <div className="records-info">
                        <strong>Znaleziono: {totalRecords}</strong>
                    </div>
                    <div className="pagination">
                        <button onClick={goToPreviousPage} disabled={currentPage === 1}>Poprzednia</button>
                        <span>Strona {currentPage} z {totalPages || 1}</span>
                        <button onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0}>Następna</button>
                    </div>
                </div>
                
                {(sprawy.length === 0 && !error) && <p style={{padding: '20px', textAlign: 'center'}}>Brak spraw do wyświetlenia dla wybranych filtrów.</p>}
                {sprawy.length > 0 && (
                    <table className="sprawy-table">
                        {/* Nagłówek jest tutaj, w SprawyTabela, gdzie ma dostęp do requestSort */}
                        <thead>
                            <tr>
                                 
                                <th>Numer Sprawy</th>
                                <th>Przedmioty Zadań</th>
                                <th>Kontrahent</th>
                                <th>Kontakt</th>
                                <th onClick={() => requestSort('data_plan')} className="sortable">
                                    Data Planowana {sortConfig.key === 'data_plan' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : null}
                                </th>
                                <th onClick={() => requestSort('status_opis')} className="sortable">
                                    Status {sortConfig.key === 'status_opis' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : null}
                                </th>
                            </tr>
                        </thead>
                        {/* Ciało tabeli mapuje dane i przekazuje je do komponentu SprawaWiersz */}
                        <tbody>
                            {sortedSprawy.map(sprawa => (
                                <SprawaWiersz 
                                    key={sprawa.nr_sprawy} 
                                    sprawa={sprawa}
                                    onContractorClick={handleContractorIconClick}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <ContractorDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    contractorData={selectedContractor}
                    isLoading={isLoadingModal}
                />
            )}
        </>
    );
    // === KONIEC POPRAWIONEJ STRUKTURY JSX ===
}

export default SprawyTabela;