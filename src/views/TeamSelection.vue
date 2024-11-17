<template>
  <div class="team-selection-container">
    <div class="team-selection-box">
      <!-- Imagen de Logo o Avatar -->
      <img :src="`${apiUrl}/uploads/login.png`" alt="" class="logo-image" />

      <!-- Título de la Página -->
      <div class="title-selection">
        <h2>Seleccionar Equipo</h2>
      </div>
      <div class="btn-creation">
        <button v-if="isAdmin" @click="toggleCreateTeamForm">Crear nuevo Equipo</button>
      </div>

      <!-- Formulario de creación de equipo con mensajes de error -->
      <div v-if="showCreateTeamForm" class="box-data">
        <h3>Crear un Nuevo Equipo</h3>
        <form @submit.prevent="createTeam">
          <input v-model="newTeam.name" type="text" placeholder="Nombre del Equipo" @input="validateName" required />
          <p v-if="errors.name">{{ errors.name }}</p>

          <input v-model="newTeam.db_name" type="text" placeholder="Nombre de la BD" @input="validateDbName" required />
          <p v-if="errors.db_name">{{ errors.db_name }}</p>

          <input v-model="newTeam.description" type="text" placeholder="Descripción" @input="validateDescription" required />
          <p v-if="errors.description">{{ errors.description }}</p>

          <button type="submit" :disabled="!isFormValid">Guardar</button>
        </form>
      </div>

      <!-- Formulario de Selección de Equipo -->
      <form @submit.prevent="handleTeamSelection">
        <div class="input-group">
          <select v-model="selectedTeam" id="team" required>
            <option disabled value="">Selecciona un equipo</option>
            <option v-for="team in teams" :key="team.myteam_id" :value="team.myteam_id">
              {{ team.name }}
            </option>
          </select>
        </div>

        <button type="submit" class="select-button">Acceder</button>
      </form>
    </div>
  </div>
</template>

<script>
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export default {
  data() {
    return {
      teams: [],
      isAdmin: false,
      showCreateTeamForm: false,
      newTeam: {
        name: '',
        db_name: '',
        description: ''
      },
      errors: {
        name: null,
        db_name: null,
        description: null
      },
      selectedTeam: '',
      apiUrl: process.env.VUE_APP_API_URL
    };
  },
  computed: {
    isFormValid() {
      return (
        !this.errors.name &&
        !this.errors.db_name &&
        !this.errors.description &&
        this.newTeam.name &&
        this.newTeam.db_name &&
        this.newTeam.description
      );
    }
  },
  async created() {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      this.isAdmin = decodedToken.role === 'admin';
    }
 
    try {
      const response = await api.get('/myteams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.teams = response.data;
    } catch (error) {
      console.error("Error al obtener los equipos:", error);
      this.$router.push('/');
    }
  },
  methods: {
    async handleTeamSelection() {
      if (this.selectedTeam) {
        try {
          const token = localStorage.getItem('token'); // Usa el token si tu app está autenticada
          await api.post('/myteams/select', { myteam_id: this.selectedTeam }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          // Navegar a la página del dashboard o clasificación después de seleccionar el equipo
          this.$router.push('/dashboard/standings');
        } catch (error) {
            console.error("Error al seleccionar el equipo:", error);
            alert("No se pudo seleccionar el equipo. Intenta de nuevo.");
        }
      }
    },
    toggleCreateTeamForm() {
        this.showCreateTeamForm = !this.showCreateTeamForm;
    },
    validateName() {
      if (this.newTeam.name.length < 3) {
        this.errors.name = "El nombre del equipo debe tener al menos 3 caracteres.";
      } else if (this.newTeam.name.length > 50) {
        this.errors.name = "El nombre del equipo no puede exceder los 50 caracteres.";
      } else {
        this.errors.name = null;
      }
    },
    validateDbName() {
      const dbNamePattern = /^[a-zA-Z0-9_]+$/;
      if (!this.newTeam.db_name) {
        this.errors.db_name = "El nombre de la base de datos es obligatorio.";
      } else if (!dbNamePattern.test(this.newTeam.db_name)) {
        this.errors.db_name = "El nombre de la base de datos solo puede contener letras, números y guiones bajos.";
      } else {
        this.errors.db_name = null;
      }
    },
    validateDescription() {
      if (this.newTeam.description.length > 200) {
        this.errors.description = "La descripción no puede exceder los 200 caracteres.";
      } else if (!this.newTeam.description) {
        this.errors.description = "La descripción es obligatoria.";
      } else {
        this.errors.description = null;
      }
    },
    async createTeam() {
      if (!this.isFormValid) return;
  
      try {
        const token = localStorage.getItem('token');
        const response = await api.post(
          '/myteams/create',
          this.newTeam,
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        this.teams.push(response.data);
        this.newTeam.name = '';
        this.newTeam.db_name = '';
        this.newTeam.description = '';
        this.errors = { name: null, db_name: null, description: null };
        this.showCreateTeamForm = false;
  
        alert("Equipo creado exitosamente.");
      } catch (error) {
        console.error("Error al crear el equipo:", error);
        alert("No se pudo crear el equipo. Intenta de nuevo.");
      }
    },
    async selectTeam(myteam_id) {
      try {
        const token = localStorage.getItem('token'); // Usa el token si tu app está autenticada
        await api.post('/myteams/select', { myteam_id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Navegar a la página del dashboard o clasificación después de seleccionar el equipo
        this.$router.push('/dashboard/standings');
      } catch (error) {
        console.error("Error al seleccionar el equipo:", error);
        alert("No se pudo seleccionar el equipo. Intenta de nuevo.");
      }
    }
  }
};
</script>

<style scoped>

.team-selection-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f2f2f2; /* Fondo gris claro */
}

.team-selection-box {
  width: 100%;
  max-width: 600px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background-color: white;
  text-align: center;
}

.logo-image {
  width: 150px;
  height: auto;
  margin-bottom: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 15px;
  width: 100%;
}

.input-group label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #555;
}

.input-group select {
  width: calc(100% - 20px); /* Deja espacio a los lados */
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  margin: 0 auto;
}

.select-button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: #4CAF50;
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}

.select-button:hover {
  background-color: #45a049;
}

input {
  margin-bottom: 10px;
}

.btn-creation {
  margin-bottom: 10px;
}

</style>
