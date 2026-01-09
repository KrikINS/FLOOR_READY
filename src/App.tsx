
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Placeholders for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div>
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p>Coming soon...</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Placeholder title="Register" />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Placeholder title="Events" />} />
          <Route path="/tasks" element={<Placeholder title="Tasks" />} />
          <Route path="/inventory" element={<Placeholder title="Inventory" />} />
          <Route path="/team" element={<Placeholder title="Team" />} />
          <Route path="/profile" element={<Placeholder title="Profile" />} />
          <Route path="*" element={<Placeholder title="404 Not Found" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
