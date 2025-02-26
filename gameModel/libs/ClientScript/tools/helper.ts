/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */

import { logger } from './logger';
import { Point } from '../map/point2D';

export function checkUnreachable(x: never): void {
  throw new Error('Unreachable code: ' + (x as unknown));
}

///**
// * Convert kPa to mmHg
// */
//export function convertKiloPascalToTorr(x: number): number {
//  return x * 760 / 101.325
//}
//
///**
// * Convert mmHg to kPa
// */
//export function convertTorrToKPa(x: number): number {
//  return x * 101.325 / 760;
//}

interface Bounds {
  min?: number;
  max?: number;
}

export interface Range {
  min: number;
  max: number;
}

export function normalize(x: number, bounds?: Bounds): number {
  if (bounds != null) {
    const { min, max } = bounds;
    if (min != null && max != null) {
      return Math.max(Math.min(x, max), min);
    } else if (min != null) {
      return Math.max(x, min);
    } else if (max != null) {
      return Math.min(x, max);
    }
  }

  return x;
}

export function add(x: number, delta: number, bounds?: Bounds): number {
  return normalize(x + delta, bounds);
}

/**
 * @param x the value on the x axis
 * @param points a list of 2D points sorted in ascending order by their x values.
 * Connecting these points with lines implicitely describes a 2D graph
 * @return the y value corresponding to the intersection of the 2D graph and a vertical line going through x
 */
export function interpolate(x: number, points: Point[], defaultValue: number = 0): number {
  logger.info('Interpolate: ', { x, points });

  if (points.length === 1) {
    logger.info('One point: ', points[0]!.y);
    return points[0]!.y;
  } else if (points.length > 1) {
    const index = points.findIndex(item => item.x > x);

    if (index == 0) {
      const y = points[0]!.y;
      logger.info('y < first point: ', y);
      return y;
    } else if (index === -1) {
      const y = points.slice(-1)[0]!.y;
      logger.info('x > last point: ', y);
      return y;
    } else {
      // linear interpolation
      const a = points[index - 1]!;
      const b = points[index]!;
      const deltaX = b.x - a.x;
      const deltaY = b.y - a.y;
      const dx = x - a.x;
      if (deltaX === 0) {
        logger.warn('!! 2 points have identical x values : ', { a, b, result: a.y });
        return a.y;
      }
      const y = a.y + (dx * deltaY) / deltaX;
      logger.info('interpolate : ', { a, b, result: y });
      return y;
    }
  } else {
    return defaultValue;
  }
}

/**
 * TODO move to math.ts
 */
export function pickRandom<T>(list: T[]): T | undefined {
  return list[Math.floor(Math.random() * list.length)];
}

export function getRandomValue<T extends Range | undefined>(
  range: T,
  integer: boolean = false
): T extends Range ? number : undefined {
  if (range == null) {
    return undefined as any;
  }

  if (range.max == range.min) {
    return range.min as any;
  } else {
    const r = range.max - range.min;
    const rnd = range.min + Math.random() * r;
    if (integer) {
      return Math.floor(rnd) as any;
    } else {
      return rnd as any;
    }
  }
}

/**
 * Extract the elements that are present in all provided sets
 */
export function intersection<T>(...lists: T[][]) {
  const [firstList, ...others] = lists;
  if (firstList == null) {
    throw 'No lists!';
  }

  let result = firstList;

  for (const items of others) {
    result = result.filter(block => items.includes(block));
  }

  return result;
}

/**
 * return the first set minus other sets
 */
export function substraction<T>(...lists: Readonly<T[]>[]): T[] {
  const [firstList, ...others] = lists;
  if (firstList == null) {
    throw new Error('No lists!');
  }

  let result = [...firstList];

  for (const items of others) {
    result = result.filter(block => !items.includes(block));
  }

  return result;
}

/**
 * Robust to undefined string comparison
 */
export function compare(a?: string, b?: string) {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return 1;
  }
  return a.localeCompare(b);
}

function toHourMinSec(seconds: number): [number, number, number] {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;

  return [hours, minutes, sec];
}

export function toHourMinutesSeconds(
  seconds: number,
  hoursSuffix = 'h',
  minuteSuffix = "'",
  secondsSuffix = "''",
  ignoreIfZero = false
): string {
  const [hours, minutes, sec] = toHourMinSec(seconds);
  let output = '';

  if (hours > 0) {
    output += hours + hoursSuffix;
  }
  if (hours == 0 && (minutes > 0 || !ignoreIfZero)) {
    output += minutes + minuteSuffix;
  }
  if (hours == 0 && minutes == 0 && (sec > 0 || !ignoreIfZero)) {
    output += sec + secondsSuffix;
  }
  return output;
}

/**
 * HH:MM:SS ISO 8601
 */
export function toHoursMinutesSecondsIso(seconds: number): string {
  const [hours, minutes, sec] = toHourMinSec(seconds);
  let output = '';
  output += (hours < 10 ? '0' : '') + hours;
  output += ':' + (minutes < 10 ? '0' : '') + minutes;
  output += ':' + (sec < 10 ? '0' : '') + sec;

  return output;
}

/**
 * Date to HH:mm(:ss) format
 */
export function getTimeString(date: Date, includeSeconds: boolean = false): string {
  const options: any = { hour12: false, hour: '2-digit', minute: '2-digit' };
  if (includeSeconds) {
    options.second = '2-digits';
  }
  return date.toLocaleTimeString([], options);
}

// better typing for Object decomposition functions
export const entries = Object.entries as <T>(obj: T) => Array<[keyof T, T[keyof T]]>;
export const keys = Object.keys as <T>(obj: T) => Array<keyof T>;
export const values = Object.values as <T>(obj: T) => Array<T[keyof T]>;

export function getRawString(value: string) {
  return value;
}

export function getLetterRepresentationOfIndex(index: number): string {
  return (index + 10).toString(36).toUpperCase();
}

/**
 * Fake async. Wraps a function in a promise and delays its execution to the next event loop.
 */
export function makeAsync<T, C>(func: (ctx: C) => T, ctx: C, delay: number = 1): Promise<T> {
  const context = ctx;
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        const result: T = func(context);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, delay);
  });
}
