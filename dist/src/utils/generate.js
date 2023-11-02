import crypto from "crypto";
export const generateRandomString = (length) => {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, characters.length);
        randomString += characters.charAt(randomIndex);
    }
    return randomString;
};
//# sourceMappingURL=generate.js.map