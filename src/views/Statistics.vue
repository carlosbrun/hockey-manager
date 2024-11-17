<template>
  <div class="statistics-page">
    <h2>Estadísticas</h2>
    <table class="top-scorers-table">
      <thead>
        <tr>
          <th></th>
          <th>Nombre</th>
          <th>Dorsal</th>
          <th>Goles</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="player in players" :key="player.player_id">
          <td>
            <img v-if="player.photo_path" :src="`${apiUrl}${player.photo_path}`" alt="Foto del jugador" class="player-photo" />
            <img v-else :src="`${apiUrl}/uploads/players/default.png`" alt="Foto del jugador" class="player-photo" />
          </td>
          <td>{{ player.name }}</td>
          <td>{{ player.number }}</td>
          <td>{{ player.total_goals }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
/* eslint-disable */
import api from '../services/api';

export default {
  name: 'Statistics',
  data() {
    return {
      players: [],
      apiUrl: process.env.VUE_APP_API_URL
    };
  },
  async created() {
    try {
      const response = await api.get('/players/top-scorers'); // Asegúrate de que la ruta sea correcta en tu API
      this.players = response.data;
    } catch (error) {
      console.error("Error al cargar las estadísticas de goleadores:", error);
      alert("No se pudo cargar la tabla de goleadores.");
    }
  }
};
</script>

<style scoped>
.statistics-page {
  width: 90%;
  max-width: 800px;
  margin: auto;
  padding: 20px;
}

.top-scorers-table {
  width: 100%;
  border-collapse: collapse;
}

.top-scorers-table th, .top-scorers-table td {
  padding: 10px 5px;
  border-bottom: 1px solid #ccc;
  text-align: center;
}

.player-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
