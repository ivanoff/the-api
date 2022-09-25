"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// return random n-digits code
exports.default = (n = 5) => {
    const min = Math.pow(10, (n - 1));
    const max = Math.pow(10, n) - 1;
    const maxRandom = (Math.floor(max) - Math.ceil(min) + 1);
    return Math.floor(Math.random() * maxRandom) + Math.ceil(min);
};
