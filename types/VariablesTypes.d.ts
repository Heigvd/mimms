
    
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
        declare const schemaProps: SchemaPropsDefinedType;

        interface VariableClasses {
          "texts": SListDescriptor;
"maintitle": SStaticTextDescriptor;
"staticTextDescriptor": SStaticTextDescriptor;
"lickertPages": SListDescriptor;
"lickertWelcome": SStaticTextDescriptor;
"lickertLegend": SStaticTextDescriptor;
"notCompletedYet": SStaticTextDescriptor;
"congrats": SStaticTextDescriptor;
"env": SListDescriptor;
"atmP_mmHg": SNumberDescriptor;
"fiO2": SNumberDescriptor;
"duration_s": SNumberDescriptor;
"stepDuration": SNumberDescriptor;
"data": SListDescriptor;
"patients": SObjectDescriptor;
"characters": SObjectDescriptor;
"pathologies": SObjectDescriptor;
"comp": SObjectDescriptor;
"scenario": SObjectDescriptor;
"autonomicNervousSystems": SListDescriptor;
"symsys": SObjectDescriptor;
"objectDescriptor": SObjectDescriptor;
"bagsDefinitions": SObjectDescriptor;
"situationsDefinitions": SObjectDescriptor;
"skillsDefinitions": SObjectDescriptor;
"drill_Presets": SObjectDescriptor;
"state": SListDescriptor;
"whoAmI": SStringDescriptor;
"currentPatient": SStringDescriptor;
"showPatientModal": SBooleanDescriptor;
"drillStatus": SObjectDescriptor;
"variable": SListDescriptor;
"vasoconstriction": SBooleanDescriptor;
"coagulation": SBooleanDescriptor;
"vasoconstrictionLungs": SBooleanDescriptor;
"ansModel": SStringDescriptor;
"tagSystem": SStringDescriptor;
"drillType": SStringDescriptor;
"drill": SListDescriptor;
"bagType": SStringDescriptor;
"defaultProfile": SStringDescriptor;
"patientSet": SStringDescriptor;
"finished_custom_text": STextDescriptor;
"time_management": SListDescriptor;
"team": SListDescriptor;
"inSim_ref": SNumberDescriptor;
"epoch_ref": SNumberDescriptor;
"running": SBooleanDescriptor;
"keepalive": SNumberDescriptor;
"upTo_inSim_ref": SNumberDescriptor;
"replay": SBooleanDescriptor;
"global": SListDescriptor;
"running_global": SBooleanDescriptor;
"outputs": SListDescriptor;
"lickert": SObjectDescriptor;
"plot": SListDescriptor;
"output": SObjectDescriptor;
"outputCardio": SObjectDescriptor;
"outputOther": SObjectDescriptor;
"communication": SListDescriptor;
"chatContent": SStringDescriptor;
"lastMsg": SStringDescriptor;
"lastRadioMsg": SStringDescriptor;
"lastPhoneMsg": SStringDescriptor;
"lastChannel": SStringDescriptor;
"lastRadioId": SStringDescriptor;
"communicationType": SStringDescriptor;
"fromPhone": SStringDescriptor;
"recipientPhoneId": SNumberDescriptor;
"trigger": SBooleanDescriptor;
"patient_generation": SListDescriptor;
"generation_settings": SObjectDescriptor;
"patientNumber": SNumberDescriptor;
"situation": SStringDescriptor;
"events_vd1H1F": SListDescriptor;
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
"pretriage-algorithms": SObjectDescriptor;
"pretriage-explanations": SObjectDescriptor;
"variable_6HaInb": SListDescriptor;
"qr-interface": SObjectDescriptor;
"lifeSizeWithQR": SListDescriptor;
"multiplayerMode": SStringDescriptor;
"general": SListDescriptor;
"general-interface": SObjectDescriptor;
"realLifeRole": SStringDescriptor;
"scenarioRevived": SBooleanDescriptor;
        }

        interface VariableIds {
          24098051: SListDescriptor;
24098054: SStaticTextDescriptor;
24098058: SStaticTextDescriptor;
24098062: SListDescriptor;
24098065: SStaticTextDescriptor;
24098069: SStaticTextDescriptor;
24098073: SStaticTextDescriptor;
24098077: SStaticTextDescriptor;
24098081: SListDescriptor;
24098084: SNumberDescriptor;
24098087: SNumberDescriptor;
24098090: SNumberDescriptor;
24098093: SNumberDescriptor;
24098096: SListDescriptor;
24098099: SObjectDescriptor;
24098102: SObjectDescriptor;
24098105: SObjectDescriptor;
24098108: SObjectDescriptor;
24098111: SObjectDescriptor;
24098114: SListDescriptor;
24098117: SObjectDescriptor;
24098120: SObjectDescriptor;
24098123: SObjectDescriptor;
24098126: SObjectDescriptor;
24098129: SObjectDescriptor;
24098132: SObjectDescriptor;
24098135: SListDescriptor;
24098138: SStringDescriptor;
24098142: SStringDescriptor;
24098146: SBooleanDescriptor;
24098149: SObjectDescriptor;
24098152: SListDescriptor;
24098155: SBooleanDescriptor;
24098158: SBooleanDescriptor;
24098161: SBooleanDescriptor;
24098164: SStringDescriptor;
24098168: SStringDescriptor;
24098184: SStringDescriptor;
24098194: SListDescriptor;
24098197: SStringDescriptor;
24098201: SStringDescriptor;
24098205: SStringDescriptor;
24098209: STextDescriptor;
24098212: SListDescriptor;
24098215: SListDescriptor;
24098218: SNumberDescriptor;
24098221: SNumberDescriptor;
24098224: SBooleanDescriptor;
24098227: SNumberDescriptor;
24098230: SNumberDescriptor;
24098233: SBooleanDescriptor;
24098236: SListDescriptor;
24098239: SBooleanDescriptor;
24098242: SListDescriptor;
24098245: SObjectDescriptor;
24098248: SListDescriptor;
24098251: SObjectDescriptor;
24098254: SObjectDescriptor;
24098257: SObjectDescriptor;
24098260: SListDescriptor;
24098263: SStringDescriptor;
24098267: SStringDescriptor;
24098271: SStringDescriptor;
24098275: SStringDescriptor;
24098279: SStringDescriptor;
24098283: SStringDescriptor;
24098287: SStringDescriptor;
24098297: SStringDescriptor;
24098301: SNumberDescriptor;
24098304: SBooleanDescriptor;
24098307: SListDescriptor;
24098310: SObjectDescriptor;
24098313: SNumberDescriptor;
24098316: SStringDescriptor;
24098320: SListDescriptor;
24098323: SInboxDescriptor;
24098326: SNumberDescriptor;
24098329: SListDescriptor;
24098332: SListDescriptor;
24098335: SObjectDescriptor;
24098338: SObjectDescriptor;
24098341: SObjectDescriptor;
24098344: SObjectDescriptor;
24098347: SObjectDescriptor;
24098350: SObjectDescriptor;
24098353: SListDescriptor;
24098356: SObjectDescriptor;
24098359: SObjectDescriptor;
24098362: SObjectDescriptor;
24098776: SListDescriptor;
24098781: SObjectDescriptor;
24098788: SListDescriptor;
24098795: SStringDescriptor;
24098806: SListDescriptor;
24098811: SObjectDescriptor;
24098818: SStringDescriptor;
24098833: SBooleanDescriptor;
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

        

        

  