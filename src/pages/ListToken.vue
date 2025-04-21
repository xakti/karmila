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
                        <FloatLabel variant="in">
                            <InputText size="small" style="width: 100px" id="search" @valueChange="onSymbol"></InputText>
                            <label for="search">Search</label>
                        </FloatLabel>
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

    </div>
</template>

<script setup>
import {
    listToken,
    totalToken,
    fetchTotalToken,
    fetchTokenByTime,
    findTokenBySymbol,
    addMapTokens
} from "../js/token.js";
import {onActivated} from "vue";
import {useRouter} from "vue-router";

const router = useRouter();

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
</script>


