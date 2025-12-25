const {
  sequelize,
  Product,
  ProductVariant,
  Customer
} = require("./src/models/db"); // adjust path if needed

async function seed() {
  try {
    await sequelize.sync({ force: true }); // ⚠️ drops tables
    console.log("Database synced");

    //create customer 
    const customer = await Customer.create({
      shopify_customer_id: 999001,
      email: "john.doe@email.com",
      phone: "+91-9999999999",
      first_name: "John",
      last_name: "Doe",
    });

    // 1️⃣ Create Product
    const tshirt1 = await Product.create({
      shopify_product_id: 1,
      product_code: "TSHIRT-001",
      name: "Classic Cotton T-Shirt",
      brand: "FashionCo",
      category: "T-Shirts",
    });

    const tshirt2 = await Product.create({
      shopify_product_id: 2,
      product_code: "TSHIRT-002",
      name: "Classic Cotton T-Shirt",
      brand: "U.S. Polo",
      category: "T-Shirts",
    });

    // 2️⃣ Create Variants
    const variants = await ProductVariant.bulkCreate([
      {
        product_id: tshirt1.id,
        shopify_variant_id: 222001,
        size_label: "S",
        size_value: "32",
        color: "Black",
        price: 499,
      },
      {
        product_id: tshirt1.id,
        shopify_variant_id: 222002,
        size_label: "M",
        size_value: "34",
        color: "Black",
        price: 499,
      },
      {
        product_id: tshirt1.id,
        shopify_variant_id: 222003,
        size_label: "L",
        size_value: "36",
        color: "Black",
        price: 499,
      },
      {
        product_id: tshirt1.id,
        shopify_variant_id: 222004,
        size_label: "M",
        size_value: "34",
        color: "Blue",
        price: 549,
      },
      {
        product_id: tshirt2.id,
        shopify_variant_id: 222005,
        size_label: "S",
        size_value: "32",
        color: "Black",
        price: 499,
      },
      {
        product_id: tshirt2.id,
        shopify_variant_id: 222006,
        size_label: "M",
        size_value: "34",
        color: "Black",
        price: 499,
      },
      {
        product_id: tshirt2.id,
        shopify_variant_id: 222007,
        size_label: "L",
        size_value: "36",
        color: "Black",
        price: 499,
      },
      {
        product_id: tshirt2.id,
        shopify_variant_id: 222008,
        size_label: "M",
        size_value: "34",
        color: "Blue",
        price: 499,
      },
    ]);

    console.log("Seeding completed");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
