import React, { useState, useEffect } from 'react';

export default function MentorDashboard({ user, onLogout }) {
  const [assignedClients, setAssignedClients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  // 🌐 Live data sync: Fetches both assigned clients and pending requests based on the logged-in User ID
  useEffect(() => {
    if (!user || !user.id) return;

    setLoading(true);
    setLoadingRequests(true);

    // 1. Fetch Assigned Active Clients (Maps User ID to Mentor Table underneath)
    fetch(`http://localhost:8080/api/mentors/clients?userId=${user.id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
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

    // 2. Fetch Pending Incubation Demands using the precise Mentor User ID endpoint
    fetch(`http://localhost:8080/api/requests/pending?userId=${user.id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not fetch pending demands");
        return response.json();
      })
      .then((data) => {
        setPendingRequests(data);
        setLoadingRequests(false);
      })
      .catch((error) => {
        console.error("Error fetching incubator demands:", error);
        setLoadingRequests(false);
      });
      
  }, [user?.id]);

  // 🤝 Action handler to claim an incoming request and store it in the database
 const handleClaimRequest = async (requestId) => {
    // 1. Locate the request card object in local state to retrieve its assigned mentorId sequence
    const targetRequest = pendingRequests.find(r => r.id === requestId);
    if (!targetRequest || !targetRequest.mentorId) {
      alert("Impossible de déterminer l'identifiant du mentor pour cette requête.");
      return;
    }

    try {
      setClaimingId(requestId);
      
      // 2. Explicitly call your backend claim request endpoint with parameters
      // Format matches: /api/requests/{id}/claim?mentorId={mentorId}
      const response = await fetch(`http://localhost:8080/api/requests/${requestId}/claim?mentorId=${targetRequest.mentorId}`, {
        method: "PUT",
        headers: {
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Erreur serveur lors de l'acceptation de la demande.");
      }

      const updatedRequest = await response.json();
      alert(`🎉 Succès! La demande N°${updatedRequest.id} a été acceptée.`);

      // 3. Update UI state loops instantly to keep everything completely synchronized
      // Remove the claimed ticket from the pending requests sidebar array
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      // 4. Trigger a refresh of the assigned clients panel on the left to display the newly integrated member
      setLoading(true);
      fetch(`http://localhost:8080/api/mentors/clients?userId=${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setAssignedClients(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error updating clients workspace panel:", err);
          setLoading(false);
        });

    } catch (error) {
      console.error("Claim operation failed:", error);
      alert(error.message || "Une erreur est survenue lors de l'intégration.");
    } finally {
      setClaimingId(null);
    }
  };

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
            <p className="text-2xl font-bold mt-1 text-amber-400">{pendingRequests.length}</p>
          </div>
        </section>

        {/* ─── MAIN CONTENT SPLIT ─── */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT WORKSPACE: Assigned Clients List (Takes up 2 Columns) */}
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

          {/* RIGHT SIDEBAR: Pending Incubation Requests Module & Calendar Tracker (Takes up 1 Column) */}
          <div className="space-y-6">
            
            {/* DYNAMIC INCUBATION REQUESTS INTERACTION HUB */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span>Demandes d'Incubation</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                  {pendingRequests.length} EN ATTENTE
                </span>
              </h3>

              {loadingRequests ? (
                <div className="text-xs text-gray-500 py-2">Recherche des requêtes d'incubation...</div>
              ) : pendingRequests.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">
                  Aucun message d'accompagnement en attente.
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {pendingRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="p-3 bg-zinc-900/80 border border-white/5 rounded-xl space-y-2 hover:border-purple-500/20 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-gray-200 line-clamp-1">
                          {req.subject || "Demande d'accompagnement"}
                        </span>
                        <span className="text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                          {req.status}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-gray-400 leading-relaxed break-words">
                        {req.description}
                      </p>
                      
                      <div className="text-[9px] text-gray-500 pt-1 flex justify-between items-center border-t border-white/5 pb-2">
                        <span>Ticket: #{req.id}</span>
                        <span>Porteur ID: {req.userId}</span>
                      </div>

                      {/* Interactive Button to automatically link data across tables */}
                      <button
                        onClick={() => handleClaimRequest(req.id)}
                        disabled={claimingId !== null}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-md transition-all text-center block shadow-sm"
                      >
                        {claimingId === req.id ? "Traitement..." : "🤝 Accepter & Intégrer le Projet"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SCHEDULE/CALENDAR SECTION */}
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