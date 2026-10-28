import { BodyFactoryParam } from '../../../HUMAn/human';
import { getMaxPatients } from '../../UIfacade/patientGenFacade';
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
  const maxPatients = getMaxPatients();
  if (patients.length >= maxPatients) {
    result.push({
      id: 'max-patients-reached',
      level: 'WARNING',
      title: 'Maximum patient limit reached',
      description: `The simulation has reached the maximum of ${maxPatients} patients. No additional patients can be generated.`,
      validationContext: ctx,
    });
  }

  return result;
}
