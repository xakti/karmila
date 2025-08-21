<template>
    <div id="vex-guardian" class="p-2">

        <div v-if="ready" class="border rounded-md shadow-md border-surface p-1 md:w-2/3 mx-auto">
            <DataTable :value="newborn" size="small" resizable-columns scrollable scroll-height="500px">
                <template #header>
                    <span class="font-bold text-lg">Vex Guardians</span>
                    <p>Mereka yang menjaga keamanan dan desentralisasi jaringan</p>
                </template>
                <Column header="Account">
                    <template #body="{data}">
                        <router-link class="text-primary-400" :to="`/account/${data.data.voter}`">
                            {{ data.data.voter }}
                        </router-link>
                    </template>
                </Column>
                <Column header="Producers">
                    <template #body="{data}">
                        <div class="flex flex-wrap gap-2">
                            <router-link v-for="(it,n) of data.data.producers" :key="n" class="text-primary-400"
                                         :to="`/account/${it}`">
                                {{ it }}
                            </router-link>
                        </div>
                    </template>
                </Column>
                <Column header="Time"
                        :field="it => DateTime.fromISO(it.timestamp + 'Z').toRelative()"></Column>
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
import {onActivated, ref} from "vue";
import {DateTime} from "luxon";
import {endpointHyperion} from "../js/nodes.js";
import {useToast} from "primevue";

const toast = useToast();
const newborn = ref([]);
const ready = ref(false);


onActivated(() => {
    fetchNewAccount();
});

async function fetchNewAccount() {
    let url = `${endpointHyperion}/v2/history/get_actions?account=vexcore&act.name=voteproducer&simple=true&limit=50`;
    try {
        let res = await fetch(url);
        if (res.ok) {
            res = await res.json();
            newborn.value = res.simple_actions;
            ready.value = true;
        }
    } catch (e) {
        toast.add({life: 3000, severity: "error", summary: "Loading Error", detail: e.message});
    }
}
</script>


