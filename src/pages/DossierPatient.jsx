import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export default function DossierPatient({ patient, onNavigate, onNewConsultation }) {
  const [consultations, setConsultations] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (patient) loadConsultations() }, [patient])

  async function loadConsultations() {
    const { data } = await supabase.from('consultations')
      .select('*').eq('patient_id', patient.id)
      .order('date_consultation', { ascending:false })
    setConsultations(data || [])
    if (data?.length > 0) setSelected(data[0])
    setLoading(false)
  }

  const age = patient?.date_naissance
    ? Math.floor((Date.now() - new Date(patient.date_naissance)) / (1000*60*60*24*365.25))
    : null

  const SPEC_COLORS = { generale:'#0a5c3c', pediatrie:'#1a5fa8', obstetrique:'#c0392b', cardiologie:'#d4600a', neurologie:'#6c3fa0', diabetologie:'#c9901a' }

  return (
    <div style={{ padding:24 }}>
      {/* Patient header */}
      <div style={{ background:'white', borderRadius:12, border:'0.5px solid #dde5dd', padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'#e6f4ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:500, color:'#0a5c3c', flexShrink:0 }}>
          {(patient.prenom?.[0]||'?')}{(patient.nom?.[0]||'?')}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:500, color:'#1a2a1a', fontFamily:"'DM Serif Display',serif" }}>{patient.prenom} {patient.nom}</div>
          <div style={{ fontSize:12, color:'#5a6e5a', marginTop:2 }}>
            {patient.numero_dossier} • {age ? age+' ans' : '—'} • {patient.sexe || '—'} • {patient.telephone || '—'}
          </div>
          {patient.allergies && (
            <div style={{ marginTop:4, fontSize:11, background:'#fdecea', color:'#c0392b', display:'inline-block', padding:'2px 8px', borderRadius:6 }}>
              ⚠ Allergies : {patient.allergies}
            </div>
          )}
        </div>
        <button onClick={() => onNewConsultation(patient)}
          style={{ padding:'8px 16px', background:'#0a5c3c', color:'white', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:6 }}>
          <i className="ti ti-plus" /> Nouvelle consultation
        </button>
      </div>

      {/* Antécédents */}
      {(patient.atcd_medicaux || patient.atcd_chirurgicaux || patient.atcd_familiaux) && (
        <div style={{ background:'#fdf3e0', border:'1px solid #f5d99a', borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:500, color:'#c9901a', marginBottom:6 }}><i className="ti ti-history" /> Antécédents</div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'#5a6e5a' }}>
            {patient.atcd_medicaux && <span><strong>Médicaux :</strong> {patient.atcd_medicaux}</span>}
            {patient.atcd_chirurgicaux && <span><strong>Chirurgicaux :</strong> {patient.atcd_chirurgicaux}</span>}
            {patient.atcd_familiaux && <span><strong>Familiaux :</strong> {patient.atcd_familiaux}</span>}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>
        {/* Timeline des consultations */}
        <div>
          <div style={{ fontSize:12, fontWeight:500, color:'#5a6e5a', marginBottom:10 }}>
            Historique ({consultations.length} consultation{consultations.length > 1 ? 's' : ''})
          </div>
          {loading ? (
            <div style={{ color:'#8fa08f', fontSize:13, padding:8 }}>Chargement...</div>
          ) : consultations.length === 0 ? (
            <div style={{ color:'#8fa08f', fontSize:13, padding:8 }}>Aucune consultation</div>
          ) : consultations.map(c => (
            <div key={c.id} onClick={() => setSelected(c)}
              style={{
                padding:'10px 12px', borderRadius:8, cursor:'pointer', marginBottom:6,
                background: selected?.id === c.id ? '#e6f4ef' : 'white',
                border: selected?.id === c.id ? '1px solid #1a8a5a' : '0.5px solid #dde5dd',
                transition:'all 0.15s'
              }}>
              <div style={{ fontSize:12, fontWeight:500, color:'#1a2a1a' }}>
                {new Date(c.date_consultation).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })}
              </div>
              <div style={{ fontSize:11, color:'#5a6e5a', marginTop:2 }}>Dr {c.medecin_nom || '—'}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background: SPEC_COLORS[c.specialite]+'20', color: SPEC_COLORS[c.specialite] || '#5a6e5a' }}>
                  {c.specialite || 'Générale'}
                </span>
                <span style={{ fontSize:10, color: c.statut === 'cloture' ? '#0a5c3c' : '#c9901a' }}>
                  {c.statut === 'cloture' ? '✓ Clôturée' : '○ En cours'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Détail de la consultation sélectionnée */}
        <div>
          {!selected ? (
            <div style={{ background:'white', borderRadius:12, border:'0.5px solid #dde5dd', padding:32, textAlign:'center', color:'#8fa08f', fontSize:13 }}>
              Sélectionnez une consultation
            </div>
          ) : (
            <ConsultationDetail consultation={selected} />
          )}
        </div>
      </div>
    </div>
  )
}

