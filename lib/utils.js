"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainToCerts = void 0;
/**
 * Splits string of pem keys to array of pem keys
 * @param {string} chain - String of aggregated pem certs
 * @return {string[]} - Array of pem cert string
 */
function chainToCerts(chain) {
    return chain.split(/\n(?=-----BEGIN CERTIFICATE-----)/g);
}
exports.chainToCerts = chainToCerts;
//# sourceMappingURL=utils.js.map