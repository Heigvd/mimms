
/*
 * SMergeable
 */
 abstract class SMergeable {
  constructor(client:WegasClient, entity: IMergeable);
  getEntity() : IMergeable;
  getJSONClassName() : IMergeable["@class"];
  getRefId() : IMergeable["refId"];
  getParentType() : IMergeable["parentType"];
  getParentId() : IMergeable["parentId"];
}
interface WegasEntitiesNamesAndClasses {
  STextEvaluationDescriptor : STextEvaluationDescriptor;
  'STextEvaluationDescriptor[]' : STextEvaluationDescriptor[];  'Readonly<STextEvaluationDescriptor>' : Readonly<STextEvaluationDescriptor>;
  'Readonly<STextEvaluationDescriptor[]>' : Readonly<STextEvaluationDescriptor[]>;
  SInboxInstance : SInboxInstance;
  'SInboxInstance[]' : SInboxInstance[];  'Readonly<SInboxInstance>' : Readonly<SInboxInstance>;
  'Readonly<SInboxInstance[]>' : Readonly<SInboxInstance[]>;
  SInboxDescriptor : SInboxDescriptor;
  'SInboxDescriptor[]' : SInboxDescriptor[];  'Readonly<SInboxDescriptor>' : Readonly<SInboxDescriptor>;
  'Readonly<SInboxDescriptor[]>' : Readonly<SInboxDescriptor[]>;
  SSingleResultChoiceDescriptor : SSingleResultChoiceDescriptor;
  'SSingleResultChoiceDescriptor[]' : SSingleResultChoiceDescriptor[];  'Readonly<SSingleResultChoiceDescriptor>' : Readonly<SSingleResultChoiceDescriptor>;
  'Readonly<SSingleResultChoiceDescriptor[]>' : Readonly<SSingleResultChoiceDescriptor[]>;
  SChoiceInstance : SChoiceInstance;
  'SChoiceInstance[]' : SChoiceInstance[];  'Readonly<SChoiceInstance>' : Readonly<SChoiceInstance>;
  'Readonly<SChoiceInstance[]>' : Readonly<SChoiceInstance[]>;
  STextDescriptor : STextDescriptor;
  'STextDescriptor[]' : STextDescriptor[];  'Readonly<STextDescriptor>' : Readonly<STextDescriptor>;
  'Readonly<STextDescriptor[]>' : Readonly<STextDescriptor[]>;
  SListInstance : SListInstance;
  'SListInstance[]' : SListInstance[];  'Readonly<SListInstance>' : Readonly<SListInstance>;
  'Readonly<SListInstance[]>' : Readonly<SListInstance[]>;
  SActivity : SActivity;
  'SActivity[]' : SActivity[];  'Readonly<SActivity>' : Readonly<SActivity>;
  'Readonly<SActivity[]>' : Readonly<SActivity[]>;
  SDetachedFileDescriptor : SDetachedFileDescriptor;
  'SDetachedFileDescriptor[]' : SDetachedFileDescriptor[];  'Readonly<SDetachedFileDescriptor>' : Readonly<SDetachedFileDescriptor>;
  'Readonly<SDetachedFileDescriptor[]>' : Readonly<SDetachedFileDescriptor[]>;
  SToken : SToken;
  'SToken[]' : SToken[];  'Readonly<SToken>' : Readonly<SToken>;
  'Readonly<SToken[]>' : Readonly<SToken[]>;
  SFSMInstance : SFSMInstance;
  'SFSMInstance[]' : SFSMInstance[];  'Readonly<SFSMInstance>' : Readonly<SFSMInstance>;
  'Readonly<SFSMInstance[]>' : Readonly<SFSMInstance[]>;
  SAssignment : SAssignment;
  'SAssignment[]' : SAssignment[];  'Readonly<SAssignment>' : Readonly<SAssignment>;
  'Readonly<SAssignment[]>' : Readonly<SAssignment[]>;
  SNumberInstance : SNumberInstance;
  'SNumberInstance[]' : SNumberInstance[];  'Readonly<SNumberInstance>' : Readonly<SNumberInstance>;
  'Readonly<SNumberInstance[]>' : Readonly<SNumberInstance[]>;
  SPermission : SPermission;
  'SPermission[]' : SPermission[];  'Readonly<SPermission>' : Readonly<SPermission>;
  'Readonly<SPermission[]>' : Readonly<SPermission[]>;
  SWhQuestionDescriptor : SWhQuestionDescriptor;
  'SWhQuestionDescriptor[]' : SWhQuestionDescriptor[];  'Readonly<SWhQuestionDescriptor>' : Readonly<SWhQuestionDescriptor>;
  'Readonly<SWhQuestionDescriptor[]>' : Readonly<SWhQuestionDescriptor[]>;
  SSurveyNumberDescriptor : SSurveyNumberDescriptor;
  'SSurveyNumberDescriptor[]' : SSurveyNumberDescriptor[];  'Readonly<SSurveyNumberDescriptor>' : Readonly<SSurveyNumberDescriptor>;
  'Readonly<SSurveyNumberDescriptor[]>' : Readonly<SSurveyNumberDescriptor[]>;
  SWRequirement : SWRequirement;
  'SWRequirement[]' : SWRequirement[];  'Readonly<SWRequirement>' : Readonly<SWRequirement>;
  'Readonly<SWRequirement[]>' : Readonly<SWRequirement[]>;
  STextEvaluationInstance : STextEvaluationInstance;
  'STextEvaluationInstance[]' : STextEvaluationInstance[];  'Readonly<STextEvaluationInstance>' : Readonly<STextEvaluationInstance>;
  'Readonly<STextEvaluationInstance[]>' : Readonly<STextEvaluationInstance[]>;
  STaskInstance : STaskInstance;
  'STaskInstance[]' : STaskInstance[];  'Readonly<STaskInstance>' : Readonly<STaskInstance>;
  'Readonly<STaskInstance[]>' : Readonly<STaskInstance[]>;
  STranslation : STranslation;
  'STranslation[]' : STranslation[];  'Readonly<STranslation>' : Readonly<STranslation>;
  'Readonly<STranslation[]>' : Readonly<STranslation[]>;
  SAbstractContentDescriptor : SAbstractContentDescriptor;
  'SAbstractContentDescriptor[]' : SAbstractContentDescriptor[];  'Readonly<SAbstractContentDescriptor>' : Readonly<SAbstractContentDescriptor>;
  'Readonly<SAbstractContentDescriptor[]>' : Readonly<SAbstractContentDescriptor[]>;
  SSurveyInputDescriptor : SSurveyInputDescriptor;
  'SSurveyInputDescriptor[]' : SSurveyInputDescriptor[];  'Readonly<SSurveyInputDescriptor>' : Readonly<SSurveyInputDescriptor>;
  'Readonly<SSurveyInputDescriptor[]>' : Readonly<SSurveyInputDescriptor[]>;
  SGameModel : SGameModel;
  'SGameModel[]' : SGameModel[];  'Readonly<SGameModel>' : Readonly<SGameModel>;
  'Readonly<SGameModel[]>' : Readonly<SGameModel[]>;
  STransitionDependency : STransitionDependency;
  'STransitionDependency[]' : STransitionDependency[];  'Readonly<STransitionDependency>' : Readonly<STransitionDependency>;
  'Readonly<STransitionDependency[]>' : Readonly<STransitionDependency[]>;
  SEvaluationDescriptorContainer : SEvaluationDescriptorContainer;
  'SEvaluationDescriptorContainer[]' : SEvaluationDescriptorContainer[];  'Readonly<SEvaluationDescriptorContainer>' : Readonly<SEvaluationDescriptorContainer>;
  'Readonly<SEvaluationDescriptorContainer[]>' : Readonly<SEvaluationDescriptorContainer[]>;
  SGameAdmin : SGameAdmin;
  'SGameAdmin[]' : SGameAdmin[];  'Readonly<SGameAdmin>' : Readonly<SGameAdmin>;
  'Readonly<SGameAdmin[]>' : Readonly<SGameAdmin[]>;
  SPeerReviewInstance : SPeerReviewInstance;
  'SPeerReviewInstance[]' : SPeerReviewInstance[];  'Readonly<SPeerReviewInstance>' : Readonly<SPeerReviewInstance>;
  'Readonly<SPeerReviewInstance[]>' : Readonly<SPeerReviewInstance[]>;
  SGame : SGame;
  'SGame[]' : SGame[];  'Readonly<SGame>' : Readonly<SGame>;
  'Readonly<SGame[]>' : Readonly<SGame[]>;
  SGameModelLanguage : SGameModelLanguage;
  'SGameModelLanguage[]' : SGameModelLanguage[];  'Readonly<SGameModelLanguage>' : Readonly<SGameModelLanguage>;
  'Readonly<SGameModelLanguage[]>' : Readonly<SGameModelLanguage[]>;
  SAbstractEntity : SAbstractEntity;
  'SAbstractEntity[]' : SAbstractEntity[];  'Readonly<SAbstractEntity>' : Readonly<SAbstractEntity>;
  'Readonly<SAbstractEntity[]>' : Readonly<SAbstractEntity[]>;
  SGameModelProperties : SGameModelProperties;
  'SGameModelProperties[]' : SGameModelProperties[];  'Readonly<SGameModelProperties>' : Readonly<SGameModelProperties>;
  'Readonly<SGameModelProperties[]>' : Readonly<SGameModelProperties[]>;
  SInviteToJoinToken : SInviteToJoinToken;
  'SInviteToJoinToken[]' : SInviteToJoinToken[];  'Readonly<SInviteToJoinToken>' : Readonly<SInviteToJoinToken>;
  'Readonly<SInviteToJoinToken[]>' : Readonly<SInviteToJoinToken[]>;
  SBurndownInstance : SBurndownInstance;
  'SBurndownInstance[]' : SBurndownInstance[];  'Readonly<SBurndownInstance>' : Readonly<SBurndownInstance>;
  'Readonly<SBurndownInstance[]>' : Readonly<SBurndownInstance[]>;
  SSurveyChoicesDescriptor : SSurveyChoicesDescriptor;
  'SSurveyChoicesDescriptor[]' : SSurveyChoicesDescriptor[];  'Readonly<SSurveyChoicesDescriptor>' : Readonly<SSurveyChoicesDescriptor>;
  'Readonly<SSurveyChoicesDescriptor[]>' : Readonly<SSurveyChoicesDescriptor[]>;
  SVariableInstance : SVariableInstance;
  'SVariableInstance[]' : SVariableInstance[];  'Readonly<SVariableInstance>' : Readonly<SVariableInstance>;
  'Readonly<SVariableInstance[]>' : Readonly<SVariableInstance[]>;
  SObjectDescriptor : SObjectDescriptor;
  'SObjectDescriptor[]' : SObjectDescriptor[];  'Readonly<SObjectDescriptor>' : Readonly<SObjectDescriptor>;
  'Readonly<SObjectDescriptor[]>' : Readonly<SObjectDescriptor[]>;
  SPlayerScope : SPlayerScope;
  'SPlayerScope[]' : SPlayerScope[];  'Readonly<SPlayerScope>' : Readonly<SPlayerScope>;
  'Readonly<SPlayerScope[]>' : Readonly<SPlayerScope[]>;
  SAaiAccount : SAaiAccount;
  'SAaiAccount[]' : SAaiAccount[];  'Readonly<SAaiAccount>' : Readonly<SAaiAccount>;
  'Readonly<SAaiAccount[]>' : Readonly<SAaiAccount[]>;
  SDirectoryDescriptor : SDirectoryDescriptor;
  'SDirectoryDescriptor[]' : SDirectoryDescriptor[];  'Readonly<SDirectoryDescriptor>' : Readonly<SDirectoryDescriptor>;
  'Readonly<SDirectoryDescriptor[]>' : Readonly<SDirectoryDescriptor[]>;
  SDialogueDescriptor : SDialogueDescriptor;
  'SDialogueDescriptor[]' : SDialogueDescriptor[];  'Readonly<SDialogueDescriptor>' : Readonly<SDialogueDescriptor>;
  'Readonly<SDialogueDescriptor[]>' : Readonly<SDialogueDescriptor[]>;
  SAchievementDescriptor : SAchievementDescriptor;
  'SAchievementDescriptor[]' : SAchievementDescriptor[];  'Readonly<SAchievementDescriptor>' : Readonly<SAchievementDescriptor>;
  'Readonly<SAchievementDescriptor[]>' : Readonly<SAchievementDescriptor[]>;
  SStringDescriptor : SStringDescriptor;
  'SStringDescriptor[]' : SStringDescriptor[];  'Readonly<SStringDescriptor>' : Readonly<SStringDescriptor>;
  'Readonly<SStringDescriptor[]>' : Readonly<SStringDescriptor[]>;
  SGuestJpaAccount : SGuestJpaAccount;
  'SGuestJpaAccount[]' : SGuestJpaAccount[];  'Readonly<SGuestJpaAccount>' : Readonly<SGuestJpaAccount>;
  'Readonly<SGuestJpaAccount[]>' : Readonly<SGuestJpaAccount[]>;
  SChoiceDescriptor : SChoiceDescriptor;
  'SChoiceDescriptor[]' : SChoiceDescriptor[];  'Readonly<SChoiceDescriptor>' : Readonly<SChoiceDescriptor>;
  'Readonly<SChoiceDescriptor[]>' : Readonly<SChoiceDescriptor[]>;
  SEvaluationDescriptor : SEvaluationDescriptor;
  'SEvaluationDescriptor[]' : SEvaluationDescriptor[];  'Readonly<SEvaluationDescriptor>' : Readonly<SEvaluationDescriptor>;
  'Readonly<SEvaluationDescriptor[]>' : Readonly<SEvaluationDescriptor[]>;
  SSurveyInputInstance : SSurveyInputInstance;
  'SSurveyInputInstance[]' : SSurveyInputInstance[];  'Readonly<SSurveyInputInstance>' : Readonly<SSurveyInputInstance>;
  'Readonly<SSurveyInputInstance[]>' : Readonly<SSurveyInputInstance[]>;
  STriggerState : STriggerState;
  'STriggerState[]' : STriggerState[];  'Readonly<STriggerState>' : Readonly<STriggerState>;
  'Readonly<STriggerState[]>' : Readonly<STriggerState[]>;
  SPeerReviewDescriptor : SPeerReviewDescriptor;
  'SPeerReviewDescriptor[]' : SPeerReviewDescriptor[];  'Readonly<SPeerReviewDescriptor>' : Readonly<SPeerReviewDescriptor>;
  'Readonly<SPeerReviewDescriptor[]>' : Readonly<SPeerReviewDescriptor[]>;
  SBooleanInstance : SBooleanInstance;
  'SBooleanInstance[]' : SBooleanInstance[];  'Readonly<SBooleanInstance>' : Readonly<SBooleanInstance>;
  'Readonly<SBooleanInstance[]>' : Readonly<SBooleanInstance[]>;
  STeam : STeam;
  'STeam[]' : STeam[];  'Readonly<STeam>' : Readonly<STeam>;
  'Readonly<STeam[]>' : Readonly<STeam[]>;
  SDetachedContentDescriptor : SDetachedContentDescriptor;
  'SDetachedContentDescriptor[]' : SDetachedContentDescriptor[];  'Readonly<SDetachedContentDescriptor>' : Readonly<SDetachedContentDescriptor>;
  'Readonly<SDetachedContentDescriptor[]>' : Readonly<SDetachedContentDescriptor[]>;
  SDebugGame : SDebugGame;
  'SDebugGame[]' : SDebugGame[];  'Readonly<SDebugGame>' : Readonly<SDebugGame>;
  'Readonly<SDebugGame[]>' : Readonly<SDebugGame[]>;
  SIterationPeriod : SIterationPeriod;
  'SIterationPeriod[]' : SIterationPeriod[];  'Readonly<SIterationPeriod>' : Readonly<SIterationPeriod>;
  'Readonly<SIterationPeriod[]>' : Readonly<SIterationPeriod[]>;
  SOccupation : SOccupation;
  'SOccupation[]' : SOccupation[];  'Readonly<SOccupation>' : Readonly<SOccupation>;
  'Readonly<SOccupation[]>' : Readonly<SOccupation[]>;
  SWhQuestionInstance : SWhQuestionInstance;
  'SWhQuestionInstance[]' : SWhQuestionInstance[];  'Readonly<SWhQuestionInstance>' : Readonly<SWhQuestionInstance>;
  'Readonly<SWhQuestionInstance[]>' : Readonly<SWhQuestionInstance[]>;
  STransition : STransition;
  'STransition[]' : STransition[];  'Readonly<STransition>' : Readonly<STransition>;
  'Readonly<STransition[]>' : Readonly<STransition[]>;
  SReply : SReply;
  'SReply[]' : SReply[];  'Readonly<SReply>' : Readonly<SReply>;
  'Readonly<SReply[]>' : Readonly<SReply[]>;
  SDetachedDirectoryDescriptor : SDetachedDirectoryDescriptor;
  'SDetachedDirectoryDescriptor[]' : SDetachedDirectoryDescriptor[];  'Readonly<SDetachedDirectoryDescriptor>' : Readonly<SDetachedDirectoryDescriptor>;
  'Readonly<SDetachedDirectoryDescriptor[]>' : Readonly<SDetachedDirectoryDescriptor[]>;
  SJpaAccount : SJpaAccount;
  'SJpaAccount[]' : SJpaAccount[];  'Readonly<SJpaAccount>' : Readonly<SJpaAccount>;
  'Readonly<SJpaAccount[]>' : Readonly<SJpaAccount[]>;
  SResourceDescriptor : SResourceDescriptor;
  'SResourceDescriptor[]' : SResourceDescriptor[];  'Readonly<SResourceDescriptor>' : Readonly<SResourceDescriptor>;
  'Readonly<SResourceDescriptor[]>' : Readonly<SResourceDescriptor[]>;
  SSurveyToken : SSurveyToken;
  'SSurveyToken[]' : SSurveyToken[];  'Readonly<SSurveyToken>' : Readonly<SSurveyToken>;
  'Readonly<SSurveyToken[]>' : Readonly<SSurveyToken[]>;
  SStaticTextDescriptor : SStaticTextDescriptor;
  'SStaticTextDescriptor[]' : SStaticTextDescriptor[];  'Readonly<SStaticTextDescriptor>' : Readonly<SStaticTextDescriptor>;
  'Readonly<SStaticTextDescriptor[]>' : Readonly<SStaticTextDescriptor[]>;
  SAttachment : SAttachment;
  'SAttachment[]' : SAttachment[];  'Readonly<SAttachment>' : Readonly<SAttachment>;
  'Readonly<SAttachment[]>' : Readonly<SAttachment[]>;
  SResult : SResult;
  'SResult[]' : SResult[];  'Readonly<SResult>' : Readonly<SResult>;
  'Readonly<SResult[]>' : Readonly<SResult[]>;
  SDebugTeam : SDebugTeam;
  'SDebugTeam[]' : SDebugTeam[];  'Readonly<SDebugTeam>' : Readonly<SDebugTeam>;
  'Readonly<SDebugTeam[]>' : Readonly<SDebugTeam[]>;
  SIterationEvent : SIterationEvent;
  'SIterationEvent[]' : SIterationEvent[];  'Readonly<SIterationEvent>' : Readonly<SIterationEvent>;
  'Readonly<SIterationEvent[]>' : Readonly<SIterationEvent[]>;
  SDialogueState : SDialogueState;
  'SDialogueState[]' : SDialogueState[];  'Readonly<SDialogueState>' : Readonly<SDialogueState>;
  'Readonly<SDialogueState[]>' : Readonly<SDialogueState[]>;
  SSurveySectionDescriptor : SSurveySectionDescriptor;
  'SSurveySectionDescriptor[]' : SSurveySectionDescriptor[];  'Readonly<SSurveySectionDescriptor>' : Readonly<SSurveySectionDescriptor>;
  'Readonly<SSurveySectionDescriptor[]>' : Readonly<SSurveySectionDescriptor[]>;
  SBurndownDescriptor : SBurndownDescriptor;
  'SBurndownDescriptor[]' : SBurndownDescriptor[];  'Readonly<SBurndownDescriptor>' : Readonly<SBurndownDescriptor>;
  'Readonly<SBurndownDescriptor[]>' : Readonly<SBurndownDescriptor[]>;
  STeamScope : STeamScope;
  'STeamScope[]' : STeamScope[];  'Readonly<STeamScope>' : Readonly<STeamScope>;
  'Readonly<STeamScope[]>' : Readonly<STeamScope[]>;
  SGradeDescriptor : SGradeDescriptor;
  'SGradeDescriptor[]' : SGradeDescriptor[];  'Readonly<SGradeDescriptor>' : Readonly<SGradeDescriptor>;
  'Readonly<SGradeDescriptor[]>' : Readonly<SGradeDescriptor[]>;
  SAccountDetails : SAccountDetails;
  'SAccountDetails[]' : SAccountDetails[];  'Readonly<SAccountDetails>' : Readonly<SAccountDetails>;
  'Readonly<SAccountDetails[]>' : Readonly<SAccountDetails[]>;
  SScript : SScript;
  'SScript[]' : SScript[];  'Readonly<SScript>' : Readonly<SScript>;
  'Readonly<SScript[]>' : Readonly<SScript[]>;
  SPlayer : SPlayer;
  'SPlayer[]' : SPlayer[];  'Readonly<SPlayer>' : Readonly<SPlayer>;
  'Readonly<SPlayer[]>' : Readonly<SPlayer[]>;
  SAchievementInstance : SAchievementInstance;
  'SAchievementInstance[]' : SAchievementInstance[];  'Readonly<SAchievementInstance>' : Readonly<SAchievementInstance>;
  'Readonly<SAchievementInstance[]>' : Readonly<SAchievementInstance[]>;
  SAbstractAccount : SAbstractAccount;
  'SAbstractAccount[]' : SAbstractAccount[];  'Readonly<SAbstractAccount>' : Readonly<SAbstractAccount>;
  'Readonly<SAbstractAccount[]>' : Readonly<SAbstractAccount[]>;
  SObjectInstance : SObjectInstance;
  'SObjectInstance[]' : SObjectInstance[];  'Readonly<SObjectInstance>' : Readonly<SObjectInstance>;
  'Readonly<SObjectInstance[]>' : Readonly<SObjectInstance[]>;
  SSurveyDescriptor : SSurveyDescriptor;
  'SSurveyDescriptor[]' : SSurveyDescriptor[];  'Readonly<SSurveyDescriptor>' : Readonly<SSurveyDescriptor>;
  'Readonly<SSurveyDescriptor[]>' : Readonly<SSurveyDescriptor[]>;
  SAbstractStateMachineDescriptor : SAbstractStateMachineDescriptor;
  'SAbstractStateMachineDescriptor[]' : SAbstractStateMachineDescriptor[];  'Readonly<SAbstractStateMachineDescriptor>' : Readonly<SAbstractStateMachineDescriptor>;
  'Readonly<SAbstractStateMachineDescriptor[]>' : Readonly<SAbstractStateMachineDescriptor[]>;
  SBooleanDescriptor : SBooleanDescriptor;
  'SBooleanDescriptor[]' : SBooleanDescriptor[];  'Readonly<SBooleanDescriptor>' : Readonly<SBooleanDescriptor>;
  'Readonly<SBooleanDescriptor[]>' : Readonly<SBooleanDescriptor[]>;
  SGameModelContent : SGameModelContent;
  'SGameModelContent[]' : SGameModelContent[];  'Readonly<SGameModelContent>' : Readonly<SGameModelContent>;
  'Readonly<SGameModelContent[]>' : Readonly<SGameModelContent[]>;
  SSurveySectionInstance : SSurveySectionInstance;
  'SSurveySectionInstance[]' : SSurveySectionInstance[];  'Readonly<SSurveySectionInstance>' : Readonly<SSurveySectionInstance>;
  'Readonly<SSurveySectionInstance[]>' : Readonly<SSurveySectionInstance[]>;
  SRole : SRole;
  'SRole[]' : SRole[];  'Readonly<SRole>' : Readonly<SRole>;
  'Readonly<SRole[]>' : Readonly<SRole[]>;
  SQuestionDescriptor : SQuestionDescriptor;
  'SQuestionDescriptor[]' : SQuestionDescriptor[];  'Readonly<SQuestionDescriptor>' : Readonly<SQuestionDescriptor>;
  'Readonly<SQuestionDescriptor[]>' : Readonly<SQuestionDescriptor[]>;
  SState : SState;
  'SState[]' : SState[];  'Readonly<SState>' : Readonly<SState>;
  'Readonly<SState[]>' : Readonly<SState[]>;
  SGameTeams : SGameTeams;
  'SGameTeams[]' : SGameTeams[];  'Readonly<SGameTeams>' : Readonly<SGameTeams>;
  'Readonly<SGameTeams[]>' : Readonly<SGameTeams[]>;
  SAbstractState : SAbstractState;
  'SAbstractState[]' : SAbstractState[];  'Readonly<SAbstractState>' : Readonly<SAbstractState>;
  'Readonly<SAbstractState[]>' : Readonly<SAbstractState[]>;
  SEnumItem : SEnumItem;
  'SEnumItem[]' : SEnumItem[];  'Readonly<SEnumItem>' : Readonly<SEnumItem>;
  'Readonly<SEnumItem[]>' : Readonly<SEnumItem[]>;
  SSurveyInstance : SSurveyInstance;
  'SSurveyInstance[]' : SSurveyInstance[];  'Readonly<SSurveyInstance>' : Readonly<SSurveyInstance>;
  'Readonly<SSurveyInstance[]>' : Readonly<SSurveyInstance[]>;
  SAbstractAssignement : SAbstractAssignement;
  'SAbstractAssignement[]' : SAbstractAssignement[];  'Readonly<SAbstractAssignement>' : Readonly<SAbstractAssignement>;
  'Readonly<SAbstractAssignement[]>' : Readonly<SAbstractAssignement[]>;
  SFSMDescriptor : SFSMDescriptor;
  'SFSMDescriptor[]' : SFSMDescriptor[];  'Readonly<SFSMDescriptor>' : Readonly<SFSMDescriptor>;
  'Readonly<SFSMDescriptor[]>' : Readonly<SFSMDescriptor[]>;
  SUser : SUser;
  'SUser[]' : SUser[];  'Readonly<SUser>' : Readonly<SUser>;
  'Readonly<SUser[]>' : Readonly<SUser[]>;
  SMessage : SMessage;
  'SMessage[]' : SMessage[];  'Readonly<SMessage>' : Readonly<SMessage>;
  'Readonly<SMessage[]>' : Readonly<SMessage[]>;
  SDestroyedEntity : SDestroyedEntity;
  'SDestroyedEntity[]' : SDestroyedEntity[];  'Readonly<SDestroyedEntity>' : Readonly<SDestroyedEntity>;
  'Readonly<SDestroyedEntity[]>' : Readonly<SDestroyedEntity[]>;
  SShadow : SShadow;
  'SShadow[]' : SShadow[];  'Readonly<SShadow>' : Readonly<SShadow>;
  'Readonly<SShadow[]>' : Readonly<SShadow[]>;
  SIteration : SIteration;
  'SIteration[]' : SIteration[];  'Readonly<SIteration>' : Readonly<SIteration>;
  'Readonly<SIteration[]>' : Readonly<SIteration[]>;
  SReview : SReview;
  'SReview[]' : SReview[];  'Readonly<SReview>' : Readonly<SReview>;
  'Readonly<SReview[]>' : Readonly<SReview[]>;
  SVariableDescriptor : SVariableDescriptor;
  'SVariableDescriptor[]' : SVariableDescriptor[];  'Readonly<SVariableDescriptor>' : Readonly<SVariableDescriptor>;
  'Readonly<SVariableDescriptor[]>' : Readonly<SVariableDescriptor[]>;
  SNumberDescriptor : SNumberDescriptor;
  'SNumberDescriptor[]' : SNumberDescriptor[];  'Readonly<SNumberDescriptor>' : Readonly<SNumberDescriptor>;
  'Readonly<SNumberDescriptor[]>' : Readonly<SNumberDescriptor[]>;
  STranslatableContent : STranslatableContent;
  'STranslatableContent[]' : STranslatableContent[];  'Readonly<STranslatableContent>' : Readonly<STranslatableContent>;
  'Readonly<STranslatableContent[]>' : Readonly<STranslatableContent[]>;
  SGradeInstance : SGradeInstance;
  'SGradeInstance[]' : SGradeInstance[];  'Readonly<SGradeInstance>' : Readonly<SGradeInstance>;
  'Readonly<SGradeInstance[]>' : Readonly<SGradeInstance[]>;
  SValidateAddressToken : SValidateAddressToken;
  'SValidateAddressToken[]' : SValidateAddressToken[];  'Readonly<SValidateAddressToken>' : Readonly<SValidateAddressToken>;
  'Readonly<SValidateAddressToken[]>' : Readonly<SValidateAddressToken[]>;
  SStringInstance : SStringInstance;
  'SStringInstance[]' : SStringInstance[];  'Readonly<SStringInstance>' : Readonly<SStringInstance>;
  'Readonly<SStringInstance[]>' : Readonly<SStringInstance[]>;
  SAbstractScope : SAbstractScope;
  'SAbstractScope[]' : SAbstractScope[];  'Readonly<SAbstractScope>' : Readonly<SAbstractScope>;
  'Readonly<SAbstractScope[]>' : Readonly<SAbstractScope[]>;
  SEvaluationInstance : SEvaluationInstance;
  'SEvaluationInstance[]' : SEvaluationInstance[];  'Readonly<SEvaluationInstance>' : Readonly<SEvaluationInstance>;
  'Readonly<SEvaluationInstance[]>' : Readonly<SEvaluationInstance[]>;
  SSurveyTextDescriptor : SSurveyTextDescriptor;
  'SSurveyTextDescriptor[]' : SSurveyTextDescriptor[];  'Readonly<SSurveyTextDescriptor>' : Readonly<SSurveyTextDescriptor>;
  'Readonly<SSurveyTextDescriptor[]>' : Readonly<SSurveyTextDescriptor[]>;
  STextInstance : STextInstance;
  'STextInstance[]' : STextInstance[];  'Readonly<STextInstance>' : Readonly<STextInstance>;
  'Readonly<STextInstance[]>' : Readonly<STextInstance[]>;
  SResetPasswordToken : SResetPasswordToken;
  'SResetPasswordToken[]' : SResetPasswordToken[];  'Readonly<SResetPasswordToken>' : Readonly<SResetPasswordToken>;
  'Readonly<SResetPasswordToken[]>' : Readonly<SResetPasswordToken[]>;
  SStaticTextInstance : SStaticTextInstance;
  'SStaticTextInstance[]' : SStaticTextInstance[];  'Readonly<SStaticTextInstance>' : Readonly<SStaticTextInstance>;
  'Readonly<SStaticTextInstance[]>' : Readonly<SStaticTextInstance[]>;
  SFileDescriptor : SFileDescriptor;
  'SFileDescriptor[]' : SFileDescriptor[];  'Readonly<SFileDescriptor>' : Readonly<SFileDescriptor>;
  'Readonly<SFileDescriptor[]>' : Readonly<SFileDescriptor[]>;
  STriggerDescriptor : STriggerDescriptor;
  'STriggerDescriptor[]' : STriggerDescriptor[];  'Readonly<STriggerDescriptor>' : Readonly<STriggerDescriptor>;
  'Readonly<STriggerDescriptor[]>' : Readonly<STriggerDescriptor[]>;
  SDialogueTransition : SDialogueTransition;
  'SDialogueTransition[]' : SDialogueTransition[];  'Readonly<SDialogueTransition>' : Readonly<SDialogueTransition>;
  'Readonly<SDialogueTransition[]>' : Readonly<SDialogueTransition[]>;
  STaskDescriptor : STaskDescriptor;
  'STaskDescriptor[]' : STaskDescriptor[];  'Readonly<STaskDescriptor>' : Readonly<STaskDescriptor>;
  'Readonly<STaskDescriptor[]>' : Readonly<STaskDescriptor[]>;
  SQuestionInstance : SQuestionInstance;
  'SQuestionInstance[]' : SQuestionInstance[];  'Readonly<SQuestionInstance>' : Readonly<SQuestionInstance>;
  'Readonly<SQuestionInstance[]>' : Readonly<SQuestionInstance[]>;
  SListDescriptor : SListDescriptor;
  'SListDescriptor[]' : SListDescriptor[];  'Readonly<SListDescriptor>' : Readonly<SListDescriptor>;
  'Readonly<SListDescriptor[]>' : Readonly<SListDescriptor[]>;
  SCategorizedEvaluationDescriptor : SCategorizedEvaluationDescriptor;
  'SCategorizedEvaluationDescriptor[]' : SCategorizedEvaluationDescriptor[];  'Readonly<SCategorizedEvaluationDescriptor>' : Readonly<SCategorizedEvaluationDescriptor>;
  'Readonly<SCategorizedEvaluationDescriptor[]>' : Readonly<SCategorizedEvaluationDescriptor[]>;
  SResourceInstance : SResourceInstance;
  'SResourceInstance[]' : SResourceInstance[];  'Readonly<SResourceInstance>' : Readonly<SResourceInstance>;
  'Readonly<SResourceInstance[]>' : Readonly<SResourceInstance[]>;
  SAbstractTransition : SAbstractTransition;
  'SAbstractTransition[]' : SAbstractTransition[];  'Readonly<SAbstractTransition>' : Readonly<SAbstractTransition>;
  'Readonly<SAbstractTransition[]>' : Readonly<SAbstractTransition[]>;
  SGameModelScope : SGameModelScope;
  'SGameModelScope[]' : SGameModelScope[];  'Readonly<SGameModelScope>' : Readonly<SGameModelScope>;
  'Readonly<SGameModelScope[]>' : Readonly<SGameModelScope[]>;
  SCategorizedEvaluationInstance : SCategorizedEvaluationInstance;
  'SCategorizedEvaluationInstance[]' : SCategorizedEvaluationInstance[];  'Readonly<SCategorizedEvaluationInstance>' : Readonly<SCategorizedEvaluationInstance>;
  'Readonly<SCategorizedEvaluationInstance[]>' : Readonly<SCategorizedEvaluationInstance[]>;
}

