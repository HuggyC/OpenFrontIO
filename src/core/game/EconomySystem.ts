import { Cell, Game, Gold, Player, TileRef } from "./Game";
import { ExtendedUnitType } from "./NewUnits";

/**
 * Système économique avancé pour OpenFront
 * Ajoute des ressources supplémentaires et un système commercial élaboré
 */

// Types de ressources
export enum ResourceType {
  Gold = "Gold", // Ressource de base déjà existante
  Food = "Food", // Nourriture pour la population
  Materials = "Materials", // Matériaux pour la construction
  Energy = "Energy", // Énergie pour les technologies avancées
  Luxury = "Luxury" // Biens de luxe pour le bonheur et le commerce
}

// Interface pour les ressources
export interface ResourceInfo {
  type: ResourceType;
  name: string;
  description: string;
  baseValue: number; // Valeur de base pour le commerce
  icon?: string; // Icône pour l'interface utilisateur
}

// Informations sur les ressources
export const resourceInfos: Record<ResourceType, ResourceInfo> = {
  [ResourceType.Gold]: {
    type: ResourceType.Gold,
    name: "Or",
    description: "Monnaie d'échange universelle et ressource économique principale.",
    baseValue: 1.0
  },
  [ResourceType.Food]: {
    type: ResourceType.Food,
    name: "Nourriture",
    description: "Ressource essentielle pour la croissance de population et le maintien des troupes.",
    baseValue: 0.7
  },
  [ResourceType.Materials]: {
    type: ResourceType.Materials,
    name: "Matériaux",
    description: "Ressources nécessaires à la construction de bâtiments et d'unités.",
    baseValue: 0.8
  },
  [ResourceType.Energy]: {
    type: ResourceType.Energy,
    name: "Énergie",
    description: "Ressource avancée requise pour les technologies et unités de haut niveau.",
    baseValue: 1.2
  },
  [ResourceType.Luxury]: {
    type: ResourceType.Luxury,
    name: "Biens de luxe",
    description: "Ressources rares qui augmentent le bonheur et ont une grande valeur commerciale.",
    baseValue: 1.5
  }
};

// Types de terrains qui peuvent générer des ressources
export enum ResourceTerrain {
  Plains = "Plains", // Plaines - Nourriture
  Mountains = "Mountains", // Montagnes - Matériaux et or
  Forest = "Forest", // Forêt - Matériaux
  Desert = "Desert", // Désert - Énergie (solaire)
  Coast = "Coast", // Côte - Nourriture (poissons)
  Lake = "Lake", // Lac - Nourriture et biens de luxe
  Ocean = "Ocean" // Océan - Nourriture et transport
}

// Interface pour les emplacements de ressources
export interface ResourceLocation {
  tileRef: TileRef;
  resourceType: ResourceType;
  yield: number; // Quantité produite par tick
  isExploited: boolean; // Si la ressource est exploitée ou non
}

// Interface pour les multiplicateurs de production
export interface ProductionMultipliers {
  [ResourceType.Gold]: number;
  [ResourceType.Food]: number;
  [ResourceType.Materials]: number;
  [ResourceType.Energy]: number;
  [ResourceType.Luxury]: number;
}

// Définition des ressources par défaut du joueur
export const DEFAULT_RESOURCES = {
  [ResourceType.Gold]: 100,
  [ResourceType.Food]: 50,
  [ResourceType.Materials]: 30,
  [ResourceType.Energy]: 0,
  [ResourceType.Luxury]: 0
};

// Définition des multiplicateurs de base
export const BASE_MULTIPLIERS: ProductionMultipliers = {
  [ResourceType.Gold]: 1.0,
  [ResourceType.Food]: 1.0,
  [ResourceType.Materials]: 1.0,
  [ResourceType.Energy]: 1.0,
  [ResourceType.Luxury]: 1.0
};

// Interface pour la gestion des ressources du joueur
export interface PlayerResources {
  // Quantités de ressources actuelles
  getResource(type: ResourceType): number;
  setResource(type: ResourceType, amount: number): void;
  addResource(type: ResourceType, amount: number): void;
  removeResource(type: ResourceType, amount: number): boolean;
  // Informations sur la production
  getBaseProduction(type: ResourceType): number;
  getProductionMultiplier(type: ResourceType): number;
  setProductionMultiplier(type: ResourceType, multiplier: number): void;
  getTotalProduction(type: ResourceType): number;
  getResourceLocations(): ResourceLocation[];
  addResourceLocation(location: ResourceLocation): void;
  removeResourceLocation(tileRef: TileRef): void;
  // Consommation de ressources
  getFoodConsumption(): number;
  getMaterialsConsumption(): number;
  getEnergyConsumption(): number;
  // Mise à jour de production
  updateProduction(): void;
}

