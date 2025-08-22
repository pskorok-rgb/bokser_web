import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ContractorDetailsModal({ isOpen, onClose, contractorData, isLoading }) {
  const [kontaktList, setKontaktList] = useState([]);
  const [isKontaktLoading, setIsKontaktLoading] = useState(true);

  // Ten hook uruchomi się, gdy modal otrzyma dane kontrahenta,
  // aby pobrać dodatkowo listę kontaktów
  useEffect(() => {
    if (contractorData && contractorData.akronim) {
      setIsKontaktLoading(true);
      axios.get(`http://localhost:5001/api/kontrahenci/${contractorData.akronim}/kontakty`)
        .then(response => {
          setKontaktList(response.data);
        })
        .catch(error => {
          console.error("Błąd pobierania listy kontaktów!", error);
          setKontaktList([]); // Wyczyść listę w razie błędu
        })
        .finally(() => {
          setIsKontaktLoading(false);
        });
    }
  }, [contractorData]);


  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Brak danych';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <h3>Szczegóły kontrahenta</h3>
        {isLoading ? (
          <p>Ładowanie danych...</p>
        ) : contractorData ? (
          <>
            <div className="contractor-details three-columns">
              {/* Lewa kolumna */}
              <div className="details-column">
                <p><strong>Akronim:</strong> {contractorData.akronim}</p>
                <p><strong>Nazwa:</strong> {contractorData.nazwa}</p>
                <p><strong>Adres:</strong> {contractorData.adres}, {contractorData.kodpocz} {contractorData.miasto}</p>
              </div>
              {/* Środkowa kolumna */}
              <div className="details-column">
                <p><strong>IDUSC:</strong> {contractorData.IDUSC || 'Brak'}</p>
                <p><strong>Telefon:</strong> {contractorData.telefon}</p>
                <p><strong>Email:</strong> {contractorData.email}</p>
              </div>
              {/* Prawa kolumna - Nowa */}
              <div className="details-column">
                <strong>Wszystkie kontakty:</strong>
                <div className="kontakt-list">
                  {isKontaktLoading ? (
                    <p>Ładowanie...</p>
                  ) : kontaktList.length > 0 ? (
                    kontaktList.map((item, index) => <p key={index}>{item.kontakt}</p>)
                  ) : (
                    <p>Brak historycznych kontaktów.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="contracts-section">
              <h4>Zarejestrowane umowy</h4>
              {contractorData.umowy && contractorData.umowy.length > 0 ? (
                <div className="contracts-table-container">
                  <table className="contracts-table">
                    <thead>
                      <tr>
                        <th>Przedmiot umowy</th>
                        <th>Koniec umowy</th>
                        <th>Serwisant</th>
                        <th>Uwagi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractorData.umowy.map((umowa, index) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const contractEndDate = new Date(umowa.koniec_umowy);
                        const isContractActive = contractEndDate >= today;
                        
                        return (
                          <tr key={index} className={isContractActive ? 'active-contract' : ''}>
                            <td>{umowa.przedmiot_umowy}</td>
                            <td>{formatDate(umowa.koniec_umowy)}</td>
                            <td>{umowa.kto_serwisuje || '-'}</td>
                            <td>{umowa.uwagi || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Brak zarejestrowanych umów dla tego kontrahenta.</p>
              )}
            </div>
          </>
        ) : (
          <p>Błąd lub brak danych do wyświetlenia.</p>
        )}
      </div>
    </div>
  );
}

export default ContractorDetailsModal;