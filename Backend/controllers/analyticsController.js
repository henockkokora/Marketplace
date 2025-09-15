const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getAnalytics = async (req, res) => {
  // Helper pour obtenir la période précédente (mois, semaine, année)
  function getPreviousPeriod(range, now) {
    let startPrev, endPrev;
    if (range === 'week') {
      endPrev = new Date(now);
      endPrev.setDate(now.getDate() - 7);
      startPrev = new Date(endPrev);
      startPrev.setDate(endPrev.getDate() - 7);
    } else if (range === 'year') {
      endPrev = new Date(now.getFullYear(), 0, 1);
      startPrev = new Date(now.getFullYear() - 1, 0, 1);
    } else { // month
      endPrev = new Date(now.getFullYear(), now.getMonth(), 1);
      startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }
    return { startPrev, endPrev };
  }

  // Helper pour calculer le changement en pourcentage
  function percentChange(current, prev) {
    if (prev === 0) return current === 0 ? 0 : 100;
    return ((current - prev) / prev) * 100;
  }

  try {
    const range = req.query.range || 'month';
    const now = new Date();
    let startDate;

    if (range === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const orderFilter = {
      createdAt: { $gte: startDate },
      status: { $in: ['pending', 'paid', 'shipped', 'delivered'] }
    };


    const orders = await Order.find(orderFilter).populate('user', 'name email');
    const { startPrev, endPrev } = getPreviousPeriod(range, now);
    const prevOrders = await Order.find({
      createdAt: { $gte: startPrev, $lt: endPrev },
      status: orderFilter.status
    }).populate('user', 'name email');

    // --- Calculs pour la période courante ---
    // Ventes du mois : uniquement les commandes payées et livrées
    const paidOrders = orders.filter(o => ['paid', 'shipped', 'delivered'].includes((o.status || '').toLowerCase()));
    const revenue = paidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const ordersCount = orders.length;
    const deliveredOrders = orders.filter(o => (o.status || '').toLowerCase() === 'delivered');
    const deliveredOrdersCount = deliveredOrders.length;
    const customersCount = new Set(deliveredOrders.map(o => o.user?.email || o.user?.name || o.user?._id)).size;
    const productsCreated = await Product.countDocuments({ createdAt: { $gte: startDate } });

    // --- Calculs pour la période précédente ---
    const prevPaidOrders = prevOrders.filter(o => ['paid', 'shipped', 'delivered'].includes((o.status || '').toLowerCase()));
    const prevRevenue = prevPaidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const prevOrdersCount = prevOrders.length;
    const prevDeliveredOrders = prevOrders.filter(o => (o.status || '').toLowerCase() === 'delivered');
    const prevDeliveredOrdersCount = prevDeliveredOrders.length;
    const prevCustomersCount = new Set(prevDeliveredOrders.map(o => o.user?.email || o.user?.name || o.user?._id)).size;
    const prevProductsCreated = await Product.countDocuments({ createdAt: { $gte: startPrev, $lt: endPrev } });

    // --- Calcul des pourcentages d'évolution ---
    const revenueChange = percentChange(revenue, prevRevenue);
    const ordersChange = percentChange(ordersCount, prevOrdersCount);
    const deliveredChange = percentChange(deliveredOrdersCount, prevDeliveredOrdersCount);
    const customersChange = percentChange(customersCount, prevCustomersCount);
    const productsChange = percentChange(productsCreated, prevProductsCreated);

    // Récupérer les produits les plus cliqués
    const mostClickedProducts = await Product.find({ clicks: { $gt: 0 } })
      .sort({ clicks: -1 })
      .limit(5)
      .select('name category clicks')
      .populate('category', 'name');

    // --- Données pour les graphiques (basées sur toutes les commandes) ---
    const allOrders = await Order.find();
    const productSales = {};
    allOrders.forEach(order => {
      order.products.forEach(p => {
        if (!productSales[p.product]) productSales[p.product] = { name: p.name, category: null, sales: 0, revenue: 0 };
        productSales[p.product].sales += p.quantity;
        productSales[p.product].revenue += (p.price || 0) * p.quantity;
      });
    });

    const productIds = Object.keys(productSales);
    const productsWithCategory = await Product.find({ _id: { $in: productIds } }).populate('category', 'name');
    productsWithCategory.forEach(prod => {
      if (productSales[prod._id]) {
        productSales[prod._id].category = prod.category?.name || 'Autre';
      }
    });

    const topProductsByCategory = {};
    Object.values(productSales).forEach(p => {
      if (!topProductsByCategory[p.category]) topProductsByCategory[p.category] = [];
      topProductsByCategory[p.category].push(p);
    });
    Object.keys(topProductsByCategory).forEach(cat => {
      topProductsByCategory[cat].sort((a, b) => b.sales - a.sales);
      topProductsByCategory[cat] = topProductsByCategory[cat].slice(0, 3);
    });

    const monthlyStats = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(now.getFullYear(), m, 1);
      const end = new Date(now.getFullYear(), m + 1, 1);
      const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= start && new Date(o.createdAt) < end);
      const sales = monthOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      monthlyStats.push({
        month: start.toLocaleString('fr-FR', { month: 'short' }),
        sales,
        orders: monthOrders.length
      });
    }

    // --- Réponse JSON ---
    res.json({
      // Valeurs pour les cartes
      revenue,
      orders: ordersCount,
      deliveredOrders: deliveredOrdersCount,
      products: productsCreated,
      customers: customersCount,

      // Pourcentages d'évolution
      revenueChange: parseFloat(revenueChange.toFixed(1)),
      ordersChange: parseFloat(ordersChange.toFixed(1)),
      deliveredChange: parseFloat(deliveredChange.toFixed(1)),
      customersChange: parseFloat(customersChange.toFixed(1)),
      productsChange: parseFloat(productsChange.toFixed(1)),

      // Données pour les graphiques
      topProductsByCategory,
      monthlyStats,
      mostClickedProducts: mostClickedProducts.map(p => ({
        name: p.name,
        category: p.category?.name || 'Non catégorisé',
        clicks: p.clicks || 0
      })),
      recentOrders: orders.slice(0, 5).map(o => ({
        id: o._id,
        orderNumber: o.orderNumber || `CMD-${o._id.toString().slice(-6).toUpperCase()}`,
        customer: o.user ? (o.user.name || o.user.email) : 'Client anonyme',
        total: o.totalPrice || 0,
        status: o.status || 'pending',
        date: o.createdAt,
        productsCount: o.products ? o.products.length : 0
      }))
    });

  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ 
      error: 'Erreur lors du calcul des statistiques', 
      details: err.message,
      // Retourner des valeurs par défaut en cas d'erreur
      revenue: 0,
      orders: 0,
      deliveredOrders: 0,
      products: 0,
      customers: 0,
      revenueChange: 0,
      ordersChange: 0,
      deliveredChange: 0,
      customersChange: 0,
      productsChange: 0,
      topProductsByCategory: {},
      monthlyStats: [],
      mostClickedProducts: [],
      recentOrders: []
    });
  }
};
