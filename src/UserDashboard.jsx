import React, { useEffect, useState, useRef } from 'react';

export default function Dashboard({ user, onUpdateUser, onLogout }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [targetTier, setTargetTier] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Feature specific states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState([]);  
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mentorMessage, setMentorMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Client Incubation Requests State
  const [userRequests, setUserRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Credit Card Form Fields State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const formattedIdea = user.projectIdea
    ? user.projectIdea.replace(/\n/g, '').trim()
    : "Aucune description fournie.";

  const currentTier = user.tier || user.selectedTier || "GRATUIT";

  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [mentorsError, setMentorsError] = useState('');

  // ─── ASSIGNED MENTOR & LIVE CHAT STATES ───
  const [assignedMentors, setAssignedMentors] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  // Réf pour scroller automatiquement en bas du chat lors d'un nouveau message
  const chatEndRef = useRef(null);

  // Fetch the current user's incubation requests
  const fetchUserRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await fetch("http://localhost:8080/api/requests/open", {
        method: "GET",
        headers: { "Accept": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter(req => req.userId === user.id);
        setUserRequests(filtered);
      }
    } catch (error) {
      console.error("Error fetching user requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // ─── FETCH ASSIGNED MENTORS (JOIN FETCH OPTIMIZED) ───
  const fetchAssignedMentors = async () => {
    try {
      setLoadingAssigned(true);
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/mentors`, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignedMentors(data);
      }
    } catch (error) {
      console.error("Error getting assigned mentors:", error);
    } finally {
      setLoadingAssigned(false);
    }
  };

  // ─── FONCTION POUR CHARGER LES MESSAGES DEPUIS L'API ───
  const fetchChatMessages = async (mentorId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/messages/conversation?user1=${user.id}&user2=${mentorId}`);
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
    }
  };

  // Initialisation : Liste des demandes et mentors assignés
  useEffect(() => {
    fetchUserRequests();
    fetchAssignedMentors();
  }, [user.id]);

  // ─── SYSTEM DE POLLING LÉGER (Toutes les 5 secondes) ───
  useEffect(() => {
    // On ne lance le polling que si un mentor est bien assigné
    if (assignedMentors.length === 0) return;
    
    const mentorId = assignedMentors[0].id;
    
    // Premier appel immédiat
    fetchChatMessages(mentorId);

    // Mise en place de l'intervalle de 5 secondes
    const interval = setInterval(() => {
      fetchChatMessages(mentorId);
    }, 5000);

    // Nettoyage de l'intervalle si le composant est démonté
    return () => clearInterval(interval);
  }, [assignedMentors]);

  // Scroll automatique au bas du chat à chaque mise à jour des messages
useEffect(() => {
  if (chatEndRef.current) {
    chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
  }
}, [chatMessages]);

  // Real AI Engine for STANDARD/PREMIUM
  const handleAskAi = async (e) => {
    e.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt) return;

    setLoadingAi(true);
    setAiMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setAiPrompt("");

    try {
      const response = await fetch("http://localhost:8080/api/ai/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'analyse.");
      }

      setAiMessages((prev) => [...prev, { role: "ai", content: data.analysis }]);
    } catch (error) {
      console.error("Fetch failure:", error);
      setAiMessages((prev) => [
        ...prev,
        { role: "error", content: error.message || "Impossible de contacter l'IA Co-Pilot." },
      ]);
    } finally {
      setLoadingAi(false);
    }
  };

  // Envoi d'une demande d'incubation (Ticket global)
  const handleSendMessageToMentor = async (e) => {
    e.preventDefault();
    if (!mentorMessage.trim() || !selectedMentor) return;

    try {
      setSendingMessage(true);

      const requestBody = {
        userId: user.id,
        mentorId: selectedMentor.id,
        subject: `Accompagnement personnalisé - ${user.name}`,
        description: mentorMessage.trim(),
        status: "PENDING"
      };

      const response = await fetch("http://localhost:8080/api/requests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Impossible d'enregistrer la demande d'accompagnement.");
      }

      const savedRequest = await response.json();
      const mentorName = selectedMentor.name || selectedMentor.user?.name || "votre mentor";
      
      alert(`✉️ Demande d'incubation N°${savedRequest.id || ""} créée avec succès auprès de ${mentorName} !`);
      
      setMentorMessage('');
      setSelectedMentor(null);
      
      fetchUserRequests();
    } catch (error) {
      console.error("Incubation entry failure:", error);
      alert(error.message || "Une erreur est survenue lors de l'envoi de votre demande.");
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── ACTION : ENVOYER UN MESSAGE DE CHAT EN DIRECT EN BD ───
  const handleSendLiveChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || assignedMentors.length === 0) return;

    const mentorId = assignedMentors[0].id;
    const messagePayload = {
      senderId: user.id,
      receiverId: mentorId,
      content: chatInput.trim()
    };

    try {
      const response = await fetch("http://localhost:8080/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(messagePayload)
      });

      if (response.ok) {
        const newMsg = await response.json();
        // Optionnel : on l'ajoute directement à l'état pour une réactivité instantanée à l'écran
        setChatMessages((prev) => [...prev, newMsg]);
        setChatInput('');
      } else {
        console.error("Échec du traitement du message par le serveur");
      }
    } catch (error) {
      console.error("Erreur réseau lors de l'envoi :", error);
    }
  };

  const handleSelectPlan = (plan) => {
    if (plan === 'GRATUIT') {
      handleUpgrade('GRATUIT');
    } else {
      setTargetTier(plan);
      setIsModalOpen(false);
      setIsPaymentOpen(true);
    }
  };

  const handleUpgrade = async (tierToApply) => {
    try {
      setUpdating(true);
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/tier?tier=${tierToApply}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error("Erreur lors du changement de formule.");
      }

      const updatedUser = await response.json();
      if (onUpdateUser) onUpdateUser(updatedUser);

      setIsPaymentOpen(false);
      setIsModalOpen(false);
      setTargetTier(null);
      setCardNumber('');
      setExpiry('');
      setCvv('');

      alert(`Félicitations ! Votre formule est passée à : ${tierToApply}`);
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de la communication avec le serveur.");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (currentTier !== 'PREMIUM') return;

    const fetchMentors = async () => {
      try {
        setLoadingMentors(true);
        setMentorsError('');
        const response = await fetch("http://localhost:8080/api/mentors", {
          method: "GET",
          headers: { "Accept": "application/json" },
        });

        const data = await response.json();
        if (!response.ok) throw new Error("Impossible de charger les mentors.");

        setMentors(data);
      } catch (error) {
        console.error("Mentors fetch error:", error);
        setMentorsError(error.message || "Erreur lors du chargement des mentors.");
      } finally {
        setLoadingMentors(false);
      }
    };

    fetchMentors();
  }, [currentTier]);

  const handleFakeSubmitPayment = (e) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv) {
      alert("Veuillez remplir l'ensemble des coordonnées bancaires obligatoires.");
      return;
    }
    setUpdating(true);
    setTimeout(() => {
      handleUpgrade(targetTier);
    }, 1800);
  };

  // Formattage rapide de l'heure pour l'affichage local
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-brand-black text-white p-8 w-full flex flex-col justify-between relative">
      <div>
        {/* ─── HEADER ─── */}
        <header className="flex justify-between items-center border-b border-white/5 pb-4 mb-8">
          <div>
            <span className="text-xs text-brand-gold font-bold uppercase tracking-widest">
              Tableau de bord
            </span>
            <h1 className="text-3xl font-bold font-serif">
              Bienvenue, {user.name} !
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-brand-gold/10 text-brand-lightGold border border-brand-gold/20 text-xs font-bold rounded-full uppercase tracking-wider">
              Plan {currentTier}
            </span>

            <button
              onClick={onLogout}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-all"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* ─── MAIN CONTENT GRID ─── */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT/CENTER COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. MODULE: ASSIGNED MENTOR & MESSAGERIE DIRECTE ACTIVÉE */}
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-brand-lightGold uppercase tracking-wider">
                🤝 Votre Accompagnement & Messagerie Directe
              </h3>
              
              {loadingAssigned ? (
                <p className="text-xs text-gray-500">Recherche de vos assignations...</p>
              ) : assignedMentors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  
                  {/* Card Détails Mentor */}
                  <div className="md:col-span-2 p-4 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                        Mentor Connecté
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2">
                        {assignedMentors[0].name || assignedMentors[0].user?.name || "Mentor Expert"}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {assignedMentors[0].role || assignedMentors[0].speciality || "Conseiller Incubateur"}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-2 italic line-clamp-3">
                        {assignedMentors[0].expertise || "Expert en accompagnement de projets tripleS."}
                      </p>
                    </div>
                    <div className="text-[10px] text-gray-500 pt-2 border-t border-white/5 mt-2">
                      ID Système : #{assignedMentors[0].id}
                    </div>
                  </div>

                  {/* Panel Chat Réel Connecté au Backend */}
                  <div className="md:col-span-3 bg-black/50 border border-white/5 rounded-xl flex flex-col h-52 justify-between">
                    <div className="p-3 overflow-y-auto space-y-2 flex-1 max-h-[160px] text-xs">
                      {chatMessages.length === 0 ? (
                        <p className="text-zinc-600 text-center text-[11px] mt-6 italic">
                          Aucun message dans cette discussion. Lancez le premier mot !
                        </p>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.senderId === user.id;
                          return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] ${
                                isMe ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-gray-200'
                              }`}>
                                <p>{msg.content}</p>
                                <span className="block text-[8px] text-zinc-400 text-right mt-0.5">
                                  {formatTime(msg.timestamp)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      {/* Ancre invisible pour forcer le scroll vers le bas */}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendLiveChatMessage} className="p-2 border-t border-white/5 bg-zinc-900/50 flex gap-2 rounded-b-xl">
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Écrivez un message à votre mentor..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                      />
                      <button type="submit" className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs font-bold transition-all">
                        Envoyer
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-black/20 border border-white/5 rounded-xl text-center">
                  <p className="text-xs text-gray-500 italic">
                    Aucun mentor n'est encore assigné à votre projet. Soumettez une demande d'accompagnement à droite ou passez à l'offre Premium.
                  </p>
                </div>
              )}
            </div>

            {/* 2. AI CO-PILOT CHATBOT */}
            {(currentTier === 'STANDARD' || currentTier === 'PREMIUM') ? (
              <div className="bg-gradient-to-r from-purple-950/30 to-zinc-900 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    🤖 Diagnostic Automatique IA Unlocked
                  </h3>
                  <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase font-bold">
                    Standard Pro
                  </span>
                </div>

                <p className="text-gray-400 text-xs mb-4">
                  Posez des questions stratégiques sur votre idée ou votre business model.
                </p>

                <form onSubmit={handleAskAi} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Ex: Analyse mes forces face aux concurrents au Maroc..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="submit"
                    disabled={loadingAi}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAi ? "Analyse en cours..." : "Lancer l'audit IA"}
                  </button>
                </form>

                {aiMessages.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {aiMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-xl text-xs leading-relaxed animate-fadeIn whitespace-pre-line ${
                          message.role === "user"
                            ? "bg-purple-600/20 border-purple-500/20 text-purple-100"
                            : message.role === "error"
                            ? "bg-red-500/10 border-red-500/20 text-red-300"
                            : "bg-black/40 border-white/5 text-gray-300"
                        }`}
                      >
                        <strong>
                          {message.role === "user"
                            ? "🧑 You: "
                            : message.role === "error"
                            ? "⚠️ Error: "
                            : "🤖 IA Co-Pilot: "}
                        </strong>
                        {message.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-brand-darkGray/20 border border-white/5 opacity-60 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center backdrop-blur-[1px] p-4 text-center">
                  <p className="text-xs font-bold text-brand-lightGold mb-1">
                    🔒 Module IA Verrouillé
                  </p>
                  <p className="text-[10px] text-gray-400 max-w-xs">
                    Passez au plan Standard pour obtenir un audit automatique instantané de votre projet.
                  </p>
                </div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  🤖 Diagnostic Automatique IA
                </h3>
                <div className="h-10 bg-white/5 rounded-xl w-full"></div>
              </div>
            )}

            {/* 3. Lean Canvas Tool */}
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Votre Espace de Travail : Lean Canvas
                </h3>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Accès Libre
                </span>
              </div>

              <p className="text-gray-400 text-xs mb-4">
                Remplissez manuellement vos segments clés pour structurer votre business model.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                  <h4 className="text-xs font-bold text-brand-lightGold mb-2">
                    🎯 1. Problème & Segments Cibles
                  </h4>
                  <textarea
                    placeholder="Qui sont vos clients ? Quels problèmes résolvez-vous ?"
                    className="w-full h-24 bg-brand-darkGray/50 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-gold/40 text-gray-300 resize-none"
                  />
                </div>

                <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                  <h4 className="text-xs font-bold text-brand-lightGold mb-2">
                    💎 2. Proposition de Valeur
                  </h4>
                  <textarea
                    placeholder="Qu'est-ce qui rend votre startup unique ?"
                    className="w-full h-24 bg-brand-darkGray/50 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-gold/40 text-gray-300 resize-none"
                  />
                </div>
              </div>

              <button className="mt-4 px-4 py-2 bg-white text-brand-black font-bold text-xs rounded-lg hover:bg-gray-200 transition-all">
                Sauvegarder le Canvas
              </button>
            </div>

            {/* 4. Resources / Guides Section */}
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                📚 Ressources & Guides Startup
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <a
                  href="#guide1"
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-between transition-all"
                >
                  <span>Comprendre les étapes du programme Forsa</span>
                  <i className="fa-solid fa-chevron-right text-brand-gold"></i>
                </a>

                <a
                  href="#guide2"
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-between transition-all"
                >
                  <span>Modèle de Pitch Deck pour amorçage</span>
                  <i className="fa-solid fa-chevron-right text-brand-gold"></i>
                </a>

                {(currentTier === 'STANDARD' || currentTier === 'PREMIUM') && (
                  <a
                    href="#premium-guide"
                    className="p-3 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between transition-all sm:col-span-2"
                  >
                    <span className="text-purple-300 font-semibold">
                      💎 [EXCLUSIF] Dossier de Subvention complet - Modèle Excel Tamwilcom
                    </span>
                    <i className="fa-solid fa-download text-purple-400"></i>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN */}
          <div className="space-y-6">
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Votre Idée de Projet
              </h3>
              <p className="text-gray-200 text-sm italic leading-relaxed">
                "{formattedIdea}"
              </p>
            </div>

            {/* MENTORS NETWORK */}
            {currentTier === 'PREMIUM' ? (
              <div className="bg-gradient-to-r from-amber-950/20 to-zinc-900 border border-brand-gold/20 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-brand-lightGold uppercase tracking-wider">
                    ✨ Réseau tripleS : Mentors
                  </h3>
                  <span className="text-[9px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20 uppercase font-bold">
                    Elite
                  </span>
                </div>

                {loadingMentors ? (
                  <div className="text-xs text-gray-500 py-2">Chargement...</div>
                ) : mentorsError ? (
                  <div className="text-xs text-red-400 py-2">{mentorsError}</div>
                ) : mentors.length === 0 ? (
                  <div className="text-xs text-gray-500 py-2">Aucun mentor disponible.</div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {mentors.map((m) => {
                      const mentorName = m.name || m.user?.name || "Mentor";
                      const mentorRole = m.role || m.speciality || m.specialty || "Mentor startup";

                      return (
                        <div key={m.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-white">{mentorName}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">{mentorRole}</p>
                          </div>
                          <button
                            onClick={() => setSelectedMentor(m)}
                            className="mt-3 text-[10px] text-center w-full py-1.5 bg-brand-gold/10 hover:bg-brand-gold text-brand-lightGold hover:text-black rounded-md transition-all font-semibold"
                          >
                            Contacter
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedMentor && (
                  <form onSubmit={handleSendMessageToMentor} className="p-4 mt-3 bg-black/60 border border-brand-gold/20 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-300">
                        Pour : <strong className="text-brand-lightGold">{selectedMentor.name || selectedMentor.user?.name || "Mentor"}</strong>
                      </p>
                      <button type="button" onClick={() => setSelectedMentor(null)} className="text-[10px] text-red-400 hover:underline" disabled={sendingMessage}>
                        Annuler
                      </button>
                    </div>

                    <textarea
                      placeholder="Posez votre question sur votre business plan ou plan de financement..."
                      value={mentorMessage}
                      onChange={(e) => setMentorMessage(e.target.value)}
                      className="w-full h-20 bg-brand-darkGray/50 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-gold text-gray-200 resize-none"
                      disabled={sendingMessage}
                      required
                    />

                    <button type="submit" disabled={sendingMessage} className="w-full py-1.5 bg-brand-gold disabled:opacity-50 text-black text-xs font-bold rounded-md hover:bg-brand-hoverGold transition-all">
                      {sendingMessage ? "Envoi..." : "Envoyer la demande"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-brand-darkGray/20 border border-white/5 opacity-60 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center backdrop-blur-[1px] p-4 text-center">
                  <p className="text-xs font-bold text-brand-lightGold mb-1">🔒 Mentors tripleS Bloqué</p>
                  <p className="text-[10px] text-gray-400 max-w-xs">Devenez membre Premium pour débloquer le catalogue.</p>
                </div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">✨ Réseau Privé : Mentors</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-white/5 rounded-xl"></div>
                  <div className="h-12 bg-white/5 rounded-xl"></div>
                  <div className="h-12 bg-white/5 rounded-xl"></div>
                </div>
              </div>
            )}

            {/* PENDING REQUESTS */}
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span>Demandes Envoyées</span>
                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 font-normal">
                  {userRequests.length}
                </span>
              </h3>

              {loadingRequests ? (
                <div className="text-xs text-gray-500 py-2">Mise à jour...</div>
              ) : userRequests.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  Aucune demande d'incubation en attente.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {userRequests.map((req) => (
                    <div key={req.id} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-gray-200 line-clamp-1">
                          {req.subject || "Sans objet"}
                        </span>
                        <span className="text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase shrink-0">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-2">
                        {req.description}
                      </p>
                      <div className="text-[9px] text-gray-500 pt-1 flex justify-between">
                        <span>ID: #{req.id}</span>
                        <span>Mentor ID: {req.mentorId || 'Aucun'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INCUBATION STATUS */}
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Statut Incubation
              </h3>

              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between items-center bg-black/20 p-2.5 border border-white/5 rounded-xl">
                  <span className="text-xs text-gray-400">Dossier de Plan</span>
                  <span className="text-xs font-semibold text-brand-gold">En cours de structure</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-2.5 border border-white/5 rounded-xl">
                  <span className="text-xs text-gray-400">Validation Mentor</span>
                  <span className="text-xs font-semibold text-amber-400">En attente</span>
                </div>
              </div>

              {currentTier !== 'PREMIUM' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full mt-4 py-2 bg-gradient-to-r from-brand-gold to-yellow-600 hover:from-yellow-500 hover:to-brand-gold text-black font-bold text-xs rounded-xl transition-all shadow-lg"
                >
                  🚀 Booster mon incubation
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 pt-4 border-t border-white/5 text-center text-xs text-gray-600">
        <p>&copy; 2026 Triple S Incubation. Tous droits réservés.</p>
      </footer>

      {/* MODAL 1: FORMULES */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-md w-full space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-serif font-bold text-brand-lightGold">Choisir une formule</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
            </div>
            <p className="text-xs text-gray-400">Maximisez vos chances de réussite avec nos outils avancés.</p>
            
            <div className="space-y-3">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">GRATUIT</h4>
                  <p className="text-[10px] text-gray-400">Lean Canvas & Ressources de base</p>
                </div>
                <button 
                  onClick={() => handleSelectPlan('GRATUIT')}
                  disabled={currentTier === 'GRATUIT'}
                  className="px-3 py-1 bg-zinc-700 text-white text-[11px] font-bold rounded-lg disabled:opacity-40"
                >
                  {currentTier === 'GRATUIT' ? 'Actuel' : 'Sélectionner'}
                </button>
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-purple-400">STANDARD</h4>
                  <p className="text-[10px] text-gray-400">Audit IA instantané illimité</p>
                </div>
                <button 
                  onClick={() => handleSelectPlan('STANDARD')}
                  disabled={currentTier === 'STANDARD'}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg disabled:opacity-40"
                >
                  {currentTier === 'STANDARD' ? 'Actuel' : 'Choisir'}
                </button>
              </div>

              <div className="p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-brand-lightGold">PREMIUM</h4>
                  <p className="text-[10px] text-gray-400">Réseau privé de mentors & Direct Chat</p>
                </div>
                <button 
                  onClick={() => handleSelectPlan('PREMIUM')}
                  disabled={currentTier === 'PREMIUM'}
                  className="px-3 py-1 bg-brand-gold text-black text-[11px] font-bold rounded-lg disabled:opacity-40"
                >
                  Choisir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PAIEMENT SÉCURISÉ */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-md w-full relative">
            <button
              onClick={() => {
                setIsPaymentOpen(false);
                setIsModalOpen(true);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs bg-white/5 px-2 py-1 rounded"
              disabled={updating}
            >
              ← Retour
            </button>

            <h3 className="text-lg font-bold font-serif mb-1">
              Passerelle de Paiement Sécurisée
            </h3>

            <p className="text-xs text-gray-400 mb-6">
              Formule ciblée :{" "}
              <span className="text-brand-gold font-bold uppercase">
                {targetTier}
              </span>
            </p>

            <form onSubmit={handleFakeSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-wider">
                  Nom du titulaire
                </label>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-gray-300 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-wider">
                  Numéro de carte bancaire
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none focus:border-brand-gold/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-wider">
                    Date d'expiration
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-center focus:outline-none focus:border-brand-gold/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-wider">
                    Code CVC / CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-center focus:outline-none focus:border-brand-gold/50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updating ? (
                  <span>🔒 Traitement de la transaction sécurisée...</span>
                ) : (
                  <span>Confirmer le règlement</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}