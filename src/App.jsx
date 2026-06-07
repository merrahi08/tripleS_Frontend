import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import Dashboard from './UserDashboard';

export default function App() {
  // 1. Initialisation de l'état avec l'utilisateur stocké en local (si existant)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Erreur de lecture du localStorage:", error);
      return null;
    }
  });

  // 2. Callback déclenché après une inscription ou connexion réussie
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Le localStorage est déjà mis à jour dans LandingPage.jsx, 
    // mais le mettre à jour ici garantit la synchronisation de l'état global.
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // 3. Gestion de la déconnexion
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // 4. Rendu conditionnel basé sur la présence d'une session utilisateur
  return (
    <div className="bg-brand-black min-h-screen text-white font-sans">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LandingPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}