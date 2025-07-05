<template>
    <div class="border border-surface rounded-md shadow-md p-2">

        <div class="flex flex-col p-2">
            <span class="font-bold text-lg">Actions({{ ActionsCount() }})</span>
            <span>Last Irreversible Block:
                    <router-link class="text-primary-400" :to="`/block/${ChainInfo.chainInfo.last_irreversible_block_num}`">
                        {{ ChainInfo.chainInfo.last_irreversible_block_num }}
                    </router-link>
            </span>
            <div class="flex gap-2">
                <Button icon="pi pi-filter" @click="showFilterDialog = true"></Button>
                <SelectButton size="small" @update:modelValue="onFilter" v-model="filterValue"
                              :options="filterOptions"></SelectButton>
            </div>
        </div>

        <DataTable ref="scroll" :value="actions" size="small" scrollable scroll-height="525px" resizable-columns
                   column-resize-mode="expand"
                   paginator :rows="query.limit">
            <Column header="TX">
                <template #body="{data}">
                    <div class="flex flex-col items-center">
                        <span v-if="isPending(data)">
                            <i class="pi pi-hourglass animate-spin mr-1"></i>{{ data.pending }}s
                        </span>
                        <i v-else class="pi pi-lock"></i>
                        <router-link class="text-primary-400" :to="`/transaction/${data.transaction_id}`">
                            {{ data.transaction_id.slice(0, 8) }}
                        </router-link>
                    </div>
                </template>
            </Column>
            <Column header="Action" field="action"></Column>
            <Column header="Data">
                <template #body="{data}">
                    <ActDataView :data="data.data"></ActDataView>
                </template>
            </Column>
            <Column header="Block & Date">
                <template #body="{data}">
                    <div class="text-center">
                        <router-link class="text-primary-400" :to="`/block/${data.block}`">
                            {{ data.block }}
                        </router-link>
                        <br>
                        <span>{{
                                DateTime.fromISO(data.timestamp + 'Z').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
                            }}</span>
                    </div>
                </template>
            </Column>
            <template #paginatorcontainer>
                <div class="flex gap-2">
                    <ButtonGroup>
                        <Button text :loading="loading.prev" @click="loadPrev">
                            <template #icon><i class="pi pi-chevron-left"></i></template>
                        </Button>
                        <Button text :label="currentPage"></Button>
                        <Button text :loading="loading.next" @click="loadNext">
                            <template #icon><i class="pi pi-chevron-right"></i></template>
                        </Button>
                    </ButtonGroup>
                    <InputNumber v-model="query.page" show-buttons :min="1" :input-style="{width:'70px'}"></InputNumber>
                    <Button text :loading="loading.jump" @click="jumpPage">
                        <template #icon><i class="pi pi-search"></i></template>
                    </Button>
                </div>
            </template>
        </DataTable>

        <Dialog class="container max-sm:mx-2 md:w-fit" :visible="showFilterDialog"
                @update:visible="showFilterDialog = $event"
                header="Filters">
            <div class="flex gap-2 max-sm:flex-col lg:flex-nowrap mb-2">
                <FloatLabel variant="in">
                    <InputText fluid id="contract" v-model="query.contract"></InputText>
                    <label for="contract">Contract</label>
                </FloatLabel>
                <FloatLabel variant="in">
                    <InputText fluid id="action" v-model="query.action"></InputText>
                    <label for="action">Action</label>
                </FloatLabel>
            </div>
            <div class="flex gap-2 max-sm:flex-col lg:flex-nowrap mb-2">
                <FloatLabel variant="in">
                    <DatePicker fluid id="after" show-time hour-format="12" v-model="query.after"></DatePicker>
                    <label for="after">After</label>
                </FloatLabel>
                <FloatLabel variant="in">
                    <DatePicker fluid id="before" show-time hour-format="12" v-model="query.before"></DatePicker>
                    <label for="before">Before</label>
                </FloatLabel>
            </div>
            <div class="flex gap-2 max-sm:flex-col lg:flex-nowrap mb-2">
                <FloatLabel variant="in">
                    <InputText fluid id="transfer-from" v-model="query.from"></InputText>
                    <label for="transfer-from">Transfer From</label>
                </FloatLabel>
                <FloatLabel variant="in">
                    <InputText fluid id="transfer-to" v-model="query.to"></InputText>
                    <label for="transfer-to">Transfer To</label>
                </FloatLabel>
            </div>
            <div class="flex gap-2 max-sm:flex-col lg:flex-nowrap mb-2">
                <FloatLabel variant="in">
                    <InputText fluid id="transfer-memo" v-model="query.memo"></InputText>
                    <label for="transfer-memo">Transfer Memo</label>
                </FloatLabel>
            </div>
            <div class="flex gap-2 max-sm:flex-col lg:flex-nowrap">
                <FloatLabel variant="in">
                    <InputNumber fluid id="limit" :min="1" v-model="query.limit"></InputNumber>
                    <label for="limit">Limit</label>
                </FloatLabel>
                <ToggleButton class="mx-auto" v-model="query.sort" off-label="Sort Descending"
                              on-label="Sort Ascending"></ToggleButton>
            </div>
            <template #footer>
                <Button @click="doDownload" label="Download"></Button>
                <Button @click="applyCustomFilter" label="Apply"></Button>
            </template>
        </Dialog>


    </div>