// Classe pour gérer les ressources d'un joueur
export class PlayerResourceManager implements PlayerResources {
  private resources: Record<ResourceType, number> = { ...DEFAULT_RESOURCES };
  private baseProduction: Record<ResourceType, number> = {
    [ResourceType.Gold]: 10, // Production de base d'or
    [ResourceType.Food]: 5, // Production de base de nourriture
    [ResourceType.Materials]: 3, // Production de base de matériaux
    [ResourceType.Energy]: 0, // Pas de production de base d'énergie
    [ResourceType.Luxury]: 0 // Pas de production de base de biens de luxe
  };
  private multipliers: ProductionMultipliers = { ...BASE_MULTIPLIERS };
  private resourceLocations: ResourceLocation[] = [];
  
  constructor(
    private player: Player,
    private game: Game
  ) {}
  
  // Méthodes de gestion des ressources
  public getResource(type: ResourceType): number {
    return this.resources[type];
  }
  
  public setResource(type: ResourceType, amount: number): void {
    this.resources[type] = Math.max(0, amount);
    
    // Pour l'or, on met à jour également le gold du joueur pour la compatibilité
    if (type === ResourceType.Gold) {
      this.player.removeGold(this.player.gold());
      this.player.addGold(amount);
    }
  }
  
  public addResource(type: ResourceType, amount: number): void {
    this.resources[type] += amount;
    
    // Pour l'or, on met à jour également le gold du joueur pour la compatibilité
    if (type === ResourceType.Gold) {
      this.player.addGold(amount);
    }
  }
  
  public removeResource(type: ResourceType, amount: number): boolean {
    if (this.resources[type] < amount) {
      return false;
    }
    
    this.resources[type] -= amount;
    
    // Pour l'or, on met à jour également le gold du joueur pour la compatibilité
    if (type === ResourceType.Gold) {
      this.player.removeGold(amount);
    }
    
    return true;
  }
  
  // Méthodes de gestion de la production
  public getBaseProduction(type: ResourceType): number {
    return this.baseProduction[type];
  }
  
  public getProductionMultiplier(type: ResourceType): number {
    return this.multipliers[type];
  }
  
  public setProductionMultiplier(type: ResourceType, multiplier: number): void {
    this.multipliers[type] = multiplier;
  }
  
  public getTotalProduction(type: ResourceType): number {
    let production = this.baseProduction[type] * this.multipliers[type];
    
    // Ajouter la production des emplacements de ressources
    for (const location of this.resourceLocations) {
      if (location.resourceType === type && location.isExploited) {
        production += location.yield;
      }
    }
    
    // Ajouter la production des bâtiments spécialisés
    if (type === ResourceType.Gold) {
      const markets = this.player.units(ExtendedUnitType.Market);
      production += markets.length * 5; // +5 d'or par marché
    } else if (type === ResourceType.Materials) {
      const mines = this.player.units(ExtendedUnitType.Mine);
      production += mines.length * 3; // +3 de matériaux par mine
    } else if (type === ResourceType.Food) {
      // Bonus de nourriture basé sur le nombre de tuiles possédées
      production += this.player.tiles().size * 0.1;
    } else if (type === ResourceType.Energy) {
      // Production d'énergie par les bâtiments spécialisés (à implémenter)
    }
    
    return production;
  }
  
  public getResourceLocations(): ResourceLocation[] {
    return [...this.resourceLocations];
  }
  
  public addResourceLocation(location: ResourceLocation): void {
    this.resourceLocations.push(location);
  }
  
  public removeResourceLocation(tileRef: TileRef): void {
    this.resourceLocations = this.resourceLocations.filter(
      loc => loc.tileRef !== tileRef
    );
  }
  
  // Méthodes de consommation
  public getFoodConsumption(): number {
    // La consommation de nourriture dépend de la population
    return this.player.population() * 0.1 + this.player.troops() * 0.05;
  }
  
