/**
 * EventSystem.ts - Système d'événements pour OpenFrontIO
 * 
 * Ce fichier fait partie de la logique partagée (core) d'OpenFrontIO
 * et est distribué sous licence MIT conformément à la double licence du projet.
 * 
 * MIT License
 * Copyright (c) 2025 OpenFront.io Team and contributors
 */

import { Cell, Game, MessageType, Player, PlayerID, TerrainType, Tick, TileRef, UnitType } from "./Game";
import { ExtendedUnitType } from "./NewUnits";
import { ResourceLocation, ResourceType } from "./EconomySystem";

/**
 * Système d'événements pour OpenFront
 * Génère des événements aléatoires qui ajoutent de la variété et de l'imprévisibilité au jeu
 */

// Types d'événements
export enum EventType {
  // Événements naturels
  NaturalDisaster = "NaturalDisaster",
  ResourceDiscovery = "ResourceDiscovery",
  ClimateChange = "ClimateChange",
  
  // Événements politiques
  Rebellion = "Rebellion",
  Coup = "Coup",
  CivilWar = "CivilWar",
  
  // Événements économiques
  EconomicBoom = "EconomicBoom",
  EconomicCrisis = "EconomicCrisis",
  TradeAgreement = "TradeAgreement",
  
  // Événements militaires
  MilitaryUprisal = "MilitaryUprisal",
  Defection = "Defection",
  ForeignMercenaries = "ForeignMercenaries",
  
  // Événements spéciaux
  ScientificBreakthrough = "ScientificBreakthrough",
  Pandemic = "Pandemic",
  AlienContact = "AlienContact", // Événement très rare et humoristique
}

// Catégories d'événements
export enum EventCategory {
  Natural = "Natural",
  Political = "Political",
  Economic = "Economic",
  Military = "Military",
  Special = "Special"
}

// Interface pour les effets des événements
export interface EventEffect {
  // L'effet retourne true si l'événement a été appliqué avec succès
  apply(game: Game, player: Player, params?: any): boolean;
}

// Interface pour les événements
export interface GameEvent {
  id: string;
  type: EventType;
  category: EventCategory;
  name: string;
  description: string;
  probability: number; // Probabilité de base (entre 0 et 1)
  minTicksInterval: number; // Intervalle minimum entre deux occurrences
  affectedPlayers: "single" | "multiple" | "all"; // Les joueurs affectés
  condition?: (game: Game, player: Player) => boolean; // Condition pour déclencher l'événement
  effect: EventEffect; // Effet de l'événement
  notificationMessage: string; // Message à afficher aux joueurs
  icon?: string; // Icône pour l'interface utilisateur
}

// Classe de base pour les effets d'événements
export abstract class BaseEventEffect implements EventEffect {
  constructor(protected params: any = {}) {}
  
  abstract apply(game: Game, player: Player, params?: any): boolean;
  
  // Méthode utilitaire pour choisir des tuiles aléatoires
  protected getRandomTiles(player: Player, count: number): TileRef[] {
    const tiles = Array.from(player.tiles());
    if (tiles.length === 0) {
      return [];
    }
    
    // Mélanger les tuiles
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    
    // Prendre le nombre demandé ou toutes si count > tiles.length
    return tiles.slice(0, Math.min(count, tiles.length));
  }
  
  // Méthode utilitaire pour choisir des unités aléatoires
  protected getRandomUnits(player: Player, count: number, types?: string[]): any[] {
    let units = [];
    
    if (types && types.length > 0) {
      units = types.flatMap(type => player.units(type));
    } else {
      // Obtenir toutes les unités
      units = player.units();
    }
    
    if (units.length === 0) {
      return [];
    }
    
    // Mélanger les unités
    for (let i = units.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [units[i], units[j]] = [units[j], units[i]];
    }
    
    // Prendre le nombre demandé ou toutes si count > units.length
    return units.slice(0, Math.min(count, units.length));
  }
}

