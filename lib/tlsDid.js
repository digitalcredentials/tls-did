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
var utils_1 = require("ethers/lib/utils");
var TLSDIDRegistry_json_1 = __importDefault(require("@digitalcredentials/tls-did-registry/build/contracts/TLSDIDRegistry.json"));
var tls_did_utils_1 = require("@digitalcredentials/tls-did-utils");
var utils_2 = require("./utils");
var tls_did_utils_2 = require("@digitalcredentials/tls-did-utils");
var TLSDID = /** @class */ (function () {
    /**
     * //TODO Allow for general provider type, see ethr-did implementation
     * Creates an instance of tlsdid.
     * @param {string} ethereumPrivateKey - ethereum private key with enough
     * funds to pay for transactions
     * @param {string} [registry] - ethereum address of TLS DID Contract Registry
     * @param {IProviderConfig} providerConfig - config for ethereum provider {}
     */
    function TLSDID(domain, ethereumPrivateKey, networkConfig) {
        if (networkConfig === void 0) { networkConfig = {}; }
        this.attributes = [];
        if ((domain === null || domain === void 0 ? void 0 : domain.length) === 0) {
            throw new Error('No domain provided');
        }
        if ((ethereumPrivateKey === null || ethereumPrivateKey === void 0 ? void 0 : ethereumPrivateKey.length) === 0) {
            throw new Error('No ethereum private key provided');
        }
        this.domain = domain;
        this.provider = utils_2.configureProvider(networkConfig.providerConfig);
        this.wallet = new ethers_1.Wallet(ethereumPrivateKey, this.provider);
        //Create registry contract object and connect wallet
        var registry = new ethers_1.Contract(networkConfig.registry ? networkConfig.registry : tls_did_utils_1.REGISTRY, TLSDIDRegistry_json_1.default.abi, this.provider);
        this.registry = registry.connect(this.wallet);
    }
    TLSDID.prototype.loadDataFromRegistry = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var lastChangeBlockBN, lastChangeBlock, filters;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (((_a = this.domain) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                            throw new Error('No domain provided');
                        }
                        return [4 /*yield*/, this.getOwnership()];
                    case 1:
                        _b.sent();
                        if (!this.registered) {
                            //No did was registered with the domain ethereum address combination
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.registry.changeRegistry(this.wallet.address, this.domain)];
                    case 2:
                        lastChangeBlockBN = _b.sent();
                        lastChangeBlock = lastChangeBlockBN.toNumber();
                        if (lastChangeBlock === 0) {
                            //No previous changes found for this domain
                            return [2 /*return*/];
                        }
                        filters = [
                            this.registry.filters.ExpiryChanged(),
                            this.registry.filters.SignatureChanged(),
                            this.registry.filters.AttributeChanged(),
                            this.registry.filters.ChainChanged(),
                        ];
                        filters.forEach(function (filter) { return filter.topics.push(utils_1.hexZeroPad(_this.wallet.address, 32)); });
                        return [4 /*yield*/, this.queryChain(filters, lastChangeBlock)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TLSDID.prototype.queryChain = function (filters, block) {
        return __awaiter(this, void 0, void 0, function () {
            var events, previousChangeBlockBN, previousChangeBlock;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.queryBlock(filters, block)];
                    case 1:
                        events = _a.sent();
                        if (events.length === 0) {
                            throw new Error("No event found in block: " + block);
                        }
                        events.forEach(function (event) {
                            switch (true) {
                                case event.event == 'AttributeChanged':
                                    var path = event.args.path;
                                    var value = event.args.value;
                                    _this.attributes.push({ path: path, value: value });
                                    break;
                                case event.event == 'ExpiryChanged' && _this.expiry == null:
                                    var expiry = event.args.expiry.toNumber();
                                    _this.expiry = new Date(expiry);
                                    break;
                                case event.event == 'SignatureChanged' && _this.signature == null:
                                    _this.signature = event.args.signature;
                                    break;
                                case event.event == 'ChainChanged' && _this.chain == null:
                                    _this.chain = utils_2.chainToCerts(event.args.chain);
                                    break;
                            }
                        });
                        previousChangeBlockBN = events[events.length - 1].args.previousChange;
                        previousChangeBlock = previousChangeBlockBN.toNumber();
                        if (!(previousChangeBlock > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.queryChain(filters, previousChangeBlock)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TLSDID.prototype.getOwnership = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var claimantsCountBN, claimantsCount, claimants;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (((_a = this.domain) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                            throw new Error('No domain provided');
                        }
                        return [4 /*yield*/, this.registry.getClaimantsCount(this.domain)];
                    case 1:
                        claimantsCountBN = _b.sent();
                        claimantsCount = claimantsCountBN.toNumber();
                        return [4 /*yield*/, Promise.all(Array.from(Array(claimantsCount).keys()).map(function (i) { return _this.registry.claimantsRegistry(_this.domain, i); }))];
                    case 2:
                        claimants = _b.sent();
                        this.registered = claimants.includes(this.wallet.address);
                        return [2 /*return*/];
                }
            });
        });
    };
    TLSDID.prototype.queryBlock = function (filters, block) {
        return __awaiter(this, void 0, void 0, function () {
            var events;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(filters.map(function (filter) { return _this.registry.queryFilter(filter, block, block); }))];
                    case 1:
                        events = (_a.sent()).flat();
                        return [2 /*return*/, events];
                }
            });
        });
    };
    /**
     * Registers account to claimants of DID identifier( domain)
     */
    TLSDID.prototype.register = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var tx, receipt;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (((_a = this.domain) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                            throw new Error('No domain provided');
                        }
                        return [4 /*yield*/, this.registry.registerOwnership(this.domain)];
                    case 1:
                        tx = _b.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 2:
                        receipt = _b.sent();
                        if (receipt.status === 1) {
                            this.registered = true;
                        }
                        else {
                            throw new Error('registration unsuccessful');
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
     * @param {string} key - Signing tls key in pem format
     */
    TLSDID.prototype.addAttribute = function (path, value, key) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var tx, receipt, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (((_a = this.domain) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                            throw new Error('No domain provided');
                        }
                        if (!!this.registered) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.register()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 8, , 9]);
                        return [4 /*yield*/, this.registry.addAttribute(this.domain, path, value)];
                    case 3:
                        tx = _b.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 4:
                        receipt = _b.sent();
                        if (!(receipt.status === 1)) return [3 /*break*/, 6];
                        this.attributes.push({ path: path, value: value });
                        return [4 /*yield*/, this.signContract(key)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6: throw new Error('setAttribute unsuccessful');
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_1 = _b.sent();
                        console.error(error_1);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sets expiry of TLS DID Contract
     * @param {Date} date - Expiry date
     * @param {string} key - Signing tls key in pem format
     */
    TLSDID.prototype.setExpiry = function (date, key) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var expiry, tx, receipt;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (((_a = this.domain) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                            throw new Error('No domain provided');
                        }
                        if (!!this.registered) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.register()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        expiry = date.getTime();
                        return [4 /*yield*/, this.registry.setExpiry(this.domain, expiry)];
                    case 3:
                        tx = _b.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 4:
                        receipt = _b.sent();
                        if (!(receipt.status === 1)) return [3 /*break*/, 6];
                        this.expiry = date;
                        return [4 /*yield*/, this.signContract(key)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6: throw new Error('setExpiry unsuccessful');
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Signs the TLS DID Contract
     * @param {string} key - Signing tls key in pem format
     */
    TLSDID.prototype.signContract = function (key) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var hash, signature, tx, receipt;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (((_a = this.domain) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                            throw new Error('No domain provided');
                        }
                        if (!!this.registered) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.register()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        hash = tls_did_utils_2.hashContract(this.domain, this.attributes, this.expiry, [this.chain]);
                        signature = tls_did_utils_2.sign(key, hash);
                        return [4 /*yield*/, this.registry.setSignature(this.domain, signature)];
                    case 3:
                        tx = _b.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 4:
                        receipt = _b.sent();
                        if (receipt.status === 1) {
                            this.signature = signature;
                        }
                        else {
                            throw new Error('setSignature unsuccessful');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stores certs in the TLS DID Certificate Contract
     * @dev Do not store root certificates, they are passed to the resolver
     * @todo What to do when cert expire / are invalid
     * @param certs
     * @param {string} key - Signing tls key in pem format
     */
    TLSDID.prototype.addChain = function (certs, key) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var joinedCerts, tx, receipt;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (((_a = this.domain) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                            throw new Error('No domain provided');
                        }
                        if (!!this.registered) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.register()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        joinedCerts = certs.join('\n');
                        return [4 /*yield*/, this.registry.addChain(this.domain, joinedCerts)];
                    case 3:
                        tx = _b.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 4:
                        receipt = _b.sent();
                        if (!(receipt.status === 1)) return [3 /*break*/, 6];
                        this.chain = certs;
                        return [4 /*yield*/, this.signContract(key)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6: throw new Error("addChain unsuccessful");
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stores certs in the TLS DID Certificate Contract
     * @dev Do not store root certificates, they are passed to the resolver
     * @todo What to do when cert expire / are invalid
     * @param certs
     * @param {string} key - Signing tls key in pem format
     */
    TLSDID.prototype.delete = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tx, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.registry.remove(this.registry)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 2:
                        receipt = _a.sent();
                        if (receipt.status === 1) {
                            this.attributes = [];
                            this.expiry = null;
                            this.signature = null;
                            this.chain = [];
                        }
                        else {
                            throw new Error("delete unsuccessful");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return TLSDID;
}());
exports.TLSDID = TLSDID;
//# sourceMappingURL=tlsDid.js.map