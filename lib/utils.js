"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureProvider = exports.sign = void 0;
var crypto_1 = require("crypto");
var ethers_1 = require("ethers");
/**
 * Signs data with pem private key
 * @param pemPrivateKey
 * @param data
 */
function sign(pemPrivateKey, data) {
    var signer = crypto_1.createSign('sha256');
    signer.update(data);
    signer.end();
    var signature = signer.sign(pemPrivateKey).toString('base64');
    return signature;
}
exports.sign = sign;
/**
 * Returns the configured provider
 * @param {ProviderConfig} conf - Configuration for provider
 */
function configureProvider(conf) {
    if (conf === void 0) { conf = {}; }
    if (conf.provider) {
        return conf.provider;
    }
    else if (conf.rpcUrl) {
        return new ethers_1.providers.JsonRpcProvider(conf.rpcUrl);
    }
    else if (conf.web3) {
        return new ethers_1.providers.Web3Provider(conf.web3.currentProvider);
    }
    else {
        return new ethers_1.providers.JsonRpcProvider('http://localhost:8545');
    }
}
exports.configureProvider = configureProvider;
//# sourceMappingURL=utils.js.map