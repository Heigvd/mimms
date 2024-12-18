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
export const PretriageReportResponseDelay = OneMinuteDuration * 2;

/**
 * in minutes
 */
export const situationUpdateDurations: number[] = [3, 5, 10];