// Implémentations d'effets d'événements
export class NaturalDisasterEffect extends BaseEventEffect {
  public apply(game: Game, player: Player, params?: any): boolean {
    const disasterType = params?.disasterType || this.params.disasterType || "earthquake";
    const affectedTilesCount = params?.affectedTilesCount || this.params.affectedTilesCount || 3;
    
    // Obtenir des tuiles aléatoires
    const affectedTiles = this.getRandomTiles(player, affectedTilesCount);
    if (affectedTiles.length === 0) {
      return false;
    }
    
    // Appliquer l'effet selon le type de catastrophe
    switch (disasterType) {
      case "earthquake":
        // Détruire les bâtiments sur les tuiles affectées
        for (const tile of affectedTiles) {
          const units = player.units().filter(unit => unit.tile() === tile);
          for (const unit of units) {
            // Détruire uniquement les bâtiments, pas les unités mobiles
            if (unit.info().territoryBound) {
              unit.delete();
            }
          }
        }
        break;
      case "flood":
        // Réduire la production des tuiles affectées
        // (à implémenter avec le système de ressources)
        break;
      case "drought":
        // Réduire la production de nourriture
        // (à implémenter avec le système de ressources)
        break;
      case "wildfire":
        // Détruire certaines unités et réduire la production
        for (const tile of affectedTiles) {
          const units = player.units().filter(unit => unit.tile() === tile);
          for (const unit of units) {
            if (Math.random() < 0.5) { // 50% de chance de destruction
              unit.delete();
            }
          }
        }
        break;
      default:
        // Type de catastrophe inconnu
        return false;
    }
    
    // Créer un message pour le joueur
    game.displayMessage(
      `Une catastrophe naturelle (${disasterType}) a frappé votre territoire!`,
      MessageType.WARN,
      player.id()
    );
    
    return true;
  }
}

export class ResourceDiscoveryEffect extends BaseEventEffect {
  public apply(game: Game, player: Player, params?: any): boolean {
    const resourceType = params?.resourceType || this.params.resourceType || ResourceType.Gold;
    const amount = params?.amount || this.params.amount || 100;
    
    // Obtenir le gestionnaire de ressources du joueur
    const resourceManager = (player as any).resources;
    if (!resourceManager) {
      return false;
    }
    
    // Ajouter les ressources découvertes
    resourceManager.addResource(resourceType, amount);
    
    // Créer un message pour le joueur
    game.displayMessage(
      `Vos explorateurs ont découvert un gisement de ${resourceType}!`,
      MessageType.SUCCESS,
      player.id()
    );
    
    return true;
  }
}

export class RebellionEffect extends BaseEventEffect {
  public apply(game: Game, player: Player, params?: any): boolean {
    const rebellionSize = params?.rebellionSize || this.params.rebellionSize || 0.2; // 20% du territoire
    const troopsLost = params?.troopsLost || this.params.troopsLost || 0.15; // 15% des troupes
    
    // Calculer le nombre de tuiles à perdre
    const tilesToLoseCount = Math.floor(player.tiles().size * rebellionSize);
    if (tilesToLoseCount <= 0) {
      return false;
    }
    
    // Obtenir des tuiles aléatoires
    const tilesToLose = this.getRandomTiles(player, tilesToLoseCount);
    
    // Faire perdre les tuiles au joueur
    for (const tile of tilesToLose) {
      player.relinquish(tile);
      // Les tuiles reviennent à terra nullius
      game.terraNullius().conquer(tile);
    }
    
    // Faire perdre des troupes
    const troopsToLose = Math.floor(player.troops() * troopsLost);
    if (troopsToLose > 0) {
      player.removeTroops(troopsToLose);
    }
    
    // Créer un message pour le joueur
    game.displayMessage(
      `Une rébellion a éclaté dans votre territoire! Vous avez perdu ${tilesToLoseCount} tuiles et ${troopsToLose} troupes.`,
      MessageType.WARN,
      player.id()
    );
    
    return true;
  }
}

