/**
 * Event from context helper
 */

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