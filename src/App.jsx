
import React, { useState, useEffect } from 'react';
import { inject } from '@vercel/analytics';
import { supabase } from './supabase';
import Admin from './Admin';

inject();

const AD_CONFIG = {
  title: 'Votre entreprise peut apparaître ici',
  text: 'Promouvez votre activité auprès des visiteurs d’Erdikoudi-Business.',
  cta: 'Réserver cet espace',
  whatsapp: '23562201606'
};

function Publicite({ position = 'home-middle' }) {
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    const key = `erdikoudi_ad_impression_${position}`;
    const count = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(count + 1));
    setVisible(true);
  }, [position]);

  const handleClick = () => {
    const key = `erdikoudi_ad_click_${position}`;
    const count = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(count + 1));
  };

  if (!visible) return null;

  const message = encodeURIComponent(`Bonjour Erdikoudi Business,\n\nJe suis intéressé(e) par un espace publicitaire sur votre site.`);

  return (
    <section aria-label="Espace publicitaire" className="max-w-7xl mx-auto px-6 md:px-16 py-5">
      <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#001D2F] to-[#002B49] shadow-sm">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#D4AF37]/10" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-center md:text-left">
            <span className="inline-block text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.25em] mb-2">Publicité • Espace sponsorisé</span>
            <h3 className="text-xl md:text-2xl font-black text-white">{AD_CONFIG.title}</h3>
            <p className="text-white/65 text-sm mt-2 max-w-2xl">{AD_CONFIG.text}</p>
          </div>
          <a
            href={`https://wa.me/${AD_CONFIG.whatsapp}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="shrink-0 inline-flex items-center justify-center bg-[#D4AF37] text-[#002B49] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:scale-105 transition-transform"
          >
            📢 {AD_CONFIG.cta}
          </a>
        </div>
      </div>
    </section>
  );
}

const detectTechCategory = (article) => {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  if (/starlink|spacex|satellite|orbite|space|lunaire|direct.?to.?device/.test(text)) return '🛰️ Starlink & Satellites';
  if (/cyber|hack|ransom|malware|phishing|sécurité|security|attaque/.test(text)) return '🔐 Cybersécurité';
  if (/\bai\b|\bia\b|intelligence artificielle|machine learning|deep learning|agent|copilot|openai|anthropic|nvidia|gemini|chatgpt/.test(text)) return '🤖 Intelligence artificielle';
  if (/wifi|wi-fi|5g|6g|réseau|network|internet|telecom|fibre|connectivité/.test(text)) return '📡 Réseaux & Internet';
  return '💻 Technologie';
};

// Pages dédiées
const PageInterne = ({ titre, sousTitre, children }) => (
  <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
    <nav className="relative z-10 flex justify-between items-center px-4 md:px-12 py-4 bg-white border-b border-slate-200 shadow-sm">
      <a href="/" className="font-black text-[#002B49] hover:text-[#D4AF37] transition-colors">
        ← Accueil
      </a>
      <div className="hidden md:block font-black uppercase text-[#002B49]">Erdikoudi-Business</div>
      <a href="/admin" className="px-3 py-2 rounded font-black text-[#002B49] border border-[#D4AF37] hover:bg-[#D4AF37] transition-all">
        🔐 Espace professionnel
      </a>
    </nav>

    <main className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
      <div className="text-center mb-14">
        <p className="text-[#D4AF37] font-black tracking-[0.25em] text-[10px] md:text-xs uppercase mb-2">
          {sousTitre}
        </p>
        <h1 className="text-4xl md:text-6xl font-black uppercase italic text-[#002B49]">
          {titre}
        </h1>
      </div>
      {children}
    </main>
  </div>
);

export default function App() {
  const currentPath = window.location.pathname;
  const [currentPage, setCurrentPage] = useState(
    currentPath === '/boutique' ? 'boutique'
      : currentPath === '/avis' || currentPath === '/commentaires' ? 'commentaires'
      : 'home'
  );
  const [activeMenu, setActiveMenu] = useState('accueil');
  const [avis, setAvis] = useState([]);
  const [form, setForm] = useState({
    nom: '',
    msg: '',
    stars: '⭐⭐⭐⭐⭐'
  });
  const [publishing, setPublishing] = useState(false);

  const allerPage = (path) => {
    window.location.href = path;
  };

  const allerSection = (id) => {
    setActiveMenu(id);
    setCurrentPage('home');
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orderForm, setOrderForm] = useState({ nom: '', telephone: '', email: '', ville: '', adresse: '', paiement: 'À confirmer', note: '' });
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [techNews, setTechNews] = useState([]);
  const [techNewsLoading, setTechNewsLoading] = useState(true);
  const [techNewsError, setTechNewsError] = useState('');
  const [technologySlide, setTechnologySlide] = useState(0);
  const [newsSearch, setNewsSearch] = useState('');
  const [newsCategory, setNewsCategory] = useState('Toutes');
  const [publiciteForm, setPubliciteForm] = useState({
    entreprise: '',
    responsable: '',
    telephone: '',
    email: '',
    type_publicite: 'Bannière sponsorisée',
    duree: 'À définir',
    lien: '',
    message: ''
  });

  const [sendingPublicite, setSendingPublicite] = useState(false);
  const [publiciteMessage, setPubliciteMessage] = useState('');

  const changerPubliciteForm = (field, value) => {
    setPubliciteForm((previous) => ({ ...previous, [field]: value }));
  };

  const envoyerDemandePublicite = async (event) => {
    event.preventDefault();
    setSendingPublicite(true);
    setPubliciteMessage('');

    const payload = {
      entreprise: publiciteForm.entreprise.trim(),
      responsable: publiciteForm.responsable.trim(),
      telephone: publiciteForm.telephone.trim(),
      email: publiciteForm.email.trim() || null,
      type_publicite: publiciteForm.type_publicite,
      duree: publiciteForm.duree,
      lien: publiciteForm.lien.trim() || null,
      message: publiciteForm.message.trim(),
      status: 'new'
    };

    const { error: databaseError } = await supabase
      .from('advertising_requests')
      .insert([payload]);

    if (databaseError) {
      console.error('Erreur demande publicitaire :', databaseError);
      setPubliciteMessage('Impossible d’enregistrer la demande. Veuillez réessayer.');
      setSendingPublicite(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(publiciteForm).forEach(([key, value]) => formData.append(key, value));
      formData.append('_subject', 'Nouvelle demande de publicité — Erdikoudi Business');
      await fetch('https://formspree.io/f/xaqaqgzl', { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
    } catch (error) {
      console.warn('Formspree indisponible, mais la demande est enregistrée dans Supabase.', error);
    }

    setPubliciteForm({ entreprise: '', responsable: '', telephone: '', email: '', type_publicite: 'Bannière sponsorisée', duree: 'À définir', lien: '', message: '' });
    setPubliciteMessage('Merci ! Votre demande publicitaire a bien été reçue. Nous vous contacterons prochainement.');
    setSendingPublicite(false);
  };

  const chargerActualitesTech = async () => {
    try {
      setTechNewsLoading(true);
      setTechNewsError('');
      const response = await fetch('/api/tech-news');
      if (!response.ok) throw new Error('Impossible de récupérer les actualités.');
      const data = await response.json();
      setTechNews(Array.isArray(data.articles) ? data.articles.map((article) => ({ ...article, category: detectTechCategory(article) })) : []);
    } catch (error) {
      console.error('Erreur actualités technologie :', error);
      setTechNewsError('Les actualités sont momentanément indisponibles.');
    } finally {
      setTechNewsLoading(false);
    }
  };

  useEffect(() => {
    chargerActualitesTech();
    const refresh = window.setInterval(chargerActualitesTech, 10 * 60 * 1000);
    return () => window.clearInterval(refresh);
  }, []);

  useEffect(() => {
    if (techNews.length < 2) return;
    const timer = window.setInterval(() => {
      setTechnologySlide((current) => (current + 1) % techNews.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [techNews.length]);
  const newsCategories = ['Toutes', ...Array.from(new Set(techNews.map((article) => article.category).filter(Boolean)))];
  const filteredNews = techNews.filter((article) => {
    const matchesCategory = newsCategory === 'Toutes' || article.category === newsCategory;
    const query = newsSearch.trim().toLowerCase();
    const matchesSearch = !query || `${article.title || ''} ${article.description || ''}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const whatsappNumber = '23562201606';

  const chargerProduits = async () => {
    setProductsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, category, price, stock, image_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erreur de chargement des produits :', error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setProductsLoading(false);
  };

  useEffect(() => {
    chargerProduits();
  }, []);

  const ajouterAuPanier = (product) => {
    if (Number(product.stock) <= 0) return;
    setCart((previous) => {
      const found = previous.find((item) => item.id === product.id);
      if (found) {
        if (found.quantity >= Number(product.stock)) return previous;
        return previous.map((item) => item.id === product.id
          ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...previous, { ...product, quantity: 1 }];
    });
  };

  const changerQuantite = (id, quantity) => {
    const product = products.find((item) => item.id === id);
    const qty = Math.max(0, Math.min(Number(quantity) || 0, Number(product?.stock) || 0));
    setCart((previous) => qty === 0
      ? previous.filter((item) => item.id !== id)
      : previous.map((item) => item.id === id ? { ...item, quantity: qty } : item));
  };

  const totalPanier = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  const ouvrirFormulaireCommande = () => {
    if (!cart.length) return alert('Votre panier est vide.');
    setShowOrderForm(true);
  };

  const envoyerCommande = async (e) => {
    e.preventDefault();
    if (!cart.length) return alert('Votre panier est vide.');
    if (!orderForm.nom.trim() || !orderForm.telephone.trim() || !orderForm.ville.trim() || !orderForm.adresse.trim()) {
      return alert('Veuillez remplir votre nom, téléphone, ville et adresse de livraison.');
    }
    setPlacingOrder(true);
    const orderNumber = `CMD-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    const items = cart.map((item) => ({ product_id: item.id, name: item.name, quantity: item.quantity, unit_price: Number(item.price || 0), subtotal: Number(item.price || 0) * item.quantity }));
    const payload = { order_number: orderNumber, customer_name: orderForm.nom.trim(), customer_phone: orderForm.telephone.trim(), customer_email: orderForm.email.trim() || null, city: orderForm.ville.trim(), delivery_address: orderForm.adresse.trim(), note: orderForm.note.trim() || null, items, total: totalPanier, total_amount: totalPanier, payment_method: orderForm.paiement, payment_status: 'pending', status: 'pending' };
    const { data, error } = await supabase.from('orders').insert([payload]).select('id, order_number').single();
    if (error) { console.error('Erreur de création de commande :', error); alert(`Impossible d'enregistrer la commande.\n${error.message}`); setPlacingOrder(false); return; }
    const confirmedOrderNumber = data?.order_number || orderNumber;
    const lines = cart.map((item) => `- ${item.name} x${item.quantity} : ${(Number(item.price) * item.quantity).toLocaleString('fr-FR')} FCFA`);
    const message = ['Bonjour Erdikoudi Business,', '', `Je souhaite confirmer la commande ${confirmedOrderNumber}.`, '', ...lines, '', `Total : ${totalPanier.toLocaleString('fr-FR')} FCFA`, `Nom : ${orderForm.nom.trim()}`, `Téléphone : ${orderForm.telephone.trim()}`, `Ville : ${orderForm.ville.trim()}`, `Adresse : ${orderForm.adresse.trim()}`, `Paiement : ${orderForm.paiement}`, orderForm.note.trim() ? `Note : ${orderForm.note.trim()}` : '', '', 'Merci de me confirmer la disponibilité et les modalités de livraison.'].filter(Boolean).join('\n');
    setCart([]); setShowOrderForm(false); setOrderForm({ nom: '', telephone: '', email: '', ville: '', adresse: '', paiement: 'À confirmer', note: '' }); setPlacingOrder(false);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    alert(`Commande ${confirmedOrderNumber} enregistrée avec succès.`);
  };

  // Récupérer les avis depuis Supabase
  const chargerCommentaires = async () => {
    const { data, error } = await supabase
      .from('commentaires')
      .select('*')
      .order('date_publication', { ascending: false });

    if (error) {
      console.error('Erreur de chargement des avis :', error);
      return;
    }

    setAvis(data || []);
  };

  useEffect(() => {
    chargerCommentaires();
  }, []);

  // Publier un avis dans Supabase
  const handlePublish = async (e) => {
    e.preventDefault();

    if (!form.nom.trim() || !form.msg.trim()) {
      alert('Veuillez remplir votre nom et votre commentaire.');
      return;
    }

    setPublishing(true);

    const { error } = await supabase
      .from('commentaires')
      .insert([
        {
          nom: form.nom.trim(),
          message: form.msg.trim(),
          etoiles: form.stars
        }
      ]);

    setPublishing(false);

    if (error) {
      console.error('Erreur de publication :', error);
      alert('Impossible de publier votre avis. Vérifiez les autorisations Supabase.');
      return;
    }

    setForm({
      nom: '',
      msg: '',
      stars: '⭐⭐⭐⭐⭐'
    });

    await chargerCommentaires();
    alert('Merci ! Votre avis a été publié.');
  };

  // Page des avis
  const CommentsPage = (
    <div className="min-h-screen bg-slate-50 py-20 px-8 md:px-20">
      <button
        onClick={() => setCurrentPage('home')}
        className="mb-10 text-[#002B49] font-black uppercase tracking-widest flex items-center gap-2 hover:text-[#D4AF37] transition-colors"
      >
        ← Retour à l'accueil
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#D4AF37] font-bold tracking-[0.3em] text-xs uppercase">
            Espace Communautaire
          </span>
          <h2 className="text-[#002B49] text-5xl font-black uppercase italic">
            Avis & Témoignages
          </h2>
          <p className="text-slate-500">
            Découvrez les avis partagés par notre communauté.
          </p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl mb-20 border border-slate-200">
          <h3 className="text-[#002B49] text-xl font-black uppercase mb-8 border-b pb-4">
            Laisser un avis public
          </h3>

          <form onSubmit={handlePublish} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                value={form.nom}
                onChange={(e) =>
                  setForm({ ...form, nom: e.target.value })
                }
                type="text"
                placeholder="Votre Nom"
                required
                maxLength={100}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37] transition-all"
              />

              <select
                value={form.stars}
                onChange={(e) =>
                  setForm({ ...form, stars: e.target.value })
                }
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]"
              >
                <option value="⭐⭐⭐⭐⭐">5 Étoiles ⭐⭐⭐⭐⭐</option>
                <option value="⭐⭐⭐⭐">4 Étoiles ⭐⭐⭐⭐</option>
                <option value="⭐⭐⭐">3 Étoiles ⭐⭐⭐</option>
              </select>
            </div>

            <textarea
              value={form.msg}
              onChange={(e) =>
                setForm({ ...form, msg: e.target.value })
              }
              placeholder="Racontez votre expérience avec Erdikoudi Business..."
              required
              maxLength={2000}
              rows="4"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]"
            />

            <button
              type="submit"
              disabled={publishing}
              className="w-full bg-[#002B49] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-[#D4AF37] hover:text-[#002B49] transition-all shadow-lg disabled:opacity-50"
            >
              {publishing ? 'Publication...' : 'Publier le commentaire'}
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <h3 className="text-[#002B49] font-black uppercase tracking-widest text-sm italic">
            Derniers messages ({avis.length})
          </h3>

          {avis.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-400 italic">
                Aucun avis pour le moment. Soyez le premier à commenter !
              </p>
            </div>
          ) : (
            avis.map((item) => (
              <div
                key={item.id}
                className="bg-white p-8 rounded-3xl border-l-8 border-[#D4AF37] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4 gap-4">
                  <span className="font-black text-[#002B49] uppercase tracking-tighter">
                    {item.nom}
                  </span>
                  <span className="text-[#D4AF37] text-xs font-bold">
                    {item.etoiles}
                  </span>
                </div>

                <p className="text-slate-600 text-lg leading-relaxed italic">
                  "{item.message}"
                </p>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  Publié le :{' '}
                  {item.date_publication
                    ? new Date(item.date_publication).toLocaleDateString('fr-FR')
                    : 'Date inconnue'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );


  if (currentPath === '/admin') {
    return <Admin />;
  }

  if (currentPath === '/mentions-legales') {
    return (
      <PageInterne titre="Mentions légales" sousTitre="Informations légales">
        <div className="max-w-4xl mx-auto space-y-8 text-slate-700 leading-7">
          <section><h2 className="text-2xl font-black text-[#002B49]">Éditeur du site</h2><p className="mt-2">Erdikoudi-Business est une plateforme consacrée aux actualités technologiques, aux services et au commerce en ligne.</p><p>Responsable du site : Abdraman Guihini.</p><p>Pays : Tchad.</p></section>
          <section><h2 className="text-2xl font-black text-[#002B49]">Contact</h2><p className="mt-2">Pour toute question concernant le site, les services, les commandes ou les publicités, utilisez notre page Contact.</p></section>
          <section><h2 className="text-2xl font-black text-[#002B49]">Hébergement</h2><p className="mt-2">Le site est déployé sur une infrastructure d’hébergement web. Les informations définitives relatives à l’hébergeur pourront être complétées avant publication officielle.</p></section>
          <section><h2 className="text-2xl font-black text-[#002B49]">Propriété intellectuelle</h2><p className="mt-2">Les contenus originaux, textes, éléments graphiques et structure du site sont protégés selon la législation applicable. Toute reproduction non autorisée peut être interdite.</p></section>
        </div>
      </PageInterne>
    );
  }

  if (currentPath === '/confidentialite') {
    return (
      <PageInterne titre="Confidentialité" sousTitre="Protection des données">
        <div className="max-w-4xl mx-auto space-y-8 text-slate-700 leading-7">
          <section><h2 className="text-2xl font-black text-[#002B49]">Informations collectées</h2><p className="mt-2">Selon les fonctionnalités utilisées, le site peut recevoir les informations que vous saisissez volontairement dans les formulaires, notamment pour une demande de contact, un avis ou une commande.</p></section>
          <section><h2 className="text-2xl font-black text-[#002B49]">Utilisation</h2><p className="mt-2">Ces informations peuvent servir à répondre aux demandes, traiter les commandes, améliorer les services et assurer le fonctionnement du site.</p></section>
          <section><h2 className="text-2xl font-black text-[#002B49]">Services tiers</h2><p className="mt-2">Le site peut utiliser des services tiers pour l’hébergement, les statistiques, les formulaires, le stockage ou la publicité. Leurs propres politiques peuvent également s’appliquer.</p></section>
          <section><h2 className="text-2xl font-black text-[#002B49]">Contact</h2><p className="mt-2">Pour toute question relative à la confidentialité, contactez-nous via la page Contact.</p></section>
        </div>
      </PageInterne>
    );
  }

  if (currentPath === '/conditions') {
    return (
      <PageInterne titre="Conditions d’utilisation" sousTitre="Règles du site">
        <div className="max-w-4xl mx-auto space-y-8 text-slate-700 leading-7">
          <section><h2 className="text-2xl font-black text-[#002B49]">Utilisation du site</h2><p className="mt-2">L’utilisateur s’engage à utiliser Erdikoudi-Business de manière licite, respectueuse et à ne pas perturber son fonctionnement.</p></section>
          <section><h2 className="text-2xl font-black text-[#002B49]">Boutique et commandes</h2><p className="mt-2">Les informations concernant les produits, disponibilités, prix, livraison et paiement sont communiquées lors du processus de commande et peuvent être précisées avant validation.</p></section>
          <section><h2 className="text-2xl font-black text-[#002B49]">Actualités</h2><p className="mt-2">Les actualités sont proposées à titre informatif. Les informations provenant de sources externes peuvent évoluer et doivent être vérifiées auprès de leur source originale.</p></section>
          <section><h2 className="text-2xl font-black text-[#002B49]">Publicités</h2><p className="mt-2">Le site peut afficher des publicités directes ou, à terme, des annonces fournies par des plateformes publicitaires. Les annonceurs restent responsables de leurs offres et contenus.</p></section>
        </div>
      </PageInterne>
    );
  }

  if (currentPath === '/publicite') {
    return (
      <PageInterne titre="Publicité" sousTitre="Développez votre visibilité">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10">
              <span className="inline-block text-[#D4AF37] font-black uppercase tracking-[0.2em] text-xs mb-4">
                Espace annonceurs
              </span>
              <h2 className="text-3xl md:text-4xl font-black uppercase text-[#002B49] leading-tight">
                Faites connaître votre entreprise
              </h2>
              <p className="mt-5 text-slate-500 leading-relaxed">
                Présentez votre entreprise, produit ou service aux visiteurs d’Erdikoudi-Business.
                Nous proposons des emplacements publicitaires sur notre plateforme.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {[
                  ['📢', 'Bannière sponsorisée', 'Votre publicité visible sur des emplacements stratégiques.'],
                  ['📰', 'Promotion produit', 'Mettez en avant un produit, un service ou une offre.'],
                  ['🚀', 'Campagne personnalisée', 'Une campagne adaptée à vos objectifs et votre audience.'],
                  ['📊', 'Suivi de campagne', 'Possibilité de suivre les demandes et performances selon la formule.']
                ].map(([icon, title, desc]) => (
                  <div key={title} className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                    <div className="text-3xl">{icon}</div>
                    <h3 className="mt-3 font-black text-[#002B49]">{title}</h3>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-[#002B49] p-6 text-white">
                <p className="text-[#D4AF37] text-xs font-black uppercase tracking-widest">Tarification</p>
                <p className="mt-2 text-xl font-black">Sur devis</p>
                <p className="mt-2 text-sm text-white/65">
                  Le tarif dépend du format, de l’emplacement, de la durée et de la campagne souhaitée.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10">
              <h2 className="text-2xl font-black uppercase text-[#002B49]">Demander une publicité</h2>
              <p className="mt-2 text-sm text-slate-500">
                Remplissez le formulaire. Nous vous contacterons pour confirmer les modalités de votre campagne.
              </p>

              <form onSubmit={envoyerDemandePublicite} className="mt-7 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#002B49] mb-2">Entreprise</label>
                    <input name="entreprise" value={publiciteForm.entreprise} onChange={(e) => changerPubliciteForm('entreprise', e.target.value)} required className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D4AF37]" placeholder="Nom de l’entreprise" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#002B49] mb-2">Responsable</label>
                    <input name="responsable" value={publiciteForm.responsable} onChange={(e) => changerPubliciteForm('responsable', e.target.value)} required className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D4AF37]" placeholder="Votre nom" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#002B49] mb-2">Téléphone / WhatsApp</label>
                    <input name="telephone" value={publiciteForm.telephone} onChange={(e) => changerPubliciteForm('telephone', e.target.value)} required className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D4AF37]" placeholder="+235..." />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#002B49] mb-2">E-mail</label>
                    <input type="email" name="email" value={publiciteForm.email} onChange={(e) => changerPubliciteForm('email', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D4AF37]" placeholder="contact@entreprise.com" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#002B49] mb-2">Type de publicité</label>
                    <select name="type_publicite" value={publiciteForm.type_publicite} onChange={(e) => changerPubliciteForm('type_publicite', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D4AF37]">
                      <option>Bannière sponsorisée</option>
                      <option>Promotion d’un produit</option>
                      <option>Promotion d’un service</option>
                      <option>Campagne personnalisée</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#002B49] mb-2">Durée souhaitée</label>
                    <select name="duree" value={publiciteForm.duree} onChange={(e) => changerPubliciteForm('duree', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D4AF37]">
                      <option>À définir</option>
                      <option>1 semaine</option>
                      <option>1 mois</option>
                      <option>3 mois</option>
                      <option>6 mois</option>
                      <option>12 mois</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#002B49] mb-2">Site web / réseau social</label>
                  <input name="lien" value={publiciteForm.lien} onChange={(e) => changerPubliciteForm('lien', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D4AF37]" placeholder="https://..." />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#002B49] mb-2">Votre demande</label>
                  <textarea name="message" value={publiciteForm.message} onChange={(e) => changerPubliciteForm('message', e.target.value)} required rows="5" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D4AF37]" placeholder="Décrivez votre entreprise, votre offre et ce que vous souhaitez promouvoir..." />
                </div>

                {publiciteMessage && (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm font-bold text-green-700">
                    {publiciteMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendingPublicite}
                  className="w-full bg-[#D4AF37] text-[#002B49] px-6 py-4 rounded-xl font-black uppercase tracking-wider hover:scale-[1.01] transition-transform disabled:opacity-50"
                >
                  {sendingPublicite ? 'Envoi en cours...' : '📢 Envoyer ma demande'}
                </button>

                <p className="text-[11px] text-slate-400 text-center">
                  En envoyant ce formulaire, vous acceptez que les informations fournies soient utilisées pour répondre à votre demande commerciale.
                </p>
              </form>
            </div>
          </div>
        </div>
      </PageInterne>
    );
  }

  if (currentPath === '/services') {
    const services = [
      { title: 'Informatique & IT', icon: '💻', desc: 'Maintenance informatique, assistance technique et infrastructure réseau.' },
      { title: 'Trading & Crypto', icon: '📈', desc: 'Analyses techniques et accompagnement sur les marchés numériques.' },
      { title: 'Solutions Starlink', icon: '🛰️', desc: 'Installation, configuration et optimisation de solutions Internet satellite.' },
      { title: 'Développement IA', icon: '🤖', desc: 'Création de solutions et guides utilisant l’intelligence artificielle.' },
      { title: 'Agropastoral', icon: '🌱', desc: 'Accompagnement et solutions technologiques pour les projets agropastoraux.' }
    ];

    return (
      <PageInterne titre="Nos Services" sousTitre="Ce que nous proposons">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {services.map((service) => (
            <article key={service.title} className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="text-5xl mb-6">{service.icon}</div>
              <h2 className="text-xl font-black uppercase text-[#002B49] mb-4">{service.title}</h2>
              <p className="text-slate-500 leading-relaxed">{service.desc}</p>
              <a href="/contact" className="inline-block mt-7 text-[#D4AF37] font-black uppercase text-xs tracking-widest hover:text-[#002B49]">
                Demander un service →
              </a>
            </article>
          ))}
        </div>
      </PageInterne>
    );
  }

  if (currentPath === '/apropos') {
    return (
      <PageInterne titre="À propos" sousTitre="Erdikoudi-Business">
        <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-14">
          <div className="border-l-8 border-[#D4AF37] pl-6 md:pl-10">
            <p className="text-[#002B49] text-2xl md:text-4xl font-black uppercase leading-tight">
              Erdikoudi Business est le moteur de votre innovation au Tchad.
            </p>
          </div>
          <div className="mt-10 grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-black uppercase text-[#002B49] mb-4">Notre vision</h2>
              <p className="text-slate-500 leading-relaxed">
                Nous combinons expertise informatique, solutions technologiques et vision stratégique
                pour accompagner les particuliers et les entreprises dans leurs projets.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase text-[#002B49] mb-4">Notre objectif</h2>
              <p className="text-slate-500 leading-relaxed">
                Proposer des solutions modernes, accessibles et adaptées aux besoins du marché tchadien.
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="/services" className="bg-[#002B49] text-white px-6 py-4 rounded-xl font-black uppercase text-sm hover:bg-[#D4AF37] hover:text-[#002B49] transition-all">
              Voir nos services
            </a>
            <a href="/contact" className="border border-[#002B49] text-[#002B49] px-6 py-4 rounded-xl font-black uppercase text-sm hover:bg-[#002B49] hover:text-white transition-all">
              Nous contacter
            </a>
          </div>
        </div>
      </PageInterne>
    );
  }

  if (currentPath === '/contact') {
    return (
      <PageInterne titre="Devis / Contact" sousTitre="Parlons de votre projet">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="bg-[#002B49] text-white rounded-[2.5rem] p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-8">Prêt à collaborer ?</h2>
            <div className="space-y-6 text-blue-100">
              <p className="font-bold">📍 Avenue Hassan Djamous, N'Djamena</p>
              <p className="font-bold">📧 abdramanguihini6@gmail.com</p>
              <p className="font-bold">📞 Contactez-nous pour discuter de votre besoin.</p>
            </div>
            <a href="mailto:abdramanguihini6@gmail.com" className="inline-block mt-10 bg-[#D4AF37] text-[#002B49] px-7 py-4 rounded-xl font-black uppercase hover:bg-white transition-all">
              Envoyer un email
            </a>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
            <form action="https://formspree.io/f/xaqaqgzl" method="POST" className="space-y-6">
              <input name="name" type="text" required placeholder="Nom Complet"
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-[#D4AF37]" />
              <input name="email" type="email" required placeholder="Email"
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-[#D4AF37]" />
              <textarea name="message" required placeholder="Décrivez votre besoin technologique..." rows="7"
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-[#D4AF37]" />
              <button type="submit"
                className="w-full bg-[#002B49] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-[#002B49] transition-all">
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </PageInterne>
    );
  }

  if (currentPage === 'commentaires') {
    return CommentsPage;
  }

  if (currentPage === 'boutique') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
        <nav className="relative z-10 flex justify-between items-center px-4 md:px-12 py-4 bg-white border-b border-slate-200">
          <button type="button" onClick={() => setCurrentPage('home')} className="font-black text-[#002B49]">← Accueil</button>
          <span className="font-black uppercase text-[#002B49]">Boutique</span>
          <span className="font-bold text-[#002B49]">Panier : {cart.reduce((n, item) => n + item.quantity, 0)}</span>
        </nav>
        <main className="max-w-7xl mx-auto px-5 md:px-12 py-12">
          <h2 className="text-3xl md:text-5xl font-black uppercase text-[#002B49] mb-3">Notre boutique</h2>
          <p className="text-slate-500 mb-8">Sélectionnez vos produits et envoyez votre commande sur WhatsApp.</p>
          {productsLoading ? <p className="py-10 text-center">Chargement des produits…</p> :
            products.length === 0 ? <p className="bg-white rounded-2xl p-8 text-center text-slate-500">Aucun produit actif trouvé. Vérifiez les produits dans Supabase.</p> :
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <article key={product.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
                  {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-52 object-cover" /> : <div className="h-52 bg-slate-100 flex items-center justify-center text-slate-400">Image indisponible</div>}
                  <div className="p-6 flex flex-col flex-1">
                    {product.category && <p className="text-xs uppercase font-black text-[#D4AF37] mb-2">{product.category}</p>}
                    <h3 className="text-xl font-black text-[#002B49]">{product.name}</h3>
                    {product.description && <p className="text-sm text-slate-500 mt-2">{product.description}</p>}
                    <div className="mt-auto pt-5 flex justify-between gap-3 items-center">
                      <strong className="text-[#002B49]">{Number(product.price).toLocaleString('fr-FR')} FCFA</strong>
                      <span className="text-xs text-slate-500">Stock : {product.stock}</span>
                    </div>
                    <button type="button" disabled={Number(product.stock) <= 0} onClick={() => ajouterAuPanier(product)} className="mt-4 w-full bg-[#002B49] text-white py-3 rounded-xl font-black uppercase text-xs disabled:opacity-40 hover:bg-[#D4AF37] hover:text-[#002B49]">
                      {Number(product.stock) <= 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                    </button>
                  </div>
                </article>
              ))}
            </div>}
          <section className="mt-12 bg-white rounded-3xl border border-slate-200 p-6 md:p-8">
            <h3 className="text-2xl font-black text-[#002B49] mb-5">Votre panier</h3>
            {cart.length === 0 ? <p className="text-slate-500">Votre panier est vide.</p> : <>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div><p className="font-bold text-[#002B49]">{item.name}</p><p className="text-sm text-slate-500">{(Number(item.price) * item.quantity).toLocaleString('fr-FR')} FCFA</p></div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => changerQuantite(item.id, item.quantity - 1)} className="w-9 h-9 rounded-lg bg-slate-100 font-black">−</button>
                      <span className="font-bold">{item.quantity}</span>
                      <button type="button" disabled={item.quantity >= Number(item.stock)} onClick={() => changerQuantite(item.id, item.quantity + 1)} className="w-9 h-9 rounded-lg bg-slate-100 font-black disabled:opacity-40">+</button>
                      <button type="button" onClick={() => changerQuantite(item.id, 0)} className="text-sm font-bold text-red-600">Retirer</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xl font-black text-[#002B49]">Total : {totalPanier.toLocaleString('fr-FR')} FCFA</p>
                <button type="button" onClick={ouvrirFormulaireCommande} className="bg-green-600 text-white px-7 py-4 rounded-xl font-black uppercase hover:bg-green-700">Commander</button>
              </div>
              <p className="text-xs text-slate-500 mt-3">La commande sera enregistrée dans Supabase puis envoyée sur WhatsApp pour confirmation.</p>
            </>}
          </section>

          {showOrderForm && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 md:px-8 py-5 flex justify-between items-center">
                  <div><p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Finaliser la commande</p><h3 className="text-2xl font-black text-[#002B49]">Informations client</h3></div>
                  <button type="button" onClick={() => setShowOrderForm(false)} disabled={placingOrder} className="w-9 h-9 rounded-full bg-slate-100 font-black">×</button>
                </div>
                <form onSubmit={envoyerCommande} className="p-6 md:p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <input value={orderForm.nom} onChange={(e) => setOrderForm({...orderForm, nom:e.target.value})} required maxLength={100} placeholder="Nom complet *" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]" />
                    <input value={orderForm.telephone} onChange={(e) => setOrderForm({...orderForm, telephone:e.target.value})} required maxLength={30} placeholder="Téléphone *" type="tel" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]" />
                    <input value={orderForm.email} onChange={(e) => setOrderForm({...orderForm, email:e.target.value})} maxLength={150} placeholder="Email (facultatif)" type="email" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]" />
                    <input value={orderForm.ville} onChange={(e) => setOrderForm({...orderForm, ville:e.target.value})} required maxLength={100} placeholder="Ville *" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <textarea value={orderForm.adresse} onChange={(e) => setOrderForm({...orderForm, adresse:e.target.value})} required maxLength={300} rows="3" placeholder="Adresse de livraison *" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]" />
                  <select value={orderForm.paiement} onChange={(e) => setOrderForm({...orderForm, paiement:e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]">
                    <option>À confirmer</option><option>Espèces</option><option>Airtel Money</option><option>Virement bancaire</option><option>Autre</option>
                  </select>
                  <textarea value={orderForm.note} onChange={(e) => setOrderForm({...orderForm, note:e.target.value})} maxLength={500} rows="3" placeholder="Note (facultatif)" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]" />
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200"><p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Résumé</p>{cart.map((item)=><div key={item.id} className="flex justify-between text-sm py-1"><span>{item.name} × {item.quantity}</span><strong>{(Number(item.price)*item.quantity).toLocaleString('fr-FR')} FCFA</strong></div>)}<div className="border-t mt-3 pt-3 flex justify-between font-black text-[#002B49]"><span>Total</span><span>{totalPanier.toLocaleString('fr-FR')} FCFA</span></div></div>
                  <div className="flex flex-col sm:flex-row gap-3"><button type="button" onClick={() => setShowOrderForm(false)} disabled={placingOrder} className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-100 font-black uppercase">Annuler</button><button type="submit" disabled={placingOrder} className="w-full sm:flex-1 py-4 rounded-2xl bg-green-600 text-white font-black uppercase disabled:opacity-50">{placingOrder ? 'Enregistrement...' : 'Enregistrer & envoyer sur WhatsApp'}</button></div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#D4AF37]/30">
      <nav className="relative z-20 flex justify-between items-center px-4 md:px-20 py-4 md:py-6 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <img src="/logo.jfif" alt="Logo" className="h-10 md:h-14 w-auto drop-shadow-sm" />
          <div className="leading-none">
            <h1 className="text-sm md:text-xl font-black text-[#002B49] tracking-tighter uppercase">Erdikoudi-Business</h1>
            <p className="text-[8px] md:text-[10px] font-bold text-[#D4AF37] tracking-[0.4em] uppercase">Expertise Tech</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-5 text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] text-slate-500">
          <a href="/" className="px-2 py-2 rounded bg-[#D4AF37] text-[#002B49]">Accueil</a>
          <a href="/services" className="px-2 py-2 rounded hover:bg-[#D4AF37] hover:text-[#002B49] transition-colors">Services</a>
          <a href="/apropos" className="px-2 py-2 rounded hover:bg-[#D4AF37] hover:text-[#002B49] transition-colors">À propos</a>
          <a href="/boutique" className="px-2 py-2 rounded hover:bg-[#D4AF37] hover:text-[#002B49] transition-colors">Boutique</a>
          <a href="/avis" className="px-2 py-2 rounded hover:bg-[#D4AF37] hover:text-[#002B49] transition-colors">Avis</a>
          <a href="/contact" className="bg-[#002B49] text-white px-3 py-2 md:px-5 rounded font-black hover:bg-[#D4AF37] hover:text-[#002B49] transition-all">Devis / Contact</a>
          <a href="/admin" className="px-3 py-2 md:px-5 rounded font-black text-[#002B49] border border-[#D4AF37] hover:bg-[#D4AF37] transition-all">🔐 Espace professionnel</a>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-[#001D2F] text-white">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-[#004A7C] via-transparent to-[#D4AF37]"></div>
        <div className="relative max-w-7xl mx-auto px-5 md:px-12 py-5 md:py-7">
          <div className="max-w-3xl mb-4 md:mb-5">
            <p className="text-[#D4AF37] font-black tracking-[0.25em] text-[10px] md:text-xs uppercase mb-2">Transformation Numérique</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase italic leading-tight">
              Innover vos solutions.
            </h2>
            <p className="mt-2 text-blue-100/70 text-sm md:text-base max-w-2xl leading-relaxed">
              Découvrez nos services, nos solutions et les technologies qui façonnent le monde de demain.
            </p>
          </div>

          <div className="relative h-[285px] sm:h-[315px] md:h-[335px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
            {techNewsLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4 animate-pulse">🌐</div>
                  <p className="text-white font-bold">Chargement des actualités technologiques...</p>
                </div>
              </div>
            )}

            {!techNewsLoading && techNews.length > 0 && techNews.map((article, index) => (
              <div
                key={article.id || index}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === technologySlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <img
                  src={article.image || '/tech-innovations.png'}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  onError={(event) => { event.currentTarget.src = '/tech-innovations.png'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001D2F] via-[#001D2F]/65 to-[#001D2F]/10"></div>
                <div className="absolute left-5 right-5 md:left-10 md:right-10 bottom-7 md:bottom-9 max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-block bg-[#D4AF37] text-[#002B49] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {article.category || '💻 Technologie'}
                    </span>
                    <span className="inline-block bg-black/40 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-bold">
                      {article.source}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight line-clamp-2 max-w-4xl">{article.title}</h3>
                  <p className="mt-2 text-white/80 text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl line-clamp-2">{article.description || 'Découvrez cette actualité technologique et ses dernières informations.'}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#002B49] px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:scale-105 transition-transform"
                    >
                      Lire l'article ↗
                    </a>
                    {article.date && (
                      <span className="text-white/60 text-xs font-semibold">
                        {new Date(article.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!techNewsLoading && techNews.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                <div>
                  <div className="text-5xl mb-4">📰</div>
                  <h3 className="text-2xl font-black">Actualités technologiques</h3>
                  <p className="mt-2 text-white/70">{techNewsError || 'Aucune actualité disponible pour le moment.'}</p>
                  <button type="button" onClick={chargerActualitesTech} className="mt-5 bg-[#D4AF37] text-[#002B49] px-5 py-3 rounded-xl font-black text-xs uppercase">Réessayer</button>
                </div>
              </div>
            )}

            {techNews.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Actualité précédente"
                  onClick={() => setTechnologySlide((technologySlide - 1 + techNews.length) % techNews.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/45 backdrop-blur text-white text-xl font-black hover:bg-[#D4AF37] hover:text-[#002B49] transition-all"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Actualité suivante"
                  onClick={() => setTechnologySlide((technologySlide + 1) % techNews.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/45 backdrop-blur text-white text-xl font-black hover:bg-[#D4AF37] hover:text-[#002B49] transition-all"
                >
                  ›
                </button>
                <div className="absolute bottom-4 right-5 flex gap-2 z-10">
                {techNews.slice(0, 8).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Afficher l'actualité ${index + 1}`}
                    onClick={() => setTechnologySlide(index)}
                    className={`h-2 rounded-full transition-all ${index === technologySlide ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/60'}`}
                  />
                ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <Publicite position="home-middle" />

      <section id="actualites" className="max-w-7xl mx-auto px-6 md:px-16 py-14 md:py-18">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
          <div>
            <p className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase">À ne pas manquer</p>
            <h3 className="text-3xl md:text-4xl font-black uppercase italic text-[#002B49] mt-2">Dernières actualités</h3>
            <p className="text-slate-500 mt-2 max-w-2xl">Retrouvez les informations technologiques récentes et revenez régulièrement pour découvrir les nouvelles publications.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              type="search"
              value={newsSearch}
              onChange={(e) => setNewsSearch(e.target.value)}
              placeholder="Rechercher une actualité…"
              aria-label="Rechercher une actualité"
              className="w-full sm:w-72 px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-[#D4AF37]"
            />
            <select
              value={newsCategory}
              onChange={(e) => setNewsCategory(e.target.value)}
              aria-label="Filtrer les actualités par catégorie"
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#002B49] font-bold outline-none focus:border-[#D4AF37]"
            >
              {newsCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
        </div>

        {filteredNews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center">
            <div className="text-4xl mb-3">🔎</div>
            <p className="font-black text-[#002B49]">Aucune actualité trouvée</p>
            <button type="button" onClick={() => { setNewsSearch(''); setNewsCategory('Toutes'); }} className="mt-4 text-[#D4AF37] font-black uppercase text-xs tracking-widest">
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.slice(0, 6).map((article, index) => (
              <article key={article.id || article.link || index} className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={article.image || '/tech-innovations.png'}
                    alt={article.title || 'Actualité technologique'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(event) => { event.currentTarget.src = '/tech-innovations.png'; }}
                  />
                  <span className="absolute left-4 top-4 bg-[#D4AF37] text-[#002B49] px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {article.category || '💻 Technologie'}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {article.source || 'Actualités Tech'}
                    {article.date ? ` • ${new Date(article.date).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                  <h4 className="mt-3 text-lg font-black text-[#002B49] line-clamp-3">{article.title}</h4>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">{article.description || 'Découvrez cette actualité technologique.'}</p>
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-flex mt-5 text-[#D4AF37] font-black uppercase text-xs tracking-widest">
                    Lire l'article ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-16 py-16 md:py-20">
        <div className="text-center mb-10">
          <p className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase">Découvrez Erdikoudi-Business</p>
          <h3 className="text-3xl md:text-5xl font-black uppercase italic text-[#002B49] mt-3">Explorez nos univers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="bg-white rounded-3xl border border-slate-200 p-7 md:p-9 shadow-sm hover:shadow-xl transition-all">
            <div className="text-4xl mb-5">💼</div>
            <h4 className="text-xl font-black uppercase text-[#002B49]">Nos Services</h4>
            <p className="text-slate-500 mt-3">Informatique, réseaux, Starlink, IA et autres solutions adaptées à vos besoins.</p>
            <a href="/services" className="inline-block mt-6 text-[#D4AF37] font-black uppercase text-xs tracking-widest">Lire la suite →</a>
          </article>

          <article className="bg-white rounded-3xl border border-slate-200 p-7 md:p-9 shadow-sm hover:shadow-xl transition-all">
            <div className="text-4xl mb-5">ℹ️</div>
            <h4 className="text-xl font-black uppercase text-[#002B49]">À propos de nous</h4>
            <p className="text-slate-500 mt-3">Découvrez notre vision, notre objectif et notre approche de l’innovation au Tchad.</p>
            <a href="/apropos" className="inline-block mt-6 text-[#D4AF37] font-black uppercase text-xs tracking-widest">Lire la suite →</a>
          </article>

          <article className="bg-white rounded-3xl border border-slate-200 p-7 md:p-9 shadow-sm hover:shadow-xl transition-all">
            <div className="text-4xl mb-5">🛒</div>
            <h4 className="text-xl font-black uppercase text-[#002B49]">Notre Boutique</h4>
            <p className="text-slate-500 mt-3">Découvrez nos produits et solutions technologiques disponibles à la vente.</p>
            <a href="/boutique" className="inline-block mt-6 text-[#D4AF37] font-black uppercase text-xs tracking-widest">Visiter la boutique →</a>
          </article>

          <article className="bg-white rounded-3xl border border-slate-200 p-7 md:p-9 shadow-sm hover:shadow-xl transition-all">
            <div className="text-4xl mb-5">⭐</div>
            <h4 className="text-xl font-black uppercase text-[#002B49]">Avis & Témoignages</h4>
            <p className="text-slate-500 mt-3">Découvrez les expériences et témoignages partagés par notre communauté.</p>
            <a href="/avis" className="inline-block mt-6 text-[#D4AF37] font-black uppercase text-xs tracking-widest">Lire les avis →</a>
          </article>
        </div>

        <div className="mt-8 bg-[#D4AF37] rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[#002B49] font-black uppercase tracking-widest text-xs">Un projet en tête ?</p>
            <h3 className="text-2xl md:text-3xl font-black text-[#002B49] mt-2">Parlons de votre besoin technologique.</h3>
          </div>
          <a href="/contact" className="bg-[#002B49] text-white px-7 py-4 rounded-xl font-black uppercase text-sm hover:bg-white hover:text-[#002B49] transition-all">
            Devis / Contact →
          </a>
        </div>
      </section>

      <section className="bg-white border-t border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="text-center">
            <p className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase">Veille technologique</p>
            <h3 className="text-2xl md:text-3xl font-black uppercase text-[#002B49] mt-2">Les technologies qui font l’actualité</h3>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto">Notre sélection se met à jour automatiquement avec des informations provenant de sources technologiques externes. Cliquez sur un article pour consulter sa publication originale.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['🤖 Intelligence artificielle', '🛰️ Starlink & Satellites', '📡 Réseaux & Internet', '🔐 Cybersécurité', '💻 Technologie'].map((category) => (
                <span key={category} className="px-4 py-2 rounded-full bg-slate-100 text-[#002B49] text-xs font-black">{category}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Publicite position="home-bottom" />

      <footer className="bg-[#001D2F] text-white py-8 text-center">
        <p className="text-xs text-white/50">© {new Date().getFullYear()} Erdikoudi-Business — Expertise Tech</p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/60">
          <a href="/mentions-legales" className="hover:text-[#D4AF37]">Mentions légales</a>
          <a href="/confidentialite" className="hover:text-[#D4AF37]">Confidentialité</a>
          <a href="/conditions" className="hover:text-[#D4AF37]">Conditions d’utilisation</a>
          <a href="/publicite" className="hover:text-[#D4AF37]">Publicité</a>
          <a href="/contact" className="hover:text-[#D4AF37]">Contact</a>
        </div>
      </footer>
    </div>
  );

}
