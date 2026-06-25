const { Product, PurchaseOrder, sequelize, User } = require('./models');
const { Op } = require('sequelize');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    const products = await Product.findAll({ include: [{ model: User, as: 'vendor', attributes: ['id', 'name', 'email'] }] });
    console.log('Products:', products.length);
    for (const p of products) {
      const { id, name, sku, current_stock, reorder_level, vendor_id } = p;
      const risk = current_stock === 0 ? 'CRITICAL' : (current_stock <= reorder_level * 0.5 ? 'CRITICAL' : (current_stock <= reorder_level ? 'HIGH' : 'OK'));
      const existing = await PurchaseOrder.findOne({ where: { product_id: id, status: { [Op.in]: ['PENDING', 'APPROVED'] } } });
      console.log(JSON.stringify({ id, name, sku, current_stock, reorder_level, vendor_id, vendor: p.vendor ? { id: p.vendor.id, name: p.vendor.name, email: p.vendor.email } : null, risk, existing: !!existing }));
    }
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await sequelize.close();
  }
})();
