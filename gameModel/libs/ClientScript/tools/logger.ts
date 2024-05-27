export const logger = Helpers.getLogger('human');
export const visitorLogger = Helpers.getLogger('human.visitor');
export const patchLogger = Helpers.getLogger('human.patch');
export const bloodLogger = Helpers.getLogger('human.blood');
export const vitalsLogger = Helpers.getLogger('human.vitals');
export const calcLogger = Helpers.getLogger('human.calculus');
export const compLogger = Helpers.getLogger('human.compensation');
export const respLogger = Helpers.getLogger('human.respiration');
export const registryLogger = Helpers.getLogger('human.registry');
export const worldLogger = Helpers.getLogger('human.world');
export const pathFindingLogger = Helpers.getLogger('human.world.pathfinding');
export const layerDataLogger = Helpers.getLogger('human.map.layerdata');
export const inventoryLogger = Helpers.getLogger('human.world.inventory');
export const delayedLogger = Helpers.getLogger('human.world.delay');
export const drillLogger = Helpers.getLogger('human.drill');
export const drillPresetLogger = Helpers.getLogger('human.drill.preset');
export const patientGenerationLogger = Helpers.getLogger('human.patient.generation');
export const translationLogger = Helpers.getLogger('translation');
export const exportLogger = Helpers.getLogger('export');
export const extraLogger = Helpers.getLogger('human.extra');
export const preTriageLogger = Helpers.getLogger('pretriage');
export const localEventManagerLogger = Helpers.getLogger('local.event.manager');
export const mainSimInterfaceLogger = Helpers.getLogger('mainSim.interface');
export const mainSimMapLogger = Helpers.getLogger('mainSim.map');
localEventManagerLogger.setLevel('INFO');
export const mainSimLogger = Helpers.getLogger('main.simulation.logic');
export const mainSimStateLogger = Helpers.getLogger('main.simulation.state');
export const taskLogger = Helpers.getLogger('task');
export const resourceLogger = Helpers.getLogger('resource');
export const debugFacadeLogger = Helpers.getLogger('debug');
mainSimLogger.setLevel('INFO');
mainSimStateLogger.setLevel('DEBUG');
taskLogger.setLevel('DEBUG');
resourceLogger.setLevel('DEBUG');
