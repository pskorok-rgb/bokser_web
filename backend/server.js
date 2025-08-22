const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
const port = 5001;

// --- KONFIGURACJA BAZY DANYCH ---
const dbConfig = {
    user: 'serwis',
    password: 'uscusc',
    server: 'vsf4.technikait.corp',
    database: 'Bokser',
    options: {
        trustServerCertificate: true
    },
    requestTimeout: 60000 
};

// --- ENDPOINTY APLIKACJI ---

// ENDPOINT 1: Pobiera listę unikalnych działów (bez "MARAT")
app.get('/api/dzialy', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        const result = await request.query(`
            SELECT DISTINCT dzial 
            FROM dbo.bokser_sprawy 
            WHERE dzial IS NOT NULL AND dzial <> 'MARAT' 
            ORDER BY dzial;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Błąd podczas pobierania listy działów:", err);
        res.status(500).send("Błąd serwera");
    }
});

// ZAKTUALIZOWANY ENDPOINT 2: Dodano pobieranie kolumny "kontakt"
app.get('/api/sprawy', async (req, res) => {
    const { startDate, endDate, dzialy, searchTerm, kontrahentSearch, pokazPrzedawnione, page = 1, limit = 15 } = req.query;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        const offset = (page - 1) * limit;

        let baseQuery = `
            FROM dbo.bokser_sprawy AS s
            LEFT JOIN dbo.bokser_kontrahenci AS k ON s.akronim = k.akronim
        `;
        let filterConditions = ' WHERE 1=1 ';

        if (dzialy) {
            const dzialyArray = dzialy.split(',');
            if (dzialyArray.length > 0) {
                const dzialyParams = dzialyArray.map((d, i) => `@dzial${i}`);
                filterConditions += ` AND s.dzial IN (${dzialyParams.join(',')})`;
                dzialyArray.forEach((d, i) => { request.input(`dzial${i}`, sql.NVarChar, d); });
            }
        }

        if (pokazPrzedawnione === 'true') {
            filterConditions += ` AND s.data_plan < GETDATE() AND s.status IN (1, 2)`;
        } else if (kontrahentSearch) {
            filterConditions += ` AND k.miasto LIKE @kontrahentSearch`;
            request.input('kontrahentSearch', sql.NVarChar, `%${kontrahentSearch}%`);
        } else {
            if (startDate && endDate) {
                filterConditions += ` AND s.data_plan >= @startDate AND s.data_plan < DATEADD(day, 1, @endDate)`;
                request.input('startDate', sql.Date, startDate);
                request.input('endDate', sql.Date, endDate);
            } else if (startDate) {
                filterConditions += ` AND s.data_plan >= @startDate`;
                request.input('startDate', sql.Date, startDate);
            }

            if (searchTerm) {
                filterConditions += ` AND s.nr_sprawy LIKE @searchTerm`;
                request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
            }
        }
        
        const countQuery = `SELECT COUNT(*) AS total ${baseQuery} ${filterConditions}`;
        const dataQuery = `
            SELECT
                s.nr_sprawy,
                (SELECT STUFF((SELECT DISTINCT CHAR(10) + z.przedmiot FROM dbo.bokser_zadania z WHERE z.nr_spr = s.nr_sprawy AND z.przedmiot IS NOT NULL FOR XML PATH('')), 1, 1, '')) AS lista_przedmiotow,
                k.nazwa AS nazwa_kontrahenta,
                s.akronim AS kontrahent_akronim,
                s.kontakt, -- DODANO NOWĄ KOLUMNĘ
                s.data_plan,
                s.godz_plan,
                s.data_zak,
                CASE s.status WHEN 1 THEN 'Otwarta' WHEN 2 THEN 'W trakcie realizacji' WHEN 3 THEN 'Zakończona' ELSE 'Nieznany' END AS status_opis
            ${baseQuery}
            ${filterConditions}
            ORDER BY s.data_plan DESC
            OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY;
        `;
        
        const countResult = await request.query(countQuery);
        const dataResult = await request.query(dataQuery);

        res.json({
            sprawy: dataResult.recordset,
            totalRecords: countResult.recordset[0].total,
            totalPages: Math.ceil(countResult.recordset[0].total / limit)
        });
    } catch (err) {
        console.error("Błąd serwera przy pobieraniu listy spraw:", err);
        res.status(500).send("Błąd podczas pobierania listy spraw");
    }
});

// ENDPOINT 3: Pobiera zadania dla konkretnej sprawy
app.get('/api/zadania', async (req, res) => {
    const { nr_sprawy } = req.query;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        if (!nr_sprawy) {
            return res.status(400).send("Brak parametru nr_sprawy");
        }
        request.input('nr_sprawy_param', sql.NVarChar, nr_sprawy);
        const result = await request.query(`
            SELECT czynnosc, przedmiot, wykonawca AS serwisant, data_wyk,
                   CASE status WHEN 1 THEN 'Otwarta' WHEN 2 THEN 'W trakcie realizacji' WHEN 3 THEN 'Zakończona' ELSE 'Nieznany' END AS status_opis,
                   uwagi
            FROM dbo.bokser_zadania 
            WHERE nr_spr = @nr_sprawy_param
            ORDER BY data_zad DESC;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Błąd serwera przy pobieraniu zadań dla sprawy:", err);
        res.status(500).send("Błąd podczas pobierania zadań");
    }
});

