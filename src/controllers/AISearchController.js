const { GEMINI_API_KEY } = require('../Constants');
const Post = require('../models/Posts');
const { GoogleGenerativeAI } = require("@google/generative-ai");


const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);


const aiSearch = async (req, res) => {
    const { prompt, lawType } = req.body; // Accepting lawType as an array from the request body

    try {
        let posts;
        if (lawType && lawType.length > 0) {
            posts = await Post.find({ lawType: { $in: lawType } });
        } else {
            posts = await Post.find();
        }

        // Collect search data from posts
        const searchData = posts.map(post => `${post.post_title} ${post.post_description}`).join("\n");

        // If a prompt is provided, generate content based on it
        if (prompt && prompt.trim() !== "") {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                
                const result = await model.generateContent(prompt + "\n\n" + searchData);
                const responseText = await result.response.text();

                // Filter posts based on AI's response
                const relevantPosts = posts.filter(post => 
                    responseText.includes(post.post_title) || 
                    responseText.includes(post.post_description)
                );

                return res.status(200).json({ posts: relevantPosts });
            } catch (apiError) {
                console.error('API Error:', apiError);
                return res.status(500).json({ message: 'Failed to generate content', error: apiError });
            }
        } else {
            // If no prompt is provided, just return the filtered posts
            return res.status(200).json({ posts });
        }
    } catch (error) {
        console.error('Error in AI Search:', error);
        return res.status(500).json({ message: 'An error occurred while searching for posts', error });
    }
};


module.exports = {
    aiSearch,
};
