"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sign = void 0;
var crypto_1 = require("crypto");
function sign(pemPrivateKey, data) {
    var signer = crypto_1.createSign('sha256');
    signer.update(data);
    signer.end();
    var signature = signer.sign(pemPrivateKey).toString('base64');
    return signature;
}
exports.sign = sign;
//# sourceMappingURL=utils.js.map