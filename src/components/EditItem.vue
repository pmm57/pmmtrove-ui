<script setup>
const props = defineProps(['action', 'icon'])
</script>

<template>
    <a @click="$emit('click-item')" href="#">
        <span class="tooltiptext">{{action}}</span>
        <i :class=" icon "></i>
    </a>
</template>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");
/* Tooltip container */
a {
  position: relative;
  display: inline-block;
}

/* Tooltip text */
a .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: #fff;
  color: black;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;
  border-style: solid;
  border-color: lightgrey;
  /* Position the tooltip text - see examples below! */
  position: absolute;
  z-index: 1;
  top: -5px;
  right: 105%;
}

/* Show the tooltip text when you mouse over the tooltip container */
a:hover span {
  visibility: visible;
}
</style>