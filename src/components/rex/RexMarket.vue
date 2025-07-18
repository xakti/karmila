<template>
    <div id="rex-market" class="border border-surface rounded-md shadow-md p-2 flex flex-col gap-2">
        <span class="font-bold text-xl">REX Market</span>
        <div class="inline-flex gap-2 justify-between">
            <span>Price:</span>
            <span>{{ price }} VEX / REX</span>
        </div>
        <div class="inline-flex gap-2 justify-between">
            <span>Balance:</span>
            <span>{{ Wallet.vexBalance }}</span>
        </div>
        <div class="inline-flex gap-2 justify-between">
            <span>Mature:</span>
            <span>{{ Rex.rexBalance.matured_rex }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-2">
            <div class="flex flex-col gap-2">
                <FloatLabel variant="in">
                    <InputText fluid id="buy" type="number" inputmode="decimal" v-model="state.buy" @valueChange="onBuy"></InputText>
                    <label for="buy">Amount VEX</label>
                </FloatLabel>
                <span class="text-sm text-right">≈ {{ state.rexAmount }}</span>
                <Button :loading="loading.buy" label="Buy" @click="buyRex"></Button>
            </div>
            <div class="flex flex-col gap-2">
                <FloatLabel variant="in">
                    <InputText fluid id="sell" type="number" inputmode="decimal" v-model="state.sell" @valueChange="onSell"></InputText>
                    <label for="sell">Amount REX</label>
                </FloatLabel>
                <span class="text-sm text-right">≈ {{ state.vexAmount }}</span>
                <Button :loading="loading.sell" label="Sell" @click="sellRex"></Button>
            </div>
        </div>
    </div>
</template>
<script setup>

import {onActivated, onMounted, reactive, ref, watch} from "vue";
import Rex from "../../js/rex.js";
import {Action, Asset} from "@wharfkit/antelope";
import {useToast} from "primevue";
import {abiCache} from "../../js/nodes.js";
import {PlaceholderAuth, PlaceholderName} from "@wharfkit/signing-request";
import Wallet from "../../js/wallet.js";
import {copyToClipboard, getErrorMessage} from "../../js/utils.js";
import ChainInfo from "../../js/chain-info.js";

const toast = useToast();
const price = ref("0");
const state = reactive({
    price: 0, buy: "", sell: "",
    buyAmount: "",
    sellAmount: "",
    rexAmount: "0.0000 REX",
    vexAmount: "0.0000 VEX",
});
const loading = reactive({buy: false, sell: false});

watch(Rex.pool, hook);
onMounted(hook);
onActivated(hook);

function hook() {
    price.value = Rex.calcPrice();
    state.price = parseFloat(price.value);
    if (Wallet.isConnected()) Wallet.fetchVexBalance();
}

function fetchUserBalance() {
    Wallet.fetchVexBalance();
    Rex.fetchRexBalance(Wallet.account.value);
}

function onBuy(value) {
    const amount = parseFloat(value);
    if (amount === 0 || isNaN(amount)) return;

    const buyAmount = Asset.fromString("0.0000 VEX");
    const rexAmount = Asset.fromString("0.0000 REX");
    buyAmount.units = buyAmount.symbol.convertFloat(amount);
    rexAmount.value = buyAmount.value / state.price;

    state.buyAmount = buyAmount.toString();
    state.rexAmount = rexAmount.toString();
}

async function buyRex() {
    loading.buy = true;
    try {
        const abi = await abiCache.getAbi(ChainInfo.SYSTEM_CONTRACT);
        const deposit = Action.from({
            account: ChainInfo.SYSTEM_CONTRACT, name: "deposit",
            authorization: [PlaceholderAuth],
            data: {owner: PlaceholderName, amount: state.buyAmount}
        }, abi);
        const buyRex = Action.from({
            account: ChainInfo.SYSTEM_CONTRACT, name: "buyrex",
            authorization: [PlaceholderAuth],
            data: {from: PlaceholderName, amount: state.buyAmount}
        }, abi);
        const request = await Wallet.createSigningRequest({actions: [deposit, buyRex]});
        const vsr = request.encode(true, false, "vsr:");
        if (Wallet.isConnected()) {
            await Wallet.session.signingRequest(vsr);
            toast.add({life: 3000, severity: "success", summary: `Berhasil beli REX`});
            setTimeout(fetchUserBalance,1000);
        } else {
            copyToClipboard(vsr);
            toast.add({life: 3000, severity: "success", summary: `Beli REX`, detail: "vsr disalin"});
        }
        state.buy = "";
        state.rexAmount = "0.0000 REX";
    } catch (e) {
        toast.add({life: 4000, severity: "error", summary: `Beli REX Gagal`, detail: getErrorMessage(e)});
    } finally {
        loading.buy = false;
    }
}

function onSell(value) {
    const amount = parseFloat(value);
    if (amount === 0 || isNaN(amount)) return;

    const sellAmount = Asset.fromString("0.0000 REX");
    const vexAmount = Asset.fromString("0.0000 VEX");
    sellAmount.units = sellAmount.symbol.convertFloat(amount);
    vexAmount.value = sellAmount.value * state.price;

    state.sellAmount = sellAmount.toString();
    state.vexAmount = vexAmount.toString();
}

async function sellRex() {
    loading.sell = true;
    try {
        const abi = await abiCache.getAbi(ChainInfo.SYSTEM_CONTRACT);
        const action = Action.from({
            account: ChainInfo.SYSTEM_CONTRACT, name: "sellrex",
            authorization: [PlaceholderAuth],
            data: {from: PlaceholderName, rex: state.sellAmount}
        }, abi);
        const request = await Wallet.createSigningRequest({action});
        const vsr = request.encode(true, false, "vsr:");
        if (Wallet.isConnected()) {
            await Wallet.session.signingRequest(vsr);
            toast.add({life: 3000, severity: "success", summary: `Berhasil jual REX`});
            setTimeout(fetchUserBalance,1000);
        } else {
            copyToClipboard(vsr);
            toast.add({life: 3000, severity: "success", summary: `Jual REX`, detail: "vsr disalin"});
        }
        state.sell = "";
        state.vexAmount = "0.0000 VEX";
    } catch (e) {
        toast.add({life: 4000, severity: "error", summary: `Jual REX Gagal`, detail: getErrorMessage(e)});
    } finally {
        loading.sell = false;
    }
}
</script>
