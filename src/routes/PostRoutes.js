const express = require('express');
const router = express.Router();
const postController = require('../controllers/PostController');
const {aiSearch} = require('../controllers/AISearchController')
const verifyToken = require('../middleware/verifyToken'); 

// Routes for posts
router.post('/posts', verifyToken, postController.createPost);
router.get('/posts/:userType',verifyToken, postController.getAllPosts);
router.get('/userPost', verifyToken, postController.getPostsByUserId);
router.get('/posts/:id', verifyToken, postController.getPostById);
router.put('/posts/:id', verifyToken, postController.updatePostById);
router.delete('/posts/:id', verifyToken, postController.deletePostById);

router.post('/aiSearchPost',verifyToken,aiSearch  );
module.exports = router;
