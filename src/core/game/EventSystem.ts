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