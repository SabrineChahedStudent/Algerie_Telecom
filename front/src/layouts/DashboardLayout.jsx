import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/contexts/AuthContext';
import { logout as logoutAPI } from '@/api/auth';
import { ClipboardList, LogOut, UserCircle, BarChart3, History, Cpu, MapPin, Users, LayoutDashboard, GitPullRequest, ShieldAlert, Server } from 'lucide-react';
import Cookies from 'js-cookie';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import './dashboard-layout.css';

// Menu items per role (using i18n keys)
const getMenuConfig = (t) => ({
  client: {
    brand: 'AT-Customer',
    brandSub: t('sidebar.brand_sub_client'),
    sections: [
      { label: t('sidebar.my_space'), items: [
        { label: t('sidebar.claims'), icon: ClipboardList, path: '/client/dashboard' },
      ]},
    ],
  },
  agent: {
    brand: 'AT-Agent',
    brandSub: t('sidebar.brand_sub_agent'),
    sections: [
      { label: t('sidebar.pilotage'), items: [
        { label: t('sidebar.performance'), icon: BarChart3, path: '/agent/dashboard', tab: 'dashboard' },
        { label: t('sidebar.tickets'), icon: ClipboardList, path: '/agent/dashboard', tab: 'tickets' },
        { label: t('sidebar.history'), icon: History, path: '/agent/dashboard', tab: 'history' },
      ]},
    ],
  },
  agent_technique: {
    brand: 'AT-Technique',
    brandSub: t('sidebar.brand_sub_technique'),
    sections: [
      { label: t('sidebar.pilotage'), items: [
        { label: t('sidebar.performance'), icon: BarChart3, path: '/technique/dashboard', tab: 'dashboard' },
        { label: t('sidebar.escalated_tickets'), icon: Cpu, path: '/technique/dashboard', tab: 'tickets' },
        { label: t('sidebar.history'), icon: History, path: '/technique/dashboard', tab: 'history' },
      ]},
    ],
  },
  agent_annexe: {
    brand: 'AT-Annexe',
    brandSub: t('sidebar.brand_sub_annexe'),
    sections: [
      { label: t('sidebar.pilotage'), items: [
        { label: t('sidebar.performance'), icon: BarChart3, path: '/annexe/dashboard', tab: 'dashboard' },
        { label: t('sidebar.escalated_tickets'), icon: MapPin, path: '/annexe/dashboard', tab: 'tickets' },
        { label: t('sidebar.history'), icon: History, path: '/annexe/dashboard', tab: 'history' },
      ]},
    ],
  },
  admin: {
    brand: 'AT-Admin',
    brandSub: t('sidebar.brand_sub_admin'),
    sections: [
      { label: t('sidebar.pilotage'), items: [
        { label: t('sidebar.national'), icon: LayoutDashboard, path: '/admin/dashboard', tab: 'stats' },
      ]},
      { label: t('sidebar.flux'), items: [
        { label: t('sidebar.assignments'), icon: GitPullRequest, path: '/admin/dashboard', tab: 'assignment' },
        { label: t('sidebar.experts'), icon: Users, path: '/admin/dashboard', tab: 'agents' },
        { label: t('sidebar.audit'), icon: History, path: '/admin/dashboard', tab: 'history' },
        { label: 'Demandes IT', icon: ClipboardList, path: '/admin/dashboard', tab: 'demandes' },
      ]},
    ],
  },
  admin_it: {
    brand: 'AT-Admin IT',
    brandSub: 'Gestion de la plateforme',
    sections: [
      { label: 'Gestion', items: [
        { label: t('sidebar.experts'), icon: Users, path: '/admin-it/dashboard', tab: 'agents' },
      ]},
      { label: t('sidebar.security'), items: [
        { label: t('sidebar.connections'), icon: ShieldAlert, path: '/admin-it/dashboard', tab: 'sessions' },
      ]},
      { label: 'Support', items: [
        { label: 'Demandes Reçues', icon: ClipboardList, path: '/admin-it/dashboard', tab: 'demandes' },
      ]},
    ],
  },
});

export default function DashboardLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const refreshToken = Cookies.get('refresh');
      await logoutAPI(refreshToken);
    } catch (e) {}
    logout();
    navigate('/');
  };

  const role = user?.role || 'client';
  const menuConfig = getMenuConfig(t);
  const config = menuConfig[role] || menuConfig.client;
  const displayName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Utilisateur';
  const roleLabel = {
    client: t('sidebar.role_client'),
    agent: t('sidebar.role_agent'),
    agent_technique: t('sidebar.role_technique'),
    agent_annexe: t('sidebar.role_annexe'),
    admin: t('sidebar.role_admin'),
    admin_it: 'Admin IT',
  }[role] || role;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <UserCircle className="w-5 h-5" />
          </div>
          <div className="sidebar-brand-text">
            <h2>{config.brand}</h2>
            <p>{config.brandSub}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto pb-4">
          {config.sections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="sidebar-section-label">{section.label}</div>
              <nav className="sidebar-nav">
                {section.items.map((item, idx) => {
                  const isActive = location.pathname === item.path &&
                    (!item.tab || location.search.includes(`tab=${item.tab}`));
                  return (
                    <button
                      key={idx}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        if (item.tab) {
                          navigate(`${item.path}?tab=${item.tab}`);
                        } else {
                          navigate(item.path);
                        }
                      }}
                    >
                      <item.icon />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <LanguageSwitcher />
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              <UserCircle className="w-5 h-5" />
            </div>
            <div className="sidebar-user-info">
              <h4>{displayName || 'Abonné AT'}</h4>
              <p>{roleLabel}</p>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut /> {t('sidebar.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}

