import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import VisitorMap from './VisitorMap';

const emptyProduct = {
  name: '',
  description: '',
  category: '',
  price: '',
  stock: '',
  image_url: '',
  is_active: true,
};

const NAV_ITEMS = [
  { id: 'dashboard', icon: '🏠', label: 'Tableau de bord' },
  { id: 'analytics', icon: '📊', label: 'Analytics' },
  { id: 'visitors', icon: '👥', label: 'Visiteurs' },
  { id: 'map', icon: '🗺️', label: 'Carte' },
  { id: 'products', icon: '🛍️', label: 'Boutique' },
  { id: 'comments', icon: '💬', label: 'Commentaires' },
  { id: 'orders', icon: '📦', label: 'Commandes' },
  { id: 'ads', icon: '📢', label: 'Publicités' },
  { id: 'settings', icon: '⚙️', label: 'Paramètres' },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function formatDate(date) {
  if (!date) return '-';

  return new Date(date).toLocaleString('fr-FR', {
    timeZone: 'Africa/Ndjamena',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getDayKey(date) {
  if (!date) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Ndjamena',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

function getDayLabel(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Ndjamena',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(date));
}

function isOnline(lastSeen) {
  if (!lastSeen) return false;

  const diff = Date.now() - new Date(lastSeen).getTime();

  return diff <= 2 * 60 * 1000;
}

function Card({ icon, title, value, subtitle, green = false }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div className="text-3xl">{icon}</div>

        {green && (
          <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            EN LIGNE
          </span>
        )}
      </div>

      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>

      <p
        className={`mt-1 text-3xl font-black ${
          green ? 'text-green-600' : 'text-[#002B49]'
        }`}
      >
        {formatNumber(value)}
      </p>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
          {eyebrow}
        </p>
      )}

      <h2 className="text-2xl font-black text-[#002B49]">{title}</h2>

      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

function MiniBarChart({ data, color = 'bg-[#002B49]' }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-64 items-end gap-3 overflow-x-auto px-2 pb-8">
      {data.map((item) => {
        const height = Math.max((item.value / max) * 180, item.value > 0 ? 8 : 3);

        return (
          <div
            key={item.key}
            className="flex min-w-[55px] flex-1 flex-col items-center justify-end"
          >
            <span className="mb-2 text-xs font-black text-[#002B49]">
              {item.value}
            </span>

            <div
              className={`w-full max-w-[42px] rounded-t-xl ${color}`}
              style={{ height }}
            />

            <span className="mt-2 text-[10px] font-bold text-slate-400">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBars({ data, color = 'bg-[#D4AF37]' }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  if (!data.length) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        Aucune donnée disponible.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {data.map((item) => {
        const width = Math.max((item.value / max) * 100, 3);

        return (
          <div key={item.name}>
            <div className="mb-2 flex justify-between gap-4">
              <span className="truncate text-sm font-bold text-[#002B49]">
                {item.name}
              </span>

              <span className="text-sm font-black text-slate-500">
                {item.value}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [visitorVisits, setVisitorVisits] = useState([]);
  const [visitorSessions, setVisitorSessions] = useState([]);

  // COMMANDES
  const [orders, setOrders] = useState([]);
  const [adRequests, setAdRequests] = useState([]);
  const [updatingAdRequest, setUpdatingAdRequest] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  // FINANCES / VENTES
  const [financePeriod, setFinancePeriod] = useState('month');

  const [commentsCount, setCommentsCount] = useState(0);

  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  /* =========================================================
     AUTHENTIFICATION
  ========================================================= */

  useEffect(() => {
    let active = true;

    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!active) return;

      if (data.session) {
        await verifyOwner(data.session);
      } else {
        setLoading(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;

      setSession(newSession);

      if (!newSession) {
        setAuthorized(false);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const verifyOwner = async (currentSession) => {
    setLoading(true);
    setSession(currentSession);

    if (!currentSession?.user?.id) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentSession.user.id)
      .single();

    if (error || profile?.role !== 'owner') {
      setAuthorized(false);

      setMessage(
        "Ce compte n'a pas les droits administrateur."
      );

      await supabase.auth.signOut();

      setSession(null);
      setLoading(false);

      return;
    }

    setAuthorized(true);
    setMessage('');

    await Promise.all([
      loadProducts(),
      loadVisitorStats(),
      loadCommentsCount(),
      loadOrders(),
      loadAdRequests(),
    ]);

    setLoading(false);
  };

  const login = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(
        'Connexion impossible : vérifie ton email et ton mot de passe.'
      );

      setLoading(false);
      return;
    }

    await verifyOwner(data.session);
  };

  const logout = async () => {
    await supabase.auth.signOut();

    setSession(null);
    setAuthorized(false);
    setProducts([]);
    setVisitorVisits([]);
    setVisitorSessions([]);
    setOrders([]);
    setSelectedOrder(null);
    setMessage('');
  };

  /* =========================================================
     PRODUITS
  ========================================================= */

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('Erreur produits : ' + error.message);
      return;
    }

    setProducts(data || []);
  };

  const changeField = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyProduct);
    setEditingId(null);
  };

  const saveProduct = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage('');

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      image_url: form.image_url.trim(),
      is_active: Boolean(form.is_active),
    };

    if (!productData.name) {
      setMessage('Le nom du produit est obligatoire.');
      setSaving(false);
      return;
    }

    const result = editingId
      ? await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId)
      : await supabase.from('products').insert(productData);

    if (result.error) {
      setMessage(
        'Enregistrement refusé : ' + result.error.message
      );
    } else {
      setMessage(
        editingId
          ? 'Produit modifié avec succès.'
          : 'Produit ajouté avec succès.'
      );

      resetForm();
      await loadProducts();
    }

    setSaving(false);
  };

  const editProduct = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      image_url: product.image_url || '',
      is_active: product.is_active ?? true,
    });

    setActiveSection('products');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const toggleActive = async (product) => {
    const { error } = await supabase
      .from('products')
      .update({
        is_active: !product.is_active,
      })
      .eq('id', product.id);

    if (error) {
      setMessage(
        'Modification refusée : ' + error.message
      );
    } else {
      await loadProducts();
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${product.name} » ?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      setMessage(
        'Suppression refusée : ' + error.message
      );
    } else {
      setMessage('Produit supprimé.');
      await loadProducts();
    }
  };

  /* =========================================================
     VISITEURS
  ========================================================= */

  const loadVisitorStats = async () => {
    const { data: visits, error: visitsError } = await supabase
      .from('visitor_visits')
      .select('*')
      .order('visited_at', { ascending: false })
      .limit(2000);

    if (visitsError) {
      console.error(
        'Erreur visitor_visits :',
        visitsError.message
      );
    } else {
      setVisitorVisits(visits || []);
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('visitor_sessions')
      .select('*')
      .order('last_seen', { ascending: false });

    if (sessionsError) {
      console.error(
        'Erreur visitor_sessions :',
        sessionsError.message
      );
    } else {
      setVisitorSessions(sessions || []);
    }
  };


  /* =========================================================
     COMMANDES
  ========================================================= */

  const loadAdRequests = async () => {
    const { data, error } = await supabase
      .from('advertising_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur advertising_requests :', error.message);
      return;
    }

    setAdRequests(data || []);
  };

  const updateAdRequestStatus = async (id, status) => {
    setUpdatingAdRequest(id);
    const { error } = await supabase
      .from('advertising_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setMessage('Impossible de modifier la demande publicitaire : ' + error.message);
    } else {
      setMessage('Demande publicitaire mise à jour.');
      await loadAdRequests();
    }
    setUpdatingAdRequest(null);
  };

  const deleteAdRequest = async (request) => {
    if (!window.confirm(`Supprimer la demande de « ${request.entreprise} » ?`)) return;
    const { error } = await supabase
      .from('advertising_requests')
      .delete()
      .eq('id', request.id);
    if (error) {
      setMessage('Suppression refusée : ' + error.message);
    } else {
      setMessage('Demande publicitaire supprimée.');
      await loadAdRequests();
    }
  };

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur orders :', error.message);
      setMessage('Erreur commandes : ' + error.message);
      return;
    }

    setOrders(data || []);
  };

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrder(orderId);
    setMessage('');

    const { error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      setMessage('Impossible de modifier la commande : ' + error.message);
    } else {
      setMessage('Statut de la commande mis à jour.');
      await loadOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((current) =>
          current ? { ...current, status, updated_at: new Date().toISOString() } : current
        );
      }
    }

    setUpdatingOrder(null);
  };


  const updatePaymentStatus = async (orderId, payment_status) => {
    setUpdatingOrder(orderId);
    setMessage('');

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      setMessage('Impossible de modifier le paiement : ' + error.message);
    } else {
      setMessage('Statut de paiement mis à jour.');
      await loadOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((current) =>
          current ? { ...current, payment_status, updated_at: new Date().toISOString() } : current
        );
      }
    }

    setUpdatingOrder(null);
  };

  const contactOrderWhatsApp = (order) => {
    const phone = String(order?.customer_phone || '').replace(/\D/g, '');
    if (!phone) {
      setMessage('Ce client n’a pas de numéro de téléphone.');
      return;
    }

    const orderNumber = order.order_number || order.id;
    const message = `Bonjour ${order.customer_name || ''}, concernant votre commande ${orderNumber} chez Erdikoudi Business. Nous vous contactons pour le suivi de votre commande.`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const printOrderInvoice = (order) => {
    const items = getOrderItems(order);
    const total = getOrderTotal(order);

    const rows = items.length
      ? items.map((item) => {
          const quantity = Number(item.quantity || 1);
          const price = Number(item.unit_price ?? item.price ?? 0);
          const subtotal = Number(item.subtotal ?? (price * quantity));
          return `
            <tr>
              <td>${String(item.name || 'Produit')}</td>
              <td style="text-align:center">${quantity}</td>
              <td style="text-align:right">${formatNumber(price)} FCFA</td>
              <td style="text-align:right">${formatNumber(subtotal)} FCFA</td>
            </tr>`;
        }).join('')
      : `<tr><td colspan="4">Aucun article détaillé</td></tr>`;

    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) {
      setMessage('Le navigateur a bloqué la fenêtre d’impression.');
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Facture ${order.order_number || ''}</title>
        <style>
          body{font-family:Arial,sans-serif;margin:40px;color:#172033}
          .head{display:flex;justify-content:space-between;gap:30px;border-bottom:3px solid #D4AF37;padding-bottom:18px}
          h1{margin:0;color:#002B49}
          .gold{color:#9b7a16}
          .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:25px 0}
          .box{background:#f6f8fa;padding:14px;border-radius:10px}
          table{width:100%;border-collapse:collapse;margin-top:20px}
          th,td{padding:10px;border-bottom:1px solid #ddd}
          th{background:#002B49;color:white;text-align:left}
          .total{text-align:right;font-size:22px;font-weight:bold;margin-top:20px;color:#002B49}
          .footer{margin-top:45px;text-align:center;color:#777;font-size:12px}
          @media print{body{margin:15mm}}
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <h1>ERDIKOUDI BUSINESS</h1>
            <div class="gold">Facture / Reçu de commande</div>
          </div>
          <div>
            <strong>${order.order_number || 'Commande'}</strong><br/>
            ${formatDate(order.created_at)}
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <strong>Client</strong><br/>
            ${order.customer_name || '—'}<br/>
            ${order.customer_phone || '—'}<br/>
            ${order.customer_email || ''}
          </div>
          <div class="box">
            <strong>Livraison</strong><br/>
            ${order.city || '—'}<br/>
            ${order.delivery_address || '—'}<br/>
            Paiement : ${order.payment_method || '—'}<br/>
            Statut paiement : ${order.payment_status || 'pending'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th style="text-align:center">Qté</th>
              <th style="text-align:right">Prix</th>
              <th style="text-align:right">Sous-total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="total">TOTAL : ${formatNumber(total)} FCFA</div>

        ${order.note ? `<div class="box" style="margin-top:20px"><strong>Note :</strong><br/>${String(order.note)}</div>` : ''}

        <div class="footer">
          Merci pour votre confiance — Erdikoudi Business
        </div>
        <script>
          window.onload = function(){ window.print(); };
        </script>
      </body>
      </html>
    `);
    popup.document.close();
  };

  const deleteOrder = async (order) => {
    const confirmed = window.confirm(
      `Supprimer définitivement la commande ${order.order_number || order.id}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', order.id);

    if (error) {
      setMessage('Suppression refusée : ' + error.message);
      return;
    }

    setMessage('Commande supprimée.');
    setSelectedOrder(null);
    await loadOrders();
  };

  const getOrderStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      new: 'Nouvelle',
      confirmed: 'Confirmée',
      paid: 'Payée',
      preparing: 'En préparation',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };

    return labels[String(status || '').toLowerCase()] || status || 'En attente';
  };

  const getOrderStatusClass = (status) => {
    const classes = {
      pending: 'bg-blue-50 text-blue-700',
      new: 'bg-blue-50 text-blue-700',
      confirmed: 'bg-indigo-50 text-indigo-700',
      paid: 'bg-emerald-50 text-emerald-700',
      preparing: 'bg-amber-50 text-amber-700',
      shipped: 'bg-purple-50 text-purple-700',
      delivered: 'bg-green-50 text-green-700',
      completed: 'bg-green-50 text-green-700',
      cancelled: 'bg-red-50 text-red-700',
    };

    return classes[String(status || '').toLowerCase()] || 'bg-slate-100 text-slate-600';
  };

  const getOrderTotal = (order) => {
    const value = order?.total_amount ?? order?.total ?? 0;
    return Number(value) || 0;
  };

  const getOrderItems = (order) => {
    if (!order?.items) return [];

    if (Array.isArray(order.items)) return order.items;

    try {
      const parsed = typeof order.items === 'string'
        ? JSON.parse(order.items)
        : order.items;

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const filteredOrders = useMemo(() => {
    const search = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const status = String(order.status || 'pending').toLowerCase();

      const matchesFilter =
        orderFilter === 'all' ||
        (orderFilter === 'pending' && ['pending', 'new'].includes(status)) ||
        (orderFilter === 'confirmed' && status === 'confirmed') ||
        (orderFilter === 'paid' && status === 'paid') ||
        (orderFilter === 'preparing' && status === 'preparing') ||
        (orderFilter === 'shipped' && status === 'shipped') ||
        (orderFilter === 'delivered' && ['delivered', 'completed'].includes(status)) ||
        (orderFilter === 'cancelled' && status === 'cancelled');

      if (!matchesFilter) return false;
      if (!search) return true;

      const haystack = [
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.customer_email,
        order.city,
        order.delivery_address,
        order.payment_method,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [orders, orderFilter, orderSearch]);

  const orderStats = useMemo(() => {
    const pending = orders.filter((o) =>
      ['pending', 'new'].includes(String(o.status || 'pending').toLowerCase())
    ).length;

    const inProgress = orders.filter((o) =>
      ['confirmed', 'paid', 'preparing', 'shipped'].includes(
        String(o.status || '').toLowerCase()
      )
    ).length;

    const delivered = orders.filter((o) =>
      ['delivered', 'completed'].includes(String(o.status || '').toLowerCase())
    ).length;

    const cancelled = orders.filter(
      (o) => String(o.status || '').toLowerCase() === 'cancelled'
    ).length;

    const revenue = orders
      .filter((o) =>
        ['paid', 'delivered', 'completed'].includes(
          String(o.status || '').toLowerCase()
        )
      )
      .reduce((sum, o) => sum + getOrderTotal(o), 0);

    return { pending, inProgress, delivered, cancelled, revenue };
  }, [orders]);


  /* =========================================================
     TABLEAU FINANCIER
  ========================================================= */

  const financeStats = useMemo(() => {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const paidStatuses = ['paid', 'delivered', 'completed'];

    const isPaid = (order) =>
      String(order.payment_status || '').toLowerCase() === 'paid' ||
      paidStatuses.includes(String(order.status || '').toLowerCase());

    const validOrders = orders.filter(
      (order) => String(order.status || '').toLowerCase() !== 'cancelled'
    );

    const revenueOf = (list) =>
      list.filter(isPaid).reduce((sum, order) => sum + getOrderTotal(order), 0);

    const countOf = (list) => list.length;

    const todayOrders = validOrders.filter((o) => new Date(o.created_at) >= startOfDay);
    const weekOrders = validOrders.filter((o) => new Date(o.created_at) >= startOfWeek);
    const monthOrders = validOrders.filter((o) => new Date(o.created_at) >= startOfMonth);

    const todayPaid = todayOrders.filter(isPaid);
    const monthPaid = monthOrders.filter(isPaid);

    const pendingPayments = validOrders.filter(
      (o) => String(o.payment_status || 'pending').toLowerCase() === 'pending'
    );

    const failedPayments = validOrders.filter(
      (o) => String(o.payment_status || '').toLowerCase() === 'failed'
    );

    // 7 derniers jours
    const dailySales = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfDay);
      date.setDate(startOfDay.getDate() - (6 - index));

      const next = new Date(date);
      next.setDate(date.getDate() + 1);

      const dayOrders = validOrders.filter((o) => {
        const created = new Date(o.created_at);
        return created >= date && created < next;
      });

      return {
        date,
        label: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
        shortDate: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        revenue: revenueOf(dayOrders),
        orders: dayOrders.length,
      };
    });

    // Produits les plus vendus
    const productMap = {};

    validOrders.forEach((order) => {
      if (!isPaid(order)) return;

      getOrderItems(order).forEach((item) => {
        const key = item.product_id || item.id || item.name || 'Produit';
        const quantity = Number(item.quantity || 1);
        const price = Number(item.unit_price ?? item.price ?? 0);

        if (!productMap[key]) {
          productMap[key] = {
            name: item.name || 'Produit',
            quantity: 0,
            revenue: 0,
          };
        }

        productMap[key].quantity += quantity;
        productMap[key].revenue += Number(item.subtotal ?? (price * quantity));
      });
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const paymentMap = {};

    monthOrders.forEach((order) => {
      if (!isPaid(order)) return;

      const method = order.payment_method || 'Autre';
      paymentMap[method] = (paymentMap[method] || 0) + getOrderTotal(order);
    });

    const paymentBreakdown = Object.entries(paymentMap)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      todayOrders,
      weekOrders,
      monthOrders,
      todayRevenue: revenueOf(todayOrders),
      weekRevenue: revenueOf(weekOrders),
      monthRevenue: revenueOf(monthOrders),
      todayCount: countOf(todayOrders),
      weekCount: countOf(weekOrders),
      monthCount: countOf(monthOrders),
      todayPaidCount: todayPaid.length,
      monthPaidCount: monthPaid.length,
      pendingPayments,
      failedPayments,
      dailySales,
      topProducts,
      paymentBreakdown,
    };
  }, [orders]);

  const financePeriodData = financePeriod === 'today'
    ? {
        label: "Aujourd'hui",
        revenue: financeStats.todayRevenue,
        orders: financeStats.todayCount,
      }
    : financePeriod === 'week'
      ? {
          label: 'Cette semaine',
          revenue: financeStats.weekRevenue,
          orders: financeStats.weekCount,
        }
      : {
          label: 'Ce mois',
          revenue: financeStats.monthRevenue,
          orders: financeStats.monthCount,
        };

  const refreshAll = async () => {
    setRefreshing(true);

    await Promise.all([
      loadProducts(),
      loadVisitorStats(),
      loadCommentsCount(),
      loadOrders(),
      loadAdRequests(),
    ]);

    setRefreshing(false);
  };

  const loadCommentsCount = async () => {
    const { count, error } = await supabase
      .from('commentaires')
      .select('*', {
        count: 'exact',
        head: true,
      });

    if (!error) {
      setCommentsCount(count || 0);
    }
  };

  /* =========================================================
     DONNÉES CALCULÉES
  ========================================================= */

  const onlineVisitors = useMemo(() => {
    return visitorSessions.filter((sessionItem) =>
      isOnline(sessionItem.last_seen)
    );
  }, [visitorSessions]);

  const todayKey = getDayKey(new Date());

  const todayVisits = useMemo(() => {
    return visitorVisits.filter(
      (visit) => getDayKey(visit.visited_at) === todayKey
    ).length;
  }, [visitorVisits, todayKey]);

  const todayUniqueVisitors = useMemo(() => {
    const ids = new Set();

    visitorVisits.forEach((visit) => {
      if (
        getDayKey(visit.visited_at) === todayKey &&
        visit.visitor_id
      ) {
        ids.add(visit.visitor_id);
      }
    });

    return ids.size;
  }, [visitorVisits, todayKey]);

  const last7Days = useMemo(() => {
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setDate(date.getDate() - i);

      const key = getDayKey(date);

      const count = visitorVisits.filter(
        (visit) => getDayKey(visit.visited_at) === key
      ).length;

      result.push({
        key,
        label: getDayLabel(date),
        value: count,
      });
    }

    return result;
  }, [visitorVisits]);

  const uniqueLast7Days = useMemo(() => {
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setDate(date.getDate() - i);

      const key = getDayKey(date);
      const ids = new Set();

      visitorVisits.forEach((visit) => {
        if (
          getDayKey(visit.visited_at) === key &&
          visit.visitor_id
        ) {
          ids.add(visit.visitor_id);
        }
      });

      result.push({
        key,
        label: getDayLabel(date),
        value: ids.size,
      });
    }

    return result;
  }, [visitorVisits]);

  const cityStats = useMemo(() => {
    const map = {};

    visitorVisits.forEach((visit) => {
      const city = visit.city || 'Ville inconnue';

      map[city] = (map[city] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [visitorVisits]);

  const countryStats = useMemo(() => {
    const map = {};

    visitorVisits.forEach((visit) => {
      const country = visit.country || 'Pays inconnu';

      map[country] = (map[country] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [visitorVisits]);

  const record7Days = Math.max(
    ...last7Days.map((item) => item.value),
    0
  );

  const gpsVisitors = useMemo(() => {
    return visitorVisits.filter(
      (visit) =>
        Number.isFinite(Number(visit.latitude)) &&
        Number.isFinite(Number(visit.longitude))
    );
  }, [visitorVisits]);

  const activeProducts = products.filter(
    (product) => product.is_active
  ).length;

  /* =========================================================
     STOCK
  ========================================================= */

  const stockStats = useMemo(() => {
    const totalUnits = products.reduce(
      (sum, product) => sum + Math.max(Number(product.stock) || 0, 0),
      0
    );

    const outOfStock = products.filter(
      (product) => Number(product.stock) <= 0
    );

    const lowStock = products.filter((product) => {
      const stock = Number(product.stock) || 0;
      return stock > 0 && stock <= 5;
    });

    const inStock = products.filter(
      (product) => Number(product.stock) > 5
    );

    return {
      totalUnits,
      outOfStock,
      lowStock,
      inStock,
    };
  }, [products]);

  /* =========================================================
     STYLE
  ========================================================= */

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white p-3 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20';

  const sectionButton = (id) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
      activeSection === id
        ? 'bg-[#D4AF37] text-[#002B49]'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  /* =========================================================
     LOGIN
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white px-10 py-8 text-center shadow-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#002B49]" />
          <p className="font-black text-[#002B49]">
            Chargement de l'administration...
          </p>
        </div>
      </div>
    );
  }

  if (!session || !authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <form
          onSubmit={login}
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#002B49] text-3xl">
              🔐
            </div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Erdikoudi Business
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#002B49]">
              Backoffice
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Connexion administrateur
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          <label className="mb-2 block text-sm font-bold text-[#002B49]">
            Adresse email
          </label>

          <input
            className={`${inputClass} mb-5`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label className="mb-2 block text-sm font-bold text-[#002B49]">
            Mot de passe
          </label>

          <input
            className={`${inputClass} mb-6`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#002B49] p-4 font-black text-white transition hover:bg-[#D4AF37] hover:text-[#002B49]"
          >
            Se connecter
          </button>

          <a
            href="/"
            className="mt-6 block text-center text-sm font-bold text-slate-500 hover:text-[#002B49]"
          >
            ← Retour au site
          </a>
        </form>
      </main>
    );
  }

  /* =========================================================
     BACKOFFICE
  ========================================================= */

  return (
    <main className="min-h-screen bg-slate-100">
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">
            Erdikoudi
          </p>

          <h1 className="font-black text-[#002B49]">
            Backoffice
          </h1>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-xl bg-[#002B49] px-4 py-2 text-xl text-white"
        >
          ☰
        </button>
      </div>

      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white shadow-xl transition-transform lg:sticky lg:top-0 lg:block lg:h-screen lg:translate-x-0 ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                Erdikoudi Business
              </p>

              <h1 className="mt-1 text-2xl font-black text-[#002B49]">
                Backoffice
              </h1>

              <p className="mt-2 truncate text-xs text-slate-400">
                {session.user.email}
              </p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={sectionButton(item.id)}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="border-t p-4">
              <a
                href="/"
                className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                🌐 Voir le site
              </a>

              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
              >
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </aside>

        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <button
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
          />
        )}

        {/* CONTENT */}
        <section className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {/* TOP HEADER */}
            <header className="mb-8 hidden items-center justify-between lg:flex">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                  Administration
                </p>

                <h2 className="text-3xl font-black text-[#002B49]">
                  {NAV_ITEMS.find(
                    (item) => item.id === activeSection
                  )?.label || 'Tableau de bord'}
                </h2>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={refreshAll}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#002B49]"
                >
                  {refreshing ? '⏳ Actualisation...' : '↻ Actualiser'}
                </button>

                <a
                  href="/"
                  className="rounded-xl bg-[#002B49] px-4 py-3 text-sm font-black text-white"
                >
                  Voir le site
                </a>
              </div>
            </header>

            {message && (
              <div className="mb-6 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 text-sm font-bold text-[#002B49]">
                {message}
              </div>
            )}

            {/* =================================================
                DASHBOARD
            ================================================= */}

            {activeSection === 'dashboard' && (
              <>
                <SectionTitle
                  eyebrow="Vue générale"
                  title="Bonjour 👋"
                  description="Voici l'activité actuelle de votre plateforme."
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card
                    icon="👁️"
                    title="Visites aujourd'hui"
                    value={todayVisits}
                    subtitle="Nombre total de visites"
                  />

                  <Card
                    icon="👤"
                    title="Visiteurs uniques"
                    value={todayUniqueVisitors}
                    subtitle="Aujourd'hui"
                  />

                  <Card
                    icon="🟢"
                    title="Visiteurs en ligne"
                    value={onlineVisitors.length}
                    subtitle="Activité des 2 dernières minutes"
                    green
                  />

                  <Card
                    icon="🏆"
                    title="Record sur 7 jours"
                    value={record7Days}
                    subtitle="Meilleure journée"
                  />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <SectionTitle
                      eyebrow="Analytics"
                      title="Visites des 7 derniers jours"
                      description="Évolution du trafic."
                    />

                    <MiniBarChart data={last7Days} />
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <SectionTitle
                      eyebrow="Audience"
                      title="Visiteurs uniques"
                      description="Personnes différentes par jour."
                    />

                    <MiniBarChart
                      data={uniqueLast7Days}
                      color="bg-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Card
                    icon="🛍️"
                    title="Produits"
                    value={products.length}
                    subtitle={`${activeProducts} visibles`}
                  />

                  <Card
                    icon="💬"
                    title="Commentaires"
                    value={commentsCount}
                    subtitle="Avis enregistrés"
                  />

                  <Card
                    icon="📍"
                    title="Positions GPS"
                    value={gpsVisitors.length}
                    subtitle="Visites avec coordonnées"
                  />
                </div>

                {/* =================================================
                    FINANCES / VENTES
                ================================================== */}
                <div className="mt-8">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">
                        Commerce
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-[#002B49]">
                        💰 Finances & ventes
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Chiffres calculés automatiquement à partir des commandes enregistrées.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {[
                        ['today', "Aujourd'hui"],
                        ['week', 'Cette semaine'],
                        ['month', 'Ce mois'],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setFinancePeriod(id)}
                          className={`rounded-xl px-4 py-2 text-xs font-black ${
                            financePeriod === id
                              ? 'bg-[#002B49] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card
                      icon="💰"
                      title="Chiffre d'affaires"
                      value={financePeriodData.revenue}
                      subtitle={`${financePeriodData.label} · FCFA`}
                    />
                    <Card
                      icon="📦"
                      title="Commandes"
                      value={financePeriodData.orders}
                      subtitle={financePeriodData.label}
                    />
                    <Card
                      icon="💳"
                      title="Paiements reçus"
                      value={financePeriod === 'today'
                        ? financeStats.todayPaidCount
                        : financeStats.monthPaidCount}
                      subtitle="Commandes payées"
                    />
                    <Card
                      icon="⏳"
                      title="Paiements en attente"
                      value={financeStats.pendingPayments.length}
                      subtitle="À vérifier"
                    />
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-3">
                    <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black text-[#002B49]">
                            📈 Ventes des 7 derniers jours
                          </h3>
                          <p className="text-xs text-slate-500">
                            Chiffre d'affaires des commandes payées / livrées
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          {formatNumber(financeStats.dailySales.reduce((s, d) => s + d.revenue, 0))} FCFA
                        </span>
                      </div>

                      {(() => {
                        const maxRevenue = Math.max(
                          ...financeStats.dailySales.map((day) => day.revenue),
                          1
                        );

                        return (
                          <div className="mt-7 grid h-64 grid-cols-7 items-end gap-2 md:gap-4">
                            {financeStats.dailySales.map((day) => {
                              const height = Math.max(
                                day.revenue > 0 ? (day.revenue / maxRevenue) * 100 : 3,
                                3
                              );

                              return (
                                <div key={day.shortDate} className="flex h-full flex-col items-center justify-end gap-2">
                                  <div className="text-[10px] font-black text-[#002B49]">
                                    {day.revenue > 0 ? `${formatNumber(day.revenue / 1000)}k` : '0'}
                                  </div>
                                  <div className="flex h-44 w-full items-end justify-center rounded-xl bg-slate-100 p-1">
                                    <div
                                      className="w-full max-w-10 rounded-lg bg-[#002B49] transition-all"
                                      style={{ height: `${height}%` }}
                                      title={`${day.shortDate} : ${formatNumber(day.revenue)} FCFA`}
                                    />
                                  </div>
                                  <div className="text-center text-[10px] font-black capitalize text-slate-500">
                                    {day.label}
                                  </div>
                                  <div className="text-[9px] text-slate-400">
                                    {day.shortDate}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-black text-[#002B49]">
                        💳 Paiements
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">Ce mois</p>

                      {financeStats.paymentBreakdown.length === 0 ? (
                        <div className="mt-8 text-center text-sm text-slate-500">
                          Aucun paiement confirmé ce mois.
                        </div>
                      ) : (
                        <div className="mt-6 space-y-4">
                          {financeStats.paymentBreakdown.map((item) => {
                            const total = financeStats.paymentBreakdown.reduce(
                              (sum, p) => sum + p.amount,
                              0
                            );
                            const percent = total > 0 ? (item.amount / total) * 100 : 0;

                            return (
                              <div key={item.method}>
                                <div className="flex justify-between gap-3 text-sm">
                                  <span className="font-bold">{item.method}</span>
                                  <strong>{formatNumber(item.amount)} FCFA</strong>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-[#D4AF37]"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <p className="mt-1 text-right text-[10px] text-slate-400">
                                  {percent.toFixed(0)}%
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black text-[#002B49]">
                            🏆 Produits les plus vendus
                          </h3>
                          <p className="text-xs text-slate-500">Commandes payées / livrées</p>
                        </div>
                      </div>

                      {financeStats.topProducts.length === 0 ? (
                        <p className="mt-6 text-sm text-slate-500">
                          Les produits vendus apparaîtront ici après confirmation des paiements.
                        </p>
                      ) : (
                        <div className="mt-5 space-y-3">
                          {financeStats.topProducts.map((product, index) => (
                            <div
                              key={`${product.name}-${index}`}
                              className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#002B49] text-sm font-black text-white">
                                  {index + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-black text-[#002B49]">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {product.quantity} vendu(s)
                                  </p>
                                </div>
                              </div>
                              <strong className="shrink-0 text-sm text-[#002B49]">
                                {formatNumber(product.revenue)} FCFA
                              </strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-black text-[#002B49]">
                        ⚠️ Suivi des paiements
                      </h3>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-amber-50 p-5">
                          <p className="text-xs font-black uppercase text-amber-700">
                            En attente
                          </p>
                          <p className="mt-1 text-3xl font-black text-amber-800">
                            {financeStats.pendingPayments.length}
                          </p>
                          <p className="mt-1 text-xs text-amber-700">
                            À vérifier / confirmer
                          </p>
                        </div>

                        <div className="rounded-2xl bg-red-50 p-5">
                          <p className="text-xs font-black uppercase text-red-700">
                            Échecs
                          </p>
                          <p className="mt-1 text-3xl font-black text-red-800">
                            {financeStats.failedPayments.length}
                          </p>
                          <p className="mt-1 text-xs text-red-700">
                            Paiements échoués
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSection('orders')}
                        className="mt-5 w-full rounded-2xl bg-[#002B49] px-5 py-4 text-sm font-black text-white"
                      >
                        📦 Gérer les commandes
                      </button>
                    </div>
                  </div>
                </div>

              </>
            )}

            {/* =================================================
                ANALYTICS
            ================================================= */}

            {activeSection === 'analytics' && (
              <>
                <SectionTitle
                  eyebrow="Analytics"
                  title="Analyse des visiteurs"
                  description="Comprendre l'activité de votre site."
                />

                <div className="grid gap-4 md:grid-cols-4">
                  <Card
                    icon="👁️"
                    title="Visites"
                    value={visitorVisits.length}
                  />

                  <Card
                    icon="👤"
                    title="Visiteurs uniques"
                    value={
                      new Set(
                        visitorVisits
                          .map((v) => v.visitor_id)
                          .filter(Boolean)
                      ).size
                    }
                  />

                  <Card
                    icon="🏙️"
                    title="Villes"
                    value={cityStats.length}
                  />

                  <Card
                    icon="🌍"
                    title="Pays"
                    value={countryStats.length}
                  />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <SectionTitle
                      title="Visites des 7 derniers jours"
                      description="Nombre total de visites par jour."
                    />

                    <MiniBarChart data={last7Days} />
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <SectionTitle
                      title="Visiteurs uniques"
                      description="Nombre de visiteurs différents."
                    />

                    <MiniBarChart
                      data={uniqueLast7Days}
                      color="bg-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <SectionTitle
                      title="Visites par ville"
                      description="Les villes qui génèrent le plus de visites."
                    />

                    <HorizontalBars data={cityStats} />
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <SectionTitle
                      title="Visites par pays"
                      description="Répartition géographique."
                    />

                    <HorizontalBars
                      data={countryStats}
                      color="bg-[#004A7C]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* =================================================
                VISITEURS
            ================================================= */}

            {activeSection === 'visitors' && (
              <>
                <SectionTitle
                  eyebrow="Audience"
                  title="Visiteurs"
                  description="Historique et activité des visiteurs."
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <Card
                    icon="👁️"
                    title="Visites"
                    value={visitorVisits.length}
                  />

                  <Card
                    icon="👤"
                    title="Visiteurs uniques"
                    value={
                      new Set(
                        visitorVisits
                          .map((v) => v.visitor_id)
                          .filter(Boolean)
                      ).size
                    }
                  />

                  <Card
                    icon="🟢"
                    title="En ligne"
                    value={onlineVisitors.length}
                    green
                  />
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
                  <div className="border-b p-6">
                    <h3 className="text-xl font-black text-[#002B49]">
                      Dernières visites
                    </h3>

                    <p className="text-sm text-slate-500">
                      Les visiteurs les plus récents.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-4 font-black">Visiteur</th>
                          <th className="p-4 font-black">Ville</th>
                          <th className="p-4 font-black">Pays</th>
                          <th className="p-4 font-black">Page</th>
                          <th className="p-4 font-black">GPS</th>
                          <th className="p-4 font-black">Date</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visitorVisits.slice(0, 100).map((visit) => (
                          <tr
                            key={visit.id}
                            className="border-t hover:bg-slate-50"
                          >
                            <td className="p-4">
                              <div className="font-bold text-[#002B49]">
                                {visit.visitor_id
                                  ? visit.visitor_id.slice(0, 12) + '...'
                                  : 'Visiteur'}
                              </div>
                            </td>

                            <td className="p-4">
                              {visit.city || 'Inconnue'}
                            </td>

                            <td className="p-4">
                              {visit.country || 'Inconnu'}
                            </td>

                            <td className="p-4">
                              {visit.page_path || '/'}
                            </td>

                            <td className="p-4">
                              {visit.latitude &&
                              visit.longitude ? (
                                <span className="font-bold text-green-600">
                                  📍 GPS
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  —
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-slate-500">
                              {formatDate(visit.visited_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#002B49]">
                        🟢 Visiteurs actuellement en ligne
                      </h3>

                      <p className="text-sm text-slate-500">
                        Activité détectée durant les 2 dernières minutes.
                      </p>
                    </div>

                    <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-700">
                      {onlineVisitors.length} en ligne
                    </span>
                  </div>

                  <div className="space-y-3">
                    {onlineVisitors.length === 0 ? (
                      <p className="py-8 text-center text-slate-400">
                        Aucun visiteur actuellement en ligne.
                      </p>
                    ) : (
                      onlineVisitors.map((visitor) => (
                        <div
                          key={visitor.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"
                        >
                          <div>
                            <p className="font-black text-[#002B49]">
                              👤 Visiteur
                            </p>

                            <p className="text-xs text-slate-500">
                              Page : {visitor.page_path || '/'}
                            </p>
                          </div>

                          <span className="flex items-center gap-2 text-xs font-bold text-green-600">
                            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                            En ligne
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* =================================================
                CARTE
            ================================================= */}

            {activeSection === 'map' && (
              <>
                <SectionTitle
                  eyebrow="Géolocalisation"
                  title="Carte des visiteurs"
                  description="Localisation des visiteurs ayant fourni une position géographique."
                />

                <div className="rounded-3xl bg-white p-4 shadow-sm md:p-6">
                  <VisitorMap
                    visitors={visitorVisits}
                    onlineVisitors={onlineVisitors}
                  />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h3 className="mb-5 text-xl font-black text-[#002B49]">
                      📍 Villes détectées
                    </h3>

                    <HorizontalBars data={cityStats} />
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h3 className="mb-5 text-xl font-black text-[#002B49]">
                      🌍 Pays détectés
                    </h3>

                    <HorizontalBars
                      data={countryStats}
                      color="bg-[#004A7C]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* =================================================
                BOUTIQUE
            ================================================= */}

            {activeSection === 'products' && (
              <>
                <SectionTitle
                  eyebrow="Commerce"
                  title="Gestion de la boutique"
                  description="Ajoutez, modifiez et contrôlez vos produits."
                />

                <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
                  {/* FORMULAIRE */}
                  <form
                    onSubmit={saveProduct}
                    className="h-fit rounded-3xl bg-white p-6 shadow-sm"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-[#002B49]">
                          {editingId
                            ? 'Modifier le produit'
                            : 'Ajouter un produit'}
                        </h3>

                        <p className="text-sm text-slate-500">
                          Gestion de votre catalogue.
                        </p>
                      </div>

                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black"
                        >
                          Annuler
                        </button>
                      )}
                    </div>

                    <label className="mb-2 block text-sm font-bold">
                      Nom du produit
                    </label>

                    <input
                      className={`${inputClass} mb-4`}
                      name="name"
                      value={form.name}
                      onChange={changeField}
                      required
                    />

                    <label className="mb-2 block text-sm font-bold">
                      Description
                    </label>

                    <textarea
                      className={`${inputClass} mb-4 min-h-[100px]`}
                      name="description"
                      value={form.description}
                      onChange={changeField}
                    />

                    <label className="mb-2 block text-sm font-bold">
                      Catégorie
                    </label>

                    <input
                      className={`${inputClass} mb-4`}
                      name="category"
                      value={form.category}
                      onChange={changeField}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Prix FCFA
                        </label>

                        <input
                          className={inputClass}
                          name="price"
                          type="number"
                          min="0"
                          value={form.price}
                          onChange={changeField}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Stock
                        </label>

                        <input
                          className={inputClass}
                          name="stock"
                          type="number"
                          min="0"
                          value={form.stock}
                          onChange={changeField}
                        />
                      </div>
                    </div>

                    <label className="mb-2 mt-4 block text-sm font-bold">
                      URL de l'image
                    </label>

                    <input
                      className={`${inputClass} mb-4`}
                      name="image_url"
                      value={form.image_url}
                      onChange={changeField}
                      placeholder="https://..."
                    />

                    <label className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={changeField}
                        className="h-5 w-5"
                      />

                      <span className="text-sm font-bold">
                        Produit visible dans la boutique
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-xl bg-[#002B49] p-4 font-black text-white transition hover:bg-[#D4AF37] hover:text-[#002B49] disabled:opacity-50"
                    >
                      {saving
                        ? 'Enregistrement...'
                        : editingId
                        ? 'Modifier le produit'
                        : 'Ajouter le produit'}
                    </button>
                  </form>

                  {/* STOCK + LISTE PRODUITS */}
                  <div className="space-y-6">
                    {/* RÉSUMÉ DU STOCK */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">📦</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            TOTAL
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-bold text-slate-500">
                          Unités en stock
                        </p>
                        <p className="mt-1 text-3xl font-black text-[#002B49]">
                          {formatNumber(stockStats.totalUnits)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Tous produits confondus
                        </p>
                      </div>

                      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">🟢</span>
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                            OK
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-bold text-slate-500">
                          Produits en stock
                        </p>
                        <p className="mt-1 text-3xl font-black text-green-600">
                          {stockStats.inStock.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Plus de 5 unités
                        </p>
                      </div>

                      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">🟠</span>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                            ALERTE
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-bold text-slate-500">
                          Stock faible
                        </p>
                        <p className="mt-1 text-3xl font-black text-amber-600">
                          {stockStats.lowStock.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          1 à 5 unités
                        </p>
                      </div>

                      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">🔴</span>
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                            URGENT
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-bold text-slate-500">
                          Rupture de stock
                        </p>
                        <p className="mt-1 text-3xl font-black text-red-600">
                          {stockStats.outOfStock.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          0 unité
                        </p>
                      </div>
                    </div>

                    {/* ALERTES STOCK */}
                    {(stockStats.lowStock.length > 0 ||
                      stockStats.outOfStock.length > 0) && (
                      <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                              Surveillance du stock
                            </p>
                            <h3 className="mt-1 text-xl font-black text-[#002B49]">
                              ⚠️ Des produits nécessitent votre attention
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Modifiez directement le stock dans le formulaire
                              produit pour réapprovisionner.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {stockStats.lowStock.length > 0 && (
                              <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-800">
                                🟠 {stockStats.lowStock.length} stock(s) faible(s)
                              </span>
                            )}
                            {stockStats.outOfStock.length > 0 && (
                              <span className="rounded-full bg-red-100 px-4 py-2 text-xs font-black text-red-800">
                                🔴 {stockStats.outOfStock.length} rupture(s)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          {[...stockStats.outOfStock, ...stockStats.lowStock]
                            .slice(0, 8)
                            .map((product) => {
                              const stock = Number(product.stock) || 0;
                              const isOut = stock <= 0;

                              return (
                                <div
                                  key={`alert-${product.id}`}
                                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
                                    isOut
                                      ? 'border-red-100 bg-red-50'
                                      : 'border-amber-100 bg-amber-50'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate font-black text-[#002B49]">
                                      {product.name}
                                    </p>
                                    <p
                                      className={`mt-1 text-xs font-bold ${
                                        isOut
                                          ? 'text-red-700'
                                          : 'text-amber-700'
                                      }`}
                                    >
                                      {isOut
                                        ? 'Rupture de stock'
                                        : `${stock} unité(s) restante(s)`}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => editProduct(product)}
                                    className="shrink-0 rounded-xl bg-[#002B49] px-3 py-2 text-xs font-black text-white"
                                  >
                                    Réapprovisionner
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* LISTE PRODUITS */}
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                            Gestion commerciale
                          </p>

                          <h3 className="mt-1 text-xl font-black text-[#002B49]">
                            Produits & stocks
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {products.length} produit(s) · {activeProducts} visible(s)
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-black text-green-700">
                            🟢 {stockStats.inStock.length} OK
                          </span>
                          <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
                            🟠 {stockStats.lowStock.length} faible(s)
                          </span>
                          <span className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700">
                            🔴 {stockStats.outOfStock.length} rupture(s)
                          </span>
                        </div>
                      </div>

                      {products.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-10 text-center">
                          <div className="mb-3 text-4xl">🛍️</div>
                          <p className="font-bold text-slate-500">
                            Aucun produit.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {products.map((product) => {
                            const stock = Number(product.stock) || 0;

                            const stockState =
                              stock <= 0
                                ? {
                                    label: 'Rupture de stock',
                                    className: 'bg-red-50 text-red-700',
                                    icon: '🔴',
                                  }
                                : stock <= 5
                                ? {
                                    label: `Stock faible · ${stock} restant(s)`,
                                    className: 'bg-amber-50 text-amber-700',
                                    icon: '🟠',
                                  }
                                : {
                                    label: `En stock · ${stock} unité(s)`,
                                    className: 'bg-green-50 text-green-700',
                                    icon: '🟢',
                                  };

                            return (
                              <article
                                key={product.id}
                                className={`flex flex-col gap-4 rounded-2xl border p-4 transition md:flex-row md:items-center ${
                                  stock <= 0
                                    ? 'border-red-100 bg-red-50/30'
                                    : stock <= 5
                                    ? 'border-amber-100 bg-amber-50/20'
                                    : 'border-slate-100'
                                }`}
                              >
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="h-24 w-24 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                                    🛍️
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-black text-[#002B49]">
                                      {product.name}
                                    </h4>

                                    <span
                                      className={`rounded-full px-3 py-1 text-[10px] font-black ${
                                        product.is_active
                                          ? 'bg-green-50 text-green-700'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {product.is_active ? 'VISIBLE' : 'MASQUÉ'}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {product.category || 'Sans catégorie'}
                                    {' · '}
                                    {formatNumber(product.price)} FCFA
                                  </p>

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full px-3 py-1.5 text-xs font-black ${stockState.className}`}
                                    >
                                      {stockState.icon} {stockState.label}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => editProduct(product)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[#002B49]"
                                  >
                                    Modifier
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleActive(product)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
                                  >
                                    {product.is_active
                                      ? 'Masquer'
                                      : 'Afficher'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => deleteProduct(product)}
                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* =================================================
                COMMENTAIRES
            ================================================= */}

            {activeSection === 'comments' && (
              <>
                <SectionTitle
                  eyebrow="Avis clients"
                  title="Commentaires"
                  description="Gestion des avis publiés sur votre site."
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <Card
                    icon="💬"
                    title="Commentaires"
                    value={commentsCount}
                    subtitle="Total enregistré"
                  />
                </div>

                <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
                  <div className="text-5xl">💬</div>

                  <h3 className="mt-4 text-xl font-black text-[#002B49]">
                    Gestion des commentaires
                  </h3>

                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                    La base de données des commentaires est déjà
                    connectée. Nous pourrons ajouter ici la modération,
                    la suppression et la validation des avis.
                  </p>
                </div>
              </>
            )}

            {activeSection === 'ads' && (
              <>
                <SectionTitle
                  eyebrow="Monétisation"
                  title="Publicités"
                  description="Recevez et gérez les demandes des entreprises qui souhaitent apparaître sur Erdikoudi Business."
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <Card icon="📢" title="Demandes" value={adRequests.length} subtitle="Total reçu" />
                  <Card icon="🆕" title="Nouvelles" value={adRequests.filter((item) => item.status === 'new').length} subtitle="À traiter" />
                  <Card icon="✅" title="Acceptées" value={adRequests.filter((item) => item.status === 'accepted').length} subtitle="Campagnes validées" />
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#002B49]">📢 Demandes publicitaires</h3>
                      <p className="text-sm text-slate-500">Toutes les demandes reçues depuis la page Publicité.</p>
                    </div>
                    <button type="button" onClick={loadAdRequests} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-[#002B49]">↻ Actualiser</button>
                  </div>

                  {adRequests.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-6xl">📢</div>
                      <h3 className="mt-4 text-xl font-black text-[#002B49]">Aucune demande pour le moment</h3>
                      <p className="mt-2 text-sm text-slate-500">Les prochaines demandes envoyées depuis /publicite apparaîtront ici.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1050px] text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-4 font-black">Entreprise</th>
                            <th className="p-4 font-black">Contact</th>
                            <th className="p-4 font-black">Publicité</th>
                            <th className="p-4 font-black">Durée</th>
                            <th className="p-4 font-black">Date</th>
                            <th className="p-4 font-black">Statut</th>
                            <th className="p-4 font-black">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adRequests.map((request) => (
                            <tr key={request.id} className="border-t border-slate-100 align-top">
                              <td className="p-4"><p className="font-black text-[#002B49]">{request.entreprise}</p><p className="mt-1 max-w-xs text-xs text-slate-500">{request.message}</p></td>
                              <td className="p-4"><p className="font-bold">{request.responsable}</p><p className="text-xs text-slate-500">{request.telephone}</p><p className="text-xs text-slate-500">{request.email || '—'}</p></td>
                              <td className="p-4 text-xs font-bold">{request.type_publicite}</td>
                              <td className="p-4 text-xs">{request.duree}</td>
                              <td className="p-4 text-xs text-slate-500">{formatDate(request.created_at)}</td>
                              <td className="p-4">
                                <select value={request.status || 'new'} disabled={updatingAdRequest === request.id} onChange={(e) => updateAdRequestStatus(request.id, e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black">
                                  <option value="new">Nouvelle</option>
                                  <option value="contacted">Contactée</option>
                                  <option value="accepted">Acceptée</option>
                                  <option value="rejected">Refusée</option>
                                  <option value="completed">Terminée</option>
                                </select>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-2">
                                  <a href={`https://wa.me/${String(request.telephone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${request.responsable || ''}, nous avons bien reçu votre demande de publicité pour ${request.entreprise || ''} sur Erdikoudi Business.`)}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white">WhatsApp</a>
                                  <button type="button" onClick={() => deleteAdRequest(request)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600">Supprimer</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}


            {/* =================================================
                COMMANDES
            ================================================= */}

            {activeSection === 'orders' && (
              <>
                <SectionTitle
                  eyebrow="Commerce"
                  title="Commandes"
                  description="Gérez les commandes reçues depuis votre boutique."
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <Card
                    icon="🆕"
                    title="Nouvelles"
                    value={orderStats.pending}
                    subtitle="À traiter"
                  />
                  <Card
                    icon="⏳"
                    title="En cours"
                    value={orderStats.inProgress}
                    subtitle="Traitement / livraison"
                  />
                  <Card
                    icon="✅"
                    title="Terminées"
                    value={orderStats.delivered}
                    subtitle="Livrées"
                  />
                  <Card
                    icon="❌"
                    title="Annulées"
                    value={orderStats.cancelled}
                    subtitle="Commandes annulées"
                  />
                  <Card
                    icon="💰"
                    title="Chiffre d'affaires"
                    value={orderStats.revenue}
                    subtitle="Payées / livrées · FCFA"
                  />
                </div>

                <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {[
                        ['all', 'Toutes'],
                        ['pending', 'Nouvelles'],
                        ['confirmed', 'Confirmées'],
                        ['paid', 'Payées'],
                        ['preparing', 'Préparation'],
                        ['shipped', 'Expédiées'],
                        ['delivered', 'Livrées'],
                        ['cancelled', 'Annulées'],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setOrderFilter(id)}
                          className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                            orderFilter === id
                              ? 'bg-[#002B49] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <input
                      className={`${inputClass} lg:max-w-sm`}
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="🔎 N° commande, client, téléphone..."
                    />
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
                  <div className="border-b p-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-black text-[#002B49]">
                          📦 Liste des commandes
                        </h3>
                        <p className="text-sm text-slate-500">
                          {filteredOrders.length} commande(s) affichée(s) sur {orders.length}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={loadOrders}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-[#002B49]"
                      >
                        ↻ Actualiser les commandes
                      </button>
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-6xl">📦</div>
                      <h3 className="mt-4 text-xl font-black text-[#002B49]">
                        Aucune commande trouvée
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Les commandes enregistrées dans Supabase apparaîtront ici automatiquement.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1150px] text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-4 font-black">Commande</th>
                            <th className="p-4 font-black">Client</th>
                            <th className="p-4 font-black">Ville</th>
                            <th className="p-4 font-black">Montant</th>
                            <th className="p-4 font-black">Paiement</th>
                            <th className="p-4 font-black">Statut</th>
                            <th className="p-4 font-black">Date</th>
                            <th className="p-4 font-black">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredOrders.map((order) => (
                            <tr
                              key={order.id}
                              className="border-t align-top hover:bg-slate-50"
                            >
                              <td className="p-4">
                                <p className="font-black text-[#002B49]">
                                  {order.order_number || order.id?.slice(0, 8) || '—'}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {getOrderItems(order).length} article(s)
                                </p>
                              </td>

                              <td className="p-4">
                                <p className="font-bold text-[#002B49]">
                                  {order.customer_name || 'Client'}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {order.customer_phone || 'Téléphone non renseigné'}
                                </p>
                              </td>

                              <td className="p-4">
                                <p>{order.city || '—'}</p>
                                <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                                  {order.delivery_address || 'Adresse non renseignée'}
                                </p>
                              </td>

                              <td className="p-4">
                                <span className="font-black text-[#002B49]">
                                  {formatNumber(getOrderTotal(order))} FCFA
                                </span>
                              </td>

                              <td className="p-4">
                                <p className="font-bold">
                                  {order.payment_method || '—'}
                                </p>
                                <select
                                  value={order.payment_status || 'pending'}
                                  disabled={updatingOrder === order.id}
                                  onChange={(e) =>
                                    updatePaymentStatus(order.id, e.target.value)
                                  }
                                  className={`mt-1 rounded-lg border-0 px-2 py-1 text-[11px] font-black ${
                                    String(order.payment_status || '').toLowerCase() === 'paid'
                                      ? 'bg-green-50 text-green-700'
                                      : String(order.payment_status || '').toLowerCase() === 'failed'
                                        ? 'bg-red-50 text-red-700'
                                        : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  <option value="pending">En attente</option>
                                  <option value="paid">Payé</option>
                                  <option value="failed">Échec</option>
                                  <option value="refunded">Remboursé</option>
                                </select>
                              </td>

                              <td className="p-4">
                                <select
                                  value={order.status || 'pending'}
                                  disabled={updatingOrder === order.id}
                                  onChange={(e) =>
                                    updateOrderStatus(order.id, e.target.value)
                                  }
                                  className={`rounded-full border-0 px-3 py-2 text-xs font-black outline-none ${getOrderStatusClass(order.status)}`}
                                >
                                  <option value="pending">En attente</option>
                                  <option value="confirmed">Confirmée</option>
                                  <option value="paid">Payée</option>
                                  <option value="preparing">En préparation</option>
                                  <option value="shipped">Expédiée</option>
                                  <option value="delivered">Livrée</option>
                                  <option value="cancelled">Annulée</option>
                                </select>
                                <p className="mt-1 text-[10px] font-bold text-slate-400">
                                  {updatingOrder === order.id
                                    ? 'Mise à jour...'
                                    : getOrderStatusLabel(order.status)}
                                </p>
                              </td>

                              <td className="p-4 text-slate-500">
                                {formatDate(order.created_at)}
                              </td>

                              <td className="p-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrder(order)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-[#002B49]"
                                  >
                                    Voir
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => contactOrderWhatsApp(order)}
                                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-black text-white"
                                  >
                                    WhatsApp
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => printOrderInvoice(order)}
                                    className="rounded-lg bg-[#002B49] px-3 py-2 text-xs font-black text-white"
                                  >
                                    Facture
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => deleteOrder(order)}
                                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {selectedOrder && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <button
                      type="button"
                      aria-label="Fermer"
                      className="absolute inset-0"
                      onClick={() => setSelectedOrder(null)}
                    />

                    <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                      <div className="flex items-start justify-between gap-4 border-b pb-5">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">
                            Détail commande
                          </p>
                          <h3 className="mt-1 text-2xl font-black text-[#002B49]">
                            {selectedOrder.order_number || 'Commande'}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(selectedOrder.created_at)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(null)}
                          className="rounded-xl bg-slate-100 px-4 py-2 font-black"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase text-slate-400">Client</p>
                          <p className="mt-2 font-black text-[#002B49]">
                            {selectedOrder.customer_name || '—'}
                          </p>
                          <p className="mt-1 text-sm">{selectedOrder.customer_phone || '—'}</p>
                          <p className="mt-1 text-sm">{selectedOrder.customer_email || '—'}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase text-slate-400">Livraison</p>
                          <p className="mt-2 font-bold">{selectedOrder.city || '—'}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {selectedOrder.delivery_address || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase text-slate-400">Paiement</p>
                            <p className="mt-1 font-black text-[#002B49]">
                              {selectedOrder.payment_method || '—'}
                            </p>
                            <p className="text-sm text-slate-500">
                              Statut paiement : {selectedOrder.payment_status || 'pending'}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black uppercase text-slate-400">Total</p>
                            <p className="mt-1 text-2xl font-black text-[#002B49]">
                              {formatNumber(getOrderTotal(selectedOrder))} FCFA
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="mb-3 text-lg font-black text-[#002B49]">
                          🛒 Articles
                        </h4>

                        {getOrderItems(selectedOrder).length === 0 ? (
                          <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                            Aucun détail d'article disponible.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {getOrderItems(selectedOrder).map((item, index) => {
                              const quantity = Number(item.quantity || 1);
                              const price = Number(item.price || 0);

                              return (
                                <div
                                  key={item.id || index}
                                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4"
                                >
                                  <div>
                                    <p className="font-black text-[#002B49]">
                                      {item.name || 'Produit'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Quantité : {quantity} · Prix : {formatNumber(price)} FCFA
                                    </p>
                                  </div>
                                  <p className="font-black text-[#002B49]">
                                    {formatNumber(price * quantity)} FCFA
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {selectedOrder.note && (
                        <div className="mt-5 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
                          <p className="text-xs font-black uppercase text-[#002B49]">Note</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {selectedOrder.note}
                          </p>
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t pt-5">
                        <button
                          type="button"
                          onClick={() => contactOrderWhatsApp(selectedOrder)}
                          className="rounded-xl bg-green-600 px-5 py-3 text-sm font-black text-white"
                        >
                          WhatsApp client
                        </button>

                        <button
                          type="button"
                          onClick={() => printOrderInvoice(selectedOrder)}
                          className="rounded-xl bg-[#002B49] px-5 py-3 text-sm font-black text-white"
                        >
                          Imprimer facture
                        </button>

                        <select
                          value={selectedOrder.status || 'pending'}
                          disabled={updatingOrder === selectedOrder.id}
                          onChange={(e) =>
                            updateOrderStatus(selectedOrder.id, e.target.value)
                          }
                          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black"
                        >
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="paid">Payée</option>
                          <option value="preparing">En préparation</option>
                          <option value="shipped">Expédiée</option>
                          <option value="delivered">Livrée</option>
                          <option value="cancelled">Annulée</option>
                        </select>

                        <select
                          value={selectedOrder.payment_status || 'pending'}
                          disabled={updatingOrder === selectedOrder.id}
                          onChange={(e) =>
                            updatePaymentStatus(selectedOrder.id, e.target.value)
                          }
                          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black"
                        >
                          <option value="pending">Paiement : en attente</option>
                          <option value="paid">Paiement : payé</option>
                          <option value="failed">Paiement : échec</option>
                          <option value="refunded">Paiement : remboursé</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => deleteOrder(selectedOrder)}
                          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white"
                        >
                          Supprimer la commande
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* =================================================
                PARAMÈTRES
            ================================================= */}

            {activeSection === 'settings' && (
              <>
                <SectionTitle
                  eyebrow="Configuration"
                  title="Paramètres"
                  description="Informations et configuration du backoffice."
                />

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-black text-[#002B49]">
                      👤 Compte administrateur
                    </h3>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Email
                      </p>

                      <p className="mt-1 font-bold text-[#002B49]">
                        {session.user.email}
                      </p>
                    </div>

                    <div className="mt-3 rounded-2xl bg-green-50 p-4">
                      <p className="text-xs font-bold uppercase text-green-600">
                        Autorisation
                      </p>

                      <p className="mt-1 font-black text-green-700">
                        OWNER / ADMINISTRATEUR
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-black text-[#002B49]">
                      🔒 Sécurité
                    </h3>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl bg-green-50 p-4">
                        <p className="font-black text-green-700">
                          ✓ Authentification Supabase
                        </p>
                      </div>

                      <div className="rounded-2xl bg-green-50 p-4">
                        <p className="font-black text-green-700">
                          ✓ Vérification du rôle owner
                        </p>
                      </div>

                      <div className="rounded-2xl bg-green-50 p-4">
                        <p className="font-black text-green-700">
                          ✓ RLS Supabase
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* FOOTER */}
            <footer className="mt-12 border-t border-slate-200 py-8 text-center text-xs text-slate-400">
              Erdikoudi Business · Backoffice sécurisé
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}