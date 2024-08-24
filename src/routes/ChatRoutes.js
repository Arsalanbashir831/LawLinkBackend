const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken'); 
const {getChats} = require('../controllers/ChatController')

router.get('/getChats',verifyToken,getChats)

module.exports = router;