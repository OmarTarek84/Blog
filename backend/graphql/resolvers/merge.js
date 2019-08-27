const DataLoader = require('dataloader');
const User = require('../../models/user');
const Post = require('../../models/post');
const Comment = require('../../models/comment');

var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const transformUser = user => {
    return {
        ...user._doc,
        _id: user._doc._id.toString(),
        createdAt: new Date(user._doc.createdAt).toLocaleDateString("en-US", options),
        updatedAt: new Date(user._doc.updatedAt).toLocaleDateString("en-US", options),
        posts: () => postLoader.loadMany(user._doc.posts),
        password: null
    };
};

const transformPost = post => {
    return {
        ...post._doc,
        _id: post._doc._id.toString(),
        createdAt: new Date(post._doc.createdAt).toLocaleDateString("en-US", options),
        updatedAt: new Date(post._doc.updatedAt).toLocaleDateString("en-US", options),
        comments: () => commentLoader.loadMany(post._doc.comments),
        user: singleUser.bind(this, post._doc.user)
    };
};

const transformComment = comment => {
    return {
        ...comment._doc,
        _id: comment._doc._id.toString(),
        post: singlePost.bind(this, comment._doc.post),
        user: singleUser.bind(this, comment._doc.user),
        createdAt: new Date(comment._doc.createdAt).toLocaleDateString("en-US", options),
        updatedAt: new Date(comment._doc.updatedAt).toLocaleDateString("en-US", options),
    };
};

const userLoader = new DataLoader(userIds => {
    return User.find({_id: {$in: userIds}});
});

const postLoader = new DataLoader(postIds => {
    return allPosts(postIds);
});

const commentLoader = new DataLoader(commentIds => {
    return allComments(commentIds);
});

const allPosts = postIds => {
    return Post.find({_id: {$in: postIds}}).then(posts => {
        return posts.map(post => {
            return transformPost(post);
        });
    });
};

const allComments = commentIds => {
    return Comment.find({_id: {$in: commentIds}}).then(comments => {
        return comments.map(comment => {
            return transformComment(comment);
        });
    });
}

const singleUser = userId => {
    return userLoader.load(userId.toString()).then(user => {
        return user;
    });
};

const singlePost = postId => {
    return postLoader.load(postId.toString()).then(post => {
        return post;
    });
};

exports.transformUser = transformUser;
exports.transformPost = transformPost;
exports.transformComment = transformComment;