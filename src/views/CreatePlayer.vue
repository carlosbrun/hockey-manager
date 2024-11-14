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
    <div class="create-player">
      <h2>Crear Nuevo Jugador</h2>
      <form @submit.prevent="submitForm">
        <div>
          <label for="name">Nombre</label>
          <input type="text" id="name" v-model="player.name" required />
        </div>
        <div>
          <label for="number">Número</label>
          <input type="number" id="number" v-model="player.number" required min="1" />
        </div>
        <div>
          <label for="position">Posición</label>
          <input type="text" id="position" v-model="player.position" required />
        </div>
        <div>
          <label for="birthdate">Fecha de Nacimiento</label>
          <input type="date" id="birthdate" v-model="player.birthdate" required />
        </div>
        <div>
          <label for="photo">Foto</label>
          <input type="file" id="photo" @change="handleFileUpload" accept="image/*" />
        </div>
        <button type="submit">Guardar</button>
      </form>
    </div>
  </template>
  
  <script>
  /* eslint-disable */
  import api from '../services/api';
  
  export default {
    name: 'CreatePlayer',
    data() {
      return {
        player: {
          name: '',
          number: '',
          position: '',
          birthdate: ''
        },
        photoFile: null,
        myTeam_id: ''
      };
    },
    async created() {
        await this.fetchMyTeamId();
    },
    methods: {
      navigateTo(tab) {
        this.activeTab = tab;
        this.$router.push(`/dashboard/${tab}`);
      },
      async fetchMyTeamId() {
        try {
            const response = await api.get('/teams/favorite'); 
            this.myTeam_id = response.data.team_id;
        } catch (error) {
            console.error("Error al obtener los jugadores:", error);
        }
      },
      handleFileUpload(event) {
        this.photoFile = event.target.files[0];
      },
      async submitForm() {
        const formData = new FormData();
        formData.append('name', this.player.name);
        formData.append('number', this.player.number);
        formData.append('position', this.player.position);
        formData.append('birthdate', this.player.birthdate);
        formData.append('team_id', this.myTeam_id);
        if (this.photoFile) {
          formData.append('photo', this.photoFile);
        }
  
        try {
          const response = await api.post('/players', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          alert('Jugador creado con éxito');
          this.$router.push('/dashboard/roster');
        } catch (error) {
          console.error('Error al crear el jugador:', error);
          alert('Error al crear el jugador');
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .create-player {
    width: 100%;
    max-width: 600px;
    margin: auto;
  }
  form div {
    margin-bottom: 15px;
  }

  </style>
  