// ENDPOINT 4: Statystyki dla wykresu statusów spraw
app.get('/api/statystyki/statusy-spraw', async (req, res) => {
    const { startDate, endDate, dzialy } = req.query;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        let dateFilter = '';
        if (startDate && endDate) {
            dateFilter = `AND data_zgl >= @startDate AND data_zgl < DATEADD(day, 1, @endDate)`;
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        } else if (startDate) {
            dateFilter = `AND data_zgl >= @startDate`;
            request.input('startDate', sql.Date, startDate);
        }

        let dzialyFilter = '';
        if (dzialy) {
            const dzialyArray = dzialy.split(',');
            if (dzialyArray.length > 0) {
                const dzialyParams = dzialyArray.map((d, i) => `@dzial_s${i}`);
                dzialyFilter = ` AND dzial IN (${dzialyParams.join(',')})`;
                dzialyArray.forEach((d, i) => { request.input(`dzial_s${i}`, sql.NVarChar, d); });
            }
        }

        const query = `
            ;WITH SprawyFiltrowane AS (
                SELECT nr_sprawy, status, data_zgl, dzial FROM dbo.bokser_sprawy
                WHERE status IS NOT NULL AND nr_sprawy IS NOT NULL ${dateFilter} ${dzialyFilter}
            )
            SELECT
                COUNT(s1.nr_sprawy) AS liczba,
                CASE s1.status WHEN 1 THEN 'Otwarta' WHEN 2 THEN 'W trakcie realizacji' WHEN 3 THEN 'Zakończona' ELSE 'Nieznany' END AS status_opis,
                STUFF((SELECT ', ' + s2.nr_sprawy FROM SprawyFiltrowane s2 WHERE s2.status = s1.status FOR XML PATH('')), 1, 2, '') AS numery_spraw
            FROM SprawyFiltrowane s1
            GROUP BY s1.status;
        `;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Błąd serwera przy pobieraniu statystyk spraw:", err);
        res.status(500).send("Błąd podczas pobierania statystyk spraw");
    }
});

// ENDPOINT 5: Statystyki serwisantów
app.get('/api/statystyki/obciazenie-wykonawcow', async (req, res) => {
    const { startDate, endDate, dzialy } = req.query;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        let query = `
            ;WITH AktywniSerwisanci AS (
                SELECT u.nazwa, up.ser_u1, up.ser_u3, up.ser_erp
                FROM dbo.bokser_uzyt u
                LEFT JOIN dbo.bokser_upraw up ON u.login = up.uzyt
                WHERE u.aktywny = 1
            )
            SELECT COUNT(z.id_zd) AS liczba_zadan, z.wykonawca AS serwisant
            FROM dbo.bokser_zadania AS z
            INNER JOIN dbo.bokser_sprawy AS s ON z.nr_spr = s.nr_sprawy
            INNER JOIN AktywniSerwisanci AS aser ON z.wykonawca = aser.nazwa
            WHERE z.status = 3
        `;
        
        if (startDate && endDate) {
            query += ` AND z.data_wyk >= @startDate AND z.data_wyk < DATEADD(day, 1, @endDate)`;
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        } else if (startDate) {
            query += ` AND z.data_wyk >= @startDate`;
            request.input('startDate', sql.Date, startDate);
        }

        if (dzialy) {
            const dzialyArray = dzialy.split(',');
            if (dzialyArray.length > 0) {
                const dzialyParams = dzialyArray.map((d, i) => `@dzial${i}`);
                query += ` AND s.dzial IN (${dzialyParams.join(',')})`;
                dzialyArray.forEach((d, i) => { request.input(`dzial${i}`, sql.NVarChar, d); });
                
                const permissionConditions = [];
                if (dzialyArray.includes('U1S')) { permissionConditions.push('aser.ser_u1 = 1'); }
                if (dzialyArray.includes('U3S') || dzialyArray.includes('U3E')) { permissionConditions.push('aser.ser_u3 = 1'); }
                
                if (permissionConditions.length > 0) {
                    query += ` AND (${permissionConditions.join(' OR ')})`;
                }
            }
        }

        query += ` GROUP BY z.wykonawca HAVING COUNT(z.id_zd) > 0 ORDER BY liczba_zadan DESC;`;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Błąd serwera przy pobieraniu statystyk serwisantów:", err);
        res.status(500).send("Błąd podczas pobierania statystyk serwisantów");
    }
});

