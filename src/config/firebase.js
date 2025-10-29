import admin from "firebase-admin";

let serviceAccount;

try {
    let key = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!key) {
        throw new Error("Firebase admin is not set.");
    }
    serviceAccount = JSON.parse(key);
} catch (error) {
    console.error("Failed to parse Firebase service account key:", error);
    throw new Error("Failed to parse Firebase service.");
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized");
} else {
    console.log("⚠️ Firebase Admin already initialized");
}

export default admin;
