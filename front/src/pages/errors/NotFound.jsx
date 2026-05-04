import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../contexts/AuthContext';

export default function NotFound() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const dashboardPath = user
    ? user.role === 'client' ? '/client/dashboard'
    : user.role === 'agent' ? '/agent/dashboard'
    : user.role === 'agent_technique' ? '/technique/dashboard'
    : user.role === 'agent_annexe' ? '/annexe/dashboard'
    : user.role === 'admin' ? '/admin/dashboard'
    : user.role === 'admin_it' ? '/admin-it/dashboard'
    : '/'
    : '/';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0f2b46 100%)',
      fontFamily: "'Inter', sans-serif",
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '520px' }}>
        <div style={{
          fontSize: '140px', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, #0099cc, #00ccff, #33ddff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 40px rgba(0, 153, 204, 0.3))',
          marginBottom: '0.5rem', letterSpacing: '-4px',
        }}>404</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: '0 0 1rem 0' }}>
          {t('errors.not_found_title')}
        </h1>
        <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 2.5rem 0' }}>
          {t('errors.not_found_desc')}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} style={{
            padding: '12px 28px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', fontSize: '0.875rem',
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
          }}>← {t('errors.back')}</button>
          <Link to={dashboardPath} style={{
            padding: '12px 28px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #0077b6, #0099cc)', color: '#fff',
            fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0, 119, 182, 0.3)',
          }}>{t('errors.my_space')} →</Link>
        </div>
        <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: '#475569', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
          {t('login.brand')}
        </p>
      </div>
    </div>
  );
}