/**

 
*/
// @ts-ignore 
class SScript extends SMergeable {
  public constructor(client: WegasClient, entity: Readonly<IScript>);
  public getEntity() : Readonly<IScript>;
  getParentType():string | undefined ;
getJSONClassName() : IScript["@class"];
  /**


*/
getLanguage():string ;
  /**


*/
getContent():string ;
  getParentId():number | undefined ;
}
/**
 Represent a detached JCR file or directory.

 
*/
// @ts-ignore 
abstract class SDetachedContentDescriptor extends SMergeable {
  public constructor(client: WegasClient, entity: Readonly<IDetachedContentDescriptor>);
  public getEntity() : Readonly<IDetachedContentDescriptor>;
  getParentType():string | undefined ;
getJSONClassName() : IDetachedContentDescriptor["@class"];
  getMimeType():string | undefined | null ;
  getRefId():string | undefined ;
  getNote():string | undefined | null ;
  getDescription():string | undefined | null ;
  getParentId():number | undefined ;
  getVisibility():'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE' | undefined | null ;
}
/**
 Represent a detached JCR file.
 "Detached" means this file is a copy of the JCR file.

 
*/
// @ts-ignore 
class SDetachedFileDescriptor extends SDetachedContentDescriptor {
  public constructor(client: WegasClient, entity: Readonly<IDetachedFileDescriptor>);
  public getEntity() : Readonly<IDetachedFileDescriptor>;
getJSONClassName() : IDetachedFileDescriptor["@class"];
  getDataLastModified():number | undefined | null ;
}
/**
 Represent a detached JCR directory.
 "Detached" means this directory is a copy of the JCR one.

 
*/
// @ts-ignore 
class SDetachedDirectoryDescriptor extends SDetachedContentDescriptor {
  public constructor(client: WegasClient, entity: Readonly<IDetachedDirectoryDescriptor>);
  public getEntity() : Readonly<IDetachedDirectoryDescriptor>;
  getChildren():SDetachedContentDescriptor[] | undefined | null ;
getJSONClassName() : IDetachedDirectoryDescriptor["@class"];
}
/**

 
*/
// @ts-ignore 
class SGameModelProperties extends SMergeable {
  public constructor(client: WegasClient, entity: Readonly<IGameModelProperties>);
  public getEntity() : Readonly<IGameModelProperties>;
getJSONClassName() : IGameModelProperties["@class"];
  /**


*/
getClientScriptUri():string ;
  /**


*/
getIconUri():string ;
  /**


*/
getLogID():string ;
  getRefId():string | undefined ;
  /**


*/
getCssUri():string ;
  /**


*/
getWebsocket():string ;
  getParentType():string | undefined ;
  /**


*/
getFreeForAll():boolean ;
  /**


*/
getScriptUri():string ;
  /**


*/
getPagesUri():string ;
  getParentId():number | undefined ;
  /**


*/
getGuestAllowed():boolean ;
}
/**

 
*/
// @ts-ignore 
abstract class SAbstractEntity extends SMergeable {
  public constructor(client: WegasClient, entity: Readonly<IAbstractEntity>);
  public getEntity() : Readonly<IAbstractEntity>;
  getParentType():string | undefined ;
getJSONClassName() : IAbstractEntity["@class"];
  getId():number | undefined ;
  getRefId():string | undefined ;
  getParentId():number | undefined ;
}
/**
 One could simply use a List of String annotated with @OrderColumn, but such a setup leads to incredible
 cache coordination bug (please re test with EE8)

 

*/
// @ts-ignore 
class SGameModelLanguage extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IGameModelLanguage>);
  public getEntity() : Readonly<IGameModelLanguage>;
