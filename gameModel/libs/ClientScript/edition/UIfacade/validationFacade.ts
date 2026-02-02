import { generateId } from '../../tools/helper';
import { getValidationResults, Page, setValidationResults } from './mainMenuStateFacade';

export interface ValidationResult<ValidationContext> {
  id: string;
  level: 'ERROR' | 'WARNING';
  title: string;
  description: string;
  validationContext: ValidationContext;
}

export interface ValidationContext {
  page: Page;
}

export function getValidationErrors(): ValidationResult<ValidationContext>[] {
  const validationResults = getValidationResults();
  return validationResults.filter(vr => vr.level === 'ERROR');
}

export function getValidationWarnings(): ValidationResult<ValidationContext>[] {
  const validationResults = getValidationResults();
  return validationResults.filter(vr => vr.level !== 'ERROR');
}

export function clearValidationResults(): void {
  setValidationResults([]);
}

export function evaluateValidationResults(): void {
  setValidationResults([
    {
      id: generateId(4),
      level: 'ERROR',
      title: 'Inconsistent times',
      description:
        'The start time and arrival time are not compatible. Check the start time and arrival time in the Map tab. The start time must be in HH:mm format.',
      validationContext: { page: 'map' },
    },
    {
      id: generateId(4),
      level: 'ERROR',
      title: 'Location outside the selected area',
      description:
        'One or more locations are outside the defined area on the map. Verify that all geometries are fully included within the selected area.',
      validationContext: { page: 'locations' },
    },
    {
      id: generateId(4),
      level: 'WARNING',
      title: 'Negative delay',
      description:
        'A negative delay is configured for this impact. This may result in an incorrect action/trigger.',
      validationContext: { page: 'triggers' },
    },
    {
      id: generateId(4),
      level: 'WARNING',
      title: 'Choice "bla bla bla" of action "bi ba bou" doesn\'t have a title',
      description: "This can make the player's decision difficult to understand.",
      validationContext: { page: 'actions' },
    },
  ]);
}
