import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { SPECIALITES, SYMPTOMES, CHAMPS_SPECIALITE } from '../lib/data.js'
import { runDiagnosticIA } from '../lib/diagnostic.js'

const TABS = ['patient','constantes','clinique','specialite','diagnostic']

// Hook reconnaissance vocale
function useVoice(onResult) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSupported(true)
      const recognition = new SpeechRecognition()
      recognition.lang = 'fr-FR'
      recognition.continuous = true
      recognition.interimResults = false
      recognition.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ')
        onResult(transcript)
      }
      recognition.onend = () => setListening(false)
      recognition.onerror = () => setListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  const toggle = useCallback(() => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }, [listening])

  return { listening, supported, toggle }
}

// Bouton microphone
function MicButton({ onText, value, onChange, placeholder, rows = 3, style = {} }) {
  const [activeField, setActiveField] = useState(false)
  const { listening, supported, toggle } = useVoice((transcript) => {
    onChange(value ? value + ' ' + transcript : transcript)
  })

  if (!supported) {
    return (
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{ ...INPUT, width: '100%', resize: 'vertical', ...style }} />
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={listening ? '🎤 Parlez maintenant...' : placeholder}
        rows={rows}
        style={{ ...INPUT, width: '100%', resize: 'vertical', paddingRight: 44, ...style,
          border: listening ? '2px solid #c0392b' : undefined,
          background: listening ? '#fff8f8' : undefined
        }} />
      <button type="button" onClick={toggle}
        title={listening ? 'Arrêter l\'enregistrement' : 'Dicter par la voix'}
        style={{
          position: 'absolute', right: 8, top: 8,
          width: 30, height: 30, borderRadius: '50%',
          background: listening ? '#c0392b' : '#0a5c3c',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: listening ? '0 0 0 4px rgba(192,57,43,0.25)' : 'none',
          animation: listening ? 'pulse 1s infinite' : 'none'
        }}>
        <span style={{ fontSize: 14 }}>{listening ? '⏹' : '🎤'}</span>
      </button>
      {listening && (
        <div style={{ position: 'absolute', right: 44, top: 12, fontSize: 11, color: '#c0392b', fontWeight: 500 }}>
          En écoute...
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,0.4)} 50%{box-shadow:0 0 0 8px rgba(192,57,43,0)} }`}</style>
    </div>
  )
}

export default function NouvelleConsultation({ preselectedPatient, preselectedSpecialite, onDone }) {
  const { medecin } = useAuth()
  const [tab, setTab] = useState(0)
  const [patient, setPatient] = useState(preselectedPatient || null)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [specialite, setSpecialite] = useState(preselectedSpecialite || 'generale')
  const [constantes, setConstantes] = useState({})
  const [clinique, setClinique] = useState({ motif:'', symptomes:[], inspection:'', auscultation:'', autres_signes:'', traitements:'' })
  const [specData, setSpecData] = useState({})
  const [iaResult, setIaResult] = useState(null)
  const [iaLoading, setIaLoading] = useState(false)
  const [iaError, setIaError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const [prescriptions, setPrescriptions] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (patientSearch.trim().length < 2) { setPatientResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('patients').select('*').or(`nom.ilike.%${patientSearch}%,prenom.ilike.%${patientSearch}%`).limit(6)
      setPatientResults(data || [])
    }, 300)
    return () => clearTimeout(t)
  }, [patientSearch])

  const imc = constantes.poids && constantes.taille ? (constantes.poids / ((constantes.taille/100)**2)).toFixed(1) : null

  function toggleSymptom(s) {
    setClinique(p => ({...p, symptomes: p.symptomes.includes(s) ? p.symptomes.filter(x => x !== s) : [...p.symptomes, s]}))
  }

  async function lancerDiagnostic() {
    if (!patient) { alert('Veuillez sélectionner un patient'); setTab(0); return }
    setIaLoading(true); setIaError('')
    try {
      const result = await runDiagnosticIA({ patient, constantes: {...constantes, imc}, clinique, specialiteData: specData }, specialite)
      setIaResult(result)
    } catch (e) {
      setIaError('Erreur lors de l\'analyse IA. Vérifiez votre connexion.')
    }
    setIaLoading(false)
  }

  async function sauvegarder() {
    if (!patient) return alert('Patient requis')
    setSaving(true)
    const payload = {
      patient_id: patient.id,
      medecin_id: medecin?.id,
      medecin_nom: medecin ? `${medecin.prenom} ${medecin.nom}` : null,
      specialite,
      ...constantes,
      imc: imc ? parseFloat(imc) : null,
      motif: clinique.motif,
      symptomes: clinique.symptomes,
      inspection: clinique.inspection,
      auscultation: clinique.auscultation,
      autres_signes: clinique.autres_signes,
      donnees_specialite: specData,
      diagnostic_ia: iaResult?.diagnostic || null,
      bilan_recommande: iaResult?.bilan || null,
      orientation_therapeutique: iaResult?.therapeutique || null,
      alertes: iaResult?.alertes || null,
      prescriptions, notes_medecin: notes,
      statut: 'en_cours',
    }
    const { error } = await supabase.from('consultations').insert([payload])
    if (error) { alert('Erreur : ' + error.message); setSaving(false); return }
    setSaved(true); setSaving(false)
    setTimeout(() => onDone && onDone(), 1500)
  }

  if (saved) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
      <div style={{ fontSize:16, fontWeight:500, color:'#0a5c3c' }}>Consultation enregistrée</div>
      <div style={{ fontSize:13, color:'#5a6e5a', marginTop:4 }}>Redirection...</div>
    </div>
  )

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <h2 style={{ fontSize:20, fontWeight:400, marginBottom:20 }}>Nouvelle consultation</h2>

      {/* Progress tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:24, background:'white', borderRadius:10, border:'0.5px solid #dde5dd', overflow:'hidden' }}>
        {['Patient','Constantes','Clinique','Spécialité','Diagnostic IA'].map((label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ flex:1, padding:'10px 4px', border:'none', borderRight: i<4 ? '0.5px solid #dde5dd' : 'none', background: tab === i ? '#0a5c3c' : 'white', color: tab === i ? 'white' : '#5a6e5a', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight: tab === i ? 500 : 400, transition:'all 0.15s' }}>
            <span style={{ display:'block', fontSize:16, marginBottom:1 }}>{['👤','📊','🩺','🔬','🧠'][i]}</span>
            {label}
          </button>
        ))}
      </div>

      {/* TAB 0 : Patient */}
      {tab === 0 && (
        <div>
          <Card title="Sélection du patient">
            {patient ? (
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#e6f4ef', borderRadius:8 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#0a5c3c', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:13, fontWeight:500 }}>
                  {patient.prenom?.[0]}{patient.nom?.[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:500, fontSize:14 }}>{patient.prenom} {patient.nom}</div>
                  <div style={{ fontSize:12, color:'#5a6e5a' }}>{patient.numero_dossier} • {patient.telephone}</div>
                </div>
                <button onClick={() => setPatient(null)} style={{ background:'none', border:'none', color:'#c0392b', cursor:'pointer', fontSize:12 }}>Changer</button>
              </div>
            ) : (
              <div>
                <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Rechercher un patient par nom ou prénom..."
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid #dde5dd', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:8 }} />
                {patientResults.map(p => (
                  <div key={p.id} onClick={() => { setPatient(p); setPatientSearch(''); setPatientResults([]) }}
                    style={{ padding:'8px 12px', borderRadius:6, cursor:'pointer', border:'0.5px solid #dde5dd', marginBottom:6, background:'white', display:'flex', alignItems:'center', gap:10 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f4f6f4'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'#e6f4ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#0a5c3c' }}>{p.prenom?.[0]}{p.nom?.[0]}</div>
                    <div><div style={{ fontSize:13, fontWeight:500 }}>{p.prenom} {p.nom}</div><div style={{ fontSize:11, color:'#8fa08f' }}>{p.numero_dossier}</div></div>
                  </div>
                ))}
                {patientSearch.length >= 2 && patientResults.length === 0 && <div style={{ fontSize:12, color:'#8fa08f', padding:'6px 0' }}>Aucun résultat</div>}
              </div>
            )}
          </Card>

          <Card title="Spécialité">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:8 }}>
              {SPECIALITES.map(s => (
                <button key={s.id} onClick={() => setSpecialite(s.id)}
                  style={{ padding:'10px', borderRadius:8, border: specialite === s.id ? `2px solid ${s.color}` : '1px solid #dde5dd', background: specialite === s.id ? s.color+'12' : 'white', cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s' }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize:18, color:s.color, display:'block', marginBottom:4 }} />
                  <div style={{ fontSize:12, fontWeight: specialite === s.id ? 500 : 400, color: specialite === s.id ? s.color : '#5a6e5a' }}>{s.label}</div>
                </button>
              ))}
            </div>
          </Card>
          <NavBtn onNext={() => setTab(1)} />
        </div>
      )}

      {/* TAB 1 : Constantes */}
      {tab === 1 && (
        <div>
          <Card title="Signes vitaux">
            <Grid3>
              {[
                { id:'temperature', label:'Température (°C)', step:0.1 },
                { id:'tension_systolique', label:'TA systolique (mmHg)' },
                { id:'tension_diastolique', label:'TA diastolique (mmHg)' },
                { id:'frequence_cardiaque', label:'Fréquence cardiaque (bpm)' },
                { id:'frequence_respiratoire', label:'Fréquence respiratoire (/min)' },
                { id:'spo2', label:'SpO2 (%)', step:0.1 },
              ].map(f => (
                <Field key={f.id} label={f.label}>
                  <input type="number" step={f.step||1} value={constantes[f.id]||''} onChange={e => setConstantes(p => ({...p, [f.id]:e.target.value ? parseFloat(e.target.value) : ''}))}
                    style={INPUT} />
                  <VitalStatus id={f.id} val={constantes[f.id]} />
                </Field>
              ))}
            </Grid3>
            <Grid3 style={{ marginTop:12 }}>
              <Field label="Poids (kg)"><input type="number" step="0.1" value={constantes.poids||''} onChange={e => setConstantes(p => ({...p, poids:e.target.value ? parseFloat(e.target.value) : ''}))} style={INPUT} /></Field>
              <Field label="Taille (cm)"><input type="number" value={constantes.taille||''} onChange={e => setConstantes(p => ({...p, taille:e.target.value ? parseInt(e.target.value) : ''}))} style={INPUT} /></Field>
              <Field label="IMC calculé"><div style={{ padding:'8px 0', fontSize:20, fontWeight:500, color: imc ? (imc<18.5||imc>=30 ? '#c0392b' : '#0a5c3c') : '#8fa08f' }}>{imc || '—'}{imc && <span style={{ fontSize:12, fontWeight:400, color:'#8fa08f', marginLeft:4 }}>{imc<18.5?'Sous-poids':imc<25?'Normal':imc<30?'Surpoids':'Obésité'}</span>}</div></Field>
            </Grid3>
          </Card>
          <NavBtn onPrev={() => setTab(0)} onNext={() => setTab(2)} />
        </div>
      )}

      {/* TAB 2 : Clinique */}
      {tab === 2 && (
        <div>
          <div style={{ background:'#e6f4ef', border:'1px solid #b5d4b5', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#0a5c3c', display:'flex', alignItems:'center', gap:8 }}>
            🎤 <strong>Mode vocal activé</strong> — Cliquez sur le bouton microphone vert dans chaque champ et dictez votre texte en français. Cliquez à nouveau pour arrêter.
          </div>
          <Card title="Motif de consultation">
            <MicButton value={clinique.motif} onChange={v => setClinique(p => ({...p, motif:v}))}
              placeholder="Cliquez sur 🎤 et dictez le motif de consultation..." rows={3} />
          </Card>
          <Card title="Traitements en cours">
            <MicButton value={clinique.traitements} onChange={v => setClinique(p => ({...p, traitements:v}))}
              placeholder="Cliquez sur 🎤 et dictez les médicaments en cours..." rows={2} />
          </Card>
          <Card title="Symptômes — cliquez pour sélectionner">
            {Object.entries(SYMPTOMES).map(([cat, syms]) => (
              <div key={cat} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'#8fa08f', marginBottom:6, textTransform:'capitalize' }}>{cat}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {syms.map(s => (
                    <button key={s} onClick={() => toggleSymptom(s)}
                      style={{ padding:'4px 10px', borderRadius:20, fontSize:12, border: clinique.symptomes.includes(s) ? '1px solid #0a5c3c' : '1px solid #dde5dd', background: clinique.symptomes.includes(s) ? '#e6f4ef' : 'white', color: clinique.symptomes.includes(s) ? '#0a5c3c' : '#5a6e5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Card>
          <Card title="Examen clinique">
            <Grid2>
              <Field label="Inspection générale">
                <MicButton value={clinique.inspection} onChange={v => setClinique(p => ({...p, inspection:v}))}
                  placeholder="🎤 Dictez vos observations à l'inspection..." rows={3} />
              </Field>
              <Field label="Auscultation / Palpation">
                <MicButton value={clinique.auscultation} onChange={v => setClinique(p => ({...p, auscultation:v}))}
                  placeholder="🎤 Dictez les résultats de l'auscultation..." rows={3} />
              </Field>
            </Grid2>
            <Field label="Autres signes cliniques" style={{ marginTop:12 }}>
              <MicButton value={clinique.autres_signes} onChange={v => setClinique(p => ({...p, autres_signes:v}))}
                placeholder="🎤 Dictez les autres signes observés..." rows={2} />
            </Field>
          </Card>
          <NavBtn onPrev={() => setTab(1)} onNext={() => setTab(3)} />
        </div>
      )}

      {/* TAB 3 : Spécialité */}
      {tab === 3 && (
        <div>
          {CHAMPS_SPECIALITE[specialite]?.length > 0 ? (
            <Card title={`Champs spécifiques — ${SPECIALITES.find(s=>s.id===specialite)?.label}`}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {CHAMPS_SPECIALITE[specialite].map(f => (
                  <div key={f.id} style={{ gridColumn: f.type === 'textarea' ? 'span 2' : 'span 1' }}>
                    <label style={{ fontSize:11, color:'#5a6e5a', display:'block', marginBottom:4 }}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={specData[f.id]||''} onChange={e => setSpecData(p => ({...p, [f.id]:e.target.value}))} style={{...INPUT, width:'100%'}}>
                        <option value="">—</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea value={specData[f.id]||''} onChange={e => setSpecData(p => ({...p, [f.id]:e.target.value}))} rows={2} style={{...INPUT, width:'100%', resize:'vertical'}} />
                    ) : f.type === 'checkboxes' ? (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {f.options.map(o => (
                          <label key={o} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer' }}>
                            <input type="checkbox" checked={(specData[f.id]||[]).includes(o)}
                              onChange={e => setSpecData(p => ({...p, [f.id]: e.target.checked ? [...(p[f.id]||[]),o] : (p[f.id]||[]).filter(x=>x!==o)}))} />
                            {o}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input type={f.type} value={specData[f.id]||''} onChange={e => setSpecData(p => ({...p, [f.id]:e.target.value}))} style={{...INPUT, width:'100%'}} />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div style={{ background:'white', borderRadius:10, border:'0.5px solid #dde5dd', padding:24, textAlign:'center', color:'#8fa08f', fontSize:13 }}>
              Aucun champ spécifique pour la médecine générale.
            </div>
          )}
          <NavBtn onPrev={() => setTab(2)} onNext={() => setTab(4)} nextLabel="Lancer l'analyse IA →" onNextAction={lancerDiagnostic} />
        </div>
      )}

      {/* TAB 4 : Diagnostic */}
      {tab === 4 && (
        <div>
          {iaLoading && (
            <div style={{ background:'white', borderRadius:12, border:'0.5px solid #dde5dd', padding:40, textAlign:'center' }}>
              <div style={{ fontSize:13, color:'#5a6e5a', marginBottom:16 }}>Analyse IA en cours...</div>
              <div style={{ display:'flex', justifyContent:'center', gap:5 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#0a5c3c', animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}
              </div>
              <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
            </div>
          )}
          {iaError && <div style={{ background:'#fdecea', border:'1px solid #f5c6c6', borderRadius:10, padding:16, color:'#c0392b', fontSize:13, marginBottom:12 }}>{iaError}</div>}

          {iaResult && (
            <div>
              {[
                { key:'diagnostic', label:'Orientation diagnostique', icon:'ti-stethoscope', color:'#1a5fa8', bg:'#e8f1fb' },
                { key:'bilan', label:'Bilan paraclinique', icon:'ti-microscope', color:'#0a5c3c', bg:'#e6f4ef' },
                { key:'therapeutique', label:'Orientation thérapeutique', icon:'ti-pill', color:'#6c3fa0', bg:'#f0eaf9' },
                { key:'alertes', label:'Alertes et suivi', icon:'ti-alert-triangle', color:'#c9901a', bg:'#fdf3e0' },
              ].map(sec => iaResult[sec.key] ? (
                <div key={sec.key} style={{ background:'white', borderRadius:10, border:'0.5px solid #dde5dd', marginBottom:10, overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', background:sec.bg, display:'flex', alignItems:'center', gap:8 }}>
                    <i className={`ti ${sec.icon}`} style={{ color:sec.color, fontSize:15 }} />
                    <span style={{ fontSize:12, fontWeight:500, color:sec.color }}>{sec.label}</span>
                  </div>
                  <div style={{ padding:'12px 14px', fontSize:13, lineHeight:1.7, color:'#1a2a1a', whiteSpace:'pre-wrap' }}>{iaResult[sec.key]}</div>
                </div>
              ) : null)}

              <Card title="Notes du médecin">
                <Grid2>
                  <Field label="Prescriptions / Ordonnance">
                    <MicButton value={prescriptions} onChange={setPrescriptions}
                      placeholder="🎤 Dictez les médicaments, posologies, durées..." rows={4} />
                  </Field>
                  <Field label="Notes complémentaires">
                    <MicButton value={notes} onChange={setNotes}
                      placeholder="🎤 Dictez vos observations et plan de suivi..." rows={4} />
                  </Field>
                </Grid2>
              </Card>
            </div>
          )}

          {!iaLoading && !iaResult && (
            <div style={{ background:'white', borderRadius:12, border:'0.5px solid #dde5dd', padding:32, textAlign:'center' }}>
              <div style={{ fontSize:13, color:'#8fa08f', marginBottom:16 }}>Aucune analyse disponible</div>
              <button onClick={lancerDiagnostic} style={{ padding:'9px 18px', background:'#0a5c3c', color:'white', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                <i className="ti ti-brain" /> Lancer l'analyse
              </button>
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button onClick={() => setTab(3)} style={{ padding:'9px 16px', border:'1px solid #dde5dd', background:'white', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              ← Retour
            </button>
            {!iaLoading && (
              <>
                <button onClick={lancerDiagnostic} style={{ padding:'9px 16px', border:'1px solid #0a5c3c', background:'white', color:'#0a5c3c', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  <i className="ti ti-refresh" /> Relancer l'analyse
                </button>
                <button onClick={sauvegarder} disabled={saving}
                  style={{ padding:'9px 20px', background: saving ? '#8fa08f' : '#0a5c3c', color:'white', border:'none', borderRadius:8, fontSize:13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                  <i className="ti ti-device-floppy" /> {saving ? 'Enregistrement...' : 'Enregistrer la consultation'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Composants utilitaires
const INPUT = { padding:'7px 10px', border:'1px solid #dde5dd', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", width:'100%', background:'white', outline:'none' }
const Card = ({ title, children }) => (
  <div style={{ background:'white', borderRadius:12, border:'0.5px solid #dde5dd', padding:'14px 18px', marginBottom:14 }}>
    {title && <div style={{ fontSize:13, fontWeight:500, color:'#1a2a1a', marginBottom:12, fontFamily:"'DM Sans',sans-serif" }}>{title}</div>}
    {children}
  </div>
)
const Grid2 = ({ children, style }) => <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, ...style }}>{children}</div>
const Grid3 = ({ children, style }) => <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, ...style }}>{children}</div>
const Field = ({ label, children, style }) => <div style={style}><label style={{ fontSize:11, color:'#5a6e5a', display:'block', marginBottom:4 }}>{label}</label>{children}</div>
const NavBtn = ({ onPrev, onNext, nextLabel, onNextAction }) => (
  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
    {onPrev ? <button onClick={onPrev} style={{ padding:'9px 16px', border:'1px solid #dde5dd', background:'white', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>← Retour</button> : <div />}
    {onNext && <button onClick={onNextAction || onNext}
      style={{ padding:'9px 18px', background:'#0a5c3c', color:'white', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
      {nextLabel || 'Suivant →'}
    </button>}
  </div>
)
function VitalStatus({ id, val }) {
  if (!val) return null
  let status = null, color = '#0a5c3c', bg = '#e6f4ef'
  if (id === 'temperature') { if (val > 38.4) { status='Fièvre'; color='#c0392b'; bg='#fdecea' } else if (val > 37.5) { status='Subfébrile'; color='#c9901a'; bg='#fdf3e0' } else if (val < 36) { status='Hypothermie'; color='#1a5fa8'; bg='#e8f1fb' } else status='Normal' }
  if (id === 'tension_systolique') { if (val > 160) { status='HTA sévère'; color='#c0392b'; bg='#fdecea' } else if (val > 139) { status='HTA'; color='#c9901a'; bg='#fdf3e0' } else if (val < 90) { status='Hypotension'; color='#1a5fa8'; bg='#e8f1fb' } else status='Normal' }
  if (id === 'frequence_cardiaque') { if (val > 100) { status='Tachycardie'; color='#c9901a'; bg='#fdf3e0' } else if (val < 60) { status='Bradycardie'; color='#1a5fa8'; bg='#e8f1fb' } else status='Normal' }
  if (id === 'spo2') { if (val < 90) { status='Désaturation sévère'; color='#c0392b'; bg='#fdecea' } else if (val < 95) { status='Désaturation'; color='#c9901a'; bg='#fdf3e0' } else status='Normal' }
  if (id === 'frequence_respiratoire') { if (val > 20) { status='Tachypnée'; color='#c9901a'; bg='#fdf3e0' } else if (val < 12) { status='Bradypnée'; color='#1a5fa8'; bg='#e8f1fb' } else status='Normal' }
  if (!status) return null
  return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:bg, color, display:'inline-block', marginTop:4 }}>{status}</span>
}
