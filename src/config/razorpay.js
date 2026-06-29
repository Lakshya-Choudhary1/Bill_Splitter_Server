import Razorpay from "razorpay";

import env from "./env.js";

// Shared Razorpay client used to create payment orders.
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
