/**
 * Event from context helper
 */

// interface Context {
// 	patientConsole: {
// 		state: {
// 			logs: string[],
// 			currentPatient: string,
// 			selectedItem: string,
// 			selectedAction: string,
// 			blockRequired: boolean,
// 			selectedBlock: string,
// 		}
// 	}
// };

var PatientActionFromContext = ((function () {
	return {
		doItemAction: function () {
			var humanId = Context.patientConsole.state.currentPatient;
			var item = { 
				itemId: Context.patientConsole.state.selectedItem,
				actionId: Context.patientConsole.state.selectedAction,
			};
			var blocks = [Context.patientConsole.state.selectedBlock];
			print(Context);
			EventManager.doItemAction(humanId, item, blocks);
		},
		doAct: function() {
			print("Context:" + JSON.stringify(Context));
		}
	};
})());