const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { validationResult } = require('express-validator');
const crypto = require('crypto');

const db = require('./database/db')
const { LoginSchema, SignupSchema } = require('./valdation/schema');
const { requireAuth } = require('./valdation/authMiddleware')


const app = express()
const PORT = 3000 // The port the server will be running on
const maxAge = 3 * 24 * 60 * 60 //Maximum time in seconds to store token in the browser

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('./public'))
app.use(cookieParser())

app.listen(PORT, () => {
    console.log(`the server start at port ${PORT}`);
})

createToken = (uuid) => jwt.sign({ uuid }, 'secret', { expiresIn: maxAge }) // create jwt

app.get('/', (req, res) => { res.status(200).sendFile('./public/html/login.html', { root: __dirname }) })
app.get('/signup', (req, res) => { res.status(200).sendFile('./public/html/signup.html', { root: __dirname }) })
app.get('/home', requireAuth, (req, res) => { res.status(200).sendFile('./public/html/home.html', { root: __dirname }) })

app.get('/logout', (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 })
    res.redirect('/')
})

app.get('/user', requireAuth, (req, res) => {

    const token = req.cookies.jwt;

    if (!token) return res.redirect('/');


    jwt.verify(token, 'secret', async(err, decodedToken) => {
        try {
            let [result, response] =
            await db.connection.execute(
                `SELECT first_name, last_name, email, phone, city, gender, birthday \
                FROM users.user where uuid='${decodedToken.uuid}';`);
            result[0].birthday = result[0].birthday.toDateString()
            return res.status(200).json(result[0]);
        } catch (err) {
            return res.status(400).json({
                errors: [{
                    msg: err.message,
                    name: err.name,
                    status: 400
                }]
            });
        }
    })



})

app.post('/login', LoginSchema, async(req, res) => {


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }


    try {

        let [result, response] = await db.connection.execute(`SELECT * FROM users.user where email='${req.body.email}';`)

        if (result.length == 0 || req.body.password != result[0].password)
            throw new Error('Email or password is incorrect')


        const token = createToken(result[0].uuid)
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 }) // save jwt in cookie of browser

        res.status(200).json({
            login: true,
            values: result[0]
        })

    } catch (error) {

        res.status(400).json({
            errors: [{
                msg: error.message,
                name: 'Value Error',
                status: 400
            }]
        })

    }


})


app.post('/signup', SignupSchema, async(req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }

    try {

        await db.connection
            .execute(
                'INSERT INTO user (first_name, last_name, email, phone, city, gender, password, birthday, uuid) VALUES (?,?,?,?,?,?,?,?,?)', [
                    req.body.firstName, req.body.lastName, req.body.email, req.body.phone, req.body.city, req.body.gender, req.body.password, req.body.birthday, crypto.randomUUID()
                ])


        return res.status(200).json({ signup: true })
    } catch (error) {
        return res.status(400).send({
            errors: [{
                signup: false,
                msg: error.message,
                code: error.code,
                sqlState: error.sqlState,
                errno: error.errno,
                status: 400
            }]
        })
    }



})