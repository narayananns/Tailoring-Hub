import React from 'react';
import './OrderTimeline.css';

const OrderTimeline = ({ status, createdAt, updatedAt }) => {
    const steps = [
        { label: 'Placed', key: 'pending', icon: '📝' },
        { label: 'Confirmed', key: 'confirmed', icon: '✅' },
        { label: 'Shipped', key: 'shipped', icon: '🚚' },
        { label: 'Delivered', key: 'delivered', icon: '📦' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === status.toLowerCase());
    const isCancelled = status.toLowerCase() === 'cancelled';

    if (isCancelled) {
        return (
            <div className="order-timeline cancelled">
                <div className="timeline-step active cancelled-step">
                    <div className="step-icon">❌</div>
                    <div className="step-label">Order Cancelled</div>
                    <div className="step-date">{updatedAt ? new Date(updatedAt).toLocaleDateString() : ''}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="order-timeline">
            {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isPassed = index < currentStepIndex;
                
                // Connector logic: 
                // - Passed steps have full green connector to next step
                // - Current step has half green connector to next step (progressing...)
                let connectorStatus = '';
                if (isPassed) connectorStatus = 'full';
                else if (isCurrent && index !== steps.length - 1) connectorStatus = 'half';

                return (
                    <div key={step.key} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="step-icon">{step.icon}</div>
                        <div className={`step-connector ${connectorStatus}`}></div>
                        <div className="step-label">{step.label}</div>
                        {isCurrent && updatedAt && (
                            <div className="step-date">{new Date(updatedAt).toLocaleDateString()}</div>
                        )}
                        {index === 0 && !isCurrent && createdAt && (
                            <div className="step-date">{new Date(createdAt).toLocaleDateString()}</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default OrderTimeline;
