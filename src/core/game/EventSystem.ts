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