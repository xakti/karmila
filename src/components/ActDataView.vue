<template>
    <div class="flex flex-col">
        <p v-for="(ij,key,nm) in props.data" :key="nm" class="truncate">
            {{ key }}: {{ ij }}
        </p>
    </div>
</template>

<script setup>
const props = defineProps({data: Object});
</script>


