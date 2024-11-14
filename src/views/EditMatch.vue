<template>
    <div class="dashboard">
      <nav class="navbar">
      <span @click="navigateTo('standings')" class="nav-item">
        <span class="material-icons">leaderboard</span>
        <p>Clasificación</p>
      </span>
      <span @click="navigateTo('results')" class="active nav-item">
        <span class="material-icons">event</span>
        <p>Resultados</p>
      </span>
      <span @click="navigateTo('roster')" class="nav-item">
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
    <div class="edit-match">
      <h2>Editar Partido</h2>

      <!-- Contenedor de Pestañas -->
      <div class="tab-container">
        <div class="tab" :class="{ active: activeTab === 'datos' }" @click="activeTab = 'datos'">Datos</div>
        <div v-if="isFavoriteTeamPlaying" class="tab" :class="{ active: activeTab === 'goles' }" @click="activeTab = 'goles'">Goles</div>
        <div v-if="isFavoriteTeamPlaying" class="tab" :class="{ active: activeTab === 'convocatoria' }" @click="activeTab = 'convocatoria'">Convocatoria</div>
      </div>

      <form @submit.prevent="submitForm">
        
        <!-- Contenido de la Pestaña Datos -->
        <div v-if="activeTab === 'datos'" class="tab-content">

            <div class="errors">
                <span v-if="errors.date" class="error-message">{{ errors.date }}</span>
                <span v-if="errors.round_number" class="error-message">{{ errors.round_number }}</span>
                <span v-if="errors.team_1_id" class="error-message">{{ errors.team_1_id }}</span>
                <span v-if="errors.team_2_id" class="error-message">{{ errors.team_2_id }}</span>
                <span v-if="errors.same_team" class="error-message">{{ errors.same_team }}</span>
            </div>
            
            <div>
                <label for="date">Fecha y Hora</label>
                <input type="datetime-local" v-model="match.date" required />
            </div>

            <div>
                <label for="round_number">Jornada</label>
                <input type="number" v-model="match.round_number" min="1" required />
            </div>

            <div>
                <label for="location">Ubicación (Llenar solo si la dirección no es la habitual del equipo)</label>
                <input type="text" v-model="match.location" placeholder="Dirección del partido" />
            </div>

            <div>
                <label for="team_1_id">Equipo Local</label>
                <select v-model="match.team_1_id" required>
                <option disabled value="">Selecciona un equipo</option>
                <option v-for="team in teams" :key="team.team_id" :value="team.team_id">{{ team.name }}</option>
                </select>
            </div>

            <div>
                <label for="team_2_id">Equipo Visitante</label>
                <select v-model="match.team_2_id" required>
                <option disabled value="">Selecciona un equipo</option>
                <option v-for="team in teams" :key="team.team_id" :value="team.team_id">{{ team.name }}</option>
                </select>
            </div>

            <div>
                <label for="score_team_1">Goles Equipo Local</label>
                <input type="number" v-model="match.score_team_1" min="0" />
            </div>

            <div>
                <label for="score_team_2">Goles Equipo Visitante</label>
                <input type="number" v-model="match.score_team_2" min="0" />
            </div>

            <div>
                <label for="details">Detalles Adicionales</label>
                <textarea v-model="match.details" placeholder="Detalles del partido"></textarea>
            </div>
        </div>
         <!-- Contenido de la Pestaña Goles -->
        <div v-if="activeTab === 'goles'" class="tab-content goals-section">
          <h3>Registrar Goles</h3>
        
          <div>
            <label for="player">Jugador</label>
            <select v-model="selectedPlayerId">
              <option disabled value="">Selecciona un jugador</option>
              <option v-for="player in players" :key="player.player_id" :value="player.player_id">
                {{ player.name }}
              </option>
            </select>
          </div>

          <div>
            <label for="goals">Número de Goles</label>
            <input type="number" v-model="goalCount" min="1" placeholder="Cantidad de goles" />
          </div>

          <button @click.prevent="addGoal">Añadir Goles</button>

          <!-- Listado de Goles Registrados -->
          <table class="goal-table">
            <thead>
            <tr>
                <th>Jugador</th>
                <th>Goles</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="event in matchGoals" :key="event.event_id">
                <td>{{ event.player_name }}</td>
                <td>{{ event.event_number }}</td>
                <td>
                <span @click.prevent="deleteGoal(event.event_id)" class="icon-button">
                  <span class="material-icons">delete</span>
                </span>
                </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Contenido de la Pestaña Convocatoria -->
        <div v-if="activeTab === 'convocatoria'" class="tab-content">
            <h4>Mis jugadores</h4>
            <div class="players-list box-data">
                <div v-for="player in availablePlayers" :key="player.player_id" class="player-item">
                <span>{{ player.name }} (#{{ player.number }})</span>
                <button v-if="!isConvocado(player.player_id)" @click.prevent="addToConvocatoria(player)" class="icon-button add">
                    <span class="material-icons">add</span>
                </button>
                <button v-else @click.prevent="removeFromConvocatoria(player)" class="icon-button remove">
                    <span class="material-icons">remove</span>
                </button>
                </div>
            </div>

            <h4>Jugadores Convocados</h4>
            <div class="convocados-list box-data">
                <div v-for="player in convocados" :key="player.player_id" class="player-item">
                <span>{{ player.name }} (#{{ player.number }})</span>
                <button @click.prevent="removeFromConvocatoria(player)" class="icon-button remove">
                    <span class="material-icons">remove</span>
                </button>
                </div>
            </div>
        </div>

        <button type="submit">Guardar Cambios</button>
        </form>
    </div>
  </template>
  
  <script>
  /* eslint-disable */
  import api from '../services/api';
  
  export default {
    name: 'EditMatch',
    data() {
      return {
        match: {
        date: '',
        round_number: '',
        location: '',
        team_1_id: '',
        team_2_id: '',
        score_team_1: null,
        score_team_2: null,
        details: ''
      },
      teams: [],
      players: [],
      matchGoals: [],
      selectedPlayerId: '',
      goalCount: 1,
      isFavoriteTeamPlaying: false,
      favoriteTeam: '',
      activeTab: 'datos',
      convocados: [],
      errors: {}
      };
    },
    async created() {
      const matchId = this.$route.params.match_id;
      try {
        const response = await api.get(`/matches/${matchId}`);
        this.match = response.data;

        const favoriteTeamResponse = await api.get(`/teams/favorite`);
        this.favoriteTeam = favoriteTeamResponse.data;
        this.isFavoriteTeamPlaying = [this.match.team_1_id, this.match.team_2_id].includes(Number(this.favoriteTeam.team_id));
        
        // Cargar jugadores solo si está jugando el equipo favorito
        if (this.isFavoriteTeamPlaying) {
          const playersResponse = await api.get('/players');
          this.players = playersResponse.data;

          // Cargar goles del partido
          const goalsResponse = await api.get(`/matches/${matchId}/events/goals`);
          this.matchGoals = goalsResponse.data;
        }

        // Carga la lista de equipos para los selectores
        const teamsResponse = await api.get('/teams');
        this.teams = teamsResponse.data;

        // Cargar convocatoria del partido
        const convocatoriaResponse = await api.get(`/matches/${matchId}/convocatoria`);
        this.convocados = convocatoriaResponse.data;
      } catch (error) {
        console.error('Error al cargar los datos del partido:', error);
        alert('No se pudo cargar la información del partido.');
      }
    },
    computed: {
      // Filtrar los jugadores que aún no están convocados
      availablePlayers() {
        return this.players.filter(player => !this.isConvocado(player.player_id));
      }
    },
    methods: {
      navigateTo(tab) {
        this.activeTab = tab;
        this.$router.push(`/dashboard/${tab}`);
      },
      validateForm() {
	      this.errors = {};
	
	      // Validar equipos local y visitante
	      if (!this.match.team_1_id) {
	        this.errors.team_1_id = 'El equipo local es obligatorio.';
	      }
	      if (!this.match.team_2_id) {
	        this.errors.team_2_id = 'El equipo visitante es obligatorio.';
	      }
	      if (this.match.team_1_id && this.match.team_2_id && this.match.team_1_id === this.match.team_2_id) {
	        this.errors.same_team = 'El equipo local y el visitante no pueden ser el mismo.';
	      }
	
	      // Validar jornada
	      if (!this.match.round_number) {
	        this.errors.round_number = 'La jornada es obligatoria.';
	      }
	
	      // Validar fecha y hora
	      if (!this.match.date) {
	        this.errors.date = 'La fecha y hora son obligatorias.';
	      }
	
	      return Object.keys(this.errors).length === 0;
      },
      async addGoal() {
      if (!this.selectedPlayerId || !this.goalCount) {
        return alert("Selecciona un jugador e ingresa la cantidad de goles.");
      }

      const matchId = this.$route.params.match_id;
      try {
        const response = await api.post(`/matches/${matchId}/events/goal`, {
          player_id: this.selectedPlayerId,
          event_number: this.goalCount
        });

        // Actualizar lista de goles tras añadir un nuevo gol
        this.matchGoals.push({
          event_id: response.data.event_id,
          player_name: this.players.find(player => player.player_id === this.selectedPlayerId).name,
          event_number: this.goalCount
        });

        // Reiniciar los campos de entrada
        this.selectedPlayerId = '';
        this.goalCount = 1;

        //alert("Gol registrado con éxito.");
      } catch (error) {
        console.error("Error al registrar el gol:", error);
        alert("No se pudo registrar el gol.");
      }
    },
    async deleteGoal(eventId) {
      const matchId = this.$route.params.match_id;
      try {
        await api.delete(`/matches/${matchId}/events/goal/${eventId}`);
        // Filtrar la lista de goles para eliminar el gol borrado
        this.matchGoals = this.matchGoals.filter(event => event.event_id !== eventId);
        alert("Gol eliminado con éxito.");
      } catch (error) {
        console.error("Error al eliminar el gol:", error);
        alert("No se pudo eliminar el gol.");
      }
    },
    async addToConvocatoria(player) {
      const matchId = this.$route.params.match_id;
      try {
        await api.post(`/matches/${matchId}/convocatoria/${player.player_id}`);
        this.convocados.push(player);
      } catch (error) {
        console.error("Error al añadir a la convocatoria:", error);
      }
    },
    async removeFromConvocatoria(player) {
      const matchId = this.$route.params.match_id;
      try {
        await api.delete(`/matches/${matchId}/convocatoria/${player.player_id}`);
        this.convocados = this.convocados.filter(p => p.player_id !== player.player_id);
      } catch (error) {
        console.error("Error al eliminar de la convocatoria:", error);
      }
    },
    isConvocado(playerId) {
      return this.convocados.some(p => p.player_id === playerId);
    },
      async submitForm() {
        if (!this.validateForm()) {
          return;
        }
        try {
          await api.put(`/matches/update/${this.$route.params.match_id}`, this.match);
          alert('Partido actualizado con éxito');
          this.$router.push('/dashboard/results');
        } catch (error) {
          console.error('Error al actualizar el partido:', error);
          alert('No se pudo actualizar el partido');
        }
      }
    }
  };
  </script>
  
  <style scoped>
	.edit-match {
    width: 100%;
	  max-width: 600px;
	  margin: auto;
	}
    .tab-container {
      display: flex;
      border-bottom: 1px solid #ddd;
      margin-bottom: 20px;
    }
    .tab {
      padding: 10px 20px;
      cursor: pointer;
      border: 1px solid #ddd;
      border-bottom: none;
      background-color: #f9f9f9;
      border-radius: 5px 5px 0 0;
      margin-right: 5px;
    }
    .tab.active {
      background-color: #ffffff;
      font-weight: bold;
      border-bottom: 2px solid #4CAF50;
      color: #4CAF50;
    }
    .tab-content {
      border: 1px solid #ddd;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 0 5px 5px 5px;
    }
	form div {
	  margin-bottom: 15px;
	}
	label {
	  display: block;
	  margin-bottom: 5px;
	}
	input, select, textarea {
	  width: 100%;
	  padding: 8px;
	  box-sizing: border-box;
	}
	
	.error-message {
	  color: red;
	  font-size: 0.9em;
	}

    .goal-table {
        margin-top: 10px;
    }

    .goal-table tr td {
        padding: 5px;
    }

    .players-list, .convocados-list {
  margin-top: 20px;
}

.player-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  gap: 10px;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px; /* Tamaño cuadrado */
  height: 30px; /* Tamaño cuadrado */
  font-size: 18px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  color: white;
}

.icon-button.add {
  background-color: #4CAF50; /* Color verde para añadir */
}

.icon-button.remove {
  background-color: #e74c3c; /* Color rojo para eliminar */
}

.player-item span {
  flex-grow: 1;
}

.icon-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}
  </style>
  