getJSONClassName() : IGameModelLanguage["@class"];
  getIndexOrder():number | undefined | null ;
  /**
 Language name to display

*/
getLang():string ;
  getId():number | undefined ;
  isActive():boolean ;
  /**
 short name like en, en_uk, or fr_ch

*/
getCode():string ;
  getVisibility():'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE' | undefined ;
}
/**
  
*/
// @ts-ignore 
class SGame extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IGame>);
  public getEntity() : Readonly<IGame>;
getJSONClassName() : IGame["@class"];
  /**


*/
getName():string ;
  /**


*/
getAccess():'OPEN' | 'CLOSE' ;
  /**


*/
getToken():string ;
  getId():number | undefined ;
  getStatus():'LIVE' | 'BIN' | 'DELETE' | 'SUPPRESSED' ;
  /**
 @return the createdTime

*/
getCreatedTime():number ;
  /**
 @return id of the user who created this or null if user no longer exists

*/
getCreatedById():number | undefined | null ;
  /**
 @return the teams

*/
getTeams():STeam[] ;
}
// @ts-ignore 
class SDebugGame extends SGame {
  public constructor(client: WegasClient, entity: Readonly<IDebugGame>);
  public getEntity() : Readonly<IDebugGame>;
getJSONClassName() : IDebugGame["@class"];
}
/**
 To store game info required for invoicing.

 
*/
// @ts-ignore 
class SGameAdmin extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IGameAdmin>);
  public getEntity() : Readonly<IGameAdmin>;
getJSONClassName() : IGameAdmin["@class"];
  getGameModelName():string | undefined | null ;
  getGameId():number | undefined | null ;
  getGameName():string | undefined | null ;
  getComments():string | undefined | null ;
  getGameStatus():'LIVE' | 'BIN' | 'DELETE' | 'SUPPRESSED' | undefined | null ;
  getId():number | undefined ;
  getTeamCount():number | undefined | null ;
  getStatus():'TODO' | 'PROCESSED' | 'CHARGED' | undefined | null ;
  getCreatedTime():number | undefined | null ;
  getCreator():string | undefined | null ;
}
/**
 Simple wrapper to group several evaluation descriptor

  @see EvaluationDescriptor
 @see PeerReviewDescriptor

*/
// @ts-ignore 
class SEvaluationDescriptorContainer extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IEvaluationDescriptorContainer>);
  public getEntity() : Readonly<IEvaluationDescriptorContainer>;
getJSONClassName() : IEvaluationDescriptorContainer["@class"];
  getId():number | undefined ;
  /**
 List of evaluations

*/
getEvaluations():SEvaluationDescriptor[] ;
}
/**
 Indicated the result of a {@link AbstractTransition} condition depends on a variable

 
*/
// @ts-ignore 
class STransitionDependency extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<ITransitionDependency>);
  public getEntity() : Readonly<ITransitionDependency>;
getJSONClassName() : ITransitionDependency["@class"];
  getId():number | undefined ;
  /**
 Name of the variable. This field is set when deserializing entities from clients and when a
 WegasPatch is applied.

*/
getVariableName():string ;
  /**
 Scope of the dependency.

*/
getScope():'NONE' | 'SELF' | 'CHILDREN' | 'UNKNOWN' ;
}
/**
 
*/
// @ts-ignore 
class SGameModel extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IGameModel>);
  public getEntity() : Readonly<IGameModel>;
getJSONClassName() : IGameModel["@class"];
  /**


*/
getName():string ;
  /**


*/
getProperties():SGameModelProperties ;
  getLanguages():SGameModelLanguage[] ;
  /**

 @return

*/
getBasedOnId():number | undefined | null ;
  getId():number | undefined ;
  getUiversion():number ;
  /**
 @return Current GameModel's status

*/
getStatus():'LIVE' | 'BIN' | 'DELETE' | 'SUPPRESSED' ;
  /**


*/
getDescription():string ;
  getType():'MODEL' | 'REFERENCE' | 'SCENARIO' | 'PLAY' ;
  /**


*/
getComments():string ;
  getItemsIds():number[] ;
  /**
 @return the createdTime

*/
getCreatedTime():number ;
  /**
 @return name of the user who created this or null if user no longer exists

*/
getCreatedById():number | undefined | null ;
}
/**

 
*/
// @ts-ignore 
class SWRequirement extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IWRequirement>);
  public getEntity() : Readonly<IWRequirement>;
  /**


*/
getWork():string ;
  getLevel():number ;
getJSONClassName() : IWRequirement["@class"];
  /**


*/
getName():string | undefined ;
  getQuantity():number ;
  getQuality():number ;
  /**


*/
getLimit():number ;
  getCompleteness():number ;
  getId():number | undefined ;
}
/**

 
*/
// @ts-ignore 
class SPermission extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IPermission>);
  public getEntity() : Readonly<IPermission>;
  /**


*/
getValue():string ;
getJSONClassName() : IPermission["@class"];
  getId():number | undefined ;
}
/**
 A token is sent by e-mail to users for many purposes. It may be used to:
 <ul>
 <li>reset JPAAccount password</li>
 <li>validate JPAAccount email address</li>
 <li>invite user to participate in a survey</li>
 </ul>
 <p>
 In the future, they may also be used to:<ul>
 <li>invite not yet registered user to join a team</li>
 </ul>

 
*/
// @ts-ignore 
abstract class SToken extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IToken>);
  public getEntity() : Readonly<IToken>;
  /**
 Once consumed, redirect user to this location

 @return new client location

*/
getRedirectTo():string | undefined | null ;
getJSONClassName() : IToken["@class"];
  isAutoLogin():boolean ;
  /**
 Get the expiryDate. null means infinity

 @return the expiry date or null

*/
getExpiryDate():number | undefined | null ;
  /**
 Get account linked to this token, if any

 @return the account or null

*/
getAccount():SAbstractAccount | undefined | null ;
  getId():number | undefined ;
}
// @ts-ignore 
class SResetPasswordToken extends SToken {
  public constructor(client: WegasClient, entity: Readonly<IResetPasswordToken>);
  public getEntity() : Readonly<IResetPasswordToken>;
  getRedirectTo():string | undefined | null ;
getJSONClassName() : IResetPasswordToken["@class"];
}
// @ts-ignore 
class SValidateAddressToken extends SToken {
  public constructor(client: WegasClient, entity: Readonly<IValidateAddressToken>);
  public getEntity() : Readonly<IValidateAddressToken>;
  getRedirectTo():string | undefined | null ;
getJSONClassName() : IValidateAddressToken["@class"];
}
// @ts-ignore 
class SSurveyToken extends SToken {
  public constructor(client: WegasClient, entity: Readonly<ISurveyToken>);
  public getEntity() : Readonly<ISurveyToken>;
  getRedirectTo():string | undefined | null ;
getJSONClassName() : ISurveyToken["@class"];
}
// @ts-ignore 
class SInviteToJoinToken extends SToken {
  public constructor(client: WegasClient, entity: Readonly<IInviteToJoinToken>);
  public getEntity() : Readonly<IInviteToJoinToken>;
  getRedirectTo():string | undefined | null ;
getJSONClassName() : IInviteToJoinToken["@class"];
}
/**
 
*/
// @ts-ignore 
abstract class SAbstractTransition extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IAbstractTransition>);
  public getEntity() : Readonly<IAbstractTransition>;
  getVersion():number ;
  /**


*/
getTriggerCondition():SScript ;
  getStateMachineId():number | undefined | null ;
