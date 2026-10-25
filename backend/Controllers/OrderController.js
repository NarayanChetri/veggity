const OrderModel = require('../Models/Order');
const ProductModel = require('../Models/Product');

// 1. PLACE ORDER (Buyer checks out cart items)
const createOrder = async (req, res) => {
    try {
        const { buyerName, buyerPhone, buyerAddress, buyerLocality, items, paymentMethod = 'Cash on Delivery' } = req.body;

        // Validation
        if (!buyerName || !buyerPhone || !buyerAddress) {
            return res.status(400).json({ success: false, message: 'Please provide name, phone number, and delivery address' });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty' });
        }

        const buyerId = req.user._id;

        // Group cart items by seller so each grower gets their own dedicated order
        const ordersBySeller = {};

        for (const item of items) {
            const sellerId = String(item.seller?._id || item.seller);
            if (!ordersBySeller[sellerId]) {
                ordersBySeller[sellerId] = [];
            }
            ordersBySeller[sellerId].push(item);
        }

        const createdOrders = [];

        // Create an order for each grower
        for (const [sellerId, sellerItems] of Object.entries(ordersBySeller)) {
            let totalAmount = 0;
            const formattedItems = [];

            for (const it of sellerItems) {
                const qty = Number(it.quantity) || 1;
                const price = Number(it.price) || 0;
                const itemTotal = price * qty;
                totalAmount += itemTotal;

                formattedItems.push({
                    product: it._id || it.product,
                    title: it.title,
                    category: it.category || '',
                    price: price,
                    unit: it.unit || 'kg',
                    quantity: qty,
                    itemTotal: itemTotal
                });

                // Deduct stock from ProductModel
                try {
                    const prod = await ProductModel.findById(it._id || it.product);
                    if (prod) {
                        prod.quantity = Math.max(0, prod.quantity - qty);
                        if (prod.quantity === 0) {
                            prod.isAvailable = false;
                        }
                        await prod.save();
                    }
                } catch (stockErr) {
                    console.warn('Could not update product stock:', stockErr);
                }
            }

            const newOrder = new OrderModel({
                buyer: buyerId,
                buyerName: buyerName.trim(),
                buyerPhone: buyerPhone.trim(),
                buyerAddress: buyerAddress.trim(),
                buyerLocality: (buyerLocality || '').trim(),
                seller: sellerId,
                items: formattedItems,
                totalAmount: totalAmount,
                paymentMethod: paymentMethod || 'Cash on Delivery',
                status: 'Received'
            });

            await newOrder.save();
            createdOrders.push(newOrder);
        }

        res.status(201).json({
            success: true,
            message: 'Order placed successfully! The grower has received your details.',
            orders: createdOrders
        });
    } catch (err) {
        console.error('Error in createOrder:', err);
        res.status(500).json({ success: false, message: 'Failed to place order', error: err.message });
    }
};

// 2. GET SELLER ORDERS (Lister Dashboard: View orders received for grower's produce)
const getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.user._id;

        const orders = await OrderModel.find({ seller: sellerId })
            .populate('buyer', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error('Error in getSellerOrders:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch seller orders', error: err.message });
    }
};

// 3. UPDATE ORDER STATUS (Lister Dashboard: Received -> Packed -> Out for Delivery -> Completed)
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const sellerId = req.user._id;

        const validStatuses = ['Received', 'Packed', 'Out for Delivery', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }

        const order = await OrderModel.findOne({ _id: orderId, seller: sellerId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not owned by you' });
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            order
        });
    } catch (err) {
        console.error('Error in updateOrderStatus:', err);
        res.status(500).json({ success: false, message: 'Failed to update order status', error: err.message });
    }
};

// 4. GET SELLER LISTINGS (Lister Dashboard: Manage my active vegetable listings)
const getSellerListings = async (req, res) => {
    try {
        const sellerId = req.user._id;

        const listings = await ProductModel.find({ seller: sellerId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: listings.length,
            listings
        });
    } catch (err) {
        console.error('Error in getSellerListings:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch listings', error: err.message });
    }
};

// 5. DELETE A LISTING (Lister Dashboard: Remove produce)
const deleteSellerListing = async (req, res) => {
    try {
        const { productId } = req.params;
        const sellerId = req.user._id;

        const product = await ProductModel.findOneAndDelete({ _id: productId, seller: sellerId });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Produce not found or not owned by you' });
        }

        res.status(200).json({
            success: true,
            message: 'Produce listing deleted successfully'
        });
    } catch (err) {
        console.error('Error in deleteSellerListing:', err);
        res.status(500).json({ success: false, message: 'Failed to delete listing', error: err.message });
    }
};

// 6. GET BUYER ORDERS (View orders placed by this user as a buyer)
const getBuyerOrders = async (req, res) => {
    try {
        const buyerId = req.user._id;

        const orders = await OrderModel.find({ buyer: buyerId })
            .populate('seller', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error('Error in getBuyerOrders:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch your orders', error: err.message });
    }
};

module.exports = {
    createOrder,
    getSellerOrders,
    updateOrderStatus,
    getSellerListings,
    deleteSellerListing,
    getBuyerOrders
};
