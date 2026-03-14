// Razorpay Configuration
// Only use the Key ID on the frontend - NEVER expose the Key Secret

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

if (!RAZORPAY_KEY_ID) {
    console.error("❌ RAZORPAY_KEY_ID is missing! Please set VITE_RAZORPAY_KEY_ID in your .env file.");
}

export const RAZORPAY_CONFIG = {
    key: RAZORPAY_KEY_ID,
    currency: "INR",
    name: "TMMS",
    description: "Tailoring Machine Management System",
    image: "/vite.svg", // Your logo URL
    theme: {
        color: "#2563eb" // Primary color for Razorpay checkout
    }
};
