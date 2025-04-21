import {SigningRequest} from "@wharfkit/signing-request";
import {PermissionLevel} from "@wharfkit/antelope";
import zlib from "pako";
import {abiCache, ChainID} from "./nodes.js";

const Wallet = Object.create(null);

/**
 *
 * @type {Name}
 */
Wallet.account = null;
/**
 *
 * @type {Name}
 */
Wallet.permission = null;

/**
 *
 * @return {PermissionLevel}
 */
Wallet.getAuthorization = function () {
    return PermissionLevel.from(`${this.account}@${this.permission}`);
}

Wallet.saveAccount = function (name, permission) {
    this.account = name;
    this.permission = permission;
}

/**
 *
 * @param {SigningRequestCreateArguments} args
 */
Wallet.createSigningRequest = function (args) {
    args.chainId = ChainID;
    return SigningRequest.create(args, {zlib, abiProvider: abiCache});
}

export default Wallet;