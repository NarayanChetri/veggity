const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

require('./Models/db');

const AuthRouter = require('./Routes/AuthRouter');
const ProductRouter = require('./Routes/ProductRouter');
const OrderRouter = require('./Routes/OrderRouter');

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (listening on 0.0.0.0 for LAN/mobile access)`);
});
