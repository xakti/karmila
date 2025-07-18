<template>
    <Dialog modal :visible="visible" class="max-w-9/10" pt:root:class="!border-0 !bg-transparent">
        <template #container>
            <div class="flex flex-col login-dialog">
                <div class="inline-flex justify-between items-center p-2">
                    <span class="font-bold text-lg">Hubungkan Wallet</span>
                    <Button text icon="pi pi-times" @click="visible = false"></Button>
                </div>
                <div class="flex flex-col mx-2 mb-2 gap-2 text-center">
                    <span class="text-sm">Login dengan pindai kode QR atau klik tombol</span>
                    <div class="inline-flex gap-2 mx-auto">
                        <Button size="small" text raised @click="openWallet">
                            <img alt="" src="/herlina.png" width="32"/>
                            <span class="font-bold">Herlina</span>
                        </Button>
                        <Button text raised @click="copyRequest" icon="pi pi-clipboard"></Button>
                    </div>
                    <Image preview :src="qrCodeSrc"
                           class="shadow-md border border-surface rounded-xl bg-white p-1 md:w-[400px]">
                        <template #previewicon>
                            <i class="pi pi-qrcode"></i>
                        </template>
                    </Image>
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {useToast} from "primevue";
import QrCodeWithLogo from "qrcode-with-logos";
import Wallet from "../js/wallet.js";
import {abiCache, client} from "../js/nodes.js";
import {IdentityProof} from "@wharfkit/signing-request";
import {Herlina, WalletSession} from "herlina-kit";
import {copyToClipboard} from "../js/utils.js";

const toast = useToast();
const visible = ref(false);
const qrCodeSrc = ref();
let vsr = "";

onMounted(() => {
    Wallet.show = show;
});

function show() {
    if (!Wallet.herlina) {
        const herlina = new Herlina();
        herlina.on("error", onServerError);
        herlina.on("session", onSession);
        vsr = herlina.createLoginRequest("Karmila", "https://karmila.web.app/icon-128.png");
        herlina.connect();
        Wallet.herlina = herlina;
    }

    initQRCode(vsr);
    visible.value = true;
}

function copyRequest() {
    copyToClipboard(vsr);
    toast.add({life: 3000, severity: "info", summary: "Login VSR disalin"});
}

async function initQRCode(content) {
    let qrCode = new QrCodeWithLogo({
        content,
        width: 500,
        cornersOptions: {type: "rounded"},
        dotsOptions: {type: "tile"}
    });
    let el = await qrCode.getImage();
    qrCodeSrc.value = el.src;
}


function openWallet() {
    let path = vsr.split(":")[1]; // 'vsr:' dibuang

    // let walletUrl = `https://localhost:5155/login?vsr=${path}`;
    let walletUrl = `https://herlina.web.app/login?vsr=${path}`;
    popupWindow(walletUrl, "Vexanium Wallet", 360, 600);
}

function popupWindow(url, title, w, h) {
    const left = window.screen.width - w;
    const top = (window.screen.height - h) / 2;
    const features = `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`;
    return window.open(url, title, features);
}

function onServerError(error) {
    console.log(error.message);
    toast.add({life: 4000, severity: "error", summary: "Koneksi Error", detail: error.message});
}

/**
 *
 * @param {WalletSession} session
 * @param {IdentityProof?} proof
 */
async function onSession(session, proof) {
    if (proof && proof instanceof IdentityProof) {
        // verifikasi akun
        const account = await client.v1.chain.get_account(proof.signer.actor);
        if (proof.verify(account.getPermission(proof.signer.permission).required_auth)) {
            Wallet.setAccount(proof.signer.actor.toString());
            toast.add({life: 3000, severity: "success", summary: `Tersambung dengan ${proof.signer.actor.toString()}`});
        } else {
            toast.add({life: 3000, severity: "error", summary: "Gagal verifikasi akun"});
            Wallet.close();
            return;
        }
    } else {
        // login dari session
        Wallet.setAccount(session.actor.toString());
        toast.add({life: 3000, severity: "success", summary: `Tersambung dengan ${session.actor.toString()}`});
    }

    session.setABICache(abiCache);
    session.onClose(onClose);
    Wallet.session = session;

    // putuskan signal server
    Wallet.herlina.disconnect();
    visible.value = false; // tutup dialog
}


function onClose() {
    Wallet.close();
    toast.add({life: 4000, severity: "info", summary: "Terputus dengan wallet"});
}
</script>
