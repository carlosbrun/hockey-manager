<template>
    <div class="standings">
      <h2>Clasificación</h2>
      <table>
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Pts</th>
            <th>PJ</th>
            <th>PG</th>
            <th>PE</th>
            <th>PP</th>
            <th>GF</th>
            <th>GC</th>
            <th>Dif.Goles</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="team in standings" 
            :key="team.team_id" 
            :class="{ favorite: team.is_favorite }"
          >
            <td>{{ team.name }}</td>
            <td>{{ team.points }}</td>
            <td>{{ team.played }}</td>
            <td>{{ team.won }}</td>
            <td>{{ team.draw }}</td>
            <td>{{ team.lost }}</td>
            <td>{{ team.goals_for }}</td>
            <td>{{ team.goals_against }}</td>
            <td>{{ team.goals_for - team.goals_against }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  /* eslint-disable */
  import api from '../services/api';
  
  export default {
    name: 'Standings',
    data() {
      return {
        standings: []
      };
    },
    async created() {
      try {
        const response = await api.get('/matches/standings');
        this.standings = response.data;
      } catch (error) {
        console.error("Error al cargar la clasificación:", error);
      }
    }
  };
  </script>
  
  <style scoped>
  .standings {
    width: 100%;
    max-width: 800px;
    margin: auto;
  }

  .standings h2 {
    padding: 20px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 8px 2px;
    border: 1px solid #ddd;
    text-align: center;
  }
  th {
    background-color: #f2f2f2;
    color: #757575;
  }
  /* Estilo destacado para el equipo favorito */
  .favorite {
    background-color: #fff6b9; /* Un color dorado para destacar */
    font-weight: bold;
  }
  </style>
  
  