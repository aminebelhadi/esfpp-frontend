import React, { useState, useEffect } from 'react';
import api from '../config/axiosConfig';
import { Plus, Trash2, GraduationCap, Calendar, BookOpen } from 'lucide-react';
import './logigrame.css'; 

export default function AdminSettings() {
  const [filieres, setFilieres] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [modulesListe, setModulesListe] = useState([]); 
  const [formateurs, setFormateurs] = useState([]); 
  
  const [newFiliere, setNewFiliere] = useState({ nomFiliere: '', niveau: '1A' });
  const [newAnnee, setNewAnnee] = useState({ libelle: '' });
  
  const [selectedFiliereId, setSelectedFiliereId] = useState('');
  
  const [newModule, setNewModule] = useState({ nomModule: '', volumeHoraireGlobal: '', formateurId: '' });

  // 1. Chargement initial (Filières, Années ET Formateurs)
  const fetchData = async () => {
    try {
      const [resFilieres, resAnnees, resFormateurs] = await Promise.all([
        api.get('/api/logigramme/filieres'),
        api.get('/api/logigramme/annees'),
        api.get('/api/logigramme/formateurs')
      ]);
      setFilieres(resFilieres.data);
      setAnnees(resAnnees.data);
      setFormateurs(resFormateurs.data);
      
      if (resFilieres.data.length > 0 && !selectedFiliereId) {
        setSelectedFiliereId(resFilieres.data[0].id.toString());
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Chargement dynamique des modules quand on change de filière
  useEffect(() => {
    if (selectedFiliereId) {
      const fetchModules = async () => {
        try {
          const res = await api.get(`/api/logigramme/modules/filiere/${selectedFiliereId}`);
          setModulesListe(res.data);
        } catch (error) {
          console.error("Erreur chargement modules:", error);
        }
      };
      fetchModules();
    }
  }, [selectedFiliereId]);

  // ==================== GESTION DES FILIÈRES ====================
  const handleAddFiliere = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/logigramme/filieres', newFiliere);
      setNewFiliere({ nomFiliere: '', niveau: '1A' });
      fetchData();
    } catch (error) {
      console.error("Erreur ajout filière", error);
    }
  };

  const handleDeleteFiliere = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette filière ? (Cela supprimera aussi ses modules)")) {
      try {
        await api.delete(`/api/logigramme/filieres/${id}`);
        fetchData();
        if (id.toString() === selectedFiliereId) {
          setSelectedFiliereId('');
          setModulesListe([]);
        }
      } catch (error) {
        console.error("Erreur suppression filière", error);
      }
    }
  };

  // ==================== GESTION DES ANNÉES SCOLAIRES ====================
  const handleAddAnnee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/logigramme/annees', {
        libelle: newAnnee.libelle,
        estActive: true 
      });
      setNewAnnee({ libelle: '' });
      fetchData();
    } catch (error) {
      console.error("Erreur ajout année", error);
    }
  };

  const handleDeleteAnnee = async (id) => {
    if (window.confirm("Supprimer cette année scolaire ?")) {
      try {
        await api.delete(`/api/logigramme/annees/${id}`);
        fetchData();
      } catch (error) {
        console.error("Erreur suppression année", error);
      }
    }
  };

  // ==================== GESTION DES MODULES ====================
  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      const url = `/api/logigramme/modules/filiere/${selectedFiliereId}${newModule.formateurId ? `?formateurId=${newModule.formateurId}` : ''}`;
      
      await api.post(url, {
        nomModule: newModule.nomModule,
        volumeHoraireGlobal: parseInt(newModule.volumeHoraireGlobal)
      });
      
      setNewModule({ nomModule: '', volumeHoraireGlobal: '', formateurId: '' });
      
      const res = await api.get(`/api/logigramme/modules/filiere/${selectedFiliereId}`);
      setModulesListe(res.data);
    } catch (error) {
      console.error("Erreur ajout module", error);
    }
  };

  const handleDeleteModule = async (id) => {
    if (window.confirm("Supprimer ce module ?")) {
      try {
        await api.delete(`/api/logigramme/modules/${id}`);
        setModulesListe(modulesListe.filter(m => m.id !== id));
      } catch (error) {
        console.error("Erreur suppression module", error);
      }
    }
  };

  return (
    <div className="app-container">
      
      {/* CORRECTION DU SCROLL : Ajout d'un wrapper interne scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        
        <h1 className="header-title" style={{ marginBottom: '2rem' }}>Administration du système</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* CARTE FILIÈRES */}
          <div className="table-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <GraduationCap style={{ color: 'var(--indigo-600)' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Gestion des Filières</h2>
            </div>
            
            <form onSubmit={handleAddFiliere} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Ex: Radiologie" 
                value={newFiliere.nomFiliere}
                onChange={(e) => setNewFiliere({ ...newFiliere, nomFiliere: e.target.value })}
                className="filter-select select-white" 
                style={{ flex: 1 }}
                required
              />
              <select 
                value={newFiliere.niveau}
                onChange={(e) => setNewFiliere({ ...newFiliere, niveau: e.target.value })}
                className="filter-select select-white"
              >
                <option value="1A">1ère Année</option>
                <option value="2A">2ème Année</option>
                <option value="3A">3ème Année</option>
              </select>
              <button type="submit" className="save-btn"><Plus size={18} /> Ajouter</button>
            </form>

            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--slate-200)', borderRadius: '0.375rem' }}>
              <table className="logigramme-table" style={{ margin: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th className="th-unites">Filière</th>
                    <th className="th-vhg">Niveau</th>
                    <th className="th-vhg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filieres.map(f => (
                    <tr key={f.id} className="tr-module">
                      <td className="td-unites">{f.nomFiliere}</td>
                      <td className="td-vhg">{f.niveau}</td>
                      <td className="td-vhg">
                        <button type="button" onClick={() => handleDeleteFiliere(f.id)} style={{ color: 'var(--red-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARTE ANNÉES SCOLAIRES */}
          <div className="table-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Calendar style={{ color: 'var(--indigo-600)' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Années Scolaires</h2>
            </div>
            
            <form onSubmit={handleAddAnnee} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Ex: 2027 - 2028" 
                value={newAnnee.libelle}
                onChange={(e) => setNewAnnee({ libelle: e.target.value })}
                className="filter-select select-white" 
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="save-btn"><Plus size={18} /> Ajouter</button>
            </form>
            
            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--slate-200)', borderRadius: '0.375rem' }}>
              <table className="logigramme-table" style={{ margin: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th className="th-unites">Année Scolaire</th>
                    <th className="th-vhg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {annees.map(a => (
                    <tr key={a.id} className="tr-module">
                      <td className="td-unites">{a.libelle}</td>
                      <td className="td-vhg">
                        <button type="button" onClick={() => handleDeleteAnnee(a.id)} style={{ color: 'var(--red-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
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

        {/* CARTE GESTION DES MODULES */}
        <div className="table-card" style={{ padding: '1.5rem', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BookOpen style={{ color: 'var(--indigo-600)' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Gestion des Modules</h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label className="filter-label" style={{ marginBottom: 0 }}>Afficher pour :</label>
              <select 
                value={selectedFiliereId}
                onChange={(e) => setSelectedFiliereId(e.target.value)}
                className="filter-select select-white"
              >
                <option value="" disabled>-- Sélectionner une filière --</option>
                {filieres.map(f => (
                  <option key={f.id} value={f.id}>{f.nomFiliere} - {f.niveau}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            
            {/* Formulaire d'ajout de module */}
            <div style={{ backgroundColor: 'var(--slate-50)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--slate-200)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Ajouter un module</h3>
              <form onSubmit={handleAddModule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="filter-group">
                  <label className="filter-label">Nom du module</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Soins infirmiers de base" 
                    value={newModule.nomModule}
                    onChange={(e) => setNewModule({ ...newModule, nomModule: e.target.value })}
                    className="filter-select select-white" 
                    required
                    disabled={!selectedFiliereId}
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Volume Horaire Global (VHG)</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Ex: 150" 
                    value={newModule.volumeHoraireGlobal}
                    onChange={(e) => setNewModule({ ...newModule, volumeHoraireGlobal: e.target.value })}
                    className="filter-select select-white" 
                    required
                    disabled={!selectedFiliereId}
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Formateur assigné</label>
                  <select 
                    value={newModule.formateurId}
                    onChange={(e) => setNewModule({ ...newModule, formateurId: e.target.value })}
                    className="filter-select select-white"
                    disabled={!selectedFiliereId}
                  >
                    <option value="">-- Sans formateur --</option>
                    {formateurs.map(formateur => (
                      <option key={formateur.id} value={formateur.id}>
                        {formateur.nom} {formateur.prenom}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="save-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={!selectedFiliereId}>
                  <Plus size={18} /> Enregistrer
                </button>
              </form>
            </div>

            {/* Tableau des modules */}
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--slate-200)', borderRadius: '0.375rem' }}>
              <table className="logigramme-table" style={{ margin: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th className="th-unites">Nom du Module</th>
                    <th className="th-formateur">Formateur</th>
                    <th className="th-vhg">VHG</th>
                    <th className="th-vhg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {modulesListe.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>
                        Aucun module trouvé pour cette filière.
                      </td>
                    </tr>
                  ) : (
                    modulesListe.map(m => (
                      <tr key={m.id} className="tr-module">
                        <td className="td-unites" title={m.nom || m.nomModule}>{m.nom || m.nomModule}</td>
                        
                        <td className="td-formateur" style={{ padding: '0.75rem 1rem' }}>
                          {m.formateur || <span style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>Non assigné</span>}
                        </td>

                        <td className="td-vhg">{m.vhg || m.volumeHoraireGlobal} h</td>
                        <td className="td-vhg">
                          <button type="button" onClick={() => handleDeleteModule(m.id)} style={{ color: 'var(--red-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div> {/* Fin du wrapper de scroll */}
    </div>
  );
}