<script setup>
import { ref } from 'vue';
import { useUserDataStore } from '@/stores/userdata';
const userData = useUserDataStore();
const props = defineProps(['listPerson']);
const emit = defineEmits(['link-list', 'close']);
//
var disableLink = ref(true);
const nameParts = props.listPerson.split(" ");
var linkList = nameParts[0] + " " + nameParts[1];
// console.log('ModalLists:', props.listPerson, linkList);
//
var filterListDropdown = [];
for (const list of userData.userLists) {
    filterListDropdown.push(list.TroveListId + " | " + list.TroveListName);
}
//
</script>
<template>
    <div class="modal">
        <div class="container-fluid" style="width: 25rem;">
            <div class="card">
                <div class="card">
                    <h5>Select List for
                        <a @click.prevent="$emit('close')" href="#"><i class="bi-x-square"></i></a>
                    </h5>
                    <p>{{ props.listPerson }}</p>
                </div>
                <div class="card">
                    <input v-model="linkList" list="datalistListDropDown" @change="disableLink = false" />
                    <datalist id="datalistListDropDown">
                        <option v-for="option in filterListDropdown" :value="option"></option>
                    </datalist>
                </div>
                <div class="card">
                    <button :class="{ disabled: disableLink }" @click.prevent="$emit('link-list', linkList)"
                        class="btn btn-primary">Link List (need to update)
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
