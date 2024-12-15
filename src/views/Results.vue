<template>
  <div class="results-page">
    <div class="header">
      <h2 class="header-title">Resultados</h2>
      <div class="header-buttons">
        <button v-if="isAdmin" @click="createMatch" class="create-button">
          <span class="material-icons">add</span>
        </button>
      </div>
    </div>

    <div v-for="(group, index) in groupedMatches" :key="index" class="jornada-section">
      <h3>Jornada {{ index + 1 }}</h3>
      <div v-for="match in group" :key="match.match_id" class="match-row">
        <div class="match-info">
          <p class="match-date">{{ formatDateTime(match.date) }}</p>
          <div class="team-container">
            <div class="team">
              <img v-if="match.local_team.logo_path" :src="`${apiUrl}${match.local_team.logo_path}`" alt="Escudo Local" class="team-logo">
              <img v-else :src="`${apiUrl}/uploads/badges/default.png`" alt="Escudo Local" class="team-logo">
              <span class="team-name">{{ match.local_team.name }}</span>
            </div>
            <div class="result">
              {{ match.score_team_1 !== null && match.score_team_2 !== null ? `${match.score_team_1} - ${match.score_team_2}` : 'Por jugar' }}
            </div>
            <div class="team">
              <img v-if="match.visitor_team.logo_path" :src="`${apiUrl}${match.visitor_team.logo_path}`" alt="Escudo Visitante" class="team-logo">
              <img v-else :src="`${apiUrl}/uploads/badges/default.png`" alt="Escudo Visitante" class="team-logo">
              <span class="team-name">{{ match.visitor_team.name }}</span>
            </div>
          </div>
        </div>
        <div class="match-actions">
          <span v-if="match.score_team_1 !== null && match.score_team_2 !== null" @click="viewDetails(match.match_id)" class="icon-button">
            <span class="material-icons">visibility</span>
          </span>
          <span v-if="isAdmin" @click="editMatch(match.match_id)" class="icon-button">
            <span class="material-icons">edit</span>
          </span>
          <span v-if="isAdmin" @click="confirmDelete(match.match_id)" class="icon-button">
            <span class="material-icons">delete</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export default {
  name: 'ResultsPage',
  data() {
    return {
      matches: [],
      groupedMatches: [],
      isAdmin: false,
      apiUrl: process.env.VUE_APP_API_URL
    };
  },
  async created() {
    try {
      const response = await api.get('/matches');
      const teamsResponse = await api.get('/teams');
      const teams = teamsResponse.data;
      const token = localStorage.getItem('token');
      if (token) {
        const decodedToken = jwtDecode(token);
        this.isAdmin = decodedToken.role === 'admin';
      }

      this.matches = response.data.map(match => {
        match.local_team = teams.find(team => team.team_id === match.team_1_id);
        match.visitor_team = teams.find(team => team.team_id === match.team_2_id);
        return match;
      });
      this.groupMatchesByJornada();
    } catch (error) {
      console.error('Error al cargar los resultados:', error);
      alert('No se pudo cargar la lista de resultados.');
    }
  },
  methods: {
    createMatch() {
      this.$router.push('/matches/create');
    },
    groupMatchesByJornada() {
      const grouped = this.matches.reduce((acc, match) => {
        const jornada = match.round_number || 1;
        if (!acc[jornada - 1]) acc[jornada - 1] = [];
        acc[jornada - 1].push(match);
        return acc;
      }, []);
      this.groupedMatches = grouped;
    },
    formatDateTime(dateTime) {
      const date = new Date(dateTime);
      return date.toLocaleString([], {year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'}); // Puedes personalizar el formato si es necesario
    },
    viewDetails(matchId) {
      this.$router.push(`/matches/details/${matchId}`);
    },
    editMatch(matchId) {
      this.$router.push(`/matches/edit/${matchId}`);
    },
    confirmDelete(matchId) {
      if (confirm('¿Estás seguro de que deseas eliminar este partido? Esta acción no se puede deshacer.')) {
        this.deleteMatch(matchId);
      }
    },
    async deleteMatch(matchId) {
      try {
        await api.delete(`/matches/${matchId}`);
        alert('Partido eliminado con éxito');
        this.matches = this.matches.filter(match => match.match_id !== matchId); // Actualiza la lista en la vista
        this.groupMatchesByJornada();
      } catch (error) {
        console.error('Error al eliminar el partido:', error);
        alert('No se pudo eliminar el partido');
      }
    }
  }
};
</script>

<style scoped>
.results-page {
  width: 100%;
  max-width: 800px;
  margin: auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 20px 0px 0px;
}

.create-match-button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.create-match-button:hover {
  background-color: #45a049;
}

.jornada-section {
  padding: 15px;
}

.match-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fafafa;
  margin-bottom: 10px;
}

.match-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.match-date {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.team-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.team {
  display: flex;
  align-items: center;
  gap: 5px;
}

.team-logo {
  width: 30px;
  height: 30px;
  border-radius: 50%;
}

.team-name {
  font-weight: 500;
}

.result {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
  min-width: 50px;
  text-align: center;
}

.match-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.match-actions button {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.match-actions button:hover {
  color: #333;
}

.material-icons {
  font-size: 24px;
}

/* Estilos adicionales para móviles */
@media (max-width: 600px) {
  .results-page {
    padding: 10px;
  }

  .match-info {
    align-items: center;
    text-align: center;
  }

  .team-container {
    flex-direction: column;
    align-items: center;
  }

  .match-row {
    align-items: center;
    padding: 10px;
  }

  .match-actions {
    justify-content: center;
  }
}
</style>
