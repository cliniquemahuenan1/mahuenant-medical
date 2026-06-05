import { useState } from 'react'
import { useAuth } from './hooks/useAuth.jsx'
import LoginPage from './pages/LoginPage.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PatientsPage from './pages/PatientsPage.jsx'
import DossierPatient from './pages/DossierPatient.jsx'
import NouvelleConsultation from './pages/NouvelleConsultation.jsx'

export default function App() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [consultSpec, setConsultSpec] = useState(null)
  const [consultPatient, setConsultPatient] = useState(null)

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#073d28' }}>
      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:14 }}>Chargement...</div>
    </div>
  )

  if (!user) return <LoginPage />

  function navigate(p, spec, pat) {
    if (p === 'consultation-spec') {
      setConsultSpec(spec)
      setConsultPatient(pat || null)
      setPage('nouvelle-consultation')
    } else if (p === 'nouvelle-consultation') {
      setConsultSpec(null)
      setConsultPatient(pat || null)
      setPage('nouvelle-consultation')
    } else {
      setPage(p)
    }
  }

  function selectPatient(p) {
    setSelectedPatient(p)
    setPage('dossier')
  }

  return (
    <Layout page={page} onNavigate={navigate}>
      {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
      {page === 'patients' && <PatientsPage onNavigate={navigate} onSelectPatient={selectPatient} />}
      {page === 'dossier' && selectedPatient && (
        <DossierPatient
          patient={selectedPatient}
          onNavigate={navigate}
          onNewConsultation={p => { setConsultPatient(p); setPage('nouvelle-consultation') }}
        />
      )}
      {page === 'nouvelle-consultation' && (
        <NouvelleConsultation
          key={Date.now()}
          preselectedPatient={consultPatient}
          preselectedSpecialite={consultSpec}
          onDone={() => { setPage('consultations'); navigate('dashboard') }}
        />
      )}
      {page === 'consultations' && (
        <ConsultationsPage onSelectPatient={selectPatient} />
      )}
    </Layout>
  )
}

// Page consultations simple
import { useEffect } from 'react'
import { supabase } from './lib/supabase.js'
function ConsultationsPage({ onSelectPatient }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('consultations').select('*, patients(nom, prenom, numero_dossier)').order('date_consultation', { ascending:false }).limit(50)
      .then(({ data }) => { setData(data||[]); setLoading(false) })
  }, [])
  return (
    <div style={{ padding:24 }}>
      <h2 style={{ fontSize:20, fontWeight:400, marginBottom:20 }}>Toutes les consultations</h2>
      <div style={{ background:'white', borderRadius:12, border:'0.5px solid #dde5dd', overflow:'hidden' }}>
        {loading ? <div style={{ padding:24, textAlign:'center', color:'#8fa08f' }}>Chargement...</div>
        : data.map((c, i) => (
          <div key={c.id} onClick={() => c.patients && onSelectPatient(c.patients)}
            style={{ display:'grid', gridTemplateColumns:'1fr 1fr 120px 80px', gap:12, padding:'11px 16px', borderBottom: i<data.length-1 ? '0.5px solid #f0f4f0' : 'none', cursor:'pointer', alignItems:'center' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fbf9'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{c.patients?.prenom} {c.patients?.nom}</div>
              <div style={{ fontSize:11, color:'#8fa08f' }}>{c.patients?.numero_dossier} • {c.motif?.substring(0,40)}</div>
            </div>
            <div style={{ fontSize:12, color:'#5a6e5a' }}>Dr {c.medecin_nom || '—'}</div>
            <div style={{ fontSize:11, color:'#5a6e5a' }}>{new Date(c.date_consultation).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })}</div>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background: c.statut==='cloture' ? '#e6f4ef' : '#fdf3e0', color: c.statut==='cloture' ? '#0a5c3c' : '#c9901a' }}>
              {c.statut==='cloture' ? 'Clôturé' : 'En cours'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
