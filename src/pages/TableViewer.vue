<template>
    <div id="table-view">

        <div class="border rounded-md border-surface shadow-md m-2 p-1">
            <DataTable ref="scroll" :value="tableData.rows" scrollable scroll-height="560px">
                <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"
                        :sortable="true"></Column>
                <template #empty>
                    <span>no data loaded</span>
                </template>
                <template #footer>
                    <div class="flex justify-end gap-2">
                        <Button icon="pi pi-search" @click="showDrawer = true"></Button>
                        <Button :loading="loading.more" label="More" @click="loadMore"></Button>
                    </div>
                </template>
            </DataTable>
        </div>

        <Drawer v-model:visible="showDrawer" position="right" @update:visible="showDrawer = false"
                header="Table Viewer">
            <div class="flex flex-col gap-2">
                <FloatLabel variant="in">
                    <AutoComplete fluid input-id="code" :delay="700" v-model="state.code" :suggestions="suggestions.contract"
                                  @complete="completeContract" @itemSelect="onSelectCode"></AutoComplete>
                    <label for="code">Code</label>
                </FloatLabel>
                <InputGroup>
                    <FloatLabel variant="in">
                        <InputText fluid id="scope" maxlength="12" type="text"
                                   v-model="state.scope"></InputText>
                        <label for="scope">Scope</label>
                    </FloatLabel>
                    <InputGroupAddon>
                        <Button text size="small" icon="pi pi-search" @click="showScopeDialog"></Button>
                    </InputGroupAddon>
                </InputGroup>
            </div>
            <div class="flex justify-between gap-2 my-2">
                <Select placeholder="Table" v-model="state.table" :options="tables"
                        option-label="name" option-value="name" @update:modelValue="onSelectTable"></Select>
                <Select placeholder="Index Type" v-model="state.keyType" :options="indexType"></Select>
            </div>
            <div class="flex gap-2">
                <FloatLabel variant="in">
                    <InputNumber fluid id="index-pos" v-model="state.indexPosition"></InputNumber>
                    <label for="index-pos">Index Position</label>
                </FloatLabel>
                <FloatLabel variant="in">
                    <InputNumber fluid id="limit" v-model="state.limit"></InputNumber>
                    <label for="limit">Limit</label>
                </FloatLabel>
            </div>
            <div class="flex flex-col my-2 gap-2">
                <FloatLabel variant="in">
                    <InputText fluid id="lower-bound" v-model="state.lowerBound"></InputText>
                    <label for="lower-bound">Lower Bound</label>
                </FloatLabel>
                <FloatLabel variant="in">
                    <InputText fluid id="upper-bound" v-model="state.upperBound"></InputText>
                    <label for="upper-bound">Upper Bound</label>
                </FloatLabel>
                <div class="flex justify-center gap-2 items-center">
                    <span>Reverse Order</span>
                    <ToggleButton v-model="state.reverse" size="small" on-label="Yes" off-label="No"/>
                </div>
            </div>
            <div class="flex mt-2 gap-2 justify-center">
                <Button label="Download" :loading="loading.download"
                        @click="downloadRows"></Button>
                <Button label="Go" :loading="loading.go" @click="doFetch"></Button>
            </div>
        </Drawer>

        <Dialog class="container w-fit" position="bottom" v-model:visible="showDialog"
                @update:visible="showDialog = false"
                header="Scope" style="min-width: 320px">
            <div class="flex gap-2 flex-wrap">
                <Button v-for="(it,n) in scope.rows" :key="n" size="small" text :label="it.toString()"
                        @click="state.scope = it"></Button>
            </div>
            <template #footer>
                <div class="flex gap-2">
                    <FloatLabel variant="in">
                        <InputText id="bound" v-model="scope.more"></InputText>
                        <label for="bound">Lower Bound</label>
                    </FloatLabel>
                </div>
                <Button label="More" :loading="loading.scope" @click="moreScope"></Button>
            </template>
        </Dialog>

    </div>
</template>
<script setup>

import {onActivated, reactive, ref} from "vue";
import {useToast} from "primevue";
import {onBeforeRouteLeave, useRoute} from "vue-router";
import {DateTime} from "luxon";
import {client} from "../js/nodes.js"
import {download} from "../js/utils.js";
import {suggestions, completeContract} from "../js/auto.js";

const route = useRoute();
const toast = useToast();
const scroll = ref();
const state = reactive({
    code: "", scope: "", table: "", lowerBound: "", upperBound: "",
    limit: 20, indexPosition: 1, keyType: "i64", reverse: false
});
const loading = reactive({go: false, more: false, scope: false, download: false});
const tables = ref([]);
const tableData = reactive({more: false, rows: []});
const indexType = ref([
    "i64", "i128", "i256",
    "float64", "float128",
    "sha256", "ripemd160", "name"
]);
const scope = reactive({rows: [], more: "", lowerBound: ""});
const columns = ref([]);
const showDrawer = ref(false);
const showDialog = ref(false);