export class EconomicBoomEffect extends BaseEventEffect {
  public apply(game: Game, player: Player, params?: any): boolean {
    const goldBoost = params?.goldBoost || this.params.goldBoost || 0.2; // 20% de bonus d'or
    const productionBoost = params?.productionBoost || this.params.productionBoost || 0.15; // 15% de boost de production
    
    // Obtenir le gestionnaire de ressources du joueur
    const resourceManager = (player as any).resources;
    if (!resourceManager) {
      return false;
    }
    
    // Augmenter l'or
    const goldToAdd = Math.floor(player.gold() * goldBoost);
    player.addGold(goldToAdd);
    
    // Augmenter les multiplicateurs de production de ressources
    for (const resourceType of Object.values(ResourceType)) {
      const currentMultiplier = resourceManager.getProductionMultiplier(resourceType);
      resourceManager.setProductionMultiplier(resourceType, currentMultiplier * (1 + productionBoost));
    }
    
    // Créer un message pour le joueur
    game.displayMessage(
      `Votre économie connaît un boom! Vous recevez ${goldToAdd} d'or et votre production de ressources augmente de ${productionBoost * 100}%.`,
      MessageType.SUCCESS,
      player.id()
    );
    
    return true;
  }
}

export class MilitaryUprisalEffect extends BaseEventEffect {
  public apply(game: Game, player: Player, params?: any): boolean {
    const troopBoost = params?.troopBoost || this.params.troopBoost || 0.25; // 25% de troupes en plus
    
    // Calculer le nombre de troupes à ajouter
    const troopsToAdd = Math.floor(player.troops() * troopBoost);
    if (troopsToAdd <= 0) {
      return false;
    }
    
    // Ajouter les troupes
    player.addTroops(troopsToAdd);
    
    // Créer un message pour le joueur
    game.displayMessage(
      `Vos forces militaires ont reçu un regain de popularité! ${troopsToAdd} nouvelles recrues ont rejoint votre armée.`,
      MessageType.SUCCESS,
      player.id()
    );
    
    return true;
  }
}

export class ScientificBreakthroughEffect extends BaseEventEffect {
  public apply(game: Game, player: Player, params?: any): boolean {
    // Si le système de technologies est implémenté, débloquer une technologie aléatoire
    const techManager = (player as any).technologies;
    if (techManager) {
      const availableTechs = techManager.getAllProgressions()
        .filter(prog => prog.status === "Available");
      
      if (availableTechs.length > 0) {
        // Choisir une technologie aléatoire
        const randomIndex = Math.floor(Math.random() * availableTechs.length);
        const techToComplete = availableTechs[randomIndex];
        
        // Compléter la recherche
        techManager.startResearch(techToComplete.technologyId, game.ticks());
        techManager.completeResearch(techToComplete.technologyId);
        
        // Créer un message pour le joueur
        game.displayMessage(
          `Une percée scientifique a permis à vos chercheurs de développer la technologie "${techToComplete.technologyId}" immédiatement!`,
          MessageType.SUCCESS,
          player.id()
        );
        
        return true;
      }
    }
    
    // Si pas de système de technologies ou pas de technologies disponibles, donner un bonus d'or
    const goldBonus = 200;
    player.addGold(goldBonus);
    
    // Créer un message pour le joueur
    game.displayMessage(
      `Une percée scientifique a permis à vos chercheurs de faire une découverte importante! Vous recevez ${goldBonus} d'or.`,
      MessageType.SUCCESS,
      player.id()
    );
    
    return true;
  }
}

export class PandemicEffect extends BaseEventEffect {
  public apply(game: Game, player: Player, params?: any): boolean {
    const populationLoss = params?.populationLoss || this.params.populationLoss || 0.15; // 15% de la population
    const productionReduction = params?.productionReduction || this.params.productionReduction || 0.2; // 20% de réduction de production
    
    // Réduire la population
    // À adapter selon l'implémentation du système de population
    
    // Obtenir le gestionnaire de ressources du joueur
    const resourceManager = (player as any).resources;
    if (resourceManager) {
      // Réduire les multiplicateurs de production de ressources
      for (const resourceType of Object.values(ResourceType)) {
        const currentMultiplier = resourceManager.getProductionMultiplier(resourceType);
        resourceManager.setProductionMultiplier(
          resourceType,
          currentMultiplier * (1 - productionReduction)
        );
      }
    }
    
    // Créer un message pour le joueur
    game.displayMessage(
      `Une pandémie frappe votre population! Votre production de ressources est réduite de ${productionReduction * 100}%.`,
      MessageType.WARN,
      player.id()
    );
    
    return true;
  }
}

