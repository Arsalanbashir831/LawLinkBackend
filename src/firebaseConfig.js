var admin = require("firebase-admin");

var serviceAccount = require("/lawlinks-e33fa-firebase-adminsdk-pcgrt-273653c53e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://lawlinks-e33fa.appspot.com',
});
const bucket = admin.storage().bucket();
module.exports = bucket;