onActivated(hook);

function hook() {
    if (route.query.contract) {
        parseQuery();
    }
}

onBeforeRouteLeave(() => {
    scope.rows = [];
    scope.lowerBound = "";
});

async function parseQuery() {
    let query = route.query;
    state.code = query.contract;
    state.scope = query.scope;
    state.table = query.table;
    state.indexPosition = 1;
    state.keyType = "i64";
    state.lowerBound = "";
    await buildTableData();
    fetchAbi();
}

function showScopeDialog() {
    if (state.table.length === 0) {
        toast.add({life: 3000, severity: "warn", summary: "Table", detail: "select table to view"});
        return;
    }

    fetchScope();
    showDialog.value = true;
}

function onSelectTable(event) {
    // ganti tabel, kosongkan bound
    scope.lowerBound = "";
}

function onSelectCode(event) {
    state.code = event.value;
    fetchAbi();
}

async function loadMore() {
    if (tableData.more) {
        if (state.reverse) {
            state.upperBound = tableData.next_key;
        } else {
            state.lowerBound = tableData.next_key;
        }
        loading.more = true;
        try {
            await buildTableData();
            loading.more = false;
            setTimeout(() => {
                if (scroll.value != null) {
                    scroll.value.$el.firstElementChild.scrollTo({top: 0, behavior: "smooth"});
                }
            }, 200);
        } catch (e) {
            loading.more = false;
            toast.add({life: 3000, severity: "error", summary: "Load Table Failed", detail: e.message});
        }
    } else {
        toast.add({life: 3000, severity: "info", summary: "Load Table", detail: "no more data"});
    }
}

async function doFetch() {
    loading.go = true;
    try {
        await buildTableData();
        loading.go = false;
        showDrawer.value = false;
    } catch (e) {
        loading.go = false;
        toast.add({life: 3000, severity: "warn", summary: "Wrong Query", detail: e.message});
    }
}

async function buildTableData() {
    let res = await fetchTable();
    if (res.rows.length > 0) {
        let data = res.rows[0];
        let tmp = [];
        Object.keys(data).forEach(it => {
            tmp.push({header: it, field: it});
        });
        columns.value = tmp;
        Object.assign(tableData, res);
    }
}

async function fetchTable() {
    let params = {
        json: true, code: state.code, scope: state.scope,
        table: state.table,
        index_position: state.indexPosition,
        key_type: state.keyType,
        limit: state.limit,
        reverse: state.reverse
    };
    if (state.lowerBound) params.lower_bound = state.lowerBound;
    if (state.upperBound) params.upper_bound = state.upperBound;

    return client.v1.chain.get_table_rows(params);
}

async function fetchAbi() {
    try {
        let data = await client.v1.chain.get_abi(state.code);
        tables.value = data.abi.tables;
    } catch (e) {
        toast.add({life: 3000, severity: "error", summary: "Load ABI", detail: "failed to load abi"});
    }
}

async function fetchScope() {
    if (state.table.length === 0) {
        toast.add({life: 3000, severity: "warn", summary: "Table", detail: "select table to view"});
        return;
    }

    let params = {code: state.code, table: state.table, limit: 20};
    if (scope.lowerBound) params.lower_bound = scope.lowerBound;
    let res = await client.v1.chain.get_table_by_scope(params);
    if (res.rows.length > 0) {
        scope.rows = res.rows.map(it => it.scope);
        scope.more = res.more;
    }
}

async function moreScope() {
    loading.scope = true;
    scope.lowerBound = scope.more;
    try {
        await fetchScope();
        loading.scope = false;
    } catch (e) {
        loading.scope = false;
    }
}

async function downloadRows() {
    let filename = `Table_${state.table}_${state.code}_${DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}.tsv`;
    let print = "";
    loading.download = true;
    toast.add({group: "download", summary: "Downloading Table Rows"});
    try {
        let res = await fetchTable();
        if (res.rows.length > 0) {
            let data = res.rows[0];
            let header = Object.keys(data);
            print = header.join("\t") + "\n";
            res.rows.forEach(it => {
                let value = Object.values(it).join("\t");
                print += value + "\n";
            });
            download(filename, print);
            loading.download = false;
            toast.removeGroup("download");
        } else {
            loading.download = false;
            toast.removeGroup("download");
            toast.add({life: 3000, severity: "info", summary: "Download Table Rows", detail: "no data downloaded"});
        }
    } catch (e) {
        loading.download = false;
        toast.removeGroup("download");
        toast.add({life: 3000, severity: "error", summary: "Download Table Failed", detail: e.message});
    }
}
</script>
