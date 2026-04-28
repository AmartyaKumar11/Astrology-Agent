import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Desktop from './pages/Desktop.jsx';
import DataIntake from './pages/DataIntake.jsx';
import Consultation from './pages/Consultation.jsx';
import HILBoard from './pages/HILBoard.jsx';
import Report from './pages/Report.jsx';
import Taskbar from './components/Taskbar.jsx';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Desktop />} />
        <Route path="/intake" element={<DataIntake />} />
        <Route path="/queue" element={<Navigate to="/hil" replace />} />
        <Route path="/consultation/:id" element={<Consultation />} />
        <Route path="/hil" element={<HILBoard />} />
        <Route path="/drishti" element={<HILBoard />} />
        <Route path="/reports" element={<Navigate to="/hil" replace />} />
        <Route path="/report/:id" element={<Report />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AnimatedRoutes />
      <Taskbar />
    </HashRouter>
  );
}
