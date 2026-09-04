import { useState, useEffect } from 'react';
import api from '../config/axiosConfig';
import { LayoutDashboard, AlertTriangle, TrendingUp, CalendarClock, Info, CheckCircle2, Loader2 } from 'lucide-react';
import './logigrame.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/api/logigramme/dashboard');
        setData(response.data);
      } catch (error) {
        console.error("Erreur chargement dashboard :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}><Loader2 className="header-icon" style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', width: '3rem', height: '3rem' }} /></div>;
  }

  // Permet de colorer la barre de progression selon l'avancement
  const getProgressClass = (taux) => {
    if (taux < 30) return 'low';
    if (taux < 70) return 'mid';
    return 'high';
  };

  return (
    <div className="app-container">
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div className="header-icon-box"><LayoutDashboard className="header-icon" /></div>
          <h1 className="header-title">Vue d'ensemble</h1>
        </div>

        {/* --- LIGNE DU HAUT : STATS GLOBALES --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Semaine actuelle */}
          <div className="table-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <CalendarClock size={48} style={{ color: 'var(--indigo-600)', marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--slate-500)', fontSize: '1rem', fontWeight: 600 }}>Nous sommes en</h3>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--slate-800)' }}>
              Semaine {data.semaineActuelle}
            </div>
          </div>

          {/* Avancement Global */}
          <div className="table-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ color: 'var(--slate-500)', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} /> Avancement Global des cours
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Cumul des heures réalisées toutes filières confondues</p>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--indigo-600)' }}>
                {data.avancementGlobal.toFixed(1)}%
              </span>
            </div>
            
            <div className="progress-bg" style={{ height: '1.25rem' }}>
              <div 
                className={`progress-fill ${getProgressClass(data.avancementGlobal)}`} 
                style={{ width: `${data.avancementGlobal}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* --- COLONNE GAUCHE : ALERTES (SEMAINE PROCHAINE) --- */}
          <div className="table-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            
            {/* Titre dynamique */}
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle style={{ color: 'var(--orange-500)' }} size={20} />
              {data.semaineActuelle < 48 
                ? `À prévoir la semaine prochaine (S${data.semaineActuelle + 1})` 
                : "Fin de l'année scolaire (S48)"
              }
            </h2>

            {/* Affichage conditionnel selon la semaine et les alertes */}
            {data.semaineActuelle === 48 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)', backgroundColor: 'var(--slate-50)', borderRadius: '0.5rem' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--indigo-500)', margin: '0 auto 1rem auto' }} />
                <p style={{ fontWeight: '500' }}>L'année scolaire est terminée !</p>
                <p style={{ fontSize: '0.875rem' }}>Aucun événement à prévoir.</p>
              </div>
            ) : data.alertes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)', backgroundColor: 'var(--slate-50)', borderRadius: '0.5rem' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--emerald-500)', margin: '0 auto 1rem auto' }} />
                <p>Aucun événement majeur n'est prévu la semaine prochaine.</p>
              </div>
            ) : (
              data.alertes.map((alerte, idx) => (
                <div key={idx} className={`alert-card ${alerte.type}`}>
                  <Info size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{alerte.filiereNom}</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>{alerte.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* --- COLONNE DROITE : AVANCEMENT PAR FILIÈRE --- */}
          <div className="table-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Détails de l'avancement par filière
            </h2>

            {data.avancementParFiliere.length === 0 ? (
              <p style={{ color: 'var(--slate-500)', textAlign: 'center', padding: '1rem' }}>Aucune donnée de filière.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {data.avancementParFiliere.map((f, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>{f.filiereNom}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                        {f.heuresFaites}h / {f.heuresTotales}h ({f.taux.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="progress-bg">
                      <div className={`progress-fill ${getProgressClass(f.taux)}`} style={{ width: `${f.taux}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}