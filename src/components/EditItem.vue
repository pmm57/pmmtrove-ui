<script setup>
const props = defineProps(['action', 'icon'])
</script>

<template>
  <a @click.prevent="$emit('click-item')" href="#">
    <span class="tooltiptext">{{ action }}</span>
    <i :class="icon"></i>
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
  /* Position the tooltip text */
  position: absolute;
  z-index: 1;
  top: 100%;
  /* place below the anchor */
  left: 50%;
  /* start at the horizontal center */
  transform: translateX(-50%);
  /* shift back half its width */
  margin-top: 5px;
  /* small gap below the anchor */

}

/* Show the tooltip text when you mouse over the tooltip container */
a:hover span {
  visibility: visible;
}
</style>