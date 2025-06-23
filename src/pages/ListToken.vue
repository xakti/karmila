<template>
    <div id="list-token" class="p-2">

        <div class="border rounded-md border-surface shadow-md p-1">
            <DataTable :value="listToken" size="small" resizable-columns scrollable scroll-height="500px">
                <template #header>
                    <div class="flex gap-4 justify-between items-center">
                        <p class="text-center">
                            <span class="font-bold text-lg">{{ totalToken }}</span><br>
                            <span>Total Token</span>
                        </p>
                        <div class="inline-flex gap-2 ">
                            <Button label="Register" @click="registerDialog = true"></Button>
                            <FloatLabel variant="in">
                                <InputText size="small" class="w-[90px]" id="search"
                                           @valueChange="onSymbol"></InputText>
                                <label for="search">Search</label>
                            </FloatLabel>
                        </div>
                    </div>
                </template>
                <Column header="Name" header-style="min-width: 140px">
                    <template #body="{data}">
                        <div class="flex flex-nowrap items-center gap-2">
                            <img :alt="data.code" :src="data.icon" width="32">
                            <Button link @click="openDetail(data)" :label="data.code"></Button>
                        </div>
                    </template>
                </Column>
                <Column header="Contract" field="contract"></Column>
                <Column header="Supply" field="supply"></Column>
                <Column header="Max Supply" field="max_supply"></Column>
            </DataTable>
        </div>

        <Dialog header="Register Token" modal :visible="registerDialog" @update:visible="registerDialog = false">
            <div class="flex flex-col gap-2">
                <FloatLabel variant="in">
                    <AutoComplete input-id="contract" :delay="700" v-model="registerInput.contract"
                                  :suggestions="suggestions.contract" @complete="completeContract"></AutoComplete>
                    <label for="contract">Contract</label>
                </FloatLabel>
                <FloatLabel variant="in">
                    <InputText id="symbol" v-model="registerInput.symbol"></InputText>
                    <label for="symbol">Symbol</label>
                </FloatLabel>
            </div>
            <div class="flex justify-end mt-2">
                <Button label="Submit" :loading="registerLoading" @click="submitToken"></Button>
            </div>
        </Dialog>

    </div>
</template>

<script setup>
import {
    addMapTokens,
    fetchTokenByTime,
    fetchTotalToken,
    findTokenBySymbol,
    listToken,
    totalToken,
    VEXTOKENLIST
} from "@/js/token.js";
import {onActivated, reactive, ref} from "vue";
import {useRouter} from "vue-router";
import {completeContract, suggestions} from "@/js/auto.js";
import {abiCache} from "@/js/nodes.js";
import Wallet from "@/js/wallet.js";
import {useToast} from "primevue";
import {getErrorMessage} from "@/js/utils.js";
import {Action} from "@wharfkit/antelope";
import {PlaceholderAuth} from "@wharfkit/signing-request";

const router = useRouter();
const toast = useToast();
const registerDialog = ref(false);
const registerLoading = ref(false);
const registerInput = reactive({contract: "", symbol: ""});

onActivated(() => {
    fetchTotalToken();
    fetchToken();
});

function onSymbol(event) {
    let name = event.toUpperCase();
    if (name.length >= 2) {
        findToken(name);
    }
}

function openDetail(data) {
    router.push(`/token/${data.contract}-${data.code}`);
}

async function fetchToken() {
    let res = await fetchTokenByTime();
    res.rows.forEach(it => {
        if (it.icon.length === 0) it.icon = "/token-default.png";
        addMapTokens(it);
    });
    listToken.value = res.rows;
}

async function findToken(symbol) {
    let rows = await findTokenBySymbol(symbol);
    rows.forEach(it => {
        if (it.icon.length === 0) it.icon = "/token-default.png";
        addMapTokens(it);
    });
    listToken.value = rows;
}

async function submitToken() {
    const contract = registerInput.contract.toLowerCase();
    const symbol = registerInput.symbol.toUpperCase();
    if (contract.length === 0) {
        toast.add({severity: "error", life: 3000, summary: "Enter token contract address"});
        return;
    }
    if (symbol.length === 0) {
        toast.add({severity: "error", life: 3000, summary: "Enter token symbol"});
        return;
    }
    if (!Wallet.isConnected()) {
        toast.add({severity: "error", life: 3000, summary: "Wallet not connected"});
        return;
    }

    registerLoading.value = true;
    try {
        const abi = await abiCache.getAbi(VEXTOKENLIST);
        const action = Action.from({
            account: VEXTOKENLIST, name: "regtoken",
            authorization: [PlaceholderAuth],
            data: {contract: contract, code: symbol}
        }, abi);
        await Wallet.session.transact({action});

        registerLoading.value = false;
        registerDialog.value = false;
        registerInput.contract = "";
        registerInput.symbol = "";
        toast.add({severity: "success", life: 3000, summary: `Token ${symbol} registered successfully`});

        setTimeout(() => {
            fetchToken();
            fetchTotalToken();
        }, 1500);
    } catch (e) {
        registerLoading.value = false;
        toast.add({severity: "error", life: 4000, summary: "Register Token Error", detail: getErrorMessage(e)});
    }
}
</script>


