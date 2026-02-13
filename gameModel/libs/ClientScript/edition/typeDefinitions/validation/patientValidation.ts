import { BodyFactoryParam } from '../../../HUMAn/human';
import { GenericValidationContext, GenericValidationMessage } from './validationContext';

export function patientValidator(
  patients: BodyFactoryParam[],
  ctx: GenericValidationContext
): GenericValidationMessage[] {
  const result: GenericValidationMessage[] = [];

  if (patients.length == 0) {
    result.push({
      id: 'no-patient',
      level: 'ERROR',
      title: 'No patients configured',
      description:
        'The simulation cannot run without patients.<br/>Please generate at least one patient in the Patients tab.',
      validationContext: ctx,
    });
  }

  return result;
}
