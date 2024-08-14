const multer = require('multer');

// Configure multer to store files (you can customize the storage if needed)
const upload = multer({
    storage: multer.memoryStorage(), // You can use diskStorage if you prefer
    limits: { fileSize: 5 * 1024 * 1024 }, // Set a file size limit (5MB in this case)
});

module.exports={upload}
