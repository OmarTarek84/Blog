const Post = require('../../models/post');
const User = require('../../models/user');
const Comment = require('../../models/comment');
const {transformPost, transformUser, transformComment} = require('./merge');
const io = require('../../../socket.js');
const webPush = require('web-push');
const Subscription = require('../../models/subscription');

module.exports = {

    createPost: (args, req) => {
        const title = args.postInput.title;
        const body = args.postInput.body;
        const photo = args.postInput.photo;
        if (!req.isAuth) {
            throw new Error('You are not Authorized or session has timedout, please login again to Create a new Post');
        }
        const newPost = new Post({
            title: title,
            body: body,
            photo: photo,
            user: req.userId,
            likes: [],
            comments: []
        });
        return newPost.save().then(result => {
            return User.findOne({_id: req.userId}).populate('followers').then(user => {
                io.getIO().emit('newpost', {
                    newPost: {
                        ...result._doc,
                        user: {
                            _id: user._id,
                            name: user.name,
                            email: user.email,
                            photo: user.photo
                        }
                    }
                });
                user.posts.push(result);
                return user.save().then(s => {
                    return Post.findOne({_id: result._id}).populate('user').then(post => {
                        user.followers.forEach(follower => {
                            if (follower.endpoint.length > 0) {
                                return Subscription.find({_id: follower.endpoint[follower.endpoint.length - 1]}).then(subs => {
                                    return subs.forEach(sub => {
                                        const payload = JSON.stringify({
                                            title: 'New Post Added!',
                                            content: post.user.name + ' Created A new Post!',
                                            postTitle: post.title,
                                            photo: post.photo,
                                            openUrl: 'https://blog-social-network.herokuapp.com/post/' + post._id,
                                            notifyFrom: 'createPost'
                                        });
                                        webPush.sendNotification(sub, payload).catch(err => console.error(err))
                                    });
                                });
                            }
                        });
                    })
                    .then(() => {
                        return transformPost(result);
                    })
                });
            });
        })
        .catch(err => {
            console.log(err);
        });
    },

    posts: (args, req) => {
        return Post.find().populate('likes').populate('comments').then(posts => {
            return posts.map(post => {
                return transformPost(post);
            });
        });
    },

    singlePost: (args, req) => {
        return Post.findOne({_id: args.postId}).populate('likes').then(post => {
            if (!post) {
                throw new Error('Can not fetch your post or post has been deleted');
            }
            return transformPost(post);
        })
        .catch((err) => {
            throw new Error('Can not fetch your post, please try again');
        })
    },

    updatePost: (args, req) => {
        const title = args.updatePostInput.title;
        const body = args.updatePostInput.body;
        const photo = args.updatePostInput.photo;
        if (!req.isAuth) {
            throw new Error('not Authorized or session has timedout, please login again');
        }
        return Post.findOne({_id: args.updatePostInput.id}).populate('likes').then(post => {
            if (!post) {
                throw new Error('Can not Update your post, please try again');
            }
            post.title = title;
            post.body = body;
            post.photo = photo;
            return post.save().then(result => {
                return transformPost(result);
            });
        });
    },

    deletePost: (args, req) => {
        if (!req.isAuth) {
            throw new Error('not Authorized or session has timedout, please login again');
        }
        return Post.findOne({_id: args.postId}).populate('likes').then(post => {
            io.getIO().emit('deletedPost', {
                deletedPost: post
            });
            return Post.deleteOne({_id: args.postId})
                .then(result => {
                    return User.findOne({_id: req.userId}).then(user => {
                        user.posts.pull(post);
                        return Comment.deleteMany({post: args.postId}).then(result => {
                            return user.save().then(res => {
                                return transformUser(res);
                            });
                        })
                    });
                })
        })
    },

    insertComment: (args, req) => {
        const postId = args.postId;
        const comment = args.comment;

        if (!req.isAuth) {
            throw new Error('not Authorized or session has timedout, please login again!');
        }

        return Post.findOne({_id: postId}).populate('likes').populate('comments').populate('user').then(post => {
            if (!post) {
                throw new Error('Can not fetch your post or post has been deleted');
            }
            const newComment = new Comment({
                comment: comment,
                post: post._id,
                user: req.userId
            });

            return newComment.save().then(result => {
                var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                io.getIO().emit('newcomment', {
                    comment: {
                        _id: result._id,
                        createdAt: new Date(result.createdAt).toLocaleDateString("en-US", options),
                        comment: result.comment,
                        user: {name: req.name}
                    }
                });
                post.comments.push(result);
                return post.save().then(res => {
                    return Comment.findOne({_id: result._id}).populate('user').then(comment => {
                        if (post.user.endpoint.length > 0) {
                            return Subscription.find({_id: post.user.endpoint[post.user.endpoint.length - 1]}).then(subs => {
                                return subs.forEach(sub => {
                                    const payload = JSON.stringify({
                                        content: comment.user.name + ' commented on your Post',
                                        notifyFrom: 'insertedComment',
                                        openUrl: 'https://blog-social-network.herokuapp.com/post/' + post._id
                                    });
                                    webPush.sendNotification(sub, payload).catch(err => console.log(err));
                                });
                            });
                        }
                    })
                    .then(() => {
                        return transformComment(result);
                    });
                });
            });
        });
    },

    comments: (args, req) => {
        const postId = args.postId;
        return Comment.find({post: postId}).then(comments => {
            return comments.map(comment => {
                return transformComment(comment);
            });
        });
    },

    likePost: (args, req) => {
        if (!req.isAuth) {
            throw new Error('not Authorized or session has timedout, please login again');
        }

        const postId = args.postId;
        return Post.findOne({_id: postId}).then(post => {
            io.getIO().emit('likePost', {
                like: {
                    _id: req.userId,
                    name: req.name
                }
            });
            post.likes.push(req.userId);
            return post.save().then(res => {
                return transformPost(res);
            });
        })
        .catch(err => {
            throw new Error('server error!');
        });
    },

    unlikePost: (args, req) => {
        if (!req.isAuth) {
            throw new Error('not Authorized or session has timedout, please login again');
        }

        const postId = args.postId;
        return Post.findOne({_id: postId}).then(post => {
            io.getIO().emit('unLikePost', {
                like: {
                    _id: req.userId,
                    name: req.name
                }
            });
            post.likes.pull(req.userId);
            return post.save().then(res => {
                return transformPost(res);
            });
        })
        .catch(err => {
            throw new Error('server error!');
        });
    }

};