// ENDPOINT 6: Statystyki przedmiotów
app.get('/api/statystyki/przedmioty', async (req, res) => {
    const { startDate, endDate, dzialy } = req.query;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        let query = `
            ;WITH AktywniSerwisanci AS (
                SELECT u.nazwa, up.ser_u1, up.ser_u3, up.ser_erp
                FROM dbo.bokser_uzyt u
                LEFT JOIN dbo.bokser_upraw up ON u.login = up.uzyt
                WHERE u.aktywny = 1
            )
            SELECT TOP 10 z.przedmiot, COUNT(z.id_zd) AS liczba_zadan
            FROM dbo.bokser_zadania AS z
            INNER JOIN dbo.bokser_sprawy AS s ON z.nr_spr = s.nr_sprawy
            INNER JOIN AktywniSerwisanci AS aser ON z.wykonawca = aser.nazwa
            WHERE z.status = 3 AND z.przedmiot IS NOT NULL AND z.przedmiot <> ''
        `;

        if (startDate && endDate) {
            query += ` AND z.data_wyk >= @startDate AND z.data_wyk < DATEADD(day, 1, @endDate)`;
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        } else if (startDate) {
            query += ` AND z.data_wyk >= @startDate`;
            request.input('startDate', sql.Date, startDate);
        }

        if (dzialy) {
            const dzialyArray = dzialy.split(',');
            if (dzialyArray.length > 0) {
                const dzialyParams = dzialyArray.map((d, i) => `@dzial${i}`);
                query += ` AND s.dzial IN (${dzialyParams.join(',')})`;
                dzialyArray.forEach((d, i) => { request.input(`dzial${i}`, sql.NVarChar, d); });
                
                const permissionConditions = [];
                if (dzialyArray.includes('U1S')) { permissionConditions.push('aser.ser_u1 = 1'); }
                if (dzialyArray.includes('U3S') || dzialyArray.includes('U3E')) { permissionConditions.push('aser.ser_u3 = 1'); }
                
                if (permissionConditions.length > 0) {
                    query += ` AND (${permissionConditions.join(' OR ')})`;
                }
            }
        }
        
        query += ` GROUP BY z.przedmiot ORDER BY liczba_zadan DESC;`;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Błąd serwera przy pobieraniu statystyk przedmiotów:", err);
        res.status(500).send("Błąd podczas pobierania statystyk przedmiotów");
    }
});

