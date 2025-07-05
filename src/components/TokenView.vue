<template>
    <div class="border border-surface rounded-md shadow-md p-2">
        <span class="font-bold text-xl">Tokens({{ count }})</span>
        <div v-if="tokens.length > 0">
            <ScrollPanel class="h-fit max-h-[320px]">
                <div class="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-2 p-1">
                    <div v-for="(it,n) in tokens" :key="n"
                         class="border border-surface rounded-xl shadow p-2 hover:bg-primary-200 cursor-pointer"
                         @click="openToken(it)">
                        <div class="flex gap-2 items-center">
                            <img alt="" :src="it.icon || '/token-default.png'" width="36">
                            <div class="flex flex-col">
                                <span>{{ groupNumber(it.amount) }}</span>
                                <span><span class="font-semibold">{{ it.symbol }}</span> {{ it.contract }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollPanel>
        </div>
        <div v-else class="text-center">
            <span>Balance is empty</span>
        </div>
    </div>
</template>

<script setup>
import {onActivated, onDeactivated, onMounted, ref} from 'vue';
import {useRouter} from "vue-router";
import {listToken, mapTokens, fetchTokenByTime, intoMapTokens, findToken} from "../js/token.js";
import {endpointHyperion} from "../js/nodes.js";
import {groupNumber} from "../js/utils.js";

const props = defineProps({
    account: String
});
const router = useRouter();
const tokens = ref([]);
const count = ref(0);

onMounted(hook);
onActivated(hook);

function hook() {
    if (listToken.value.length === 0) {
        fetchTokenByTime().then(res => {
            listToken.value = res.rows;
            intoMapTokens(res.rows);
        });
    }
    getTokens(props.account);
}

onDeactivated(() => {
    tokens.value = [];
    count.value = 0;
});

function openToken(data) {
    router.push(`/token/${data.contract}-${data.symbol}`);
}

async function getTokens(account) {
    let res = await fetch(`${endpointHyperion}/v2/state/get_tokens?account=${account}`);
    if (res.ok) {
        res = await res.json();
        tokens.value = res.tokens.filter(it => it.amount > 0);
        count.value = tokens.value.length;

        setTimeout(applyIcon, 1000);
    }
}

function applyIcon() {
    tokens.value.forEach(it => {
        getIcon(it.contract, it.symbol).then(icon => it.icon = icon);
    });
}

async function getIcon(contract, symbol) {
    let icon = "/token-default.png";
    let key = `${contract}-${symbol}`;
    if (mapTokens[key]) {
        let tmp = mapTokens[key].icon;
        if (tmp.length > 0) icon = tmp;
    } else {
        let rows = await findToken(contract, symbol);
        if (rows.length > 0 && rows[0].icon.length > 0) {
            icon = rows[0].icon;
        } else {
            mapTokens[key] = {icon};
        }
    }
    return icon;
}
</script>
