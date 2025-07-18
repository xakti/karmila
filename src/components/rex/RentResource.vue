<template>
    <div id="rent-resources" class="border border-surface rounded-md shadow-md p-2 flex flex-col gap-2">
        <span class="font-bold text-xl">Rent CPU | NET</span>
        <div class="inline-flex gap-2 justify-between items-center">
            <span>Resource Type:</span>
            <SelectButton size="small" :options="['CPU','NET']" v-model="state.type"></SelectButton>
        </div>
        <div class="inline-flex gap-2 justify-between items-center">
            <span>Price:</span>
            <span>{{ state.price }}  * 30 Days / VEX</span>
        </div>
        <FloatLabel variant="in">
            <AutoComplete id="receiver" fluid v-model="state.receiver" :delay="700"
                          :suggestions="suggestions.account"
                          @complete="completeAccount"></AutoComplete>
            <label for="receiver">Receiver</label>
        </FloatLabel>
        <FloatLabel variant="in">
            <InputText fluid id="rent" type="number" inputmode="decimal" v-model="state.amount" @valueChange="onAmount"></InputText>
            <label for="rent">Rent Amount</label>
        </FloatLabel>
        <Message size="small">
            Biaya sewa {{ state.type }} selama 30 hari: {{ state.cost }}
        </Message>
        <div class="flex justify-end">
            <Button :loading="state.loading" label="Rent" @click="rent"></Button>
        </div>
    </div>
</template>
<script setup>
import {onActivated, onMounted, reactive, ref, watch} from "vue";
import {Action, Asset} from "@wharfkit/antelope";
import {PlaceholderAuth, PlaceholderName} from "@wharfkit/signing-request";
import {suggestions, completeAccount} from "../../js/auto.js";
import Rex from "../../js/rex.js";
import {useToast} from "primevue";
import {abiCache} from "../../js/nodes.js";
import Wallet from "../../js/wallet.js";
import {copyToClipboard, getErrorMessage} from "../../js/utils.js";
import ChainInfo from "../../js/chain-info.js";


const emit = defineEmits(['rent']);
const toast = useToast();
const state = reactive({
    price: "0.0000 VEX", type: "CPU", amount: "", receiver: "",
    cost: Asset.fromString("0.0000 VEX"),
    loading: false
});

watch(Rex.pool, calculatePrice);

onMounted(calculatePrice);
onActivated(calculatePrice);

function calculatePrice() {
    state.price = Rex.calculateLoanAmount(Asset.fromString("1.0000 VEX")).toString();
}

function onAmount(value) {
    const amount = parseFloat(value);
    if (amount === 0 || isNaN(amount)) {
        state.cost = Asset.fromString("0.0000 VEX");
        return;
    }

    const loan = Asset.fromString("0.0000 VEX");
    loan.units = loan.symbol.convertFloat(amount);
    state.cost = Rex.calculateLoanCost(loan);
}


async function rent() {
    const receiver = state.receiver.toLowerCase();
    const actionName = state.type === 'CPU' ? "rentcpu" : "rentnet";

    state.loading = true;
    try {
        const abi = await abiCache.getAbi(ChainInfo.SYSTEM_CONTRACT);
        const deposit = Action.from({
            account: ChainInfo.SYSTEM_CONTRACT, name: "deposit",
            authorization: [PlaceholderAuth],
            data: {owner: PlaceholderName, amount: state.cost.toString()}
        }, abi);
        const rentAction = Action.from({
            account: ChainInfo.SYSTEM_CONTRACT, name: actionName,
            authorization: [PlaceholderAuth],
            data: {
                from: PlaceholderName, receiver,
                loan_payment: state.cost.toString(), loan_fund: "0.0000 VEX"
            }
        }, abi);
        const request = await Wallet.createSigningRequest({actions: [deposit, rentAction]});
        const vsr = request.encode(true, false, "vsr:");
        if (Wallet.isConnected()) {
            await Wallet.session.signingRequest(vsr);
            emit('rent', state.type);
            toast.add({life: 3000, severity: "success", summary: `Berhasil sewa ${state.type}`});
        } else {
            copyToClipboard(vsr);
            toast.add({life: 3000, severity: "success", summary: `Sewa ${state.type}`, detail: "vsr disalin"});
        }
        state.receiver = "";
        state.amount = "";
    } catch (e) {
        toast.add({life: 4000, severity: "error", summary: `Sewa ${state.type} Gagal`, detail: getErrorMessage(e)});
    } finally {
        state.loading = false;
    }
}
</script>


