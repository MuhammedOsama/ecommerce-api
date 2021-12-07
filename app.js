const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// routes
const products = require('./routes/products');
const categories = require('./routes/categories');
const orders = require('./routes/orders');
const users = require('./routes/users');

// helpers
const authJWT = require('./helpers/jwt');
const errorHandler = require('./helpers/error');

// middlewares
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(cors());
app.options('*', cors());
app.use(authJWT());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);

// connect to db
mongoose.connect(`mongodb+srv://${process.env.DBUSERNAME}:${process.env.DBPASSWORD}@${process.env.DBSERVER}/${process.env.DB}`)
    .then(() => console.log('Database connected successfully...'))
    .catch((err) => console.log(err));

// routes
const api = process.env.API_URL;
app.use(`${api}/products`, products)
app.use(`${api}/categories`, categories)
app.use(`${api}/orders`, orders)
app.use(`${api}/users`, users)

// port
const PORT = process.env.PORT || 8088;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
