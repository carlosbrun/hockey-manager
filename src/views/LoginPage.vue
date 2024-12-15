<template>
  <div class="login-container">
    <div class="login-box">
      <!-- Imagen de Logo o Avatar -->
      <img :src="`${apiUrl}/uploads/login.png`" alt="Logo" class="logo-image" />

      <!-- Título de la Página -->
      <h2>Iniciar Sesión</h2>

      <!-- Formulario de Login -->
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="username">Usuario</label>
          <input type="text" id="username" v-model="username" required />
        </div>

        <div class="input-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" v-model="password" required />
        </div>

        <button type="submit" class="login-button">Entrar</button>
      </form>
    </div>
  </div>
</template>

<script>
import api from '../services/api';

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      apiUrl: process.env.VUE_APP_API_URL
    };
  },
  methods: {
    async handleLogin() {
      try {
        const response = await api.post('/auth/login', {
          username: this.username,
          password: this.password
        });
        // Guarda el token en localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role); // Donde 'role' es 'admin' o 'user'
        // Redirige a la selección de equipo
        this.$router.push('/team-selection');
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
        this.errorMessage = "Credenciales incorrectas. Inténtalo de nuevo.";
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f2f2f2; /* Fondo gris claro */
}

.login-box {
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
  width: calc(100% - 20px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 15px;
}

.input-group label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #555;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.login-button {
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

.login-button:hover {
  background-color: #45a049;
}
</style>
