import React from 'react'

const Spinner = ({ size = 'medium', color = 'var(--primary-color)' }) => {
    const sizeMap = {
        small: '20px',
        medium: '40px',
        large: '60px'
    }

    const styles = {
        container: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem'
        },
        spinner: {
            width: sizeMap[size],
            height: sizeMap[size],
            border: `3px solid rgba(255, 255, 255, 0.1)`,
            borderTop: `3px solid ${color}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.spinner} className="animate-spin"></div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default Spinner
