const dotenv = require('dotenv')
dotenv.config()

const MONGODB_URL =process.env.DB_URL;
const PORT =process.env.HTTP_PORT;
const SECRET_KEY =process.env.SECRET_KEY
const GEMINI_API_KEY =process.env.GOOGLE_API
const WS_PORT = process.env.WSPORT

module.exports = { MONGODB_URL, PORT,SECRET_KEY , GEMINI_API_KEY , WS_PORT};