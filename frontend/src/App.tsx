import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.tsx';

import GameRoom from './pages/GameRoom';
import { useAuthStore } from './store/authStore.ts';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Lobby from './pages/Lobby.tsx';

const App = () => {
  const { user, loading } = useAuthStore();

  if (loading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/lobby/:code" element={user ? <Lobby /> : <Navigate to="/login" />} />
          <Route path="/game/:code" element={user ? <GameRoom /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
