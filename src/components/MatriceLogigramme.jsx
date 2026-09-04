import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/axiosConfig';
import { CalendarDays, Save, Loader2, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './logigrame.css'; 

const moisAnnee = [
  { nom: 'Septembre', semaines: 4 }, { nom: 'Octobre', semaines: 4 },
  { nom: 'Novembre', semaines: 4 }, { nom: 'Décembre', semaines: 5 },
  { nom: 'Janvier', semaines: 4 }, { nom: 'Février', semaines: 4 },
  { nom: 'Mars', semaines: 4 }, { nom: 'Avril', semaines: 4 },
  { nom: 'Mai', semaines: 4 }, { nom: 'Juin', semaines: 4 },
  { nom: 'Juillet', semaines: 4 }, { nom: 'Août', semaines: 3 }
];

export default function MatriceLogigramme() {
  const [annee, setAnnee] = useState(''); 
  const [filiereId, setFiliereId] = useState(''); 
  const [niveau, setNiveau] = useState('1A');
  const [hoveredWeek, setHoveredWeek] = useState(null);

  const [filieres, setFilieres] = useState([]);
  const [anneesScolaires, setAnneesScolaires] = useState([]); 
  const [modules, setModules] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventModal, setEventModal] = useState(null); 
  
  const [edits, setEdits] = useState({}); 
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // État pour le chargement Excel


  // 1. Chargement initial
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [resFilieres, resAnnees] = await Promise.all([
          api.get('/api/logigramme/filieres'),
          api.get('/api/logigramme/annees') 
        ]);

        setFilieres(resFilieres.data);
        if (resFilieres.data.length > 0) {
          setFiliereId(resFilieres.data[0].id.toString());
        }

        setAnneesScolaires(resAnnees.data);
        if (resAnnees.data.length > 0) {
          setAnnee(resAnnees.data[0].libelle);
        }
      } catch (error) {
        console.error("Erreur lors du chargement initial :", error);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch des données
  const fetchLogigrammeData = useCallback(async () => {
    if (!filiereId) return;
    setLoading(true);
    try {
      const [resModules, resEvenements] = await Promise.all([
        api.get(`/api/logigramme/modules/filiere/${filiereId}`),
        api.get(`/api/logigramme/evenements/filiere/${filiereId}`)
      ]);

      const modulesFormates = resModules.data.map(mod => ({
        id: mod.id,
        nom: mod.nomModule,
        vhg: mod.volumeHoraireGlobal,
        formateur: mod.formateur,
        repartition: mod.repartition || {} 
      }));

      const evenementsFormates = resEvenements.data.map(ev => ({
        semaineIndex: ev.semaineIndex,
        type: ev.type.toLowerCase(),
        titre: ev.titre
      }));

      setModules(modulesFormates);
      setEvenements(evenementsFormates);
      setEdits({}); 
    } catch (error) {
      console.error("Erreur - matrice :", error);
    } finally {
      setLoading(false);
    }
  }, [filiereId]);

  useEffect(() => {
    fetchLogigrammeData();
  }, [fetchLogigrammeData]);

  // --- LOGIQUE DES ÉVÉNEMENTS & SAUVEGARDE ---
  const handleSaveEvent = async (typeEvent) => {
    if (!eventModal) return;
    try {
      await api.post(`/api/logigramme/evenements/filiere/${filiereId}?semaineIndex=${eventModal.semaine}&type=${typeEvent}`);
      setEventModal(null);
      fetchLogigrammeData(); 
    } catch (error) {
      console.error("Erreur lors de la modification de l'événement:", error);
    }
  };

  const handleHeureChange = (moduleId, semaineIndex, valeur) => {
    const parsedValue = valeur === '' ? '' : parseInt(valeur);
    setEdits(prev => ({
      ...prev,
      [`${moduleId}-${semaineIndex}`]: parsedValue
    }));
  };

  const handleSave = async () => {
    if (Object.keys(edits).length === 0) return; 
    setIsSaving(true);
    const payload = Object.entries(edits).map(([key, heures]) => {
      const [moduleId, semaineIndex] = key.split('-');
      return { moduleId: parseInt(moduleId), semaineIndex: parseInt(semaineIndex), heures: heures === '' ? 0 : heures };
    });

    try {
      await api.post('/api/logigramme/planifications/bulk', payload);
      alert("Planification enregistrée avec succès !");
      fetchLogigrammeData(); 
    } catch (error) {
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- FONCTION EXPORT EXCEL ---
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      // On gèle les 3 premières colonnes (Unités, Formateur, VHG) et les 2 premières lignes (En-têtes)
      const sheet = workbook.addWorksheet('Logigramme', { views: [{ state: 'frozen', ySplit: 2, xSplit: 3 }] });

      // LIGNE 1 : En-tête des mois
      const row1 = ['Unités de formation', 'Formateur', 'VHG'];
      moisAnnee.forEach(mois => {
        row1.push(mois.nom);
        // Ajout de colonnes vides pour la fusion
        for (let i = 1; i < mois.semaines; i++) row1.push('');
      });
      const header1 = sheet.addRow(row1);

      // LIGNE 2 : En-tête des semaines
      const row2 = ['', '', ''];
      semainesArray.forEach(s => row2.push(`S${s}`));
      const header2 = sheet.addRow(row2);

      // Fusions des mois (Merge Cells)
      let colIndex = 4;
      moisAnnee.forEach(mois => {
        sheet.mergeCells(1, colIndex, 1, colIndex + mois.semaines - 1);
        colIndex += mois.semaines;
      });
      sheet.mergeCells('A1:A2');
      sheet.mergeCells('B1:B2');
      sheet.mergeCells('C1:C2');

      // Styles des en-têtes
      [header1, header2].forEach(row => {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }; // slate-200
          cell.font = { bold: true, color: { argb: 'FF334155' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });

      // LIGNES DE DONNÉES (Modules)
      modules.forEach((mod) => {
        const rowData = [mod.nom, mod.formateur || 'Non assigné', mod.vhg];
        
        semainesArray.forEach(s => {
          const event = evenements.find(e => e.semaineIndex === s);
          if (event) {
            rowData.push(event.type.charAt(0).toUpperCase()); // Ajoute 'E', 'V', ou 'C'
          } else {
            const editKey = `${mod.id}-${s}`;
            const val = edits[editKey] !== undefined ? edits[editKey] : mod.repartition[s];
            rowData.push(val || '');
          }
        });
        
        const dataRow = sheet.addRow(rowData);
        
        // Alignement et couleurs
        dataRow.getCell(1).alignment = { wrapText: true, vertical: 'middle' };
        dataRow.getCell(2).alignment = { vertical: 'middle' };
        dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

        // Styliser les colonnes des semaines et les événements
        semainesArray.forEach((s, i) => {
          const cell = dataRow.getCell(i + 4);
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = { top: { style: 'dotted', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'dotted', color: { argb: 'FFCBD5E1' } } };

          const event = evenements.find(e => e.semaineIndex === s);
          if (event) {
            let color = 'FFEEEEEE';
            if (event.type === 'examen') color = 'FFFEE2E2'; // red-100
            if (event.type === 'vacances') color = 'FFD1FAE5'; // emerald-100
            if (event.type === 'controle') color = 'FFFFEDD5'; // orange-100
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
            cell.font = { color: { argb: 'FF94A3B8' }, size: 9 };
          }
        });
      });

      // LIGNE FOOTER : Totaux
      const footerData = ['Total Heures', '', modules.reduce((sum, mod) => sum + mod.vhg, 0)];
      semainesArray.forEach(s => {
        const sum = modules.reduce((sTotal, mod) => {
          const editKey = `${mod.id}-${s}`;
          const val = edits[editKey] !== undefined ? edits[editKey] : (mod.repartition[s] || 0);
          return sTotal + (val === '' ? 0 : parseInt(val));
        }, 0);
        footerData.push(sum > 0 ? sum : '');
      });
      const footerRow = sheet.addRow(footerData);
      footerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FF4338CA' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = { top: { style: 'medium' } };
      });
      sheet.mergeCells(`A${footerRow.number}:B${footerRow.number}`);
      footerRow.getCell(1).alignment = { horizontal: 'right' };

      // Ajustement des largeurs de colonnes
      sheet.getColumn(1).width = 35;
      sheet.getColumn(2).width = 20;
      sheet.getColumn(3).width = 10;
      for (let i = 4; i <= 3 + semainesArray.length; i++) {
        sheet.getColumn(i).width = 5;
      }

      // Génération et téléchargement du fichier
      const buffer = await workbook.xlsx.writeBuffer();
      const filiereNom = filieres.find(f => f.id.toString() === filiereId)?.nomFiliere || 'Filiere';
      saveAs(new Blob([buffer]), `Logigramme_${filiereNom}_${annee.replace(/\s/g, '')}.xlsx`);
    } catch (error) {
      console.error('Erreur lors de la génération du fichier Excel:', error);
      alert("Une erreur est survenue lors de l'export Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- CALCULS ---
  const getWeekDateRange = (weekGlobalIndex) => {
    const baseYear = annee ? parseInt(annee.split('-')[0].trim()) : new Date().getFullYear();
    let startDate = new Date(baseYear, 8, 1); 
    while (startDate.getDay() !== 1) startDate.setDate(startDate.getDate() + 1);
    const targetMonday = new Date(startDate);
    targetMonday.setDate(targetMonday.getDate() + ((weekGlobalIndex - 1) * 7));
    const targetSaturday = new Date(targetMonday);
    targetSaturday.setDate(targetSaturday.getDate() + 5);
    return `${targetMonday.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} - ${targetSaturday.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ${targetSaturday.getFullYear()}`;
  };

  const totalSemaines = moisAnnee.reduce((acc, mois) => acc + mois.semaines, 0);
  const semainesArray = Array.from({ length: totalSemaines }, (_, i) => i + 1);

  if (loading && modules.length === 0) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="header-icon" style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <div className="header-icon-box">
            <CalendarDays className="header-icon" />
          </div>
          <div>
            <h1 className="header-title">Logigramme Dynamique</h1>
            <p className="header-subtitle">Planification des formateurs & modules</p>
          </div>
        </div>

        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Année Scolaire</label>
            <select value={annee} onChange={(e) => setAnnee(e.target.value)} className="filter-select">
              {anneesScolaires.length === 0 ? (
                <option value="">Aucune année disponible</option>
              ) : (
                anneesScolaires.map((a) => (
                  <option key={a.id} value={a.libelle}>{a.libelle}</option>
                ))
              )}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Filière</label>
            <select value={filiereId} onChange={(e) => setFiliereId(e.target.value)} className="filter-select select-white">
              {filieres.map((f) => (
                <option key={f.id} value={f.id}>{f.nomFiliere} - {f.niveau}</option>
              ))}
            </select>
          </div>

          <div className="save-btn-container" style={{ display: 'flex', gap: '0.75rem' }}>
            {/* NOUVEAU BOUTON EXPORT EXCEL */}
            <button 
              className="export-btn" 
              onClick={exportToExcel} 
              disabled={isExporting || modules.length === 0}
              title="Télécharger en format Excel"
            >
              {isExporting ? <Loader2 className="save-btn-icon" style={{ animation: 'spin 1s linear infinite' }} /> : <Download className="save-btn-icon" />} 
              Exporter
            </button>

            <button 
              className="save-btn" 
              onClick={handleSave} 
              disabled={isSaving || Object.keys(edits).length === 0}
              style={{ opacity: Object.keys(edits).length === 0 ? 0.6 : 1 }}
            >
              {isSaving ? <Loader2 className="save-btn-icon" style={{ animation: 'spin 1s linear infinite' }} /> : <Save className="save-btn-icon" />} 
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="table-card">
          <div className="table-wrapper">
            <table className="logigramme-table">
              <thead>
                <tr>
                  <th className="th-unites">Unités de formation</th>
                  <th className="th-formateur">Formateur</th>
                  <th className="th-vhg">VHG</th>
                  {moisAnnee.map((mois, idx) => (
                    <th key={idx} colSpan={mois.semaines} className="th-mois">{mois.nom}</th>
                  ))}
                </tr>
                <tr>
                  <th className="th-empty"></th><th className="th-empty"></th><th className="th-empty"></th>
                  {semainesArray.map(semaine => {
                    const event = evenements.find(e => e.semaineIndex === semaine);
                    return (
                      <th 
                        key={semaine} 
                        className={`th-semaine ${event ? `event-${event.type}` : ''}`}
                        onMouseEnter={() => setHoveredWeek(semaine)}
                        onMouseLeave={() => setHoveredWeek(null)}
                        onClick={() => setEventModal({ semaine: semaine })}
                      >
                        S{semaine}
                        {hoveredWeek === semaine && (
                          <div className="tooltip-wrapper">
                            <div className="tooltip-content">
                              <span className="tooltip-title">Semaine {semaine}</span>
                              <span className="tooltip-date">{getWeekDateRange(semaine)}</span>
                              {event && <span className={`tooltip-badge ${event.type}`}>{event.titre}</span>}
                            </div>
                            <div className="tooltip-arrow"></div>
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod.id} className="tr-module">
                    <td className="td-unites" title={mod.nom}>{mod.nom}</td>
                    <td className="td-formateur" title={mod.formateur}>
                      <div className="formateur-container">
                        <div className="formateur-avatar">{mod.formateur ? mod.formateur.charAt(0).toUpperCase() : '?'}</div>
                        {mod.formateur || "Non assigné"}
                      </div>
                    </td>
                    <td className="td-vhg">{mod.vhg}</td>

                    {semainesArray.map(semaine => {
                      const event = evenements.find(e => e.semaineIndex === semaine);
                      if (event) return <td key={semaine} className={`td-event bg-${event.type}`}></td>;

                      const editKey = `${mod.id}-${semaine}`;
                      const valeurActuelle = edits[editKey] !== undefined ? edits[editKey] : mod.repartition[semaine];

                      return (
                        <td key={semaine} className={`td-cell ${valeurActuelle ? 'has-heures' : ''}`}>
                          <input 
                            type="number" 
                            className="cell-input"
                            min="0"
                            max="40"
                            value={valeurActuelle || ''}
                            onChange={(e) => handleHeureChange(mod.id, semaine, e.target.value)}
                            placeholder="-"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                <tr className="tr-footer">
                  <td className="td-footer-label" colSpan="2">Total Heures par semaine</td>
                  <td className="td-footer-total">{modules.reduce((sum, mod) => sum + mod.vhg, 0)}</td>
                  {semainesArray.map(semaine => {
                    const event = evenements.find(e => e.semaineIndex === semaine);
                    if (event) return <td key={semaine} className="td-footer-cell"><span className={`footer-badge badge-${event.type}`}>Evt</span></td>;

                    const sum = modules.reduce((s, mod) => {
                      const editKey = `${mod.id}-${semaine}`;
                      const valeur = edits[editKey] !== undefined ? edits[editKey] : (mod.repartition[semaine] || 0);
                      return s + (valeur === '' ? 0 : parseInt(valeur));
                    }, 0);

                    return <td key={semaine} className="td-footer-cell-text">{sum > 0 ? sum : ''}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      
      {/* --- FENÊTRE MODAL DES ÉVÉNEMENTS --- */}
      {eventModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Semaine {eventModal.semaine}</h3>
            <div className="modal-grid">
              <button className="modal-btn examen" onClick={() => handleSaveEvent('EXAMEN')}>Semaine d'examens</button>
              <button className="modal-btn controle" onClick={() => handleSaveEvent('CONTROLE')}>Contrôles Continus</button>
              <button className="modal-btn vacances" onClick={() => handleSaveEvent('VACANCES')}>Vacances</button>
              <button className="modal-btn aucun" onClick={() => handleSaveEvent('AUCUN')}>Aucun événement (Effacer)</button>
            </div>
            <button className="modal-cancel" onClick={() => setEventModal(null)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}