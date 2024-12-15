<template>
    <div class="dashboard">
      <nav class="navbar">
      <span @click="navigateTo('standings')" class="nav-item">
        <span class="material-icons">leaderboard</span>
        <p>Clasificación</p>
      </span>
      <span @click="navigateTo('results')" class="nav-item">
        <span class="material-icons">event</span>
        <p>Resultados</p>
      </span>
      <span @click="navigateTo('roster')" class="active nav-item">
        <span class="material-icons">people</span>
        <p>Plantilla</p>
      </span>
      <span @click="navigateTo('teams')" class="nav-item">
        <span class="material-icons">sports</span>
        <p>Equipos</p>
      </span>
      <span @click="navigateTo('stats')" class="nav-item">
        <span class="material-icons">insights</span>
        <p>Estadísticas</p>
      </span>
      </nav>
    </div>
    <div class="player-details">
    <div class="header">
      <h2 class="header-title">Detalles del Jugador</h2>
      <div class="header-buttons">
        <button v-if="isAdmin" @click="editPlayer" class="edit-button">
          <span class="material-icons">edit</span>
        </button>
        <button v-if="isAdmin" @click="confirmDelete" class="delete-button">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>
    <div v-if="player" class="player-info box-data">
        <!-- Imagen del Jugador -->
        <img :src="getPlayerImage(player.photo_path)" alt="Foto del jugador" class="player-photo" />

        <!-- Datos del Jugador -->
        <div class="player-data">
          <p class="player-name">{{ player.name }}</p>
          <p><strong>Número:</strong> {{ player.number }}</p>
          <p><strong>Posición:</strong> {{ player.position }}</p>
          <p><strong>Fecha de Nacimiento:</strong> {{ player.birthdate }}</p>
        </div>
      </div>
      <!-- Lista de goles por partido -->
    <div v-if="goals.length" class="player-goals">
      <h3>Goles por Jornada</h3>
      <table class="goals-table">
        <thead>
          <tr>
            <th>Jornada</th>
            <th>Fecha</th>
            <th>Partido</th>
            <th>Resultado</th>
            <th>Goles</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in goals" :key="event.jornada">
            <td>{{ event.round_number }}</td>
            <td>{{ formatDateTime(event.date) }}</td>
            <td>{{ event.local_team }} vs {{ event.visitor_team }}</td>
            <td>{{ event.score_team_1 }} - {{ event.score_team_2 }}</td>
            <td>{{ event.goals }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="player-goals">
        <h3>No hay goles registrados</h3> 
    </div>
    </div>
  </template>
  
  <script>
  /* eslint-disable */
  import api from '../services/api';
  import { jwtDecode } from 'jwt-decode';
  
  export default {
    name: 'PlayerDetails',
    data() {
      return {
        player: null,
        isAdmin: false,
        apiUrl: process.env.VUE_APP_API_URL,
        goals: []
      };
    },
    async created() {
      const playerId = this.$route.params.player_id;
      const token = localStorage.getItem('token');
      if (token) {
        const decodedToken = jwtDecode(token);
        this.isAdmin = decodedToken.role === 'admin';
      }
      try {
        const response = await api.get(`/players/${playerId}`);
        this.player = response.data;

        // Cargar eventos de goles del jugador
        const goalsResponse = await api.get(`/players/${playerId}/goals`);
        this.goals = goalsResponse.data;
      } catch (error) {
        console.error('Error al cargar los datos del jugador:', error);
        alert('No se pudo cargar la información del jugador.');
      }
    },
    methods: {
      formatDateTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleString(); // Personaliza el formato si es necesario
      },
      navigateTo(tab) {
        this.activeTab = tab;
        this.$router.push(`/dashboard/${tab}`);
      },
      getPlayerImage(photoPath) {
        return photoPath ? process.env.VUE_APP_API_URL + `${photoPath}` : process.env.VUE_APP_API_URL + `/uploads/players/default.png`;
      },
      confirmDelete() {
        if (confirm('¿Estás seguro de que deseas eliminar este jugador? Esta acción no se puede deshacer.')) {
          this.deleteTeam();
        }
      },
      async deleteTeam() {
        try {
          await api.delete(`/players/${this.player.player_id}`);
          alert('Jugador eliminado con éxito');
          this.$router.push('/dashboard/roster');
        } catch (error) {
          console.error('Error al eliminar el jugador:', error);
          alert('No se pudo eliminar el jugador');
        }
      },
      editPlayer() {
        this.$router.push(`/players/edit/${this.player.player_id}`);
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

  .player-details {
    width: 100%;
    max-width: 800px;
    margin: auto;
  }

  .player-info {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 20px;
  }

  .player-photo {
    width: 150px;
    height: auto;
    border-radius: 5px;
    object-fit: cover;
  }

  .player-name {
    font-size: 1.5em;
    font-weight: bold;
  }

  .player-name {
    max-width: 600px;
    margin: auto;
  }

  .player-goals {
  margin-top: 30px;
}

.goals-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px; /* Espacio entre filas */
  margin-top: 10px;
  padding: 10px 0; /* Espacio extra para la tabla */
}

.goals-table th, .goals-table td {
  padding: 15px 10px; /* Aumenta el espacio en las celdas */
  border-bottom: 1px solid #ddd;
  text-align: center;
}

.goals-table th {
  background-color: #4CAF50;
  color: white;
  font-size: 16px;
  font-weight: lighter;
}

.goals-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.goals-table td {
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.goals-table tr {
  transition: all 0.3s ease;
}

.goals-table tr:hover {
  transform: scale(1.02); /* Agranda la fila al pasar el ratón */
}

  </style>
  