<template>
    <div id="token" class="p-2">

        <template v-if="ready">
            <Card class="drop-shadow md:w-1/2 md:mx-auto">
                <template #title>
                    <div>
                        <img v-if="tokenStat.icon.length > 0" class="float-right" :src="tokenStat.icon"
                             :alt="ticker.symbol" width="36">
                        <div class="inline-flex gap-2 items-baseline">
                            <span>{{ ticker.symbol }}</span>
                            <span class="text-sm">{{ ticker.contract }}</span>
                        </div>
                    </div>
                </template>
                <template #content>
                    <div class="flex justify-between items-center">
                        <span class="font-bold">Issuer:</span>
                        <Button link as="router-link" :to="`/account/${token.issuer}`"
                                :label="token.issuer.toString()"></Button>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-bold">Max Supply:</span>
                        <span>{{ token.max_supply }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-bold">Supply:</span>
                        <span v-tooltip.bottom="`${token.percent}%`">{{ token.supply }}</span>
                    </div>
                    <div v-if="tokenDetail.website" class="flex justify-between items-center">
                        <span class="font-bold">Website:</span>
                        <Button link @click="openSite(tokenDetail.website)" :label="tokenDetail.website"></Button>
                    </div>
                    <div v-if="tokenDetail.socials" class="flex justify-between items-center">
                        <span class="font-bold">Socials:</span>
                        <div class="inline-flex gap-2">
                            <Button v-if="tokenDetail.socials.telegram" text icon="pi pi-telegram"
                                    @click="openSite(tokenDetail.socials.telegram)"></Button>
                            <Button v-if="tokenDetail.socials.x" text icon="pi pi-twitter"
                                    @click="openSite(tokenDetail.socials.x)"></Button>
                            <Button v-if="tokenDetail.socials.youtube" text icon="pi pi-youtube"
                                    @click="openSite(tokenDetail.socials.youtube)"></Button>
                            <Button v-if="tokenDetail.socials.github" text icon="pi pi-github"
                                    @click="openSite(tokenDetail.socials.github)"></Button>
                        </div>
                    </div>
                    <div v-if="tokenDetail.about" class="flex flex-col">
                        <span class="font-bold">About:</span>
                        <p class="whitespace-pre-wrap">{{ tokenDetail.about }}</p>
                    </div>
                </template>
                <template #footer>
                    <div class="flex justify-end">
                        <Button label="Holders" @click="openHolder"></Button>
                    </div>
                </template>
            </Card>

            <Card class="drop-shadow md:w-1/2 md:mx-auto mt-2">
                <template #title>Contract ABI</template>
                <template #content>
                    <Fieldset v-if="tables.length > 0" legend="Tables" class="w-fit mt-4">
                        <div class="flex flex-wrap gap-2">
                            <Button v-for="(it,n) in tables" :key="n"
                                    size="small" link @click="viewTable(it.name)" :label="it.name"></Button>
                        </div>
                    </Fieldset>
                    <Fieldset v-if="actions.length > 0" legend="Actions" class="w-fit">
                        <div class="flex flex-wrap gap-2">
                            <Button v-for="(it,n) in actions" :key="n"
                                    size="small" link @click="executor(it.name)" :label="it.name"></Button>
                        </div>
                    </Fieldset>
                </template>
            </Card>

            <Card class="drop-shadow md:w-1/2 md:mx-auto mt-2">
                <template #title>Transfer</template>
                <template #content>
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="in">
                            <AutoComplete id="to" fluid v-model="transfer.to" :delay="700"
                                          :suggestions="suggestions.account"
                                          @complete="completeAccount"></AutoComplete>
                            <label for="to">To</label>
                        </FloatLabel>
                        <FloatLabel variant="in">
                            <InputText id="quantity" fluid v-model="transfer.quantity"
                                       type="number" inputmode="decimal"></InputText>
                            <label for="quantity">Quantity</label>
                        </FloatLabel>
                        <FloatLabel variant="in">
                            <InputText id="memo" fluid :maxlength="255" v-model="transfer.memo"></InputText>
                            <label for="memo">Memo</label>
                        </FloatLabel>
                    </div>
                </template>
                <template #footer>
                    <div class="flex justify-end">
                        <Button icon="pi pi-send" @click="doTransfer"></Button>
                    </div>
                </template>
            </Card>

        </template>
        <div v-else class="flex w-screen h-screen">
            <div class="m-auto">
                <ProgressSpinner stroke-width="5"></ProgressSpinner>
            </div>
        </div>

    </div>
</template>

<script setup>

import {useRoute, useRouter} from "vue-router";
import {onActivated, reactive, ref} from "vue";
import {useToast} from "primevue";
import {client, contractKit} from "../js/nodes.js";
import {fetchDetail, findToken, mapTokens} from "../js/token.js";
import Wallet from "../js/wallet.js";
import {copyToClipboard} from "../js/utils.js";
import {suggestions, completeAccount} from "../js/auto.js";
import {PlaceholderName} from "@wharfkit/signing-request";
import {Asset} from "@wharfkit/antelope";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const ticker = reactive({contract: "", symbol: ""});
const token = reactive({});
const tables = ref([]);
const actions = ref([]);
const tokenStat = reactive({id: 0, icon: ""});
const tokenDetail = reactive({about: "", website: "", socials: []});
const transfer = reactive({to: "", quantity: undefined, memo: ""});
const ready = ref(false);

onActivated(() => {
    let path = route.params.ticker.split("-");
    if (path[0] !== ticker.contract && path[1] !== ticker.symbol) {
        ticker.contract = path[0];
        ticker.symbol = path[1];
        transfer.quantity = undefined;
        tokenStat.id = 0;
        tokenStat.icon = "";
        tokenDetail.about = "";
        tokenDetail.website = "";
        tokenDetail.socials = [];

        fetchCurrencyStats();
        fetchAbi();
        getTokenStat().then(getTokenDetail);
    }
});

function openSite(url) {
    if (!url.startsWith("https:")) url = "https://" + url;
    window.open(url, "_blank");
}

function openHolder() {
    router.push(`/token/${ticker.contract}-${ticker.symbol}/holder`);
}

function executor(name) {
    router.push(`/executor?contract=${ticker.contract}&action=${name}`);
}

function viewTable(name) {
    let scope = ticker.contract;
    if (name === "stat") scope = ticker.symbol;

    router.push(`/table?contract=${ticker.contract}&scope=${scope}&table=${name}`);
}

async function fetchCurrencyStats() {
    let res = await client.v1.chain.get_currency_stats(ticker.contract, ticker.symbol);
    Object.assign(token, res[ticker.symbol]);
    let supply = parseFloat(token.supply);
    let maxSupply = parseFloat(token.max_supply);
    let percent = (supply / maxSupply) * 100;
    token.percent = percent.toFixed(2);
    ready.value = true;
}

async function fetchAbi() {
    let res = await client.v1.chain.get_abi(ticker.contract);
    actions.value = res.abi.actions;
    tables.value = res.abi.tables;
}

async function getTokenStat() {
    let key = `${ticker.contract}-${ticker.symbol}`;
    if (mapTokens[key]) {
        Object.assign(tokenStat, mapTokens[key]);
        return;
    }

    let rows = await findToken(ticker.contract, ticker.symbol);
    if (rows.length > 0) {
        Object.assign(tokenStat, rows[0]);
    }
}

async function getTokenDetail() {
    let rows = await fetchDetail(ticker.contract, tokenStat.id);
    if (rows.length > 0) {
        Object.assign(tokenDetail, rows[0]);
        if (tokenDetail.socials.length > 0) parseSocial();
    }
}

function parseSocial() {
    let social = {};
    tokenDetail.socials.forEach(it => {
        if (it.includes("github")) {
            social.github = it;
        } else if (it.includes("t.me")) {
            social.telegram = it;
        } else if (it.includes("twitter") || it.includes("x.com")) {
            social.x = it;
        } else if (it.includes("youtube")) {
            social.youtube = it;
        }
    });
    tokenDetail.socials = social;
}

async function doTransfer() {
    if (transfer.to.length === 0) {
        toast.add({life: 3000, severity: "warn", summary: "Transfer Invalid", detail: "enter receiver address"});
        return;
    }
    if (parseFloat(transfer.quantity) === 0) {
        toast.add({life: 3000, severity: "warn", summary: "Transfer Invalid", detail: "enter quantity"});
        return;
    }

    let data = {
        from: PlaceholderName,
        to: transfer.to,
        quantity: Asset.fromString(token.supply.toString()),
        memo: transfer.memo
    };
    data.quantity.value = parseFloat(transfer.quantity);


    try {
        let sc = await contractKit.load(ticker.contract);
        let action = sc.action("transfer", data);
        let sr = await Wallet.createSigningRequest({action});
        let vsr = sr.encode(true, false, "vsr:");
        copyToClipboard(vsr);
        toast.add({life: 3000, severity: "success", summary: "Transfer Token", detail: "vsr copied"});
    } catch (e) {
        toast.add({life: 3000, severity: "error", summary: "Transfer Error", detail: e.message});
    }
}

</script>


