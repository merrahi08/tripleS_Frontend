import React from 'react';

export default function Dashboard({ user, onLogout }) {
  // Sanitize the project idea string from any raw backend newlines
  const formattedIdea = user.projectIdea ? user.projectIdea.replace(/\\n/g, '').trim() : "Aucune description fournie.";

  return (
    <div className="min-h-screen bg-brand-black text-white p-8 w-full flex flex-col justify-between">
      <div>
        {/* ─── HEADER ─── */}
        <header className="flex justify-between items-center border-b border-white/5 pb-4 mb-8">
          <div>
            <span className="text-xs text-brand-gold font-bold uppercase tracking-widest">Tableau de bord</span>
            <h1 className="text-3xl font-bold font-serif">Bienvenue, {user.name} !</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-brand-gold/10 text-brand-lightGold border border-brand-gold/20 text-xs font-bold rounded-full uppercase tracking-wider">
              Plan {user.selectedTier}
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
          
          {/* LEFT/CENTER: Workspace & Tools (2 Columns wide on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Lean Canvas Tool (Core benefit for free plan) */}
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Votre Espace de Travail : Lean Canvas</h3>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Accès Libre</span>
              </div>
              <p className="text-gray-400 text-xs mb-4">Remplissez manuellement vos segments clés pour structurer votre business model.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                  <h4 className="text-xs font-bold text-brand-lightGold mb-2">🎯 1. Problème & Segments Cibles</h4>
                  <textarea placeholder="Qui sont vos clients ? Quels problèmes résolvez-vous ?" className="w-full h-24 bg-brand-darkGray/50 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-gold/40 text-gray-300 resize-none"></textarea>
                </div>
                <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                  <h4 className="text-xs font-bold text-brand-lightGold mb-2">💎 2. Proposition de Valeur</h4>
                  <textarea placeholder="Qu'est-ce qui rend votre startup unique ?" className="w-full h-24 bg-brand-darkGray/50 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-gold/40 text-gray-300 resize-none"></textarea>
                </div>
              </div>
              <button className="mt-4 px-4 py-2 bg-white text-brand-black font-bold text-xs rounded-lg hover:bg-gray-200 transition-all">
                Sauvegarder le Canvas
              </button>
            </div>

            {/* Free Academy / Guides */}
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">📚 Ressources & Guides Startup</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <a href="#guide1" className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-between transition-all">
                  <span>Comprendre les étapes du programme Forsa</span>
                  <i className="fa-solid fa-chevron-right text-brand-gold"></i>
                </a>
                <a href="#guide2" className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-between transition-all">
                  <span>Modèle de Pitch Deck pour amorçage</span>
                  <i className="fa-solid fa-chevron-right text-brand-gold"></i>
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR: Status & Quick Info (1 Column wide) */}
          <div className="space-y-6">
            
            {/* Project Idea summary */}
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Votre Idée de Projet</h3>
              <p className="text-gray-200 text-sm italic leading-relaxed">
                "{formattedIdea || "Aucune description fournie."}"
              </p>
            </div>

            {/* Incubation Status */}
            <div className="bg-brand-darkGray/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Statut Incubation</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Compte activé (Gratuit)</span>
                </div>
                
                <div className="border-t border-white/5 pt-3">
                  {user.selectedTier === 'PREMIUM' ? (
                    <p className="text-xs text-brand-lightGold font-semibold">✨ Accès aux Mentors Débloqué</p>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">🔒 Options Premium bloquées (Mentorat direct, IA automatique, Dossier Financement Tamwilcom)</p>
                      <button className="w-full py-2 bg-brand-gold text-brand-black text-xs font-bold rounded-lg hover:bg-brand-hoverGold transition-all">
                        Passer à Premium
                      </button>
                    </div>
                  )}
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