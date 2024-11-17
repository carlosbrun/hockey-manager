<template>
  <div class="roster">
    <div class="header">
      <h2>Plantilla</h2>
      <div v-if="isAdmin">
        <button @click="createPlayer">Crear Jugador</button>
      </div>
    </div>
    <div class="player-cards">
      <div 
        v-for="player in players" 
        :key="player.player_id" 
        class="player-card" 
        @click="viewPlayerDetails(player.player_id)"
      >
        <img :src="getPlayerImage(player.photo_path)" alt="Foto del jugador" />
        <h3 class="player-name">{{ player.name }}</h3>
        <p class="dorsal">#{{ player.number }}</p>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export default {
  name: 'Roster',
  data() {
    return {
      players: [],
      isAdmin: false // Determina si el usuario es admin; puedes obtenerlo del estado de la aplicación
    };
  },
  async created() {
    await this.fetchPlayers();
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      this.isAdmin = decodedToken.role === 'admin';
    }
  },
  methods: {
    async fetchPlayers() {
      try {
        const response = await api.get('/players'); // Asegúrate de que el endpoint esté configurado correctamente en el backend
        this.players = response.data;
      } catch (error) {
        console.error("Error al obtener los jugadores:", error);
      }
    },
    createPlayer() {
      this.$router.push('/players/create'); // Navega a la pantalla de creación de jugador
    },
    getPlayerImage(photoPath) {
      // Verifica que photoPath no esté vacío y prepende la URL base del servidor.
      return photoPath ? `${process.env.VUE_APP_API_URL}${photoPath}` : `${process.env.VUE_APP_API_URL}/uploads/players/default.png`;
    },
    viewPlayerDetails(player_id) {
      this.$router.push(`/players/${player_id}`); // Navega a la pantalla de detalles del jugador
    }
  }
};
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Alinea el título a la izquierda y el botón a la derecha */
  margin-bottom: 10px;
}
.roster {
  max-width: 800px;
  margin: auto;
  padding: 20px;
}
.player-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
}
.player-card {
  width: 150px;
  margin: 10px;
  cursor: pointer;
  text-align: center;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.player-card:hover {
    transform: scale(1.05);
  }

.player-card img {
  width: 100%;
  border-radius: 5px;
}

.dorsal {
  margin: 5px 0px;
  font-size: xx-large;
}

.player-name {
  margin: 5px 0px;
}
</style>

  