export class AlienContactEffect extends BaseEventEffect {
  public apply(game: Game, player: Player, params?: any): boolean {
    // Cet événement humoristique et rare donne un bonus aléatoire important
    const effect = Math.floor(Math.random() * 4);
    
    switch (effect) {
      case 0:
        // Gros bonus d'or
        const goldBonus = 500;
        player.addGold(goldBonus);
        game.displayMessage(
          `Des visiteurs extraterrestres ont été impressionnés par votre civilisation et vous ont offert ${goldBonus} d'or!`,
          MessageType.SUCCESS,
          player.id()
        );
        break;
      case 1:
        // Beaucoup de troupes
        const troopsBonus = 200;
        player.addTroops(troopsBonus);
        game.displayMessage(
          `Des mercenaires extraterrestres ont décidé de rejoindre votre armée! Vous gagnez ${troopsBonus} troupes.`,
          MessageType.SUCCESS,
          player.id()
        );
        break;
      case 2:
        // Technologie avancée
        // À adapter selon l'implémentation du système de technologies
        game.displayMessage(
          `Des extraterrestres vous ont révélé des secrets technologiques avancés! Votre recherche progresse plus rapidement.`,
          MessageType.SUCCESS,
          player.id()
        );
        break;
      case 3:
        // Ressources rares
        const resourceManager = (player as any).resources;
        if (resourceManager) {
          resourceManager.addResource(ResourceType.Energy, 200);
          resourceManager.addResource(ResourceType.Luxury, 100);
          game.displayMessage(
            `Des extraterrestres ont effectué des échanges commerciaux avec vous! Vous recevez des ressources rares.`,
            MessageType.SUCCESS,
            player.id()
          );
        } else {
          // Fallback
          player.addGold(400);
          game.displayMessage(
            `Des extraterrestres ont effectué des échanges commerciaux avec vous! Vous recevez 400 d'or.`,
            MessageType.SUCCESS,
            player.id()
          );
        }
        break;
    }
    
    return true;
  }
}

