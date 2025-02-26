import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import admin from "firebase-admin";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

require('dotenv').config(); // Load environment variables from .env file
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve(process.env.FIREBASE_ADMIN_SDK_PATH));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-database-name.firebaseio.com"  // Optional, if you're using Firebase Realtime DB
});

console.log("Firebase Admin Initialized!");

const db = admin.firestore();

// Create Stripe Checkout Session
app.post("/create-checkout-session", async (req, res) => {
    console.log("Received request for checkout session");

    const docRef = db.collection("pricing").doc("current");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        console.error("Error: Pricing data not found");
        return res.status(400).json({ error: "Pricing data not found" });
    }

    const price = docSnap.data().price;
    console.log("Current price:", price);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: { name: "Special Crate" },
                        unit_amount: price * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/success`,
            cancel_url: `${process.env.CLIENT_URL}/`,
        });

        console.log("Session created:", session.id);
        res.json({ id: session.id });
    } catch (error) {
        console.error("Stripe error:", error);
        res.status(500).json({ error: "Stripe session creation failed" });
    }
});


// Stripe Webhook to Increment Price
app.post("/webhook", express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Error: ${err.message}`);
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    // Handle event types here
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Payment was successful!', session);
    }

    res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
