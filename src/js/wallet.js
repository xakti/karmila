import {SigningRequest} from "@wharfkit/signing-request";
import {PermissionLevel} from "@wharfkit/antelope";
import zlib from "pako";
import {ref} from "vue";
import {Herlina, WalletSession} from "herlina-kit";
import {abiCache} from "./nodes.js";

const Wallet = {
    /**
     *
     * @type {Herlina}
     */
    herlina: null,
    /**
     *
     * @type {WalletSession}
     */
    session: null,
    open: ref(false), // apakah sudah dapat nama akun dari wallet
    account: ref(""), // akun sedang dipakai 'nama@active'
    encodingOptions: {zlib, abiProvider: abiCache},

    /**
     *
     * @param {string} value
     */
    setAccount(value) {
        this.account.value = value;
        this.open.value = true;
    },
    isConnected() {
        return this.open.value;
    },
    /**
     *
     * @return {PermissionLevel}
     */
    getPermission() {
        if (this.session) {
            return this.session.permissionLevel;
        }
        throw new Error("wallet not connected");
    },
    /**
     * pintasan untuk membuat SigningRequest
     * @param {SigningRequestCreateArguments} args
     * @return {Promise<SigningRequest>}
     */
    createSigningRequest(args) {
        args.chainId = WalletSession.ChainID;
        return SigningRequest.create(args, this.encodingOptions);
    }
};

export default Wallet;