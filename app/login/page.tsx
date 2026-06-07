'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'login' | 'signup'>('login')

    async function handleSubmit() {
        setError(''); setLoading(true)
        try {
            const { error: err } = mode === 'login'
                ? await sb.auth.signInWithPassword({ email, password })
                : await sb.auth.signUp({ email, password })
            if (err) { setError(err.message); setLoading(false); return }
            window.location.href = '/'
        } catch (e: any) {
            setError(e.message); setLoading(false)
        }
    }

    return (
        <>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5ede4; font-family: 'Times New Roman', serif; }
        .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5ede4; }
        .card { background: #ede3d8; border: 1px solid #d4c4b4; border-radius: 24px; padding: 3rem 2.5rem; width: 100%; max-width: 420px; }
        .logo { font-size: 2.2rem; font-weight: 300; color: #3d2e22; letter-spacing: -1px; margin-bottom: 4px; }
        .logo em { font-style: italic; color: #9c7b5e; }
        .tagline { font-size: 0.72rem; color: #b8a898; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 2.5rem; }
        .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1rem; }
        .label { font-size: 0.72rem; color: #7a6040; letter-spacing: 1px; text-transform: uppercase; }
        .input { background: #f5ede4; border: 1px solid #d4c4b4; border-radius: 10px; padding: 0.75rem 1rem; color: #3d2e22; font-family: 'Times New Roman', serif; font-size: 0.95rem; outline: none; width: 100%; transition: border-color 0.2s; }
        .input:focus { border-color: #9c7b5e; }
        .input::placeholder { color: #b8a898; font-style: italic; }
        .btn { width: 100%; background: #3d2e22; color: #f5ede4; border: none; padding: 0.85rem; border-radius: 40px; font-family: 'Times New Roman', serif; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; margin-top: 1rem; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.8; }
        .btn:disabled { opacity: 0.4; cursor: default; }
        .error { background: rgba(196,122,90,0.15); border: 1px solid #c47a5a; border-radius: 10px; padding: 0.75rem 1rem; color: #8a3010; font-size: 0.82rem; font-style: italic; margin-top: 1rem; }
        .switch { text-align: center; margin-top: 1.5rem; font-size: 0.78rem; color: #b8a898; }
        .switch span { color: #9c7b5e; cursor: pointer; text-decoration: underline; }
        .divider { border: none; border-top: 1px solid #d4c4b4; margin: 1.5rem 0; }
        .hint { font-size: 0.7rem; color: #b8a898; font-style: italic; text-align: center; margin-top: 1rem; line-height: 1.5; }
      `}</style>
            <div className="wrap">
                <div className="card">
                    <div className="logo">Stock <em>& Store</em></div>
                    <div className="tagline">curated inventory, effortlessly</div>
                    <hr className="divider" />
                    <div className="field">
                        <label className="label">Email Address</label>
                        <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="field">
                        <label className="label">Password</label>
                        <input className="input" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                    </div>
                    {error && <div className="error">{error}</div>}
                    <button className="btn" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                    <div className="switch">
                        {mode === 'login' ? <>No account? <span onClick={() => setMode('signup')}>Sign up</span></> : <>Already have an account? <span onClick={() => setMode('login')}>Sign in</span></>}
                    </div>
                    <div className="hint">
                        Admins can manage all items and users.<br />
                        Staff can update stock. Viewers can only browse.
                    </div>
                </div>
            </div>
        </>
    )
}