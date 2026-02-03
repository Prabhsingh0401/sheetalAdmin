import admin from "firebase-admin";

const initializeFirebase = () => {
  // Check if Firebase has already been initialized
  if (admin.apps.length > 0) {
    console.log("Firebase Admin SDK already initialized.");
    return;
  }

  try {
    const requiredEnvVars = [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_CLIENT_EMAIL",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    if (missingEnvVars.length > 0) {
      console.warn(
        `Firebase Admin SDK not initialized. Missing environment variables: ${missingEnvVars.join(", ")}`,
      );
      return;
    }

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url:
        process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log(
      "Firebase Admin SDK initialized successfully from environment variables.",
    );
  } catch (error) {
    console.error(
      "Error initializing Firebase Admin SDK from environment variables:",
      error,
    );
  }
};

export default initializeFirebase;
