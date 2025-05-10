import { Game, Gold, Player, PlayerView, UnitInfo, UnitType } from "./Game";

/**
 * Nouvelles unités pour OpenFront
 */

// Extension des types d'unités existants
export enum ExtendedUnitType {
  // Unités terrestres
  Artillery = "Artillery",
  Tank = "Tank",
  AntiAircraft = "Anti-Aircraft",
  Barracks = "Barracks",
  Bunker = "Bunker",
  
  // Unités navales
  Submarine = "Submarine",
  AircraftCarrier = "Aircraft Carrier",
  NavalBase = "Naval Base",
  
  // Unités aériennes
  FighterJet = "Fighter Jet",
  BomberAircraft = "Bomber Aircraft",
  ReconDrone = "Recon Drone",
  AirBase = "Air Base",
  
  // Unités économiques
  Factory = "Factory",
  Mine = "Mine",
  Market = "Market",
  
  // Unités spéciales
  SpyAgency = "Spy Agency",
  EMP = "EMP",
  EnergyShield = "Energy Shield",
  ResearchCenter = "Research Center"
}

// Extension de la liste des types d'unités nucléaires
export const extendedNukeTypes = [
  UnitType.AtomBomb,
  UnitType.HydrogenBomb,
  UnitType.MIRVWarhead,
  UnitType.MIRV,
  ExtendedUnitType.EMP,
] as const;

export type ExtendedNukeType = (typeof extendedNukeTypes)[number];

// Informations sur les nouvelles unités
export const newUnitInfos: Record<ExtendedUnitType, UnitInfo> = {
  // Unités terrestres
  [ExtendedUnitType.Artillery]: {
    cost: (player: Player | PlayerView): Gold => 50 + player.tiles().size * 0.5,
    territoryBound: true,
    maxHealth: 150,
    damage: 40,
    constructionDuration: 2,
  },
  [ExtendedUnitType.Tank]: {
    cost: (player: Player | PlayerView): Gold => 80 + player.tiles().size * 0.7,
    territoryBound: false,
    maxHealth: 200,
    damage: 60,
    constructionDuration: 3,
  },
  [ExtendedUnitType.AntiAircraft]: {
    cost: (player: Player | PlayerView): Gold => 60 + player.tiles().size * 0.5,
    territoryBound: true,
    maxHealth: 120,
    damage: 80, // Dégâts élevés contre les unités aériennes
    constructionDuration: 2,
  },
  [ExtendedUnitType.Barracks]: {
    cost: (player: Player | PlayerView): Gold => 100 + player.tiles().size * 0.8,
    territoryBound: true,
    maxHealth: 300,
    constructionDuration: 4,
  },
  [ExtendedUnitType.Bunker]: {
    cost: (player: Player | PlayerView): Gold => 70 + player.tiles().size * 0.6,
    territoryBound: true,
    maxHealth: 400, // Haute résistance
    constructionDuration: 3,
  },
  
  // Unités navales
  [ExtendedUnitType.Submarine]: {
    cost: (player: Player | PlayerView): Gold => 120 + player.tiles().size * 1.0,
    territoryBound: false,
    maxHealth: 150,
    damage: 50,
    constructionDuration: 4,
  },
  [ExtendedUnitType.AircraftCarrier]: {
    cost: (player: Player | PlayerView): Gold => 200 + player.tiles().size * 1.5,
    territoryBound: false,
    maxHealth: 350,
    damage: 40,
    constructionDuration: 6,
  },
  [ExtendedUnitType.NavalBase]: {
    cost: (player: Player | PlayerView): Gold => 180 + player.tiles().size * 1.2,
    territoryBound: true,
    maxHealth: 500,
    constructionDuration: 5,
  },
  
  // Unités aériennes
  [ExtendedUnitType.FighterJet]: {
    cost: (player: Player | PlayerView): Gold => 100 + player.tiles().size * 0.8,
    territoryBound: false,
    maxHealth: 120,
    damage: 45,
    constructionDuration: 3,
  },
  [ExtendedUnitType.BomberAircraft]: {
    cost: (player: Player | PlayerView): Gold => 150 + player.tiles().size * 1.2,
    territoryBound: false,
    maxHealth: 180,
    damage: 70,
    constructionDuration: 4,
  },
  [ExtendedUnitType.ReconDrone]: {
    cost: (player: Player | PlayerView): Gold => 40 + player.tiles().size * 0.3,
    territoryBound: false,
    maxHealth: 50,
    constructionDuration: 1,
  },
  [ExtendedUnitType.AirBase]: {
    cost: (player: Player | PlayerView): Gold => 160 + player.tiles().size * 1.0,
    territoryBound: true,
    maxHealth: 400,
    constructionDuration: 5,
  },
  
  // Unités économiques
  [ExtendedUnitType.Factory]: {
    cost: (player: Player | PlayerView): Gold => 100 + player.tiles().size * 0.7,
    territoryBound: true,
    maxHealth: 250,
    constructionDuration: 4,
  },
  [ExtendedUnitType.Mine]: {
    cost: (player: Player | PlayerView): Gold => 80 + player.tiles().size * 0.5,
    territoryBound: true,
    maxHealth: 200,
    constructionDuration: 3,
  },
  [ExtendedUnitType.Market]: {
    cost: (player: Player | PlayerView): Gold => 120 + player.tiles().size * 0.8,
    territoryBound: true,
    maxHealth: 150,
    constructionDuration: 4,
  },
  
  // Unités spéciales
  [ExtendedUnitType.SpyAgency]: {
    cost: (player: Player | PlayerView): Gold => 140 + player.tiles().size * 1.0,
    territoryBound: true,
    maxHealth: 180,
    constructionDuration: 5,
  },
  [ExtendedUnitType.EMP]: {
    cost: (player: Player | PlayerView): Gold => 180 + player.tiles().size * 1.5,
    territoryBound: false,
    maxHealth: 100,
    damage: 0, // Pas de dégâts directs mais désactive les unités
    constructionDuration: 6,
  },
  [ExtendedUnitType.EnergyShield]: {
    cost: (player: Player | PlayerView): Gold => 160 + player.tiles().size * 1.2,
    territoryBound: true,
    maxHealth: 500,
    constructionDuration: 5,
  },
  [ExtendedUnitType.ResearchCenter]: {
    cost: (player: Player | PlayerView): Gold => 200 + player.tiles().size * 1.5,
    territoryBound: true,
    maxHealth: 300,
    constructionDuration: 6,
  },
};

