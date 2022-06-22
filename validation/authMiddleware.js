const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    // check json web token exists & is verified
    if (!token) {
        res.redirect('/');
        return;
    }

    jwt.verify(token, 'secret', (err, decodedToken) => {
        if (err) {
            console.log(err.message);
            res.redirect('/');
        } else {
            next();
        }
    });

};

module.exports = { requireAuth };