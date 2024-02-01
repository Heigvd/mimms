import { LOCATION_ENUM } from './simulationState/locationState';

/**
 * Represents the time in the simulation in seconds
 */
export type SimTime = number
/**
 * Represent a duration in seconds
 */
export type SimDuration = number

export type TranslationKey = string;

export type Position = PointLikeObject;

export type LocalEventId = number;

export type GlobalEventId = number;

export type TemplateRef = string;

export type ActorId = number;

export type TemplateId = number;

export type ActionTemplateId = number;

export type TaskId = number;

export type ResourceId = number;

export type PatientId = string;

export type Location = LOCATION_ENUM;
