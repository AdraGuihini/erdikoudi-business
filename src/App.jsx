export default function App() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#D4AF37]/30">
      
      {/* 1. NAVIGATION PRO (Alignement et Équilibre) */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-8 md:px-20 py-6 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center gap-4">
          <img src="/logo.jfif" alt="Logo" className="h-14 w-auto drop-shadow-sm" />
          <div className="leading-none">
            <h1 className="text-xl font-black text-[#002B49] tracking-tighter uppercase">Erdikoudi-Business</h1>
            <p className="text-[10px] font-bold text-[#D4AF37] tracking-[0.4em] uppercase">Expertise Tech</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
          {["Services", "À Propos", "Portfolio", "Contact"].map((item) => (
            <a key={item} href="#" className="hover:text-[#004A7C] transition-colors duration-300">{item}</a>
          ))}
          <button 
  onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
  className="bg-[#002B49] text-white px-6 py-2 rounded font-black hover:bg-[#004A7C] transition-all"
>
  GET A QUOTE
</button>
        </div>
      </nav>

      {/* 2. HERO SECTION (Hiérarchie et Respiration) */}
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
            De l’IA à la cybersécurité, nous pilotons votre succès futur.
          </p>

          <div className="flex flex-wrap gap-6">
            <button 
  onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
  className="bg-[#002B49] text-white px-6 py-2 rounded font-black hover:bg-[#004A7C] transition-all"
>
  DEMARRER UN PROJET
</button>
            <button className="group flex items-center gap-3 text-[#002B49] font-black tracking-widest text-sm uppercase">
              Nos Réalisations
              <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
            </button>
          </div>
        </div>

        {/* IMAGE HD FIXE (Alignement Droite) */}
        <div className="lg:w-2/5 relative">
          <div className="absolute -inset-10 bg-gradient-to-tr from-[#004A7C]/10 to-transparent rounded-full blur-3xl -z-10"></div>
          <img 
            src="/tech-innovations.png" 
            alt="Innovation" 
            className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl"
          />
        </div>
      </section>

      {/* 3. SECTION SERVICES (Look Cyber Premium) */}
      <section className="bg-[#001D2F] py-32 px-8 md:px-20 rounded-[3rem_3rem_0_0]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
              <h3 className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase underline decoration-2 underline-offset-8">Nos Services</h3>
              <p className="text-3xl md:text-4xl text-white font-black uppercase">Expertise technologique pointue</p>
            </div>
            <button className="text-white/50 hover:text-[#D4AF37] text-xs font-bold tracking-widest transition-colors">VOIR TOUT →</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Conseil Technologique", icon: "💼", desc: "Stratégies sur mesure pour votre croissance numérique." },
              { title: "Développement Logiciel", icon: "⌨️", desc: "Applications robustes et évolutives pour vos besoins métiers." },
              { title: "Cloud Solutions", icon: "☁️", desc: "Migration et gestion d'infrastructure cloud sécurisée." },
              { title: "Cybersécurité", icon: "🛡️", desc: "Protection avancée de vos données et de vos réseaux." }
            ].map((s, i) => (
              <div key={i} className="group relative bg-[#002B49]/50 p-10 rounded-3xl border border-white/5 hover:border-[#D4AF37]/50 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-0 bg-[#D4AF37] group-hover:h-full transition-all duration-500"></div>
                <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-500">{s.icon}</div>
                <h4 className="text-white text-lg font-black uppercase mb-4 tracking-tight">{s.title}</h4>
                <p className="text-blue-100/40 text-sm leading-relaxed mb-8">{s.desc}</p>
                <button className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  En savoir plus →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CHIFFRES CLÉS (Social Proof) */}
      <div className="bg-[#D4AF37] py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-around gap-10">
          {[
            { n: "50+", t: "Projets Réalisés" },
            { n: "24/7", t: "Support Technique" },
            { n: "100%", t: "Satisfaction Client" }
          ].map((c, i) => (
            <div key={i} className="text-center">
              <div className="text-[#002B49] text-3xl font-black">{c.n}</div>
              <div className="text-[#002B49]/70 text-[10px] font-black uppercase tracking-widest">{c.t}</div>
            </div>
          ))}
        </div>
      </div>
{/* SECTION CONTACT : Le moteur de votre acquisition client */}
<section id="contact" className="py-24 px-8 md:px-20 bg-white relative overflow-hidden">
  {/* Décoration subtile en arrière-plan */}
  <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10"></div>
  
  <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
    
    {/* BLOC INFOS : Rassurer le client */}
    <div className="lg:w-1/2 space-y-10">
      <div className="space-y-4">
        <span className="text-[#D4AF37] font-bold tracking-[0.3em] text-xs uppercase">Contactez-nous</span>
        <h3 className="text-[#002B49] text-4xl md:text-5xl font-black uppercase leading-tight">
          Prêt à lancer votre <br />
          <span className="text-[#004A7C]">prochaine innovation ?</span>
        </h3>
      </div>

      <p className="text-slate-500 text-lg leading-relaxed">
        Que vous soyez à N'Djamena ou ailleurs, notre expertise en IA et cybersécurité est à votre service. 
        Remplissez le formulaire, nous vous répondons sous 24h.
      </p>
      
      {/* Détails de contact visuels */}
      <div className="space-y-6 pt-6">
        <div className="flex items-center gap-5 group">
          <div className="bg-[#002B49] p-4 rounded-2xl text-[#D4AF37] group-hover:scale-110 transition-transform">
            <span className="text-xl">📍</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Siège Social</p>
            <p className="font-bold text-[#002B49]">N'Djamena, Tchad</p>
          </div>
        </div>

        <div className="flex items-center gap-5 group">
          <div className="bg-[#002B49] p-4 rounded-2xl text-[#D4AF37] group-hover:scale-110 transition-transform">
            <span className="text-xl">📧</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Professionnel</p>
            <p className="font-bold text-[#002B49]">abdramanguihini6@gmail.com</p>
          </div>
        </div>
      </div>
    </div>

    {/* LE FORMULAIRE : Capture de prospects */}
    <div className="lg:w-1/2">
      <div className="bg-[#F8FAFC] p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl relative">
        {/* Badge "Expertise" */}
        <div className="absolute -top-4 -right-4 bg-[#D4AF37] text-[#002B49] text-[10px] font-bold px-4 py-2 rounded-full shadow-lg uppercase tracking-widest">
          Réponse Rapide
        </div>

        <form action="https://formspree.io/f/xaqaqgzl" method="POST" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Nom Complet</label>
              <input 
                name="name"
                type="text" 
                required
                placeholder="Ex: Hassan Soumaine" 
                className="w-full p-4 rounded-2xl border border-slate-200 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Email</label>
              <input 
                name="email"
                type="email" 
                required
                placeholder="votre@email.com" 
                className="w-full p-4 rounded-2xl border border-slate-200 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Votre Projet</label>
            <textarea 
              name="message"
              required
              placeholder="Décrivez brièvement vos besoins technologiques..." 
              rows="5" 
              className="w-full p-4 rounded-2xl border border-slate-200 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all"
            ></textarea>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#002B49] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#004A7C] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-[#002B49]/20"
          >
            Envoyer ma demande de devis
          </button>
        </form>
      </div>
    </div>

  </div>
</section>
    </div>
  );
}