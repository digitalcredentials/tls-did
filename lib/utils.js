"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureProvider = exports.chainToCerts = void 0;
var ethers_1 = require("ethers");
/**
 * Splits string of pem keys to array of pem keys
 * @param {string} chain - String of aggregated pem certs
 * @return {string[]} - Array of pem cert string
 */
function chainToCerts(chain) {
    return chain.split(/\n(?=-----BEGIN CERTIFICATE-----)/g);
}
exports.chainToCerts = chainToCerts;
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