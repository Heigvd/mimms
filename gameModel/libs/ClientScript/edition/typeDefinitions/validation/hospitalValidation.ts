import { HospitalDefinition } from '../../../game/common/evacuation/hospitalType';
import { GenericValidationContext, GenericValidationMessage } from './validationContext';

export function hospitalValidator(
  hospitals: HospitalDefinition[],
  ctx: GenericValidationContext
): GenericValidationMessage[] {
  const result: GenericValidationMessage[] = [];

  if (hospitals.length == 0) {
    result.push({
      id: 'no-hospital',
      level: 'ERROR',
      title: 'No hospital configured',
      description:
        'Patients cannot be treated without a hospital.<br/>Set up at least one hospital in the Hospitals tab.',
      validationContext: ctx,
    });
  }

  return result;
}
