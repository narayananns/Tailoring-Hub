// Razorpay Configuration
// Only use the Key ID on the frontend - NEVER expose the Key Secret

export const RAZORPAY_KEY_ID = "rzp_test_RxMuvOMDPvibC4";

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
