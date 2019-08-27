const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        req.isAuth = false;
        return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === '') {
        req.isAuth = false;
        return next();
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch(err) {
        req.isAuth = false;
        return next();
    }

    if (!decodedToken || decodedToken === null) {
        req.isAuth = false;
        req.userId = null;
        return next();
    }

    req.userId = decodedToken.userId;
    req.name = decodedToken.name;
    req.isAuth = true;
    next();
};