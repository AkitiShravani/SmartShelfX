const { sequelize, User, Product } = require('./models');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    const vendorPassword = await bcrypt.hash('vendor123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);

    const [vendor] = await User.findOrCreate({
      where: { email: 'vendor@example.com' },
      defaults: {
        name: 'Vendor User',
        username: 'vendor',
        email: 'vendor@example.com',
        password: vendorPassword,
        role: 'VENDOR'
      }
    });

    const [manager] = await User.findOrCreate({
      where: { email: 'manager@example.com' },
      defaults: {
        name: 'Manager User',
        username: 'manager',
        email: 'manager@example.com',
        password: managerPassword,
        role: 'MANAGER'
      }
    });

    await Product.findOrCreate({
      where: { sku: 'SKU-LOW-001' },
      defaults: {
        name: 'Low Stock Product',
        category: 'General',
        sku: 'SKU-LOW-001',
        vendor_id: vendor.id,
        reorder_level: 20,
        current_stock: 5,
        unit_price: 12.5
      }
    });

    await Product.findOrCreate({
      where: { sku: 'SKU-HIGH-002' },
      defaults: {
        name: 'High Risk Product',
        category: 'General',
        sku: 'SKU-HIGH-002',
        vendor_id: vendor.id,
        reorder_level: 50,
        current_stock: 20,
        unit_price: 22.0
      }
    });

    await Product.findOrCreate({
      where: { sku: 'SKU-OK-003' },
      defaults: {
        name: 'In Stock Product',
        category: 'General',
        sku: 'SKU-OK-003',
        vendor_id: vendor.id,
        reorder_level: 10,
        current_stock: 15,
        unit_price: 8.99
      }
    });

    console.log('✅ Seed data inserted.');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await sequelize.close();
  }
})();