  public getMaterialsConsumption(): number {
    // La consommation de matériaux dépend des bâtiments en construction
    const constructionUnits = this.player.units(UnitType.Construction);
    return constructionUnits.length * 2;
  }
  
  public getEnergyConsumption(): number {
    // La consommation d'énergie dépend des unités et bâtiments avancés
    let consumption = 0;
    
    // Unités consommant de l'énergie
    const energyConsumingUnits = [
      ...this.player.units(ExtendedUnitType.EnergyShield),
      ...this.player.units(ExtendedUnitType.FighterJet),
      ...this.player.units(ExtendedUnitType.BomberAircraft)
    ];
    
    consumption += energyConsumingUnits.length * 1;
    
    return consumption;
  }
  
  // Mise à jour de la production
  public updateProduction(): void {
    // Ajouter les ressources produites
    for (const type of Object.values(ResourceType)) {
      const production = this.getTotalProduction(type);
      
      // Soustraire la consommation pour certaines ressources
      let netProduction = production;
      
      if (type === ResourceType.Food) {
        netProduction -= this.getFoodConsumption();
      } else if (type === ResourceType.Materials) {
        netProduction -= this.getMaterialsConsumption();
      } else if (type === ResourceType.Energy) {
        netProduction -= this.getEnergyConsumption();
      }
      
      if (netProduction > 0) {
        this.addResource(type, netProduction);
      } else if (netProduction < 0) {
        // Pénalités pour manque de ressources
        this.handleResourceShortage(type, Math.abs(netProduction));
      }
    }
  }
  
  // Gestion des pénuries de ressources
  private handleResourceShortage(type: ResourceType, shortage: number): void {
    // Si le joueur manque de ressources, appliquer des pénalités
    switch (type) {
      case ResourceType.Food:
        // Pénalité sur la croissance de population et les troupes
        const foodPenalty = Math.min(1, shortage / this.getFoodConsumption());
        // Réduire la population ou les troupes (à implémenter)
        break;
      case ResourceType.Materials:
        // Ralentir les constructions (à implémenter)
        break;
      case ResourceType.Energy:
        // Désactiver certaines unités avancées (à implémenter)
        break;
      default:
        // Pas de pénalité pour les autres ressources
        break;
    }
  }
}

// Interface pour les transactions commerciales
export interface TradeOffer {
  offerId: string;
  offeringPlayer: Player;
  requestingPlayer: Player | null; // Null pour une offre publique
  offerResources: Record<ResourceType, number>;
  requestResources: Record<ResourceType, number>;
  expirationTick: number;
  isPublic: boolean;
}

// Gestionnaire du marché global pour le commerce entre joueurs
export class GlobalMarket {
  private tradeOffers: TradeOffer[] = [];
  
  constructor(private game: Game) {}
  
  // Ajouter une offre commerciale
  public addTradeOffer(offer: TradeOffer): void {
    this.tradeOffers.push(offer);
  }
  
  // Retirer une offre commerciale
  public removeTradeOffer(offerId: string): void {
    this.tradeOffers = this.tradeOffers.filter(offer => offer.offerId !== offerId);
  }
  
  // Obtenir toutes les offres commerciales
  public getAllTradeOffers(): TradeOffer[] {
    return [...this.tradeOffers];
  }
  
  // Obtenir les offres commerciales pour un joueur
  public getTradeOffersForPlayer(player: Player): TradeOffer[] {
    return this.tradeOffers.filter(
      offer => offer.requestingPlayer?.id() === player.id() || offer.isPublic
    );
  }
  