// ENDPOINT 7: Statystyki dla rocznego przeglądu
app.get('/api/statystyki/roczny-przeglad', async (req, res) => {
    const { dzialy } = req.query;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        let query = `
            ;WITH AktywniSerwisanci AS (
                SELECT u.nazwa, up.ser_u1, up.ser_u3, up.ser_erp
                FROM dbo.bokser_uzyt u
                LEFT JOIN dbo.bokser_upraw up ON u.login = up.uzyt
                WHERE u.aktywny = 1
            )
            SELECT 
                MONTH(z.data_wyk) AS miesiac,
                z.przedmiot,
                COUNT(z.id_zd) AS liczba_zadan
            FROM dbo.bokser_zadania AS z
            INNER JOIN dbo.bokser_sprawy AS s ON z.nr_spr = s.nr_sprawy
            INNER JOIN AktywniSerwisanci AS aser ON z.wykonawca = aser.nazwa
            WHERE 
                z.status = 3 
                AND z.przedmiot IS NOT NULL AND z.przedmiot <> ''
                AND YEAR(z.data_wyk) = YEAR(GETDATE())
        `;

        if (dzialy) {
            const dzialyArray = dzialy.split(',');
            if (dzialyArray.length > 0) {
                const dzialyParams = dzialyArray.map((d, i) => `@dzial${i}`);
                query += ` AND s.dzial IN (${dzialyParams.join(',')})`;
                dzialyArray.forEach((d, i) => { request.input(`dzial${i}`, sql.NVarChar, d); });
                
                const permissionConditions = [];
                if (dzialyArray.includes('U1S')) { permissionConditions.push('aser.ser_u1 = 1'); }
                if (dzialyArray.includes('U3S') || dzialyArray.includes('U3E')) { permissionConditions.push('aser.ser_u3 = 1'); }
                
                if (permissionConditions.length > 0) {
                    query += ` AND (${permissionConditions.join(' OR ')})`;
                }
            }
        }
        
        query += ` GROUP BY MONTH(z.data_wyk), z.przedmiot;`;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Błąd serwera przy pobieraniu danych rocznych:", err);
        res.status(500).send("Błąd podczas pobierania danych rocznych");
    }
});

// ENDPOINT 8: Statystyki dla wykresu kompetencji serwisantów
app.get('/api/statystyki/kompetencje', async (req, res) => {
    const { startDate, endDate, dzialy } = req.query;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        let query = `
            ;WITH AktywniSerwisanci AS (
                SELECT u.nazwa, up.ser_u1, up.ser_u3, up.ser_erp
                FROM dbo.bokser_uzyt u
                LEFT JOIN dbo.bokser_upraw up ON u.login = up.uzyt
                WHERE u.aktywny = 1
            )
            SELECT 
                z.wykonawca AS serwisant,
                z.przedmiot,
                COUNT(z.id_zd) AS liczba_zadan
            FROM dbo.bokser_zadania AS z
            INNER JOIN dbo.bokser_sprawy AS s ON z.nr_spr = s.nr_sprawy
            INNER JOIN AktywniSerwisanci AS aser ON z.wykonawca = aser.nazwa
            WHERE 
                z.status = 3 
                AND z.przedmiot IS NOT NULL AND z.przedmiot <> ''
        `;

        if (startDate && endDate) {
            query += ` AND z.data_wyk >= @startDate AND z.data_wyk < DATEADD(day, 1, @endDate)`;
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        } else if (startDate) {
            query += ` AND z.data_wyk >= @startDate`;
            request.input('startDate', sql.Date, startDate);
        }

        if (dzialy) {
            const dzialyArray = dzialy.split(',');
            if (dzialyArray.length > 0) {
                const dzialyParams = dzialyArray.map((d, i) => `@dzial${i}`);
                query += ` AND s.dzial IN (${dzialyParams.join(',')})`;
                dzialyArray.forEach((d, i) => { request.input(`dzial${i}`, sql.NVarChar, d); });
                
                const permissionConditions = [];
                if (dzialyArray.includes('U1S')) { permissionConditions.push('aser.ser_u1 = 1'); }
                if (dzialyArray.includes('U3S') || dzialyArray.includes('U3E')) { permissionConditions.push('aser.ser_u3 = 1'); }
                
                if (permissionConditions.length > 0) {
                    query += ` AND (${permissionConditions.join(' OR ')})`;
                }
            }
        }
        
        query += ` GROUP BY z.wykonawca, z.przedmiot ORDER BY serwisant, liczba_zadan DESC;`;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Błąd serwera przy pobieraniu danych kompetencji:", err);
        res.status(500).send("Błąd podczas pobierania danych kompetencji");
    }
});

