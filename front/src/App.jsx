import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Pages - Auth
import LoginClient from './pages/auth/LoginClient';
import LoginStaff from './pages/auth/LoginStaff';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages - Client
import PortalView from './pages/client/PortalView';

// Pages - Agent / Technique / Annexe
import WorkspaceView from './pages/agent/WorkspaceView';

// Pages - Admin
import AdminView from './pages/admin/AdminView';
import AdminITView from './pages/admin-it/AdminITView';

// Pages - Errors
import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginClient />} />
        <Route path="/staff" element={<LoginStaff />} />

        {/* Client Routes */}
        <Route path="/client/dashboard" element={
          <RoleRoute allowedRoles={['client']}>
            <DashboardLayout>
              <PortalView />
            </DashboardLayout>
          </RoleRoute>
        } />

        {/* Agent Routes */}
        <Route path="/agent/dashboard" element={
          <RoleRoute allowedRoles={['agent']}>
            <DashboardLayout>
              <WorkspaceView agentRole="agent" />
            </DashboardLayout>
          </RoleRoute>
        } />

        {/* Technique Routes */}
        <Route path="/technique/dashboard" element={
          <RoleRoute allowedRoles={['agent_technique']}>
            <DashboardLayout>
              <WorkspaceView agentRole="agent_technique" />
            </DashboardLayout>
          </RoleRoute>
        } />

        {/* Annexe Routes */}
        <Route path="/annexe/dashboard" element={
          <RoleRoute allowedRoles={['agent_annexe']}>
            <DashboardLayout>
              <WorkspaceView agentRole="agent_annexe" />
            </DashboardLayout>
          </RoleRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <RoleRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminView />
            </DashboardLayout>
          </RoleRoute>
        } />

        {/* Admin IT Routes */}
        <Route path="/admin-it/dashboard" element={
          <RoleRoute allowedRoles={['admin_it']}>
            <DashboardLayout>
              <AdminITView />
            </DashboardLayout>
          </RoleRoute>
        } />

        {/* Error Pages */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;