// Fonctions d'effets spéciaux pour les unités
export class UnitEffects {
  // Augmente la production d'or pour chaque usine possédée
  static applyFactoryBonus(game: Game, player: Player): void {
    const factories = player.units(ExtendedUnitType.Factory);
    const bonus = factories.length * 5; // +5 d'or par usine
    player.addGold(bonus);
  }
  
  // Augmente la production de troupes des casernes
  static applyBarracksBonus(game: Game, player: Player): void {
    const barracks = player.units(ExtendedUnitType.Barracks);
    const bonus = barracks.length * 3; // +3 troupes par caserne
    player.addTroops(bonus);
  }
  
  // Le porte-avions peut lancer des avions de chasse
  static deployFighterFromCarrier(game: Game, player: Player, carrierId: number): boolean {
    const carriers = player.units(ExtendedUnitType.AircraftCarrier);
    const carrier = carriers.find(unit => unit.id() === carrierId);
    
    if (!carrier || carrier.isCooldown()) {
      return false;
    }
    
    const tile = carrier.tile();
    // Crée un avion de chasse à partir du porte-avions
    player.buildUnit(ExtendedUnitType.FighterJet, 0, tile);
    
    // Applique un temps de recharge
    carrier.setCooldown(true);
    
    return true;
  }
  
  // Le centre de recherche permet de débloquer des technologies avancées
  static researchTechnology(game: Game, player: Player, technologyId: string): boolean {
    const researchCenters = player.units(ExtendedUnitType.ResearchCenter);
    
    if (researchCenters.length === 0) {
      return false;
    }
    
    // Logique pour débloquer des technologies spécifiques
    // À implémenter dans le système de technologies
    
    return true;
  }
  
  // Effet de bouclier énergétique qui protège les unités environnantes
  static applyShieldProtection(game: Game, player: Player): void {
    const shields = player.units(ExtendedUnitType.EnergyShield);
    
    for (const shield of shields) {
      const tile = shield.tile();
      const nearbyUnits = game.nearbyUnits(tile, 3, [] as UnitType[]); // Protège les unités dans un rayon de 3
      
      // Augmente temporairement la santé des unités à proximité
      for (const { unit } of nearbyUnits) {
        if (unit.owner().id() === player.id() && unit.hasHealth()) {
          const currentHealth = unit.health();
          const healthBonus = Math.floor(currentHealth * 0.2); // +20% de santé
          unit.modifyHealth(healthBonus);
        }
      }
    }
  }
  
  // Les drones de reconnaissance révèlent les unités ennemies
  static applyReconEffect(game: Game, player: Player): void {
    const drones = player.units(ExtendedUnitType.ReconDrone);
    
    // Logique pour révéler les unités ennemies
    // Cette fonctionnalité nécessite une mise à jour du système de visibilité
  }
}

// Système d'amélioration des unités
export interface UnitUpgrade {
  name: string;
  description: string;
  cost: number;
  apply: (unit: any) => void; // 'any' utilisé ici car nous n'avons pas l'implémentation complète de l'interface Unit
}

// Liste des améliorations disponibles
export const unitUpgrades: Record<string, UnitUpgrade> = {
  "artillery-range": {
    name: "Portée d'artillerie améliorée",
    description: "Augmente la portée de tir de l'artillerie de 50%",
    cost: 150,
    apply: (unit: any) => {
      // Logique d'application de l'amélioration
    }
  },
  "tank-armor": {
    name: "Blindage renforcé",
    description: "Augmente la santé maximale des chars de 30%",
    cost: 200,
    apply: (unit: any) => {
      if (unit.type() === ExtendedUnitType.Tank && unit.hasHealth()) {
        const maxHealthIncrease = Math.floor(unit.health() * 0.3);
        unit.modifyHealth(maxHealthIncrease);
      }
    }
  },
  "submarine-stealth": {
    name: "Système furtif avancé",
    description: "Rend les sous-marins invisibles aux unités ennemies sauf à proximité immédiate",
    cost: 250,
    apply: (unit: any) => {
      // Logique d'application de l'amélioration
    }
  },
  "fighter-speed": {
    name: "Réacteurs améliorés",
    description: "Augmente la vitesse des avions de chasse de 40%",
    cost: 180,
    apply: (unit: any) => {
      // Logique d'application de l'amélioration
    }
  },
  "factory-production": {
    name: "Chaînes de production automatisées",
    description: "Augmente la production d'or des usines de 50%",
    cost: 300,
    apply: (unit: any) => {
      // Logique d'application de l'amélioration
    }
  }
};
