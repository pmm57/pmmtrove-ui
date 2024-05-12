<script setup>
import { ref } from 'vue'
const props = defineProps(['chgRelations', 'arrayPartner'])
const emit = defineEmits(['add-to-partner', 'close'])
//
var showLinkToPartner = ref(false)
var addingChild = props.chgRelations[props.chgRelations.length - 1]
var otherParent = ""
console.log('ModalPartner:', props.arrayPartner)
//
</script>
<template>
    <div class="modal">
        <div class="container-fluid"  style="width: 25rem;">
            <div class="card">
                <div class="card">
                    <h5>Select Other Parent For <br> {{addingChild.relatedPerson}}
                    </h5>
                </div>
                <div class="card">
                    Other Possible Parent/s
                    <select v-model="otherParent" @change="showLinkToPartner=true">
                        <option v-for="option in arrayPartner" :value="option">{{option.readName}}</option>
                    </select>
                </div>
                <div class="card">
                    <button
                    :class="{disabled:!showLinkToPartner}"
                    @click="$emit('add-to-partner', otherParent)"
                    class="btn btn-primary"
                    >Select Parent (need to update)
                    </button>
                </div>
                <div class="card">
                    <button
                    @click="$emit(('close'))"
                    class="btn btn-primary"
                    >Not One of these
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>