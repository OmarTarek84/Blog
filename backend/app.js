const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const graphQlHttp = require('express-graphql');
const schema = require('./graphql/schema/schema.js');
const allResolvers = require('./graphql/resolvers/index.js');
const path = require('path');

const isAuth = require('./middleware/is-auth');
const multer = require('multer');
const compression = require('compression');
const morgan = require('morgan');
const Post = require('./models/post.js');
const User = require('./models/user.js');
const Comment = require('./models/comment.js');
const Subscription = require('./models/subscription.js');
const webPush = require('web-push'); 

// const imagemin = require('imagemin');
// const imageminJpegtran = require('imagemin-jpegtran');
// const imageminPngquant = require('imagemin-pngquant');

const io = require('../socket.js');

const jimp = require('jimp');

app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(compression());
app.use(morgan('common'));

// app.use('/', express.static(path.join(__dirname, 'build')));
app.use('/js', express.static(path.join(__dirname, 'build', 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/compressedimages', express.static(path.join(__dirname, 'compressedimages')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const MIME_TYPE = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg'
  };

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'backend/images');
    },
    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('-');
        const extension = MIME_TYPE[file.mimetype];
        cb(null, name + '-' + Math.floor(Math.random() * 100000000000) + '.' + extension);
    }
});

app.use(multer({storage: storage}).single('image'));

app.use(isAuth);

// app.get('/*', (req, res, next) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.use('/graphql', graphQlHttp({
    schema: schema,
    rootValue: allResolvers,
    graphiql: true
}));

app.post('/insertImage', (req, res, next) => {
    if (!req.file) {
        jimp.read('backend/images/' + 'avatar.jpg').then(image => {
            return image.resize(400, 400).write('backend/images/' + 'avatar.jpg');
        });
        return res.status(201).json({
            filepath: 'http' + '://' + req.get('host') + '/images/' + 'avatar.jpg'
        });
    } else {
        jimp.read('backend/images/' + req.file.filename).then(image => {
            return image.resize(400, 400).write('backend/images/' + req.file.filename);
        });
        return res.status(201).json({
            filepath: 'http' + '://' + req.get('host') + '/images/' + req.file.filename
        });
    }
});

app.post('/insertPostImage', isAuth, multer({storage: storage}).single('image'), (req, res, next) => {
    jimp.read('backend/images/' + req.file.filename).then(image => {
        return image.resize(400, 400).write('backend/images/' + req.file.filename);
    });
    return res.status(201).json({
        filePath: 'http' + '://' + req.get('host') + '/images/' + req.file.filename
    });
});

app.post('/insertupdatePostImage', isAuth, multer({storage: storage}).single('image'), function (req, res, next) {
    if (req.file) {
        jimp.read('backend/images/' + req.file.filename).then(image => {
            return image.resize(400, 400).write('backend/images/' + req.file.filename);
        });
        return res.status(201).json({
            filePath: 'http' + '://' + req.get('host') + '/images/' + req.file.filename
        });
    } else {
        return res.status(201).json({
            filePath: 'notFound'
        });
    }
});

app.post('/sendSyncedPostToDB', (req, res, next) => {
    const title = req.body.title;
    const body = req.body.body;
    const photo = req.body.photo;
    const userId = req.body.userId;
    const newPost = new Post({
        title: title,
        body: body,
        photo: photo,
        user: userId,
        likes: [],
        comments: []
    });
    return newPost.save().then(result => {
        return User.findOne({_id: userId}).then(user => {
            io.getIO().emit('newpost', {
                newPost: {
                    ...result._doc,
                    user: {
                        _id: userId,
                        name: user.name,
                        email: user.email,
                        photo: user.photo
                    }
                }
            });
            user.posts.push(result);
            return user.save().then(s => {
                return res.status(200).json({
                    newpost: result
                });
            });
        });
    })
    .catch(err => {
        console.log(err);
    });
});

app.post('/sendSyncedCommentToDB', (req, res, next) => {
    const postId = req.body.postId;
    const comment = req.body.comment;
    const userId = req.body.userId;
    const token = req.body.token;

    return Post.findOne({_id: postId}).populate('likes').populate('comments').populate('user').then(post => {
        const newComment = new Comment({
            comment: comment,
            post: post._id,
            user: userId
        });

        return newComment.save().then(result => {
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return User.findOne({_id: userId}).then(user => {
                io.getIO().emit('newcomment', {
                    comment: {
                        _id: result._id,
                        createdAt: new Date(result.createdAt).toLocaleDateString("en-US", options),
                        comment: result.comment,
                        user: {name: user.name}
                    }
                });
                post.comments.push(result);
                return post.save().then(() => {
                    return res.status(201).json({
                        newcomment: result
                    });
                });
            });
        });
    });
});

app.post('/subscribe', isAuth, (req, res, next) => {
    webPush.setVapidDetails('mailto:test2@test2.com', 'BLge1u7VbGLVM2pX5awJQlMCWCYk85dIszcMHqwA9MIksA8BPrJrA8x6ZB0OM9QOqbgL-NyqaR9pvKVJYSSgFZM', process.env.PRIVATE_VAPID_KEY);
    const subscription = req.body;
    const newSub = new Subscription(subscription);
    return newSub.save().then((sub) => {
        return User.findOne({_id: req.userId}).then(user => {
            user.endpoint.push(sub._id);
            return user.save().then(() => {
                return res.status(201).json({message: 'subscribed'});
            });
        });
    });
});

app.post('/unsubscribe', isAuth, (req, res, next) => {
    return User.findOne({_id: req.body.userId}).then(user => {
        return Subscription.find({endpoint: req.body.endpoint}).then(subs => {
            return subs.map(sub => {
                user.endpoint.pull(sub._id);
                return user.save();
            });
        });
    })
    .then(() => {
        Subscription.deleteMany({endpoint: req.body.endpoint}).then(result => {
            return res.status(201).json({message: 'unsubscribed'});
        });
    })
    .catch(err => {
        console.log(err);
    });
});

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster1-tmn4p.mongodb.net/${process.env.MONGO_DATABASE}`).then(res => {
    const server = app.listen(process.env.PORT || 8080);
    const socket = io.init(server);
    socket.on('connection', () => {
        console.log('socket connected');
    });
})
.catch(err => {
  console.log(err);
});