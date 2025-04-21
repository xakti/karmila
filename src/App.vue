<template>
    <RouterView v-slot="{Component}">
        <keep-alive max="7">
            <component :is="Component"/>
        </keep-alive>
    </RouterView>

    <Toast class="max-w-9/10"/>
    <Toast group="download" position="center" class="max-w-9/10">
        <template #container="{message}">
            <section class="flex flex-col p-2 gap-4 w-full rounded-xl">
                <div class="flex items-center gap-5">
                    <i class="pi pi-cloud-download text-2xl"></i>
                    <span class="font-bold text-base">{{ message.summary }}</span>
                </div>
                <div class="flex flex-col gap-2">
                    <ProgressBar mode="indeterminate" :style="{ height: '4px' }"></ProgressBar>
                </div>
            </section>
        </template>
    </Toast>
    <Toast group="loading" position="center" class="max-w-9/10">
        <template #container="{message}">
            <section class="flex flex-col p-4 gap-4 w-full rounded-xl">
                <div class="flex items-center gap-5">
                    <i class="pi pi-hourglass text-2xl"></i>
                    <span class="font-bold text-base">{{ message.summary }}</span>
                </div>
                <div class="flex flex-col gap-2">
                    <ProgressBar mode="indeterminate" :style="{ height: '4px' }"></ProgressBar>
                    <span class="font-bold text-base">{{ message.detail }}</span>
                </div>
            </section>
        </template>
    </Toast>

</template>
<script setup>

import {onMounted} from "vue";
import {loadNode, initWharfkit} from "./js/nodes.js";

onMounted(() => {
    loadNode();
    initWharfkit();

    let dark = localStorage.getItem("dark-mode");
    if (dark) {
        document.documentElement.classList.toggle('ui-dark');
    }
});

</script>
