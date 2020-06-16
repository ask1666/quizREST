const jwt = require('jsonwebtoken');

/*
*Get jwt token from header ang verify it against the secret key and save the userId for use in request
*/
module.exports = function(req,res,next) {
    const token = req.header('authToken');
    if (!token) return res.status(401).send('Access Denied.');
    
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.userId = verified._id;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token.');
    }
}