// Définition des événements disponibles
export const availableEvents: GameEvent[] = [
  // Catastrophes naturelles
  {
    id: "earthquake",
    type: EventType.NaturalDisaster,
    category: EventCategory.Natural,
    name: "Tremblement de terre",
    description: "Un tremblement de terre frappe votre territoire, détruisant des bâtiments et infrastructures.",
    probability: 0.03, // 3% de chance par tick
    minTicksInterval: 50, // Au moins 50 ticks entre deux occurrences
    affectedPlayers: "single",
    effect: new NaturalDisasterEffect({ disasterType: "earthquake", affectedTilesCount: 3 }),
    notificationMessage: "Un tremblement de terre a frappé votre territoire!"
  },
  {
    id: "flood",
    type: EventType.NaturalDisaster,
    category: EventCategory.Natural,
    name: "Inondation",
    description: "Une inondation recouvre une partie de votre territoire, réduisant la production.",
    probability: 0.025,
    minTicksInterval: 60,
    affectedPlayers: "single",
    condition: (game, player) => {
      // Les inondations sont plus probables près des lacs et océans
      // À adapter selon l'implémentation des terrains
      return true;
    },
    effect: new NaturalDisasterEffect({ disasterType: "flood", affectedTilesCount: 5 }),
    notificationMessage: "Une inondation a submergé une partie de votre territoire!"
  },
  {
    id: "wildfire",
    type: EventType.NaturalDisaster,
    category: EventCategory.Natural,
    name: "Feu de forêt",
    description: "Un feu de forêt se propage dans votre territoire, détruisant des ressources et bâtiments.",
    probability: 0.02,
    minTicksInterval: 70,
    affectedPlayers: "single",
    effect: new NaturalDisasterEffect({ disasterType: "wildfire", affectedTilesCount: 4 }),
    notificationMessage: "Un feu de forêt ravage une partie de votre territoire!"
  },
  
  // Découvertes de ressources
  {
    id: "gold-discovery",
    type: EventType.ResourceDiscovery,
    category: EventCategory.Economic,
    name: "Découverte d'or",
    description: "Vos explorateurs ont découvert un gisement d'or dans votre territoire.",
    probability: 0.05,
    minTicksInterval: 40,
    affectedPlayers: "single",
    effect: new ResourceDiscoveryEffect({ resourceType: ResourceType.Gold, amount: 150 }),
    notificationMessage: "De l'or a été découvert dans votre territoire!"
  },
  {
    id: "luxury-discovery",
    type: EventType.ResourceDiscovery,
    category: EventCategory.Economic,
    name: "Découverte de ressources de luxe",
    description: "Une ressource de luxe rare a été découverte dans votre territoire.",
    probability: 0.03,
    minTicksInterval: 60,
    affectedPlayers: "single",
    effect: new ResourceDiscoveryEffect({ resourceType: ResourceType.Luxury, amount: 50 }),
    notificationMessage: "Une ressource de luxe a été découverte dans votre territoire!"
  },
  {
    id: "energy-discovery",
    type: EventType.ResourceDiscovery,
    category: EventCategory.Economic,
    name: "Découverte de sources d'énergie",
    description: "Vos scientifiques ont découvert une nouvelle source d'énergie exploitable.",
    probability: 0.025,
    minTicksInterval: 80,
    affectedPlayers: "single",
    effect: new ResourceDiscoveryEffect({ resourceType: ResourceType.Energy, amount: 100 }),
    notificationMessage: "Une nouvelle source d'énergie a été découverte!"
  },
  
  // Événements politiques
  {
    id: "rebellion",
    type: EventType.Rebellion,
    category: EventCategory.Political,
    name: "Rébellion",
    description: "Une partie de votre population se révolte contre votre autorité.",
    probability: 0.015,
    minTicksInterval: 100,
    affectedPlayers: "single",
    // Les rébellions sont plus probables dans les grands empires
    condition: (game, player) => player.tiles().size > 20,
    effect: new RebellionEffect({ rebellionSize: 0.15, troopsLost: 0.1 }),
    notificationMessage: "Une rébellion a éclaté dans votre territoire!"
  },
  {
    id: "major-rebellion",
    type: EventType.Rebellion,
    category: EventCategory.Political,
    name: "Rébellion majeure",
    description: "Une rébellion majeure éclate dans votre empire, menaçant votre autorité.",
    probability: 0.008,
    minTicksInterval: 150,
    affectedPlayers: "single",
    // Les grandes rébellions sont plus probables dans les très grands empires
    condition: (game, player) => player.tiles().size > 50,
    effect: new RebellionEffect({ rebellionSize: 0.25, troopsLost: 0.2 }),
    notificationMessage: "Une rébellion majeure menace votre empire!"
  },
  
  // Événements économiques
  {
    id: "economic-boom",
    type: EventType.EconomicBoom,
    category: EventCategory.Economic,
    name: "Boom économique",
    description: "Votre économie connaît une période de croissance exceptionnelle.",
    probability: 0.04,
    minTicksInterval: 60,
    affectedPlayers: "single",
    effect: new EconomicBoomEffect({ goldBoost: 0.2, productionBoost: 0.15 }),
    notificationMessage: "Votre économie connaît un boom!"
  },
  {
    id: "economic-crisis",
    type: EventType.EconomicCrisis,
    category: EventCategory.Economic,
    name: "Crise économique",
    description: "Une crise économique frappe votre territoire, réduisant votre revenu.",
    probability: 0.03,
    minTicksInterval: 80,
    affectedPlayers: "single",
    effect: new EconomicBoomEffect({ goldBoost: -0.15, productionBoost: -0.1 }), // Valeurs négatives pour simuler une crise
    notificationMessage: "Une crise économique frappe votre économie!"
  },
  
  // Événements militaires
  {
    id: "military-uprisal",
    type: EventType.MilitaryUprisal,
    category: EventCategory.Military,
    name: "Regain militaire",
    description: "Votre armée connaît un regain de popularité, attirant de nouvelles recrues.",
    probability: 0.035,
    minTicksInterval: 50,
    affectedPlayers: "single",
    effect: new MilitaryUprisalEffect({ troopBoost: 0.2 }),
    notificationMessage: "Un grand nombre de recrues rejoignent votre armée!"
  },
  
  // Événements spéciaux
  {
    id: "scientific-breakthrough",
    type: EventType.ScientificBreakthrough,
    category: EventCategory.Special,
    name: "Percée scientifique",
    description: "Vos scientifiques font une découverte majeure qui accélère votre développement technologique.",
    probability: 0.02,
    minTicksInterval: 100,
    affectedPlayers: "single",
    effect: new ScientificBreakthroughEffect(),
    notificationMessage: "Vos scientifiques ont fait une percée majeure!"
  },
  {
    id: "pandemic",
    type: EventType.Pandemic,
    category: EventCategory.Special,
    name: "Pandémie",
    description: "Une maladie contagieuse se propage dans votre population, réduisant la production.",
    probability: 0.01,
    minTicksInterval: 200,
    affectedPlayers: "multiple", // Peut affecter plusieurs joueurs
    effect: new PandemicEffect({ populationLoss: 0.1, productionReduction: 0.15 }),
    notificationMessage: "Une pandémie frappe votre population!"
  },
  {
    id: "alien-contact",
    type: EventType.AlienContact,
    category: EventCategory.Special,
    name: "Contact extraterrestre",
    description: "Des visiteurs d'une autre planète entrent en contact avec votre civilisation.",
    probability: 0.001, // Très rare (0.1%)
    minTicksInterval: 500, // Très long intervalle
    affectedPlayers: "single",
    effect: new AlienContactEffect(),
    notificationMessage: "Des visiteurs extraterrestres ont contacté votre civilisation!"
  }
];

