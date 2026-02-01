import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Buy.css'

function Buy() {
    const [activeTab, setActiveTab] = useState('machines')
    const [toast, setToast] = useState(null)
    const navigate = useNavigate()

    // Tailoring machines for Tiruppur Textile Hub
    const machines = [
        {
            id: 1,
            name: 'Pro-Stitch Industrial Lockstitch LS-5000',
            price: 48500,
            condition: 'New',
            image: '/images/machines/industrial-sewing.png',
            description: 'High-speed lockstitch machine ideal for Tiruppur garment units. 5500 SPM, auto thread trimmer, direct drive motor.',
            brand: 'Pro-Stitch',
            speed: '5500 SPM',
            type: 'machine'
        },
        {
            id: 2,
            name: 'Veeram 4-Thread Overlock Machine',
            price: 35500,
            condition: 'New',
            image: '/images/machines/overlock.png',
            description: 'Professional 4-thread overlock perfect for T-shirt and hosiery production. Auto oil lubrication system.',
            brand: 'Veeram',
            speed: '6000 SPM',
            type: 'machine'
        },
        {
            id: 3,
            name: '4-Head Computerized Embroidery System',
            price: 285000,
            condition: 'New',
            image: '/images/machines/embroidery.png',
            description: 'Multi-head embroidery machine for bulk orders. 1000+ built-in designs, USB pattern loading, touch screen control.',
            brand: 'TechnoStitch',
            speed: '1000 SPM',
            type: 'machine'
        },
        {
            id: 4,
            name: 'Auto-BH 5000 Buttonhole Machine',
            price: 42000,
            condition: 'New',
            image: '/images/machines/buttonhole.png',
            description: 'Automatic buttonhole machine with digital stitch counter. Perfect for shirts and formal wear manufacturing.',
            brand: 'Auto-BH',
            speed: '3600 SPM',
            type: 'machine'
        },
        {
            id: 5,
            name: 'Techno-Stitch Flatlock FL-200',
            price: 38500,
            condition: 'New',
            image: '/images/machines/flatlock.png',
            description: 'Industrial flatlock machine for sportswear & undergarments. 3-needle, 5-thread configuration.',
            brand: 'Techno-Stitch',
            speed: '6000 SPM',
            type: 'machine'
        },
        {
            id: 6,
            name: 'Apex Heavy Duty Zigzag ZZ-1500',
            price: 52000,
            condition: 'New',
            image: '/images/machines/zigzag.png',
            description: 'Cast iron industrial zigzag machine for canvas, denim & heavy fabrics. Built for Tiruppur workloads.',
            brand: 'Apex Industrial',
            speed: '3000 SPM',
            type: 'machine'
        },
        {
            id: 7,
            name: 'Precision Double Needle DN-8100',
            price: 44500,
            condition: 'New',
            image: '/images/machines/double-needle.png',
            description: 'Twin needle lockstitch for parallel stitching. Ideal for jeans, bags & heavy-duty stitching.',
            brand: 'Precision',
            speed: '4000 SPM',
            type: 'machine'
        },
        {
            id: 8,
            name: 'Refurbished Overlock - Budget Saver',
            price: 18500,
            condition: 'Refurbished',
            image: '/images/machines/overlock.png',
            description: 'Fully serviced 4-thread overlock. 6-month warranty. Perfect for startup garment units in Tiruppur.',
            brand: 'Various',
            speed: '5000 SPM',
            type: 'machine'
        },
        {
            id: 9,
            name: 'Refurbished Lockstitch Machine',
            price: 22000,
            condition: 'Refurbished',
            image: '/images/machines/industrial-sewing.png',
            description: 'Tested and certified pre-owned lockstitch. New motor & needle assembly. Great value for new businesses.',
            brand: 'Various',
            speed: '4500 SPM',
            type: 'machine'
        }
    ]

    const spareParts = [
        {
            id: 101,
            name: 'Industrial Needles Pack (100)',
            price: 500,
            category: 'Needles',
            image: '📌',
            type: 'part'
        },
        {
            id: 102,
            name: 'Bobbin Case Universal',
            price: 350,
            category: 'Bobbins',
            image: '🔘',
            type: 'part'
        },
        {
            id: 103,
            name: 'Presser Foot Set (5 pcs)',
            price: 800,
            category: 'Accessories',
            image: '🦶',
            type: 'part'
        },
        {
            id: 104,
            name: 'Motor Belt Premium',
            price: 250,
            category: 'Belts',
            image: '⭕',
            type: 'part'
        },
        {
            id: 105,
            name: 'Threading Kit Complete',
            price: 450,
            category: 'Tools',
            image: '🧰',
            type: 'part'
        },
        {
            id: 106,
            name: 'Oil Bottle (500ml)',
            price: 150,
            category: 'Maintenance',
            image: '🛢️',
            type: 'part'
        }
    ]

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const addToCart = (item) => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const existingIndex = cart.findIndex(i => i.id === item.id && i.type === item.type)

        if (existingIndex >= 0) {
            cart[existingIndex].quantity += 1
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                type: item.type,
                quantity: 1
            })
        }

        localStorage.setItem('cart', JSON.stringify(cart))
        window.dispatchEvent(new Event('cartUpdated'))
        showToast(`${item.name} added to cart!`)
    }

    const buyNow = (item) => {
        // Clear cart and add only this item for immediate checkout
        const checkoutItem = [{
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            type: item.type,
            quantity: 1
        }]
        localStorage.setItem('checkoutItems', JSON.stringify(checkoutItem))
        navigate('/checkout')
    }

    return (
        <div className="buy-page">
            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    <span>{toast.type === 'success' ? '✓' : '!'}</span>
                    {toast.message}
                </div>
            )}

            <div className="page-header">
                <h1>Buy Machines & Parts</h1>
                <p>Explore our collection of quality tailoring machines and genuine spare parts</p>
            </div>

            <section className="section">
                <div className="container">
                    {/* Tab Buttons */}
                    <div className="tab-buttons">
                        <button
                            className={`tab-btn ${activeTab === 'machines' ? 'active' : ''}`}
                            onClick={() => setActiveTab('machines')}
                        >
                            🪡 Tailoring Machines
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'parts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('parts')}
                        >
                            ⚙️ Spare Parts
                        </button>
                    </div>

                    {/* Machines Grid */}
                    {activeTab === 'machines' && (
                        <div className="products-section">
                            <div className="grid grid-3 products-grid">
                                {machines.map((machine) => (
                                    <div key={machine.id} className="product-card card">
                                        <div className="product-image">
                                            <img src={machine.image} alt={machine.name} />
                                        </div>
                                        <div className="product-content">
                                            <div className="product-badges">
                                                <span className={`badge ${machine.condition === 'New' ? 'badge-success' : 'badge-warning'}`}>
                                                    {machine.condition}
                                                </span>
                                                <span className="badge badge-info">{machine.speed}</span>
                                            </div>
                                            <h3 className="product-title">{machine.name}</h3>
                                            <p className="product-brand">{machine.brand}</p>
                                            <p className="product-description">{machine.description}</p>
                                            <div className="product-footer">
                                                <span className="product-price">₹{machine.price.toLocaleString()}</span>
                                                <div className="product-actions">
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => addToCart(machine)}
                                                    >
                                                        🛒 Add to Cart
                                                    </button>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => buyNow(machine)}
                                                    >
                                                        ⚡ Buy Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Spare Parts Grid */}
                    {activeTab === 'parts' && (
                        <div className="products-section">
                            <div className="grid grid-3 products-grid">
                                {spareParts.map((part) => (
                                    <div key={part.id} className="product-card card spare-part-card">
                                        <div className="product-image small">{part.image}</div>
                                        <div className="product-content">
                                            <span className="badge badge-primary">{part.category}</span>
                                            <h3 className="product-title">{part.name}</h3>
                                            <div className="product-footer">
                                                <span className="product-price">₹{part.price.toLocaleString()}</span>
                                                <div className="product-actions">
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => addToCart(part)}
                                                    >
                                                        🛒 Add
                                                    </button>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => buyNow(part)}
                                                    >
                                                        ⚡ Buy
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

export default Buy