getJSONClassName() : IAbstractTransition["@class"];
  /**


*/
getIndex():number ;
  /**


*/
getPreStateImpact():SScript ;
  /**


*/
getNextStateId():number ;
  /**
 List of variable the condition depends on. Empty means the condition MUST be evaluated in all
 cases.

*/
getDependencies():STransitionDependency[] ;
  /**
 DependsOn strategy

*/
getDependsOnStrategy():'AUTO' | 'MANUAL' | undefined ;
  getId():number | undefined ;
}
/**

 
*/
// @ts-ignore 
class SDialogueTransition extends SAbstractTransition {
  public constructor(client: WegasClient, entity: Readonly<IDialogueTransition>);
  public getEntity() : Readonly<IDialogueTransition>;
getJSONClassName() : IDialogueTransition["@class"];
  getActionText():STranslatableContent ;
}
/**
 
*/
// @ts-ignore 
class STransition extends SAbstractTransition {
  public constructor(client: WegasClient, entity: Readonly<ITransition>);
  public getEntity() : Readonly<ITransition>;
getJSONClassName() : ITransition["@class"];
  /**


*/
getLabel():string ;
}
/**
 Evaluation instance is the abstract parent of different kind of evaluation.
 <p>
 such an instance is the effective evaluation that corresponding to an
 EvaluationDescriptor
 <p>
 An evaluation instance belongs to a review, either as member of the feedback
 (through feedbackReview 'field' or as member of the feedback comments
 (through the 'commentsReview')

 
*/
// @ts-ignore 
abstract class SEvaluationInstance extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IEvaluationInstance>);
  public getEntity() : Readonly<IEvaluationInstance>;
getJSONClassName() : IEvaluationInstance["@class"];
  /**
 @Override
 @return index

*/
getIndex():number ;
  getId():number | undefined ;
  getDescriptorName():string ;
}
/**

 Grade evaluation instance

 
*/
// @ts-ignore 
class SGradeInstance extends SEvaluationInstance {
  public constructor(client: WegasClient, entity: Readonly<IGradeInstance>);
  public getEntity() : Readonly<IGradeInstance>;
  /**
 given grade

*/
getValue():number | undefined | null ;
getJSONClassName() : IGradeInstance["@class"];
}
/**

 Textual evaluation instance

 
*/
// @ts-ignore 
class STextEvaluationInstance extends SEvaluationInstance {
  public constructor(client: WegasClient, entity: Readonly<ITextEvaluationInstance>);
  public getEntity() : Readonly<ITextEvaluationInstance>;
  /**
 the evaluation itself

*/
getValue():string | undefined | null ;
getJSONClassName() : ITextEvaluationInstance["@class"];
}
/**
 Evaluation instance corresponding to CategorizedEvaluationDescriptor

 
*/
// @ts-ignore 
class SCategorizedEvaluationInstance extends SEvaluationInstance {
  public constructor(client: WegasClient, entity: Readonly<ICategorizedEvaluationInstance>);
  public getEntity() : Readonly<ICategorizedEvaluationInstance>;
  /**
 the chosen category (null means un-chosen)

*/
getValue():string ;
getJSONClassName() : ICategorizedEvaluationInstance["@class"];
}
// @ts-ignore 
abstract class SAbstractScope<T extends SInstanceOwner = SInstanceOwner> extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IAbstractScope>);
  public getEntity() : Readonly<IAbstractScope>;
getJSONClassName() : IAbstractScope["@class"];
  getId():number | undefined ;
}
// @ts-ignore 
class STeamScope extends SAbstractScope<STeam> {
  public constructor(client: WegasClient, entity: Readonly<ITeamScope>);
  public getEntity() : Readonly<ITeamScope>;
getJSONClassName() : ITeamScope["@class"];
}
// @ts-ignore 
class SPlayerScope extends SAbstractScope<SPlayer> {
  public constructor(client: WegasClient, entity: Readonly<IPlayerScope>);
  public getEntity() : Readonly<IPlayerScope>;
getJSONClassName() : IPlayerScope["@class"];
}
// @ts-ignore 
class SGameModelScope extends SAbstractScope<SGameModel> {
  public constructor(client: WegasClient, entity: Readonly<IGameModelScope>);
  public getEntity() : Readonly<IGameModelScope>;
getJSONClassName() : IGameModelScope["@class"];
}
/**

 
*/
// @ts-ignore 
class STranslatableContent extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<ITranslatableContent>);
  public getEntity() : Readonly<ITranslatableContent>;
  getVersion():number ;
getJSONClassName() : ITranslatableContent["@class"];
  getId():number | undefined ;
  /**


*/
getTranslations():{
  [key: string] :STranslation
} ;
}
/**
 @param <T>

 
*/
// @ts-ignore 
abstract class SVariableDescriptor<T extends SVariableInstance = SVariableInstance> extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IVariableDescriptor>);
  public getEntity() : Readonly<IVariableDescriptor>;
  /**

 The default instance for this variable.
 <p>
 According to WegasPatch spec, OVERRIDE should not be propagated to the instance when the
 descriptor is protected
 <p>
 Here we cannot use type T, otherwise jpa won't handle the db ref correctly

*/
getDefaultInstance():T ;
  getVersion():number ;
  getScopeType():'PlayerScope' | 'TeamScope' | 'GameModelScope' | undefined ;
getJSONClassName() : IVariableDescriptor["@class"];
  /**
 a token to prefix the label with. For editors only

*/
getEditorTag():string ;
  /**
 Variable descriptor human readable name Player visible

*/
getLabel():STranslatableContent ;
  /**
 variable name: used as identifier

*/
getName():string | undefined ;
  getBroadcastScope():'PlayerScope' | 'TeamScope' | 'GameModelScope' | undefined ;
  /**


*/
getComments():string ;
  getId():number | undefined ;
  getIsolation():'OPEN' | 'SECURED' | 'HIDDEN' | undefined ;
  getVisibility():'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE' | undefined ;


