<script setup>
import { availableUsers, loadMockUsers, selectMockUser } from '@/auth/mockAuth'
import { onMounted } from 'vue'

onMounted(() => loadMockUsers())
</script>

<template>
    <div class="mock-login">
        <h3>Select a mock user</h3>
        <select @change="selectMockUser($event.target.value)">
            <option value="">-- choose user --</option>
            <option v-for="user in availableUsers" :key="user" :value="user">
                {{ user }}
            </option>
        </select>
    </div>
</template>