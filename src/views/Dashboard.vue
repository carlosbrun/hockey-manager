<template>
  <div class="dashboard">
    <nav class="navbar">
      <span @click="navigateTo('standings')" :class="{ active: activeTab === 'standings' }" class="nav-item">
        <span class="material-icons">leaderboard</span>
        <p>Clasificación</p>
      </span>
      <span @click="navigateTo('results')" :class="{ active: activeTab === 'results' }" class="nav-item">
        <span class="material-icons">event</span>
        <p>Resultados</p>
      </span>
      <span @click="navigateTo('roster')" :class="{ active: activeTab === 'roster' }" class="nav-item">
        <span class="material-icons">people</span>
        <p>Plantilla</p>
      </span>
      <span @click="navigateTo('teams')" :class="{ active: activeTab === 'teams' }" class="nav-item">
        <span class="material-icons">sports</span>
        <p>Equipos</p>
      </span>
      <span @click="navigateTo('stats')" :class="{ active: activeTab === 'stats' }" class="nav-item">
        <span class="material-icons">insights</span>
        <p>Estadísticas</p>
      </span>
      </nav>
    <router-view /> <!-- Aquí se cargan las vistas seleccionadas -->
  </div>
</template>

<script>
/* eslint-disable */
export default {
  name: 'Dashboard',
  data() {
    return {
      activeTab: 'standings' // pestaña activa por defecto
    };
  },
  mounted() {
    // Redirige a la clasificación por defecto al cargar el dashboard
    if (this.$route.path === '/dashboard') {
      this.$router.push('/dashboard/standings');
    }
  },
  methods: {
    navigateTo(tab) {
      this.activeTab = tab;
      this.$router.push(`/dashboard/${tab}`);
    }
  }
};
</script>

<style scoped>

</style>

  