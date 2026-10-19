export interface Individual {
  id: string; // e.g., '@I1@'
  name: string; // e.g., 'João Carlos /da Silva/'
  givenName: string; // e.g., 'João Carlos'
  surname: string; // e.g., 'da Silva'
  sex: 'M' | 'F' | 'U';
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  famc?: string; // Family where this person is a child (parents' family)
  fams: string[]; // Families where this person is a spouse/parent
  notes?: string[];
  rawLines?: string[];
}

export interface Family {
  id: string; // e.g., '@F1@'
  husbandId?: string; // e.g., '@I1@'
  wifeId?: string; // e.g., '@I2@'
  childrenIds: string[]; // e.g., ['@I3@', '@I4@']
  // Marriage details (Crucial user requirement: tags 1 MARR, 2 DATE, 2 PLAC)
  hasMarriageEvent: boolean;
  marriageDate?: string; // tag 1 MARR -> 2 DATE
  marriagePlace?: string; // tag 1 MARR -> 2 PLAC
  divorceDate?: string; // tag 1 DIV -> 2 DATE
  notes?: string[];
  rawLines?: string[];
}

export interface GedcomDocument {
  header: string[];
  individuals: Map<string, Individual>;
  families: Map<string, Family>;
  otherRecords: string[];
  trailer: string[];
}

export interface DirectAncestorNode {
  id: string;
  individual: Individual;
  generation: number; // 0 for @I1@, 1 for parents, 2 for grandparents, etc.
  relationship: string; // 'Raiz (@I1@)', 'Pai', 'Mãe', 'Avô Paterno', etc.
  ahnentafelNumber: number; // 1 = @I1@, 2 = Pai, 3 = Mãe, 4 = Avô Paterno, etc.
  fatherId?: string;
  motherId?: string;
  familyId?: string;
  marriageDate?: string;
  marriagePlace?: string;
}

export interface DirectAncestorsResult {
  ancestorDoc: GedcomDocument;
  ancestorIds: Set<string>;
  ancestorNodes: DirectAncestorNode[];
  rawGedcomText: string;
  generationStats: Record<number, number>;
  totalDirectAncestors: number;
  totalFamilies: number;
}

export interface SavedLocalFile {
  filename: string;
  relativePath: string;
  sizeBytes: number;
  updatedAt: string;
  type?: 'complete' | 'ancestors';
}

export interface GitStatusInfo {
  initialized: boolean;
  branch?: string;
  statusText?: string;
  hasChanges?: boolean;
  remotes?: string;
  error?: string;
}

export interface GitCommitRecord {
  hash: string;
  author: string;
  date: string;
  subject: string;
}
