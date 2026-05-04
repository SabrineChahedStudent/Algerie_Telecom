import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, UserCheck, Briefcase } from 'lucide-react';
import { ATLogo } from '@/components/shared/ATLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { AuthContext } from '@/contexts/AuthContext';
import { loginStaff as loginStaffAPI } from '@/api/auth';
import './auth-view.css';

export default function LoginStaff() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('login.error_empty'));
      return;
    }

    setLoading(true);
    try {
      const data = await loginStaffAPI(email, password);
      const user = data.user;
      login(user, data.tokens.access, data.tokens.refresh);

      const roleRoutes = {
        agent: '/agent/dashboard',
        agent_technique: '/technique/dashboard',
        agent_annexe: '/annexe/dashboard',
        admin: '/admin/dashboard',
        admin_it: '/admin-it/dashboard',
      };
      navigate(roleRoutes[user.role] || '/staff');
    } catch (err) {
      let msg = t('login.error_invalid');
      const data = err.response?.data;
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.message) msg = data.message;
        else if (data.error) msg = data.error;
        else if (data.non_field_errors) msg = data.non_field_errors[0];
        else {
          const firstKey = Object.keys(data)[0];
          if (firstKey && Array.isArray(data[firstKey])) {
            msg = data[firstKey][0];
          }
        }
      }
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-view-container">
      <Card className="auth-view-card staff-card">
        <CardHeader className="auth-view-header">
          <div className="auth-lang-row">
            <LanguageSwitcher />
          </div>
          <div className="auth-logo-container">
            <div className="auth-logo-wrapper">
              <ATLogo className="auth-logo" />
            </div>
          </div>
          <div className="auth-title-container">
            <CardTitle className="auth-main-title">{t('login.brand')}</CardTitle>
            <CardDescription className="auth-subtitle">{t('staff_login.tagline')}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="auth-view-content">
          <div className="w-full">
            <div className="auth-tab-content">
              <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="auth-error">{error}</div>}

                <div className="auth-field">
                  <Label className="auth-input-label">{t('staff_login.email_label')}</Label>
                  <div className="auth-input-wrapper">
                    <Mail className="auth-input-icon" />
                    <Input
                      type="email"
                      placeholder={t('staff_login.email_placeholder')}
                      className="auth-input-field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <Label className="auth-input-label">{t('login.password_label')}</Label>
                  <div className="auth-input-wrapper">
                    <Lock className="auth-input-icon" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="auth-input-field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn staff" disabled={loading}>
                  <span className="btn-label-main">{loading ? '...' : t('staff_login.submit')}</span>
                  <span className="btn-label-arabic">{t('staff_login.submit_ar')}</span>
                </button>
              </form>
            </div>
          </div>
        </CardContent>

        <CardFooter className="auth-view-footer">
          <div className="auth-footer-info">
            <span>SERVICE CLIENT : 100</span>
            <span className="auth-footer-separator">|</span>
            <span>© 2024 ALGÉRIE TÉLÉCOM</span>
          </div>
          <div className="auth-footer-tagline">SÉCURISÉ PAR LA DIRECTION DIGITALE</div>
        </CardFooter>
      </Card>
    </div>
  );
}