/**
 Fetch variable instance for the given player

 @param player

 @return variableInstance belonging to the player

*/
  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SVariableInstance>;
}
/**

 
*/
// @ts-ignore 
abstract class SQuestionDescriptor extends SVariableDescriptor<SQuestionInstance> {
  public constructor(client: WegasClient, entity: Readonly<IQuestionDescriptor>);
  public getEntity() : Readonly<IQuestionDescriptor>;
  /**
 Minimal number of replies required. Makes sense only with CBX-type questions. No default
 value.

*/
getMinReplies():number | undefined | null ;
getJSONClassName() : IQuestionDescriptor["@class"];
  /**
 Determines if choices are presented horizontally in a tabular fashion

*/
getTabular():boolean ;
  getItemsIds():number[] ;
  /**
 Set this to true when the choice is to be self radio/checkbox

*/
getCbx():boolean ;
  /**
 Total number of replies allowed. No default value (means infinity).

*/
getMaxReplies():number | undefined | null ;
  /**


*/
getDescription():STranslatableContent ;
  /**


*/
getPictures():string[] ;


/**
 @return the variableDescriptors

*/
  public abstract getItems() : Readonly<SChoiceDescriptor[]>;


/**

 @param p

 @return true if the player has already answers this question

*/
  public abstract isReplied(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**
 {@link #isReplied ...}

 @param p

 @return true if the player has not yet answers this question

*/
  public abstract isNotReplied(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**
 Is the

 @param p the player

 @return

*/
  public abstract isStillAnswerabled(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**
 Validate the question. One can no longer answer such a validated question.

 @param p
 @param value

*/
  public abstract setValidated(p: Readonly<SPlayer>, value: Readonly<boolean>, ) : Readonly<void>;


/**

 @param p

*/
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SQuestionInstance>;


/**

 @param p

 @return the player instance active status

*/
  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**
 Is the question validated. One can no longer answer such a validated question.

 @param p

 @return

*/
  public abstract getValidated(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
/**

 
*/
// @ts-ignore 
abstract class SBooleanDescriptor extends SVariableDescriptor<SBooleanInstance> {
  public constructor(client: WegasClient, entity: Readonly<IBooleanDescriptor>);
  public getEntity() : Readonly<IBooleanDescriptor>;
getJSONClassName() : IBooleanDescriptor["@class"];


/**

 @param p
 @return value of player p instance

*/
  public abstract getValue(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract isFalse(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SBooleanInstance>;


  public abstract setValue(p: Readonly<SPlayer>, v: Readonly<boolean>, ) : Readonly<void>;
}
/**
  @param <T>
 @param <U>

*/
// @ts-ignore 
abstract class SAbstractStateMachineDescriptor<T extends SAbstractState = SAbstractState,U extends SAbstractTransition = SAbstractTransition> extends SVariableDescriptor<SFSMInstance> {
  public constructor(client: WegasClient, entity: Readonly<IAbstractStateMachineDescriptor>);
  public getEntity() : Readonly<IAbstractStateMachineDescriptor>;
getJSONClassName() : IAbstractStateMachineDescriptor["@class"];
  /**


*/
getStates():{
  [key: number] :T
} ;


/**
 @param p

*/
  public abstract enable(p: Readonly<SPlayer>, ) : Readonly<void>;


/**
 @param p

*/
  public abstract disable(p: Readonly<SPlayer>, ) : Readonly<void>;


/**
 @param p

 @return is player instance enabled ?

*/
  public abstract isEnabled(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract wentThroughState(p: Readonly<SPlayer>, stateKey: Readonly<number>, ) : Readonly<boolean>;


/**
 @param p

 @return is player instance disabled ?

*/
  public abstract isDisabled(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SFSMInstance>;


  public abstract notWentThroughState(p: Readonly<SPlayer>, stateKey: Readonly<number>, ) : Readonly<boolean>;
}
// @ts-ignore 
abstract class SDialogueDescriptor extends SAbstractStateMachineDescriptor<SDialogueState,SDialogueTransition> {
  public constructor(client: WegasClient, entity: Readonly<IDialogueDescriptor>);
  public getEntity() : Readonly<IDialogueDescriptor>;
getJSONClassName() : IDialogueDescriptor["@class"];
  public abstract enable(p: Readonly<SPlayer>, ) : Readonly<void>;
  public abstract disable(p: Readonly<SPlayer>, ) : Readonly<void>;
  public abstract isEnabled(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract wentThroughState(p: Readonly<SPlayer>, stateKey: Readonly<number>, ) : Readonly<boolean>;
  public abstract isDisabled(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SFSMInstance>;
  public abstract notWentThroughState(p: Readonly<SPlayer>, stateKey: Readonly<number>, ) : Readonly<boolean>;
}
/**
 
*/
// @ts-ignore 
abstract class STriggerDescriptor extends SAbstractStateMachineDescriptor<STriggerState,STransition> {
  public constructor(client: WegasClient, entity: Readonly<ITriggerDescriptor>);
  public getEntity() : Readonly<ITriggerDescriptor>;
getJSONClassName() : ITriggerDescriptor["@class"];
  /**


*/
getTriggerEvent():SScript ;
  /**


*/
isDisableSelf():boolean ;
  /**


*/
isOneShot():boolean ;
  /**
 List of variable the condition depends on. Empty means the condition MUST be evaluated in all
 case

*/
getDependencies():STransitionDependency[] ;
  /**
 DependsOn strategy

*/
getDependsOnStrategy():'AUTO' | 'MANUAL' | undefined ;
  /**


*/
getPostTriggerEvent():SScript ;


  public abstract enable(p: Readonly<SPlayer>, ) : Readonly<void>;


  public abstract disable(p: Readonly<SPlayer>, ) : Readonly<void>;


  public abstract isEnabled(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract wentThroughState(p: Readonly<SPlayer>, stateKey: Readonly<number>, ) : Readonly<boolean>;


  public abstract isDisabled(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SFSMInstance>;


  public abstract notWentThroughState(p: Readonly<SPlayer>, stateKey: Readonly<number>, ) : Readonly<boolean>;
}
// @ts-ignore 
abstract class SFSMDescriptor extends SAbstractStateMachineDescriptor<SState,STransition> {
  public constructor(client: WegasClient, entity: Readonly<IFSMDescriptor>);
  public getEntity() : Readonly<IFSMDescriptor>;
getJSONClassName() : IFSMDescriptor["@class"];
  public abstract enable(p: Readonly<SPlayer>, ) : Readonly<void>;
  public abstract disable(p: Readonly<SPlayer>, ) : Readonly<void>;
  public abstract isEnabled(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract wentThroughState(p: Readonly<SPlayer>, stateKey: Readonly<number>, ) : Readonly<boolean>;
  public abstract isDisabled(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SFSMInstance>;
  public abstract notWentThroughState(p: Readonly<SPlayer>, stateKey: Readonly<number>, ) : Readonly<boolean>;
}
/**
 Descriptor of the Survey variable<br>

  @see SurveyDescriptor

*/
// @ts-ignore 
abstract class SSurveyDescriptor extends SVariableDescriptor<SSurveyInstance> {
  public constructor(client: WegasClient, entity: Readonly<ISurveyDescriptor>);
  public getEntity() : Readonly<ISurveyDescriptor>;
getJSONClassName() : ISurveyDescriptor["@class"];
  getDescriptionEnd():STranslatableContent ;
  /**
 True unless it should be hidden from trainer/scenarist listings.

*/
getIsPublished():boolean ;
  getItemsIds():number[] ;
  getDescription():STranslatableContent ;


/**
 {@link #isStarted ...}

 @param p

 @return true if the player has not yet started the survey

*/
  public abstract isNotClosed(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

*/
  public abstract request(p: Readonly<SPlayer>, ) : Readonly<void>;


/**
 {@link #isActive ...}

 @param p

 @return true if the player's survey is not active

*/
  public abstract isNotActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

 @return true if the player has already started the survey

*/
  public abstract isOngoing(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

 @return true if the player's survey is active

*/
  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

*/
  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;


/**
 @return the items (i.e. the sections)

*/
  public abstract getItems() : Readonly<SSurveySectionDescriptor[]>;


/**

 @param p

 @return true if the player has closed the survey

*/
  public abstract isClosed(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**
 {@link #isCompleted ...}

 @param p

 @return true if the player has not yet completed the survey

*/
  public abstract isNotCompleted(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

*/
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SSurveyInstance>;


/**

 @param p

*/
  public abstract complete(p: Readonly<SPlayer>, ) : Readonly<void>;


/**
 {@link #isStarted ...}

 @param p

 @return true if the player has not yet started the survey

*/
  public abstract isNotOngoing(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

*/
  public abstract close(p: Readonly<SPlayer>, ) : Readonly<void>;


/**

 @param p

 @return true if the player has already completed the survey

*/
  public abstract isCompleted(p: Readonly<SPlayer>, ) : Readonly<boolean>;
}
// @ts-ignore 
abstract class SBurndownDescriptor extends SVariableDescriptor<SBurndownInstance> {
  public constructor(client: WegasClient, entity: Readonly<IBurndownDescriptor>);
  public getEntity() : Readonly<IBurndownDescriptor>;
getJSONClassName() : IBurndownDescriptor["@class"];
  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SBurndownInstance>;
}
/**
 Wrapper for grouping input descriptors by theme

  @see SurveyInputDescriptor
 @see SurveyDescriptor

*/
// @ts-ignore 
abstract class SSurveySectionDescriptor extends SVariableDescriptor<SSurveySectionInstance> {
  public constructor(client: WegasClient, entity: Readonly<ISurveySectionDescriptor>);
  public getEntity() : Readonly<ISurveySectionDescriptor>;
getJSONClassName() : ISurveySectionDescriptor["@class"];
  getItemsIds():number[] ;
  /**
 Textual descriptor to be displayed to players

*/
getDescription():STranslatableContent ;


/**
 get items (i.e. list of inputs)

 @return list of SurveyInputDescriptor

*/
  public abstract getItems() : Readonly<SSurveyInputDescriptor[]>;


/**
 {@link #isActive ...}

 @param p

 @return true if the player's survey is not active

*/
  public abstract isNotActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

*/
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SSurveySectionInstance>;


/**

 @param p

 @return true if the player's survey is active

*/
  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

*/
  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
/**
 Static text defines a text at the descriptor level. Its instance does not contains anything

 
*/
// @ts-ignore 
abstract class SStaticTextDescriptor extends SVariableDescriptor<SStaticTextInstance> {
  public constructor(client: WegasClient, entity: Readonly<IStaticTextDescriptor>);
  public getEntity() : Readonly<IStaticTextDescriptor>;
getJSONClassName() : IStaticTextDescriptor["@class"];
  /**


*/
getText():STranslatableContent ;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SStaticTextInstance>;
}
/**

 
*/
// @ts-ignore 
abstract class SResourceDescriptor extends SVariableDescriptor<SResourceInstance> {
  public constructor(client: WegasClient, entity: Readonly<IResourceDescriptor>);
  public getEntity() : Readonly<IResourceDescriptor>;
getJSONClassName() : IResourceDescriptor["@class"];
  /**


*/
getProperties():{
  [key: string] :string
} ;
  /**


*/
getDescription():STranslatableContent ;


/**

 @param p
 @param time
 @param editable

*/
  public abstract addOccupation(p: Readonly<SPlayer>, time: Readonly<number>, editable: Readonly<boolean>, ) : Readonly<void>;


/**

 @param p

*/
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


/**

 @param p

 @return true is the player's resourceInstance is active

*/
  public abstract getActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p
 @param key
 @param value

*/
  public abstract addNumberAtInstanceProperty(p: Readonly<SPlayer>, key: Readonly<string>, value: Readonly<string>, ) : Readonly<void>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SResourceInstance>;


/**
 Get a resource instance property, cast to double

 @param p
 @param key

 @return value matching the key from given player's instance, cast to double, or Double.NaN

*/
  public abstract getNumberInstanceProperty(p: Readonly<SPlayer>, key: Readonly<string>, ) : Readonly<number>;


/**

 @param p
 @param key

 @return value matching the key from given player's instance

*/
  public abstract getStringInstanceProperty(p: Readonly<SPlayer>, key: Readonly<string>, ) : Readonly<string>;


  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
/**

 PeerReviewDescriptor allows peer-reviewing of variable between
 (scope-dependent) Player/Team (ie the "author" and the "reviewers").
 <p>
 A review: <ul>
 <li> is made for a specific variable ('toReview' VariableDescriptor)</li>
 <li> is define as, at least, one evaluation, defined as a 'feedback', wrapped
 within a container</li>
 <li> is done by several players/teams (reviewers) (up to
 'maxNumberOfReview'). Each author is reviewed the given number of times and
 is a 'reviewer' for the same number of others authors</li>
 </ul>
 <p>
 Moreover, feedbacks can be commented by the author. Such an evaluation is
 define within an EvaluationDescriptorContainer('fbComments', nested list can
 be empty)
 <p>
 The reviewing process consists of X stage:
 <ol>
 <li> not-started: author edit its 'toReview' variable instance</li>
 <li> submitted: 'toReview' instances no longer editable </li>
 <li> dispatched: variable turns read-only, reviewers are chosen by such an
 algorithm</li>
 </ol>

  @see EvaluationDescriptor
 @see PeerReviewInstance

*/
// @ts-ignore 
abstract class SPeerReviewDescriptor extends SVariableDescriptor<SPeerReviewInstance> {
  public constructor(client: WegasClient, entity: Readonly<IPeerReviewDescriptor>);
  public getEntity() : Readonly<IPeerReviewDescriptor>;
  /**
 the name of the variable to review. Only used for JSON de serialisation

*/
getToReviewName():string ;
getJSONClassName() : IPeerReviewDescriptor["@class"];
  /**
 Allow evicted users to receive something to review

*/
getIncludeEvicted():boolean ;
  /**
 List of evaluations that compose one feedback. Here, en empty list does
 not make any sense

*/
getFeedback():SEvaluationDescriptorContainer ;
  /**
 Expected number of reviews. The number of reviews may be smaller,
 especially is total number of team/player is too small
 <p>

*/
getMaxNumberOfReview():number ;
  getDescription():STranslatableContent ;
  /**
 List of evaluations that compose the feedbacks comments. Empty list is
 allowed

*/
getFbComments():SEvaluationDescriptorContainer ;


  public abstract setState(p: Readonly<SPlayer>, stateName: Readonly<string>, ) : Readonly<void>;


/**
 Get the review state of the given player's instance

 @param p the player

 @return player's instance state

*/
  public abstract getState(p: Readonly<SPlayer>, ) : Readonly<string>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SPeerReviewInstance>;
}
/**

 
*/
// @ts-ignore 
abstract class SChoiceDescriptor extends SVariableDescriptor<SChoiceInstance> {
  public constructor(client: WegasClient, entity: Readonly<IChoiceDescriptor>);
  public getEntity() : Readonly<IChoiceDescriptor>;
getJSONClassName() : IChoiceDescriptor["@class"];
  /**


*/
getDuration():number | undefined | null ;
  /**


*/
getResults():SResult[] ;
  /**
 Total number of replies allowed. No default value.

*/
getMaxReplies():number | undefined | null ;
  /**


*/
getDescription():STranslatableContent ;
  /**


*/
getCost():number | undefined | null ;


/**
 Does this choice has been validated by the given player
 <p>
 @param p the player
 <p>
 @return true if one or more question replies referencing this choice exist

*/
  public abstract hasBeenSelected(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**
 @param player
 @param resultName

 @throws com.wegas.core.exception.internal.WegasNoResultException

*/
  public abstract setCurrentResult(player: Readonly<SPlayer>, resultName: Readonly<string>, ) : Readonly<void>;


/**
 has the choice not (yet) been validated ? <br>
 Such a case happened for
 <ul>
 <li>MCQ Questions, after the question has been validated, for all unselected choices, or
 before the validation, for all choices</li>
 <li>Standard question, if the choice is not linked to any validated reply </li>
 </ul>

 @param p the player

 @return return true if this choice can be selected by the player

*/
  public abstract hasNotBeenSelected(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**
 has the choice been explicitely ignored ?
 <p>
 ie. the choice has not been selected and is no longer selectable

 @param p

 @return true only if the choice is not selectable any longer

*/
  public abstract hasBeenIgnored(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

*/
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


/**
 Does this result has been selected by the given player
 <p>
 @param p          the player
 @param resultName result name
 <p>
 @return true if one or more question reply referencing the given result exist

 @throws com.wegas.core.exception.internal.WegasNoResultException

*/
  public abstract hasResultBeenApplied(p: Readonly<SPlayer>, resultName: Readonly<string>, ) : Readonly<boolean>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SChoiceInstance>;


/**
 Is the player instance active ?

 @param p <p>
 @return player instance active status

*/
  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**
 Is the choice selectable. This method only cares about the choice itself not the whole
 question. It means is will return true even when the question is no longer answerable

 @param p

 @return

*/
  public abstract isSelectable(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
// @ts-ignore 
abstract class SSingleResultChoiceDescriptor extends SChoiceDescriptor {
  public constructor(client: WegasClient, entity: Readonly<ISingleResultChoiceDescriptor>);
  public getEntity() : Readonly<ISingleResultChoiceDescriptor>;
getJSONClassName() : ISingleResultChoiceDescriptor["@class"];
  public abstract hasBeenSelected(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract setCurrentResult(player: Readonly<SPlayer>, resultName: Readonly<string>, ) : Readonly<void>;
  public abstract hasNotBeenSelected(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract hasBeenIgnored(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;
  public abstract hasResultBeenApplied(p: Readonly<SPlayer>, resultName: Readonly<string>, ) : Readonly<boolean>;
  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SChoiceInstance>;
  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract isSelectable(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
/**

 
*/
// @ts-ignore 
abstract class SStringDescriptor extends SVariableDescriptor<SStringInstance> {
  public constructor(client: WegasClient, entity: Readonly<IStringDescriptor>);
  public getEntity() : Readonly<IStringDescriptor>;
getJSONClassName() : IStringDescriptor["@class"];
  /**
 If several allowed values are selectable, is their order relevant ?

*/
getSortable():boolean | undefined | null ;
  /**
 Maximum number of allowed values a user can select

*/
getMaxSelectable():number | undefined | null ;
  /**


*/
getValidationPattern():string | undefined | null ;
  /**
 List of allowed categories

*/
getAllowedValues():SEnumItem[] ;


/**

 @param p

 @return value of player instance

*/
  public abstract getValue(p: Readonly<SPlayer>, ) : Readonly<string>;


/**

 @param p
 @param value

 @return

*/
  public abstract isValueSelected(p: Readonly<SPlayer>, value: Readonly<string>, ) : Readonly<boolean>;


/**

 @param p
 @param expectedValues list of expected value
 @param strictOrder    is values order important ?

 @return

*/
  public abstract areSelectedValues(p: Readonly<SPlayer>, expectedValues: Readonly<string[]>, strictOrder: Readonly<boolean>, ) : Readonly<boolean>;


/**

 @param p
 @param value

*/
  public abstract setValue(p: Readonly<SPlayer>, value: Readonly<STranslatableContent>, ) : Readonly<void>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SStringInstance>;


/**

 @param p
 @param value

 @return

*/
  public abstract isNotSelectedValue(p: Readonly<SPlayer>, value: Readonly<string>, ) : Readonly<boolean>;


/**
 Count the number of selected values

 @param p the player

 @return

*/
  public abstract countSelectedValues(p: Readonly<SPlayer>, ) : Readonly<number>;


/**
 Get the position of the value, starting at position 1

 @param p     instance owner
 @param value the value to search

 @return position of the value or null if value not present

*/
  public abstract getPositionOfValue(p: Readonly<SPlayer>, value: Readonly<string>, ) : Readonly<number> | null;
}
/**

 
*/
// @ts-ignore 
abstract class SAchievementDescriptor extends SVariableDescriptor<SAchievementInstance> {
  public constructor(client: WegasClient, entity: Readonly<IAchievementDescriptor>);
  public getEntity() : Readonly<IAchievementDescriptor>;
  /**
 The quest this achievement is part of

*/
getQuest():string ;
getJSONClassName() : IAchievementDescriptor["@class"];
  /**
 Weight of the achievement. Used to compute compute quest completion.

*/
getWeight():number ;
  /**
 Message to display when the achievement is unlocked

*/
getMessage():STranslatableContent ;
  /**
 A HTM/hex color

*/
getColor():string ;
  /**
 An icon name

*/
getIcon():string ;


/**
 mark the achievement as achieved or not

 @param p        the player
 @param achieved achieved or not

*/
  public abstract setAchieved(p: Readonly<SPlayer>, achieved: Readonly<boolean>, ) : Readonly<void>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SAchievementInstance>;


/**
 Was the achievement achieved?

 @param p the player

 @return true if the achievement has been achieved

*/
  public abstract isAchieved(p: Readonly<SPlayer>, ) : Readonly<boolean>;
}
/**

 
*/
// @ts-ignore 
abstract class SObjectDescriptor extends SVariableDescriptor<SObjectInstance> {
  public constructor(client: WegasClient, entity: Readonly<IObjectDescriptor>);
  public getEntity() : Readonly<IObjectDescriptor>;
getJSONClassName() : IObjectDescriptor["@class"];
  /**


*/
getProperties():{
  [key: string] :string
} ;
  /**


*/
getDescription():string ;


/**
 Returns the value of the 'key' propery in the player instance

 @param p
 @param key

 @return the value of the property in the player instance

*/
  public abstract getProperty(p: Readonly<SPlayer>, key: Readonly<string>, ) : Readonly<string>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SObjectInstance>;


/**

 @param p

 @return number of property in the payer instance

*/
  public abstract size(p: Readonly<SPlayer>, ) : Readonly<number>;


/**

 @param p
 @param key
 @param value

*/
  public abstract setProperty(p: Readonly<SPlayer>, key: Readonly<string>, value: Readonly<string>, ) : Readonly<void>;
}
/**

 A survey input descriptor is the abstract parent of different kinds of input descriptors.

 
*/
// @ts-ignore 
abstract class SSurveyInputDescriptor extends SVariableDescriptor<SSurveyInputInstance> {
  public constructor(client: WegasClient, entity: Readonly<ISurveyInputDescriptor>);
  public getEntity() : Readonly<ISurveyInputDescriptor>;
  /**
 Tells if a reply to this input/question is compulsory

*/
getIsCompulsory():boolean ;
getJSONClassName() : ISurveyInputDescriptor["@class"];
  /**
 Textual descriptor to be displayed to players

*/
getDescription():STranslatableContent ;


/**

 @param p

*/
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


/**
 {@link #isActive ...}

 @param p

 @return true if the player's survey is not active

*/
  public abstract isNotActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SSurveyInputInstance>;


/**

 @param p

 @return true if the player's survey is active

*/
  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

*/
  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
/**
 Define an grade-like evaluation by defined a scale (min and max)

 
*/
// @ts-ignore 
abstract class SSurveyNumberDescriptor extends SSurveyInputDescriptor {
  public constructor(client: WegasClient, entity: Readonly<ISurveyNumberDescriptor>);
  public getEntity() : Readonly<ISurveyNumberDescriptor>;
  getMinValue():number | undefined | null ;
  /**
 Tells if this input should be presented as a scale

*/
getIsScale():boolean ;
getJSONClassName() : ISurveyNumberDescriptor["@class"];
  getMaxValue():number | undefined | null ;
  /**
 Optional measurement unit (years, percent, etc.) Player visible

*/
getUnit():STranslatableContent ;


  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


  public abstract isNotActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SSurveyInputInstance>;


  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
// @ts-ignore 
abstract class SSurveyTextDescriptor extends SSurveyInputDescriptor {
  public constructor(client: WegasClient, entity: Readonly<ISurveyTextDescriptor>);
  public getEntity() : Readonly<ISurveyTextDescriptor>;
getJSONClassName() : ISurveyTextDescriptor["@class"];
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;
  public abstract isNotActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SSurveyInputInstance>;
  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;
  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
/**
 Define a survey input as a labeled choice. For instance : [ very bad ; bad ; acceptable ; good ;
 very good ], [true ; false]

  
*/
// @ts-ignore 
abstract class SSurveyChoicesDescriptor extends SSurveyInputDescriptor {
  public constructor(client: WegasClient, entity: Readonly<ISurveyChoicesDescriptor>);
  public getEntity() : Readonly<ISurveyChoicesDescriptor>;
  /**
 Tells if these choices should be presented as a scale

*/
getIsScale():boolean ;
getJSONClassName() : ISurveyChoicesDescriptor["@class"];
  /**
 Maximum number of allowed values a user can select

*/
getMaxSelectable():number | undefined | null ;
  /**
 Tells if these choices should be presented as an analog slider

*/
getIsSlider():boolean ;
  /**
 List of allowed choices

*/
getChoices():SEnumItem[] ;


  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


  public abstract isNotActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SSurveyInputInstance>;


  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
/**

 
*/
// @ts-ignore 
abstract class SWhQuestionDescriptor extends SVariableDescriptor<SWhQuestionInstance> {
  public constructor(client: WegasClient, entity: Readonly<IWhQuestionDescriptor>);
  public getEntity() : Readonly<IWhQuestionDescriptor>;
getJSONClassName() : IWhQuestionDescriptor["@class"];
  getItemsIds():number[] ;
  /**


*/
getDescription():STranslatableContent ;


/**
 @return the variableDescriptors

*/
  public abstract getItems() : Readonly<SVariableDescriptor[]>;


/**

 @param p

 @return true if the player has already answers this question

*/
  public abstract isReplied(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**
 {@link #isReplied ...}

 @param p

 @return true if the player has not yet answers this question

*/
  public abstract isNotReplied(p: Readonly<SPlayer>, ) : Readonly<boolean>;


  public abstract reopen(p: Readonly<SPlayer>, ) : Readonly<void>;


/**

 @param p

*/
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


  public abstract getFeedback(p: Readonly<SPlayer>, ) : Readonly<string>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SWhQuestionInstance>;


/**

 @param p

 @return the player instance active status

*/
  public abstract isActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p

*/
  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;


/**

 @param p
 @param value

*/
  public abstract setFeedback(p: Readonly<SPlayer>, value: Readonly<STranslatableContent>, ) : Readonly<void>;
}
/**

 
*/
// @ts-ignore 
abstract class STextDescriptor extends SVariableDescriptor<STextInstance> {
  public constructor(client: WegasClient, entity: Readonly<ITextDescriptor>);
  public getEntity() : Readonly<ITextDescriptor>;
getJSONClassName() : ITextDescriptor["@class"];


/**

 @param p

 @return value of player instance

*/
  public abstract getValue(p: Readonly<SPlayer>, ) : Readonly<string>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<STextInstance>;


/**

 @param p
 @param value

*/
  public abstract setValue(p: Readonly<SPlayer>, value: Readonly<STranslatableContent>, ) : Readonly<void>;


  public abstract setValueIfChanged(p: Readonly<SPlayer>, newValue: Readonly<STranslatableContent>, ) : Readonly<void>;
}
/**

 
*/
// @ts-ignore 
abstract class SInboxDescriptor extends SVariableDescriptor<SInboxInstance> {
  public constructor(client: WegasClient, entity: Readonly<IInboxDescriptor>);
  public getEntity() : Readonly<IInboxDescriptor>;
  /**
 Tells if the inbox has a capacity of just one message.

*/
getCapped():boolean ;
getJSONClassName() : IInboxDescriptor["@class"];


/**

 @param p

 @return check if the given player's inbox is empty

*/
  public abstract isEmpty(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 I18n Sugar to be used from scripts.

 @param p           message recipient
 @param from        message sender
 @param subject     message subject
 @param body        message body
 @param date        the date the message has been sent (free text, eg. 'Monday Morning', 'may
                    the 4th', 'thrid period', and so on)
 @param token       internal message identifier (can be used within a
                    {@link #isTokenMarkedAsRead script condition} to check whether or not
                    message has been read)
 @param attachments

 @return

*/
  public abstract sendMessage(p: Readonly<SPlayer>, from: Readonly<STranslatableContent>, date: Readonly<STranslatableContent>, subject: Readonly<STranslatableContent>, body: Readonly<STranslatableContent>, token: Readonly<string>, attachments: Readonly<SAttachment[]>, ) : Readonly<SMessage>;


/**
 Check message read status

 @param self
 @param token

 @return true is a message identified by the token exists and has been read, false otherwise

*/
  public abstract isTokenMarkedAsRead(self: Readonly<SPlayer>, token: Readonly<string>, ) : Readonly<boolean>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SInboxInstance>;
}
/**

 
*/
// @ts-ignore 
abstract class SListDescriptor extends SVariableDescriptor<SListInstance> {
  public constructor(client: WegasClient, entity: Readonly<IListDescriptor>);
  public getEntity() : Readonly<IListDescriptor>;
getJSONClassName() : IListDescriptor["@class"];
  /**
 List of allowed children types

*/
getAllowedTypes():string[] ;
  /**
 shortcut to show within (+) treeview button, must match allowedTypes

*/
getAddShortcut():string ;
  getItemsIds():number[] ;


/**
 @return the variableDescriptors

*/
  public abstract getItems() : Readonly<SVariableDescriptor[]>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SListInstance>;
}
/**

 

*/
// @ts-ignore 
abstract class STaskDescriptor extends SVariableDescriptor<STaskInstance> {
  public constructor(client: WegasClient, entity: Readonly<ITaskDescriptor>);
  public getEntity() : Readonly<ITaskDescriptor>;
getJSONClassName() : ITaskDescriptor["@class"];
  /**


*/
getIndex():string ;
  /**


*/
getProperties():{
  [key: string] :string
} ;
  /**


*/
getDescription():STranslatableContent ;
  /**


*/
getPredecessorNames():string[] ;


/**

 @param p

*/
  public abstract activate(p: Readonly<SPlayer>, ) : Readonly<void>;


/**

 @param p
 @param key
 @param value

*/
  public abstract setInstanceProperty(p: Readonly<SPlayer>, key: Readonly<string>, value: Readonly<string>, ) : Readonly<void>;


/**

 @param p

 @return true if the player instance is active

*/
  public abstract getActive(p: Readonly<SPlayer>, ) : Readonly<boolean>;


/**

 @param p
 @param key
 @param value

*/
  public abstract addNumberAtInstanceProperty(p: Readonly<SPlayer>, key: Readonly<string>, value: Readonly<string>, ) : Readonly<void>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<STaskInstance>;


/**
 get and cast a player's instance property to double

 @param p
 @param key

 @return double castes player instance property

*/
  public abstract getNumberInstanceProperty(p: Readonly<SPlayer>, key: Readonly<string>, ) : Readonly<number>;


/**

 @param p
 @param key

 @return player instance string property

*/
  public abstract getStringInstanceProperty(p: Readonly<SPlayer>, key: Readonly<string>, ) : Readonly<string>;


  public abstract deactivate(p: Readonly<SPlayer>, ) : Readonly<void>;
}
/**

 
*/
// @ts-ignore 
abstract class SNumberDescriptor extends SVariableDescriptor<SNumberInstance> {
  public constructor(client: WegasClient, entity: Readonly<INumberDescriptor>);
  public getEntity() : Readonly<INumberDescriptor>;
  /**


*/
getMinValue():number | undefined | null ;
getJSONClassName() : INumberDescriptor["@class"];
  /**


*/
getMaxValue():number | undefined | null ;
  /**


*/
getHistorySize():number | undefined | null ;
  /**

 @return the defaule value

*/
getDefaultValue():number | undefined ;


/**

 @param p
 @param value

*/
  public abstract add(p: Readonly<SPlayer>, value: Readonly<number>, ) : Readonly<void>;


/**

 @param p

 @return value of player p instance

*/
  public abstract getValue(p: Readonly<SPlayer>, ) : Readonly<number>;


  public abstract getInstance(player: Readonly<SPlayer>, ) : Readonly<SNumberInstance>;


/**

 @param p
 @param value

*/
  public abstract setValue(p: Readonly<SPlayer>, value: Readonly<number>, ) : Readonly<void>;
}
/**
 A review is linked to two PeerReviewInstnace : the one who reviews and the original reviewed
 'author' A review is composed of the feedback (written by reviewers) and the feedback comments
 (written by author). Both are a list of evaluation instances
 <ol>
 <li> dispatched: initial state, reviewer can edit feedback
 <li> reviewed: reviewer can't edit feedback anymore, author can't read feedback yet
 <li> notified: author has access to the feedback and can edit feedback comments
 <li> completed: feedback comments turns read-only, not yet visible by peers
 <li>
 <li> closed: feedback comments is visible by the reviewer <li>
 </ol>

 
*/
// @ts-ignore 
class SReview extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IReview>);
  public getEntity() : Readonly<IReview>;
getJSONClassName() : IReview["@class"];
  /**
 Current review state

*/
getReviewState():'DISPATCHED' | 'REVIEWED' | 'NOTIFIED' | 'COMPLETED' | 'CLOSED' ;
  /**
 List of evaluation instances that compose the feedback evaluation (writable by 'author' only)

*/
getComments():SEvaluationInstance[] ;
  getId():number | undefined ;
  /**
 List of evaluation instances that compose the feedback (writable by 'reviewer' only)

*/
getFeedback():SEvaluationInstance[] ;
}
/**
 PMG Related !


 
*/
// @ts-ignore 
class SIteration extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IIteration>);
  public getEntity() : Readonly<IIteration>;
  getTaskNames():string[] ;
  /**
 Period number the iteration shall start on

*/
getBeginAt():number ;
getJSONClassName() : IIteration["@class"];
  /**
 Iteration Name

*/
getName():string ;
  /**
 maps a period number with workload for past period and current one: indicates the total remaining workload for
 the corresponding period.

*/
getPeriods():SIterationPeriod[] ;
  getId():number | undefined ;
  /**
 SPI-like indicator, based on workloads. WSPI

*/
getWspi():number ;
  /**


*/
getCreatedTime():number ;
  getCpi():number ;
}
// @ts-ignore 
class SShadow extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IShadow>);
  public getEntity() : Readonly<IShadow>;
getJSONClassName() : IShadow["@class"];
  getId():number | undefined ;
}
// @ts-ignore 
class SDestroyedEntity extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IDestroyedEntity>);
  public getEntity() : Readonly<IDestroyedEntity>;
getJSONClassName() : IDestroyedEntity["@class"];
  getId():number | undefined ;
}
/**

 
*/
// @ts-ignore 
class SMessage extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IMessage>);
  public getEntity() : Readonly<IMessage>;
  /**


*/
getAttachments():SAttachment[] ;
  /**


*/
getSubject():STranslatableContent ;
getJSONClassName() : IMessage["@class"];
  /**


*/
getUnread():boolean ;
  /**
 Message body

*/
getBody():STranslatableContent ;
  /**
 real world time for sorting purpose

*/
getTime():number | undefined ;
  /**
 Kind of message identifier

*/
getToken():string ;
  getId():number | undefined ;
  /**
 Simulation date, for display purpose

*/
getDate():STranslatableContent ;
  /**


*/
getFrom():STranslatableContent ;
}
/**
 
*/
// @ts-ignore 
class SUser extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IUser>);
  public getEntity() : Readonly<IUser>;
getJSONClassName() : IUser["@class"];
  /**
 Shortcut for getMainAccount().getName();

 @return main account name or unnamed if user doesn't have any account

*/
getName():string | null ;
  getId():number | undefined ;
  getLastSeenAt():number | undefined | null ;
}
/**

 
*/
// @ts-ignore 
abstract class SAbstractAssignement extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IAbstractAssignement>);
  public getEntity() : Readonly<IAbstractAssignement>;
getJSONClassName() : IAbstractAssignement["@class"];
  getTaskDescriptorName():string ;
}
// @ts-ignore 
class SAssignment extends SAbstractAssignement {
  public constructor(client: WegasClient, entity: Readonly<IAssignment>);
  public getEntity() : Readonly<IAssignment>;
getJSONClassName() : IAssignment["@class"];
  getId():number | undefined ;
}
/**

 
*/
// @ts-ignore 
class SActivity extends SAbstractAssignement {
  public constructor(client: WegasClient, entity: Readonly<IActivity>);
  public getEntity() : Readonly<IActivity>;
getJSONClassName() : IActivity["@class"];
  /**
 worked time ? strange spelling...

*/
getTime():number ;
  getRequirementName():string ;
  getId():number | undefined ;
  /**
 Start time

*/
getStartTime():number ;
  /**


*/
getCompletion():number ;
}
/**

 
*/
// @ts-ignore 
class SEnumItem extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IEnumItem>);
  public getEntity() : Readonly<IEnumItem>;
getJSONClassName() : IEnumItem["@class"];
  /**
 Internal identifier

*/
getName():string | undefined ;
  getLabel():STranslatableContent ;
  getId():number | undefined ;
}
/**
 
*/
// @ts-ignore 
abstract class SAbstractState<T extends SAbstractTransition = SAbstractTransition> extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IAbstractState>);
  public getEntity() : Readonly<IAbstractState>;
  getVersion():number ;
  /**


*/
getTransitions():T[] ;
  /**


*/
getX():number ;
getJSONClassName() : IAbstractState["@class"];
  /**


*/
getY():number ;
  /**


*/
getIndex():number | undefined ;
  getId():number | undefined ;
  /**


*/
getOnEnterEvent():SScript ;
}
/**
 
*/
// @ts-ignore 
class SState extends SAbstractState<STransition> {
  public constructor(client: WegasClient, entity: Readonly<IState>);
  public getEntity() : Readonly<IState>;
getJSONClassName() : IState["@class"];
  /**


*/
getLabel():string ;
}
/**

 
*/
// @ts-ignore 
class SDialogueState extends SAbstractState<SDialogueTransition> {
  public constructor(client: WegasClient, entity: Readonly<IDialogueState>);
  public getEntity() : Readonly<IDialogueState>;
getJSONClassName() : IDialogueState["@class"];
  /**


*/
getText():STranslatableContent ;
}
// @ts-ignore 
class STriggerState extends SAbstractState<STransition> {
  public constructor(client: WegasClient, entity: Readonly<ITriggerState>);
  public getEntity() : Readonly<ITriggerState>;
getJSONClassName() : ITriggerState["@class"];
}
// @ts-ignore 
class SGameTeams extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IGameTeams>);
  public getEntity() : Readonly<IGameTeams>;
getJSONClassName() : IGameTeams["@class"];
  getId():number | undefined ;
}
/**
 
*/
// @ts-ignore 
class SRole extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IRole>);
  public getEntity() : Readonly<IRole>;
getJSONClassName() : IRole["@class"];
  /**


*/
getName():string ;
  /**


*/
getPermissions():SPermission[] ;
  /**
 count the number of user with this role

 @return member's count

*/
getNumberOfMember():number ;
  getId():number | undefined ;
  /**


*/
getDescription():string ;
}
/**

 
*/
// @ts-ignore 
class SGameModelContent extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IGameModelContent>);
  public getEntity() : Readonly<IGameModelContent>;
  getVersion():number ;
getJSONClassName() : IGameModelContent["@class"];
  /**


*/
getContent():string ;
  getContentKey():string ;
  /**
 MIME type. This is not the same as the library type. For instance one may define a
 type:ClientScript library with aa application/javascript MIME type and another ClientScript
 with application/typescript mimetype.

*/
getContentType():string ;
  getId():number | undefined ;
  getVisibility():'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE' | undefined ;
}
/**
 
*/
// @ts-ignore 
abstract class SAbstractAccount extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IAbstractAccount>);
  public getEntity() : Readonly<IAbstractAccount>;
  /**
 When the terms of use have been agreed to by the user (usually at signup, except for guests
 and long time users)

*/
getAgreedTime():number ;
getJSONClassName() : IAbstractAccount["@class"];
  getEmailDomain():string | undefined | null ;
  /**


*/
getFirstname():string ;
  isVerified():boolean | undefined | null ;
  /**


*/
getEmail():string ;
  getId():number | undefined ;
  /**
 Optional remarks only visible to admins

*/
getComment():string ;
  /**


*/
getLastname():string ;
  /**


*/
getUsername():string ;
}
/**
 Simple class that represents any User domain entity in any application.

 
*/
// @ts-ignore 
class SJpaAccount extends SAbstractAccount {
  public constructor(client: WegasClient, entity: Readonly<IJpaAccount>);
  public getEntity() : Readonly<IJpaAccount>;
  /**


*/
getPassword():string | undefined | null ;
getJSONClassName() : IJpaAccount["@class"];
  isVerified():boolean | undefined | null ;
  /**
 if defined, this salt must be used to salt the password hashed with
 {@link #nextAuth optional hash method}

*/
getNewSalt():string | undefined | null ;
  /**
 Salt used by the client to hash its password. This is not the salt used to store the password
 in the database. The client hash its salted password using the
 {@link  #currentAuth mandatory hash method}. Then, this hash is salted and hashed again by
 {@link Shadow}

*/
getSalt():string | undefined | null ;
}
// @ts-ignore 
class SGuestJpaAccount extends SAbstractAccount {
  public constructor(client: WegasClient, entity: Readonly<IGuestJpaAccount>);
  public getEntity() : Readonly<IGuestJpaAccount>;
getJSONClassName() : IGuestJpaAccount["@class"];
  isVerified():boolean | undefined | null ;
}
/**
 
*/
// @ts-ignore 
class SAaiAccount extends SAbstractAccount {
  public constructor(client: WegasClient, entity: Readonly<IAaiAccount>);
  public getEntity() : Readonly<IAaiAccount>;
  getHomeOrg():string ;
getJSONClassName() : IAaiAccount["@class"];
  isVerified():boolean | undefined | null ;
  getPersistentId():string ;
}
/**

 
*/
// @ts-ignore 
class SPlayer extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IPlayer>);
  public getEntity() : Readonly<IPlayer>;
  /**
 @return the joinTime

*/
getJoinTime():number | undefined | null ;
  getVersion():number ;
  getHomeOrg():string ;
  getQueueSize():number | undefined | null ;
getJSONClassName() : IPlayer["@class"];
  /**
 @return the name

*/
getName():string ;
  isVerifiedId():boolean ;
  /**
 RefName of player preferred language

*/
getLang():string ;
  getId():number | undefined ;
  getStatus():'SURVEY' | 'WAITING' | 'RESCHEDULED' | 'PROCESSING' | 'SEC_PROCESSING' | 'INITIALIZING' | 'LIVE' | 'FAILED' | 'DELETED' | undefined | null ;
  /**
 @return the userId

*/
getUserId():number | undefined | null ;
}
// @ts-ignore 
class SAccountDetails extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IAccountDetails>);
  public getEntity() : Readonly<IAccountDetails>;
getJSONClassName() : IAccountDetails["@class"];
  getId():number | undefined ;
}
/**
 PMG Related !

 
*/
// @ts-ignore 
class SIterationEvent extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IIterationEvent>);
  public getEntity() : Readonly<IIterationEvent>;
getJSONClassName() : IIterationEvent["@class"];
  getTaskName():string ;
  getEventType():'ADD_TASK' | 'REMOVE_TASK' | 'START_TASK' | 'COMPLETE_TASK' | 'WORKLOAD_ADJUSTMENT' | 'SPENT_ADJUSTMENT' | 'BUDGETED_ADJUSTMENT' ;
  /**
 Period subdivision step

*/
getStep():number ;
  getId():number | undefined ;
  /**
 some payload

*/
getData():string ;
}
/**
 
*/
// @ts-ignore 
class SResult extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IResult>);
  public getEntity() : Readonly<IResult>;
  getVersion():number ;
getJSONClassName() : IResult["@class"];
  /**
 Internal Name

*/
getName():string | undefined ;
  /**
 Displayed name

*/
getLabel():STranslatableContent ;
  /**


*/
getImpact():SScript ;
  /**
 Displayed answer when result selected and validated

*/
getAnswer():STranslatableContent ;
  getId():number | undefined ;
  /**


*/
getIgnorationImpact():SScript ;
  /**
 Displayed answer when MCQ result not selected and validated

*/
getIgnorationAnswer():STranslatableContent ;
  getFiles():string[] ;
}
/**

 
*/
// @ts-ignore 
class SAttachment extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IAttachment>);
  public getEntity() : Readonly<IAttachment>;
getJSONClassName() : IAttachment["@class"];
  getId():number | undefined ;
  /**
 URI

*/
getFile():STranslatableContent ;
}
/**
 
*/
// @ts-ignore 
class SReply extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IReply>);
  public getEntity() : Readonly<IReply>;
getJSONClassName() : IReply["@class"];
  /**


*/
isValidated():boolean ;
  /**


*/
getUnread():boolean ;
  getAnswer():STranslatableContent | undefined | null ;
  getResultName():string ;
  getId():number | undefined ;
  /**
 <p>

*/
getStartTime():number ;
  getChoiceName():string ;
  /**


*/
getIgnored():boolean ;
  getFiles():string[] | undefined | null ;
  getIgnorationAnswer():STranslatableContent | undefined | null ;
  getCreatedTime():number ;
}
/**

 
*/
// @ts-ignore 
class SOccupation extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IOccupation>);
  public getEntity() : Readonly<IOccupation>;
getJSONClassName() : IOccupation["@class"];
  /**


*/
getTime():number ;
  /**


*/
getEditable():boolean ;
  getId():number | undefined ;
}
/**
 PMG Related !

 
*/
// @ts-ignore 
class SIterationPeriod extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IIterationPeriod>);
  public getEntity() : Readonly<IIterationPeriod>;
getJSONClassName() : IIterationPeriod["@class"];
  /**
 actual cost

*/
getAc():number ;
  /**
 pw "done" during this period

*/
getPw():number ;
  /**
 Period subdivision step

*/
getLastWorkedStep():number ;
  getId():number | undefined ;
  getIterationEvents():SIterationEvent[] ;
  /**
 Ev adjustment at start

*/
getDeltaEv():number ;
  /**
 Planned workload

*/
getPlanned():number ;
  /**
 earned workload "done" during this period

*/
getEw():number ;
  /**
 Replanned workload

*/
getReplanned():number ;
  getAw():number ;
  /**
 AC adjustment at start

*/
getDeltaAc():number ;
  /**
 delta period number

*/
getPeriodNumber():number ;
  /**
 earned value

*/
getEv():number ;
  /**
 workload to do adjustment

*/
getDeltaAtStart():number ;
}
/**
 
*/
// @ts-ignore 
class STeam extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<ITeam>);
  public getEntity() : Readonly<ITeam>;
  getDeclaredSize():number | undefined | null ;
