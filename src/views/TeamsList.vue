<template>
    <div class="teams-list">
      <div class="header">
        <h2 class="header-title">Equipos</h2>
        <div class="header-buttons">
          <button v-if="isAdmin" @click="createTeam" class="create-button">
            <span class="material-icons">add</span>
          </button>
        </div>
      </div>
      <div class="teams-container">
        <div v-for="team in teams" :key="team.team_id" class="team-card" @click="viewTeamDetails(team.team_id)">
          <img v-if="team.logo_path" :src="`${apiUrl}${team.logo_path}`" alt="Escudo del equipo" class="team-logo" />
          <img v-else :src="`${apiUrl}/uploads/badges/default.png`" alt="Escudo del equipo" class="team-logo" />
          <h3>{{ team.name }}</h3>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import api from '../services/api';
  import { jwtDecode } from 'jwt-decode';
  
  export default {
    data() {
      return {
        teams: [],
        isAdmin: false,
        apiUrl: process.env.VUE_APP_API_URL
      };
    },
    async created() {
      try {
        const response = await api.get('/teams');
        this.teams = response.data;
        const token = localStorage.getItem('token');
        if (token) {
          const decodedToken = jwtDecode(token);
          this.isAdmin = decodedToken.role === 'admin';
        }
      } catch (error) {
        console.error("Error al cargar la lista de equipos:", error);
        alert("No se pudo cargar la lista de equipos.");
      }
    },
    methods: {
      viewTeamDetails(teamId) {
        this.$router.push(`/teams/${teamId}`);
      },
      createTeam() {
        this.$router.push('/teams/create');
      }
    }
  };
  </script>
  
  <style scoped>
  .teams-list {
    max-width: 800px;
    margin: auto;
    padding: 20px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .create-team-button {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .create-team-button:hover {
    background-color: #45a049;
  }
  
  .teams-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .team-card {
    width: 120px;
    text-align: center;
    cursor: pointer;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }
  
  .team-card:hover {
    transform: scale(1.05);
  }
  
  .team-logo {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 50%;
    margin-bottom: 10px;
  }
  </style>
  