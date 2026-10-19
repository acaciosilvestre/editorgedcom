import {
  Individual,
  Family,
  GedcomDocument,
  DirectAncestorNode,
  DirectAncestorsResult,
} from '../types/gedcom';

/**
 * Parses a raw GEDCOM string into structured GedcomDocument
 */
export function parseGedcom(content: string): GedcomDocument {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const header: string[] = [];
  const trailer: string[] = ['0 TRLR'];
  const individuals = new Map<string, Individual>();
  const families = new Map<string, Family>();
  const otherRecords: string[] = [];

  let currentRecordType: 'HEAD' | 'INDI' | 'FAM' | 'OTHER' | 'TRLR' | null = null;
  let currentIndi: Individual | null = null;
  let currentFam: Family | null = null;
  let currentOtherLines: string[] = [];

  let inBirt = false;
  let inDeat = false;
  let inMarr = false;
  let inDiv = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check level 0 record definition
    if (trimmed.startsWith('0 ')) {
      // Finalize previous record
      if (currentIndi) {
        individuals.set(currentIndi.id, currentIndi);
        currentIndi = null;
      }
      if (currentFam) {
        families.set(currentFam.id, currentFam);
        currentFam = null;
      }
      if (currentOtherLines.length > 0) {
        otherRecords.push(currentOtherLines.join('\n'));
        currentOtherLines = [];
      }

      inBirt = false;
      inDeat = false;
      inMarr = false;
      inDiv = false;

      const tokens = trimmed.split(/\s+/);
      if (tokens[1] === 'HEAD') {
        currentRecordType = 'HEAD';
        header.push(rawLine);
      } else if (tokens[1] === 'TRLR') {
        currentRecordType = 'TRLR';
      } else if (tokens[2] === 'INDI') {
        currentRecordType = 'INDI';
        currentIndi = {
          id: tokens[1],
          name: '',
          givenName: '',
          surname: '',
          sex: 'U',
          fams: [],
          notes: [],
          rawLines: [],
        };
      } else if (tokens[2] === 'FAM') {
        currentRecordType = 'FAM';
        currentFam = {
          id: tokens[1],
          childrenIds: [],
          hasMarriageEvent: false,
          notes: [],
          rawLines: [],
        };
      } else {
        currentRecordType = 'OTHER';
        currentOtherLines.push(rawLine);
      }
      continue;
    }

    if (currentRecordType === 'HEAD') {
      header.push(rawLine);
      continue;
    }

    if (currentRecordType === 'TRLR') {
      continue;
    }

    if (currentRecordType === 'OTHER') {
      currentOtherLines.push(rawLine);
      continue;
    }

    // Processing Individual record
    if (currentRecordType === 'INDI' && currentIndi) {
      const match = trimmed.match(/^(\d+)\s+([A-Z0-9_]+)(?:\s+(.*))?$/);
      if (!match) {
        currentIndi.rawLines?.push(rawLine);
        continue;
      }

      const level = parseInt(match[1], 10);
      const tag = match[2];
      const val = match[3] || '';

      if (level === 1) {
        inBirt = tag === 'BIRT';
        inDeat = tag === 'DEAT';

        if (tag === 'NAME') {
          currentIndi.name = val;
          // Extract surname between slashes if present
          const slashMatch = val.match(/\/(.*?)\//);
          if (slashMatch) {
            currentIndi.surname = slashMatch[1].trim();
            currentIndi.givenName = val.replace(/\/(.*?)\//, '').trim();
          } else if (!currentIndi.givenName) {
            currentIndi.givenName = val;
          }
        } else if (tag === 'SEX') {
          currentIndi.sex = val.toUpperCase().startsWith('M') ? 'M' : val.toUpperCase().startsWith('F') ? 'F' : 'U';
        } else if (tag === 'FAMS') {
          if (!currentIndi.fams.includes(val)) {
            currentIndi.fams.push(val);
          }
        } else if (tag === 'FAMC') {
          currentIndi.famc = val;
        } else if (tag === 'NOTE') {
          currentIndi.notes?.push(val);
        } else if (!inBirt && !inDeat) {
          currentIndi.rawLines?.push(rawLine);
        }
      } else if (level === 2) {
        if (inBirt) {
          if (tag === 'DATE') currentIndi.birthDate = val;
          else if (tag === 'PLAC') currentIndi.birthPlace = val;
          else currentIndi.rawLines?.push(rawLine);
        } else if (inDeat) {
          if (tag === 'DATE') currentIndi.deathDate = val;
          else if (tag === 'PLAC') currentIndi.deathPlace = val;
          else currentIndi.rawLines?.push(rawLine);
        } else if (tag === 'GIVN') {
          currentIndi.givenName = val;
        } else if (tag === 'SURN') {
          currentIndi.surname = val;
        } else {
          currentIndi.rawLines?.push(rawLine);
        }
      } else {
        currentIndi.rawLines?.push(rawLine);
      }
      continue;
    }

    // Processing Family record
    if (currentRecordType === 'FAM' && currentFam) {
      const match = trimmed.match(/^(\d+)\s+([A-Z0-9_]+)(?:\s+(.*))?$/);
      if (!match) {
        currentFam.rawLines?.push(rawLine);
        continue;
      }

      const level = parseInt(match[1], 10);
      const tag = match[2];
      const val = match[3] || '';

      if (level === 1) {
        inMarr = tag === 'MARR';
        inDiv = tag === 'DIV';

        if (tag === 'HUSB') {
          currentFam.husbandId = val;
        } else if (tag === 'WIFE') {
          currentFam.wifeId = val;
        } else if (tag === 'CHIL') {
          if (!currentFam.childrenIds.includes(val)) {
            currentFam.childrenIds.push(val);
          }
        } else if (tag === 'MARR') {
          currentFam.hasMarriageEvent = true;
        } else if (tag === 'NOTE') {
          currentFam.notes?.push(val);
        } else if (!inDiv) {
          currentFam.rawLines?.push(rawLine);
        }
      } else if (level === 2) {
        if (inMarr) {
          // Marriage DATE and PLAC tags (Crucial requirement!)
          if (tag === 'DATE') {
            currentFam.marriageDate = val;
          } else if (tag === 'PLAC') {
            currentFam.marriagePlace = val;
          } else {
            currentFam.rawLines?.push(rawLine);
          }
        } else if (inDiv) {
          if (tag === 'DATE') currentFam.divorceDate = val;
        } else {
          currentFam.rawLines?.push(rawLine);
        }
      } else {
        currentFam.rawLines?.push(rawLine);
      }
      continue;
    }
  }

  // Final check for trailing record
  if (currentIndi) individuals.set(currentIndi.id, currentIndi);
  if (currentFam) families.set(currentFam.id, currentFam);
  if (currentOtherLines.length > 0) otherRecords.push(currentOtherLines.join('\n'));

  // Ensure standard header if empty
  if (header.length === 0) {
    header.push('0 HEAD', '1 SOUR EditorGEDCOM', '2 VERS 2.0', '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8');
  }

  return {
    header,
    individuals,
    families,
    otherRecords,
    trailer: ['0 TRLR'],
  };
}

/**
 * Serializes a GedcomDocument back into a standard GEDCOM 5.5.1 string
 */
export function serializeGedcom(doc: GedcomDocument): string {
  const lines: string[] = [];

  // 1. Header
  if (doc.header.length > 0) {
    lines.push(...doc.header);
  } else {
    lines.push('0 HEAD', '1 SOUR EditorGEDCOM', '2 VERS 2.0', '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8');
  }

  // 2. Individuals
  doc.individuals.forEach(indi => {
    lines.push(`0 ${indi.id} INDI`);

    // Name formatting
    const surnameFmt = indi.surname ? `/${indi.surname}/` : '';
    const fullName = indi.name || `${indi.givenName || ''} ${surnameFmt}`.trim();
    lines.push(`1 NAME ${fullName}`);
    if (indi.givenName) {
      lines.push(`2 GIVN ${indi.givenName}`);
    }
    if (indi.surname) {
      lines.push(`2 SURN ${indi.surname}`);
    }

    // Sex
    lines.push(`1 SEX ${indi.sex || 'U'}`);

    // Birth
    if (indi.birthDate || indi.birthPlace) {
      lines.push('1 BIRT');
      if (indi.birthDate) lines.push(`2 DATE ${indi.birthDate}`);
      if (indi.birthPlace) lines.push(`2 PLAC ${indi.birthPlace}`);
    }

    // Death
    if (indi.deathDate || indi.deathPlace) {
      lines.push('1 DEAT');
      if (indi.deathDate) lines.push(`2 DATE ${indi.deathDate}`);
      if (indi.deathPlace) lines.push(`2 PLAC ${indi.deathPlace}`);
    }

    // Family links
    indi.fams.forEach(famsId => {
      lines.push(`1 FAMS ${famsId}`);
    });
    if (indi.famc) {
      lines.push(`1 FAMC ${indi.famc}`);
    }

    // Notes
    indi.notes?.forEach(n => {
      lines.push(`1 NOTE ${n}`);
    });

    // Custom or preserved raw lines
    indi.rawLines?.forEach(rl => {
      lines.push(rl);
    });
  });

  // 3. Families
  doc.families.forEach(fam => {
    lines.push(`0 ${fam.id} FAM`);

    if (fam.husbandId) {
      lines.push(`1 HUSB ${fam.husbandId}`);
    }
    if (fam.wifeId) {
      lines.push(`1 WIFE ${fam.wifeId}`);
    }
    fam.childrenIds.forEach(chilId => {
      lines.push(`1 CHIL ${chilId}`);
    });

    // Marriage tags (1 MARR, 2 DATE, 2 PLAC)
    if (fam.hasMarriageEvent || fam.marriageDate || fam.marriagePlace) {
      lines.push('1 MARR');
      if (fam.marriageDate) {
        lines.push(`2 DATE ${fam.marriageDate}`);
      }
      if (fam.marriagePlace) {
        lines.push(`2 PLAC ${fam.marriagePlace}`);
      }
    }

    // Divorce tag
    if (fam.divorceDate) {
      lines.push('1 DIV');
      lines.push(`2 DATE ${fam.divorceDate}`);
    }

    // Notes
    fam.notes?.forEach(n => {
      lines.push(`1 NOTE ${n}`);
    });

    fam.rawLines?.forEach(rl => {
      lines.push(rl);
    });
  });

  // 4. Other records
  doc.otherRecords.forEach(rec => {
    lines.push(rec);
  });

  // 5. Trailer
  lines.push('0 TRLR');

  return lines.join('\n') + '\n';
}

/**
 * Computes relationship label based on Ahnentafel number
 */
function getAhnentafelRelationship(ahn: number): string {
  if (ahn === 1) return 'Raiz (@I1@)';
  if (ahn === 2) return 'Pai';
  if (ahn === 3) return 'Mãe';
  if (ahn === 4) return 'Avô Paterno';
  if (ahn === 5) return 'Avó Paterna';
  if (ahn === 6) return 'Avô Materno';
  if (ahn === 7) return 'Avó Materna';
  if (ahn === 8) return 'Bisavô Paterno (Pai do Avô Paterno)';
  if (ahn === 9) return 'Bisavó Paterna (Mãe do Avô Paterno)';
  if (ahn === 10) return 'Bisavô Paterno (Pai da Avó Paterna)';
  if (ahn === 11) return 'Bisavó Paterna (Mãe da Avó Paterna)';
  if (ahn === 12) return 'Bisavô Materno (Pai do Avô Materno)';
  if (ahn === 13) return 'Bisavó Materna (Mãe do Avô Materno)';
  if (ahn === 14) return 'Bisavô Materno (Pai da Avó Materna)';
  if (ahn === 15) return 'Bisavó Materna (Mãe da Avó Materna)';

  // Calculate generation
  const gen = Math.floor(Math.log2(ahn));
  const isMale = ahn % 2 === 0;
  if (gen === 4) return isMale ? `Trisavô (Ahnentafel #${ahn})` : `Trisavó (Ahnentafel #${ahn})`;
  if (gen === 5) return isMale ? `Tetravô (Ahnentafel #${ahn})` : `Tetravó (Ahnentafel #${ahn})`;
  return isMale ? `Ascendente Masculino G${gen} (#${ahn})` : `Ascendente Feminino G${gen} (#${ahn})`;
}

/**
 * Extracts ONLY the direct biological ancestors of a given individual (default @I1@).
 * Excludes siblings, cousins, spouses of non-ancestors, and collateral branches.
 * Connects the direct lineage with family records preserving Marriage Date and Place.
 */
export function extractDirectAncestors(
  doc: GedcomDocument,
  rootId: string = '@I1@'
): DirectAncestorsResult {
  const rootIndi = doc.individuals.get(rootId);
  const ancestorIds = new Set<string>();
  const ancestorNodes: DirectAncestorNode[] = [];
  const ancestorFamilies = new Map<string, Family>();
  const generationStats: Record<number, number> = {};

  if (!rootIndi) {
    // Return empty result if root not found
    const emptyDoc: GedcomDocument = {
      header: doc.header,
      individuals: new Map(),
      families: new Map(),
      otherRecords: [],
      trailer: ['0 TRLR'],
    };
    return {
      ancestorDoc: emptyDoc,
      ancestorIds,
      ancestorNodes: [],
      rawGedcomText: serializeGedcom(emptyDoc),
      generationStats: {},
      totalDirectAncestors: 0,
      totalFamilies: 0,
    };
  }

  // Queue for BFS traversal up the ancestral tree
  // Ahnentafel numbering system:
  // 1: Root (@I1@)
  // 2: Father of 1, 3: Mother of 1
  // 2k: Father of k, 2k+1: Mother of k
  interface QueueItem {
    id: string;
    generation: number;
    ahnentafel: number;
    childId?: string;
  }

  const queue: QueueItem[] = [{ id: rootId, generation: 0, ahnentafel: 1 }];
  ancestorIds.add(rootId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const indi = doc.individuals.get(current.id);
    if (!indi) continue;

    generationStats[current.generation] = (generationStats[current.generation] || 0) + 1;

    let fatherId: string | undefined;
    let motherId: string | undefined;
    let fam: Family | undefined;

    // Check parents family (FAMC)
    if (indi.famc) {
      fam = doc.families.get(indi.famc);
      if (fam) {
        fatherId = fam.husbandId;
        motherId = fam.wifeId;

        // Clone family for ancestors export, including marriage date and place!
        const ancestralFam: Family = {
          id: fam.id,
          husbandId: fam.husbandId,
          wifeId: fam.wifeId,
          childrenIds: [current.id], // Only keep the direct descendant child in this line!
          hasMarriageEvent: fam.hasMarriageEvent,
          marriageDate: fam.marriageDate,
          marriagePlace: fam.marriagePlace,
          divorceDate: fam.divorceDate,
          notes: fam.notes ? [...fam.notes] : [],
          rawLines: fam.rawLines ? [...fam.rawLines] : [],
        };
        ancestorFamilies.set(fam.id, ancestralFam);

        // Add Father (Ahnentafel: ahn * 2)
        if (fatherId && doc.individuals.has(fatherId)) {
          if (!ancestorIds.has(fatherId)) {
            ancestorIds.add(fatherId);
            queue.push({
              id: fatherId,
              generation: current.generation + 1,
              ahnentafel: current.ahnentafel * 2,
              childId: current.id,
            });
          }
        }

        // Add Mother (Ahnentafel: ahn * 2 + 1)
        if (motherId && doc.individuals.has(motherId)) {
          if (!ancestorIds.has(motherId)) {
            ancestorIds.add(motherId);
            queue.push({
              id: motherId,
              generation: current.generation + 1,
              ahnentafel: current.ahnentafel * 2 + 1,
              childId: current.id,
            });
          }
        }
      }
    }

    ancestorNodes.push({
      id: current.id,
      individual: indi,
      generation: current.generation,
      relationship: getAhnentafelRelationship(current.ahnentafel),
      ahnentafelNumber: current.ahnentafel,
      fatherId,
      motherId,
      familyId: fam?.id,
      marriageDate: fam?.marriageDate,
      marriagePlace: fam?.marriagePlace,
    });
  }

  // Sort nodes by Ahnentafel number for clean generational listing
  ancestorNodes.sort((a, b) => a.ahnentafelNumber - b.ahnentafelNumber);

  // Construct filtered GedcomDocument
  const filteredIndividuals = new Map<string, Individual>();

  ancestorNodes.forEach(node => {
    const original = node.individual;
    // Clone individual and keep only references to ancestor families
    const filteredIndi: Individual = {
      ...original,
      // Keep FAMC only if parent family is in the direct ancestor tree
      famc: original.famc && ancestorFamilies.has(original.famc) ? original.famc : undefined,
      // Keep FAMS only if spouse is an ancestor and family connects the lineage
      fams: original.fams.filter(fId => ancestorFamilies.has(fId)),
      notes: [
        ...(original.notes || []),
        `[Ascendente Direto de ${rootId} - Geração ${node.generation} - ${node.relationship}]`,
      ],
    };
    filteredIndividuals.set(node.id, filteredIndi);
  });

  // Prepare clean header documenting the direct ancestors extraction
  const ancestorHeader: string[] = [
    '0 HEAD',
    '1 SOUR EditorGEDCOM_AscendentesDiretos',
    `2 VERS 2.0`,
    `2 NAME Ascendentes Diretos de ${rootId}`,
    `1 NOTE Arquivo GEDCOM contendo exclusivamente os ascendentes diretos de ${rootId} (${rootIndi.name || rootIndi.givenName}).`,
    `1 NOTE Total de ascendentes diretos incluídos: ${filteredIndividuals.size}.`,
    `1 NOTE Total de famílias/casamentos ancestrais: ${ancestorFamilies.size}.`,
    '1 GEDC',
    '2 VERS 5.5.1',
    '2 FORM LINEAGE-LINKED',
    '1 CHAR UTF-8',
  ];

  const ancestorDoc: GedcomDocument = {
    header: ancestorHeader,
    individuals: filteredIndividuals,
    families: ancestorFamilies,
    otherRecords: [],
    trailer: ['0 TRLR'],
  };

  const rawGedcomText = serializeGedcom(ancestorDoc);

  return {
    ancestorDoc,
    ancestorIds,
    ancestorNodes,
    rawGedcomText,
    generationStats,
    totalDirectAncestors: filteredIndividuals.size,
    totalFamilies: ancestorFamilies.size,
  };
}
