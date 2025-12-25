require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models/db');

const orderRoutes = require('./routes/order.routes');
const riderRoutes = require('./routes/rider.routes');
const productRoutes = require('./routes/product.routes');
const stopeopsRoutes = require('./routes/storeops.routes');

const app = express();
app.use(bodyParser.json());

app.use('/api/orders', orderRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/storeops', stopeopsRoutes);


const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