</template>
<script setup>
import {onActivated, onMounted, reactive, ref} from "vue";
import {useToast} from "primevue";
import {DateTime} from "luxon";
import ActDataView from "./ActDataView.vue";
import {endpointHyperion} from "../js/nodes.js";
import ChainInfo from "../js/chain-info.js";
import {onBeforeRouteLeave} from "vue-router";
import {startInterval, download} from "../js/utils.js";

const props = defineProps({
    account: String
});
const toast = useToast();
const actions = ref([]);
const query = reactive({
    page: 1, skip: 0, limit: 20, contract: "", action: "", before: "", after: "", sort: false, from: "", to: "", memo:""
});
let searchParams = new URLSearchParams();
const loading = reactive({prev: false, next: false, jump: false});
const scroll = ref();
const filterOptions = ref(["Incoming", "Outgoing", "System"]);
const filterValue = ref("");
const totalActions = reactive({value: 0, relation: "eq"});
const currentPage = ref("1");
const showFilterDialog = ref(false);
let stopPending = null;
let stopLIB = null;

onMounted(() => {
    ChainInfo.getChainInfo();
    applyFilter("none");
    loadActions(false);
    stopPending = startInterval(refreshPending, 1000);
    stopLIB = startInterval(ChainInfo.getChainInfo, 3000);
});

onActivated(() => {
    if (searchParams.get("account") !== props.account) {
        query.contract = "";
        query.action = "";
        filterValue.value = "none";
        actions.value = [];
        applyFilter("none");
        loadActions(false);
    } else {
        ChainInfo.getChainInfo().then(recalculatePending);
    }
    stopPending = startInterval(refreshPending, 1000);
    stopLIB = startInterval(ChainInfo.getChainInfo, 3000);
});

onBeforeRouteLeave(() => {
    stopPending();
    stopLIB();
});

async function doDownload() {
    showFilterDialog.value = false;
    query.page = 1;
    applyFilter("custom");
    searchParams.set("limit", "1000");
    toast.add({group: "download", summary: "Downloading Actions"});
    let filename = `Actions-${props.account}_${DateTime.now().toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}.tsv`;

    let rows = await fetchActions();
    if (rows.length > 0) {
        let format = isTransferQuery() ? formatTransfer : formatSystem;
        let data = format(rows);
        download(filename, data);
        query.limit = 20;
        toast.removeGroup("download");
        toast.add({life: 3000, severity: "success", summary: "Download Actions", detail: "download complete"});
    } else {
        toast.removeGroup("download");
        toast.add({life: 3000, severity: "error", summary: "Download Failed", detail: e.message});
    }
}

function formatTransfer(rows) {
    let log = "Time\tContract\tFrom\tTo\tQuantity\tMemo\tTX\tBlock\n";
    rows.forEach(it => {
        let time = DateTime.fromISO(`${it.timestamp}Z`).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
        log += `${time}\t${it.contract}\t${it.data.from}\t${it.data.to}\t${it.data.quantity}\t${it.data.memo}\t${it.transaction_id}\t${it.block}\n`;
    });
    return log;
}

function formatSystem(rows) {
    let log = "Time\tContract\tAction\tData\tTX\tBlock\n";
    rows.forEach(it => {
        let time = DateTime.fromISO(`${it.timestamp}Z`).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
        let data = JSON.stringify(it.data);
        log += `${time}\t${it.contract}\t${it.action}\t${data}\t${it.transaction_id}\t${it.block}\n`;
    });
    return log;
}

function isTransferQuery() {
    let found = 0;
    if (searchParams.has("@transfer.to")) found++;
    if (searchParams.has("@transfer.from")) found++;
    if (searchParams.has("@transfer.memo")) found++;
    return found > 0;
}

function ActionsCount() {
    let count = totalActions.value;
    if (totalActions.relation === "gte") count += '+';
    return count;
}

function onFilter(event) {
    query.page = 1;
    applyFilter(event);
    toast.add({group: "loading", summary: "Loading Please Wait"});
    loadActions().then(() => toast.removeGroup("loading"));
}