function ConsultationDetail({ consultation: c }) {
  const sections = [
    { key:'diagnostic', label:'Orientation diagnostique', icon:'ti-stethoscope', color:'#1a5fa8', bg:'#e8f1fb' },
    { key:'bilan', label:'Bilan paraclinique', icon:'ti-microscope', color:'#0a5c3c', bg:'#e6f4ef' },
    { key:'therapeutique', label:'Orientation thérapeutique', icon:'ti-pill', color:'#6c3fa0', bg:'#f0eaf9' },
    { key:'alertes', label:'Alertes et suivi', icon:'ti-alert-triangle', color:'#c9901a', bg:'#fdf3e0' },
  ]
  const sectionKeys = { diagnostic:'diagnostic_ia', bilan:'bilan_recommande', therapeutique:'orientation_therapeutique', alertes:'alertes' }

  return (
    <div>
      {/* En-tête */}
      <div style={{ background:'white', borderRadius:12, border:'0.5px solid #dde5dd', padding:'14px 18px', marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:500, color:'#1a2a1a' }}>
              Consultation du {new Date(c.date_consultation).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </div>
            <div style={{ fontSize:12, color:'#5a6e5a', marginTop:2 }}>Médecin : Dr {c.medecin_nom || '—'} • {c.specialite || 'Médecine générale'}</div>
          </div>
          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:10, background: c.statut === 'cloture' ? '#e6f4ef' : '#fdf3e0', color: c.statut === 'cloture' ? '#0a5c3c' : '#c9901a' }}>
            {c.statut === 'cloture' ? 'Clôturée' : 'En cours'}
          </span>
        </div>

        {/* Constantes */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {c.temperature && <Chip icon="ti-thermometer" val={c.temperature+'°C'} warn={c.temperature > 37.5} />}
          {c.tension_systolique && <Chip icon="ti-activity" val={`${c.tension_systolique}/${c.tension_diastolique} mmHg`} warn={c.tension_systolique > 140} />}
          {c.frequence_cardiaque && <Chip icon="ti-heartbeat" val={c.frequence_cardiaque+' bpm'} warn={c.frequence_cardiaque > 100 || c.frequence_cardiaque < 60} />}
          {c.spo2 && <Chip icon="ti-droplet" val={c.spo2+'% SpO2'} warn={c.spo2 < 95} />}
          {c.poids && <Chip icon="ti-weight" val={c.poids+' kg'} />}
        </div>

        {c.motif && (
          <div style={{ marginTop:10, padding:'8px 12px', background:'#f4f6f4', borderRadius:8, fontSize:13, color:'#1a2a1a' }}>
            <strong>Motif :</strong> {c.motif}
          </div>
        )}

        {c.symptomes?.length > 0 && (
          <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:4 }}>
            {c.symptomes.map(s => (
              <span key={s} style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'#f0f4f0', color:'#5a6e5a' }}>{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Résultats IA */}
      {sections.map(sec => {
        const content = c[sectionKeys[sec.key]]
        if (!content) return null
        return (
          <div key={sec.key} style={{ background:'white', borderRadius:10, border:'0.5px solid #dde5dd', marginBottom:10, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', background:sec.bg, display:'flex', alignItems:'center', gap:8 }}>
              <i className={`ti ${sec.icon}`} style={{ color:sec.color, fontSize:15 }} />
              <span style={{ fontSize:12, fontWeight:500, color:sec.color }}>{sec.label}</span>
            </div>
            <div style={{ padding:'12px 14px', fontSize:13, lineHeight:1.7, color:'#1a2a1a', whiteSpace:'pre-wrap' }}>{content}</div>
          </div>
        )
      })}

      {/* Notes médecin */}
      {(c.prescriptions || c.notes_medecin) && (
        <div style={{ background:'white', borderRadius:10, border:'0.5px solid #dde5dd', padding:'12px 16px', marginBottom:10 }}>
          {c.prescriptions && <div style={{ marginBottom:8 }}><strong style={{ fontSize:12, color:'#5a6e5a' }}>Ordonnance :</strong><div style={{ fontSize:13, whiteSpace:'pre-wrap', marginTop:4 }}>{c.prescriptions}</div></div>}
          {c.notes_medecin && <div><strong style={{ fontSize:12, color:'#5a6e5a' }}>Notes :</strong><div style={{ fontSize:13, whiteSpace:'pre-wrap', marginTop:4 }}>{c.notes_medecin}</div></div>}
        </div>
      )}
    </div>
  )
}

function Chip({ icon, val, warn }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, padding:'3px 9px', borderRadius:20, background: warn ? '#fdecea' : '#f4f6f4', color: warn ? '#c0392b' : '#5a6e5a' }}>
      <i className={`ti ${icon}`} style={{ fontSize:12 }} />{val}
    </span>
  )
}
