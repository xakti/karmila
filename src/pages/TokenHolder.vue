<template>
    <div id="token-holder" class="p-2">

        <div v-if="ready" class="border border-surface rounded-md shadow p-1">
            <span class="font-bold p-2">Top Holders {{ ticker.symbol }}</span>
            <DataTable ref="scroll" :value="holders.rows" paginator :rows="holders.limit" resizable-columns scrollable
                       scroll-height="520px">
                <Column header="Rank" field="rank"></Column>
                <Column header="Account">
                    <template #body="{data}">
                        <router-link :to="`/account/${data.owner}`">{{ data.owner }}</router-link>
                    </template>
                </Column>
                <Column header="Amount">
                    <template #body="{data}">
                        <span>{{ data.amount }} {{ data.symbol }}</span>
                    </template>
                </Column>
                <Column header="Updated">
                    <template #body="{data}">
                        <router-link :to="`/block/${data.updated_on}`">{{ data.updated_on }}</router-link>
                    </template>
                </Column>
                <template #paginatorcontainer>
                    <div class="flex gap-2">
                        <ButtonGroup>
                            <Button text :loading="loading.prev" @click="loadPrev">
                                <template #icon><i class="pi pi-chevron-left"></i></template>
                            </Button>
                            <Button text :label="holders.currentPage.toString()"></Button>
                            <Button text :loading="loading.next" @click="loadNext">
                                <template #icon><i class="pi pi-chevron-right"></i></template>
                            </Button>
                        </ButtonGroup>
                        <InputNumber v-model="holders.page" show-buttons :min="1"
                                     :input-style="{width:'70px'}"></InputNumber>
                        <Button text :loading="loading.jump" @click="jumpPage">
                            <template #icon><i class="pi pi-search"></i></template>
                        </Button>
                    </div>
                </template>
            </DataTable>
        </div>
        <div v-else class="flex h-screen w-screen">
            <div class="m-auto">
                <ProgressSpinner stroke-width="5"></ProgressSpinner>
            </div>
        </div>

    </div>
</template>

<script setup>
import {useRoute, useRouter} from "vue-router";
import {useToast} from "primevue";
import {onActivated, reactive, ref} from "vue";
import {endpointHyperion} from "../js/nodes.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const scroll = ref();
const ticker = reactive({contract: "", symbol: ""});
const holders = reactive({rows: [], skip: 0, limit: 100, page: 1, currentPage: 1});
const ready = ref(false);
const loading = reactive({prev: false, next: false, jump: false});

onActivated(() => {
    let tmp = route.params.ticker.split("-");

    if (holders.rows.length === 0 || ticker.symbol !== tmp[1]) {
        ticker.contract = tmp[0];
        ticker.symbol = tmp[1];
        holders.page = 1;
        holders.currentPage = 1;
        ready.value = false;
        fetchHolder(0, holders.limit).then(rows => holders.rows = rows);
    }

});

function pageIndex() {
    return Math.max(holders.page - 1, 0);
}

async function loadNext() {
    holders.page++;
    loading.next = true;
    let skip = (pageIndex() * holders.limit);
    let rows = await fetchHolder(skip, holders.limit);
    if (rows.length > 0) {
        holders.rows = rows;
        holders.currentPage = holders.page;
        setTimeout(() => {
            scroll.value.$el.firstElementChild.scrollTo({top: 0, behavior: "smooth"});
        }, 200);
    } else {
        holders.page = holders.currentPage;
    }
    loading.next = false;
}

async function loadPrev() {
    if (holders.page > 1) holders.page--;
    loading.prev = true;
    let skip = (pageIndex() * holders.limit);
    let rows = await fetchHolder(skip, holders.limit);
    if (rows.length > 0) {
        holders.rows = rows;
        holders.currentPage = holders.page;
        setTimeout(() => {
            scroll.value.$el.firstElementChild.scrollTo({top: 0, behavior: "smooth"});
        }, 200);
    } else {
        holders.page = holders.currentPage;
    }
    loading.prev = false;
}

async function jumpPage() {
    loading.jump = true;
    let skip = (pageIndex() * holders.limit);
    let rows = await fetchHolder(skip, holders.limit);
    if (rows.length > 0) {
        holders.rows = rows;
        holders.currentPage = holders.page;
        setTimeout(() => {
            scroll.value.$el.firstElementChild.scrollTo({top: 0, behavior: "smooth"});
        }, 200);
    } else {
        holders.page = holders.currentPage;
    }
    loading.jump = false;
}


async function fetchHolder(skip, limit) {
    let url = `${endpointHyperion}/v2/state/get_top_holders?contract=${ticker.contract}&symbol=${ticker.symbol}&skip=${skip}&limit=${limit}`;
    let res = await fetch(url);
    if (res.ok) {
        res = await res.json();
        let rank = skip + 1;
        res.holders.forEach(it => {
            it.rank = rank;
            rank++;
        });
        ready.value = true;
        return res.holders;
    }
    return [];
}
</script>


