require("dotenv").config();
const firebase = require("firebase-admin");

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: JSON.parse(process.env.FIREBASE_PRIVATE_KEY),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGEBUCKET,
});

const db = firebase.firestore();
const firebaseStorage= firebase.storage();

const checkAuth = (req, res, next) => {
  const accessToken = req.headers["access-token"];
  if (accessToken) {
    db.collection("access")
      .doc(accessToken)
      .get()
      .then((doc) => {
        if (doc.data()) {
          next();
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      })
      .catch((error) => res.status(401).json({ error }));
  } else {
    res.status(401).json({ message: "Unauthorized" });
    // res.status(401).json({ message: "Internal Server Error" });
  }
};

module.exports = { checkAuth, firebaseStorage, db };
