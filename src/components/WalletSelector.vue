<template>
    <Dialog position="center" header="Wallet Selector" modal :visible="visible" @update:visible="visible = false"
            class="max-w-9/10">
        <div class="flex flex-col p-2 gap-2 text-center">
            <span>Login dengan pindai kode QR atau klik tombol</span>
            <Image preview :src="qrCodeSrc" class="shadow-md border border-surface rounded-xl p-1 md:w-[400px]">
                <template #previewicon>
                    <i class="pi pi-qrcode"></i>
                </template>
            </Image>
            <Button class="w-fit mx-auto mt-2" text raised @click="openWallet">
                <img alt="" src="https://herlina.web.app/herlina.png" width="32"/>
                <span>Herlina</span>
            </Button>
        </div>
    </Dialog>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {useToast} from "primevue";
import QrCodeWithLogo from "qrcode-with-logos";
import Wallet from "@/js/wallet.js";
import {abiCache, client} from "@/js/nodes.js";
import {IdentityProof} from "@wharfkit/signing-request";
import {Herlina, WalletSession} from "herlina-kit";

const toast = useToast();
const visible = ref(false);
const qrCodeSrc = ref();
let vsr = "";

onMounted(() => {
    Wallet.show = show;
    Wallet.hide = () => {
        visible.value = false;
    };
});

function show() {
    if (!Wallet.herlina) {
        let herlina = new Herlina();
        herlina.on("error", onServerError);
        herlina.on("session", onSession);
        herlina.connect();
        Wallet.herlina = herlina;

        vsr = herlina.createLoginRequest("Karmila", "https://karmila.web.app/icon-128.png");
        initQRCode(vsr);
    }

    visible.value = true;
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
 * @param {IdentityProof} proof
 */
async function onSession(session, proof) {
    console.log("tersambung dengan wallet");

    // verifikasi akun
    const account = await client.v1.chain.get_account(proof.signer.actor);
    if (proof.verify(account.getPermission(proof.signer.permission).required_auth)) {
        Wallet.setAccount(proof.signer.toString());
        toast.add({life: 3000, severity: "success", summary: `tersambung dengan ${proof.signer.toString()}`});

        session.setABICache(abiCache);
        session.onClose(onClose);
        Wallet.session = session;

        // putuskan signal server
        Wallet.herlina.disconnect();
        visible.value = false; // tutup dialog
    }
}


function onClose() {
    console.log("putus dengan wallet");
    Wallet.open.value = false;
    Wallet.herlina.destroy();
    Wallet.herlina = undefined;
    Wallet.session = undefined;
    toast.add({life: 4000, severity: "info", summary: "Terputus dengan wallet"});
}
</script>
