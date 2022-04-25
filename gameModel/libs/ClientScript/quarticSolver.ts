// https://www.scopulus.co.uk/tools/quarticequationsolver.htm

/* This script and many more are available free online at
The JavaScript Source!! http://www.javascriptsource.com
Created by: Brian Kieffer | http://www.freewebs.com/brianjs/ */

function calcmult(a2: number, b2: number, c2: number, d2: number, e2: number): number {
	var real = a2 * c2 - b2 * d2
	var img = b2 * c2 + a2 * d2

	if (e2 == 0) {
		return real
	} else {
		return img
	}
}

interface Solution {
	v: number;
	i?: number;
}

export function computePaO2(hb: number, CaO2: number): number {
	if (CaO2 <= 0.1) {
		return 0;
	}

	const solutions: Solution[] = []

	const initialAq = 0.03;
	const initialBq = 1.34 * hb - CaO2;
	const initialDq = 23400 * 0.03 - 150 * CaO2 + 1.34 * 150 * hb;
	const initialEq = -23400 * CaO2;

	// Divide Equation by the X^4 Coefficent to make equation in the form of X^4 + AX^3 + BX^2 + CX + D
	// Extract X^3 Coefficent
	const bq = initialBq / initialAq;
	// Extract X^2 Coefficent
	const cq = 150;  // ie initial c = 150 * 0.03
	// Extract X Coefficent
	const dq = initialDq / initialAq;
	// Extract Constant
	const eq = initialEq / initialAq;


	const f2 = cq - (3 * bq * bq / 8);
	const g2 = dq + (bq * bq * bq / 8) - (bq * 75);
	const h2 = eq - (3 * bq * bq * bq * bq / 256) + (bq * bq * (150 / 16)) - (bq * dq / 4);
	// const a = 1;
	const b = f2 / 2
	const c = (f2 * f2 - (4 * h2)) / 16
	const d = -1 * ((g2 * g2) / 64)

	if (b == 0 && c == 0 && d == 0) {
		// Perfect Quartic Varible
		return -bq / 4;
	}

	// Cubic routine starts here.....
	const f = c - (b * b) / 3;
	const g = (((2 * b * b * b)) - ((9 * b * c)) + ((27 * d))) / 27
	const h = ((g * g) / 4) + ((f * f * f) / 27);
	const z = 1 / 3;

	const sqrtH = Math.sqrt(h)

	const R = sqrtH - (g / 2);
	const S = (R < 0)
		? -1 * (Math.pow((-1 * R), z))
		: Math.pow(R, z);
	;
	const T = -sqrtH - (g / 2);
	const U = (T < 0)
		? -1 * (Math.pow((-1 * T), z))
		: Math.pow(T, z);

	const xtwoterm = (-1 * (S + U) / 2) - (b / 3);
	const ipart = ((S - U) * Math.sqrt(3)) / 2;
	// ....and ends here.

	// Return to solving the Quartic.

	if (ipart != 0) {
		/*const isquareroot = (a1: number, b1: number, n1: number) => {
			var y = Math.sqrt((a1 * a1) + (b1 * b1));
			var y1 = Math.sqrt((y - a1) / 2);

			if (n1 == 0) {
				return b1 / (2 * y1);
			} else {
				return y1
			}
		}


		const p2 = isquareroot(xtwoterm, ipart, 0)
		const p2ipart = isquareroot(xtwoterm, ipart, 1)
*/
		var y = Math.sqrt((xtwoterm * xtwoterm) + (ipart * ipart));

		const p2ipart = Math.sqrt((y - xtwoterm) / 2);		
		const p2 = ipart / (2 * p2ipart);

		//wlog("Compute: ",{ p2, p2ipart});

		const q = -p2;
		const qipart = p2ipart;

		const mult = calcmult(p2, p2ipart, q, qipart, 0)
		const r = -g2 / (8 * mult)
		const s = initialBq / (4 * initialAq)

		solutions.push({
			v: p2 + q + r - s,
			i: p2ipart + qipart
		});

		solutions.push({
			v: p2 - q - r - s,
			i: p2ipart - qipart
		});

		solutions.push({
			v: -p2 + q - r - s,
			i: -p2ipart + qipart
		});

		solutions.push({
			v: -p2 - q + r - s,
			i: -p2ipart - qipart
		});
	}
	//wlog("Solutions: ", solutions);

	return solutions.reduce((max, current) => {
		//wlog("Find positive max");
		if (current.i === 0) {
			//wlog("Real number", max, current.v);
			return Math.max(max, current.v);
		}
		return max;
	}, 0);
}