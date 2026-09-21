import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function EmailVerification() {
  const { currentUser, loading, sendVerification, refreshVerification } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async action => {
    setBusy(true);
    try { setMessage(await action()); } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  if (loading) return <p className="p-8">Loading your account…</p>;
  return <section className="max-w-lg mx-auto p-8 my-12 glass rounded-xl space-y-5">
    <h1 className="text-3xl font-bold">Verify your email</h1>
    {!currentUser ? <p><Link to="/login" className="underline">Sign in</Link> to verify your email address.</p> : <>
      <p>{currentUser.emailVerified ? 'Your email is verified.' : `Send a verification link to ${currentUser.email}. Check your inbox and spam folder.`}</p>
      {!currentUser.emailVerified && <div className="flex gap-4">
        <button disabled={busy} className="bg-blue-600 p-3 rounded disabled:opacity-50" onClick={() => run(async () => { await sendVerification(); return 'Verification email sent. Open the link, then check again here.'; })}>Send verification email</button>
        <button disabled={busy} className="border p-3 rounded disabled:opacity-50" onClick={() => run(async () => (await refreshVerification()) ? 'Email verified.' : 'Not verified yet. Open the email link first.')}>I have verified</button>
      </div>}
      <Link to="/dashboard" className="block underline">Go to dashboard</Link>
    </>}
    <p role="status">{message}</p>
  </section>;
}
