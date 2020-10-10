"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const google_1 = __importDefault(require("../google"));
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UsersController_1 = require("../UsersController");
const db_1 = __importDefault(require("../db"));
let router = express_1.default.Router();
router.get('/user/:userid', async (req, res) => {
    let user = await db_1.default.query("SELECT * FROM users WHERE user_id = ?", [req.params.userid]);
    console.log(user.results);
    return res.json({
        success: user.results.length > 0,
        telegram: (user.results.length > 0 ? ((user.results[0].telegram_id) ? true : false) : false)
    });
});
router.get('/privacy', async (req, res) => {
    res.render('privacy', {
        title: 'dati raccolti'
    });
});
router.get('/finalize', async (req, res) => {
    let google_stuff = req.query, state_cookie = req.cookies.state;
    if (state_cookie != google_stuff.state || !google_stuff.code)
        return res.render('wtf', {
            title: '???'
        });
    if (google_stuff.hd !== 'studenti.unimore.it')
        return res.render('wrong_profile', {
            title: 'profilo non autorizzato'
        });
    try {
        let google_response = await axios_1.default.post(`https://oauth2.googleapis.com/token`, {
            code: google_stuff.code,
            client_id: google_1.default.credentials.web.client_id,
            client_secret: google_1.default.credentials.web.client_secret,
            redirect_uri: google_1.default.credentials.web.redirect_uris[0],
            grant_type: `authorization_code`
        });
        let decoded = await jsonwebtoken_1.default.decode(google_response.data.id_token);
        let user = { name: decoded.name, email: decoded.email };
        let user_status = await UsersController_1.insertUser(user);
        res.render('nice', {
            title: 'accesso garantito!',
            data: decoded,
            user_id: user_status.user_id
        });
    }
    catch (err) {
        console.log(err);
        if ("isUserError" in err) {
            let user_error = err;
            console.log(user_error);
            if (user_error.message === 'already_registered')
                return res.render('already', {
                    title: 'sei già a posto',
                    user_id: user_error.user_id,
                    group_url: process.env.GROUP_URL
                });
            if (user_error.message === 'generic_error')
                return res.render('error', {
                    title: 'errore 500'
                });
        }
        return res.render('wtf', {
            title: '???'
        });
    }
});
router.get('/login/:state', (req, res) => {
    let auth_url = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${google_1.default.credentials.web.client_id}&scope=email%20profile%20openid&redirect_uri=${google_1.default.credentials.web.redirect_uris[0]}&state=${req.params.state}`;
    return res.status(301).redirect(auth_url);
});
router.get('/', (req, res) => {
    const state = req.cookies.state || crypto_1.randomBytes(64).toString('hex');
    res.cookie('state', state, {
        path: '/',
        domain: process.env.HOST,
        maxAge: 720000,
        httpOnly: true,
        secure: true
    });
    res.render('index', {
        title: 'accedi',
        state
    });
});
module.exports = router;
