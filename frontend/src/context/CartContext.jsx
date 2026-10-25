import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // 1. Initialize cart from localStorage so it persists across page reloads
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('veggity_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (_err) {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('veggity_cart', JSON.stringify(cartItems));
        } catch (_err) {}
    }, [cartItems]);

    // Add product to cart (or increase quantity by 1)
    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const existingIndex = prevItems.findIndex((item) => item._id === product._id);
            if (existingIndex > -1) {
                // If item already in cart, increment quantity
                const updated = [...prevItems];
                const currentQty = updated[existingIndex].quantity;
                const maxStock = product.quantity || 99;
                if (currentQty < maxStock) {
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        quantity: currentQty + 1
                    };
                }
                return updated;
            } else {
                // Add new item to cart with initial quantity 1
                return [...prevItems, { ...product, quantity: 1 }];
            }
        });
    };

    // Update quantity of an item (+1 or -1). If quantity becomes 0, remove it.
    const updateQuantity = (productId, delta) => {
        setCartItems((prevItems) => {
            return prevItems
                .map((item) => {
                    if (item._id === productId) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean);
        });
    };

    // Remove item completely
    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId));
    };

    // Clear entire cart
    const clearCart = () => {
        setCartItems([]);
    };

    // Total quantity of items in cart
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Total price amount
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Helper: Get current quantity of a specific product in the cart
    const getItemQuantity = (productId) => {
        const item = cartItems.find((it) => it._id === productId);
        return item ? item.quantity : 0;
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                totalItems,
                totalAmount,
                getItemQuantity,
                isCartOpen,
                setIsCartOpen
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

