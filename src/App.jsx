import React, { useState } from 'react';
import LandingPage from './LandingPage';
import Dashboard from './UserDashboard';
import MentorDashboard from './MentorDashboard';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Erreur de lecture du localStorage:", error);
      return null;
    }
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div className="bg-brand-black min-h-screen text-white font-sans">
      {user ? (
        user.role === 'ROLE_MENTOR' ? (
          <MentorDashboard
            user={user}
            onLogout={handleLogout}
          />
        ) : (
          <Dashboard
            user={user}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
          />
        )
      ) : (
        <LandingPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}