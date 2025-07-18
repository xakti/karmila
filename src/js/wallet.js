import {SigningRequest} from "@wharfkit/signing-request";
import {Asset, PermissionLevel} from "@wharfkit/antelope";
import zlib from "pako";
import {ref} from "vue";
import {Herlina, WalletSession} from "herlina-kit";
import {abiCache, client} from "./nodes.js";

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
    account: ref(""), // akun sedang dipakai 'nama'
    encodingOptions: {zlib, abiProvider: abiCache},
    vexBalance: ref(Asset.fromString("0.0000 VEX")),

    /**
     * setel nama akun
     * @param {string} value
     */
    setAccount(value) {
        this.account.value = value;
        this.open.value = true;
    },
    async fetchVexBalance() {
        let res = await client.v1.chain.get_currency_balance("vex.token", this.account.value, "VEX");
        if (res.length) {
            this.vexBalance.value = res[0];
        }
    },

    isConnected() {
        return this.open.value;
    },
    close() {
        this.open.value = false;
        this.herlina.destroy();
        this.herlina = undefined;
        this.session = undefined;
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