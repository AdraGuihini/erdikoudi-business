import React, { useEffect, useState } from "react";
import { inject } from "@vercel/analytics";
import { supabase } from "./lib/supabase";

inject();

const DEMO_PRODUCTS = [
  {
    id: "demo-1",
    name: "Kit Starlink",
    description: "Kit internet satellite haut débit pour maison ou entreprise.",
    category: "Starlink",
    price: 350000,
    stock: 5,
    image_url: "",
  },
  {
    id: "demo-2",
    name: "Routeur WiFi professionnel",
    description: "Routeur performant pour améliorer la couverture de votre réseau.",
    category: "Réseau",
    price: 45000,
    stock: 10,
    image_url: "",
  },
  {
    id: "demo-3",
    name: "Smartphone Android",
    description: "Smartphone Android adapté aux besoins professionnels et personnels.",
    category: "Smartphones",
    price: 85000,
    stock: 8,
    image_url: "",
  },
  {
    id: "demo-4",
    name: "Répéteur WiFi",
    description: "Étendez la couverture de votre connexion internet.",
    category: "Accessoires",
    price: 25000,
    stock: 12,
    image_url: "",
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [avis, setAvis] = useState([]);
  const [form, setForm] = useState({
    nom: "",
    msg: "",
    stars: "⭐⭐⭐⭐⭐",
  });

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  const API_URL = "http://localhost/api.php";

  useEffect(() => {
    chargerCommentaires();
    chargerProduits();
  }, []);

  const chargerProduits = async () => {
    setProductsLoading(true);
    setProductsError("");

    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, description, category, price, stock, image_url, is_active"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur Supabase produits :", error);

        // Affichage des produits de démonstration si Supabase n'est pas encore configuré
        setProducts(DEMO_PRODUCTS);
      } else {
        setProducts(data && data.length > 0 ? data : DEMO_PRODUCTS);
      }
    } catch (error) {
      console.error("Erreur de chargement :", error);
      setProducts(DEMO_PRODUCTS);
    } finally {
      setProductsLoading(false);
    }
  };

  const chargerCommentaires = () => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => setAvis(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Erreur de liaison MySQL :", error);
        setAvis([]);
      });
  };

  const handlePublish = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nom: form.nom,
          message: form.msg,
          etoiles: form.stars,
        }),
      });

      if (response.ok) {
        setForm({
          nom: "",
          msg: "",
          stars: "⭐⭐⭐⭐⭐",
        });

        chargerCommentaires();
        alert("Votre avis a été enregistré !");
      } else {
        alert("Impossible d'enregistrer votre avis.");
      }
    } catch (error) {
      alert(
        "L'API des commentaires n'est pas disponible pour le moment."
      );
    }
  };

  const ouvrirPage = (page) => {
    setCurrentPage(page);
    setMobileMenu(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const allerContact = () => {
    setCurrentPage("home");
    setMobileMenu(false);

    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  const ShopPage = () => (
    <div className="min-h-screen bg-slate-50 py-16 px-5 md:px-12">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => ouvrirPage("home")}
          className="mb-10 text-[#002B49] font-black uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
        >
          ← Retour à l'accueil
        </button>

        <div className="text-center mb-14 space-y-4">
          <span className="text-[#D4AF37] font-bold tracking-[0.3em] text-xs uppercase">
            Erdikoudi Store
          </span>

          <h2 className="text-[#002B49] text-4xl md:text-6xl font-black uppercase italic">
            Notre Boutique
          </h2>

          <p className="text-slate-500 max-w-2xl mx-auto">
            Découvrez nos équipements technologiques : kits Starlink,
            smartphones, accessoires et équipements réseau.
          </p>
        </div>

        {productsLoading && (
          <p className="text-center text-slate-500">
            Chargement des produits...
          </p>
        )}

        {productsError && (
          <p className="text-center text-red-600">{productsError}</p>
        )}

        {!productsLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-52 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-7xl mb-2">
                          {product.category === "Starlink"
                            ? "🛰️"
                            : product.category === "Réseau"
                            ? "📡"
                            : product.category === "Smartphones"
                            ? "📱"
                            : "💻"}
                        </div>

                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Erdikoudi Store
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-black">
                      {product.category}
                    </p>

                    <h3 className="mt-2 text-xl font-black text-[#002B49]">
                      {product.name}
                    </h3>

                    <p className="mt-3 text-sm text-slate-500 min-h-[72px]">
                      {product.description}
                    </p>

                    <div className="mt-6 flex flex-col gap-3">
                      <strong className="text-[#002B49] text-xl">
                        {Number(product.price).toLocaleString("fr-FR")} FCFA
                      </strong>

                      <span className="text-xs text-slate-400">
                        Stock disponible : {product.stock}
                      </span>

                      <button
                        onClick={() =>
                          alert(
                            `Pour commander ${product.name}, contactez Erdikoudi Business.`
                          )
                        }
                        className="w-full bg-[#002B49] text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#D4AF37] hover:text-[#002B49] transition-all"
                      >
                        Commander
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 bg-[#002B49] rounded-3xl p-8 text-center text-white">
              <h3 className="text-2xl font-black uppercase">
                Besoin d'un produit précis ?
              </h3>

              <p className="mt-3 text-blue-100/70">
                Contactez-nous pour connaître les disponibilités et les prix.
              </p>

              <button
                onClick={allerContact}
                className="mt-6 bg-[#D4AF37] text-[#002B49] px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-all"
              >
                Nous contacter
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const CommentsPage = () => (
    <div className="min-h-screen bg-slate-50 py-16 px-5 md:px-12">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => ouvrirPage("home")}
          className="mb-10 text-[#002B49] font-black uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
        >
          ← Retour à l'accueil
        </button>

        <div className="text-center mb-14 space-y-4">
          <span className="text-[#D4AF37] font-bold tracking-[0.3em] text-xs uppercase">
            Espace Communautaire
          </span>

          <h2 className="text-[#002B49] text-4xl md:text-6xl font-black uppercase italic">
            Avis & Témoignages
          </h2>

          <p className="text-slate-500">
            Découvrez les avis de nos clients.
          </p>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl mb-14 border border-slate-200">
          <h3 className="text-[#002B49] text-xl font-black uppercase mb-8 border-b pb-4">
            Laisser un avis public
          </h3>

          <form onSubmit={handlePublish} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                value={form.nom}
                onChange={(event) =>
                  setForm({
                    ...form,
                    nom: event.target.value,
                  })
                }
                type="text"
                placeholder="Votre nom"
                required
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]"
              />

              <select
                value={form.stars}
                onChange={(event) =>
                  setForm({
                    ...form,
                    stars: event.target.value,
                  })
                }
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]"
              >
                <option value="⭐⭐⭐⭐⭐">5 étoiles ⭐⭐⭐⭐⭐</option>
                <option value="⭐⭐⭐⭐">4 étoiles ⭐⭐⭐⭐</option>
                <option value="⭐⭐⭐">3 étoiles ⭐⭐⭐</option>
              </select>
            </div>

            <textarea
              value={form.msg}
              onChange={(event) =>
                setForm({
                  ...form,
                  msg: event.target.value,
                })
              }
              placeholder="Racontez votre expérience avec Erdikoudi Business..."
              required
              rows="4"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#D4AF37]"
            />

            <button
              type="submit"
              className="w-full bg-[#002B49] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-[#002B49] transition-all"
            >
              Publier le commentaire
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <h3 className="text-[#002B49] font-black uppercase tracking-widest text-sm italic">
            Derniers messages ({avis.length})
          </h3>

          {avis.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-400 italic">
                Aucun commentaire pour le moment.
              </p>
            </div>
          ) : (
            avis.map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 md:p-8 rounded-3xl border-l-8 border-[#D4AF37] shadow-sm"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <span className="font-black text-[#002B49] uppercase">
                    {item.nom}
                  </span>

                  <span className="text-[#D4AF37] text-xs font-bold">
                    {item.etoiles}
                  </span>
                </div>

                <p className="text-slate-600 text-lg leading-relaxed italic">
                  "{item.message}"
                </p>

                {item.date_publication && (
                  <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 uppercase font-bold">
                    Publié le :{" "}
                    {new Date(item.date_publication).toLocaleDateString(
                      "fr-FR"
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (currentPage === "boutique") {
    return <ShopPage />;
  }

  if (currentPage === "commentaires") {
    return <CommentsPage />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200">
        <div className="flex justify-between items-center px-5 md:px-12 lg:px-20 py-5">
          <button
            onClick={() => ouvrirPage("home")}
            className="flex items-center gap-3 text-left"
          >
            <img
              src="/logo.jfif"
              alt="Logo Erdikoudi Business"
              className="h-12 md:h-14 w-auto"
            />

            <div className="leading-none">
              <h1 className="text-base md:text-xl font-black text-[#002B49] tracking-tighter uppercase">
                Erdikoudi-Business
              </h1>

              <p className="text-[8px] md:text-[10px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase">
                Expertise Tech
              </p>
            </div>
          </button>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="lg:hidden text-[#002B49] text-3xl font-black"
            aria-label="Ouvrir le menu"
          >
            {mobileMenu ? "✕" : "☰"}
          </button>

          <div className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
            <a
              href="#services"
              className="hover:text-[#004A7C] transition-colors"
            >
              Services
            </a>

            <button
              onClick={() => ouvrirPage("boutique")}
              className="hover:text-[#004A7C] transition-colors uppercase"
            >
              Boutique
            </button>

            <a
              href="#apropos"
              className="hover:text-[#004A7C] transition-colors"
            >
              À propos
            </a>

            <button
              onClick={() => ouvrirPage("commentaires")}
              className="hover:text-[#004A7C] transition-colors uppercase"
            >
              Avis clients
            </button>

            <button
              onClick={allerContact}
              className="bg-[#002B49] text-white px-5 py-3 rounded-xl font-black hover:bg-[#004A7C] transition-all"
            >
              Contact
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="lg:hidden px-5 pb-6 bg-white border-t border-slate-100">
            <div className="flex flex-col gap-4 pt-5 text-sm font-black uppercase tracking-widest text-[#002B49]">
              <a
                href="#services"
                onClick={() => setMobileMenu(false)}
                className="py-2"
              >
                Services
              </a>

              <button
                onClick={() => ouvrirPage("boutique")}
                className="text-left py-2 text-[#D4AF37]"
              >
                Boutique
              </button>

              <a
                href="#apropos"
                onClick={() => setMobileMenu(false)}
                className="py-2"
              >
                À propos
              </a>

              <button
                onClick={() => ouvrirPage("commentaires")}
                className="text-left py-2"
              >
                Avis clients
              </button>

              <button
                onClick={allerContact}
                className="bg-[#002B49] text-white px-5 py-3 rounded-xl"
              >
                Contact
              </button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-20 lg:py-36 flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
        <div className="lg:w-3/5 space-y-8">
          <div className="space-y-4">
            <span className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase">
              Transformation Numérique
            </span>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#002B49] leading-[1.05] uppercase italic">
              Erdikoudi - Business :
              <br />
              <span className="text-[#004A7C] not-italic">
                Innover vos solutions
              </span>
            </h2>
          </div>

          <p className="text-slate-500 text-base md:text-xl leading-relaxed max-w-2xl border-l-4 border-[#D4AF37] pl-5">
            Consultation experte et solutions adaptées à tous vos défis
            technologiques. Basé à N'Djamena, nous pilotons votre succès
            numérique global.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={allerContact}
              className="bg-[#002B49] text-white px-7 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#004A7C] transition-all shadow-xl"
            >
              Démarrer un projet
            </button>

            <button
              onClick={() => ouvrirPage("boutique")}
              className="border-2 border-[#D4AF37] text-[#002B49] px-7 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all"
            >
              Voir la boutique
            </button>
          </div>
        </div>

        <div className="lg:w-2/5 relative">
          <div className="absolute -inset-10 bg-[#D4AF37]/10 rounded-full blur-3xl -z-10"></div>

          <img
            src="/tech-innovations.png"
            alt="Innovation technologique"
            className="w-full h-auto drop-shadow-2xl rounded-2xl"
          />
        </div>
      </section>

      <section
        id="services"
        className="bg-[#001D2F] py-24 md:py-32 px-6 md:px-12 lg:px-20 rounded-[3rem_3rem_0_0]"
      >
        <div className="max-w-7xl mx-auto">
          <h3 className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase mb-14 underline decoration-2 underline-offset-8">
            Nos Services
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Informatique & IT",
                icon: "💻",
                desc: "Expertise complète en maintenance et infrastructure réseau.",
              },
              {
                title: "Trading & Crypto",
                icon: "📈",
                desc: "Analyses techniques précises et accompagnement.",
              },
              {
                title: "Solutions Starlink",
                icon: "🛰️",
                desc: "Installation et configuration de kits satellite haut débit.",
              },
              {
                title: "Développement IA",
                icon: "🤖",
                desc: "Création de prompts et guides pour optimiser votre business.",
              },
              {
                title: "Agropastoral",
                icon: "🌱",
                desc: "Accompagnement dans les projets agricoles à haut rendement.",
              },
              {
                title: "Boutique Tech",
                icon: "🛒",
                desc: "Vente de kits Starlink, smartphones et équipements réseau.",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-[#002B49]/50 p-8 rounded-3xl border border-white/5 hover:border-[#D4AF37]/50 transition-all"
              >
                <div className="text-5xl mb-6">{service.icon}</div>

                <h4 className="text-white text-lg font-black uppercase mb-4">
                  {service.title}
                </h4>

                <p className="text-blue-100/50 text-sm leading-relaxed">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="apropos"
        className="py-24 px-6 md:px-12 lg:px-20 bg-white"
      >
        <div className="max-w-7xl mx-auto border-l-8 border-[#002B49] pl-6 md:pl-10">
          <h3 className="text-[#D4AF37] font-black tracking-[0.3em] text-xs uppercase mb-6">
            À propos
          </h3>

          <p className="text-[#002B49] text-2xl md:text-4xl font-black uppercase leading-tight max-w-4xl">
            Erdikoudi Business est le moteur de votre innovation au Tchad.
            Nous combinons expertise informatique et vision stratégique.
          </p>
        </div>
      </section>

      <div className="bg-[#D4AF37] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-around gap-8">
          {[
            { number: "100%", title: "Satisfaction" },
            { number: "N'Djamena", title: "Siège social" },
            { number: "24/7", title: "Support" },
          ].map((item, index) => (
            <div
              key={index}
              className="text-center text-[#002B49]"
            >
              <div className="text-3xl font-black">{item.number}</div>
              <div className="text-[10px] font-black uppercase tracking-widest">
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section
        id="contact"
        className="py-24 px-6 md:px-12 lg:px-20 bg-white"
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-14">
          <div className="lg:w-1/2 space-y-8">
            <h3 className="text-[#002B49] text-4xl font-black uppercase">
              Prêt à collaborer ?
            </h3>

            <div className="space-y-5">
              <p className="font-bold text-[#002B49]">
                📍 Avenue Hassan Djamous, N'Djamena
              </p>

              <p className="font-bold text-[#002B49]">
                📧 abdramanguihini6@gmail.com
              </p>
            </div>

            <button
              onClick={() => ouvrirPage("boutique")}
              className="bg-[#D4AF37] text-[#002B49] px-7 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#002B49] hover:text-white transition-all"
            >
              Visiter la boutique
            </button>
          </div>

          <div className="lg:w-1/2 bg-[#F8FAFC] p-6 md:p-10 rounded-3xl border border-slate-200 shadow-xl">
            <form
              action="https://formspree.io/f/xaqaqgzl"
              method="POST"
              className="space-y-6"
            >
              <input
                name="name"
                type="text"
                required
                placeholder="Nom complet"
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-[#D4AF37]"
              />

              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-[#D4AF37]"
              />

              <textarea
                name="message"
                required
                placeholder="Décrivez votre besoin technologique..."
                rows="5"
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-[#D4AF37]"
              ></textarea>

              <button
                type="submit"
                className="w-full bg-[#002B49] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#004A7C] transition-all"
              >
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}