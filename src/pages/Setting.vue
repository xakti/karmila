<template>
    <div id="setting">

        <Card class="drop-shadow m-2 md:w-1/2 md:mx-auto">
            <template #title>
                Setting
                <div class="float-right">
                    <transition mode="out-in" name="fade">
                        <i v-if="dark" class="pi pi-moon cursor-pointer" @click="onDark"></i>
                        <i v-else class="pi pi-sun cursor-pointer" @click="onDark"></i>
                    </transition>
                </div>
            </template>
            <template #content>
                <Fieldset legend="Nodes">
                    <div class="flex flex-col">
                        <div v-for="(it,key,n) in listNodes" :key="n" class="flex justify-between">
                            <div class="inline-flex gap-2 items-center">
                                <RadioButton @update:model-value="onNode" v-model="node" name="node" :value="key"/>
                                {{ it.name }}
                                <Tag v-if="it.hyperion" value="hyperion" class="cursor-pointer select-none"
                                  :icon="isCurrentHyperion(key)" @click="setHyperion(key)"></Tag>
                            </div>
                            <span>{{ it.speed }}</span>
                        </div>
                    </div>
                </Fieldset>
            </template>
        </Card>
    </div>
</template>
<script setup>

import {onActivated, ref} from "vue";
import {useToast} from "primevue";
import {onBeforeRouteLeave} from "vue-router";
import {
    getSelectedHyperion,
    getSelectedNode,
    initWharfkit,
    listNodes,
    pingAllNodes,
    saveHyperion,
    saveNode
} from "@/js/nodes.js";
import {startInterval} from "@/js/utils.js";

const toast = useToast();
const dark = ref(false);
const node = ref();
const hyperionNode = ref();
let stopPing = null;

onActivated(() => {
    pingAllNodes();
    node.value = getSelectedNode();
    hyperionNode.value  = getSelectedHyperion();

    let isDark = localStorage.getItem("dark-mode");
    if (isDark) {
        dark.value = true;
    }
    stopPing = startInterval(pingAllNodes, 3000);
});

onBeforeRouteLeave(() => {
    if (node.value !== getSelectedNode()) {
        applyNode();
    }
    stopPing();
});

function setHyperion(id) {
    hyperionNode.value = id;
    saveHyperion(id);
}

function isCurrentHyperion(key) {
    if (key === hyperionNode.value) return "pi pi-check";
    return "";
}

function onDark() {
    dark.value = !dark.value;
    if (dark.value) {
        localStorage.setItem("dark-mode", 'yes');
    } else {
        localStorage.removeItem("dark-mode");
    }
    setTimeout(() => {
        document.documentElement.classList.toggle('ui-dark');
    }, 400);
}

function onNode(val) {
    node.value = val;
}

function applyNode() {
    saveNode(node.value);
    initWharfkit();
}
</script>


