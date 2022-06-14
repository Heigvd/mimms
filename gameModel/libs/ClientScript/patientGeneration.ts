import {Histogram, HistogramDistribution, IHistogram, NormalDistribution} from './distributionSampling'
import { BodyFactoryParam, Sex } from './HUMAn';
import { parseObjectDescriptor } from './WegasHelper';

/*ageHistogram : schemaProps.array({
	label: "Age Histogram",
	visible: () => true,
	required: true,
	//TODO config
	itemSchema: {
		min: { type: 'number', view: { label: 'Min', layout: "shortInline" } },
		max: { type: 'number', view: { label: 'Max', layout: "shortInline" } },
		cardinality: { type: 'number', view: { label: 'Ratio', layout: "shortInline" } },
	}
}),
heightMeanMen: { type: 'number', view: { label: 'Height Mean Men', layout: "shortInline" } },
heightStdDevMen: { type: 'number', view: { label: 'Height Standard Deviation Men', layout: "shortInline" } },

heightMeanWomen: { type: 'number', view: { label: 'Height Mean Women', layout: "shortInline" } },
heightStdDevWomen: { type: 'number', view: { label: 'Height Standard Deviation Women', layout: "shortInline" } },

BMImean: { type: 'number', view: { label: 'BMI Mean', layout: "shortInline" } },
BMIstdDev: { type: 'number', view: { label: 'BMI Standard Deviation', layout: "shortInline" } },

WomanManRatio: { type: 'number', view: { label: 'W/M Ratio', layout: "shortInline" } },
*/


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

export function generateOnePatient(): BodyFactoryParam {

	const raw = Variable.find(gameModel, 'generation_settings');
	const settings = parseObjectDescriptor<PatientDistributionSettings>(raw)['generationSettings'];

	//pick sex
	const sex : Sex = Math.random() > settings.WomanManRatio ? 'female' : 'male';

	let heightDist : NormalDistribution;
	switch(sex){
		case 'male':
			heightDist = new NormalDistribution(settings.heightMeanMen, settings.heightStdDevMen);
			break;
		case 'female':
			heightDist = new NormalDistribution(settings.heightMeanWomen, settings.heightStdDevWomen);
			break;
	}

	const height = heightDist.sample();

	const h = new Histogram(settings.ageHistogram);
	const age = new HistogramDistribution(h).sample();

	const bmi = new NormalDistribution(settings.BMImean, settings.BMIstdDev).sample();

	const p : BodyFactoryParam = {
		sex:sex,
		age: age,
		height_cm : height,
		bmi: bmi,
		lungDepth: 1,
	}

	return p;

}
