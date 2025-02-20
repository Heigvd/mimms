

        declare namespace console {
            function time(label: string, ...data: unknown[]);
            function timeLog(label: string, ...data: unknown[]);
            function timeEnd(label: string, ...data: unknown[]);
        };

        declare const atob : (string) => string;
        declare const btoa : (string) => string;

        declare const setTimeout : (callback: () => void, delay: number) => number;
        declare const clearTimeout : (id: number) => void;
        declare const setInterval : (callback: () => void, delay: number) => number;
        declare const clearInterval : (id: number) => void;

        declare namespace performance {
          function now();
        }

        declare const gameModel: SGameModel;
        declare const teams: STeam[];
        declare const self: SPlayer;
        declare const currentUserName: string;
        declare const schemaProps: SchemaPropsDefinedType;

        interface VariableClasses {
          "texts": SListDescriptor;
          "maintitle": SStaticTextDescriptor;
          "staticTextDescriptor": SStaticTextDescriptor;

          'lickertPages': SListDescriptor;
          'lickertWelcome': SStaticTextDescriptor;
          'lickertLegend': SStaticTextDescriptor;
          'notCompletedYet': SStaticTextDescriptor;
          "congrats": SStaticTextDescriptor;
          "byebye": SStaticTextDescriptor;

          "demographics_zFZxWK": SListDescriptor;
          "donneesDemographiques": SStaticTextDescriptor;

          'env': SListDescriptor;
          'atmP_mmHg': SNumberDescriptor;
          'fiO2': SNumberDescriptor;
          'duration_s': SNumberDescriptor;
          'stepDuration': SNumberDescriptor;

          'data': SListDescriptor;
          'patients': SObjectDescriptor;
          'characters': SObjectDescriptor;
          'bagsDefinitions': SObjectDescriptor;
          'situationsDefinitions': SObjectDescriptor;
          'skillsDefinitions': SObjectDescriptor;
          'drill_Presets': SObjectDescriptor;
          "actionsDurations": SObjectDescriptor;
          "containers_config": SObjectDescriptor;

          "state": SListDescriptor;
          "whoAmI": SStringDescriptor;
          "currentPatient": SStringDescriptor;
          "drillStatus": SObjectDescriptor;
          "realLifeRole": SStringDescriptor;
          "scenarioRevived": SBooleanDescriptor;

          'variable': SListDescriptor;
          'vasoconstriction': SBooleanDescriptor;
          'coagulation': SBooleanDescriptor;
          'vasoconstrictionLungs': SBooleanDescriptor;
          'tagSystem': SStringDescriptor;
          'drillType': SStringDescriptor;

          'drill': SListDescriptor;
          'bagType': SStringDescriptor;
          'defaultProfile': SStringDescriptor;
          'patientSet': SStringDescriptor;

          'finished_custom_text': STextDescriptor;
          'multiplayerMode': SStringDescriptor;
          "examMode": SBooleanDescriptor;
          "collectDemographicData": SBooleanDescriptor;

          'time_management': SListDescriptor;

          'team': SListDescriptor;
          'inSim_ref': SNumberDescriptor;
          'epoch_ref': SNumberDescriptor;
          'running': SBooleanDescriptor;
          'keepalive': SNumberDescriptor;
          'upTo_inSim_ref': SNumberDescriptor;
          'replay': SBooleanDescriptor;

          'global': SListDescriptor;
          'running_global': SBooleanDescriptor;

          'outputs': SListDescriptor;

          "demographics": SListDescriptor;
          "demographicsValidated": SBooleanDescriptor;

          "data_9mM5A5": SListDescriptor;
          'gender': SStringDescriptor;
          'age': SNumberDescriptor;
          'fmh': SBooleanDescriptor;

          "specialisation": SListDescriptor;
          'fmhInternalMedicine': SBooleanDescriptor;
          'fmhAnesthesiology': SBooleanDescriptor;
          'fmhIntensiveMedicine': SBooleanDescriptor;
          'fmhOther': SBooleanDescriptor;
          'fmhOtherDetails': SStringDescriptor;

          'afc': SBooleanDescriptor;

          "aFC": SListDescriptor;
          'afcIntraHosp': SBooleanDescriptor;
          'afcExtraHosp': SBooleanDescriptor;

          'ySinceDiploma': SNumberDescriptor;
          'yPreHospXp': SNumberDescriptor;

          "likert": SObjectDescriptor;

          'plot': SListDescriptor;
          'output': SObjectDescriptor;
          'outputCardio': SObjectDescriptor;
          'outputOther': SObjectDescriptor;

          'trigger': SBooleanDescriptor;

          'patient_generation': SListDescriptor;
          'generation_settings': SObjectDescriptor;
          'patientNumber': SNumberDescriptor;
          'situation': SStringDescriptor;

          "events_vd1H1F": SListDescriptor;
          "newEvents": SEventInboxDescriptor;
          "events": SInboxDescriptor;
          "lastEventId": SNumberDescriptor;

          "localization": SListDescriptor;

          "pathologies_517FG4": SListDescriptor;
          "human-blocks": SObjectDescriptor;
          "human-pathology": SObjectDescriptor;
          "human-general": SObjectDescriptor;
          "human-actions": SObjectDescriptor;
          "human-items": SObjectDescriptor;
          "human-chemicals": SObjectDescriptor;

          "pretriage": SListDescriptor;
          "pretriage-interface": SObjectDescriptor;
          "pretriage-explanations": SObjectDescriptor;

          "variable_6HaInb": SListDescriptor;
          "qr-interface": SObjectDescriptor;

          "general": SListDescriptor;
          "general-interface": SObjectDescriptor;
          "general-likert": SObjectDescriptor;

          "mainSim": SListDescriptor;
          "mainSim-interface": SObjectDescriptor;
          "mainSim-actions-tasks": SObjectDescriptor;
          "mainSim-actors": SObjectDescriptor;
          "mainSim-resources": SObjectDescriptor;
          "mainSim-radio": SObjectDescriptor;
          "mainSim-summary": SObjectDescriptor;
          "mainSim-dashboard": SObjectDescriptor;
          "mainSim-locations": SObjectDescriptor;

          "trainer": SListDescriptor;
          "trainer-interface": SObjectDescriptor;

          "debug": SListDescriptor;
          "debug_LMEBup": SNumberDescriptor;
          "debugStoredState": SNumberDescriptor;
          "debugIgnoredEvents":SObjectDescriptor;

          "mainGame": SListDescriptor;

          "interface": SListDescriptor;
          "gameState": SStringDescriptor;

          "multiplayer": SListDescriptor;
          "multiplayerMatrix": SObjectDescriptor;
          "trainer_PX3n0s": SListDescriptor;
          "selectedTeam": SStringDescriptor;

          "trainer_Zix3IY": SListDescriptor;
          "godView": SBooleanDescriptor;

          "startTime": SListDescriptor;
          "startMinutes": SNumberDescriptor;
          "startHours": SNumberDescriptor;

          "startMenuPageLoader": SNumberDescriptor;
          'display_debug_button': SBooleanDescriptor;
          "readRadioMessagesByChannel": SObjectDescriptor;
          "currentStateCount": SNumberDescriptor;
          "currentState": SObjectDescriptor;
          "messagesLifeLength": SNumberDescriptor;
          "respectHierarchy": SBooleanDescriptor;
          "gameMode": SStringDescriptor;
          "patients-elapsed-minutes": SNumberDescriptor;
          "pathology_max_amount": SNumberDescriptor;
          "selected_pathologies": SObjectDescriptor;
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

        type CurrentLanguages = "EN" | "FR";
        type View = 'Editor' | 'Instance' | 'Export' | 'Public';
        declare const API_VIEW : View;
        declare const APP_CONTEXT : 'Editor' | 'Trainer' | 'Player';
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

        type BBox2d = [number, number, number, number];
        type BBox3d = [number, number, number, number, number, number];
        type BBox = BBox2d | BBox3d;

        type TurfGeometryOption = {
          bbox?: BBox,
          id?: string|number
        }

        declare const Turf : {
          lineIntersect: ((geom1: unknown, geom2: unknown) => any),
          bboxClip: ((feature: unknown, bbox: [number, number, number, number]) => any),
          lineString: ((coordinates: number[][], properties?: AnyValuesObject, options?: TurfGeometryOption) => any),
          multiLineString: ((coordinates: number[][][], properties?: AnyValuesObject, options?: TurfGeometryOption) => any),
          polygon: ((points: number[][][], properties?: AnyValuesObject, options?: TurfGeometryOption) => any),
          multiPolygon : ((points: number[][][][], properties?: AnyValuesObject, options?: TurfGeometryOption) => any),
        };

        declare const OpenLayer: {
          format: {
            GeoJSON : any,
          },
          source: {
            VectorSource : any
          },
          transformExtent : ((extent : ExtentLikeObject, srcProj : ProjectionLike, destProj : ProjectionLike) => ExtentLikeObject)
        }

        

        

  