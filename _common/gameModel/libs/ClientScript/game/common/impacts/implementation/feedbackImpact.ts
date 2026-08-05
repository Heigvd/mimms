import { ImpactBase } from '../impact';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import {
  AddActionFeedbackLocalEvent,
  LocalEventBase,
  SourceType,
} from '../../localEvents/localEventBase';
import { actionLogger } from '../../../../tools/logger';

export interface FeedbackImpact extends ImpactBase {
  type: 'feedback';
  message: ITranslatableContent;
}

export function convertFeedbackImpact(
  state: Readonly<MainSimulationState>,
  impact: FeedbackImpact,
  source: SourceType
): LocalEventBase[] {
  if (source.type !== 'action') {
    // a feedback impact is only configurable inside a choice effect
    actionLogger.warn('a feedback impact can only be produced by an action', source);
    return [];
  }

  return [
    new AddActionFeedbackLocalEvent({
      parentEventId: state.getLastEventId(),
      source,
      simTimeStamp: state.getSimTime(),
      actionId: source.id,
      feedback: I18n.translate(impact.message),
    }),
  ];
}
