<template>
    <div id="rex-fund" class="border border-surface rounded-md shadow-md p-2 flex flex-col">
        <span class="font-bold text-xl">Overview</span>
        <div class="inline-flex justify-between">
            <span>REX total:</span>
            <span>{{ Rex.pool.total_rex }}</span>
        </div>
        <div class="inline-flex justify-between">
            <span>VEX total:</span>
            <span>{{ Rex.pool.total_lendable }}</span>
        </div>
        <div class="inline-flex justify-between">
            <span>VEX Lent:</span>
            <span>{{ Rex.pool.total_lent }}</span>
        </div>
        <div class="inline-flex justify-between">
            <span>VEX Lendable:</span>
            <span>{{ Rex.pool.total_unlent }}</span>
        </div>
        <div class="inline-flex justify-between">
            <span>Number of loans:</span>
            <span>{{ groupNumber(Rex.pool.loan_num) }}</span>
        </div>
        <div class="inline-flex justify-between">
            <span>Pool Utilization:</span>
            <span>{{ Rex.calculateLentPercent() }}%</span>
        </div>
        <Divider/>
        <div class="inline-flex justify-between">
            <span>Rex Balance:</span>
            <span>{{ Rex.rexBalance.rex_balance }}</span>
        </div>
        <div class="inline-flex justify-between">
            <span>Rex Locked:</span>
            <span>{{ Rex.rexBalance.locked }}</span>
        </div>
        <div class="inline-flex justify-between">
            <span>Rex Fund:</span>
            <span>{{ Rex.rexFund }}</span>
        </div>
        <div class="flex flex-col gap-2 mt-2">
            <FloatLabel variant="in">
                <InputText fluid id="withdraw" type="number" inputmode="decimal" v-model="state.withdraw"></InputText>
                <label for="withdraw">Amount VEX</label>
            </FloatLabel>
            <Button :loading="loading.withdraw" label="Withdraw" @click="withdraw"></Button>
        </div>
    </div>
</template>
<script setup>
import {onActivated, onMounted, reactive} from "vue";
import {useToast} from "primevue";
import {Action, Asset} from "@wharfkit/antelope";
import {PlaceholderAuth, PlaceholderName} from "@wharfkit/signing-request";
import Wallet from "../../js/wallet.js";
import Rex from "../../js/rex.js";
import {abiCache} from "../../js/nodes.js";
import {copyToClipboard, getErrorMessage, groupNumber} from "../../js/utils.js";
import ChainInfo from "../../js/chain-info.js";

const toast = useToast();
const state = reactive({withdraw: ""});
const loading = reactive({withdraw: false});

onMounted(hook);
onActivated(hook);

function hook() {
    if (Wallet.isConnected()) fetchUserBalance();
}

function fetchUserBalance() {
    Rex.fetchRexBalance(Wallet.account.value);
    Rex.fetchRexFund(Wallet.account.value);
}

async function withdraw() {
    const amount = parseFloat(state.withdraw);
    if (isNaN(amount) || amount === 0) {
        toast.add({life: 3000, severity: "error", summary: "Masukkan jumlah yang ditarik"});
        return;
    }
    const fund = Asset.fromString("0.0000 VEX");
    fund.units = fund.symbol.convertFloat(amount);

    loading.withdraw = true;
    try {
        const abi = await abiCache.getAbi(ChainInfo.SYSTEM_CONTRACT);
        const action = Action.from({
            account: ChainInfo.SYSTEM_CONTRACT, name: "withdraw",
            authorization: [PlaceholderAuth],
            data: {owner: PlaceholderName, amount: fund.toString()}
        }, abi);
        const request = await Wallet.createSigningRequest({action});
        const vsr = request.encode(true, false, "vsr:");
        if (Wallet.isConnected()) {
            await Wallet.session.signingRequest(vsr);
            toast.add({life: 3000, severity: "success", summary: "Withdraw Rex Fund", detail: "berhasil tarik saldo"});
        } else {
            copyToClipboard(vsr);
            toast.add({life: 3000, severity: "success", summary: "Withdraw Rex Fund", detail: "vsr disalin"});
        }
        state.withdraw = "";
        setTimeout(fetchUserBalance, 1000);
    } catch (e) {
        toast.add({life: 3000, severity: "error", summary: "Withdraw Error", detail: getErrorMessage(e)});
    } finally {
        loading.withdraw = false;
    }
}

</script>

