import {Histogram, HistogramDistribution, IHistogram, NormalDistribution} from './distributionSampling'
import { BodyFactoryParam, Sex } from './HUMAn';
import { afflictPathology, pickRandom } from './pathology';
import { getPathologies } from './registries';
import { ScriptedPathologyPayload } from './the_world';
import { parseObjectDescriptor } from './WegasHelper';


export interface PatientDistributionSettings {

	ageHistogram: IHistogram,

	heightMeanMen: number,
	heightStdDevMen: number,

	heightMeanWomen: number,
	heightStdDevWomen: number,

	BMImean: number,
	BMIstdDev: number,

	WomanManRatio: number,
}
 
export class HumanGenerator {

	settings : PatientDistributionSettings;
	public readonly heightDistributionMen: NormalDistribution;
	public readonly heightDistributionWomen: NormalDistribution;
	public readonly bmiDistribution: NormalDistribution;
	
	public readonly ageDistribution: HistogramDistribution;

	constructor(){

		const raw = Variable.find(gameModel, 'generation_settings');
		const s = parseObjectDescriptor<PatientDistributionSettings>(raw)['generationSettings'];
		this.settings = s;

		this.heightDistributionMen = new NormalDistribution(s.heightMeanMen, s.heightStdDevMen);
		this.heightDistributionWomen = new NormalDistribution(s.heightMeanWomen, s.heightStdDevWomen);

		const h = new Histogram(s.ageHistogram);
		this.ageDistribution = new HistogramDistribution(h);
		this.bmiDistribution = new NormalDistribution(s.BMImean, s.BMIstdDev);
	}

	public generateOneHuman(sex? : Sex): BodyFactoryParam {

		//pick sex if undefined
		if(!sex){
			sex = Math.random() > this.settings.WomanManRatio ? 'female' : 'male';
		}

		const heightDist : NormalDistribution = sex === 'female' ? this.heightDistributionWomen : this.heightDistributionMen;
		const height = Math.floor(heightDist.sample());

		const age = Math.floor(this.ageDistribution.sample());
		const bmi = Math.round((this.bmiDistribution.sample() + Number.EPSILON) * 100) / 100;

		const h : BodyFactoryParam = {
			sex: sex,
			age: age,
			height_cm : height,
			bmi: bmi,
			lungDepth: 1,
		}

		return h;
	}

	// TODO gravity factor and more configuration and avoid apply twice with the same parameters
	public addPathologies(human : BodyFactoryParam, n: number): BodyFactoryParam{

		if(!human.scriptedPathologies){
			human.scriptedPathologies = [];
		}
		
		const pList = getPathologies();
		for(let i = 0; i < n; i++){

			const def = pickRandom(pList);
			if(!def){
				throw(new Error('No pathology can be afflicted'));
			}else{
				const affPathology = afflictPathology(def.value);
				const p : ScriptedPathologyPayload= {
					time: 10, // TODO
					payload: {
						type : 'HumanPathology',
						targetType : 'Human',
						targetId : '',
						emitterPlayerId: '',
						emitterCharacterId: '',
						...affPathology,
					}
				}
				human.scriptedPathologies.push(p);
			}
		}

		return human;
	}
	
}

export let testPatients: BodyFactoryParam[] = [];

export function setTestPatients(newPatients : BodyFactoryParam[]){
	testPatients = newPatients;
}

export const getHumanGenerator = (() => {
	let pg : HumanGenerator | undefined = undefined;

	return () => {
		if(!pg){
			pg = new HumanGenerator();
		}
		return pg;
	}
})();

export function generateOnePatient(sex? : Sex, nPathologies?: number){
	const h = getHumanGenerator().generateOneHuman(sex);
	return getHumanGenerator().addPathologies(h, nPathologies || 0);
}

export function generateTestPatients(forceNew : boolean){

	if(forceNew){
		testPatients = [];
	}
	if(testPatients.length > 0)
		return;
	
	for(let i = 0; i < 10000; i++){
		testPatients.push(getHumanGenerator().generateOneHuman());
	}
}

export function generateTestPoints(min: number, max: number, attr: string){
	generateTestPatients(false);
	wlog('Generating points for ', attr, min, max);
	const size = max - min;
	const counts = new Array(size).fill(0);
	for(let i = 0; i < testPatients.length; i++){
		const v = Math.floor((testPatients[i] as any)[attr]);
		counts[v - min]++;
	}

	const points = counts.map((v,i) => {return {x : min + i, y : v/testPatients.length}}, []);
	return [{label : attr, points: points}];
}

export function testPatientsHeight(){
	const min = Math.floor(getHumanGenerator().heightDistributionWomen.min());
	const max = Math.ceil(getHumanGenerator().heightDistributionMen.max());
	return generateTestPoints(min,max, 'height_cm');
}

export function testPatientBmi(){
	const d = getHumanGenerator().bmiDistribution;
	return generateTestPoints(Math.floor(d.min()), Math.ceil(d.max()), 'bmi');
}

export function testPatientAge(){
	const d = getHumanGenerator().ageDistribution;
	return generateTestPoints(Math.floor(d.min()), Math.ceil(d.max()), 'age');
}
