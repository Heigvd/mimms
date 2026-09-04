// EVALUATION_PRIORITY 0
/**
 * duration of one step in the simulation in seconds
 */
export const TimeSliceDuration = 60;

/**
 * duration of one minute
 */
export const OneMinuteDuration = 60;

/**
 * Helicopter / amubulance arrival retry interval
 */
export const FailedRessourceArrivalDelay = OneMinuteDuration * 5;

/**
 * ACS/MCS auto send by CASU delay
 */
export const ACSMCSAutoRequestDelay = OneMinuteDuration * 5;

/**
 * A resource that cannot work on its task goes back to get new orders as soon as the time slice ends
 */
export const NoIdleTimeAllowed = 0;

/**
 * Standard maximum idle before resource is unassigned
 */
export const StandardMaximumIdleTime = OneMinuteDuration * 5;

/**
 * Idle time for waiting task
 */
export const UnlimitedMaximumIdleTime = Number.MAX_SAFE_INTEGER;

/**
 * Trainer identifier
 */
export const TRAINER_NAME = 'Game Master';

/**
 * Slow down factor of patient evolution when it is in PMA (to simulate, it is being taken care of)
 */
export const PatientEvolutionPMATimeModifier = 0.5;

/**
 * Slow down factor of patient evolution when evacuated. (time stops, it is considered stabilized)
 */
export const PatientEvolutionEVACTimeModifier = 0;

/**
 * Pretriage report delay
 */
export const PretriageReportResponseDelay = 0;

/**
 * choice reference that means "all choices of a an action template"
 */
export const ANY_CHOICE = 'ANY_CHOICE';
