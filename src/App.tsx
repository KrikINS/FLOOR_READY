

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SplashScreen from './components/ui/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';

import EventsList from './pages/events/EventsList';
import NewEvent from './pages/events/NewEvent';
import EventDetails from './pages/events/EventDetails';

import TasksList from './pages/tasks/TasksList';
import TaskDetails from './pages/tasks/TaskDetails';

import InventoryList from './pages/inventory/InventoryList';
import NewItem from './pages/inventory/NewItem';
import TeamList from './pages/team/TeamList';
import DebugConnection from './pages/DebugConnection';

// Placeholders for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div>
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p>Coming soon...</p>
  </div>
);

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen mode="loading" />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/debug-connection" element={<DebugConnection />} />
      <Route path="/pending-approval" element={<PendingApproval />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Events Routes */}
          <Route path="/events" element={<EventsList />} />
          <Route path="/events/new" element={<NewEvent />} />
          <Route path="/events/:id" element={<EventDetails />} />

          <Route path="/tasks" element={<TasksList />} />
          <Route path="/tasks/:id" element={<TaskDetails />} />

          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/inventory/new" element={<NewItem />} />

          <Route path="/team" element={<TeamList />} />
          <Route path="/profile" element={<Placeholder title="Profile" />} />
          <Route path="*" element={<Placeholder title="404 Not Found" />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
