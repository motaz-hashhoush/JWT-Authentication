const { body } = require("express-validator");
const db = require('../database/db')

const loginSchema = [

    body('email')
    .isEmail()
    .withMessage('email must contain a valid email addres')

]


const signupSchema = [

    body('email')
    .isEmail()
    .withMessage('email must contain a valid email addres'),

    body('password')
    .isLength({ min: 6 })
    .withMessage('length of password must be at least 6 characters'),

    body('phone')
    .isNumeric()
    .notEmpty()
    .isLength({ max: 10 })
    .withMessage('length of phone must be at most 10 digit'),

    body('firstName')
    .notEmpty(),
    body('lastName')
    .notEmpty(),

    body('city')
    .notEmpty()
    .withMessage('city must be at exists and not empty'),

    body('gender')
    .custom((value, { req }) => {

        if (value == undefined) throw new Error('gender must be at exists and not empty')

        if (value.toLowerCase() != 'male' && value.toLowerCase() != 'female')
            throw new Error('gender must be male or female')
        return true
    }),

    body('repassword').custom((pass, { req }) => {

        if (pass !== req.body.password)
            throw new Error('Password confirmation does not match password')
        return true
    }),

    body('email').custom(async(email, { req }) => {
        let [result, response] = await db.connection.execute(`SELECT count(email) as 'len' FROM users.user where email='${email}';`)

        if (result[0].len > 0)
            throw new Error('Email is oredy exsist try anther email')
        return true
    }),

    body('phone').custom(async(phone, { req }) => {
        let [result, response] = await db.connection.execute(`SELECT count(phone) as 'len' FROM users.user where phone=${phone};`)

        if (result[0].len > 0)
            throw new Error('Phone is oredy exsist')
        return true
    })

]


module.exports.SignupSchema = signupSchema;
module.exports.LoginSchema = loginSchema;