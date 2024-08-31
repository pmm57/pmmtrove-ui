<script setup>
const props = defineProps(['index', 'count'])
// console.log ('StatuCount ', props)
var classCount = 'badge ';
var outCount = props.count;
if (Number(props.count) == 0) {
  classCount += 'text-bg-light';
  outCount = "-";
} else {
  switch (Number(props.index)) {
    case 0:
      classCount += 'text-bg-dark';
      break;
    case 1:
      classCount += 'text-bg-secondary';
      break;
    case 2:
      classCount += 'text-bg-warning';
      break;
    case 3:
      classCount += 'text-bg-primary';
      break;
    case 4:
      classCount += 'text-bg-info';
      break;
    case 5:
      classCount += 'text-bg-success';
      break;  
    default:
      classCount += 'text-bg-danger';
      break;
  }
}
</script>

<template>
    <span :class="classCount">{{ outCount }}</span>
</template>

<style>
</style>