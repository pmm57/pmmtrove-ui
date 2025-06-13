<script setup>
import EditItem from '@/components/EditItem.vue';
const props = defineProps(['personName', 'arrayRelated', 'enableDel']);
const emit = defineEmits(['del-relative', 'load-person']);
//
console.log("RelatedTable", props.personName, props.arrayRelated, props.enableDel);
const personYob = getYob(props.personName)
//
function getYob(name) {
  // Get birth year of relation
  const idxOfYob = name.indexOf('b.');
  if (idxOfYob === -1) return -1;
  const yearOb = name.substring(idxOfYob + 2, idxOfYob + 6)
  return Number(yearOb)
}
//
function relationType(relation) {
  if (relation.relatedType == 'ChildWith') return relation.relatedType;
  const relationYob = getYob(relation.relatedPerson);
  if ((relationYob == -1) || (personYob > relationYob)) return relation.relatedType;
  return 'HasChild'
}
//

</script>
//
<template>
  <span>Related People</span>
  <table class="table table-bordered">
    <thead class="mbhead">
      <tr class="mbrow">
        <th>Relationship</th>
        <th>Relation</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(relation, index) in props.arrayRelated">
        <td>{{ relationType(relation) }}</td>
        <td v-if="relation.relatedIdxPerson > -1">
          <a @click.prevent="$emit('load-person', relation.relatedIdxPerson)" href="#">
            {{ relation.relatedPerson }}
          </a>
        </td>
        <td v-else>
          {{ relation.relatedPerson }}
        </td>
        <td>
          <EditItem v-show="(props.enableDel) && (relation.relatedAction != 'DEL')"
            @click-item="$emit('del-relative', index)" action="Del" icon="bi-x-square" />
          <span v-show="relation.relatedAction != 'READ'">- Click Apply to Update</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>