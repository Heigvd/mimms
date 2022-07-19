export interface Point {
	x: number;
	y: number;
}

export function sub(a: Point, b: Point): Point{
	return {x: a.x - b.x, y: a.y - b.y};
}

export function add(a: Point, b: Point): Point{
	return {x: a.x + b.x, y: a.y + b.y};
}

export function equalsStrict(a : Point, b: Point): boolean{
	return a.x === b.x && a.y === b.y;
}

export function equals(a: Point, b: Point, epsilon: number = 0.00001): boolean{
  return (Math.abs(a.x -b.x) < epsilon && Math.abs(a.y - b.y) < epsilon)
}

export function mul(a: Point, multiplicand: number): Point {
	return {x: a.x * multiplicand, y: a.y * multiplicand};
}

export function dot(a: Point, b: Point): number {
	return a.x * b.x + a.y * b.y;
}

export function lengthSquared(a: Point): number {
	return dot(a, a);
}

export function length(a: Point): number {
  return Math.sqrt(lengthSquared(a));
}

export function proj(a: Point, b: Point): Point {
	const abProduct = dot(a, b);
	const bbProduct = dot(b, b);
	if (bbProduct > 0) {
		const k = abProduct / bbProduct;
		return mul(b, k);
	} else {
		// AB is not a segment but a point (a === b)
		return a;
	}
}