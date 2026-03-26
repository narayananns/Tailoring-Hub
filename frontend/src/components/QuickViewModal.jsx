import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './QuickViewModal.css';

const QuickViewModal = ({ product, isOpen, onClose, onAddToCart }) => {
    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    return (
        <AnimatePresence>
            <div className="quick-view-overlay" onClick={onClose}>
                <motion.div 
                    className="quick-view-content"
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button className="close-btn" onClick={onClose}>&times;</button>
                    
                    <div className="quick-view-grid">
                        <div className="quick-view-image">
                            {product.image?.startsWith('/') || product.image?.startsWith('http') ? (
                                <img src={product.image} alt={product.name} />
                            ) : (
                                <div style={{ fontSize: '6rem' }}>{product.image}</div>
                            )}
                        </div>
                        <div className="quick-view-details">
                            <span className="product-brand">{product.brand || 'Premium Brand'}</span>
                            <h2>{product.name}</h2>
                            <div className="product-meta">
                                <span className={`condition-badge ${product.condition ? product.condition.toLowerCase() : 'new'}`}>
                                    {product.condition || 'New'}
                                </span>
                                {product.speed && <span className="speed-badge">⚡ {product.speed}</span>}
                            </div>
                            <p className="product-price">₹{product.price.toLocaleString()}</p>
                            <p className="product-desc">{product.description}</p>
                            
                            <div className="action-buttons">
                                <button className="btn btn-primary" onClick={() => {
                                    onAddToCart(product);
                                    onClose();
                                }}>
                                    Add to Cart
                                </button>
                                <button className="btn btn-secondary" onClick={onClose}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default QuickViewModal;
