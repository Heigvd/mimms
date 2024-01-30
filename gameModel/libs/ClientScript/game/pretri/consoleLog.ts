import { MeasureMetric } from '../../HUMAn/registry/acts';

interface BaseLog {
	time: number;
	emitterCharacterId: string;
}

type MessageLog = BaseLog & {
	type: 'MessageLog';
	message: string;
};

export type MeasureLog = BaseLog & {
	type: 'MeasureLog';
	/**
	 * Key: metric name; value: measures value
	 */
	metrics: MeasureMetric[];
};

export type TreatmentLog = BaseLog & {
	type: 'TreatmentLog';
	message: string;
};

export type ConsoleLog = MessageLog | MeasureLog | TreatmentLog;
