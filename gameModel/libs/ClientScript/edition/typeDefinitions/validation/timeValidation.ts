import { GenericValidationContext, GenericValidationMessage } from './validationContext';

export function timeValidator(
  startHours: number,
  startMinutes: number,
  patientsElapsedMinutes: number,
  ctx: GenericValidationContext
): GenericValidationMessage[] {
  const result: GenericValidationMessage[] = [];

  // TODO be sure of what must be checked
  if (
    startHours < 0 ||
    startHours > 23 ||
    startMinutes < 0 ||
    startMinutes > 59 ||
    patientsElapsedMinutes < 0
  ) {
    result.push({
      id: 'time-error',
      level: 'ERROR',
      title: 'Inconsistent times',
      description:
        'The start time and arrival time are not compatible.<br/>Check the start time and arrival time in the Map tab. The start time must be in HH:mm format.',
      validationContext: ctx,
    });
  }

  return result;
}