// ENDPOINT 9: Pobiera szczegóły sprawy do wydruku
app.get('/api/sprawa-details', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        const { nr_sprawy } = req.query;

        if (!nr_sprawy) {
            return res.status(400).send("Brak parametru nr_sprawy");
        }
        
        request.input('nr_sprawy_param', sql.NVarChar, nr_sprawy);

        const result = await request.query(`
            SELECT 
                s.akronim, s.data_zak, s.wlasciciel, s.kto, s.kontakt, s.opis,
                (
                    SELECT z.uwagi + CHAR(13) + CHAR(10) + '--------------------' + CHAR(13) + CHAR(10)
                    FROM dbo.bokser_zadania z
                    WHERE z.nr_spr = s.nr_sprawy AND z.uwagi IS NOT NULL AND z.uwagi <> ''
                    FOR XML PATH('')
                ) AS wszystkie_uwagi,
                (
                    SELECT DISTINCT z.przedmiot + CHAR(13) + CHAR(10)
                    FROM dbo.bokser_zadania z
                    WHERE z.nr_spr = s.nr_sprawy AND z.przedmiot IS NOT NULL AND z.przedmiot <> ''
                    FOR XML PATH('')
                ) AS wszystkie_przedmioty
            FROM dbo.bokser_sprawy s
            WHERE s.nr_sprawy = @nr_sprawy_param;
        `);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send("Nie znaleziono sprawy o podanym numerze.");
        }
    } catch (err) {
        console.error("Błąd serwera przy pobieraniu szczegółów sprawy:", err);
        res.status(500).send("Błąd podczas pobierania szczegółów sprawy");
    }
});
// ZAKTUALIZOWANY ENDPOINT 10: Pobiera historię operacji z POPRAWNEJ TABELI
app.get('/api/sprawa-history', async (req, res) => {
    const { nr_sprawy } = req.query;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        if (!nr_sprawy) {
            return res.status(400).send("Brak parametru nr_sprawy");
        }
        
        request.input('nr_sprawy_param', sql.NVarChar, nr_sprawy);
        
        // ZMIANA: Używamy poprawnej tabeli 'bokser_sprawy_op' i kolumny 'kiedy'
        const result = await request.query(`
            SELECT 
                kiedy AS data_op,
                kto,
                opis
            FROM 
                dbo.bokser_sprawy_op 
            WHERE 
                LTRIM(RTRIM(nr_sprawy)) = LTRIM(RTRIM(@nr_sprawy_param))
            ORDER BY 
                kiedy DESC;
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Błąd serwera przy pobieraniu historii sprawy:", err);
        res.status(500).send("Błąd podczas pobierania historii sprawy");
    }
});
// NOWY ENDPOINT 11: Zlicza przedawnione sprawy
app.get('/api/sprawy/przedawnione-count', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        // ZMIANA: Dodano warunek wykluczający dział 'MARAT'
        const result = await request.query(`
            SELECT COUNT(*) as count 
            FROM dbo.bokser_sprawy 
            WHERE data_plan < GETDATE() 
            AND status IN (1, 2) 
            AND dzial <> 'MARAT'
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Błąd serwera przy zliczaniu spraw przedawnionych:", err);
        res.status(500).send("Błąd serwera");
    }
});
// NOWY ENDPOINT 12: do pobierania szczegółów konkretnego kontrahenta
app.get('/api/kontrahenci/:akronim', async (req, res) => {
    const { akronim } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        
        const kontrahentResult = await pool.request()
            .input('akronim', sql.NVarChar, akronim)
            .query(`
                SELECT 
                    akronim, nazwa, miasto, adres, telefon, email, kodpocz, IDUSC
                FROM bokser_kontrahenci 
                WHERE akronim = @akronim
            `);

        if (kontrahentResult.recordset.length === 0) {
            return res.status(404).send('Nie znaleziono kontrahenta o podanym akronimie.');
        }

        const kontrahentData = kontrahentResult.recordset[0];

        const umowyResult = await pool.request()
            .input('akronim', sql.NVarChar, akronim)
            .query(`
                SELECT przedmiot_umowy, koniec_umowy, uwagi, kto_serwisuje
                FROM bokser_umowy
                WHERE akronim = @akronim
                ORDER BY koniec_umowy DESC
            `);
        
        const finalResponse = {
            ...kontrahentData,
            umowy: umowyResult.recordset 
        };

        res.json(finalResponse);

    } catch (err) {
        console.error('Błąd serwera przy pobieraniu danych kontrahenta i umów:', err);
        res.status(500).send('Błąd serwera');
    }
});
// --- URUCHOMIENIE SERWERA ---
app.listen(port, () => {
    console.log(`Backend serwera działa na http://localhost:${port}`);
});
