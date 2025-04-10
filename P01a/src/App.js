import PokemonCard from "./PokemonCard.js";
import { PokemonTeamViewModel } from "../viewModel.js";

export const App = {
  components: {
    "pokemon-card": PokemonCard,
  },
  template: /*html*/ `
  <div>
    <section v-if="currentScreen === 'setup'" class="setup-container">
      <h2 class="setup-title">Configuració dels Jugadors</h2>
      <p class="setup-instruccions">
        Introdueix els noms dels jugadors per començar el joc.
      </p>
      <div class="toggle-container">
        <label for="two-players-toggle">Dos Jugadors:</label>
        <label class="switch">
          <input type="checkbox" v-model="isTwoPlayers" />
          <span class="slider round"></span>
        </label>
      </div>
      <div class="player-input-group">
        <label for="player1-name" class="player-label">Nom del Jugador 1:</label>
        <input type="text" v-model="player1Name" class="player-input" required />
      </div>
      <div class="player-input-group" v-if="isTwoPlayers">
        <label for="player2-name" class="player-label">Nom del Jugador 2:</label>
        <input type="text" v-model="player2Name" class="player-input" required />
      </div>
      <button @click="startGame" class="setup-button">Següent</button>
    </section>

    <section v-if="currentScreen === 'teamSelection'" id="team-selection-section">
      <h2>Selecciona el teu Equip</h2>
      <h2>{{ currentPlayerSelectionMessage }}</h2>
      <h2 id="credits-display">
        Crèdits restants: <span id="credits-value">{{ creditsDisplay }}</span>
      </h2>
      
      <!-- Métodos de ordenación -->
      <div id="sort-options-section">
        <h2>Opcions d'Ordenació</h2>
        <form id="sort-options-form">
          <fieldset>
            <legend>Ordena per:</legend>
            <label>
              <input type="radio" name="sort-criteria" value="name" v-model="sortCriteria" />
              Nom
            </label>
            <label>
              <input type="radio" name="sort-criteria" value="points" v-model="sortCriteria" />
              Punts
            </label>
            <label>
              <input type="radio" name="sort-criteria" value="type" v-model="sortCriteria" />
              Tipus
            </label>
          </fieldset>
          <fieldset>
            <legend>Mètode d'ordenació:</legend>
            <label>
              <input type="radio" name="sort-method" value="bubble" v-model="sortMethod" />
              Bombolla
            </label>
            <label>
              <input type="radio" name="sort-method" value="insertion" v-model="sortMethod" />
              Inserció
            </label>
            <label>
              <input type="radio" name="sort-method" value="selection" v-model="sortMethod" />
              Selecció
            </label>
          </fieldset>
          <button type="button" id="sort-team" @click="handleSortOptions">
            Ordenar
          </button>
        </form>
      </div>

      <!-- Equipo seleccionado -->
      <div id="selected-team-grid">
        <h3>El teu Equip Seleccionat</h3>
        <pokemon-card
          v-for="(poke, index) in currentPlayerTeam"
          :key="index"
          :pokemon="poke"
          :is-selected="true"
        />
      </div>

      <!-- Lista de Pokémon -->
      <div id="pokemon-grid">
        <pokemon-card
          v-for="(poke, index) in globalPokemonList"
          :key="index"
          :pokemon="poke"
          :is-selected="isPokemonInTeam(poke.name)"
          @toggle-selection="handleToggleSelection"
        />
      </div>

      <!-- Botón de siguiente jugador -->
      <button id="next-player-button" @click="handleNextPlayer">
        {{ buttonLabel }}
      </button>
    </section>

    <section v-if="currentScreen === 'battle'" id="battle-section">
      <h2>Moment de la Batalla!</h2>
      <p id="current-turn-display">És el torn del Jugador 1!</p>
      <button @click="performAttack">Atacar!</button>
      <div id="battle-log" class="battle-log-container">
        <p v-for="(log, index) in battleLog" :key="index">{{ log }}</p>
      </div>
    </section>
  </div>
  `,
  data() {
    return {
      currentScreen: "setup",
      isTwoPlayers: true,
      player1Name: "",
      player2Name: "",
      currentPlayerSelectionMessage: "Jugador 1, selecciona el teu equip Pokémon",
      sortCriteria: "",
      sortMethod: "",
      globalPokemonList: [],
      buttonLabel: "Següent Jugador",
      viewModel: new PokemonTeamViewModel(),
      battleLog: [],
    };
  },
  methods: {
    async fetchAndLoadPokemons() {
      try {
        const response = await fetch("./pokemon_data.json"); // Ruta al archivo JSON
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.viewModel.pokemonList.loadPokemons(data); // Carga los Pokémon en el ViewModel
        this.globalPokemonList = this.viewModel.getGlobalList(); // Actualiza la lista global
        console.log("Pokémon cargados correctamente:", this.globalPokemonList);
      } catch (error) {
        console.error("Error al cargar los Pokémon:", error);
      }
    },
    startGame() {
      if (!this.player1Name || (this.isTwoPlayers && !this.player2Name)) {
        alert("Si us plau, introdueix els noms de tots els jugadors.");
        return;
      }
      if (!this.isTwoPlayers) {
        this.player2Name = "CPU";
      }
      this.viewModel.initializeMatch(this.player1Name, this.player2Name);
      this.currentScreen = "teamSelection";
      this.renderGlobalList();
    },
    renderGlobalList() {
      this.globalPokemonList = this.viewModel.getGlobalList();
    },
    handleNextPlayer() {
      if (this.viewModel.currentPlayer === this.viewModel.player1) {
        this.viewModel.switchPlayer();
        if (this.isTwoPlayers) {
          this.currentPlayerSelectionMessage = `${this.player2Name}, selecciona el teu Pokémon`;
          this.buttonLabel = "Fi de la selecció d'equips";
        } else {
          this.viewModel.autoSelectCpuTeam();
          this.transitionToBattle();
        }
      } else {
        this.transitionToBattle();
      }
    },
    transitionToBattle() {
      this.currentScreen = "battle";
      this.battleLog.push("🔥 La batalla ha començat!");
    },
    performAttack() {
      this.viewModel.fightRound().then((log) => {
        this.battleLog.push(...log);
        if (this.viewModel.areTeamsComplete()) {
          this.battleLog.push("🏆 La batalla ha acabat!");
        }
      });
    },
    handleSortOptions() {
      this.viewModel.sortGlobalList(this.sortCriteria, this.sortMethod);
      this.renderGlobalList();
    },
    isPokemonInTeam(name) {
      const playerTeam =
        this.viewModel.currentPlayer === this.viewModel.player1
          ? this.viewModel.player1.team
          : this.viewModel.player2.team;
      return playerTeam.selectedTeam.some((p) => p.name === name);
    },
    handleToggleSelection(pokemon) {
      const isInTeam = this.isPokemonInTeam(pokemon.name);
      if (isInTeam) {
        this.viewModel.removePokemonFromTeam(pokemon.name);
      } else {
        const addResult = this.viewModel.addPokemonToCurrentPlayer(pokemon);
        if (!addResult) {
          alert("No es pot afegir el Pokémon.");
        }
      }
    },
  },
  mounted() {
    this.fetchAndLoadPokemons(); // Llama a la función al montar el componente
  },
  computed: {
    creditsDisplay() {
      return this.viewModel.currentPlayer.team.credits;
    },
    currentPlayerTeam() {
      return this.viewModel.getCurrentTeam();
    },
  },
};