  // Accepter une offre commerciale
  public acceptTradeOffer(offerId: string, acceptingPlayer: Player): boolean {
    const offerIndex = this.tradeOffers.findIndex(offer => offer.offerId === offerId);
    if (offerIndex === -1) {
      return false;
    }
    
    const offer = this.tradeOffers[offerIndex];
    
    // Vérifier que le joueur peut accepter cette offre
    if (!offer.isPublic && offer.requestingPlayer?.id() !== acceptingPlayer.id()) {
      return false;
    }
    
    // Obtenir les gestionnaires de ressources
    const offeringPlayerResources = (offer.offeringPlayer as any).resources as PlayerResourceManager;
    const acceptingPlayerResources = (acceptingPlayer as any).resources as PlayerResourceManager;
    
    if (!offeringPlayerResources || !acceptingPlayerResources) {
      return false;
    }
    
    // Vérifier que les deux joueurs ont assez de ressources
    for (const [type, amount] of Object.entries(offer.offerResources)) {
      if (offeringPlayerResources.getResource(type as ResourceType) < amount) {
        return false;
      }
    }
    
    for (const [type, amount] of Object.entries(offer.requestResources)) {
      if (acceptingPlayerResources.getResource(type as ResourceType) < amount) {
        return false;
      }
    }
    
    // Effectuer l'échange
    for (const [type, amount] of Object.entries(offer.offerResources)) {
      offeringPlayerResources.removeResource(type as ResourceType, amount);
      acceptingPlayerResources.addResource(type as ResourceType, amount);
    }
    
    for (const [type, amount] of Object.entries(offer.requestResources)) {
      acceptingPlayerResources.removeResource(type as ResourceType, amount);
      offeringPlayerResources.addResource(type as ResourceType, amount);
    }
    
    // Supprimer l'offre
    this.tradeOffers.splice(offerIndex, 1);
    
    return true;
  }
  
  // Mettre à jour le marché (supprimer les offres expirées)
  public update(currentTick: number): void {
    this.tradeOffers = this.tradeOffers.filter(
      offer => offer.expirationTick > currentTick
    );
  }
  
  // Calculer la valeur équitable d'une ressource en or
  public calculateFairValue(type: ResourceType, amount: number): number {
    const baseValue = resourceInfos[type].baseValue;
    return amount * baseValue;
  }
  
  // Suggérer une offre équitable
  public suggestFairTrade(
    offering: Record<ResourceType, number>,
    requesting: Record<ResourceType, number>
  ): { offering: Record<ResourceType, number>; requesting: Record<ResourceType, number> } {
    // Calculer la valeur totale des ressources offertes
    let offeringValue = 0;
    for (const [type, amount] of Object.entries(offering)) {
      offeringValue += this.calculateFairValue(type as ResourceType, amount);
    }
    
    // Calculer la valeur totale des ressources demandées
    let requestingValue = 0;
    for (const [type, amount] of Object.entries(requesting)) {
      requestingValue += this.calculateFairValue(type as ResourceType, amount);
    }
    
    // Si les valeurs sont proches, l'offre est équitable
    const valueDifference = Math.abs(offeringValue - requestingValue);
    if (valueDifference / Math.max(offeringValue, requestingValue) < 0.1) {
      return { offering, requesting };
    }
    
    // Sinon, ajuster l'offre pour qu'elle soit équitable
    const result = { ...offering };
    if (offeringValue < requestingValue) {
      // Ajouter de l'or pour compenser
      const goldToAdd = (requestingValue - offeringValue) / resourceInfos[ResourceType.Gold].baseValue;
      result[ResourceType.Gold] = (result[ResourceType.Gold] || 0) + goldToAdd;
    }
    
    return { offering: result, requesting };
  }
}

// Interface pour les routes commerciales
export interface TradeRoute {
  id: string;
  sourcePlayer: Player;
  destinationPlayer: Player;
  sourcePort: TileRef;
  destinationPort: TileRef;
  resourceType: ResourceType;
  amount: number;
  profitMargin: number; // Pourcentage de profit pour le vendeur
  tradeShips: number[]; // IDs des bateaux de commerce sur cette route
  isActive: boolean;
}

// Gestionnaire des routes commerciales pour un joueur
export class TradeRouteManager {
  private tradeRoutes: TradeRoute[] = [];
  
  constructor(
    private player: Player,
    private resourceManager: PlayerResourceManager
  ) {}
  
  // Ajouter une route commerciale
  public addTradeRoute(route: TradeRoute): void {
    this.tradeRoutes.push(route);
  }
  
  // Supprimer une route commerciale
  public removeTradeRoute(routeId: string): void {
    this.tradeRoutes = this.tradeRoutes.filter(route => route.id !== routeId);
  }
  
  // Obtenir toutes les routes commerciales
  public getAllTradeRoutes(): TradeRoute[] {
    return [...this.tradeRoutes];
  }
  
  // Obtenir les routes commerciales actives
  public getActiveTradeRoutes(): TradeRoute[] {
    return this.tradeRoutes.filter(route => route.isActive);
  }
  
