<template>
    <div id="token-form" class="p-2">

        <div class="border border-surface rounded-md flex flex-col gap-2 p-2 shadow-md md:w-1/2 mx-auto">
            <span class="text-lg font-bold">Submit Token Detail</span>
            <div class="flex flex-col gap-2 mx-auto w-full mt-2">
                <FloatLabel variant="on">
                    <Textarea fluid id="about" rows="7" v-model="detail.about"
                              @update:modelValue="onUpdate('about')"></Textarea>
                    <label for="about">About</label>
                </FloatLabel>
                <FloatLabel variant="on">
                    <InputText fluid id="icon" v-model="stat.icon" @update:modelValue="onUpdate('icon')"></InputText>
                    <label for="icon">Icon</label>
                </FloatLabel>
                <FloatLabel variant="on">
                    <InputText fluid id="website" v-model="detail.website"
                               @update:modelValue="onUpdate('website')"></InputText>
                    <label for="website">Website</label>
                </FloatLabel>
                <FloatLabel v-for="(it,n) in socials" :key="n" variant="on">
                    <InputText fluid :id="`social-${n}`" v-model="socials[n]"
                               @update:modelValue="onUpdate('socials')"></InputText>
                    <label :for="`social-${n}`">Social</label>
                </FloatLabel>
                <Button text raised rounded icon="pi pi-plus-circle" class="mx-auto" @click="addSocial"></Button>
            </div>
            <div class="inline-flex justify-end">
                <Button label="Submit" :loading="loading" @click="submit"></Button>
            </div>
        </div>
    </div>
</template>

<script setup>

import {onBeforeRouteLeave, useRoute} from "vue-router";
import {onActivated, reactive, ref} from "vue";
import {fetchDetail, findToken, VEXTOKENLIST} from "@/js/token.js";
import {abiCache} from "@/js/nodes.js";
import {ABI, Action} from "@wharfkit/antelope";
import Wallet from "@/js/wallet.js";
import {useToast} from "primevue";
import {getErrorMessage} from "@/js/utils.js";
import {PlaceholderAuth} from "@wharfkit/signing-request";

const route = useRoute();
const toast = useToast();
const info = reactive({contract: "", symbol: ""});
const stat = reactive({id: 0, icon: ""});
const detail = reactive({about: "", website: "", socials: ""});
const socials = ref([""]);
const icon = ref("");
const update = reactive({about: 0, website: 0, icon: 0, socials: 0});
const loading = ref(false);
/**
 * @type {ABI}
 */
let abi;


onActivated(() => {
    let ticker = route.params.ticker.split("-");
    info.contract = ticker[0];
    info.symbol = ticker[1];
    getTokenStat();
    getTokenDetail();
    abiCache.getAbi(VEXTOKENLIST).then(val => abi = val);
});

onBeforeRouteLeave(() => {
    Object.keys(stat).forEach(it => delete stat[it]);
    Object.keys(detail).forEach(it => delete detail[it]);
    Object.keys(update).forEach(it => update[it] = 0);
});

function onUpdate(src) {
    update[src] += 1;
}

function addSocial() {
    socials.value.push("");
}

async function getTokenStat() {
    let rows = await findToken(info.contract, info.symbol);
    if (rows.length > 0) {
        Object.assign(stat, rows[0]);
    }
}

async function getTokenDetail() {
    let rows = await fetchDetail(info.contract, info.id);
    if (rows.length > 0) {
        Object.assign(detail, rows[0]);
        if (Array.isArray(detail.socials)) {
            socials.value = detail.socials;
        }
    }
}

function setDetail(key, value) {
    return Action.from({
        account: VEXTOKENLIST, name: "setdetail",
        authorization: [PlaceholderAuth],
        data: {id: parseInt(stat.id), key, value}
    }, abi);
}

async function submit() {
    if (!Wallet.isConnected()) {
        toast.add({severity: "error", life: 3000, summary: "Wallet not connected"});
        return;
    }
    const actions = [];
    try {
        if (update.about > 0) {
            actions.push(setDetail("about", detail.about));
        }
        if (update.website > 0) {
            actions.push(setDetail("website", detail.website));
        }
        if (update.socials > 0) {
            actions.push(setDetail("socials", socials.value.join(",")));
        }
        if (update.icon > 0) {
            const icon = Action.from({
                account: VEXTOKENLIST, name: "seticon",
                authorization: [PlaceholderAuth],
                data: {id: parseInt(stat.id), icon: stat.icon}
            }, abi);
            actions.push(icon);
        }
        if (actions.length === 0) {
            toast.add({severity: "info", life: 3000, summary: "Nothing changed"});
            return;
        }

        loading.value = true;
        await Wallet.session.transact({actions});

        loading.value = false;
        toast.add({severity: "success", life: 3000, summary: "Successfully submit token detail"});
    } catch (e) {
        loading.value = false;
        toast.add({severity: "error", life: 4000, summary: "Submit Error", detail: getErrorMessage(e)});
    }

}
</script>


