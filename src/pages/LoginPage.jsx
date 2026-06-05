import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn(email, password)
    if (error) setError('Email ou mot de passe incorrect.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #073d28 0%, #0a5c3c 60%, #1a8a5a 100%)' }}>
      <div style={{ width:'100%', maxWidth:420, padding:'0 16px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', backdropFilter:'blur(10px)' }}>
            <i className="ti ti-stethoscope" style={{ fontSize:28, color:'white' }} />
          </div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", color:'white', fontSize:26, fontWeight:400, marginBottom:4 }}>
            Clinique Médicale
          </h1>
          <div style={{ fontFamily:"'DM Serif Display',serif", color:'rgba(255,255,255,0.7)', fontSize:22, fontStyle:'italic' }}>
            Mahuénan
          </div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:6, letterSpacing:1 }}>
            BOHICON — BÉNIN
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'white', borderRadius:16, padding:'28px 28px', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
          <div style={{ fontSize:15, fontWeight:500, marginBottom:20, color:'#1a2a1a' }}>
            Connexion au système
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'#5a6e5a', display:'block', marginBottom:5 }}>Email</label>
              <div style={{ position:'relative' }}>
                <i className="ti ti-mail" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#8fa08f', fontSize:16 }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="medecin@mahuenant.bj"
                  style={{ width:'100%', padding:'9px 10px 9px 34px', border:'1px solid #dde5dd', borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, color:'#5a6e5a', display:'block', marginBottom:5 }}>Mot de passe</label>
              <div style={{ position:'relative' }}>
                <i className="ti ti-lock" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#8fa08f', fontSize:16 }} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width:'100%', padding:'9px 10px 9px 34px', border:'1px solid #dde5dd', borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background:'#fdecea', border:'1px solid #f5c6c6', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#c0392b', marginBottom:14 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width:'100%', padding:'11px', background: loading ? '#8fa08f' : '#0a5c3c', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
            >
              {loading ? <><i className="ti ti-loader ti-spin" />&nbsp;Connexion...</> : <><i className="ti ti-login" />&nbsp;Se connecter</>}
            </button>
          </form>
        </div>

        <div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:16 }}>
          Système réservé au personnel médical autorisé
        </div>
      </div>
    </div>
  )
}
