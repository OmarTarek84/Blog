const User = require('../../models/user.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {transformUser} = require('./merge');

module.exports = {
    
    createUser: (args, req) => {
        const email = args.userInput.email;
        const name = args.userInput.name;
        const password = args.userInput.password;
        const photo = args.userInput.photo;
        return User.findOne({email: email}).then(user => {
            if (user) {
                throw new Error('User Already Exists');
            }

            if (password == '' || password === null || email == '' || name == '') {
                throw new Error('Form is not Valid');
            }
            return bcrypt.hash(password, 12).then(hashedPass => {
                const user = new User({
                    name: name,
                    email: email,
                    password: hashedPass,
                    photo: photo,
                    posts: [],
                    followers: [],
                    following: [],
                    endpoint: []
                });
                return user.save().then(res => {
                    return transformUser(res);
                });
            });
        });
    },

    loginUser: (args, req) => {
        const email = args.loginInput.email;
        const password = args.loginInput.password;
        return User.findOne({email: email}).then(user => {
            if (!user) {
                throw new Error('Incorrect Email Or Password!');
            }
            return bcrypt.compare(password, user.password).then(doMatch => {
                if (!doMatch) {
                    throw new Error('Incorrect Email Or Password!');
                }
                const token = jwt.sign({
                    email: user.email,
                    userId: user._id,
                    name: user.name
                }, process.env.JWT_SECRET, {
                    expiresIn: '1h'
                });
                return {
                    userId: user._id.toString(),
                    token: token,
                    tokenExpiration: 1
                };
            });
        });
    },

    singleUser: (args, req) => {
        return User.findOne({_id: args.userId}).populate('followers').populate('following').populate('posts').then(user => {
            return transformUser(user);
        });
    },

    editUserProfile: (args, req) => {
        const name = args.editProfileInput.name;
        const email = args.editProfileInput.email;
        const password = args.editProfileInput.password;
        const photo = args.editProfileInput.photo;
        if (!req.isAuth) {
            throw new Error('Not Authorized!');
        }
        return User.findOne({_id: args.editProfileInput.id}).populate('followers').populate('following').populate('posts').then(user => {
            return bcrypt.hash(password, 12).then(hashedPass => {
                user.name = name;
                user.email = email;
                user.password = hashedPass;
                user.photo = photo;
                return user.save().then(result => {
                    return transformUser(result);
                });
            });
        });
    },

    followUser: (args, req) => {
        if (!req.isAuth) {
            throw new Error('Not Authorized');
        }
        const userId = args.userId;
        return User.findOne({_id: userId}).then(user => {
            user.followers.push(req.userId);
            return user.save();
        })
        .then(followedUser => {
            return User.findOne({_id: req.userId}).then(followingUser => {
                followingUser.following.push(followedUser);
                return followingUser.save().then(result => {
                    return transformUser(followingUser);
                });
            });
        });
    },

    unFollowUser: (args, req) => {
        if (!req.isAuth) {
            throw new Error('Not Authorized');
        }
        const userId = args.userId;
        return User.findOne({_id: userId}).then(user => {
            user.followers.pull(req.userId);
            return user.save();
        })
        .then(followedUser => {
            return User.findOne({_id: req.userId}).then(followingUser => {
                followingUser.following.pull(followedUser);
                return followingUser.save().then(result => {
                    return transformUser(followingUser);
                });
            });
        });
    },

    users: () => {
        return User.find().populate('followers').populate('following').populate('posts').then(users => {
            return users.map(user => {
                return transformUser(user);
            });
        });
    }

};