getJSONClassName() : ITeam["@class"];
  /**
 @return the game ui version

*/
getUiVersion():number | undefined | null ;
  /**


*/
getName():string | undefined | null ;
  /**


*/
getNotes():string | undefined | null ;
  getId():number | undefined ;
  getStatus():'SURVEY' | 'WAITING' | 'RESCHEDULED' | 'PROCESSING' | 'SEC_PROCESSING' | 'INITIALIZING' | 'LIVE' | 'FAILED' | 'DELETED' | undefined | null ;
  /**
 @return the players

*/
getPlayers():SPlayer[] ;
}
// @ts-ignore 
class SDebugTeam extends STeam {
  public constructor(client: WegasClient, entity: Readonly<IDebugTeam>);
  public getEntity() : Readonly<IDebugTeam>;
getJSONClassName() : IDebugTeam["@class"];
}
/**

 An evaluation descriptor is the abstract parent of different kind of
 evaluation description.
 <p>
 Such en evaluation is either one that compose a feedback (ie the review of a
 variable) or one that compose a feedback evaluation (ie the evaluation of a
 review of a variable)

  @param <T> corresponding Evaluation Instance

*/
// @ts-ignore 
abstract class SEvaluationDescriptor<T extends SEvaluationInstance = SEvaluationInstance> extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IEvaluationDescriptor>);
  public getEntity() : Readonly<IEvaluationDescriptor>;
