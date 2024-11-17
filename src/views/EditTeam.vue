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
    <div class="edit-team">
      <h2>Editar Equipo</h2>
      <form @submit.prevent="updateTeam">
        <div class="form-group">
          <label for="name">Nombre del Equipo</label>
          <input type="text" v-model="team.name" id="name" required />
        </div>
  
        <div class="form-group">
          <label for="logo">Logo del Equipo</label>
          <input type="file" @change="onFileChange" id="logo" />
          <div v-if="team.logo_path" class="current-logo">
            <p>Logo Actual:</p>
            <img :src="`${apiUrl}${team.logo_path}`" alt="Logo del equipo" />
          </div>
        </div>
  
        <div class="form-group">
          <label for="address">Dirección</label>
          <input type="text" v-model="team.address" id="address" />
        </div>
  
        <div class="form-group">
          <label for="phone">Teléfono</label>
          <input type="text" v-model="team.phone" id="phone" />
        </div>
  
        <button type="submit" class="submit-button">Actualizar Equipo</button>
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
          phone: '',
          logoPath: ''
        },
        logoFile: null,
        apiUrl: process.env.VUE_APP_API_URL
      };
    },
    async created() {
      const teamId = this.$route.params.team_id;
      try {
        const response = await api.get(`/teams/${teamId}`);
        this.team = response.data;
      } catch (error) {
        console.error("Error al cargar los datos del equipo:", error);
        alert("No se pudieron cargar los datos del equipo.");
      }
    },
    methods: {
      navigateTo(tab) {
        this.activeTab = tab;
        this.$router.push(`/dashboard/${tab}`);
      },
      onFileChange(event) {
        this.logoFile = event.target.files[0];
      },
      async updateTeam() {
        const formData = new FormData();
        formData.append('name', this.team.name);
        formData.append('address', this.team.address);
        formData.append('phone', this.team.phone);
        if (this.logoFile) {
          formData.append('logo', this.logoFile);
        }
  
        try {
          await api.put(`/teams/${this.team.team_id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          alert('Equipo actualizado exitosamente');
          this.$router.push('/dashboard/teams');
        } catch (error) {
          console.error('Error al actualizar el equipo:', error);
          alert('No se pudo actualizar el equipo');
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .edit-team {
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
  
  .current-logo {
    margin-top: 10px;
  }
  
  .current-logo img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 50%;
    margin-top: 5px;
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
  