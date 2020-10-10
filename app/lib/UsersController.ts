import db, { core } from './db';
import { randomBytes } from 'crypto';

export interface User {
    name: string,
    email: string
}

export interface UserStatus {
    success: boolean,
    message: PossibleStatus,
    user_id?: string,
    isUserError?: boolean
}

type PossibleStatus = "already_registered" | "generic_error" | "registered";

export const insertUser = async(user: User): Promise<UserStatus> => {

    try{

        let row = await db.query(`SELECT * FROM ( SELECT AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email, user_id FROM users ) AS result WHERE result.email = ?`, [user.email]);
        if(row.results.length > 0)
            return Promise.reject({ success: false, message: 'already_registered', isUserError: true, user_id: row.results[0].user_id });
        
        let user_id = randomBytes(32).toString('hex');
        await db.query(`INSERT INTO users (name, email, user_id) VALUES(AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }), AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }), ?)`, [user.name, user.email, user_id]);

        return Promise.resolve({
            success: true,
            message: 'registered',
            user_id
        })

    }catch(err){

        console.log(err);
        
        return Promise.reject({
            success: false,
            message: 'generic_error',
            isUserError: true
        })

    }

}