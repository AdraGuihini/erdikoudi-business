import React, { useState, useEffect, useMemo } from 'react'; // Ajout de useMemo
import { inject } from '@vercel/analytics';

// Activation des statistiques Vercel
inject();

export default function App() {
  // --- ÉTATS (STATES) ---
  const [currentPage, setCurrentPage] = useState('home');
  const [avis, setAvis] = useState([]); 
  const [form, setForm] = useState({ nom: '', msg: '', stars: '⭐⭐⭐⭐⭐' });

  // --- CONFIGURATION DU SERVEUR LOCAL (WAMP) ---
  const API_URL = "http://localhost/api.php";

  // --- LOGIQUE DE RÉCUPÉRATION DES DONNÉES ---
  useEffect(() => {
    chargerCommentaires();
  }, []);

  const chargerCommentaires = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setAvis(data))
      .catch(err => console.error("Erreur de liaison MySQL :", err));
  };

  // --- LOGIQUE D'ENVOI DES DONNÉES ---
  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom,
          message: form.msg,
          etoiles: form.stars
        })
      });

      if (response.ok) {
        setForm({ nom: '', msg: '', stars: '⭐⭐⭐⭐⭐' });
        chargerCommentaires();
        alert("Succès : Votre avis est enregistré dans MySQL !");
      }
    } catch (error) {
      alert("Erreur : Impossible de contacter l'API PHP.");
    }
  };

  // --- COMPOSANT : PAGE DES COMMENTAIRES (CORRIGÉ AVEC USEMEMO) ---
  // On mémorise le composant pour éviter la perte de focus lors de l'écriture
  const CommentsPage = useMemo(() => (
    <div className="min-h-screen bg-slate-50 py-20 px-8 md:px-20">
      <button 
        onClick={() => setCurrentPage('home')} 
        className="mb-10 text-[#002B49] font-black uppercase tracking-widest flex items-center gap-2 hover:text-[#D4AF37] transition-colors"
      >
        ← Retour à l'accueil
      </button>
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#D4AF37] font-bold tracking-[0.3em] text-xs uppercase">Espace Communautaire</span>
          <h2 className="text-[#002B49] text-5xl font-black uppercase italic">Avis & Témoignages</h2>
          <p className="text-slate-500">Ces commentaires proviennent directement de votre base de données MySQL.</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl mb-20 border border-slate-200">
          <h3 className="text-[#002B49] text-xl font-black uppercase mb-8 border-b pb-4">Laisser un avis public</h3>
          <form onSubmit={handlePublish} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                value={form.nom}
                onChange={(e) => setForm({...form, nom: e.target.value})}
                type="text" placeholder="Votre Nom" required
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37] transition-all" 
              />
              <select 
                value={form.stars}
                onChange={(e) => setForm({...form, stars: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]"
              >
                <option value="⭐⭐⭐⭐⭐">5 Étoiles ⭐⭐⭐⭐⭐</option>
                <option value="⭐⭐⭐⭐">4 Étoiles ⭐⭐⭐⭐</option>
                <option value="⭐⭐⭐">3 Étoiles ⭐⭐⭐</option>
              </select>
            </div>
            <textarea 
              value={form.msg}
              onChange={(e) => setForm({...form, msg: e.target.value})}
              placeholder="Racontez votre expérience avec Erdikoudi Business..." required rows="4"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]"
            ></textarea>
            <button type="submit" className="w-full bg-[#002B49] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-[#D4AF37] hover:text-[#002B49] transition-all shadow-lg">
              Publier le commentaire
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <h3 className="text-[#002B49] font-black uppercase tracking-widest text-sm italic">Derniers messages ({avis.length})</h3>
          {avis.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-400 italic">La base de données est vide. Soyez le premier à commenter !</p>
            </div>
          ) : (
            avis.map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border-l-8 border-[#D4AF37] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-black text-[#002B49] uppercase tracking-tighter">{item.nom}</span>
                  <span className="text-[#D4AF37] text-xs font-bold">{item.etoiles}</span>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed italic">"{item.message}"</p>
                <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  Publié le : {new Date(item.date_publication).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ), [form, avis]); // Seul changement : ces deux lignes gèrent la stabilité du focus

  // --- LOGIQUE D'AFFICHAGE CONDITIONNEL ---
  if (currentPage === 'commentaires') return CommentsPage;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#D4AF37]/30">
      
      {/* 1. NAVIGATION PRO */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-8 md:px-20 py-6 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center gap-4">
          <img src="/logo.jfif" alt="Logo" className="h-14 w-auto drop-shadow-sm" />
          <div className="leading-none">
            <h1 className="text-xl font-black text-[#002B49] tracking-tighter uppercase">Erdikoudi-Business</h1>
            <p className="text-[10px] font-bold text-[#D4AF37] tracking-[0.4em] uppercase">Expertise Tech</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
          <a href="#services" className="hover:text-[#004A7C] transition-colors duration-300">Services</a>
          <a href="#apropos" className="hover:text-[#004A7C] transition-colors duration-300">À Propos</a>
          <button 
            onClick={() => setCurrentPage('commentaires')} 
            className="hover:text-[#004A7C] transition-colors duration-300 uppercase"
          >
            Avis Clients
          </button>
          <button 
            onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
            className="bg-[#002B49] text-white px-6 py-2 rounded font-black hover:bg-[#004A7C] transition-all"
          >
            GET A QUOTE
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-8 md:px-20 py-24 lg:py-40 flex flex-col lg:flex-row items-center gap-20">
        <div className="lg:w-3/5 space-y-10">
          <div className="space-y-4">
            <span className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase">Transformation Numérique</span>
            <h2 className="text-5xl md:text-7xl font-black text-[#002B49] leading-[1.05] uppercase italic">
              Erdikoudi - Business : <br />
              <span className="text-[#004A7C] not-italic">Innover vos solutions</span>
            </h2>
          </div>
          <p className="text-slate-500 text-lg md:text-xl leading-relaxed max-w-2xl border-l-4 border-[#D4AF37] pl-6">
            Consultation experte et solutions adaptées à tous vos défis technologiques. 
            Basé à N'Djamena, nous pilotons votre succès numérique global.
          </p>
          <div className="flex flex-wrap gap-6">
            <button 
              onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#002B49] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#004A7C] transition-all shadow-xl"
            >
              DEMARRER UN PROJET
            </button>
            <button 
              onClick={() => setCurrentPage('commentaires')} 
              className="group flex items-center gap-3 text-[#002B49] font-black tracking-widest text-sm uppercase"
            >
              Voir les avis publics
              <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
            </button>
          </div>
        </div>
        <div className="lg:w-2/5 relative">
          <div className="absolute -inset-10 bg-[#D4AF37]/10 rounded-full blur-3xl -z-10"></div>
          <img src="/tech-innovations.png" alt="Innovation" className="w-full h-auto drop-shadow-2xl rounded-2xl" />
        </div>
      </section>

      {/* 3. SECTION SERVICES */}
      <section id="services" className="bg-[#001D2F] py-32 px-8 md:px-20 rounded-[3rem_3rem_0_0]">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase mb-20 underline decoration-2 underline-offset-8">Nos Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Informatique & IT", icon: "💻", desc: "Expertise complète en maintenance et infrastructure réseau." },
              { title: "Trading & Crypto", icon: "📈", desc: "Analyses techniques précises (Binance Spot & Futures)." },
              { title: "Solutions Starlink", icon: "🛰️", desc: "Installation et configuration de kits satellite haut débit." },
              { title: "Développement IA", icon: "🤖", desc: "Création de prompts et guides pour optimiser votre business." },
              { title: "Agropastoral", icon: "🌱", desc: "Accompagnement dans les projets agricoles à haut rendement." }
            ].map((s, i) => (
              <div key={i} className="group relative bg-[#002B49]/50 p-10 rounded-3xl border border-white/5 hover:border-[#D4AF37]/50 transition-all duration-500">
                <div className="text-5xl mb-8 group-hover:scale-110 transition-transform">{s.icon}</div>
                <h4 className="text-white text-lg font-black uppercase mb-4 tracking-tight">{s.title}</h4>
                <p className="text-blue-100/40 text-sm leading-relaxed mb-8">{s.desc}</p>
                <button className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">En savoir plus →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SECTION À PROPOS */}
      <section id="apropos" className="py-24 px-8 md:px-20 bg-white">
        <div className="max-w-7xl mx-auto border-l-8 border-[#002B49] pl-10">
          <h3 className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase mb-6">À Propos</h3>
          <p className="text-[#002B49] text-2xl md:text-4xl font-black uppercase leading-tight max-w-4xl">
            Erdikoudi Business est le moteur de votre innovation au Tchad. Nous combinons expertise informatique et vision stratégique.
          </p>
        </div>
      </section>

      {/* 5. CHIFFRES CLÉS */}
      <div className="bg-[#D4AF37] py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-around gap-10">
          {[{ n: "100%", t: "Satisfaction" }, { n: "N'Djamena", t: "Siège Social" }, { n: "24/7", t: "Support" }].map((c, i) => (
            <div key={i} className="text-center text-[#002B49]">
              <div className="text-3xl font-black">{c.n}</div>
              <div className="text-[10px] font-black uppercase tracking-widest">{c.t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. SECTION CONTACT */}
      <section id="contact" className="py-24 px-8 md:px-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
          <div className="lg:w-1/2 space-y-10">
            <h3 className="text-[#002B49] text-4xl font-black uppercase">Prêt à collaborer ?</h3>
            <div className="space-y-6">
              <p className="font-bold text-[#002B49]">📍 Avenue Hassan Djamous, N'Djamena</p>
              <p className="font-bold text-[#002B49]">📧 abdramanguihini6@gmail.com</p>
            </div>
          </div>
          <div className="lg:w-1/2 bg-[#F8FAFC] p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl">
            <form action="https://formspree.io/f/xaqaqgzl" method="POST" className="space-y-6">
              <input name="name" type="text" required placeholder="Nom Complet" className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-[#D4AF37]" />
              <input name="email" type="email" required placeholder="Email" className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-[#D4AF37]" />
              <textarea name="message" required placeholder="Décrivez votre besoin technologique..." rows="5" className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-[#D4AF37]"></textarea>
              <button type="submit" className="w-full bg-[#002B49] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#004A7C] transition-all">Envoyer le message</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}