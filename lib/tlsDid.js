"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TLSDID = void 0;
var ethers_1 = require("ethers");
var tls_did_resolver_1 = require("tls-did-resolver");
var TLSDID_json_1 = __importDefault(require("tls-did-registry/build/contracts/TLSDID.json"));
var TLSDIDRegistry_json_1 = __importDefault(require("tls-did-registry/build/contracts/TLSDIDRegistry.json"));
var utils_1 = require("./utils");
//TODO import from tls-did-registry or tls-did-resolver
var REGISTRY = '0xA725A297b0F81c502df772DBE2D0AEb68788679b';
var TLSDID = /** @class */ (function () {
    /**
     * //TODO Allow for general provider type, see ethr-did implementation
     * Creates an instance of tlsdid.
     * @param {string} pemPrivateKey - TLS private key
     * @param {string} ethereumPrivateKey - ethereum private key with enougth
     * funds to pay for transactions
     * @param {string} [registry] - ethereum address of TLS DID Contract Registry
     * @param {IProviderConfig} providerConfig - config for ethereum provider {}
     */
    function TLSDID(pemPrivateKey, ethereumPrivateKey, registry, providerConfig) {
        if (registry === void 0) { registry = REGISTRY; }
        if (providerConfig === void 0) { providerConfig = {}; }
        this.attributes = [];
        this.registry = registry;
        this.pemPrivateKey = pemPrivateKey;
        this.provider = utils_1.configureProvider(providerConfig);
        this.wallet = new ethers_1.Wallet(ethereumPrivateKey, this.provider);
    }
    /**
     * Connects to existing TLS DID contract
     * @param {string} address - ethereum address of existing TLS DID Contract
     */
    TLSDID.prototype.connectToContract = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, _a, expiryBN, attributeCount, i, attribute, path, value, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        contract = new ethers_1.Contract(address, TLSDID_json_1.default.abi, this.provider);
                        this.contract = contract.connect(this.wallet);
                        //Retrive domain from contract
                        _a = this;
                        return [4 /*yield*/, contract.domain()];
                    case 1:
                        //Retrive domain from contract
                        _a.domain = _c.sent();
                        return [4 /*yield*/, contract.expiry()];
                    case 2:
                        expiryBN = _c.sent();
                        this.expiry = new Date(expiryBN.toNumber());
                        return [4 /*yield*/, contract.getAttributeCount()];
                    case 3:
                        attributeCount = _c.sent();
                        i = 0;
                        _c.label = 4;
                    case 4:
                        if (!(i < attributeCount)) return [3 /*break*/, 7];
                        return [4 /*yield*/, contract.getAttribute(i)];
                    case 5:
                        attribute = _c.sent();
                        path = attribute['0'];
                        value = attribute['1'];
                        this.attributes.push({ path: path, value: value });
                        _c.label = 6;
                    case 6:
                        i++;
                        return [3 /*break*/, 4];
                    case 7:
                        //Retrive signature from the contract
                        _b = this;
                        return [4 /*yield*/, contract.signature()];
                    case 8:
                        //Retrive signature from the contract
                        _b.signature = _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deploys TLS DID Contract
     */
    TLSDID.prototype.deployContract = function () {
        return __awaiter(this, void 0, void 0, function () {
            var factory, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        factory = new ethers_1.ContractFactory(TLSDID_json_1.default.abi, TLSDID_json_1.default.bytecode, this.wallet);
                        _a = this;
                        return [4 /*yield*/, factory.deploy()];
                    case 1:
                        _a.contract = _b.sent();
                        return [4 /*yield*/, this.contract.deployed()];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Registers TLS DID Contract with TLS DID Registry
     * @param {string} domain - tls:did:<domain>
     */
    TLSDID.prototype.registerContract = function (domain) {
        return __awaiter(this, void 0, void 0, function () {
            var registry, registryWithSigner, tx, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if ((domain === null || domain === void 0 ? void 0 : domain.length) === 0) {
                            throw new Error('No domain provided');
                        }
                        return [4 /*yield*/, this.setDomain(domain)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.signContract()];
                    case 2:
                        _a.sent();
                        registry = new ethers_1.Contract(this.registry, TLSDIDRegistry_json_1.default.abi, this.provider);
                        registryWithSigner = registry.connect(this.wallet);
                        return [4 /*yield*/, registryWithSigner.registerContract(domain, this.contract.address)];
                    case 3:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 4:
                        receipt = _a.sent();
                        if (receipt.status === 0) {
                            throw new Error('registerContract unsuccesfull');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sets domain
     * @param {string} domain - tls:did:<domain>
     */
    TLSDID.prototype.setDomain = function (domain) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.setDomain(domain)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 2:
                        receipt = _a.sent();
                        if (receipt.status === 1) {
                            this.domain = domain;
                        }
                        else {
                            throw new Error('setDomain unsuccesfull');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds attribute to DID Document
     * @param {string} path - Path of value, format 'parent/child' or 'parent[]/child'
     * @param {string} value - Value stored in path
     */
    TLSDID.prototype.addAttribute = function (path, value) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.addAttribute(path, value)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 3:
                        receipt = _a.sent();
                        if (!(receipt.status === 1)) return [3 /*break*/, 5];
                        this.attributes.push({ path: path, value: value });
                        return [4 /*yield*/, this.signContract()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5: throw new Error('setAttribute unsuccesfull');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sets expiry of TLS DID Contract
     * @param {Date} date - Expiry date
     */
    TLSDID.prototype.setExpiry = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var expiry, tx, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expiry = date.getTime();
                        return [4 /*yield*/, this.contract.setExpiry(expiry)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 3:
                        receipt = _a.sent();
                        if (!(receipt.status === 1)) return [3 /*break*/, 5];
                        this.expiry = date;
                        return [4 /*yield*/, this.signContract()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5: throw new Error('setExpiry unsuccesfull');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Signs the TLS DID Contract
     */
    TLSDID.prototype.signContract = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var hash, signature, tx, receipt;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (((_a = this.domain) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                            throw new Error('No domain provided');
                        }
                        hash = tls_did_resolver_1.hashContract(this.domain, this.contract.address, this.attributes, this.expiry);
                        signature = utils_1.sign(this.pemPrivateKey, hash);
                        return [4 /*yield*/, this.contract.setSignature(signature)];
                    case 1:
                        tx = _b.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 2:
                        receipt = _b.sent();
                        if (receipt.status === 1) {
                            this.signature = signature;
                        }
                        else {
                            throw new Error('setSignature unsuccesfull');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets address
     * @returns {string} address
     */
    TLSDID.prototype.getAddress = function () {
        if (!this.contract) {
            throw new Error('No linked ethereum contract available');
        }
        return this.contract.address;
    };
    return TLSDID;
}());
exports.TLSDID = TLSDID;
//# sourceMappingURL=tlsDid.js.map