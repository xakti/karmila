<template>
    <div id="home">
        <Toolbar class="shadow-lg rounded-b-2xl! rounded-t-none! fixed top-0 z-10 w-full">
            <template #start>
                <Button icon="pi pi-bars" @click="state.drawer = true"></Button>
                <img alt="" src="/icon-128.png" width="40" class="ml-2">
                <span class="text-2xl font-bold mx-2">Karmila</span>
            </template>
            <template #end>
                <div class="max-sm:hidden flex gap-2">
                    <Button text as="router-link" to="/tokens">Tokens</Button>
                    <Button text as="router-link" to="/producers">Producers</Button>
                </div>
            </template>
        </Toolbar>
        <Drawer :visible="state.drawer" @update:visible="state.drawer = false">
            <template #header>
                <div class="inline-flex items-center gap-2">
                    <img alt="" src="/icon-128.png" width="40">
                    <span class="font-bold text-2xl">Karmila</span>
                </div>
            </template>
            <div class="flex w-full">
                <div v-if="Wallet.isConnected()" class="inline-flex gap-4 mb-4 items-center border border-surface rounded-xl shadow-md p-2 mx-auto">
                    <span class="font-bold text-lg">{{ Wallet.account }}</span>
                    <Button size="small" rounded raised text icon="pi pi-power-off" @click="closeWallet"></Button>
                </div>
                <Button v-else class="mx-auto mb-2" label="Login" @click="showWalletSelector"></Button>
            </div>
            <PanelMenu multiple :model="menuItems"></PanelMenu>
        </Drawer>

        <div class="md:w-1/2 lg:w-2/5 mx-auto mt-20 p-2">
            <InputGroup>
                <FloatLabel variant="in">
                    <AutoComplete v-model="state.query" :suggestions="suggestions.account" :delay="700"
                                  @complete="completeAccount" @itemSelect="onSelectAccount"></AutoComplete>
                    <label for="query">{{ queryLabel }}</label>
                </FloatLabel>
                <InputGroupAddon>
                    <Button text icon="pi pi-search" @click="doQuery"></Button>
                </InputGroupAddon>
            </InputGroup>
        </div>

        <div class="flex flex-col p-2">
            <ChainInfo class="md:mx-auto"></ChainInfo>
            <LatestAction class="md:min-w-full md:mx-auto mt-2"></LatestAction>
        </div>

    </div>
</template>
<script setup>
import {onActivated, reactive, ref} from "vue";
import {onBeforeRouteLeave, useRouter} from "vue-router";
import {startInterval} from "@/js/utils.js";
import {completeAccount, suggestions} from "@/js/auto.js";
import ChainInfo from "@/components/ChainInfo.vue";
import LatestAction from "@/components/LatestAction.vue";
import Wallet from "@/js/wallet.js";

const router = useRouter();
const state = reactive({query: "", drawer: false});
let stopRandomLabel = null;
const labels = [
    'Search by account name...',
    'Search by block number...',
    'Search by transaction id...',
];
let labelIndex = 0;
const queryLabel = ref(labels[0]);
const menuItems = [
    {label: "Tokens", command: () => openPage('/tokens')},
    {label: "Producers", command: () => openPage('/producers')},
    {label: "Newborn", command: () => openPage('/newborn')},
    {label: "Name Bids", command: () => openPage('/namebids')},
    {label: "Table Viewer", command: () => openPage('/table')},
    {label: "Executor", command: () => openPage('/executor')},
    {label: "Settings", command: () => openPage('/setting')},
];

onActivated(() => {
    stopRandomLabel = startInterval(randomLabel, 2000);
});

onBeforeRouteLeave(() => {
    stopRandomLabel();
});

function showWalletSelector() {
    if (state.drawer) state.drawer = false;
    Wallet.show();
}

function closeWallet() {
    Wallet.session.close();
}

function openPage(path) {
    if (state.drawer) state.drawer = false;
    router.push(path);
}

function onSelectAccount(event) {
    router.push(`/account/${event.value}`);
    state.query = "";
}

function doQuery() {
    let len = state.query.length;
    let query = state.query.trim().toLowerCase();

    if (len === 64) {
        router.push(`/transaction/${query}`);
    } else if (len > 0 && len <= 12 && isNaN(query)) {
        router.push(`/account/${query}`);
    } else {
        const blockNum = query.replace(/[,.]/g, '');
        if (parseInt(blockNum, 10) > 0) {
            router.push(`/block/${blockNum}`);
        }
    }
    state.query = "";
}

function randomLabel() {
    labelIndex++;
    if (labelIndex > labels.length - 1) {
        labelIndex = 0;
    }
    queryLabel.value = labels[labelIndex];
}

</script>
