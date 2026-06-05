import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Dashboard({ onNavigate }) {
  const { medecin } = useAuth()
  const [stats, setStats] = useState({ patients: 0, consultations_today: 0, consultations_week: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const today = new Date(); today.setHours(0,0,0,0)
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000)

    const [{ count: patients }, { count: today_c }, { count: week_c }, { data: recentC }] = await Promise.all([
      supabase.from('patients').select('*', { count:'exact', head:true }),
      supabase.from('consultations').select('*', { count:'exact', head:true }).gte('date_consultation', today.toISOString()),
      supabase.from('consultations').select('*', { count:'exact', head:true }).gte('date_consultation', weekAgo.toISOString()),
      supabase.from('consultations').select('*, patients(nom, prenom)').order('date_consultation', { ascending:false }).limit(8)
    ])

    setStats({ patients: patients||0, consultations_today: today_c||0, consultations_week: week_c||0 })
    setRecent(recentC || [])
    setLoading(false)
  }

  const now = new Date()
  const heure = now.getHours()
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  const statCards = [
    { label:'Patients enregistrés', value: stats.patients, icon:'ti-users', color:'#0a5c3c', bg:'#e6f4ef' },
    { label:'Consultations aujourd\'hui', value: stats.consultations_today, icon:'ti-calendar-event', color:'#1a5fa8', bg:'#e8f1fb' },
    { label:'Cette semaine', value: stats.consultations_week, icon:'ti-chart-line', color:'#c9901a', bg:'#fdf3e0' },
  ]

  return (
    <div style={{ padding:24 }}>
      {/* Welcome */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:400, color:'#1a2a1a', marginBottom:4 }}>
          {salutation}, Dr {medecin?.prenom || ''} 👋
        </h2>
        <div style={{ color:'#5a6e5a', fontSize:13 }}>
          {now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, marginBottom:24 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background:'white', borderRadius:12, padding:'16px 18px', border:'0.5px solid #dde5dd', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className={`ti ${s.icon}`} style={{ color:s.color, fontSize:18 }} />
              </div>
              <span style={{ fontSize:12, color:'#5a6e5a' }}>{s.label}</span>
            </div>
            <div style={{ fontSize:28, fontWeight:600, color:s.color, fontFamily:"'DM Serif Display',serif" }}>
              {loading ? '…' : s.value}
            </div>
          </div>
        ))}

        {/* Quick action */}
        <div onClick={() => onNavigate('nouvelle-consultation')}
          style={{ background:'#0a5c3c', borderRadius:12, padding:'16px 18px', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:100, transition:'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#073d28'}
          onMouseLeave={e => e.currentTarget.style.background = '#0a5c3c'}
        >
          <i className="ti ti-plus-circle" style={{ color:'rgba(255,255,255,0.7)', fontSize:22 }} />
          <div>
            <div style={{ color:'white', fontSize:14, fontWeight:500 }}>Nouvelle consultation</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:2 }}>Enregistrer un patient</div>
          </div>
        </div>
      </div>

      {/* Recent consultations */}
      <div style={{ background:'white', borderRadius:12, border:'0.5px solid #dde5dd', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'14px 18px', borderBottom:'0.5px solid #dde5dd', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontSize:14, fontWeight:500, color:'#1a2a1a', fontFamily:"'DM Sans',sans-serif" }}>
            Consultations récentes
          </h3>
          <button onClick={() => onNavigate('consultations')} style={{ fontSize:12, color:'#0a5c3c', background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Voir tout →
          </button>
        </div>

        {loading ? (
          <div style={{ padding:24, textAlign:'center', color:'#8fa08f' }}>Chargement...</div>
        ) : recent.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', color:'#8fa08f', fontSize:13 }}>
            Aucune consultation enregistrée
          </div>
        ) : (
          <div>
            {recent.map((c, i) => (
              <div key={c.id} style={{
                display:'flex', alignItems:'center', gap:12, padding:'11px 18px',
                borderBottom: i < recent.length-1 ? '0.5px solid #f0f4f0' : 'none',
              }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#e6f4ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, color:'#0a5c3c', flexShrink:0 }}>
                  {(c.patients?.prenom?.[0]||'?')}{(c.patients?.nom?.[0]||'?')}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#1a2a1a' }}>
                    {c.patients?.prenom} {c.patients?.nom}
                  </div>
                  <div style={{ fontSize:11, color:'#8fa08f' }}>
                    {c.motif ? c.motif.substring(0,50)+(c.motif.length>50?'…':'') : '—'}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:11, color:'#5a6e5a' }}>
                    Dr {c.medecin_nom || '—'}
                  </div>
                  <div style={{ fontSize:11, color:'#8fa08f' }}>
                    {new Date(c.date_consultation).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
                <span style={{
                  fontSize:10, padding:'2px 8px', borderRadius:10,
                  background: c.statut === 'cloture' ? '#e6f4ef' : '#fdf3e0',
                  color: c.statut === 'cloture' ? '#0a5c3c' : '#c9901a',
                  flexShrink:0
                }}>
                  {c.statut === 'cloture' ? 'Clôturé' : 'En cours'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
