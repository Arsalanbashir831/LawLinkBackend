const Post = require('../models/Posts'); 
const User = require('../models/User');
const Rating = require('../models/Ratings')

const checkLawyer = async (user_id) => {
    const user = await User.findById(user_id);
    if (!user) {
        throw new Error('User not found');
    }
    if (user.type !== 'lawyer') {
        throw new Error('User is not authorized to perform this action');
    }
    return user;
};

const createPost = async (req, res) => {
    try {
        const { post_title, post_description } = req.body;
        const user_id = req.user._id; 
        await checkLawyer(user_id);
        const post = new Post({ post_title, post_description, user_id });
        await post.save();
        
        res.status(201).send(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(400).send({ error: error.message || 'Failed to create post' });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const user_id = req.user._id;
        await checkLawyer(user_id);
        const posts = await Post.find().populate('user_id', 'username email profilePic degreePic');

        const ratings = await Rating.aggregate([
            {
                $group: {
                    _id: "$lawyerId",
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                }
            }
        ]);
        const ratingsMap = ratings.reduce((map, item) => {
            map[item._id.toString()] = {
                avgRating: item.avgRating,
                count: item.count
            };
            return map;
        }, {});
        const formattedPosts = posts.map(post => {
            const lawyerRating = ratingsMap[post.user_id._id.toString()] || { avgRating: 0, count: 0 };
            return {
                _id: post._id,
                post_title: post.post_title,
                post_description: post.post_description,
                user: {
                    _id: post.user_id._id,
                    username: post.user_id.username,
                    email: post.user_id.email,
                    profile_pic: post.user_id.profilePic,
                    degree_pic: post.user_id.degreePic,
                    avgRating: lawyerRating.avgRating, 
                    ratingCount: lawyerRating.count 
                }
            };
        });

        res.status(200).send(formattedPosts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(400).send({ error: error.message || 'Failed to fetch posts' });
    }
};


const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user._id; 
        await checkLawyer(user_id);

        const post = await Post.findById(id).populate('user_id', 'username email profilePic degreePic');
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }
        const formattedPosts = {
            _id: post._id,
            post_title: post.post_title,
            post_description: post.post_description,
            user: {
                _id: post.user_id._id,
                username: post.user_id.username,
                email: post.user_id.email,
                profile_pic : post.user_id.profilePic,
                degree_pic : post.user_id.degreePic
            }
        };

        res.status(200).send(formattedPosts);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(400).send({ error: error.message || 'Failed to fetch post' });
    }
};

// Update a post by ID
const updatePostById = async (req, res) => {
    try {
        const { id } = req.params;
        const { post_title, post_description } = req.body;
        const user_id = req.user._id; 
        await checkLawyer(user_id);

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }
        
        post.post_title = post_title || post.post_title;
        post.post_description = post_description || post.post_description;
        await post.save();
        
        res.status(200).send(post);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(400).send({ error: error.message || 'Failed to update post' });
    }
};

const deletePostById = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user._id;
        await checkLawyer(user_id);
        const post = await Post.findByIdAndDelete(id);

        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }
        res.status(200).send({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(400).send({ error: error.message || 'Failed to delete post' });
    }
};

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    updatePostById,
    deletePostById,
};