  // Activer une route commerciale
  public activateTradeRoute(routeId: string): boolean {
    const route = this.tradeRoutes.find(r => r.id === routeId);
    if (!route) {
      return false;
    }
    
    route.isActive = true;
    return true;
  }
  
  // Désactiver une route commerciale
  public deactivateTradeRoute(routeId: string): boolean {
    const route = this.tradeRoutes.find(r => r.id === routeId);
    if (!route) {
      return false;
    }
    
    route.isActive = false;
    return true;
  }
  
  // Mettre à jour les routes commerciales
  public updateTradeRoutes(): void {
    for (const route of this.getActiveTradeRoutes()) {
      // Vérifier si la route a des bateaux de commerce actifs
      if (route.tradeShips.length === 0) {
        continue;
      }
      
      // Obtenir le gestionnaire de ressources du joueur de destination
      const destinationResourceManager = (route.destinationPlayer as any).resources as PlayerResourceManager;
      if (!destinationResourceManager) {
        continue;
      }
      
      // Calculer le coût et le profit
      const cost = route.amount;
      const profit = Math.floor(cost * (1 + route.profitMargin));
      
      // Vérifier si le joueur source a assez de ressources
      if (this.resourceManager.getResource(route.resourceType) < cost) {
        continue;
      }
      
      // Vérifier si le joueur de destination a assez d'or
      if (destinationResourceManager.getResource(ResourceType.Gold) < profit) {
        continue;
      }
      
      // Effectuer l'échange
      this.resourceManager.removeResource(route.resourceType, cost);
      destinationResourceManager.removeResource(ResourceType.Gold, profit);
      
      destinationResourceManager.addResource(route.resourceType, cost);
      this.resourceManager.addResource(ResourceType.Gold, profit);
    }
  }
}

// Génération de ressources sur la carte
export class ResourceGenerator {
  private resourceLocations: Map<string, ResourceLocation> = new Map();
  
  constructor(private game: Game) {
    this.generateResourceLocations();
  }
  
  // Générer des emplacements de ressources sur la carte
  private generateResourceLocations(): void {
    // Parcourir toutes les tuiles de la carte
    this.game.forEachTile(tile => {
      // Déterminer le type de terrain (à adapter selon l'implémentation de la carte)
      const terrainType = this.getTileTerrainType(tile);
      
      // Chance de générer une ressource (ajuster selon la rareté souhaitée)
      const resourceChance = this.getResourceChanceForTerrain(terrainType);
      
      if (Math.random() < resourceChance) {
        // Déterminer le type de ressource selon le terrain
        const resourceType = this.getResourceTypeForTerrain(terrainType);
        
        // Déterminer le rendement de la ressource
        const yield = this.getResourceYield(resourceType);
        
        // Créer l'emplacement de ressource
        const location: ResourceLocation = {
          tileRef: tile,
          resourceType,
          yield,
          isExploited: false
        };
        
        // Ajouter l'emplacement à la carte
        const tileKey = `${tile.x},${tile.y}`;
        this.resourceLocations.set(tileKey, location);
      }
    });
  }
  
  // Obtenir le type de terrain d'une tuile (à adapter selon l'implémentation)
  private getTileTerrainType(tile: TileRef): ResourceTerrain {
    // Logique à adapter selon l'implémentation des terrains dans le jeu
    const tile = this.game.tileAt(tile);
    
    // Exemples de correspondance (à adapter)
    if (tile.type === TerrainType.Ocean) {
      return ResourceTerrain.Ocean;
    } else if (tile.type === TerrainType.Lake) {
      return ResourceTerrain.Lake;
    } else if (tile.type === TerrainType.Mountain) {
      return ResourceTerrain.Mountains;
    } else {
      return ResourceTerrain.Plains;
    }
  }
  
  // Obtenir la chance de générer une ressource selon le terrain
  private getResourceChanceForTerrain(terrain: ResourceTerrain): number {
    switch (terrain) {
      case ResourceTerrain.Mountains:
        return 0.3; // 30% de chance
      case ResourceTerrain.Forest:
        return 0.25;
      case ResourceTerrain.Plains:
        return 0.2;
      case ResourceTerrain.Desert:
        return 0.15;
      case ResourceTerrain.Coast:
        return 0.2;
      case ResourceTerrain.Lake:
        return 0.25;
      case ResourceTerrain.Ocean:
        return 0.1;
      default:
        return 0.1;
    }
  }
  
