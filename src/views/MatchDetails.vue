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
    <div class="match-details">
      <div class="header">
        <h2>Detalles del Partido</h2>
        <button v-if="false" @click="navigateTo('results')">Volver</button>
      </div>
      <!-- Contenedor de Pestañas -->
      <div class="tab-container">
        <div class="tab" :class="{ active: activeTab === 'datos' }" @click="activeTab = 'datos'">Datos</div>
        <div v-if="isFavoriteTeamPlaying" class="tab" :class="{ active: activeTab === 'goles' }" @click="activeTab = 'goles'">Goles</div>
        <div v-if="isFavoriteTeamPlaying" class="tab" :class="{ active: activeTab === 'convocatoria' }" @click="activeTab = 'convocatoria'">Convocatoria</div>
      </div>

      <div v-if="activeTab === 'datos'" class="tab-content">
        <div v-if="match && localTeam && visitorTeam">
          <div class="team-details box-data">
            <div class="team">
              <img v-if="localTeam.logo_path" :src="`${apiUrl}${localTeam.logo_path}`" alt="Escudo Local" class="team-logo">
              <img v-else :src="`${apiUrl}/uploads/badges/default.png`" alt="Escudo Local" class="team-logo">
              <span class="team-name">{{ localTeam.name }}</span>
            </div>
            <span class="result">{{ match.score_team_1 }} - {{ match.score_team_2 }}</span>
            <div class="team">
              <img v-if="visitorTeam.logo_path" :src="`${apiUrl}${visitorTeam.logo_path}`" alt="Escudo Visitante" class="team-logo">
              <img v-else :src="`${apiUrl}/uploads/badges/default.png`" alt="Escudo Visitante" class="team-logo">
              <span class="team-name">{{ visitorTeam.name }}</span>
            </div>
          </div>
        </div>

        <div class="match-data box-data">
            <p><strong>Fecha:</strong> {{ formatDateTime(match.date) }}</p>
            <p><strong>Resumen:</strong> {{ match.details || 'Sin información adicional' }}</p>
        </div>

        <!-- Enlace y miniatura de Google Maps -->
        <div v-if="finalAddress" class="map-link box-data">
          <h3>Ubicación</h3>
          <MapComponent v-if="finalAddress" :address="finalAddress" />
          <a :href="getGoogleMapsLink(finalAddress)" target="_blank">Ver en Google Maps</a>
        </div>
      </div>
      <!-- Tabla de Goles -->
      <div v-if="activeTab === 'goles'" class="tab-content goals-section">
        <div v-if="matchGoals.length" class="goals-section">
          <h3>Goles del Partido</h3>
          <table class="goal-table">
              <thead>
              <tr>
                  <th></th>
                  <th>Jugador</th>
                  <th>Goles</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="event in matchGoals" :key="event.event_id">
                <td>
                  <img v-if="event.player_photo" :src="`${apiUrl}${event.player_photo}`" alt="Foto del jugador" class="player-photo" />
                  <img v-else :src="`${apiUrl}/uploads/players/default.png`" alt="Foto del jugador" class="player-photo" />
                </td>
                <td>{{ event.player_name }}</td>
                <td>{{ event.event_number }}</td>
              </tr>
              </tbody>
          </table>
        </div>
      </div>

      <!-- Contenido de la Pestaña Convocatoria -->
      <div v-if="activeTab === 'convocatoria'" class="tab-content">
            <h4>Jugadores Convocados</h4>
            <div class="convocados-list box-data">
                <div v-for="player in convocados" :key="player.player_id" class="player-item">
                <span>{{ player.name }} (#{{ player.number }})</span>
                </div>
            </div>

            <h4>Jugadores no convocados</h4>
            <div class="players-list box-data">
                <div v-for="player in availablePlayers" :key="player.player_id" class="player-item">
                <span>{{ player.name }} (#{{ player.number }})</span>
                </div>
            </div>
        </div>
    </div>
  </template>
  
  <script>
  /* eslint-disable */
  import api from '../services/api';
  import MapComponent from './MapComponent.vue';
  
  export default {
    components: { MapComponent },
    name: 'MatchDetails',
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
      localTeam: '',
      visitorTeam: '',
      apiUrl: process.env.VUE_APP_API_URL,
      errors: {}
      };
    },
    computed: {
      // Filtrar los jugadores que aún no están convocados
      availablePlayers() {
        return this.players.filter(player => !this.isConvocado(player.player_id));
      },
      finalAddress() {
        // Usa 'match.location' si está disponible; si no, usa 'localTeam.address'
        return this.match.location || (this.localTeam && this.localTeam.address);
      }
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
  
        // Asigna los equipos local y visitante basándose en los IDs del partido
        this.localTeam = this.teams.find(team => team.team_id === this.match.team_1_id);
        this.visitorTeam = this.teams.find(team => team.team_id === this.match.team_2_id);

      } catch (error) {
        console.error('Error al cargar los detalles del partido:', error);
        alert('No se pudo cargar la información del partido.');
      }
    },
    methods: {
        navigateTo(tab) {
          this.activeTab = tab;
          this.$router.push(`/dashboard/${tab}`);
        },
        formatDateTime(dateTime) {
            const date = new Date(dateTime);
            return date.toLocaleString(); // Personaliza el formato si es necesario
        },
        isConvocado(playerId) {
          return this.convocados.some(p => p.player_id === playerId);
        },
        getGoogleMapsLink(address) {
            const encodedAddress = encodeURIComponent(address);
            return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        },
        getGoogleMapsThumbnail(address) {
            const encodedAddress = encodeURIComponent(address);
            const apiKey = 'AIzaSyD2-8A4YQjn3bJrv8dCetyeFQ0WQTLYbJQ'; // Asegúrate de reemplazar con tu API Key
            return `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=300x200&maptype=roadmap&markers=color:red%7C${encodedAddress}&key=${apiKey}`;
        }
    }
  };
  </script>
  
  <style scoped>
  .match-details {
    max-width: 600px;
    margin: auto;
  }
  .team-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 10px 0;
  }

  .team-logo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
  .team-name {
    font-size: 1.5em;
    font-weight: bold;
  }
  .result {
    font-size: 2em;
    font-weight: bold;
  }
  .goal-table {
    width: 100%;
    margin-top: 10px;
    border-collapse: collapse;
  }
  .goal-table th, .goal-table td {
    padding: 8px 10px;
    text-align: left;
  }
  .goal-table th {
    font-weight: bold;
    border-bottom: 1px solid #ddd;
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

  .player-photo {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  </style>
  