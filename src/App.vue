<template>
  <div id="app">
    <router-view /> <!-- Aquí se mostrarán las vistas según la ruta -->
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      activeTab: 'standings' // pestaña activa por defecto
    };
  }
};
</script>

<style>
/* Opcional: agrega estilos globales aquí */
body {
  font-family: 'Roboto', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px; /* Opcional, para separación interna */
}

.header-title {
  margin: 0; /* Elimina márgenes predeterminados */
}

.header-buttons {
  display: flex;
  gap: 10px; /* Separación entre los botones */
}

.edit-button,
.create-button,
.delete-button {
  cursor: pointer;
}

.delete-button {
  background-color: red;
}

.box-data {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 10px;
}

.dashboard {
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #f2f2f2; /* Gris suave */
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: #757575; /* Tono de gris para el icono y el texto */
  text-decoration: none;
}

.nav-item .material-icons {
  font-size: 30px;
  margin-bottom: 5px;
}

.nav-item p {
  margin: 0;
  font-size: 12px;
}

.nav-item.active {
  color: #4CAF50; /* Color de contraste para la pestaña activa */
}

.nav-item:hover {
  color: #4CAF50; /* Mismo color para hover */
}

.content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
}

.icon-button {
  cursor: pointer;
  color: #555;
}

.icon-button .material-icons {
  font-size: 24px;
}

.icon-button:hover {
  color: #000;
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

.delete-button:hover {
  background-color: #b12e17;
}

label {
    display: block;
    margin-bottom: 5px;
}
input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
.instagram-preview {
  margin: 20px 0;
  text-align: center;
}
iframe {
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
