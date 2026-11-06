import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { useApp } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import Crops from './pages/Crops';
import Weather from './pages/Weather';
import Schemes from './pages/Schemes';
import Market from './pages/Market';
import Calendar from './pages/Calendar';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Announcements from './pages/Announcements';
import Insurance from './pages/Insurance';
import CropDoctor from './pages/CropDoctor';
import NearbyServices from './pages/NearbyServices';
import Settings from './pages/Settings';

export default function App() {
  // A new key after logout / account switch remounts every page, so no screen keeps old farm data.
  const { dataEpoch } = useApp();
  return (
    <Routes key={dataEpoch}>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="crops" element={<Crops />} />
        <Route path="weather" element={<Weather />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="market" element={<Market />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="community" element={<Community />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="insurance" element={<Insurance />} />
        <Route path="crop-doctor" element={<CropDoctor />} />
        <Route path="nearby" element={<NearbyServices />} />
        <Route path="help" element={<Navigate to="/community" replace />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
