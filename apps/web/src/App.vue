<script setup lang="ts">
import { UserSchema } from '@repo/schemas'
import * as v from 'valibot'
import { onMounted } from 'vue'

onMounted(() => {
  try {
    v.parse(UserSchema, {
      id: '1',
      email: ' ',
    })
  }
  catch (error) {
    console.error(`Error parsing user: ${error}`)
  }
})
</script>

<template>
  <h1>You did it!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p>
</template>

<style scoped></style>