  // Obtenir le type de ressource selon le terrain
  private getResourceTypeForTerrain(terrain: ResourceTerrain): ResourceType {
    // Distribution des ressources selon le terrain
    const resourceDistribution: Record<ResourceTerrain, ResourceType[]> = {
      [ResourceTerrain.Mountains]: [
        ResourceType.Materials,
        ResourceType.Materials,
        ResourceType.Gold,
        ResourceType.Energy
      ],
      [ResourceTerrain.Forest]: [
        ResourceType.Materials,
        ResourceType.Materials,
        ResourceType.Food,
        ResourceType.Luxury
      ],
      [ResourceTerrain.Plains]: [
        ResourceType.Food,
        ResourceType.Food,
        ResourceType.Materials,
        ResourceType.Gold
      ],
      [ResourceTerrain.Desert]: [
        ResourceType.Energy,
        ResourceType.Energy,
        ResourceType.Gold,
        ResourceType.Luxury
      ],
      [ResourceTerrain.Coast]: [
        ResourceType.Food,
        ResourceType.Food,
        ResourceType.Luxury,
        ResourceType.Gold
      ],
      [ResourceTerrain.Lake]: [
        ResourceType.Food,
        ResourceType.Food,
        ResourceType.Luxury,
        ResourceType.Energy
      ],
      [ResourceTerrain.Ocean]: [
        ResourceType.Food,
        ResourceType.Gold,
        ResourceType.Luxury,
        ResourceType.Energy
      ]
    };
    
    // Choix aléatoire parmi les ressources possibles pour ce terrain
    const possibleResources = resourceDistribution[terrain];
    const randomIndex = Math.floor(Math.random() * possibleResources.length);
    return possibleResources[randomIndex];
  }
  
  // Obtenir le rendement d'une ressource
  private getResourceYield(resourceType: ResourceType): number {
    // Rendement de base selon le type de ressource
    const baseYield: Record<ResourceType, number> = {
      [ResourceType.Gold]: 3,
      [ResourceType.Food]: 5,
      [ResourceType.Materials]: 4,
      [ResourceType.Energy]: 2,
      [ResourceType.Luxury]: 1
    };
    
    // Variation aléatoire (±30%)
    const variation = 0.7 + Math.random() * 0.6; // Entre 0.7 et 1.3
    return Math.round(baseYield[resourceType] * variation);
  }
  
  // Obtenir l'emplacement de ressource à une tuile
  public getResourceLocationAtTile(tile: TileRef): ResourceLocation | null {
    const tileKey = `${tile.x},${tile.y}`;
    return this.resourceLocations.get(tileKey) || null;
  }
  
  // Obtenir tous les emplacements de ressources
  public getAllResourceLocations(): ResourceLocation[] {
    return Array.from(this.resourceLocations.values());
  }
  
  // Exploiter une ressource
  public exploitResource(tile: TileRef, player: Player): boolean {
    const location = this.getResourceLocationAtTile(tile);
    if (!location) {
      return false;
    }
    
    // Vérifier que la tuile appartient au joueur
    if (!player.tiles().has(tile)) {
      return false;
    }
    
    // Marquer la ressource comme exploitée
    location.isExploited = true;
    
    // Ajouter l'emplacement au gestionnaire de ressources du joueur
    const resourceManager = (player as any).resources as PlayerResourceManager;
    if (resourceManager) {
      resourceManager.addResourceLocation(location);
    }
    
    return true;
  }
  
  // Arrêter l'exploitation d'une ressource
  public stopExploitingResource(tile: TileRef, player: Player): boolean {
    const location = this.getResourceLocationAtTile(tile);
    if (!location || !location.isExploited) {
      return false;
    }
    
    // Vérifier que la tuile appartient au joueur
    if (!player.tiles().has(tile)) {
      return false;
    }
    
    // Marquer la ressource comme non exploitée
    location.isExploited = false;
    
    // Retirer l'emplacement du gestionnaire de ressources du joueur
    const resourceManager = (player as any).resources as PlayerResourceManager;
    if (resourceManager) {
      resourceManager.removeResourceLocation(tile);
    }
    
    return true;
  }
}
