const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./trybuy.db",
});

const Product = sequelize.define("Product", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  shopify_product_id: { type: DataTypes.BIGINT, unique: true }, // optional
  product_code: { type: DataTypes.STRING, allowNull: false, unique: true }, // internal code
  name: { type: DataTypes.STRING, allowNull: false },
  brand: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING },
});

const Customer = sequelize.define("Customer", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },

  shopify_customer_id: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false,
  },

  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },

  first_name: { type: DataTypes.STRING },
  last_name: { type: DataTypes.STRING },
});

const ProductVariant = sequelize.define("ProductVariant", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.BIGINT, allowNull: false },
  shopify_variant_id: { type: DataTypes.BIGINT, unique: true }, // optional
  size_label: { type: DataTypes.STRING },
  size_value: { type: DataTypes.STRING },
  color: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT, allowNull: false },
  available: { type: DataTypes.BOOLEAN, defaultValue: true },
});



// Orders
const Order = sequelize.define("Order", {
   id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  shopify_order_id: { type: DataTypes.BIGINT, allowNull: false },
  customer_id: { type: DataTypes.BIGINT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: "CREATED" },
  is_try_and_buy: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  order_amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },

  paid_amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  try_and_buy_amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },

  payment_status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "PENDING",
  },
});

// Internal Try & Buy items
const OrderItem = sequelize.define("OrderItem", {
  variant_id: { type: DataTypes.BIGINT, allowNull: false },
  size_label: { type: DataTypes.STRING },
  size_value: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: "SENT" }, // SENT / KEPT / RETURNED
  recommended: { type: DataTypes.BOOLEAN, defaultValue: false },
  reserved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_customer_selected: { type: DataTypes.BOOLEAN, defaultValue: false }, // NEW FLAG
});

Product.hasMany(ProductVariant, { foreignKey: "product_id" });
ProductVariant.belongsTo(Product, { foreignKey: "product_id" });

Customer.hasMany(Order, { foreignKey: "customer_id" });
Order.belongsTo(Customer, { foreignKey: "customer_id" });

OrderItem.belongsTo(ProductVariant, { foreignKey: "variant_id" });
Order.hasMany(OrderItem, { foreignKey: "order_id" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });

module.exports = { sequelize, Order, OrderItem, Product, ProductVariant, Customer };