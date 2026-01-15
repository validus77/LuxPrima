import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
// Placeholder imports
import { Dashboard } from './pages/Dashboard';
import { Sources } from './pages/Sources';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

import { ReportDetail } from './pages/ReportDetail';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
