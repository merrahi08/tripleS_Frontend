import React, { useState } from 'react';

export default function LandingPage({ onLoginSuccess }) {
  // State management for the Landing Page interactions
  const [isAnnual, setIsAnnual] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'sami', text: "Bonjour ! Je suis Sami, votre assistant d'incubation virtuel. Comment puis-je vous aider à structurer votre startup aujourd'hui ?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', idea: '' });  
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false); // false = Register, true = Login
  

const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
const [expertRegisterSuccess, setExpertRegisterSuccess] = useState(false);

const [mentorFormData, setMentorFormData] = useState({
  name: '',
  email: '',
  password: '',
  title: '',
  expertise: '',
  bio: '',
  linkedinUrl: '',
  imageUrl: ''
});

const handleMentorSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:8080/api/mentors/register-full", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mentorFormData),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      alert(errorMsg || "Erreur lors de l'inscription mentor.");
      return;
    }

    const userData = await response.json();

    localStorage.setItem("user", JSON.stringify(userData));

    setExpertRegisterSuccess(true);

    setTimeout(() => {
      setIsExpertModalOpen(false);
      setExpertRegisterSuccess(false);

      setMentorFormData({
        name: '',
        email: '',
        password: '',
        title: '',
        expertise: '',
        bio: '',
        linkedinUrl: '',
        imageUrl: ''
      });

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
    }, 2000);

  } catch (error) {
    console.error("Erreur inscription mentor:", error);
    alert("Impossible de joindre l'API d'inscription mentor.");
  }
};
  // Handles the floating AI Assistant chat simulation
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newUserMsg = { id: Date.now(), sender: 'user', text: userInput };
    setChatMessages(prev => [...prev, newUserMsg]);
    setUserInput('');

    setTimeout(() => {
      let botResponse = "C'est une excellente question ! Dans le cadre du programme Triple S, nous pouvons utiliser l'IA pour générer votre Lean Canvas ou vous mettre en relation avec un mentor marocain expert.";
      if (userInput.toLowerCase().includes('canvas') || userInput.toLowerCase().includes('lean')) {
        botResponse = "Le Lean Canvas est essentiel. Dans le plan Standard, notre assistant IA vous pose des questions guidées et remplit automatiquement vos segments de clientèle, canaux et flux de revenus !";
      } else if (userInput.toLowerCase().includes('financement') || userInput.toLowerCase().includes('forsa')) {
        botResponse = "Nous accompagnons nos membres Premium dans la préparation des dossiers pour Forsa, Tamwilcom et les banques partenaires.";
      }
      setChatMessages(prev => [...prev, { id: Date.now() + 1, sender: 'sami', text: botResponse }]);
    }, 1000);
  };
  const handleSubmit = async (e) => {
  e.preventDefault();

  // Determine dynamic target paths and data structure objects
  const targetUrl = isLoginMode 
    ? "http://localhost:8080/api/users/login" 
    : "http://localhost:8080/api/users/register";

  const payload = isLoginMode 
    ? { email: formData.email, password: formData.password }
    : { ...formData, selectedTier }; // Includes registration tier if registering

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      alert(errorMsg || "Erreur de validation des identifiants.");
      return;
    }

    const userData = await response.json();
    
    // Save authentication details to localStorage session memory
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Trigger successful success UI banner
    setRegisterSuccess(true);
    
    // Close modal window cleanly after a brief moment
  // Close modal window cleanly after a brief moment
    setTimeout(() => {
      setIsModalOpen(false);
      setRegisterSuccess(false);
    // This triggers the state change in App.jsx to immediately show the Dashboard
      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
      
      console.log("Connecté en tant que: ", userData);
    }, 5000);

  } catch (error) {
    console.error("Erreur serveur custom handle:", error);
    alert("Impossible de joindre l'API d'authentification.");
  }
};

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-black text-white">
      
      {/* ─── NAVBAR / HEADER ─── */}
      <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-brand-black/90 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-darkGray border border-brand-gold/30 flex items-center justify-center">
              <i className="fa-solid fa-cubes text-brand-gold text-lg"></i>
            </div>
            <div>
              <span className="font-bold tracking-wider text-xl text-white">TRIPLE <span className="text-brand-lightGold">S</span></span>
              <span className="block text-[9px] text-brand-gold uppercase tracking-widest font-semibold">De l'idée à l'action</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#problem" className="hover:text-brand-gold transition-colors">Le Problème</a>
            <a href="#solutions" className="hover:text-brand-gold transition-colors">Solution</a>
            <a href="#testimonials" className="hover:text-brand-gold transition-colors">Témoignages</a>
            <a href="#pricing" className="hover:text-brand-gold transition-colors">Tarifs</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-brand-lightGold">
              <i className="fa-solid fa-sun"></i>
            </button>
            <button 
              onClick={() => { setSelectedTier('Gratuit'); setIsModalOpen(true); }}
              className="bg-brand-lightGold hover:bg-brand-hoverGold text-brand-black font-semibold px-5 py-2.5 rounded-lg transition-all text-sm shadow-md shadow-brand-gold/10"
            >
              Rejoindre
            </button>
            <button 
             onClick={() => {
             setIsLoginMode(true); // Ensure it opens in Login mode
             setIsModalOpen(true);
             }}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 hover:border-white/40 transition-all text-sm"
              >
              Se connecter
            </button>
            <button
  type="button"
  onClick={() => setIsExpertModalOpen(true)}
  className="w-full sm:w-auto px-5 py-2.5 bg-gold-100 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all text-sm shadow-md shadow-purple-500/10"
