interface IDistribution {
	sample(): number;
	/**
	 * Returns the minimum possible value
	 */
	min(): number;
	/**
	 * Returns the maximum possible value
	 */
	max(): number;
}

interface Interval {
	min: number;
	max: number;
}

export interface IHistogramEntry {
	cardinality : number;
	lowerBound: number;
	upperBound: number;
}

export type IHistogram = IHistogramEntry[]

export class Histogram {

	public readonly histogram : IHistogram;

	constructor(histogram : IHistogram){
		this.histogram = histogram;
		if(! this.sanityCheck()){
			throw new Error('Invalid values for histogram');
		}
	}

	private sanityCheck(): boolean {

		if(this.histogram.length < 1){
			return false;
		}

		for(let k = 0; k < this.histogram.length; k++)
		{
			const e = this.histogram[k];
			if(e.lowerBound >= e.upperBound || e.cardinality <= 0){ // non consistent interval
				return false;
			}
		}

		for(let k = 0; k < this.histogram.length - 1; k++){

			const i = this.histogram[k];
			const i2 = this.histogram[k+1];
			if(i.upperBound > i2.lowerBound){ //overlap
				return false;
			}
		}

		return true;
	}

}


export class UniformDistribution implements IDistribution {

	private readonly minValue: number;
	private readonly maxValue: number;

	constructor(min: number, max: number){
		this.minValue = min;
		this.maxValue = max;
	}
	min(): number {
		return this.minValue;
	}
	max(): number {
		return this.maxValue;
	}

	static fromInterval(interval: Interval): UniformDistribution{
		return new UniformDistribution(interval.min, interval.max);
	}

	sample(): number {
		return Math.random() * (this.max() - this.min()) + this.min();
	}

}

export class NormalDistribution implements IDistribution {

	private readonly mean : number;
	private readonly stdDev: number;
	private readonly minValue: number;
	private readonly maxValue: number;

	constructor(mean: number, stdDeviation: number, maxDeviation?: number){
		this.mean = mean;
		this.stdDev = stdDeviation;
		//default to 3*maxDeviation (99.7% of values will fall in this interval anyway)
		const maxDev = maxDeviation ? maxDeviation : 3*stdDeviation;
		this.minValue = mean - maxDev;
		this.maxValue = mean + maxDev;
	}

	min(): number {
		return this.minValue;
	}
	max(): number {
		return this.maxValue;
	}

	sample(): number {
		let s: number;
		do{
			s = this.sampleBoxMuller();
		}while(s > this.maxValue || s < this.minValue);
		return s;
	}

	// https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
	private sampleBoxMuller() {
		const u = 1 - Math.random(); //Converting [0,1) to (0,1]
		const v = Math.random();
		const mag = this.stdDev * Math.sqrt(-2.0 * Math.log(u));
		return this.mean + mag * Math.cos( 2.0 * Math.PI * v );
	}

}


/**
 * Multiple uniform distributions
 */
export class HistogramDistribution implements IDistribution {

	distributionRanges : UniformDistribution[] = [];
	cumulativeProbs : number[] = [];
	
	constructor(histogram : Histogram){

		let total = 0;
		const h = histogram.histogram;

		for(let i = 0; i < h.length; i++){
			total += h[i].cardinality;
			this.cumulativeProbs.push(total);
		}

		for(let i = 0; i < h.length; i++){
			this.cumulativeProbs[i] /= total; // to cumulative probabilities
			this.distributionRanges.push(new UniformDistribution(h[i].lowerBound, h[i].upperBound));
		}
	
	}
	min(): number {
		return this.distributionRanges[0].min();
	}
	max(): number {
		return this.distributionRanges[this.distributionRanges.length-1].max();
	}

	private findSmallestGreaterIndex(rand : number): number {
		let i = 0;
		while(rand > this.cumulativeProbs[i] && i < this.cumulativeProbs.length){
			i++;
		}
		return i;
	}

	sample(): number {
		const rangeIdx = this.findSmallestGreaterIndex(Math.random());
		return this.distributionRanges[rangeIdx].sample();
	}

}

type GraphData = {label: string, points:{x:number, y:number}[], fill?: string, allowDrag?: boolean}[];

function testDistribution(label: string, d : IDistribution, samples : number, interval: Interval): GraphData{
	
	const size = interval.max - interval.min;
	const counts = new Array(size).fill(0);
	for(let i = 0; i < samples; i++){
		const s = Math.floor(d.sample());
		if((s-interval.min) < size){
			counts[s-interval.min]++;
		}
	}

	const points = counts.map((v,i) => {return {x : interval.min + i, y : v}}, []);
	return [{label : label, points: points}];
}

export let uniformSample : GraphData;
export let normalSample : GraphData;
export let histogramSample : GraphData;

export function regenerateSamples(){
	wlog('resampling...')
	const histogramDescr : IHistogram= 
	[
		{cardinality : 10, lowerBound: 10, upperBound: 20},
		{cardinality : 20 ,lowerBound: 20, upperBound: 30},
		{cardinality : 50, lowerBound: 30, upperBound: 40},
		{cardinality : 30, lowerBound: 50, upperBound: 60},
	];
	const histogram = new Histogram(histogramDescr);

	uniformSample = testDistribution('uniform', new UniformDistribution(10, 20), 10000, {min: 10, max: 20});
	normalSample = testDistribution('normal', new NormalDistribution(30, 5, 30), 50000, {min: 0, max: 60});
	histogramSample = testDistribution('histogram', new HistogramDistribution(histogram), 10000, {min:0, max: 70});
}







