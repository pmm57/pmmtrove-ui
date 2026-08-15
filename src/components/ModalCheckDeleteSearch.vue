<script setup>
const props = defineProps(['deleteSearchId']);
defineEmits(['confirm', 'close']);
//
</script>
<template>
    <div class="modal">
        <div class="container-fluid" style="width: 15rem;">
            <div class="card">
                <div class="card">
                    <h5 class="position-relative text-center">Confirm Delete</h5>
                    <p class="text-center"><b>Search Id:{{ props.deleteSearchId }}</b></p>
                </div>
                <div class="card">
                    <button @click.prevent="$emit('confirm')"
                        class="btn btn-danger">Confirm Delete</button>
                </div>
                <div class="card">
                    <button @click.prevent="$emit('close')"
                        class="btn btn-secondary">Keep Search</button>
                </div>
            </div>
        </div>
    </div>
</template>
