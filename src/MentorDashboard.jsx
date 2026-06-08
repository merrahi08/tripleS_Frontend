import React, { useState, useEffect } from 'react';

export default function MentorDashboard({ user, onLogout }) {
  const [assignedClients, setAssignedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  console.log(user.id);
  
  // 🌐 Live fetch for this mentor's specific clients
  useEffect(() => {
    // 1. Ensure user and user.id exist before making the API call
    if (!user || !user.id) return;

    setLoading(true);

    // 2. Fetch data from your custom endpoint using user.id
    fetch(`http://localhost:8080/api/mentors/clients?userId=${user.id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setAssignedClients(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching clients:", error);
        setLoading(false);
      });
      
  }, [user?.id]); // 3. Re-run the effect if the user ID changes

  return (
    <div className="min-h-screen bg-black text-white p-8 w-full flex flex-col justify-between">
      <div>
        {/* ─── HEADER ─── */}
        <header className="flex justify-between items-center border-b border-white/10 pb-4 mb-8">
          <div>
            <span className="text-xs text-purple-400 font-bold uppercase tracking-widest">Espace Expert</span>
            <h1 className="text-3xl font-bold">Tableau de Bord Mentor</h1>
            <p className="text-xs text-gray-400 mt-1">Ravi de vous revoir, <strong className="text-white">{user?.name}</strong></p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
              Expert validé
            </span>
            <button 
              onClick={onLogout} 
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-all"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* ─── STATS ROW ─── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
            <p className="text-xs text-gray-400 uppercase font-medium">Clients assignés</p>
            <p className="text-2xl font-bold mt-1 text-purple-400">{assignedClients.length}</p>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
            <p className="text-xs text-gray-400 uppercase font-medium">Heures de Mentorat</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">14h</p>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
            <p className="text-xs text-gray-400 uppercase font-medium">Demandes en attente</p>
            <p className="text-2xl font-bold mt-1 text-amber-400">1</p>
          </div>
        </section>

        {/* ─── MAIN CONTENT SPLIT ─── */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Assigned Clients Workspace List (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Vos Porteurs de Projet Actifs</h3>
              
              {loading ? (
                <p className="text-xs text-gray-500">Chargement de la liste des clients...</p>
              ) : assignedClients.length === 0 ? (
                <p className="text-xs text-gray-500">Aucun projet ne vous a été assigné pour le moment.</p>
              ) : (
                <div className="space-y-4">
                  {assignedClients.map((client) => (
                    <div key={client.id} className="p-4 bg-zinc-900 border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/30 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white capitalize">{client.name}</h4>
                          <span className={`text-[9px] px-2 py-0.5 font-bold rounded ${
                            client.tier === 'PREMIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          }`}>
                            {client.tier}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{client.email}</p>
                        <p className="text-xs text-gray-300 italic pt-1">
                          " {client.projectIdea?.replace(/\\n/g, '').trim()} "
                        </p>
                      </div>
                      
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button className="px-3 py-1.5 bg-purple-500 text-white font-bold text-xs rounded-lg hover:bg-purple-600 transition-all">
                          Consulter l'Espace
                        </button>
                        <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-semibold rounded-lg transition-all">
                          Envoyer un message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR: Live Calendar / Reminders (1 Column) */}
          <div className="space-y-6">
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">🗓️ Prochaines Sessions</h3>
              <div className="space-y-3 text-xs text-gray-400">
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                  <p className="font-bold text-white mb-1">Session Diagnostic — Amina E.</p>
                  <p>Mardi 9 Juin · 15:00 (Google Meet)</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg opacity-50">
                  <p className="font-bold text-white mb-1">Revue Lean Canvas — No Client</p>
                  <p>Aucun autre rendez-vous cette semaine.</p>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="mt-12 pt-4 border-t border-white/5 text-center text-xs text-gray-600">
        <p>&copy; 2026 Triple S Incubation. Tous droits réservés.</p>
      </footer>
    </div>
  );
}