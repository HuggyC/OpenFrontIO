import { Gold, Player, PlayerView } from "./Game";
import { ExtendedUnitType } from "./NewUnits";

/**
 * Système de recherche technologique pour OpenFront
 * Permet aux joueurs de débloquer de nouvelles capacités et améliorations
 */

// Catégories technologiques
export enum TechnologyCategory {
  Military = "Military",
  Economy = "Economy",
  Infrastructure = "Infrastructure",
  Naval = "Naval",
  Aviation = "Aviation",
  Special = "Special"
}

// Interface pour les technologies
export interface Technology {
  id: string;
  name: string;
  description: string;
  category: TechnologyCategory;
  cost: (player: Player | PlayerView) => Gold;
  // Temps de recherche en ticks
  researchTime: number;
  // Pré-requis technologiques (IDs des technologies nécessaires)
  prerequisites: string[];
  // Effet appliqué lorsque la technologie est recherchée
  effect: (player: Player) => void;
  // Icône pour l'interface utilisateur
  icon?: string;
}

// Statut de recherche
export enum ResearchStatus {
  Locked = "Locked", // Technologie non disponible (prérequis non remplis)
  Available = "Available", // Technologie disponible pour la recherche
  InProgress = "InProgress", // Technologie en cours de recherche
  Completed = "Completed" // Technologie complètement recherchée
}

// Interface pour la progression de recherche
export interface ResearchProgress {
  technologyId: string;
  status: ResearchStatus;
  // Progression actuelle (0-100%)
  progress: number;
  // Tick auquel la recherche a commencé
  startTick?: number;
}

// Gestionnaire de technologies pour un joueur
export class PlayerTechnologies {
  private researchProgresses: Map<string, ResearchProgress> = new Map();
  private activeResearch: string | null = null;
  
  constructor(
    private player: Player,
    private availableTechs: Technology[]
  ) {
    // Initialise toutes les technologies comme verrouillées
    this.initializeTechnologies();
  }
  
  private initializeTechnologies(): void {
    for (const tech of this.availableTechs) {
      // Vérifie si la technologie n'a pas de prérequis (technologie de base)
      const initialStatus = tech.prerequisites.length === 0 
        ? ResearchStatus.Available 
        : ResearchStatus.Locked;
      
      this.researchProgresses.set(tech.id, {
        technologyId: tech.id,
        status: initialStatus,
        progress: 0
      });
    }
  }
  
  // Commence la recherche d'une technologie
  public startResearch(technologyId: string, currentTick: number): boolean {
    // Vérifie si une recherche est déjà en cours
    if (this.activeResearch !== null) {
      return false;
    }
    
    const progress = this.researchProgresses.get(technologyId);
    if (!progress || progress.status !== ResearchStatus.Available) {
      return false;
    }
    
    // Trouve la technologie
    const technology = this.availableTechs.find(tech => tech.id === technologyId);
    if (!technology) {
      return false;
    }
    
    // Vérifie si le joueur a assez d'or
    const cost = technology.cost(this.player);
    if (this.player.gold() < cost) {
      return false;
    }
    
    // Déduit le coût
    this.player.removeGold(cost);
    
    // Met à jour le statut
    progress.status = ResearchStatus.InProgress;
    progress.startTick = currentTick;
    this.activeResearch = technologyId;
    
    return true;
  }
  
  // Met à jour la progression de la recherche
  public updateResearch(currentTick: number): void {
    if (this.activeResearch === null) {
      return;
    }
    
    const progress = this.researchProgresses.get(this.activeResearch);
    if (!progress || progress.status !== ResearchStatus.InProgress || !progress.startTick) {
      return;
    }
    
    const technology = this.availableTechs.find(tech => tech.id === this.activeResearch);
    if (!technology) {
      return;
    }
    
    // Calcule la progression
    const elapsedTicks = currentTick - progress.startTick;
    const percentComplete = Math.min(100, (elapsedTicks / technology.researchTime) * 100);
    progress.progress = percentComplete;
    
    // Vérifie si la recherche est terminée
    if (percentComplete >= 100) {
      this.completeResearch(technology);
    }
  }
  
  // Termine la recherche d'une technologie
  private completeResearch(technology: Technology): void {
    const progress = this.researchProgresses.get(technology.id);
    if (!progress) {
      return;
    }
    
    // Met à jour le statut
    progress.status = ResearchStatus.Completed;
    progress.progress = 100;
    this.activeResearch = null;
    
    // Applique l'effet de la technologie
    technology.effect(this.player);
    
    // Déverrouille les technologies suivantes
    this.unlockDependentTechnologies(technology.id);
  }
  
