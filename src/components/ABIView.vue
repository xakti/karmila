<template>
    <Card class="drop-shadow">
        <template #content>
            <Panel toggleable collapsed>
                <template #header>
                    <span class="font-bold text-lg">Contract ABI</span>
                </template>
                <template #default>
                    <Fieldset v-if="tables.length > 0" legend="Tables" class="w-fit">
                        <div class="flex flex-wrap">
                            <Button v-for="(it,n) in tables" :key="n"
                                    size="small" text @click="viewTable(it.name)" :label="it.name">
                            </Button>
                        </div>
                    </Fieldset>
                    <Fieldset v-if="actions.length > 0" legend="Actions" class="w-fit">
                        <div class="flex flex-wrap">
                            <Button v-for="(it,n) in actions" :key="n"
                                    size="small" text @click="executor(it.name)" :label="it.name">
                            </Button>
                        </div>
                    </Fieldset>
                    <div class="flex justify-end mt-2">
                        <Button @click="doDownload" label="Unduh"></Button>
                    </div>
                </template>
            </Panel>
        </template>
    </Card>
</template>

<script setup>

import {useRouter} from "vue-router";
import {onActivated, onMounted, ref, watch} from "vue";
import {download} from "@/js/utils.js";

const router = useRouter();
const props = defineProps({abi: Object, contract: String});
const tables = ref([]);
const actions = ref([]);

onMounted(hook);
onActivated(hook);

function hook() {
    tables.value = props.abi.tables;
    actions.value = props.abi.actions;
}

watch(() => props.abi, hook);

function viewTable(name) {
    router.push(`/table?contract=${props.contract}&scope=${props.contract}&table=${name}`);
}

function executor(name) {
    router.push(`/executor?contract=${props.contract}&action=${name}`);
}

function doDownload() {
    const fileName = `${props.contract}_ABI.json`;
    const data = JSON.stringify(props.abi, null, 4);
    download(fileName, data);
}

</script>

