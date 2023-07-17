import { Point } from "../../map/point2D";

/**
 * Represents the time in the simulation in seconds
 */
export type SimTime = number
/**
 * Represent a duration in seconds
 */
export type SimDuration = number

/**
 * duration of one step in the simulation in seconds
 */
export const TimeSliceDuration = 60;

export type TranslationKey = string;

export type Position = Point;