  // Déverrouille les technologies qui dépendent de la technologie complétée
  private unlockDependentTechnologies(completedTechId: string): void {
    for (const tech of this.availableTechs) {
      // Vérifie si cette technologie dépend de celle qui vient d'être complétée
      if (tech.prerequisites.includes(completedTechId)) {
        const progress = this.researchProgresses.get(tech.id);
        if (!progress || progress.status !== ResearchStatus.Locked) {
          continue;
        }
        
        // Vérifie si tous les prérequis sont satisfaits
        const allPrerequisitesMet = tech.prerequisites.every(prereqId => {
          const prereqProgress = this.researchProgresses.get(prereqId);
          return prereqProgress && prereqProgress.status === ResearchStatus.Completed;
        });
        
        if (allPrerequisitesMet) {
          progress.status = ResearchStatus.Available;
        }
      }
    }
  }
  
  // Obtient la progression de toutes les technologies
  public getAllProgressions(): ResearchProgress[] {
    return Array.from(this.researchProgresses.values());
  }
  
  // Obtient la progression d'une technologie spécifique
  public getProgressionForTechnology(technologyId: string): ResearchProgress | null {
    return this.researchProgresses.get(technologyId) || null;
  }
  
  // Vérifie si une technologie est recherchée
  public hasTechnology(technologyId: string): boolean {
    const progress = this.researchProgresses.get(technologyId);
    return progress?.status === ResearchStatus.Completed;
  }
  
  // Obtient l'ID de la recherche active
  public getActiveResearch(): string | null {
    return this.activeResearch;
  }
  
  // Annule la recherche en cours
  public cancelResearch(): boolean {
    if (this.activeResearch === null) {
      return false;
    }
    
    const progress = this.researchProgresses.get(this.activeResearch);
    if (!progress || progress.status !== ResearchStatus.InProgress) {
      return false;
    }
    
    // Rembourse une partie du coût (50%)
    const technology = this.availableTechs.find(tech => tech.id === this.activeResearch);
    if (technology) {
      const refund = Math.floor(technology.cost(this.player) * 0.5);
      this.player.addGold(refund);
    }
    
    // Réinitialise la progression
    progress.status = ResearchStatus.Available;
    progress.progress = 0;
    progress.startTick = undefined;
    this.activeResearch = null;
    
    return true;
  }
}

