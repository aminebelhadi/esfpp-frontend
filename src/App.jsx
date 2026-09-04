import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import MatriceLogigramme from './components/MatriceLogigramme'
import AdminSettings from './components/AdminSettings'
import FormateursManagement from './components/FormateursManagement'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <div className="root-layout">
        <Sidebar />
        <div className="page-content">
          <Routes>
            {/* Redirection par défaut vers le logigramme */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/logigramme" replace />} />
            <Route path="/logigramme" element={<MatriceLogigramme />} />
            <Route path="/admin" element={<AdminSettings />} />
            <Route path="/formateurs" element={<FormateursManagement />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App