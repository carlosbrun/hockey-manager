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
    <div class="team-details">
      <div class="header">
        <h2>{{ team.name }}</h2>
        <button @click="editTeam" class="edit-team-button">
          <span class="material-icons">edit</span>
        </button>
      </div>
      <div class="box-data">
        <img v-if="team.logo_path" :src="`${apiUrl}${team.logo_path}`" alt="Escudo del equipo" class="team-logo-large" />
        <img v-else :src="`${apiUrl}/uploads/badges/default.png`" alt="Escudo del equipo" class="team-logo-large" />
        <p><strong>Dirección:</strong> {{ team.address }}</p>
        <p><strong>Teléfono:</strong> {{ team.phone }}</p>
        <!-- Enlace y miniatura de Google Maps -->
        <div v-if="finalAddress" class="map-link">
            <h3>Ubicación</h3>
            <MapComponent v-if="finalAddress" :address="finalAddress" />
            <a :href="getGoogleMapsLink(finalAddress)" target="_blank">Ver en Google Maps</a>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import api from '../services/api';
  import MapComponent from './MapComponent.vue';
  
  export default {
    components: { MapComponent },
    data() {
      return {
        team: {},
        apiUrl: process.env.VUE_APP_API_URL
      };
    },
    async created() {
      const teamId = this.$route.params.team_id;
      try {
        const response = await api.get(`/teams/${teamId}`);
        this.team = response.data;
      } catch (error) {
        console.error("Error al cargar los detalles del equipo:", error);
        alert("No se pudieron cargar los detalles del equipo.");
      }
    },
    computed: {
      finalAddress() {
        // Usa 'match.location' si está disponible; si no, usa 'localTeam.address'
        return this.team && this.team.address;
      }
    },
    methods: {
        editTeam() {
          this.$router.push(`/teams/edit/${this.team.team_id}`); // Redirige a la vista de edición del equipo
        },
        navigateTo(tab) {
            this.activeTab = tab;
            this.$router.push(`/dashboard/${tab}`);
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
  .team-details {
    max-width: 600px;
    margin: auto;
    padding: 20px;
    text-align: center;
  }
  
  .team-logo-large {
    width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 50%;
    margin: 20px 0;
  }
  </style>
  