// Définition des technologies disponibles
export const availableTechnologies: Technology[] = [
  // Technologies militaires de base
  {
    id: "advanced-weaponry",
    name: "Armement avancé",
    description: "Augmente les dégâts de toutes les unités militaires de 15%",
    category: TechnologyCategory.Military,
    cost: (player: Player | PlayerView): Gold => 150 + player.tiles().size * 0.5,
    researchTime: 20,
    prerequisites: [],
    effect: (player: Player) => {
      // Effet à implémenter dans le système de combat
    }
  },
  {
    id: "reinforced-armor",
    name: "Blindage renforcé",
    description: "Augmente la santé de toutes les unités de 20%",
    category: TechnologyCategory.Military,
    cost: (player: Player | PlayerView): Gold => 180 + player.tiles().size * 0.6,
    researchTime: 25,
    prerequisites: [],
    effect: (player: Player) => {
      // Effet à implémenter dans le système de combat
    }
  },
  
  // Technologies économiques de base
  {
    id: "economic-efficiency",
    name: "Efficacité économique",
    description: "Augmente la production d'or de 10%",
    category: TechnologyCategory.Economy,
    cost: (player: Player | PlayerView): Gold => 120 + player.tiles().size * 0.4,
    researchTime: 15,
    prerequisites: [],
    effect: (player: Player) => {
      // Effet à implémenter dans le système économique
    }
  },
  {
    id: "population-growth",
    name: "Croissance démographique",
    description: "Augmente la croissance de la population de 15%",
    category: TechnologyCategory.Economy,
    cost: (player: Player | PlayerView): Gold => 140 + player.tiles().size * 0.5,
    researchTime: 18,
    prerequisites: [],
    effect: (player: Player) => {
      // Effet à implémenter dans le système de population
    }
  },
  
  // Technologies militaires avancées
  {
    id: "tank-production",
    name: "Production de chars",
    description: "Permet la construction de chars d'assaut",
    category: TechnologyCategory.Military,
    cost: (player: Player | PlayerView): Gold => 200 + player.tiles().size * 0.7,
    researchTime: 30,
    prerequisites: ["advanced-weaponry"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des chars
    }
  },
  {
    id: "artillery-systems",
    name: "Systèmes d'artillerie",
    description: "Permet la construction d'unités d'artillerie",
    category: TechnologyCategory.Military,
    cost: (player: Player | PlayerView): Gold => 180 + player.tiles().size * 0.6,
    researchTime: 25,
    prerequisites: ["advanced-weaponry"],
    effect: (player: Player) => {
      // Débloque la capacité de construire de l'artillerie
    }
  },
  
  // Technologies navales
  {
    id: "naval-engineering",
    name: "Ingénierie navale",
    description: "Permet la construction de bases navales et améliore les unités maritimes",
    category: TechnologyCategory.Naval,
    cost: (player: Player | PlayerView): Gold => 220 + player.tiles().size * 0.8,
    researchTime: 35,
    prerequisites: [],
    effect: (player: Player) => {
      // Débloque les capacités navales
    }
  },
  {
    id: "submarine-warfare",
    name: "Guerre sous-marine",
    description: "Permet la construction de sous-marins furtifs",
    category: TechnologyCategory.Naval,
    cost: (player: Player | PlayerView): Gold => 250 + player.tiles().size * 0.9,
    researchTime: 40,
    prerequisites: ["naval-engineering"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des sous-marins
    }
  },
  {
    id: "aircraft-carriers",
    name: "Porte-avions",
    description: "Permet la construction de porte-avions",
    category: TechnologyCategory.Naval,
    cost: (player: Player | PlayerView): Gold => 300 + player.tiles().size * 1.0,
    researchTime: 45,
    prerequisites: ["naval-engineering", "air-superiority"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des porte-avions
    }
  },
  
  // Technologies aériennes
  {
    id: "air-superiority",
    name: "Supériorité aérienne",
    description: "Permet la construction de bases aériennes et d'avions de chasse",
    category: TechnologyCategory.Aviation,
    cost: (player: Player | PlayerView): Gold => 240 + player.tiles().size * 0.8,
    researchTime: 35,
    prerequisites: [],
    effect: (player: Player) => {
      // Débloque les capacités aériennes
    }
  },
  {
    id: "bomber-technology",
    name: "Technologie de bombardement",
    description: "Permet la construction de bombardiers lourds",
    category: TechnologyCategory.Aviation,
    cost: (player: Player | PlayerView): Gold => 280 + player.tiles().size * 0.9,
    researchTime: 40,
    prerequisites: ["air-superiority"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des bombardiers
    }
  },
  {
    id: "reconnaissance-drones",
    name: "Drones de reconnaissance",
    description: "Permet la construction de drones de reconnaissance pour la surveillance",
    category: TechnologyCategory.Aviation,
    cost: (player: Player | PlayerView): Gold => 200 + player.tiles().size * 0.7,
    researchTime: 30,
    prerequisites: ["air-superiority"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des drones
    }
  },
  
  // Technologies d'infrastructure
  {
    id: "advanced-construction",
    name: "Construction avancée",
    description: "Réduit le temps de construction des bâtiments de 20%",
    category: TechnologyCategory.Infrastructure,
    cost: (player: Player | PlayerView): Gold => 160 + player.tiles().size * 0.5,
    researchTime: 20,
    prerequisites: [],
    effect: (player: Player) => {
      // Effet sur le temps de construction
    }
  },
  {
    id: "fortification-techniques",
    name: "Techniques de fortification",
    description: "Permet la construction de bunkers défensifs",
    category: TechnologyCategory.Infrastructure,
    cost: (player: Player | PlayerView): Gold => 180 + player.tiles().size * 0.6,
    researchTime: 25,
    prerequisites: ["advanced-construction"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des bunkers
    }
  },
  {
    id: "industrial-revolution",
    name: "Révolution industrielle",
    description: "Permet la construction d'usines et d'installations minières",
    category: TechnologyCategory.Infrastructure,
    cost: (player: Player | PlayerView): Gold => 200 + player.tiles().size * 0.7,
    researchTime: 30,
    prerequisites: ["advanced-construction"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des usines
    }
  },
  {
    id: "commercial-markets",
    name: "Marchés commerciaux",
    description: "Permet la construction de marchés qui augmentent le revenu économique",
    category: TechnologyCategory.Economy,
    cost: (player: Player | PlayerView): Gold => 160 + player.tiles().size * 0.6,
    researchTime: 25,
    prerequisites: ["economic-efficiency"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des marchés
    }
  },
  
  // Technologies spéciales
  {
    id: "espionage",
    name: "Espionnage",
    description: "Permet la construction d'agences d'espionnage pour surveiller les adversaires",
    category: TechnologyCategory.Special,
    cost: (player: Player | PlayerView): Gold => 250 + player.tiles().size * 0.8,
    researchTime: 35,
    prerequisites: [],
    effect: (player: Player) => {
      // Débloque les capacités d'espionnage
    }
  },
  {
    id: "emp-technology",
    name: "Technologie EMP",
    description: "Permet la construction d'armes à impulsion électromagnétique",
    category: TechnologyCategory.Special,
    cost: (player: Player | PlayerView): Gold => 300 + player.tiles().size * 1.0,
    researchTime: 40,
    prerequisites: ["espionage"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des EMPs
    }
  },
  {
    id: "energy-shields",
    name: "Boucliers énergétiques",
    description: "Permet la construction de boucliers énergétiques pour protéger les territoires",
    category: TechnologyCategory.Special,
    cost: (player: Player | PlayerView): Gold => 350 + player.tiles().size * 1.2,
    researchTime: 45,
    prerequisites: ["emp-technology"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des boucliers énergétiques
    }
  },
  {
    id: "advanced-research",
    name: "Recherche avancée",
    description: "Permet la construction de centres de recherche et accélère les futures recherches de 25%",
    category: TechnologyCategory.Special,
    cost: (player: Player | PlayerView): Gold => 280 + player.tiles().size * 0.9,
    researchTime: 40,
    prerequisites: ["economic-efficiency", "advanced-construction"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des centres de recherche
    }
  },
  
  // Technologies militaires très avancées
  {
    id: "anti-aircraft-systems",
    name: "Systèmes anti-aériens",
    description: "Permet la construction de défenses anti-aériennes",
    category: TechnologyCategory.Military,
    cost: (player: Player | PlayerView): Gold => 220 + player.tiles().size * 0.8,
    researchTime: 35,
    prerequisites: ["advanced-weaponry", "air-superiority"],
    effect: (player: Player) => {
      // Débloque la capacité de construire des défenses anti-aériennes
    }
  },
  {
    id: "strategic-command",
    name: "Commandement stratégique",
    description: "Améliore l'efficacité de toutes les unités militaires de 10% et augmente leur portée",
    category: TechnologyCategory.Military,
    cost: (player: Player | PlayerView): Gold => 400 + player.tiles().size * 1.3,
    researchTime: 50,
    prerequisites: ["tank-production", "artillery-systems", "anti-aircraft-systems"],
    effect: (player: Player) => {
      // Améliore toutes les unités militaires
    }
  }
];

