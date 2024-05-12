<script setup>
    import EditItem from '@/components/EditItem.vue'    
    const props = defineProps(['arrayRelated', 'enableDel'])
    const emit = defineEmits(['del-relative', 'load-person'])
    //
    console.log("RelatedTable", props.arrayRelated, props.enableDel)
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
        <td>{{ relation.relatedType }}</td>
        <td v-if="relation.relatedIdxPerson > -1">
          <a
            @click="$emit('load-person', relation.relatedIdxPerson)"
            href="#" 
          >
          {{ relation.relatedPerson }}
          </a>
        </td>
        <td v-else>
          {{ relation.relatedPerson }}
        </td>
        <td>
          <EditItem v-show="(props.enableDel) && (relation.relatedAction != 'DEL')" @click-item="$emit('del-relative', index)" action="Del" icon="bi-x-square"/>
          <span v-show="relation.relatedAction != 'READ'">- Click Apply to Update</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>