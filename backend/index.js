const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const AuthRouter = require('./Routes/AuthRouter');
const ProductRouter = require('./Routes/ProductRouter');
const OrderRouter = require('./Routes/OrderRouter');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('./Models/db');
const PORT = process.env.PORT || 8080;

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Health check ping
app.get('/ping', (req, res) => {
    res.send("PONG");
});

// Application Routes
app.use('/auth', AuthRouter);
app.use('/products', ProductRouter);
app.use('/orders', OrderRouter);

app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
});
