<template>
    <div id="executor" class="p-2">

        <Card class="drop-shadow md:w-1/2 md:mx-auto">
            <template #title>Executor</template>
            <template #content>
                <div class="flex flex-col gap-1">
                    <IftaLabel>
                        <AutoComplete fluid input-id="contract" :delay="700" v-model="state.contract"
                                      :suggestions="suggestions.contract"
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
import {PlaceholderAuth} from "@wharfkit/signing-request";
import {ABI, Action} from "@wharfkit/antelope";
import {abiCache} from "../js/nodes.js";
import {completeContract, suggestions} from "../js/auto.js";
import Wallet from "../js/wallet.js";
import {copyToClipboard, getErrorMessage, toBoolean} from "../js/utils.js";

const route = useRoute();
const toast = useToast();
const actionSelect = ref();
const state = reactive({contract: "", action: "", fields: [], loading: false});
const data = reactive({});
/**
 *
 * @type {ABI}
 */
let abi = null;
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

        await loadABI();
        let n = abi.actions.findIndex(it => it.name.equals(query.action));
        if (n === -1) {
            toast.add({
                life: 3000,
                severity: "error",
                summary: "Wrong Action",
                detail: `action ${query.action} not found`
            });
            return;
        }

        let action = abi.actions[n];
        actionSelect.value = action;
        state.fields = abi.getStruct(action.type).fields;
    }
}

function onSelectCode(event) {
    state.contract = event.value;
    loadABI();
}

async function loadABI() {
    abi = await abiCache.getAbi(state.contract);
    actions.value = abi.actions;
}

/**
 *
 * @param {ABI.Action} action
 */
function onAction(action) {
    actionSelect.value = action;
    state.action = action.name;
    state.fields = abi.getStruct(action.type).fields;
}

function parseData() {
    state.fields.forEach(it => {
        if (it.type === "bool") {
            data[it.name] = toBoolean(data[it.name]);
        }
    });
}

async function run() {
    state.loading = true;
    try {
        parseData();
        const abi = await abiCache.getAbi(state.contract);
        const action = Action.from({
            account: state.contract, name: state.action,
            authorization: [PlaceholderAuth], data
        }, abi);
        let req = await Wallet.createSigningRequest({action});
        let vsr = req.encode(true, false, "vsr:");
        let msg;
        if (Wallet.isConnected()) {
            await Wallet.session.signingRequest(vsr);
            msg = "transaction broadcasted successfully";
        } else {
            copyToClipboard(vsr);
            msg = "vsr copied";
        }
        state.loading = false;
        toast.add({life: 3000, severity: "success", summary: "Run Action", detail: msg});
    } catch (e) {
        state.loading = false;
        toast.add({life: 4000, severity: "error", summary: "Run Failed", detail: getErrorMessage(e)});
    }
}

</script>