// Interface pour l'arbre technologique (pour l'interface utilisateur)
export interface TechTreeNode {
  tech: Technology;
  children: TechTreeNode[];
  x?: number; // Position X pour l'affichage
  y?: number; // Position Y pour l'affichage
}

// Construit un arbre technologique à partir de la liste de technologies
export function buildTechTree(technologies: Technology[]): TechTreeNode[] {
  // Trouver les technologies de base (sans prérequis)
  const rootTechs = technologies.filter(tech => tech.prerequisites.length === 0);
  
  // Map pour stocker les nœuds déjà traités
  const processedNodes = new Map<string, TechTreeNode>();
  
  // Fonction récursive pour construire l'arbre
  function buildNodeRecursively(tech: Technology): TechTreeNode {
    // Vérifier si le nœud a déjà été traité
    if (processedNodes.has(tech.id)) {
      return processedNodes.get(tech.id)!;
    }
    
    // Créer un nouveau nœud
    const node: TechTreeNode = {
      tech,
      children: []
    };
    
    // Stocker le nœud dans la map
    processedNodes.set(tech.id, node);
    
    // Trouver toutes les technologies qui dépendent de cette technologie
    const dependentTechs = technologies.filter(t => 
      t.prerequisites.includes(tech.id)
    );
    
    // Construire les nœuds enfants
    for (const dependentTech of dependentTechs) {
      const childNode = buildNodeRecursively(dependentTech);
      node.children.push(childNode);
    }
    
    return node;
  }
  
  // Construire l'arbre à partir des technologies de base
  return rootTechs.map(tech => buildNodeRecursively(tech));
}

// Calcule les positions des nœuds pour l'affichage de l'arbre technologique
export function calculateTechTreeLayout(rootNodes: TechTreeNode[], levelHeight: number = 120, nodeWidth: number = 150): void {
  // Fonction récursive pour calculer les positions
  function calculatePositions(node: TechTreeNode, level: number, startX: number): number {
    // Définir la position Y en fonction du niveau
    node.y = level * levelHeight;
    
    if (node.children.length === 0) {
      // Nœud feuille, position X au point de départ
      node.x = startX;
      return startX + nodeWidth;
    }
    
    // Calculer les positions des enfants
    let currentX = startX;
    for (const child of node.children) {
      currentX = calculatePositions(child, level + 1, currentX);
    }
    
    // Centre le nœud parent au-dessus de ses enfants
    if (node.children.length > 0) {
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.x = (firstChild.x! + lastChild.x!) / 2;
    } else {
      node.x = startX;
    }
    
    return currentX;
  }
  
  // Calculer les positions pour chaque arbre racine
  let startX = 0;
  for (const rootNode of rootNodes) {
    startX = calculatePositions(rootNode, 0, startX) + nodeWidth;
  }
}