getJSONClassName() : IEvaluationDescriptor["@class"];
  /**
 Evaluation internal identifier

*/
getName():string | undefined ;
  /**
 Evaluation label as displayed to players

*/
getLabel():STranslatableContent ;
  getId():number | undefined ;
  /**
 Textual descriptor to be displayed to players

*/
getDescription():STranslatableContent ;
}
// @ts-ignore 
class STextEvaluationDescriptor extends SEvaluationDescriptor<STextEvaluationInstance> {
  public constructor(client: WegasClient, entity: Readonly<ITextEvaluationDescriptor>);
  public getEntity() : Readonly<ITextEvaluationDescriptor>;
getJSONClassName() : ITextEvaluationDescriptor["@class"];
}
/**
 Define an evaluation as a categorisation. For instance : [ very bad ; bad ;
 acceptable ; good ; very good ], [true ; false], [off topic, irrelevant,
 relevant]


 
*/
// @ts-ignore 
class SCategorizedEvaluationDescriptor extends SEvaluationDescriptor<SCategorizedEvaluationInstance> {
  public constructor(client: WegasClient, entity: Readonly<ICategorizedEvaluationDescriptor>);
  public getEntity() : Readonly<ICategorizedEvaluationDescriptor>;
getJSONClassName() : ICategorizedEvaluationDescriptor["@class"];
  /**
 List of allowed categories

*/
getCategories():SEnumItem[] ;
}
/**
 Define an grade-like evaluation by defined a scale (min and max)

 
*/
// @ts-ignore 
class SGradeDescriptor extends SEvaluationDescriptor<SGradeInstance> {
  public constructor(client: WegasClient, entity: Readonly<IGradeDescriptor>);
  public getEntity() : Readonly<IGradeDescriptor>;
  getMinValue():number | undefined | null ;
getJSONClassName() : IGradeDescriptor["@class"];
  getMaxValue():number | undefined | null ;
}
/**
 
*/
// @ts-ignore 
abstract class SVariableInstance extends SAbstractEntity {
  public constructor(client: WegasClient, entity: Readonly<IVariableInstance>);
  public getEntity() : Readonly<IVariableInstance>;
  getVersion():number ;
getJSONClassName() : IVariableInstance["@class"];
  getId():number | undefined ;
  getScopeKey():number | undefined | null ;
}
/**
 
*/
// @ts-ignore 
class SBurndownInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IBurndownInstance>);
  public getEntity() : Readonly<IBurndownInstance>;
getJSONClassName() : IBurndownInstance["@class"];
  getIterations():SIteration[] ;
}
/**
 Instance of the PeerReviewDescriptor variable Author:<br />
 - has to review several other authors: <code>toReview</code> Review
 list<br />
 - is reviewed by several other authors: <code>reviewed</code> Review list The
 review is in a specific state, see PeerReviewDescriptor

  @see PeerReviewDescriptor

*/
// @ts-ignore 
class SPeerReviewInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IPeerReviewInstance>);
  public getEntity() : Readonly<IPeerReviewInstance>;
