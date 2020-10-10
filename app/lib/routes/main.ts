import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto'
import google from '../google';
import axios, { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import { User, insertUser, UserStatus } from '../UsersController'
import db from '../db';

let router = express.Router();

router.get('/user/:userid', async(req: Request, res: Response) => {
    
    let user = await db.query("SELECT * FROM users WHERE user_id = ?", [req.params.userid]);
    console.log(user.results);
    return res.json({
        success: user.results.length > 0,
        telegram: (user.results.length > 0 ? ((user.results[0].telegram_id) ? true : false): false)
    })

})

router.get('/privacy', async(req: Request, res: Response) => {

    res.render('privacy', {

        title: 'dati raccolti'

    })

})

router.get('/finalize', async(req: Request, res: Response) => {

    let google_stuff = req.query,
        state_cookie = req.cookies.state;

    if(state_cookie != google_stuff.state || !google_stuff.code)
        return res.render('wtf', {
            title: '???'
        })
    if(google_stuff.hd !== 'studenti.unimore.it')
        return res.render('wrong_profile', {
            title: 'profilo non autorizzato'
        })
    
    try{

        let google_response: AxiosResponse = await axios.post(
            `https://oauth2.googleapis.com/token`,
            {
                code: google_stuff.code,
                client_id: google.credentials.web.client_id,
                client_secret: google.credentials.web.client_secret,
                redirect_uri: google.credentials.web.redirect_uris[0],
                grant_type: `authorization_code`
            }
        )

        let decoded = await jwt.decode(google_response.data.id_token);
        let user: User = { name: decoded.name, email: decoded.email };
        let user_status = await insertUser(user);

        res.render('nice', {
            title: 'accesso garantito!',
            data: decoded,
            user_id: user_status.user_id!
        })

    }catch(err){

        console.log(err);
        
        if("isUserError" in err){
            
            let user_error = err as UserStatus;
            console.log(user_error);
            
            if(user_error.message === 'already_registered')
                return res.render('already', {
                    title: 'sei già a posto',
                    user_id: user_error.user_id!,
                    group_url: process.env.GROUP_URL!
                })
            
            if(user_error.message === 'generic_error')
                return res.render('error', {
                    title: 'errore 500'
                })

        }
        
        return res.render('wtf', {

            title: '???'

        })

    }

})

router.get('/login/:state', (req: Request, res: Response) => {

    let auth_url = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${google.credentials.web.client_id}&scope=email%20profile%20openid&redirect_uri=${google.credentials.web.redirect_uris[0]}&state=${req.params.state}`;

    return res.status(301).redirect(auth_url);

})

router.get('/', (req: Request, res: Response) => {

    const state: string = req.cookies.state || randomBytes(64).toString('hex');

    res.cookie('state', state, {
        path: '/', 
        domain: process.env.HOST!,
        maxAge: 720000, 
        httpOnly: true, 
        secure: true
    });

    res.render('index', {

        title: 'accedi',
        state

    })

})

export = router;