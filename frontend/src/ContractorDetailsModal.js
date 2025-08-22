// frontend/src/ContractorDetailsModal.js
import React from 'react';

function ContractorDetailsModal({ isOpen, onClose, contractorData, isLoading }) {
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
            <div className="contractor-details">
              <div className="details-column">
                <p><strong>Akronim:</strong> {contractorData.akronim}</p>
                <p><strong>Nazwa:</strong> {contractorData.nazwa}</p>
                <p><strong>Adres:</strong> {contractorData.adres}, {contractorData.kodpocz} {contractorData.miasto}</p>
              </div>
              <div className="details-column">
                <p><strong>IDUSC:</strong> {contractorData.IDUSC || 'Brak'}</p>
                <p><strong>Telefon:</strong> {contractorData.telefon}</p>
                <p><strong>Email:</strong> {contractorData.email}</p>
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
                        // === POCZĄTEK NOWEJ LOGIKI ===
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Ustawia godzinę na początek dnia dla precyzyjnego porównania
                        const contractEndDate = new Date(umowa.koniec_umowy);
                        const isContractActive = contractEndDate >= today;
                        // === KONIEC NOWEJ LOGIKI ===

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