>
  Join us as expert
</button>
          </div>
        </div>
      </header>

      {/* ─── MAIN LANDING CONTENT ─── */}
      <main className="flex-grow">
        
        {/* HERO SECTION */}
        <section className="spotlight-bg pt-20 pb-28 px-6 text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <div className="bg-brand-darkGray/80 border border-brand-gold/20 p-4 rounded-xl mb-8 flex flex-col items-center gap-1 shadow-2xl backdrop-blur-md">
              <i className="fa-solid fa-circle-nodes text-brand-gold text-3xl animate-pulse"></i>
              <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">TRIPLES</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight mb-4">
              TRIPLE <span className="text-brand-lightGold font-serif italic">S</span>
            </h1>
            
            <p className="text-2xl md:text-3xl font-serif italic text-brand-lightGold tracking-wide mb-6">
              De l'idée à l'action
            </p>

            <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
              Transformez votre idée en projet concret grâce à l'intelligence artificielle et à l'accompagnement d'experts.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => { setSelectedTier('Gratuit'); setIsModalOpen(true); }}
                className="w-full sm:w-auto bg-brand-lightGold hover:bg-brand-hoverGold text-brand-black font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-3 text-base"
              >
                <i className="fa-solid fa-hand-pointer text-sm"></i>
                Commencer gratuitement
              </button>
              <a href="#solutions" className="w-full sm:w-auto border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-semibold px-8 py-4 rounded-xl transition-all text-base text-center">
                Découvrir
              </a>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section id="problem" className="py-24 px-6 bg-brand-black">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-left">
              <span className="text-xs font-bold text-brand-gold tracking-widest uppercase block mb-3">Le Problème</span>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
                Vous avez une <span className="text-brand-lightGold font-serif italic">idée</span>, mais...
              </h2>
              <p className="text-gray-400 text-base md:text-lg max-w-2xl">TRIPLE S vous guide à chaque étape.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-8 transition-all duration-300 hover:border-white/10">
                <div className="text-2xl mb-6"><i className="fa-solid fa-compass text-amber-500"></i></div>
                <h3 className="text-xl font-bold text-white mb-3 font-serif">Vous ne savez pas par où commencer ?</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Trop d'informations, aucune feuille de route claire.</p>
              </div>

              <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-8 transition-all duration-300 hover:border-white/10">
                <div className="text-2xl mb-6"><i className="fa-solid fa-money-bill-trend-up text-emerald-400"></i></div>
                <h3 className="text-xl font-bold text-white mb-3 font-serif">Vous cherchez un financement ?</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Forsa, Tamwilcom, banques — un labyrinthe sans guide.</p>
              </div>

              <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-8 transition-all duration-300 hover:border-white/10">
                <div className="text-2xl mb-6"><i className="fa-solid fa-handshake text-purple-400"></i></div>
                <h3 className="text-xl font-bold text-white mb-3 font-serif">Vous manquez d'accompagnement ?</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Personne pour vous épauler dans les moments clés.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS / SOLUTIONS SECTION */}
        <section id="solutions" className="py-24 px-6 bg-brand-black border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Tout ce qu'il vous faut, <span className="text-brand-lightGold font-serif italic border-b border-brand-gold/30 pb-1">au même endroit</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 01 */}
              <div className="bg-brand-darkGray border border-white/5 hover:border-brand-gold/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                      <i className="fa-solid fa-robot text-xl"></i>
                    </div>
                    <span className="text-xs font-bold text-[#2563EB] tracking-wider">01</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-lightGold transition-colors">Assistant IA</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Réponses instantanées et recommandations personnalisées pour avancer sans perdre de temps.</p>
                </div>
                <ul className="space-y-2 border-t border-white/5 pt-4">
                  <li className="flex items-center gap-2 text-xs text-brand-lightGold"><i className="fa-solid fa-circle text-[6px]"></i> Réponses instantanées</li>
                  <li className="flex items-center gap-2 text-xs text-brand-lightGold"><i className="fa-solid fa-circle text-[6px]"></i> Recommandations</li>
                </ul>
              </div>

              {/* Card 02 */}
              <div className="bg-brand-darkGray border border-white/5 hover:border-brand-gold/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <i className="fa-solid fa-user-tie text-xl"></i>
                    </div>
                    <span className="text-xs font-bold text-purple-400 tracking-wider">02</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-lightGold transition-colors">Experts & mentors</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Mentorat et conseils pratiques par des entrepreneurs et experts du terrain marocain.</p>
                </div>
                <ul className="space-y-2 border-t border-white/5 pt-4">
                  <li className="flex items-center gap-2 text-xs text-brand-lightGold"><i className="fa-solid fa-circle text-[6px]"></i> Mentorat direct</li>
                </ul>
              </div>

              {/* Card 03 */}
              <div className="bg-brand-darkGray border border-white/5 hover:border-brand-gold/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <i className="fa-solid fa-chart-line text-xl"></i>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 tracking-wider">03</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-lightGold transition-colors">Tableau de bord</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Suivez vos objectifs et la progression de votre projet en temps réel grâce à une roadmap claire.</p>
                </div>
                <ul className="space-y-2 border-t border-white/5 pt-4">
                  <li className="flex items-center gap-2 text-xs text-brand-lightGold"><i className="fa-solid fa-circle text-[6px]"></i> Suivi des objectifs</li>
                </ul>
              </div>

              {/* Card 04 */}
              <div className="bg-brand-darkGray border border-white/5 hover:border-brand-gold/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <i className="fa-solid fa-sack-dollar text-xl"></i>
                    </div>
                    <span className="text-xs font-bold text-amber-400 tracking-wider">04</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-lightGold transition-colors">Financement</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Orientation vers les bons programmes marocains : Forsa, Tamwilcom, banques et VCs.</p>
                </div>
                <ul className="space-y-2 border-t border-white/5 pt-4">
                  <li className="flex items-center gap-2 text-xs text-brand-lightGold"><i className="fa-solid fa-circle text-[6px]"></i> Forsa & Tamwilcom</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="py-24 px-6 bg-brand-black border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-brand-gold tracking-widest uppercase block mb-3">Témoignages</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Ils ont franchi le <span className="text-brand-lightGold font-serif italic">cap</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:border-brand-gold/20">
                <div>
                  <div className="flex gap-1 text-brand-gold text-xs mb-6">
                    {[...Array(5)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-8 italic">
                    "TRIPLE S m'a permis de structurer mon projet et de décrocher un financement Forsa en moins de 2 mois."
                  </p>
                </div>
                <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                  <div className="w-10 h-10 rounded-full bg-brand-lightGold text-brand-black font-bold flex items-center justify-center text-xs shrink-0">YL</div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Yassine L.</h4>
                    <p className="text-gray-500 text-xs">Fondateur, AgriTech Casa</p>
                  </div>
                </div>
              </div>

              <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:border-brand-gold/20">
                <div>
                  <div className="flex gap-1 text-brand-gold text-xs mb-6">
                    {[...Array(5)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-8 italic">
                    "L'assistant IA répond à mes questions à toute heure, et le mentor m'a aidée à éviter de gros pièges."
                  </p>
                </div>
                <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                  <div className="w-10 h-10 rounded-full bg-brand-lightGold text-brand-black font-bold flex items-center justify-center text-xs shrink-0">KA</div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Khadija A.</h4>
                    <p className="text-gray-500 text-xs">Porteuse de projet, Rabat</p>
                  </div>
                </div>
              </div>

              <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:border-brand-gold/20">
                <div>
                  <div className="flex gap-1 text-brand-gold text-xs mb-6">
                    {[...Array(5)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-8 italic">
                    "Enfin une plateforme marocaine qui comprend nos réalités. Je recommande à 100%."
                  </p>
                </div>
                <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                  <div className="w-10 h-10 rounded-full bg-brand-lightGold text-brand-black font-bold flex items-center justify-center text-xs shrink-0">MR</div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Mehdi R.</h4>
                    <p className="text-gray-500 text-xs">E-commerce, Tanger</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 px-6 bg-brand-black relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Choisissez votre <span className="text-brand-lightGold font-serif italic">formule</span>
              </h2>
              <div className="flex items-center justify-center gap-4 mt-8">
                <span className={`text-sm ${!isAnnual ? 'text-brand-lightGold font-bold' : 'text-gray-400'}`}>Mensuel</span>
                <button type="button" onClick={() => setIsAnnual(!isAnnual)} className="w-12 h-6 rounded-full bg-brand-darkGray border border-brand-gold/30 p-1 flex items-center transition-all">
                  <div className={`w-4 h-4 rounded-full bg-brand-gold transition-all ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
                <span className={`text-sm ${isAnnual ? 'text-brand-lightGold font-bold' : 'text-gray-400'}`}>Annuel <span className="bg-brand-gold/15 text-brand-lightGold text-[10px] font-bold px-2 py-0.5 rounded ml-1">-20%</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {/* Tier 1 */}
              <div className="bg-[#121212] border border-white/5 rounded-3xl p-8 flex flex-col justify-between hover:border-white/10 transition-all duration-300">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-serif">Gratuit</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">Accès limité pour découvrir la plateforme.</p>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl font-bold text-white font-serif">0</span>
                    <span className="text-gray-500 text-sm tracking-wide">MAD</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-sm text-gray-300">
                    <li className="flex items-start gap-3"><span className="text-gray-500 mt-0.5">✓</span><span>Contenu de base</span></li>
                    <li className="flex items-start gap-3"><span className="text-gray-500 mt-0.5">✓</span><span>Lean Canvas guidé</span></li>
                    <li className="flex items-start gap-3"><span className="text-gray-500 mt-0.5">✓</span><span>Communauté entrepreneurs</span></li>
                  </ul>
                </div>
                <button onClick={() => { setSelectedTier('Gratuit'); setIsModalOpen(true); }} className="w-full py-3.5 rounded-xl bg-white text-brand-black font-semibold hover:bg-gray-200 transition-all text-sm mt-auto">
                  Commencer gratuitement
                </button>
              </div>

              {/* Tier 2 */}
              <div className="bg-[#121212] border border-white/5 rounded-3xl p-8 flex flex-col justify-between hover:border-white/10 transition-all duration-300">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-serif">Standard</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">Contenu et outils pour avancer sereinement.</p>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl font-bold text-white font-serif">{isAnnual ? '120' : '150'}</span>
                    <span className="text-gray-500 text-sm tracking-wide">MAD/mois</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-sm text-gray-300">
                    <li className="flex items-start gap-3"><span className="text-gray-500 mt-0.5">✓</span><span>Tout du gratuit</span></li>
                    <li className="flex items-start gap-3"><span className="text-gray-500 mt-0.5">✓</span><span>Contenu digital complet</span></li>
                    <li className="flex items-start gap-3"><span className="text-gray-500 mt-0.5">✓</span><span>Outils & templates</span></li>
                    <li className="flex items-start gap-3"><span className="text-gray-500 mt-0.5">✓</span><span>Tableau de bord projet</span></li>
                  </ul>
                </div>
                <button onClick={() => { setSelectedTier('Standard'); setIsModalOpen(true); }} className="w-full py-3.5 rounded-xl bg-white text-brand-black font-semibold hover:bg-gray-200 transition-all text-sm mt-auto">
                  Choisir Standard
                </button>
              </div>

              {/* Tier 3 */}
              <div className="bg-[#121212] border border-brand-gold rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-brand-gold/5 relative pt-12 transition-all duration-300">
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-brand-gold text-brand-black font-semibold text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-md">
                  <i className="fa-regular fa-star text-[11px]"></i><span>Le plus populaire</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-serif">Premium</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">IA + mentorat + consulting expert.</p>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl font-bold text-white font-serif">{isAnnual ? '240' : '300'}</span>
                    <span className="text-gray-500 text-sm tracking-wide">MAD/mois</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-sm text-gray-300">
                    <li className="flex items-start gap-3"><span className="w-5 h-5 rounded-full bg-brand-gold/20 text-brand-lightGold flex items-center justify-center text-[10px] mt-0.5 shrink-0"><i className="fa-solid fa-check"></i></span><span>Tout de Standard</span></li>
                    <li className="flex items-start gap-3"><span className="w-5 h-5 rounded-full bg-brand-gold/20 text-brand-lightGold flex items-center justify-center text-[10px] mt-0.5 shrink-0"><i className="fa-solid fa-check"></i></span><span>Assistant IA illimité</span></li>
                    <li className="flex items-start gap-3"><span className="w-5 h-5 rounded-full bg-brand-gold/20 text-brand-lightGold flex items-center justify-center text-[10px] mt-0.5 shrink-0"><i className="fa-solid fa-check"></i></span><span>Mentorat experts</span></li>
                    <li className="flex items-start gap-3"><span className="w-5 h-5 rounded-full bg-brand-gold/20 text-brand-lightGold flex items-center justify-center text-[10px] mt-0.5 shrink-0"><i className="fa-solid fa-check"></i></span><span>Consulting personnalisé</span></li>
                    <li className="flex items-start gap-3"><span className="w-5 h-5 rounded-full bg-brand-gold/20 text-brand-lightGold flex items-center justify-center text-[10px] mt-0.5 shrink-0"><i className="fa-solid fa-check"></i></span><span>Dossier financement</span></li>
                  </ul>
                </div>
                <button onClick={() => { setSelectedTier('Premium'); setIsModalOpen(true); }} className="w-full py-3.5 rounded-xl bg-brand-gold text-brand-black font-bold hover:bg-brand-hoverGold transition-all text-sm mt-auto shadow-lg shadow-brand-gold/10">
                  Choisir Premium
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FLOATING CHAT ASSISTANT WIDGET ─── */}
      <div className="fixed bottom-6 right-6 z-50">
        {isChatOpen ? (
          <div className="w-96 max-w-[calc(100vw-32px)] h-[500px] bg-brand-darkGray border border-brand-gold/30 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="bg-brand-black border-b border-white/5 p-4 flex items-center justify-between">
              <span className="font-bold text-sm text-white">Sami - Assistant IA</span>
              <button type="button" onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${msg.sender === 'user' ? 'bg-brand-gold text-brand-black font-semibold' : 'bg-brand-black text-gray-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-brand-black border-t border-white/5 flex gap-2">
              <input 
                type="text" 
                placeholder="Posez votre question à Sami..." 
                className="flex-grow bg-brand-darkGray border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-gold/50"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
              />
              <button type="submit" className="w-10 h-10 rounded-xl bg-brand-lightGold text-brand-black flex items-center justify-center hover:bg-brand-hoverGold transition-all">
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>
            </form>
          </div>
        ) : (
          <button type="button" onClick={() => setIsChatOpen(true)} className="w-14 h-14 rounded-full bg-brand-lightGold text-brand-black shadow-xl flex items-center justify-center hover:scale-105 transition-all text-xl">
            <i className="fa-solid fa-comment-dots"></i>
          </button>
        )}
      </div>

      {/* ─── DYNAMIC REGISTRATION MODAL ─── */}
{/* ─── DYNAMIC AUTH MODAL (REGISTRATION & LOGIN) ─── */}
{isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
    <div className="bg-brand-darkGray border border-brand-gold/30 rounded-3xl w-full max-w-md p-8 relative z-10">
      <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
        <i className="fa-solid fa-xmark"></i>
      </button>
      
      {registerSuccess ? (
        <div className="text-center py-8">
          <i className="fa-solid fa-circle-check text-brand-gold text-5xl mb-4"></i>
          <h3 className="text-2xl font-bold text-white">
            {isLoginMode ? "Connexion Réussie !" : "Demande Enregistrée !"}
          </h3>
          <p className="text-gray-400 text-sm mt-2">
            {isLoginMode ? "Bienvenue dans votre espace de travail, log in second.." : "Vous etes inscrit ,log in seconde..."}
          </p>
        </div>
      ) : (
        <div>
          {/* Dynamic Header Title */}
          <h3 className="text-2xl font-bold text-white mb-6">
            {isLoginMode ? "Connexion à votre espace" : `Rejoindre Triple S (${selectedTier})`}
          </h3>

          {/* Switch handling function to unified handleSubmit */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 👤 HIDE NAME IF IN LOGIN MODE */}
            {!isLoginMode && (
              <input 
                type="text" required placeholder="Nom complet" 
                className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold/50" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            )}

            {/* 📧 ALWAYS SHOW EMAIL */}
            <input 
              type="email" required placeholder="Email" 
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold/50" 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
            />

            {/* 🔒 ALWAYS SHOW PASSWORD */}
            <input 
              type="password" required placeholder="Mot de passe" 
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold/50" 
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
            />

            {/* 💡 HIDE PROJECT IDEA IF IN LOGIN MODE */}
            {!isLoginMode && (
              <textarea 
                rows="3" placeholder="Votre idée de projet..." 
                className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold/50" 
                value={formData.idea} onChange={e => setFormData({...formData, idea: e.target.value})}
              ></textarea>
            )}

            {/* Dynamic Button Action Text */}
            <button type="submit" className="w-full py-3.5 bg-brand-lightGold text-brand-black rounded-xl font-bold hover:bg-brand-hoverGold transition-all text-sm">
              {isLoginMode ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          {/* 🔄 BOTTOM ACCESSIBILITY TOGGLE LINK */}
          <p className="text-xs text-center text-gray-400 mt-5">
            {isLoginMode ? "Nouveau sur Triple S ?" : "Vous avez déjà un compte ?"}
            <button 
              type="button" 
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-brand-lightGold font-semibold ml-1 hover:underline focus:outline-none"
            >
              {isLoginMode ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
        </div>
      )}
    </div>
  </div>
)}
{/* ─── EXPERT / MENTOR REGISTRATION MODAL ─── */}
{isExpertModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div 
      className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm" 
      onClick={() => setIsExpertModalOpen(false)}
    ></div>

    <div className="bg-brand-darkGray border border-purple-500/30 rounded-3xl w-full max-w-2xl p-8 relative z-10 max-h-[90vh] overflow-y-auto">
      <button 
        type="button" 
        onClick={() => setIsExpertModalOpen(false)} 
        className="absolute top-4 right-4 text-gray-400 hover:text-white"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>

      {expertRegisterSuccess ? (
        <div className="text-center py-8">
          <i className="fa-solid fa-circle-check text-purple-400 text-5xl mb-4"></i>
          <h3 className="text-2xl font-bold text-white">
            Expert profile created!
          </h3>
          <p className="text-gray-400 text-sm mt-2">
            Your mentor account has been created successfully.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <span className="text-xs text-purple-400 font-bold uppercase tracking-widest">
              Expert Application
            </span>
            <h3 className="text-2xl font-bold text-white mt-2">
              Join Triple S as an expert mentor
            </h3>
            <p className="text-gray-400 text-sm mt-2">
              Create your mentor profile and help Moroccan entrepreneurs structure and grow their projects.
            </p>
          </div>

          <form onSubmit={handleMentorSubmit} className="space-y-4">
            <input
              type="text"
              required
              placeholder="Full name"
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
              value={mentorFormData.name}
              onChange={(e) => setMentorFormData({ ...mentorFormData, name: e.target.value })}
            />

            <input
              type="email"
              required
              placeholder="Email"
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
              value={mentorFormData.email}
              onChange={(e) => setMentorFormData({ ...mentorFormData, email: e.target.value })}
            />

            <input
              type="password"
              required
              placeholder="Password"
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
              value={mentorFormData.password}
              onChange={(e) => setMentorFormData({ ...mentorFormData, password: e.target.value })}
            />

            <input
              type="text"
              required
              placeholder="Professional title, e.g. Startup Mentor, Finance Expert..."
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
              value={mentorFormData.title}
              onChange={(e) => setMentorFormData({ ...mentorFormData, title: e.target.value })}
            />

            <input
              type="text"
              required
              placeholder="Expertise, e.g. Funding, Growth, Pitch Deck, Legal..."
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
              value={mentorFormData.expertise}
              onChange={(e) => setMentorFormData({ ...mentorFormData, expertise: e.target.value })}
            />

            <textarea
              rows="4"
              required
              placeholder="Short bio"
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
              value={mentorFormData.bio}
              onChange={(e) => setMentorFormData({ ...mentorFormData, bio: e.target.value })}
            ></textarea>

            <input
              type="url"
              placeholder="LinkedIn URL"
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
              value={mentorFormData.linkedinUrl}
              onChange={(e) => setMentorFormData({ ...mentorFormData, linkedinUrl: e.target.value })}
            />

            <input
              type="url"
              placeholder="Profile image URL optional"
              className="w-full bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
              value={mentorFormData.imageUrl}
              onChange={(e) => setMentorFormData({ ...mentorFormData, imageUrl: e.target.value })}
            />

            <button
              type="submit"
              className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 transition-all text-sm"
            >
              Create expert account
            </button>
          </form>
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
}