getJSONClassName() : IPeerReviewInstance["@class"];
  /**
 List of review that contains feedback written by player owning this

*/
getToReview():SReview[] ;
  /**
 List of review that contains others feedback

*/
getReviewed():SReview[] ;
  /**
 Current review state

*/
getReviewState():'DISCARDED' | 'EVICTED' | 'NOT_STARTED' | 'SUBMITTED' | 'DISPATCHED' | 'NOTIFIED' | 'COMPLETED' ;
}
/**

 
*/
// @ts-ignore 
class STaskInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<ITaskInstance>);
  public getEntity() : Readonly<ITaskInstance>;
  /**


*/
getPlannification():number[] ;
getJSONClassName() : ITaskInstance["@class"];
  /**


*/
getRequirements():SWRequirement[] ;
  /**


*/
getProperties():{
  [key: string] :string
} ;
  /**


*/
getActive():boolean ;
}
/**
 
*/
// @ts-ignore 
class SNumberInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<INumberInstance>);
  public getEntity() : Readonly<INumberInstance>;
  /**


*/
getValue():number ;
getJSONClassName() : INumberInstance["@class"];
  /**


*/
getHistory():number[] ;
}
/**

 
*/
// @ts-ignore 
class SFSMInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IFSMInstance>);
  public getEntity() : Readonly<IFSMInstance>;
getJSONClassName() : IFSMInstance["@class"];
  /**


*/
getEnabled():boolean ;
  /**


*/
getCurrentStateId():number ;
  /**


*/
getTransitionHistory():number[] ;
}
// @ts-ignore 
class SListInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IListInstance>);
  public getEntity() : Readonly<IListInstance>;
getJSONClassName() : IListInstance["@class"];
}
/**

 
*/
// @ts-ignore 
class SChoiceInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IChoiceInstance>);
  public getEntity() : Readonly<IChoiceInstance>;
  /**


*/
getCurrentResultName():string | undefined | null ;
getJSONClassName() : IChoiceInstance["@class"];
  /**


*/
getReplies():SReply[] ;
  /**


*/
getActive():boolean ;
  /**


*/
isUnread():boolean ;
  /* @deprecated */
  getCurrentResultIndex():number | undefined | null ;
}
/**
 
*/
// @ts-ignore 
class SInboxInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IInboxInstance>);
  public getEntity() : Readonly<IInboxInstance>;
getJSONClassName() : IInboxInstance["@class"];
  /**
 @return unread message count

*/
getUnreadCount():number | undefined | null ;
  /**


*/
getMessages():SMessage[] ;
}
/**

 
*/
// @ts-ignore 
class SResourceInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IResourceInstance>);
  public getEntity() : Readonly<IResourceInstance>;
getJSONClassName() : IResourceInstance["@class"];
  /**


*/
getProperties():{
  [key: string] :string
} ;
  /**


*/
getActivities():SActivity[] ;
  /**


*/
getOccupations():SOccupation[] ;
  /**


*/
getActive():boolean ;
  /**


*/
getAssignments():SAssignment[] ;
  /**


*/
getConfidence():number | undefined | null ;
}
/**
 
*/
// @ts-ignore 
class SQuestionInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IQuestionInstance>);
  public getEntity() : Readonly<IQuestionInstance>;
getJSONClassName() : IQuestionInstance["@class"];
  /**
 False until the user has clicked on the global question-wide "submit" button.

*/
isValidated():boolean ;
  /**


*/
getActive():boolean ;
  /**


*/
isUnread():boolean ;
}
// @ts-ignore 
class SStaticTextInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IStaticTextInstance>);
  public getEntity() : Readonly<IStaticTextInstance>;
getJSONClassName() : IStaticTextInstance["@class"];
}
/**
 
*/
// @ts-ignore 
class STextInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<ITextInstance>);
  public getEntity() : Readonly<ITextInstance>;
getJSONClassName() : ITextInstance["@class"];
  /**


*/
getTrValue():STranslatableContent | undefined | null ;
}
/**
 
*/
// @ts-ignore 
class SStringInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IStringInstance>);
  public getEntity() : Readonly<IStringInstance>;
getJSONClassName() : IStringInstance["@class"];
  /**


*/
getTrValue():STranslatableContent ;
}
/**
 Instance of the SurveyDescriptor variable:<br>
 - keeps the list of questions/replies that are to be replied.

  @see SurveyDescriptor

*/
// @ts-ignore 
class SSurveyInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<ISurveyInstance>);
  public getEntity() : Readonly<ISurveyInstance>;
getJSONClassName() : ISurveyInstance["@class"];
  getActive():boolean ;
  getStatus():'NOT_STARTED' | 'REQUESTED' | 'ONGOING' | 'COMPLETED' | 'CLOSED' ;
}
/**
 Dummy instance for SurveySectionDescriptor.


*/
// @ts-ignore 
class SSurveySectionInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<ISurveySectionInstance>);
  public getEntity() : Readonly<ISurveySectionInstance>;
getJSONClassName() : ISurveySectionInstance["@class"];
  getActive():boolean ;
}
/**

 
*/
// @ts-ignore 
class SObjectInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IObjectInstance>);
  public getEntity() : Readonly<IObjectInstance>;
getJSONClassName() : IObjectInstance["@class"];
  /**


*/
getProperties():{
  [key: string] :string
} ;
}
/**

 
*/
// @ts-ignore 
class SAchievementInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IAchievementInstance>);
  public getEntity() : Readonly<IAchievementInstance>;
getJSONClassName() : IAchievementInstance["@class"];
  /**


*/
isAchieved():boolean ;
}
/**
 
*/
// @ts-ignore 
class SWhQuestionInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IWhQuestionInstance>);
  public getEntity() : Readonly<IWhQuestionInstance>;
getJSONClassName() : IWhQuestionInstance["@class"];
  /**
 False until the user has clicked on the global question-wide "submit"
 button.

*/
isValidated():boolean ;
  /**


*/
getActive():boolean ;
  /**


*/
getFeedback():STranslatableContent | undefined | null ;
  /**


*/
isUnread():boolean ;
}
/**

 
*/
// @ts-ignore 
class SBooleanInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<IBooleanInstance>);
  public getEntity() : Readonly<IBooleanInstance>;
  /**


*/
getValue():boolean ;
getJSONClassName() : IBooleanInstance["@class"];
}
/**

 A survey input instance just stores the status replied/unreplied of the corresponding
 question/input descriptor.

 
*/
// @ts-ignore 
class SSurveyInputInstance extends SVariableInstance {
  public constructor(client: WegasClient, entity: Readonly<ISurveyInputInstance>);
  public getEntity() : Readonly<ISurveyInputInstance>;
  /**
 False until the user has replied at least once to this question/input.

*/
getIsReplied():boolean ;
getJSONClassName() : ISurveyInputInstance["@class"];
  getActive():boolean ;
}
/**
 
*/
// @ts-ignore 
abstract class SAbstractContentDescriptor extends SMergeable {
  public constructor(client: WegasClient, entity: Readonly<IAbstractContentDescriptor>);
  public getEntity() : Readonly<IAbstractContentDescriptor>;
  getParentType():string | undefined ;
getJSONClassName() : IAbstractContentDescriptor["@class"];
  /**
 @return the name

*/
getName():string ;
  /**
 MIME type

*/
getMimeType():string ;
  /**
 @return path

*/
getPath():string ;
  getRefId():string | undefined ;
  /**
 Some internal comment

*/
getNote():string ;
  /**
 Some public comment

*/
getDescription():string ;
  /**
 @return node size

*/
getBytes():number ;
  getParentId():number | undefined ;
  /**
 The so-called visibility

*/
getVisibility():'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE' | undefined ;
}
/**
 
*/
// @ts-ignore 
class SFileDescriptor extends SAbstractContentDescriptor {
  public constructor(client: WegasClient, entity: Readonly<IFileDescriptor>);
  public getEntity() : Readonly<IFileDescriptor>;
getJSONClassName() : IFileDescriptor["@class"];
  getDataLastModified():number | undefined | null ;
  getBytes():number ;
}
/**

 
*/
// @ts-ignore 
class SDirectoryDescriptor extends SAbstractContentDescriptor {
  public constructor(client: WegasClient, entity: Readonly<IDirectoryDescriptor>);
  public getEntity() : Readonly<IDirectoryDescriptor>;
getJSONClassName() : IDirectoryDescriptor["@class"];
  getBytes():number ;
}
/**

 Based on VariableProperty but with @Lob

 
*/
// @ts-ignore 
class STranslation extends SMergeable {
  public constructor(client: WegasClient, entity: Readonly<ITranslation>);
  public getEntity() : Readonly<ITranslation>;
getJSONClassName() : ITranslation["@class"];
  getLang():string ;
  getRefId():string | undefined ;
  getTranslation():string ;
  getStatus():string | null ;
}
/*
 * InstanceOwner
 */
interface SInstanceOwner{
}

 interface AtClassToAbstractTypes {
  VariableDescriptor : SVariableDescriptor,
  SurveyInputDescriptor : SSurveyInputDescriptor,
  VariableInstance : SVariableInstance,
  DetachedContentDescriptor : SDetachedContentDescriptor,
  AbstractScope : SAbstractScope,
  AbstractStateMachineDescriptor : SAbstractStateMachineDescriptor,
  AbstractState : SAbstractState,
  AbstractTransition : SAbstractTransition,
  EvaluationInstance : SEvaluationInstance,
  AbstractContentDescriptor : SAbstractContentDescriptor,
  Token : SToken,
  AbstractAssignement : SAbstractAssignement,
  AbstractAccount : SAbstractAccount,
  AbstractEntity : SAbstractEntity,
  EvaluationDescriptor : SEvaluationDescriptor,
}

 interface AtClassToConcrtetableTypes {
  TextDescriptor : STextDescriptor,
  ObjectDescriptor : SObjectDescriptor,
  BurndownDescriptor : SBurndownDescriptor,
  InboxDescriptor : SInboxDescriptor,
  TaskDescriptor : STaskDescriptor,
  PeerReviewDescriptor : SPeerReviewDescriptor,
  StringDescriptor : SStringDescriptor,
  TriggerDescriptor : STriggerDescriptor,
  FSMDescriptor : SFSMDescriptor,
  SingleResultChoiceDescriptor : SSingleResultChoiceDescriptor,
  ChoiceDescriptor : SChoiceDescriptor,
  NumberDescriptor : SNumberDescriptor,
  AchievementDescriptor : SAchievementDescriptor,
  WhQuestionDescriptor : SWhQuestionDescriptor,
  ListDescriptor : SListDescriptor,
  StaticTextDescriptor : SStaticTextDescriptor,
  ResourceDescriptor : SResourceDescriptor,
  DialogueDescriptor : SDialogueDescriptor,
  BooleanDescriptor : SBooleanDescriptor,
  SurveyChoicesDescriptor : SSurveyChoicesDescriptor,
  SurveySectionDescriptor : SSurveySectionDescriptor,
  SurveyNumberDescriptor : SSurveyNumberDescriptor,
  QuestionDescriptor : SQuestionDescriptor,
  SurveyDescriptor : SSurveyDescriptor,
  SurveyTextDescriptor : SSurveyTextDescriptor,
}

 interface AtClassToConcreteTypes {
  Assignment : SAssignment,
  TextEvaluationDescriptor : STextEvaluationDescriptor,
  AaiAccount : SAaiAccount,
  Iteration : SIteration,
  WhQuestionInstance : SWhQuestionInstance,
  ResetPasswordToken : SResetPasswordToken,
  PlayerScope : SPlayerScope,
  GameAdmin : SGameAdmin,
  ChoiceInstance : SChoiceInstance,
  IterationEvent : SIterationEvent,
  DetachedDirectoryDescriptor : SDetachedDirectoryDescriptor,
  SurveySectionInstance : SSurveySectionInstance,
  DebugGame : SDebugGame,
  Script : SScript,
  CategorizedEvaluationInstance : SCategorizedEvaluationInstance,
  GameModelProperties : SGameModelProperties,
  TeamScope : STeamScope,
  Team : STeam,
  Transition : STransition,
  InboxInstance : SInboxInstance,
  AchievementInstance : SAchievementInstance,
  IterationPeriod : SIterationPeriod,
  FSMInstance : SFSMInstance,
  Attachment : SAttachment,
  TranslatableContent : STranslatableContent,
  DialogueTransition : SDialogueTransition,
  BooleanInstance : SBooleanInstance,
  TextEvaluationInstance : STextEvaluationInstance,
  WRequirement : SWRequirement,
  GameTeams : SGameTeams,
  GameModelContent : SGameModelContent,
  JpaAccount : SJpaAccount,
  Player : SPlayer,
  InviteToJoinToken : SInviteToJoinToken,
  Translation : STranslation,
  DestroyedEntity : SDestroyedEntity,
  DetachedFileDescriptor : SDetachedFileDescriptor,
  Activity : SActivity,
  DebugTeam : SDebugTeam,
  Role : SRole,
  SurveyInputInstance : SSurveyInputInstance,
  Game : SGame,
  Shadow : SShadow,
  TextInstance : STextInstance,
  StringInstance : SStringInstance,
  Result : SResult,
  ObjectInstance : SObjectInstance,
  StaticTextInstance : SStaticTextInstance,
  GameModelLanguage : SGameModelLanguage,
  BurndownInstance : SBurndownInstance,
  Occupation : SOccupation,
  GradeDescriptor : SGradeDescriptor,
  User : SUser,
  TransitionDependency : STransitionDependency,
  PeerReviewInstance : SPeerReviewInstance,
  GameModelScope : SGameModelScope,
  DialogueState : SDialogueState,
  EnumItem : SEnumItem,
  ValidateAddressToken : SValidateAddressToken,
  EvaluationDescriptorContainer : SEvaluationDescriptorContainer,
  SurveyToken : SSurveyToken,
  SurveyInstance : SSurveyInstance,
  FileDescriptor : SFileDescriptor,
  TaskInstance : STaskInstance,
  CategorizedEvaluationDescriptor : SCategorizedEvaluationDescriptor,
  DirectoryDescriptor : SDirectoryDescriptor,
  GradeInstance : SGradeInstance,
  State : SState,
  AccountDetails : SAccountDetails,
  Reply : SReply,
  GuestJpaAccount : SGuestJpaAccount,
  TriggerState : STriggerState,
  GameModel : SGameModel,
  Message : SMessage,
  Permission : SPermission,
  QuestionInstance : SQuestionInstance,
  ListInstance : SListInstance,
  NumberInstance : SNumberInstance,
  Review : SReview,
  ResourceInstance : SResourceInstance,
}

 type WegasClassNameAndScriptableTypes = AtClassToAbstractTypes & AtClassToConcrtetableTypes & AtClassToConcreteTypes;

 type ScriptableInterfaceName = keyof WegasEntitiesNamesAndClasses;

 type ScriptableInterface = WegasEntitiesNamesAndClasses[ScriptableInterfaceName];

