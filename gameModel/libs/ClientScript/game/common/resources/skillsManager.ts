import { Resource } from "./resource";

/**
 * Definition of the skills of a resource to perform a task.
 * <p>
 * The data here are reported from the Google Drive document "compétences MIMMS_rev1".
 */

/**
 * Skills levels :
 * - no_skill (1) : "incapable / je ne fais pas"
 * - low_skill (2) : "un peu capable / durée"
 * - high_skill (3) : "capable de faire correctement"
 */
export type SkillLevel = 'no_skill' | 'low_skill' | 'high_skill';

export function getSkillForPretriage(resource: Resource): SkillLevel {
  switch (resource.type) {
    case "techAmbul":
    case "ambulancier":
    case "infirmier":
    case "medJunior":
    case "medSenior":
      return 'high_skill';
    case "secouriste" :
    case "ambulance":
    case "helicopter":
      return 'no_skill';
  }
}

export function getSkillForTriage(resource: Resource): SkillLevel {
  switch (resource.type) {
    case "ambulancier":
    case "infirmier":
    case "medJunior":
    case "medSenior":
      return 'high_skill';
    case "techAmbul":
      return 'low_skill';
    case "secouriste":
    case "ambulance":
    case "helicopter":
      return 'no_skill';
  }
}

export function getSkillToDriveAmbulance(resource: Resource): SkillLevel {
  switch (resource.type) {
    case "techAmbul":
    case "ambulancier":
    case "infirmier":
      return 'high_skill';
    case "secouriste":
    case "medJunior":
    case "medSenior":
    case "ambulance":
    case "helicopter":
      return 'no_skill';
  }
}

// export function getSkillXXX(resource: Resource): SkillLevel {
//   switch (resource.type) {
//     case "secouriste":
//     case "techAmbul":
//     case "ambulancier":
//     case "infirmier":
//     case "medJunior":
//     case "medSenior":
//     case "ambulance":
//     case "helicopter":
//       return 'no_skill';
//   }
// }
