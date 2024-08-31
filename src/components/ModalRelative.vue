<script setup>
import { reactive, ref } from 'vue';
import { useUserDataStore } from '@/stores/userdata';
const userData = useUserDataStore();
const props = defineProps(['savedPerson', 'updatedPerson']);
const emit = defineEmits(['add-relative', 'close']);
//
var disableAdd = ref(true);
const relatedPerson = reactive ({
    relatedType : '',
    relatedPerson : '',
    relatedAction : 'ADD',
    relatedIdxPerson: -1
});
relatedPerson.relatedPerson = props.savedPerson.readName.split(",")[0];
console.log('ModalRelative:', props.savedPerson, props.updatedPerson);
//
const idxMetadataPerson = userData.metadataTypeByMetadata.findIndex((el) => el.metadataType === "Person");
var arrayRelationDropdown = [];
for (const el of userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata) {
    if (el.metadataValue != props.savedPerson.readName) {
        if (props.updatedPerson.chgRelated.findIndex((x) => x.relatedPerson == el.metadataValue) < 0) {
            // console.log ('ModalRelative :', el.metadataValue)
            arrayRelationDropdown.push(el.metadataValue);
        }
    }
}
// console.log('ModalRelative:', arrayRelationDropdown.value)
//
function validateRelation () {
    disableAdd.value = true;
    // Check we have some info
    if ((relatedPerson.relatedPerson.length == 0) || (relatedPerson.relatedType.length == 0)) {
        return;
    }
    // Check it is one of the know other people
    if (arrayRelationDropdown.findIndex((x) => x == relatedPerson.relatedPerson) > -1) {
        disableAdd.value = false;
    }
    relatedPerson.relatedIdxPerson = userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata.findIndex((el) => el.metadataValue == relatedPerson.relatedPerson);
    console.log ('ModalRelative SelectedPerson', disableAdd, arrayRelationDropdown.findIndex((x) => x == relatedPerson.relatedPerson), JSON.stringify(relatedPerson));
}
//
</script>
<template>
    <div class="modal">
        <div class="container-fluid"  style="width: 25rem;">
            <div class="card">
                <div class="card">
                    <h5>Select Related Person and Type
                        <a @click="$emit('close')" href="#"><i class="bi-x-square"></i></a>
                    </h5>
                    <p>{{props.savedPerson.readName}}</p>
                </div>
                <div class="card">
                    Related Person
                    <input v-model="relatedPerson.relatedPerson" list="datalistPersonDropDown" @change="validateRelation"/>
                    <datalist id="datalistPersonDropDown">
                        <option v-for="option in arrayRelationDropdown" :value="option"></option>
                    </datalist>
                </div>
                <div class="card">
                    Relationship Type
                    <select v-model="relatedPerson.relatedType" @change="validateRelation">
                        <option v-for="option in ['ChildOf', 'ChildWith']" :value="option">{{option}}</option>
                    </select>
                </div>
                <div class="card">
                    <button
                    :class="{disabled:disableAdd}"
                    @click="$emit('add-relative', relatedPerson)"
                    class="btn btn-primary"
                    >Select Related Person (need to update)
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>