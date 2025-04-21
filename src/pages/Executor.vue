<template>
    <div id="executor" class="p-2">

        <Card class="drop-shadow md:w-1/2 md:mx-auto">
            <template #title>Executor</template>
            <template #content>
                <div class="flex flex-col gap-1">
                    <IftaLabel>
                        <AutoComplete fluid input-id="contract" :delay="700" v-model="state.contract" :suggestions="suggestions.contract"
                                      @complete="completeContract" @itemSelect="onSelectCode"></AutoComplete>
                        <label for="contract">Contract</label>
                    </IftaLabel>
                    <Select placeholder="Select Action" :options="actions" v-model="actionSelect"
                            option-label="name" @update:modelValue="onAction"></Select>
                    <div v-for="(it,n) in state.fields" :key="n">
                        <IftaLabel>
                            <InputText fluid :id="it.name" type="text" v-model="data[it.name]"></InputText>
                            <label :for="it.name">{{ it.name }}<{{ it.type }}></label>
                        </IftaLabel>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end mt-2">
                    <Button :loading="state.loading" label="Run" @click="run"></Button>
                </div>
            </template>
        </Card>

    </div>
</template>

<script setup>

import {onActivated, reactive, ref} from "vue";
import {useRoute} from "vue-router";
import {useToast} from "primevue";
import {contractKit} from "../js/nodes.js";
import {suggestions, completeContract} from "../js/auto.js";
import Wallet from "../js/wallet.js";
import {copyToClipboard} from "@/js/utils.js";

const route = useRoute();
const toast = useToast();
const actionSelect = ref();
const state = reactive({contract: "", action: "", fields: [], loading: false});
const data = reactive({});
/**
 *
 * @type {Contract}
 */
let contract = null;
/**
 *
 * @type {ABI.Action[]}
 */
const actions = ref([]);

onActivated(() => {
    parseQuery();
});

async function parseQuery() {
    if (route.query.contract) {
        let query = route.query;
        state.contract = query.contract;
        state.action = query.action;

        await loadContract();
        let n = contract.abi.actions.findIndex(it => it.name.equals(query.action));
        if (n === -1) {
            toast.add({
                life: 3000,
                severity: "error",
                summary: "Wrong Action",
                detail: `action ${query.action} not found`
            });
            return;
        }

        let action = contract.abi.actions[n];
        actionSelect.value = action;
        state.fields = contract.abi.getStruct(action.type).fields;
    }
}
function onSelectCode(event) {
    state.contract = event.value;
    loadContract();
}


/**
 *
 * @param {ABI.Action} action
 */
function onAction(action) {
    actionSelect.value = action;
    state.action = action.name;
    state.fields = contract.abi.getStruct(action.type).fields;
}

async function loadContract() {
    contract = await contractKit.load(state.contract);
    actions.value = contract.abi.actions;
}

function parseType() {
    state.fields.forEach(it => {
        if (it.type.includes("int")) {
            data[it.name] = parseInt(data[it.name]);
        } else if (it.type.endsWith("[]")) {
            data[it.name] = data[it.name].split(",");
        }
    });
}


async function run() {

    parseType();
    state.loading = true;
    try {
        let action = contract.action(state.action, data, {authorization: [Wallet.getAuthorization()]});
        let sr = await Wallet.createSigningRequest({action});
        let vsr = sr.encode(true, false, "vsr:");
        copyToClipboard(vsr);

        state.loading = false;
        toast.add({life: 3000, severity: "success", summary: "Run Action", detail: "vsr copied"});
    } catch (e) {
        console.log(e.message);
        state.loading = false;
        toast.add({life: 4000, severity: "error", summary: "Action Failed", detail: e.message});
    }
}

</script>

