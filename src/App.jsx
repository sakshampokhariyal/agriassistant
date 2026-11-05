import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
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

export default function App() {
  return (
    <Routes>
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
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
