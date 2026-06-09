import React, { useEffect, useState } from 'react';

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

  // Fetch the current user's incubation requests
  const fetchUserRequests = async () => {
    try {
      setLoadingRequests(true);
      // We read all open/pending requests from the hub to filter or display
      const response = await fetch("http://localhost:8080/api/requests/open", {
        method: "GET",
        headers: { "Accept": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter requests belonging to this specific user
        const filtered = data.filter(req => req.userId === user.id);
        setUserRequests(filtered);
      }
    } catch (error) {
      console.error("Error fetching user requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Run on initialization
  useEffect(() => {
    fetchUserRequests();
  }, [user.id]);

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

  // Real API Interaction matching your verified flat JSON layout
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
      
      // Refresh the list immediately in the side panel
      fetchUserRequests();
    } catch (error) {
      console.error("Incubation entry failure:", error);
      alert(error.message || "Une erreur est survenue lors de l'envoi de votre demande.");
    } finally {
      setSendingMessage(false);
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

          {/* LEFT/CENTER: Workspace & Dynamic Tools */}
          <div className="lg:col-span-2 space-y-6">

            {/* Lean Canvas Tool */}
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

            {/* AI CO-PILOT CHATBOT */}
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

            {/* MENTOR DIRECT INTERACTION */}
            {currentTier === 'PREMIUM' ? (
              <div className="bg-gradient-to-r from-amber-950/20 to-zinc-900 border border-brand-gold/20 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-brand-lightGold uppercase tracking-wider flex items-center gap-2">
                    ✨ Réseau Privé : Vos Mentors Forsa & Tamwilcom
                  </h3>

                  <span className="text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20 uppercase font-bold">
                    Premium Elite
                  </span>
                </div>

                {loadingMentors ? (
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs text-gray-400">
                    Chargement des mentors...
                  </div>
                ) : mentorsError ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                    {mentorsError}
                  </div>
                ) : mentors.length === 0 ? (
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs text-gray-400">
                    Aucun mentor disponible pour le moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {mentors.map((m) => {
                      const mentorName = m.name || m.user?.name || "Mentor";
                      const mentorRole = m.role || m.speciality || m.specialty || "Mentor startup";

                      return (
                        <div
                          key={m.id}
                          className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-white">
                              {mentorName}
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {mentorRole}
                            </p>
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
                  <form
                    onSubmit={handleSendMessageToMentor}
                    className="p-4 bg-black/60 border border-brand-gold/20 rounded-xl space-y-3 animate-fadeIn"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-300">
                        Nouveau message pour :{" "}
                        <strong className="text-brand-lightGold">
                          {selectedMentor.name || selectedMentor.user?.name || "Mentor"}
                        </strong>
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedMentor(null)}
                        className="text-[10px] text-red-400 hover:underline"
                        disabled={sendingMessage}
                      >
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

                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="px-4 py-1.5 bg-brand-gold disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold rounded-md hover:bg-brand-hoverGold transition-all"
                    >
                      {sendingMessage ? "Envoi de la demande..." : "Envoyer la demande d'accompagnement"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-brand-darkGray/20 border border-white/5 opacity-60 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center backdrop-blur-[1px] p-4 text-center">
                  <p className="text-xs font-bold text-brand-lightGold mb-1">
                    🔒 Mentorat 1-on-1 Verrouillé
                  </p>
                  <p className="text-[10px] text-gray-400 max-w-xs">
                    Devenez membre Premium pour soumettre votre dossier à notre comité d'experts d'accompagnement.
                  </p>
                </div>

                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  ✨ Réseau Privé : Vos Mentors
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-white/5 rounded-xl"></div>
                  <div className="h-12 bg-white/5 rounded-xl"></div>
                  <div className="h-12 bg-white/5 rounded-xl"></div>
                </div>
              </div>
            )}

            {/* Resources / Guides Section */}
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

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Votre Idée de Projet
              </h3>
              <p className="text-gray-200 text-sm italic leading-relaxed">
                "{formattedIdea}"
              </p>
            </div>

            {/* PENDING REQUESTS SIDE PANEL MODULE */}
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
                    <div 
                      key={req.id} 
                      className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1"
                    >
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

            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Statut Incubation
              </h3>

              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>
                    Compte activé (
                    <strong className="text-brand-lightGold uppercase">
                      {currentTier}
                    </strong>
                    )
                  </span>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2 bg-brand-gold text-brand-black text-xs font-bold rounded-lg hover:bg-brand-hoverGold transition-all"
                  >
                    {currentTier === 'PREMIUM' ? "Gérer l'abonnement" : "Changer de formule"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* SUBSCRIPTION PLANS SELECTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 rounded-2xl max-w-4xl w-full relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs bg-white/5 px-2 py-1 rounded"
            >
              ✕ Fermer
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-serif">
                Choisissez votre formule d'incubation
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Propulsez votre structure d'accompagnement à l'étape supérieure
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">

              {/* GRATUIT */}
              <div className={`p-5 rounded-xl border flex flex-col justify-between ${currentTier === 'GRATUIT' ? 'border-brand-gold bg-brand-gold/5' : 'border-white/5 bg-zinc-950'}`}>
                <div>
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wide">
                    Gratuit
                  </h3>
                  <p className="text-2xl font-extrabold mt-1">
                    0 DH <span className="text-[10px] font-normal text-gray-500">/ à vie</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-gray-400 border-t border-white/5 pt-3">
                    <li>✓ Outil Lean Canvas</li>
                    <li>✓ Accès aux guides publics</li>
                  </ul>
                </div>

                <button
                  disabled={currentTier === 'GRATUIT' || updating}
                  onClick={() => handleSelectPlan('GRATUIT')}
                  className="w-full mt-6 py-2 bg-zinc-800 disabled:opacity-40 text-white font-semibold text-xs rounded-lg hover:bg-zinc-700 transition"
                >
                  {currentTier === 'GRATUIT' ? 'Formule Actuelle' : 'Rétrograder'}
                </button>
              </div>

              {/* STANDARD */}
              <div className={`p-5 rounded-xl border flex flex-col justify-between ${currentTier === 'STANDARD' ? 'border-brand-gold bg-brand-gold/5' : 'border-white/5 bg-zinc-950'}`}>
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-white uppercase tracking-wide">
                      Standard
                    </h3>
                    <span className="text-[9px] bg-white/10 text-brand-lightGold font-bold px-1.5 py-0.5 rounded">
                      Recommandé
                    </span>
                  </div>

                  <p className="text-2xl font-extrabold mt-1">
                    299 DH <span className="text-[10px] font-normal text-gray-500">/ mois</span>
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-gray-400 border-t border-white/5 pt-3">
                    <li>✓ Lean Canvas illimité</li>
                    <li>✓ Diagnostic automatique IA</li>
                    <li>✓ Support messagerie direct</li>
                  </ul>
                </div>

                <button
                  disabled={currentTier === 'STANDARD' || updating}
                  onClick={() => handleSelectPlan('STANDARD')}
                  className="w-full mt-6 py-2 bg-white text-black disabled:opacity-40 font-bold text-xs rounded-lg hover:bg-gray-200 transition"
                >
                  {currentTier === 'STANDARD' ? 'Formule Actuelle' : 'Choisir Standard'}
                </button>
              </div>

              {/* PREMIUM */}
              <div className={`p-5 rounded-xl border flex flex-col justify-between ${currentTier === 'PREMIUM' ? 'border-brand-gold bg-brand-gold/5' : 'border-white/5 bg-zinc-950'}`}>
                <div>
                  <h3 className="font-bold text-sm text-brand-lightGold uppercase tracking-wide">
                    Premium
                  </h3>

                  <p className="text-2xl font-extrabold mt-1">
                    799 DH <span className="text-[10px] font-normal text-gray-500">/ mois</span>
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-gray-400 border-t border-white/5 pt-3">
                    <li>✓ Tous les accès Standard</li>
                    <li>✓ Mentorat direct 1-on-1 visio</li>
                    <li>✓ Montage dossier Tamwilcom</li>
                  </ul>
                </div>

                <button
                  disabled={currentTier === 'PREMIUM' || updating}
                  onClick={() => handleSelectPlan('PREMIUM')}
                  className="w-full mt-6 py-2 bg-brand-gold text-brand-black disabled:opacity-40 font-extrabold text-xs rounded-lg hover:bg-brand-hoverGold transition"
                >
                  {currentTier === 'PREMIUM' ? 'Formule Actuelle' : 'Passer à Premium'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION PAYMENT CARD MODAL */}
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

      {/* FOOTER */}
      <footer className="mt-12 pt-4 border-t border-white/5 text-center text-xs text-gray-600">
        <p>&copy; 2026 Triple S Incubation. Tous droits réservés.</p>
      </footer>
    </div>
  );
}