import React, { useState, useEffect, useRef } from "react";
// import { API_URL } from "./config";
const API_URL = "http://localhost:8080";

export default function MentorDashboard({ user, onLogout }) {
  const [assignedClients, setAssignedClients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  // ─── CHAT LIVE STATES ───
  const [activeChatClient, setActiveChatClient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  // ─── NOTIFICATIONS & SORTING STATES ───
  const [lastConversationsSummary, setLastConversationsSummary] = useState([]);

  // 🌐 Live data sync: Fetches both assigned clients and pending requests based on the logged-in User ID
  useEffect(() => {
    if (!user || !user.id) return;

    setLoading(true);
    setLoadingRequests(true);

    // 1. Fetch Assigned Active Clients (Maps User ID to Mentor Table underneath)
    fetch(`${API_URL}/api/mentors/clients?userId=${user.id}`)
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
    fetch(`${API_URL}/api/requests/mentor/${user.id}/pending`)
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

  // ─── FONCTION POUR RECUPERER LES MESSAGES DU CLIENT ACTIF ───
  const fetchChatMessages = async (clientId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/messages/conversation?user1=${user.id}&user2=${clientId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
    }
  };

  // ─── FONCTION POUR NOTIFICATIONS ET TRI (RÉSUMÉ DES CONVERSATIONS) ───
  const fetchLastConversationsSummary = async () => {
    if (!user || !user.id) return;
    try {
      const response = await fetch(
        `${API_URL}/api/messages/last-conversations?userId=${user.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setLastConversationsSummary(data);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement du résumé des discussions:",
        error,
      );
    }
  };

  // ─── SYSTEM DE POLLING GLOBAL (NOTIFICATIONS & APERÇUS) ───
  useEffect(() => {
    if (!user || !user.id) return;

    fetchLastConversationsSummary();

    // Polling global toutes les 5 secondes pour mettre à jour l'ordre et les pastilles rouges
    const summaryInterval = setInterval(() => {
      fetchLastConversationsSummary();
    }, 5000);

    return () => clearInterval(summaryInterval);
  }, [user?.id]);

  // ─── SYSTEM DE POLLING DU CHAT SELECTIONNÉ ───
  useEffect(() => {
    if (!activeChatClient) return;

    fetchChatMessages(activeChatClient.id);

    const interval = setInterval(() => {
      fetchChatMessages(activeChatClient.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeChatClient]);

  // Scroll automatique vers le bas lors de l'arrivée de messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ─── ENVOYER UN MESSAGE AU CLIENT ───
  const handleSendLiveMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatClient) return;

    const messagePayload = {
      senderId: user.id,
      receiverId: activeChatClient.id,
      content: chatInput.trim(),
    };

    try {
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setChatMessages((prev) => [...prev, newMsg]);
        setChatInput("");
        fetchLastConversationsSummary();
      }
    } catch (error) {
      console.error("Erreur d'envoi du message par le mentor :", error);
    }
  };

  // 🤝 Action handler to claim an incoming request and store it in the database
  const handleClaimRequest = async (requestId) => {
    const targetRequest = pendingRequests.find((r) => r.id === requestId);
    if (!targetRequest) {
      alert(
        "Impossible de déterminer l'identifiant du mentor pour cette requête.",
      );
      return;
    }

    try {
      setClaimingId(requestId);

      const response = await fetch(
        `${API_URL}/api/requests/${requestId}/claim`,
        {
          method: "PUT",
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok)
        throw new Error("This request has already been claimed.");

      const updatedRequest = await response.json();
      alert(`🎉 Succès! La demande N°${updatedRequest.id} a été acceptée.`);

      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));

      setLoading(true);
      fetch(`${API_URL}/api/mentors/clients?userId=${user.id}`)
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

  const formatTime = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── TRAITEMENT ET TRI DYNAMIQUE DES CLIENTS REÇUS ───
  const processedClients = assignedClients
    .map((client) => {
      // On cherche un message lié à ce client (soit il l'a envoyé, soit il l'a reçu)
      const lastMsg = lastConversationsSummary.find(
        (m) => m.senderId === client.id || m.receiverId === client.id,
      );

      return {
        ...client,
        lastMessageTimestamp: lastMsg
          ? new Date(lastMsg.timestamp)
          : new Date(0),
        lastMessageText: lastMsg ? lastMsg.content : null,
        isLastMessageUnread: lastMsg
          ? !lastMsg.isRead && msg.senderId === client.id
          : false,
      };
    })
    .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

  return (
    <div className="min-h-screen bg-black text-white p-8 w-full flex flex-col justify-between">
      <div>
        {/* ─── HEADER ─── */}
        <header className="flex justify-between items-center border-b border-white/10 pb-4 mb-8">
          <div>
            <span className="text-xs text-purple-400 font-bold uppercase tracking-widest">
              Espace Expert
            </span>
            <h1 className="text-3xl font-bold">Tableau de Bord Mentor</h1>
            <p className="text-xs text-gray-400 mt-1">
              Ravi de vous revoir,{" "}
              <strong className="text-white">{user?.name}</strong>
            </p>
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
            <p className="text-xs text-gray-400 uppercase font-medium">
              Clients assignés
            </p>
            <p className="text-2xl font-bold mt-1 text-purple-400">
              {assignedClients.length}
            </p>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
            <p className="text-xs text-gray-400 uppercase font-medium">
              Heures de Mentorat
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">14h</p>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
            <p className="text-xs text-gray-400 uppercase font-medium">
              Demandes en attente
            </p>
            <p className="text-2xl font-bold mt-1 text-amber-400">
              {pendingRequests.length}
            </p>
          </div>
        </section>

        {/* ─── MAIN CONTENT SPLIT ─── */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT WORKSPACE */}
          <div className="lg:col-span-2 space-y-6">
            {/* 💬 INTERACTIVE LIVE CHAT BOX */}
            {activeChatClient && (
              <div className="bg-zinc-900/40 border border-purple-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                      Discussion en direct avec :{" "}
                      <span className="text-white normal-case font-sans font-bold text-sm ml-1">
                        {activeChatClient.name}
                      </span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveChatClient(null)}
                    className="text-[11px] text-zinc-500 hover:text-white bg-white/5 px-2 py-0.5 rounded transition-all"
                  >
                    Fermer le chat
                  </button>
                </div>

                {/* Fil de discussion */}
                <div className="h-48 bg-black/50 border border-white/5 rounded-xl p-3 overflow-y-auto space-y-2 text-xs">
                  {chatMessages.length === 0 ? (
                    <p className="text-zinc-600 text-center italic mt-12">
                      Aucun historique disponible. Envoyez-lui un message
                      d'accueil !
                    </p>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-1.5 line-clamp-none ${
                              isMe
                                ? "bg-purple-600 text-white"
                                : "bg-zinc-800 text-gray-200"
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <span className="block text-[8px] text-zinc-400 text-right mt-0.5">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Formulaire d'envoi */}
                <form onSubmit={handleSendLiveMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Répondre à ${activeChatClient.name}...`}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold transition-all"
                  >
                    Envoyer
                  </button>
                </form>
              </div>
            )}

            {/* LISTE DES PORTEURS DE PROJET */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
                Vos Porteurs de Projet Actifs
              </h3>

              {loading ? (
                <p className="text-xs text-gray-500">
                  Chargement de la liste des clients...
                </p>
              ) : processedClients.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Aucun projet ne vous a été assigné pour le moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* ICI: Remplacement crucial de assignedClients par processedClients */}
                  {processedClients.map((client) => {
                    const isChattingWithThisClient =
                      activeChatClient?.id === client.id;
                    const hasBadgeNotification =
                      client.isLastMessageUnread && !isChattingWithThisClient;

                    return (
                      <div
                        key={client.id}
                        className={`p-4 bg-zinc-900 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                          isChattingWithThisClient
                            ? "border-purple-500 bg-zinc-900/80 shadow-md"
                            : hasBadgeNotification
                              ? "border-red-500/40 bg-zinc-900/70 shadow-sm shadow-red-500/5"
                              : "border-white/10 hover:border-purple-500/30"
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white capitalize">
                              {client.name}
                            </h4>

                            {/* 🔴 Pastille Rouge de Notification Intégrée */}
                            {hasBadgeNotification && (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            )}

                            <span
                              className={`text-[9px] px-2 py-0.5 font-bold rounded ${
                                client.tier === "PREMIUM"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                              }`}
                            >
                              {client.tier || "STANDARD"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {client.email}
                          </p>
                          <p className="text-xs text-gray-300 italic pt-1 truncate">
                            "{" "}
                            {client.projectIdea?.replace(/\\n/g, "").trim() ||
                              "Aucune description fournie."}{" "}
                            "
                          </p>

                          {/* 💬 Affichage en direct du dernier message reçu ou envoyé */}
                          {client.lastMessageText && (
                            <p
                              className={`text-[11px] pt-1 mt-1 border-t border-white/5 truncate max-w-xl ${hasBadgeNotification ? "text-purple-400 font-semibold" : "text-zinc-500"}`}
                            >
                              <span className="text-[10px] uppercase font-bold tracking-tight mr-1 opacity-80">
                                Dernier échange :
                              </span>
                              {client.lastMessageText}
                            </p>
                          )}
                        </div>

                        <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
                          <button className="px-3 py-1.5 bg-purple-500 text-white font-bold text-xs rounded-lg hover:bg-purple-600 transition-all">
                            Consulter l'Espace
                          </button>
                          <button
                            onClick={() => setActiveChatClient(client)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                              isChattingWithThisClient
                                ? "bg-purple-600/20 border border-purple-500/30 text-purple-300"
                                : hasBadgeNotification
                                  ? "bg-red-600 hover:bg-red-500 text-white font-bold animate-pulse"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
                            }`}
                          >
                            💬{" "}
                            {isChattingWithThisClient
                              ? "Discussion Active"
                              : hasBadgeNotification
                                ? "Nouveau message"
                                : "Envoyer un message"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span>Demandes d'Incubation</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                  {pendingRequests.length} EN ATTENTE
                </span>
              </h3>

              {loadingRequests ? (
                <div className="text-xs text-gray-500 py-2">
                  Recherche des requêtes d'incubation...
                </div>
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
                      <button
                        onClick={() => handleClaimRequest(req.id)}
                        disabled={claimingId !== null}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-md transition-all text-center block shadow-sm"
                      >
                        {claimingId === req.id
                          ? "Traitement..."
                          : "🤝 Accepter & Intégrer le Projet"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
                🗓️ Prochaines Sessions
              </h3>
              <div className="space-y-3 text-xs text-gray-400">
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                  <p className="font-bold text-white mb-1">
                    Session Diagnostic — Amina E.
                  </p>
                  <p>Mardi 9 Juin · 15:00 (Google Meet)</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg opacity-50">
                  <p className="font-bold text-white mb-1">
                    Revue Lean Canvas — No Client
                  </p>
                  <p>Aucun autre rendez-vous cette semaine.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="mt-12 pt-4 border-t border-white/5 text-center text-xs text-gray-600">
        <p>&copy;bla 2026 Triple S Incubation. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
