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
    <span @click="navigateTo('roster')" class="nav-item">
      <span class="material-icons">people</span>
      <p>Plantilla</p>
    </span>
    <span @click="navigateTo('teams')" class="active nav-item">
      <span class="material-icons">sports</span>
      <p>Equipos</p>
    </span>
    <span @click="navigateTo('stats')" class="nav-item">
      <span class="material-icons">insights</span>
      <p>Estadísticas</p>
    </span>
  </nav>
  </div>
    <div class="create-team">
      <h2>Crear Nuevo Equipo</h2>
      <form @submit.prevent="createTeam">
        <div class="form-group">
          <label for="name">Nombre del Equipo</label>
          <input type="text" v-model="team.name" id="name" required />
        </div>
  
        <div class="form-group">
          <label for="address">Dirección</label>
          <input type="text" v-model="team.address" id="address" />
        </div>
  
        <div class="form-group">
          <label for="phone">Teléfono</label>
          <input type="text" v-model="team.phone" id="phone" />
        </div>
  
        <button type="submit" class="submit-button">Crear Equipo</button>
      </form>
    </div>
  </template>
  
  <script>
  import api from '../services/api';
  
  export default {
    data() {
      return {
        team: {
          name: '',
          address: '',
          phone: ''
        },
        logoFile: null
      };
    },
    methods: {
      navigateTo(tab) {
        this.activeTab = tab;
        this.$router.push(`/dashboard/${tab}`);
      },
      async createTeam() {
        const formData = new FormData();
        formData.append('name', this.team.name);
        formData.append('address', this.team.address);
        formData.append('phone', this.team.phone);
  
        try {
            const response = await api.post('/teams', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          const createdTeamId = response.data.team_id;

          alert('Equipo creado exitosamente');
          this.$router.push('/teams/edit/'+ createdTeamId);
        } catch (error) {
          console.error('Error al crear el equipo:', error);
          alert('No se pudo crear el equipo');
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .create-team {
    width: 100%;
    max-width: 600px;
    margin: auto;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  input[type="text"], input[type="file"] {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .submit-button {
    padding: 10px 15px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .submit-button:hover {
    background-color: #45a049;
  }
  </style>
  