// Gestionnaire d'événements pour le jeu
export class EventManager {
  private lastEventTicks: Map<string, Map<PlayerID, Tick>> = new Map();
  private originalProbabilities: Map<string, number> = new Map();
  
  constructor(private game: Game) {
    // Initialiser le suivi des événements
    for (const event of availableEvents) {
      this.lastEventTicks.set(event.id, new Map());
      this.originalProbabilities.set(event.id, event.probability);
    }
  }
  
  // Mettre à jour et déclencher des événements
  public update(currentTick: Tick): void {
    const players = this.game.players();
    
    // Pour chaque événement
    for (const event of availableEvents) {
      // Déterminer quels joueurs peuvent être affectés
      let eligiblePlayers: Player[] = [];
      
      switch (event.affectedPlayers) {
        case "single":
          // Choisir un joueur aléatoire qui répond aux conditions
          eligiblePlayers = players
            .filter(player => this.isPlayerEligibleForEvent(player, event, currentTick))
            .sort(() => Math.random() - 0.5)
            .slice(0, 1);
          break;
        case "multiple":
          // Choisir plusieurs joueurs qui répondent aux conditions (jusqu'à la moitié)
          const maxAffected = Math.max(1, Math.floor(players.length / 2));
          eligiblePlayers = players
            .filter(player => this.isPlayerEligibleForEvent(player, event, currentTick))
            .sort(() => Math.random() - 0.5)
            .slice(0, maxAffected);
          break;
        case "all":
          // Tous les joueurs qui répondent aux conditions
          eligiblePlayers = players
            .filter(player => this.isPlayerEligibleForEvent(player, event, currentTick));
          break;
      }
      
      // Pour chaque joueur éligible
      for (const player of eligiblePlayers) {
        // Vérifier la probabilité de l'événement
        if (Math.random() < event.probability) {
          // Déclencher l'événement
          const success = event.effect.apply(this.game, player);
          
          if (success) {
            // Enregistrer le tick de l'événement
            const playerEvents = this.lastEventTicks.get(event.id);
            if (playerEvents) {
              playerEvents.set(player.id(), currentTick);
            }
            
            // Notifier le joueur
            this.game.displayMessage(
              event.notificationMessage,
              MessageType.INFO,
              player.id()
            );
          }
        }
      }
    }
  }
  
  // Vérifier si un joueur est éligible pour un événement
  private isPlayerEligibleForEvent(player: Player, event: GameEvent, currentTick: Tick): boolean {
    // Vérifier si le joueur est en vie
    if (!player.isAlive()) {
      return false;
    }