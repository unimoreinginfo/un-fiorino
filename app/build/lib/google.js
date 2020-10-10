"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
exports.default = {
    credentials: JSON.parse(fs_extra_1.readFileSync('./credentials.json').toString('utf-8'))
};
