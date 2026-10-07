// =====================================================================
// RENTBOOK KENYA — KENYAN FLAT AUTO-NAMING ENGINE
// Supports Scheme 1 to Scheme 6, multi-block configs, and live previews
// =====================================================================

import { NamingSchemeConfig } from '../types';

export interface GeneratedUnitSpec {
  floorNumber: number;
  blockName?: string;
  name: string;
}

const FLOOR_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];

export function generateUnitNames(
  floors: number,
  unitsPerFloor: number,
  scheme: NamingSchemeConfig,
  blocks: string[] = []
): GeneratedUnitSpec[] {
  const result: GeneratedUnitSpec[] = [];
  const hasBlocks = blocks.length > 0;
  const activeBlocks = hasBlocks ? blocks : [''];
  const groundConvention = scheme.groundFloorNaming || 'G'; // Kenyan standard: default to 'G'

  let globalSequentialIndex = 1;
  let letterOffset = 0;

  for (const block of activeBlocks) {
    for (let floor = 0; floor < floors; floor++) {
      for (let unitIdx = 1; unitIdx <= unitsPerFloor; unitIdx++) {
        let name = '';

        switch (scheme.type) {
          case 'scheme1': {
            // Scheme 1: Kenyan Block + Floor letter/prefix + unit index
            // Kenyan standard: Ground is G (G1..G4) or Ground (Ground 1..4), First is A1..A4
            const blockPrefix = hasBlocks ? `${block.replace(/^Block\s*/i, '')}-` : '';

            if (floor === 0) {
              if (groundConvention === 'Ground') {
                name = `${blockPrefix}Ground ${unitIdx}`;
              } else if (groundConvention === 'GF') {
                name = `${blockPrefix}GF${unitIdx}`;
              } else if (groundConvention === 'Letter') {
                name = `${blockPrefix}A${unitIdx}`;
              } else {
                // Default 'G': G1, G2, G3...
                name = `${blockPrefix}G${unitIdx}`;
              }
            } else {
              // 1st floor onwards: A1..A4, B1..B4, etc. (or offset if Letter convention used for ground)
              const floorLetterIdx = groundConvention === 'Letter' ? floor : floor - 1;
              const letter = FLOOR_LETTERS[(letterOffset + floorLetterIdx) % FLOOR_LETTERS.length];
              name = `${blockPrefix}${letter}${unitIdx}`;
            }
            break;
          }

          case 'scheme2': {
            // Scheme 2: Floor prefix + number (G1..G4 / Ground 1..4, F1..F4, S1..S4, T1..T4)
            let prefix = 'G';
            if (floor === 0) {
              if (groundConvention === 'Ground') prefix = 'Ground ';
              else if (groundConvention === 'GF') prefix = 'GF';
              else if (groundConvention === 'Letter') prefix = 'A';
              else prefix = 'G';
            } else if (floor === 1) {
              prefix = 'F';
            } else if (floor === 2) {
              prefix = 'S';
            } else if (floor === 3) {
              prefix = 'T';
            } else {
              prefix = `${floor}F`;
            }

            const blockPrefix = hasBlocks ? `${block.replace(/^Block\s*/i, '')}-` : '';
            name = `${blockPrefix}${prefix}${unitIdx}`;
            break;
          }

          case 'scheme3': {
            // Scheme 3: Simple sequential numbers (1, 2, 3, 4...)
            const blockPrefix = hasBlocks ? `${block.replace(/^Block\s*/i, '')}-` : '';
            name = `${blockPrefix}${globalSequentialIndex}`;
            break;
          }

          case 'scheme4': {
            // Scheme 4: Floor label + letter (GA..GD, Ground-A..D, 1A..1D, 2A..2D)
            const unitLetter = String.fromCharCode(64 + unitIdx); // 1->A, 2->B
            let floorLabel = 'G';
            if (floor === 0) {
              if (groundConvention === 'Ground') floorLabel = 'Ground ';
              else if (groundConvention === 'GF') floorLabel = 'GF';
              else if (groundConvention === 'Letter') floorLabel = 'A';
              else floorLabel = 'G';
            } else {
              floorLabel = String(floor);
            }

            const blockPrefix = hasBlocks ? `${block.replace(/^Block\s*/i, '')}-` : '';
            name = `${blockPrefix}${floorLabel}${unitLetter}`;
            break;
          }

          case 'scheme5': {
            // Scheme 5: Word prefix (House 1, House 2 / Unit 1...)
            const word = scheme.prefixWord || 'House';
            const blockPrefix = hasBlocks ? `${block} ` : '';
            if (floor === 0 && (groundConvention === 'Ground' || groundConvention === 'G')) {
              const gPrefix = groundConvention === 'Ground' ? 'Ground ' : 'G-';
              name = `${blockPrefix}${word} ${gPrefix}${unitIdx}`;
            } else {
              name = `${blockPrefix}${word} ${globalSequentialIndex}`;
            }
            break;
          }

          case 'scheme6': {
            // Scheme 6: Custom pattern using tokens
            const pattern = scheme.customPattern || '{block}{floor}{index}';
            let floorLabel = String(floor);
            let floorLetter = FLOOR_LETTERS[(letterOffset + floor) % FLOOR_LETTERS.length];

            if (floor === 0) {
              if (groundConvention === 'Ground') {
                floorLabel = 'Ground';
                floorLetter = 'Ground';
              } else if (groundConvention === 'GF') {
                floorLabel = 'GF';
                floorLetter = 'GF';
              } else if (groundConvention === 'Letter') {
                floorLabel = 'A';
                floorLetter = 'A';
              } else {
                floorLabel = 'G';
                floorLetter = 'G';
              }
            } else if (groundConvention !== 'Letter') {
              floorLetter = FLOOR_LETTERS[(letterOffset + floor - 1) % FLOOR_LETTERS.length];
            }

            const unitLetter = String.fromCharCode(64 + unitIdx);

            name = pattern
              .replace(/\{block\}/gi, block ? block.replace(/^Block\s*/i, '') : '')
              .replace(/\{floor\}/gi, floorLabel)
              .replace(/\{floorLetter\}/gi, floorLetter)
              .replace(/\{index\}/gi, String(unitIdx))
              .replace(/\{unit\}/gi, unitLetter)
              .replace(/\{seq\}/gi, String(globalSequentialIndex));
            break;
          }

          default:
            name = `Unit ${globalSequentialIndex}`;
        }

        result.push({
          floorNumber: floor,
          blockName: block || undefined,
          name: name.trim(),
        });

        globalSequentialIndex++;
      }
    }

    // Offset floor letters for subsequent blocks if multi-block
    letterOffset += floors;
  }

  return result;
}

/**
 * Friendly floor name in Kenyan convention
 */
export function getFloorDisplayName(floorNumber: number): string {
  if (floorNumber === 0) return 'Ground Floor';
  if (floorNumber === 1) return '1st Floor';
  if (floorNumber === 2) return '2nd Floor';
  if (floorNumber === 3) return '3rd Floor';
  return `${floorNumber}th Floor`;
}

export function getFloorShortName(floorNumber: number): string {
  if (floorNumber === 0) return 'Ground';
  if (floorNumber === 1) return '1st';
  if (floorNumber === 2) return '2nd';
  if (floorNumber === 3) return '3rd';
  return `${floorNumber}th`;
}
