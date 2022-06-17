/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */

import { logger } from "./logger";

export function checkUnreachable(x: never): void {
  throw new Error("Unreachable code: " + (x as unknown));
}

/**
 * Convert kPa to mmHg
 */
export function convertKiloPascalToTorr(x: number): number {
  return x * 760 / 101.325
}

/**
 * Convert mmHg to kPa
 */
export function convertTorrToKPa(x: number): number {
  return x * 101.325 / 760;
}

interface Bounds {
  min?: number;
  max?: number;
}


export interface Range {
	min: number;
	max?: number;
}


export interface Point {
	x: number;
	y: number;
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


export function interpolate(x: number, points: Point[], defaultValue: number = 0) : number  {
	//const points = pointsArg.sort((a, b) => a.x - b.x);

  	logger.info("Interpolate: ", {x, points});

	if (points.length === 1) {
		logger.info("One point: ", points[0]!.y)
		return points[0]!.y;
	} else if (points.length > 1) {
		const index = points.findIndex(item => item.x > x);

		if (index == 0) {
			const y =  points[0]!.y;
			logger.info("y < first point: ", y);
			return y;
		} else if (index === -1) {
			const y = points.slice(-1)[0]!.y;
			logger.info("x > last point: ", y)
			return y;
		} else {

			// linear interpolation
			const a = points[index - 1]!;
			const b = points[index]!;
			const deltaX = b.x - a.x;
			const deltaY = b.y - a.y;
			const dx = x - a.x;
			const y = a.y + ( dx * deltaY) / deltaX
			logger.info("interpolate : ", {a, b, result: y})
			return y;
		}
	} else {
		return defaultValue;
	}
}

export function pickRandom<T>(list: T[]): T | undefined {
	return list[Math.floor(Math.random() * list.length)];
}

export function getRandomValue(range: Range | undefined, integer: boolean = false): number | undefined {
	if (range == null) {
		return undefined;
	}

	if (range.max == null) {
		return range.min;
	} else {
		const r = range.max - range.min;
		const rnd = range.min + Math.random() * r;
		if (integer) {
			return Math.floor(rnd);
		} else {
			return rnd;
		}
	}
}

export function intersection<T>(...lists: T[][]) {
	const [firstList, ...others] = lists;
	if (firstList == null) {
		throw "No lists!";
	}

	let result = firstList;

	for (const items of others) {
		result = result.filter(block => items.includes(block));
	}

	return result;
}

