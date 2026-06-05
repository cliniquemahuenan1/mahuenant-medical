import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { SPECIALITES } from '../lib/data.js'

const NAV = [
  { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Tableau de bord' },
  { id: 'patients', icon: 'ti-users', label: 'Patients' },
  { id: 'nouvelle-consultation', icon: 'ti-plus-circle', label: 'Nouvelle consultation' },
  { id: 'consultations', icon: 'ti-clipboard-list', label: 'Consultations' },
]

export default function Layout({ children, page, onNavigate }) {
  const { medecin, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f4f6f4' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 230 : 60, flexShrink:0,
        background:'#073d28', transition:'width 0.2s',
        display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', overflow:'hidden'
      }}>
        {/* Header */}
        <div style={{ padding:'16px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-stethoscope" style={{ color:'white', fontSize:18 }} />
          </div>
          {sidebarOpen && (
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", color:'white', fontSize:13, lineHeight:1.2 }}>Mahuénan</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10, lineHeight:1.2 }}>Système médical</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', padding:4, flexShrink:0 }}>
            <i className={`ti ${sidebarOpen ? 'ti-chevrons-left' : 'ti-chevrons-right'}`} style={{ fontSize:16 }} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 8px', overflowY:'auto' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              style={{
                display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 10px', borderRadius:8, border:'none', cursor:'pointer',
                background: page === item.id ? 'rgba(255,255,255,0.14)' : 'transparent',
                color: page === item.id ? 'white' : 'rgba(255,255,255,0.55)',
                marginBottom:2, transition:'all 0.15s', textAlign:'left', fontFamily:"'DM Sans',sans-serif"
              }}>
              <i className={`ti ${item.icon}`} style={{ fontSize:18, flexShrink:0 }} />
              {sidebarOpen && <span style={{ fontSize:13, whiteSpace:'nowrap' }}>{item.label}</span>}
            </button>
          ))}

          {sidebarOpen && (
            <div style={{ marginTop:16, padding:'8px 10px', color:'rgba(255,255,255,0.3)', fontSize:10, letterSpacing:1, textTransform:'uppercase' }}>
              Spécialités
            </div>
          )}

          {SPECIALITES.map(s => (
            <button key={s.id} onClick={() => onNavigate('consultation-spec', s.id)}
              style={{
                display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer',
                background:'transparent', color:'rgba(255,255,255,0.45)',
                marginBottom:1, transition:'all 0.15s', textAlign:'left', fontFamily:"'DM Sans',sans-serif"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
            >
              <i className={`ti ${s.icon}`} style={{ fontSize:16, flexShrink:0 }} />
              {sidebarOpen && <span style={{ fontSize:12, whiteSpace:'nowrap' }}>{s.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, color:'white', fontWeight:500 }}>
              {medecin ? (medecin.prenom?.[0]||'') + (medecin.nom?.[0]||'') : 'DR'}
            </div>
            {sidebarOpen && medecin && (
              <div style={{ overflow:'hidden' }}>
                <div style={{ color:'white', fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  Dr {medecin.prenom} {medecin.nom}
                </div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>{medecin.specialite}</div>
              </div>
            )}
          </div>
          <button onClick={signOut}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
            <i className="ti ti-logout" style={{ fontSize:15 }} />
            {sidebarOpen && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflow:'auto', minWidth:0 }}>
        {children}
      </main>
    </div>
  )
}
