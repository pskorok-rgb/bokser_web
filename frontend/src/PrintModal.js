import React, { useState, useEffect, useRef } from 'react';
import { Printer } from 'lucide-react';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

function PrintModal({ details, onClose, nrSprawy }) {
    const [editableData, setEditableData] = useState({});
    const printContentRef = useRef(null);

    useEffect(() => {
        setEditableData({
            dataZlecenia: formatDate(new Date()),
            nrSprawy: nrSprawy || '',
            nazwaZlecajacego: details.akronim || '',
            kontaktTelefon: '',
            kontaktOsoba: '', 
            opisZlecenia: details.opis || '', 
            opisManualny: '',
            terminRealizacji: formatDate(details.data_zak) || '',
            prowadzacy: details.kto || '',
            dataRozpoczecia: formatDate(details.data_zak) || '',
            zakresCzynnosci: '',
            uwagiSerwisowe: '',
            podpisProwadzacego: details.kto || '',
            dataZakonczenia: formatDate(details.data_zak) || '',
            dataOddania: formatDate(details.data_zak) || '',
        });
    }, [details, nrSprawy]);

    const handleContentChange = (field, value) => {
        setEditableData(prev => ({ ...prev, [field]: value }));
    };
    
    const handlePrint = () => {
        const printContent = printContentRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>Wydruk Karty Serwisu - ${editableData.nrSprawy}</title></head><body>`);
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const printStyles = `
        .pt-body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
        .pt-container { max-width: 800px; margin: auto; }
        .pt-h2 { text-align: center; font-family: "Lucida Sans Unicode", "Lucida Grande", sans-serif; font-size: 19px; margin-bottom: 15px; letter-spacing: 1px; white-space: nowrap; }
        .pt-main-title { font-weight: bold; }
        .pt-subtitle { font-style: italic; font-weight: normal; }
        .pt-main-info-section { border: 3px double #000; padding: 10px 15px; margin-bottom: 15px; line-height: 1.1; }
        .pt-header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .pt-info-block { margin-bottom: 5px; }
        .pt-info-block label, .pt-section-title { font-family: "Times New Roman", serif; font-size: 13pt; }
        .pt-main-info-section label { font-weight: bold; }
        .pt-highlight { background-color: #FFFF00; padding: 1px 3px; border-bottom: 1px solid #000; }
        .pt-description-instructions { font-family: "Times New Roman", serif; font-size: 8pt; margin-top: 3px; }
        .pt-section { margin-top: 15px; }
        .pt-section-title { font-weight: bold; }
        .pt-section-title .pt-highlight { font-weight: normal; }
        .pt-signature-section { display: flex; justify-content: space-between; margin-top: 0; }
        .pt-signature-box { width: 45%; text-align: center; }
        .pt-signature-content {
            height: 60px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            padding-bottom: 40px;
        }
        .pt-signature-field {
            font-size: 8pt;
        }
        .pt-signature-line { border-top: 1px solid #000; padding-top: 5px; font-size: 9pt; }
        .pt-footer { margin-top: 25px; font-size: 9pt; border-top: 1px solid #000; padding-top: 10px; }
        .pt-footer p { font-style: italic; margin: 0; }
        .pt-manual-description-box { 
            background-color: #FFFF00; 
            border: 1px solid #000; 
            min-height: 50px; 
            padding: 5px; 
            margin-top: 5px; 
            width: 100%; 
            box-sizing: border-box; 
            font-family: Calibri, sans-serif;
            font-size: 11pt;
        }
        .pt-remarks-table { border-collapse: collapse; width: 100%; border: 1px solid #000; }
        .pt-remarks-table td { border: 1px solid #000; padding: 5px; vertical-align: top; }
        .pt-composite-cell { padding: 0; }
        .pt-composite-cell-label { font-family: "Times New Roman", serif; font-size: 13pt; padding: 5px; }
        .pt-composite-cell-content { background-color: #FFFF00; padding: 5px; }
        .pt-zakres-content {
            min-height: 90px;
            font-size: 10pt;
            line-height: 1.2;
        }
        .pt-uwagi-content {
            min-height: 40px;
        }
        .pt-editable { 
            border: none; 
            min-width: 100px; 
            display: inline-block; 
        }
        .pt-editable-block { display: block; width: 100%; box-sizing: border-box; }
        .pt-remarks-content-short {
            min-height: 40px;
        }
        .pt-contact-label { font-family: "Times New Roman", serif; font-size: 13pt; }
        .pt-contact-content { min-height: 40px; }
        @media print {
            .pt-highlight, .pt-manual-description-box, .pt-composite-cell-content { background-color: transparent !important; }
        }
    `;

    // ZMIANA: Dodano brakującą funkcję
    const cleanUwagi = (text) => {
        if (!text) return 'Brak uwag';
        return text.replace(/&#x0D;/g, '');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="print-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                
                <div className="print-modal-header">
                    <h2>Podgląd i Edycja Karty Serwisu</h2>
                    <button onClick={handlePrint} className="print-icon-btn" title="Drukuj do PDF">
                        <Printer size={24} />
                    </button>
                </div>

                <div className="print-modal-body">
                    <div className="left-panel">
                        <h3>Dane z systemu</h3>
                        <div className="data-section">
                            <strong>Kontakt:</strong>
                            <p>{details.kontakt || 'Brak danych'}</p>
                        </div>
                        <div className="data-section">
                            <strong>Uwagi z zadań:</strong>
                            <pre>{cleanUwagi(details.wszystkie_uwagi)}</pre>
                        </div>
                    </div>

                    <div className="right-panel">
                        <div ref={printContentRef}>
                            <style>{printStyles}</style>
                            <div className="pt-body">
                                <div className="pt-container">
                                    <h2 className="pt-h2">
                                        <span className="pt-main-title">D - KARTA SERWISU OPROGRAMOWANIA</span>
                                        <span className="pt-subtitle">(załącznik do formularza „A”)</span>
                                    </h2>
                                    <div className="pt-main-info-section">
                                        <div className="pt-info-block pt-header-info">
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <label>Data zlecenia: </label>
                                                <span contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('dataZlecenia', e.target.innerText)} className="pt-highlight pt-editable">{editableData.dataZlecenia}</span>
                                            </div>
                                            <div style={{ flex: 1, textAlign: 'right' }}>
                                                <label>nr </label>
                                                <span contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('nrSprawy', e.target.innerText)} className="pt-highlight pt-editable" style={{width: '150px', textAlign: 'left'}}>{editableData.nrSprawy}</span>
                                            </div>
                                        </div>
                                        <div className="pt-info-block" style={{ textAlign: 'left' }}>
                                            <label>Nazwa zlecającego: </label>
                                            <span contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('nazwaZlecajacego', e.target.innerText)} className="pt-highlight pt-editable">{editableData.nazwaZlecajacego}</span>
                                        </div>
                                        <div className="pt-info-block" style={{display: 'flex', justifyContent: 'space-between'}}>
                                            <div>
                                                <label>Telefon, faks lub e-mail: </label>
                                                <span contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('kontaktTelefon', e.target.innerText)} className="pt-highlight pt-editable">{editableData.kontaktTelefon}</span>
                                            </div>
                                            <div>
                                                <label>Osoba kontaktowa: </label>
                                                <span contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('kontaktOsoba', e.target.innerText)} className="pt-highlight pt-editable">{editableData.kontaktOsoba}</span>
                                            </div>
                                        </div>
                                        <div className="pt-info-block" style={{textAlign: 'left'}}>
                                            <label>Opis przedmiotu zlecenia:</label>
                                            <div className="pt-manual-description-box pt-editable" contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('opisManualny', e.target.innerText)}>{editableData.opisManualny}</div>
                                            <div className="pt-description-instructions">(wpisać wszystkie uzgodnienia wstępne, których dokonano z klientem, wszystkie jego życzenia i uwagi dotyczące terminu realizacji)</div>
                                        </div>
                                        <div className="pt-info-block" style={{textAlign: 'left'}}>
                                            <label>Zaplanowany termin realizacji zlecenia: </label>
                                            <span contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('terminRealizacji', e.target.innerText)} className="pt-highlight pt-editable">{editableData.terminRealizacji}</span>
                                        </div>
                                    </div>
                                    <div className="pt-section">
                                        <p className="pt-section-title" style={{textAlign: 'left'}}>
                                            1. Nazwisko prowadzącego kartę „D” <span contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('prowadzacy', e.target.innerText)} className="pt-highlight pt-editable">{editableData.prowadzacy}</span> 
                                            Data rozpoczęcia <span contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('dataRozpoczecia', e.target.innerText)} className="pt-highlight pt-editable">{editableData.dataRozpoczecia}</span>
                                        </p>
                                    </div>
                                    <div className="pt-section">
                                        <table className="pt-remarks-table">
                                            <tbody>
                                                <tr>
                                                    <td className="pt-composite-cell">
                                                        <div className="pt-composite-cell-label">2. Zakres wykonywanych czynności*:</div>
                                                        <div className="pt-composite-cell-content pt-editable pt-editable-block pt-zakres-content" contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('zakresCzynnosci', e.target.innerText)} dangerouslySetInnerHTML={{ __html: editableData.zakresCzynnosci?.replace(/\n/g, '<br />') }}></div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pt-section">
                                        <table className="pt-remarks-table">
                                            <tbody>
                                                <tr>
                                                    <td className="pt-composite-cell">
                                                        <div className="pt-composite-cell-label">3. Uwagi serwisowe*:</div>
                                                        <div className="pt-composite-cell-content pt-editable pt-editable-block pt-uwagi-content" contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('uwagiSerwisowe', e.target.innerText)}>{editableData.uwagiSerwisowe}</div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pt-section">
                                        <table className="pt-remarks-table">
                                            <tbody>
                                                <tr>
                                                    <td className="pt-composite-cell">
                                                        <div className="pt-composite-cell-label">4. Dodatkowe usługi i materiały*:</div>
                                                        <div className="pt-remarks-content-short" style={{padding: '5px', backgroundColor: 'transparent'}}>&nbsp;</div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{padding: 0, border: 0}}>
                                                        <table className="pt-remarks-table" style={{border: 'none', width: '100%'}}>
                                                            <tbody>
                                                                <tr>
                                                                    <td className="pt-contact-label" style={{width: '50%', borderLeft: 'none', borderBottom: 'none', borderTop: 'none'}}>5.a) Osoba kontaktowa dla serwisu:</td>
                                                                    <td className="pt-contact-label" style={{borderRight: 'none', borderBottom: 'none', borderTop: 'none'}}>5. b) Kontakt:</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="pt-contact-content" style={{borderLeft: 'none', borderTop: 'none'}}>&nbsp;</td>
                                                                    <td className="pt-contact-content" style={{borderRight: 'none', borderTop: 'none'}}>&nbsp;</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pt-section" style={{marginTop: '5px'}}>
                                        <p className="pt-section-title" style={{fontWeight: 'normal', textAlign: 'left'}}>6. Potwierdzenie wykonania* (odbiór)</p>
                                        <div className="pt-signature-section">
                                            <div className="pt-signature-box">
                                                <div className="pt-signature-content"></div>
                                                <div className="pt-signature-line">data i podpis osoby serwisującej (wykonującej)</div>
                                            </div>
                                            <div className="pt-signature-box">
                                                <div className="pt-signature-content"></div>
                                                <div className="pt-signature-line">data, pieczęć i podpis klienta potwierdzające realizację</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-footer">
                                        <p>
                                            Kartę zakończono i oddano w dniu <span contentEditable suppressContentEditableWarning={true} onBlur={e => handleContentChange('dataOddania', e.target.innerText)} className="pt-highlight pt-editable">{editableData.dataOddania}</span>
                                            Podpis prowadzącego kartę „D”: <span className="pt-highlight pt-editable">{editableData.podpisProwadzacego}</span>
                                        </p>
                                        <p>
                                            Po zakończeniu realizacji etapu serwis oprogramowania wypełniony formularz wraz z załącznikami należy zwrócić prowadzącemu zlecenie.
                                        </p>
                                        <p>
                                            * Rubryki w niniejszym formularzu należy wypełniać stosownie do potrzeb realizacji zlecenia. Niepotrzebne rubryki należy wykreślić.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrintModal;
