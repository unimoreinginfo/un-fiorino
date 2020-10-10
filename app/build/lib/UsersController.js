"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertUser = void 0;
const db_1 = __importStar(require("./db"));
const crypto_1 = require("crypto");
exports.insertUser = async (user) => {
    try {
        let row = await db_1.default.query(`SELECT * FROM ( SELECT AES_DECRYPT(email, ${db_1.core.escape(process.env.AES_KEY)}) email, user_id FROM users ) AS result WHERE result.email = ?`, [user.email]);
        if (row.results.length > 0)
            return Promise.reject({ success: false, message: 'already_registered', isUserError: true, user_id: row.results[0].user_id });
        let user_id = crypto_1.randomBytes(32).toString('hex');
        await db_1.default.query(`INSERT INTO users (name, email, user_id) VALUES(AES_ENCRYPT(?, ${db_1.core.escape(process.env.AES_KEY)}), AES_ENCRYPT(?, ${db_1.core.escape(process.env.AES_KEY)}), ?)`, [user.name, user.email, user_id]);
        return Promise.resolve({
            success: true,
            message: 'registered',
            user_id
        });
    }
    catch (err) {
        console.log(err);
        return Promise.reject({
            success: false,
            message: 'generic_error',
            isUserError: true
        });
    }
};
