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
    <div class="create-match">
      <div class="header">
        <h2>Crear Partido</h2>
        <button v-if="false" @click="navigateTo('results')">Volver</button>
      </div>
      <form @submit.prevent="submitForm">
        
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
          <label for="details">Detalles Adicionales</label>
          <textarea v-model="match.details" placeholder="Detalles del partido"></textarea>
        </div>
  
        <button type="submit">Crear Partido</button>
      </form>
    </div>
  </template>
  
  <script>
  import api from '../services/api';
  
  export default {
    name: 'CreateMatch',
    data() {
      return {
        match: {
          date: '',
          round_number: '',
          location: '',
          team_1_id: '',
          team_2_id: '',
          details: ''
        },
        teams: [],
        errors: {}
      };
    },
    async created() {
      try {
        const teamsResponse = await api.get('/teams');
        this.teams = teamsResponse.data;
      } catch (error) {
        console.error('Error al cargar los equipos:', error);
        alert('No se pudo cargar la lista de equipos.');
      }
    },
    methods: {
      navigateTo(tab) {
        this.activeTab = tab;
        this.$router.push(`/dashboard/${tab}`);
      },
      validateForm() {
        this.errors = {};
  
        if (!this.match.team_1_id) {
          this.errors.team_1_id = 'El equipo local es obligatorio.';
        }
        if (!this.match.team_2_id) {
          this.errors.team_2_id = 'El equipo visitante es obligatorio.';
        }
        if (this.match.team_1_id === this.match.team_2_id) {
          this.errors.same_team = 'El equipo local y el visitante no pueden ser el mismo.';
        }
        if (!this.match.round_number) {
          this.errors.round_number = 'La jornada es obligatoria.';
        }
        if (!this.match.date) {
          this.errors.date = 'La fecha y hora son obligatorias.';
        }
  
        return Object.keys(this.errors).length === 0;
      },
      async submitForm() {
        if (!this.validateForm()) {
          return;
        }
        try {
          const response = await api.post('/matches/create', this.match);
          const createdMatchId = response.data.match_id;
          alert('Partido creado con éxito');
          this.$router.push('/matches/edit/' + createdMatchId);
        } catch (error) {
          console.error('Error al crear el partido:', error);
          alert('No se pudo crear el partido');
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .create-match {
    width: 100%;
    max-width: 600px;
    margin: auto;
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
  button {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }
  button:hover {
    background-color: #45a049;
  }
  .error-message {
    color: red;
    font-size: 0.9em;
  }
  </style>
  