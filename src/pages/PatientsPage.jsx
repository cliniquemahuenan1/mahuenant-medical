import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export default function PatientsPage({ onNavigate, onSelectPatient }) {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ nom:'', prenom:'', date_naissance:'', sexe:'', telephone:'', adresse:'', profession:'', groupe_sanguin:'', atcd_medicaux:'', atcd_chirurgicaux:'', atcd_familiaux:'', allergies:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadPatients() }, [])
  useEffect(() => {
    const t = setTimeout(loadPatients, 300)
    return () => clearTimeout(t)
  }, [search])

  async function loadPatients() {
    setLoading(true)
    let q = supabase.from('patients').select('*, consultations(count)').eq('actif', true).order('created_at', { ascending:false }).limit(50)
    if (search.trim()) {
      q = q.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,numero_dossier.ilike.%${search}%,telephone.ilike.%${search}%`)
    }
    const { data } = await q
    setPatients(data || [])
    setLoading(false)
  }

  async function savePatient() {
    if (!form.nom || !form.prenom) return alert('Nom et prénom requis')
    setSaving(true)
    const { error } = await supabase.from('patients').insert([form])
    if (error) alert('Erreur : ' + error.message)
    else { setShowNew(false); setForm({ nom:'', prenom:'', date_naissance:'', sexe:'', telephone:'', adresse:'', profession:'', groupe_sanguin:'', atcd_medicaux:'', atcd_chirurgicaux:'', atcd_familiaux:'', allergies:'' }); loadPatients() }
    setSaving(false)
  }

  const Field = ({ label, id, type='text', options, span }) => (
    <div style={{ gridColumn: span ? 'span 2' : 'span 1' }}>
      <label style={{ fontSize:11, color:'#5a6e5a', display:'block', marginBottom:4 }}>{label}</label>
      {type === 'select' ? (
        <select value={form[id]} onChange={e => setForm(p => ({...p, [id]:e.target.value}))}
          style={{ width:'100%', padding:'7px 10px', border:'1px solid #dde5dd', borderRadius:8, fontSize:13, background:'white', fontFamily:"'DM Sans',sans-serif" }}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={form[id]} onChange={e => setForm(p => ({...p, [id]:e.target.value}))}
          rows={2} style={{ width:'100%', padding:'7px 10px', border:'1px solid #dde5dd', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", resize:'vertical' }} />
      ) : (
        <input type={type} value={form[id]} onChange={e => setForm(p => ({...p, [id]:e.target.value}))}
          style={{ width:'100%', padding:'7px 10px', border:'1px solid #dde5dd', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif" }} />
      )}
    </div>
  )

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:400, color:'#1a2a1a' }}>Patients</h2>
        <button onClick={() => setShowNew(true)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#0a5c3c', color:'white', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          <i className="ti ti-user-plus" /> Nouveau patient
        </button>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <i className="ti ti-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#8fa08f', fontSize:16 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, prénom, N° dossier, téléphone..."
          style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1px solid #dde5dd', borderRadius:10, fontSize:13, background:'white', fontFamily:"'DM Sans',sans-serif", outline:'none' }} />
      </div>

      {/* List */}
      <div style={{ background:'white', borderRadius:12, border:'0.5px solid #dde5dd', overflow:'hidden' }}>
        <div style={{ padding:'10px 16px', background:'#f4f6f4', borderBottom:'0.5px solid #dde5dd', display:'grid', gridTemplateColumns:'1fr 1fr 100px 80px 80px 120px', gap:8, fontSize:11, color:'#8fa08f', fontWeight:500 }}>
          <span>PATIENT</span><span>CONTACT</span><span>Né(e) le</span><span>Sexe</span><span>Dossiers</span><span>Actions</span>
        </div>

        {loading ? (
          <div style={{ padding:24, textAlign:'center', color:'#8fa08f' }}>Chargement...</div>
        ) : patients.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'#8fa08f', fontSize:13 }}>
            {search ? 'Aucun résultat' : 'Aucun patient enregistré'}
          </div>
        ) : patients.map((p, i) => {
          const age = p.date_naissance ? Math.floor((Date.now() - new Date(p.date_naissance)) / (1000*60*60*24*365.25)) : null
          return (
            <div key={p.id} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 100px 80px 80px 120px', gap:8, padding:'11px 16px', borderBottom: i < patients.length-1 ? '0.5px solid #f0f4f0' : 'none', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#e6f4ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, color:'#0a5c3c', flexShrink:0 }}>
                  {(p.prenom?.[0]||'?')}{(p.nom?.[0]||'?')}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#1a2a1a' }}>{p.prenom} {p.nom}</div>
                  <div style={{ fontSize:11, color:'#8fa08f' }}>{p.numero_dossier}</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'#5a6e5a' }}>{p.telephone || '—'}</div>
              <div style={{ fontSize:12, color:'#5a6e5a' }}>{p.date_naissance ? new Date(p.date_naissance).toLocaleDateString('fr-FR') : '—'}{age ? ` (${age} ans)` : ''}</div>
              <div style={{ fontSize:12, color:'#5a6e5a' }}>{p.sexe || '—'}</div>
              <div style={{ fontSize:12, color:'#5a6e5a' }}>{p.consultations?.[0]?.count || 0}</div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => onSelectPatient && onSelectPatient(p)}
                  style={{ padding:'5px 10px', fontSize:11, background:'#e6f4ef', color:'#0a5c3c', border:'none', borderRadius:6, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  Dossier
                </button>
                <button onClick={() => onNavigate('nouvelle-consultation', null, p)}
                  style={{ padding:'5px 10px', fontSize:11, background:'#0a5c3c', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  <i className="ti ti-plus" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal nouveau patient */}
      {showNew && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'white', borderRadius:16, padding:24, width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontSize:16, fontWeight:500 }}>Nouveau patient</h3>
              <button onClick={() => setShowNew(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8fa08f', fontSize:20 }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Nom *" id="nom" />
              <Field label="Prénom *" id="prenom" />
              <Field label="Date de naissance" id="date_naissance" type="date" />
              <Field label="Sexe" id="sexe" type="select" options={['Masculin','Féminin']} />
              <Field label="Téléphone" id="telephone" />
              <Field label="Profession" id="profession" />
              <Field label="Adresse" id="adresse" />
              <Field label="Groupe sanguin" id="groupe_sanguin" type="select" options={['A+','A-','B+','B-','AB+','AB-','O+','O-','Inconnu']} />
              <Field label="Antécédents médicaux" id="atcd_medicaux" type="textarea" span />
              <Field label="Antécédents chirurgicaux" id="atcd_chirurgicaux" type="textarea" span />
              <Field label="Antécédents familiaux" id="atcd_familiaux" type="textarea" span />
              <Field label="Allergies" id="allergies" />
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setShowNew(false)} style={{ padding:'8px 16px', border:'1px solid #dde5dd', background:'white', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                Annuler
              </button>
              <button onClick={savePatient} disabled={saving}
                style={{ padding:'8px 18px', background:'#0a5c3c', color:'white', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
