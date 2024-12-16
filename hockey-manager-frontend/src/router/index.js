import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import TeamSelection from '../views/TeamSelection.vue';
import Dashboard from '../views/Dashboard.vue';
import Standings from '../views/Standings.vue';       // Clasificación
import Results from '../views/Results.vue';           // Resultados
import Roster from '../views/Roster.vue';             // Plantilla
import Teams from '../views/TeamsList.vue';          // Equipos
import Statistics from '../views/Statistics.vue';     // Estadísticas

// Importa las vistas adicionales para crear y editar jugadores
import PlayerDetails from '../views/PlayerDetails.vue';
import CreatePlayer from '../views/CreatePlayer.vue';
import EditPlayer from '../views/EditPlayer.vue';
import MatchDetails from '../views/MatchDetails.vue';
import EditMatch from '../views/EditMatch.vue';
import CreateMatch from '../views/CreateMatch.vue';
import TeamDetails from '../views/TeamDetails.vue';
import CreateTeam from '../views/CreateTeam.vue';
import EditTeam from '../views/EditTeam.vue';


const routes = [
  { path: '/', name: 'Login', component: LoginPage },
  { path: '/team-selection', name: 'TeamSelection', component: TeamSelection, meta: { requiresAuth: true } },
  { path: '/players/create', name: 'CreatePlayer', component: CreatePlayer },
  { path: '/players/:player_id', name: 'PlayerDetails', component: PlayerDetails },
  { path: '/players/edit/:player_id', name: 'EditPlayer', component: EditPlayer } ,
  { path: '/matches/details/:match_id', name: 'MatchDetails', component: MatchDetails },
  { path: '/matches/edit/:match_id', name: 'EditMatch', component: EditMatch },
  { path: '/matches/create', name: 'CreateMatch', component: CreateMatch },
  { path: '/teams/:team_id', name: 'TeamDetails', component: TeamDetails },
  { path: '/teams/create', name: 'CreateTeam', component: CreateTeam },
  { path: '/teams/edit/:team_id', name: 'EditTeam', component: EditTeam },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true }, children: [
    { path: 'standings', name: 'Standings', component: Standings },
    { path: 'results', name: 'Results', component: Results },
    { path: 'roster', name: 'Roster', component: Roster },
    { path: 'teams', name: 'Teams', component: Teams },
    { path: 'stats', name: 'Statistics', component: Statistics }
  ]}
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// Guard de autenticación
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;
