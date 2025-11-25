<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
    inSearchText: {
        type: String,
        default: ''
    }
})
// Emits
const emit = defineEmits(['chgSearch', 'close'])

// ✅ Make searchText reactive
const searchText = ref(props.inSearchText)
// console.log(`EditArticle/ModalSearchText In %s`, searchText.value)
// Handler to emit both events
function updateAndClose() {
    // console.log(`EditArticle/ModalSearchText Out %s`, searchText.value)
    emit('chgSearch', searchText.value)
    emit('close')
}
</script>

<template>
    <div class="modal">
        <div class="container-fluid" style="width: 25rem; max-height: 75vh">
            <div class="card">
                <h5 class="d-flex justify-content-between align-items-center">
                    Update Search Text
                    <a @click="emit('close')" href="#"><i class="bi-x-square"></i></a>
                </h5>
                <input v-model="searchText" />
                <button @click.prevent="updateAndClose" class="btn btn-primary"
                    :class="searchText.length > 4 ? 'btn-primary' : 'btn-secondary'" :disabled="searchText.length <= 4">
                    Search
                </button>
            </div>
        </div>
    </div>
</template>