function applyCustomFilter() {
    showFilterDialog.value = false;
    query.page = 1;
    applyFilter("custom");
    toast.add({group: "loading", summary: "Loading Please Wait"});
    loadActions().then(() => toast.removeGroup("loading"));
}

function isPending(data) {
    return data.block > ChainInfo.chainInfo.last_irreversible_block_num && data.pending > 0;
}

function refreshPending() {
    actions.value.forEach(it => {
        it.pending = Math.max(it.pending - 1, 0);
    });
}

function recalculatePending() {
    actions.value.forEach(it => {
        let diff = it.block - ChainInfo.chainInfo.last_irreversible_block_num;
        it.pending = Math.floor(diff / 2);
    });
}

function pageIndex() {
    return Math.max(query.page - 1, 0);
}

function applyFilter(mode) {
    searchParams = new URLSearchParams();
    searchParams.set("account", props.account);
    searchParams.set("skip", pageIndex() * query.limit);
    searchParams.set("limit", query.limit);
    searchParams.set("simple", true);
    searchParams.set("noBinary", true);

    if (mode === "Incoming") {
        searchParams.set("@transfer.to", props.account);
        query.to = props.account;
    } else if (mode === "Outgoing") {
        searchParams.set("@transfer.from", props.account);
        query.from = props.account;
    } else if (mode === "System") {
        searchParams.set("act.account", "vexcore");
        query.contract = "vexcore";
    } else if (mode === "custom") {
        if (query.contract.length > 0) searchParams.set("act.account", query.contract);
        if (query.action.length > 0) searchParams.set("act.name", query.action);
        if (query.from.length > 0) searchParams.set("@transfer.from", query.from);
        if (query.to.length > 0) searchParams.set("@transfer.to", query.to);
        if (query.memo.length > 0) searchParams.set("@transfer.memo", query.memo);
        if (query.after) searchParams.set("after", new Date(query.after).toISOString());
        if (query.before) searchParams.set("before", new Date(query.before).toISOString());
        if (query.sort) searchParams.set("sort", "asc"); // true = ascending
    }
}
async function loadActions(showInfo = true) {
    let data = await fetchActions();
    if (data.length > 0) {
        actions.value = data;
        currentPage.value = query.page.toString();
        setTimeout(() => {
            if (scroll != null) {
                scroll.value.$el.firstElementChild.scrollTo({top: 0, behavior: "smooth"});
            }
        }, 200);
    } else {
        query.page = parseInt(currentPage.value);
        if (showInfo) toast.add({life: 3000, severity: "info", summary: "Load Actions", detail: "no actions loaded"});
    }
}

function loadPrev() {
    if (query.page > 1) query.page--;
    searchParams.set("skip", (pageIndex() * query.limit).toString());
    loading.prev = true;
    toast.add({group: "loading", summary: "Loading Please Wait"});
    loadActions().then(() => {
        loading.prev = false;
        toast.removeGroup("loading");
    });
}

function loadNext() {
    query.page++;
    searchParams.set("skip", (pageIndex() * query.limit).toString());
    loading.next = true;
    toast.add({group: "loading", summary: "Loading Please Wait"});
    loadActions().then(() => {
        loading.next = false;
        toast.removeGroup("loading");
    });
}

function jumpPage() {
    if (pageIndex() * query.limit > totalActions.value) {
        let message = "Change filter for a more efficient way to request large data sets";
        toast.add({life: 3000, severity: "error", summary: "Bad Request", detail: message});
        return;
    }

    searchParams.set("skip", (pageIndex() * query.limit).toString());
    loading.jump = true;
    toast.add({group: "loading", summary: "Loading Please Wait"});
    loadActions().then(() => {
        loading.jump = false;
        toast.removeGroup("loading");
    });
}

async function fetchActions() {
    let fullUrl = `${endpointHyperion}/v2/history/get_actions?${searchParams.toString()}`;
    let result = [];
    try {
        let res = await fetch(fullUrl, {headers: {"Content-Type": "application/json"}});
        if (res.ok) {
            res = await res.json();
            let data = res.simple_actions;
            data.forEach(it => {
                let diff = it.block - ChainInfo.chainInfo.last_irreversible_block_num;
                it.pending = Math.floor(diff / 2);
            });
            result = data;
            Object.assign(totalActions, res.total);
        } else {
            res = await res.json();
            toast.add({life: 3000, severity: "error", summary: "Fetch Actions Failed", detail: res.message});
        }
    } catch (e) {
        toast.add({life: 3000, severity: "error", summary: "Fetch Actions Failed", detail: e.message});
    }
    return result;
}
</script>

