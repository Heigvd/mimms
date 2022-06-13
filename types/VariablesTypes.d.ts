
    
        declare const gameModel: SGameModel;
        declare const teams: STeam[];
        declare const self: SPlayer;
        declare const schemaProps: SchemaPropsDefinedType;

        interface VariableClasses {
          "texts": SListDescriptor;
"maintitle": SStaticTextDescriptor;
"staticTextDescriptor": SStaticTextDescriptor;
"env": SListDescriptor;
"atmP_mmHg": SNumberDescriptor;
"fiO2": SNumberDescriptor;
"duration_s": SNumberDescriptor;
"stepDuration": SNumberDescriptor;
"data": SListDescriptor;
"patients": SObjectDescriptor;
"pathologies": SObjectDescriptor;
"comp": SObjectDescriptor;
"scenario": SObjectDescriptor;
"autonomicNervousSystems": SListDescriptor;
"symsys": SObjectDescriptor;
"objectDescriptor": SObjectDescriptor;
"state": SListDescriptor;
"whoAmI": SStringDescriptor;
"currentScenario": SStringDescriptor;
"currentPatient": SStringDescriptor;
"variable": SListDescriptor;
"vasoconstriction": SBooleanDescriptor;
"coagulation": SBooleanDescriptor;
"setup": SWhQuestionDescriptor;
"vasoconstrictionLungs": SBooleanDescriptor;
"ansModel": SStringDescriptor;
"time_management": SListDescriptor;
"running": SBooleanDescriptor;
"inSim_ref": SNumberDescriptor;
"epoch_ref": SNumberDescriptor;
"events": SInboxDescriptor;
"outputs": SListDescriptor;
"output": SObjectDescriptor;
"outputCardio": SObjectDescriptor;
"outputOther": SObjectDescriptor;
"lastEventId": SNumberDescriptor;
"communication": SListDescriptor;
"chatContent": SStringDescriptor;
"lastMsg": SStringDescriptor;
"lastRadioMsg": SStringDescriptor;
"lastPhoneMsg": SStringDescriptor;
"lastChannel": SStringDescriptor;
"lastRadioId": SStringDescriptor;
"communicationType": SStringDescriptor;
"fromPhone": SStringDescriptor;
"showPatientModal": SBooleanDescriptor;
"recipientPhoneId": SNumberDescriptor;
"tagSystem": SStringDescriptor;
        }

        interface VariableIds {
          24040351: SListDescriptor;
24040354: SStaticTextDescriptor;
24040358: SStaticTextDescriptor;
24040362: SListDescriptor;
24040365: SNumberDescriptor;
24040368: SNumberDescriptor;
24040371: SNumberDescriptor;
24040374: SNumberDescriptor;
24040377: SListDescriptor;
24040380: SObjectDescriptor;
24040383: SObjectDescriptor;
24040386: SObjectDescriptor;
24040389: SObjectDescriptor;
24040392: SListDescriptor;
24040395: SObjectDescriptor;
24040398: SObjectDescriptor;
24040401: SListDescriptor;
24040404: SStringDescriptor;
24040408: SStringDescriptor;
24040412: SStringDescriptor;
24040423: SListDescriptor;
24040426: SBooleanDescriptor;
24040429: SBooleanDescriptor;
24040432: SWhQuestionDescriptor;
24040437: SBooleanDescriptor;
24040440: SStringDescriptor;
24040444: SListDescriptor;
24040447: SBooleanDescriptor;
24040450: SNumberDescriptor;
24040453: SNumberDescriptor;
24040456: SInboxDescriptor;
24040459: SListDescriptor;
24040462: SObjectDescriptor;
24040465: SObjectDescriptor;
24040468: SObjectDescriptor;
24040471: SNumberDescriptor;
24040605: SListDescriptor;
24040610: SStringDescriptor;
24040615: SStringDescriptor;
24040620: SStringDescriptor;
24040625: SStringDescriptor;
24040630: SStringDescriptor;
24040635: SStringDescriptor;
24041074: SStringDescriptor;
24041085: SStringDescriptor;
24041344: SBooleanDescriptor;
24046467: SNumberDescriptor;
24047301: SStringDescriptor;
        }

        type FindFN = <T extends keyof VariableClasses>(
          gameModel: SGameModel,
          name: T
        ) => VariableClasses[T]

        declare class Variable {
          static find: FindFN;
          static select: <T extends SVariableDescriptor>(
            _gm: unknown,
            id: number,
          ) => T | undefined;
          static getItems: <T = SVariableDescriptor>(
            itemsIds: number[],
          ) => Readonly<T[]>;
        }

        type CurrentLanguages = "EN";
        type View = 'Editor' | 'Instance' | 'Export' | 'Public';
        declare const API_VIEW : View;
        declare const CurrentGame : IGame;
        interface EditorClass extends GlobalEditorClass {
          setLanguage: (lang: { code: SGameModelLanguage['code'] } | CurrentLanguages) => void;
        }
        declare const Editor: EditorClass & {
          setPageLoaders: (name: unknown, pageId: IScript) => void;
        };

        interface ClientMethodList {
          
        }

        interface ClientMethodClass extends GlobalClientMethodClass {
          /**
           * @deprecated use import
           */
          getMethod: <T extends keyof ClientMethodList>(name : T) => ClientMethodList[T];
        }
        /**
         * @deprecated
         */
        declare const ClientMethods : ClientMethodClass;

        type GlobalSchemas =
          dataSchema;

        interface SchemaClass extends GlobalSchemaClass {
          removeSchema: (name: GlobalSchemas) => void;
        }
        declare const Schemas : SchemaClass;

        type GlobalClasses =
        never;
        interface ClassesClass extends GlobalClassesClass{
          removeClass: (className: GlobalClasses) => void;
        }
        declare const Classes : ClassesClass;

        declare const ServerMethods : GlobalServerMethodClass;

        declare const Popups : GlobalPopupClass;

        declare const WegasEvents : WegasEventClass;

        declare const I18n : GlobalI18nClass;

        declare const Context : {
          [id:string]:any;
        }

        declare const APIMethods : APIMethodsClass;

        declare const Helpers : GlobalHelpersClass;

        declare const Roles : RolesMehtods;

        declare const wlog : (...args: unknown[])=>void;
        

        

  