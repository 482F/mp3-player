<template>
  <v-icon class="loading"> mdi-loading </v-icon>
</template>

<script>
export default {
  name: 'loading-icon',
}
</script>
<style lang="scss" scoped>
.loading {
  animation: 1s linear infinite rotation;
  @keyframes rotation {
    0% {
      transform: rotateZ(0);
    }
    100% {
      transform: rotateZ(360deg);
    }
  }
}
</style>
