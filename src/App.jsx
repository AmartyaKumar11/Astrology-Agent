import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Desktop from './pages/Desktop.jsx';
import Queue from './pages/Queue.jsx';
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
        <Route path="/queue" element={<Queue />} />
        <Route path="/consultation/:id" element={<Consultation />} />
        <Route path="/hil" element={<HILBoard />} />
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
