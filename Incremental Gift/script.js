// Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get Price from Firestore
async function fetchPrice() {
    const docRef = doc(db, "pricing", "current");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        document.getElementById("price").textContent = docSnap.data().price;
    }
}

fetchPrice();

// Purchase Button
document.getElementById("buyButton").addEventListener("click", async () => {
    const response = await fetch("/create-checkout-session", { method: "POST" });
    const { id } = await response.json();
    window.location.href = `https://checkout.stripe.com/pay/${id}`;
});
