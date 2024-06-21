<script setup>
import { ref } from 'vue';
const props = defineProps(['chgRelations', 'partners']);
const emit = defineEmits(['add-to-partner', 'close']);
//
let showLinkToPartner = ref(false);
let addingChild = props.chgRelations[props.chgRelations.length - 1];
let otherParent = '';
let idxOtherParent = -1;
console.log('ModalPartner:', props.partners);
//
function selectOther (e) {
    showLinkToPartner.value=true;
    idxOtherParent = e.target.selectedIndex;
    console.log('ModalPartner:selectOther:',idxOtherParent, props.partners[idxOtherParent]);
}
</script>
<template>
    <div class="modal">
        <div class="container-fluid"  style="width: 25rem;">
            <div class="card">
                <div class="card">
                    <h5>Select Other Parent For 
                        <a @click="$emit('close')" href="#"><i class="bi-x-square"></i></a>
                        <br> {{addingChild.relatedPerson}}
                    </h5>
                </div>
                <div class="card">
                    Other Possible Parent/s
                    <select v-model="otherParent" @change="selectOther">
                        <option v-for="option in partners" :value="option.readName">{{option.readName}}</option>
                    </select>
                </div>
                <div class="card">
                    <button
                    :class="{disabled:!showLinkToPartner}"
                    @click="$emit('add-to-partner', idxOtherParent)"
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