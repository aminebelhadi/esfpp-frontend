import React, { useState, useEffect } from 'react';
import api from '../config/axiosConfig';
import { Plus, Trash2, Users, Printer, Eye, X } from 'lucide-react';
import './logigrame.css';

export default function FormateursManagement() {
  const [formateurs, setFormateurs] = useState([]);
  const [newFormateur, setNewFormateur] = useState({ nom: '', prenom: '', dateNaissance: '', chargeHoraire: '' });
  
  // État pour afficher la fiche de détails d'un formateur
  const [selectedFiche, setSelectedFiche] = useState(null);

  const fetchFormateurs = async () => {
    try {
      const res = await api.get('/api/logigramme/formateurs/details');
      setFormateurs(res.data);
    } catch (error) {
      console.error("Erreur chargement formateurs:", error);
    }
  };

  useEffect(() => {
    fetchFormateurs();
  }, []);

  const handleAddFormateur = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/logigramme/formateurs', {
        nom: newFormateur.nom,
        prenom: newFormateur.prenom,
        dateNaissance: newFormateur.dateNaissance,
        chargeHoraire: parseInt(newFormateur.chargeHoraire)
      });
      setNewFormateur({ nom: '', prenom: '', dateNaissance: '', chargeHoraire: '' });
      fetchFormateurs();
    } catch (error) {
      console.error("Erreur ajout formateur", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce formateur ? Ses modules deviendront 'Non assignés'.")) {
      try {
        await api.delete(`/api/logigramme/formateurs/${id}`);
        fetchFormateurs();
      } catch (error) {
        console.error("Erreur suppression", error);
      }
    }
  };

  // Lance la boîte de dialogue native du navigateur pour imprimer / sauvegarder en PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-container">
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div className="header-icon-box"><Users className="header-icon" /></div>
          <h1 className="header-title">Gestion des Formateurs</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          
          {/* COLONNE GAUCHE : Ajouter un formateur */}
          <div className="table-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Nouveau Formateur</h2>
            <form onSubmit={handleAddFormateur} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="filter-group">
                <label className="filter-label">Nom</label>
                <input type="text" value={newFormateur.nom} onChange={e => setNewFormateur({...newFormateur, nom: e.target.value})} className="filter-select select-white" required />
              </div>
              <div className="filter-group">
                <label className="filter-label">Prénom</label>
                <input type="text" value={newFormateur.prenom} onChange={e => setNewFormateur({...newFormateur, prenom: e.target.value})} className="filter-select select-white" required />
              </div>
              <div className="filter-group">
                <label className="filter-label">Date de Naissance</label>
                <input type="date" value={newFormateur.dateNaissance} onChange={e => setNewFormateur({...newFormateur, dateNaissance: e.target.value})} className="filter-select select-white" required />
              </div>
              <div className="filter-group">
                <label className="filter-label">Charge Horaire (h/semaine)</label>
                <input type="number" min="1" value={newFormateur.chargeHoraire} onChange={e => setNewFormateur({...newFormateur, chargeHoraire: e.target.value})} className="filter-select select-white" required />
              </div>
              <button type="submit" className="save-btn" style={{ justifyContent: 'center', marginTop: '1rem' }}><Plus size={18} /> Ajouter</button>
            </form>
          </div>

          {/* COLONNE DROITE : Liste des formateurs */}
          <div className="table-card" style={{ padding: '1.5rem' }}>
             <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Liste du Personnel</h2>
             <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid var(--slate-200)', borderRadius: '0.375rem' }}>
              <table className="logigramme-table" style={{ margin: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th className="th-unites">Nom Complet</th>
                    <th className="th-vhg">Charge H.</th>
                    <th className="th-vhg" style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formateurs.map(f => (
                    <tr key={f.id} className="tr-module">
                      <td className="td-unites">
                        <div className="formateur-container">
                          <div className="formateur-avatar">{f.nom.charAt(0).toUpperCase()}</div>
                          {f.nom} {f.prenom}
                        </div>
                      </td>
                      <td className="td-vhg">{f.chargeHoraire} h</td>
                      <td className="td-vhg" style={{ textAlign: 'center' }}>
                        {/* Bouton pour ouvrir la fiche (l'œil) */}
                        <button onClick={() => setSelectedFiche(f)} style={{ color: 'var(--indigo-600)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem' }} title="Voir la fiche">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleDelete(f.id)} style={{ color: 'var(--red-500)', background: 'none', border: 'none', cursor: 'pointer' }} title="Supprimer">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL : FICHE FORMATEUR (ZONE IMPRIMABLE) ================= */}
      {selectedFiche && (
        <div className="modal-overlay">
          {/* La classe 'fiche-print-zone' indique au CSS que c'est cette div qu'il faut imprimer */}
          <div className="modal-box fiche-print-zone" style={{ width: '500px', padding: '2rem' }}>
            
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button onClick={() => setSelectedFiche(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)' }}><X size={24} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--slate-200)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--slate-800)', margin: 0 }}>Fiche Renseignement Formateur</h2>
              <p style={{ color: 'var(--slate-500)', margin: 0 }}>École de Santé - ESFPP</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1rem', color: 'var(--slate-700)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>Nom :</span> <span>{selectedFiche.nom}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>Prénom :</span> <span>{selectedFiche.prenom}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>Date de naissance :</span> <span>{new Date(selectedFiche.dateNaissance).toLocaleDateString('fr-FR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>Charge horaire convenue :</span> <span>{selectedFiche.chargeHoraire} heures / semaine</span>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontWeight: 'bold', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Modules enseignés actuellement</h4>
              {selectedFiche.modules && selectedFiche.modules.length > 0 ? (
                <ul style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--slate-600)' }}>
                  {selectedFiche.modules.map((m, index) => <li key={index} style={{ marginBottom: '0.5rem' }}>{m}</li>)}
                </ul>
              ) : (
                <p style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>Aucun module assigné pour le moment.</p>
              )}
            </div>

            {/* Bouton d'impression caché lors de la génération du PDF (grâce à .no-print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
              <button onClick={handlePrint} className="save-btn" style={{ gap: '0.5rem' }}>
                <Printer size={18} /> Imprimer / Exporter PDF
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}