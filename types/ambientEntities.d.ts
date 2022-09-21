/* tslint:disable:no-unused-variable */
// @ts-nocheck


/*
 * IMergeable
 */
 interface IMergeable {
  readonly "@class": keyof WegasClassNamesAndClasses;
  refId?: string;
  readonly parentType?: string;
  readonly parentId?: number;
}

 interface WegasClassNamesAndClasses {
  TextEvaluationDescriptor : ITextEvaluationDescriptor;
  InboxInstance : IInboxInstance;
  InboxDescriptor : IInboxDescriptor;
  SingleResultChoiceDescriptor : ISingleResultChoiceDescriptor;
  ChoiceInstance : IChoiceInstance;
  TextDescriptor : ITextDescriptor;
  ListInstance : IListInstance;
  Activity : IActivity;
  DetachedFileDescriptor : IDetachedFileDescriptor;
  Token : IToken;
  FSMInstance : IFSMInstance;
  Assignment : IAssignment;
  NumberInstance : INumberInstance;
  Permission : IPermission;
  WhQuestionDescriptor : IWhQuestionDescriptor;
  SurveyNumberDescriptor : ISurveyNumberDescriptor;
  WRequirement : IWRequirement;
  TextEvaluationInstance : ITextEvaluationInstance;
  TaskInstance : ITaskInstance;
  Translation : ITranslation;
  AbstractContentDescriptor : IAbstractContentDescriptor;
  SurveyInputDescriptor : ISurveyInputDescriptor;
  GameModel : IGameModel;
  TransitionDependency : ITransitionDependency;
  EvaluationDescriptorContainer : IEvaluationDescriptorContainer;
  GameAdmin : IGameAdmin;
  PeerReviewInstance : IPeerReviewInstance;
  Game : IGame;
  GameModelLanguage : IGameModelLanguage;
  AbstractEntity : IAbstractEntity;
  GameModelProperties : IGameModelProperties;
  InviteToJoinToken : IInviteToJoinToken;
  BurndownInstance : IBurndownInstance;
  SurveyChoicesDescriptor : ISurveyChoicesDescriptor;
  VariableInstance : IVariableInstance;
  ObjectDescriptor : IObjectDescriptor;
  PlayerScope : IPlayerScope;
  AaiAccount : IAaiAccount;
  DirectoryDescriptor : IDirectoryDescriptor;
  DialogueDescriptor : IDialogueDescriptor;
  AchievementDescriptor : IAchievementDescriptor;
  StringDescriptor : IStringDescriptor;
  GuestJpaAccount : IGuestJpaAccount;
  ChoiceDescriptor : IChoiceDescriptor;
  EvaluationDescriptor : IEvaluationDescriptor;
  SurveyInputInstance : ISurveyInputInstance;
  TriggerState : ITriggerState;
  PeerReviewDescriptor : IPeerReviewDescriptor;
  BooleanInstance : IBooleanInstance;
  Team : ITeam;
  DetachedContentDescriptor : IDetachedContentDescriptor;
  DebugGame : IDebugGame;
  IterationPeriod : IIterationPeriod;
  Occupation : IOccupation;
  WhQuestionInstance : IWhQuestionInstance;
  Transition : ITransition;
  Reply : IReply;
  DetachedDirectoryDescriptor : IDetachedDirectoryDescriptor;
  JpaAccount : IJpaAccount;
  ResourceDescriptor : IResourceDescriptor;
  SurveyToken : ISurveyToken;
  StaticTextDescriptor : IStaticTextDescriptor;
  Attachment : IAttachment;
  Result : IResult;
  DebugTeam : IDebugTeam;
  IterationEvent : IIterationEvent;
  DialogueState : IDialogueState;
  SurveySectionDescriptor : ISurveySectionDescriptor;
  BurndownDescriptor : IBurndownDescriptor;
  TeamScope : ITeamScope;
  GradeDescriptor : IGradeDescriptor;
  AccountDetails : IAccountDetails;
  Script : IScript;
  Player : IPlayer;
  AchievementInstance : IAchievementInstance;
  AbstractAccount : IAbstractAccount;
  ObjectInstance : IObjectInstance;
  SurveyDescriptor : ISurveyDescriptor;
  AbstractStateMachineDescriptor : IAbstractStateMachineDescriptor;
  BooleanDescriptor : IBooleanDescriptor;
  GameModelContent : IGameModelContent;
  SurveySectionInstance : ISurveySectionInstance;
  Role : IRole;
  QuestionDescriptor : IQuestionDescriptor;
  State : IState;
  GameTeams : IGameTeams;
  AbstractState : IAbstractState;
  EnumItem : IEnumItem;
  SurveyInstance : ISurveyInstance;
  AbstractAssignement : IAbstractAssignement;
  FSMDescriptor : IFSMDescriptor;
  User : IUser;
  Message : IMessage;
  DestroyedEntity : IDestroyedEntity;
  Shadow : IShadow;
  Iteration : IIteration;
  Review : IReview;
  VariableDescriptor : IVariableDescriptor;
  NumberDescriptor : INumberDescriptor;
  TranslatableContent : ITranslatableContent;
  GradeInstance : IGradeInstance;
  ValidateAddressToken : IValidateAddressToken;
  StringInstance : IStringInstance;
  AbstractScope : IAbstractScope;
  EvaluationInstance : IEvaluationInstance;
  SurveyTextDescriptor : ISurveyTextDescriptor;
  TextInstance : ITextInstance;
  ResetPasswordToken : IResetPasswordToken;
  StaticTextInstance : IStaticTextInstance;
  FileDescriptor : IFileDescriptor;
  TriggerDescriptor : ITriggerDescriptor;
  DialogueTransition : IDialogueTransition;
  TaskDescriptor : ITaskDescriptor;
  QuestionInstance : IQuestionInstance;
  ListDescriptor : IListDescriptor;
  CategorizedEvaluationDescriptor : ICategorizedEvaluationDescriptor;
  ResourceInstance : IResourceInstance;
  AbstractTransition : IAbstractTransition;
  GameModelScope : IGameModelScope;
  CategorizedEvaluationInstance : ICategorizedEvaluationInstance;
}

 type WegasClassNames = keyof WegasClassNamesAndClasses;


 interface WithId {id: number};
 type ITextEvaluationDescriptorWithId  = ITextEvaluationDescriptor & WithId;
 type IInboxInstanceWithId  = IInboxInstance & WithId;
 type IInboxDescriptorWithId  = IInboxDescriptor & WithId;
 type ISingleResultChoiceDescriptorWithId  = ISingleResultChoiceDescriptor & WithId;
 type IChoiceInstanceWithId  = IChoiceInstance & WithId;
 type ITextDescriptorWithId  = ITextDescriptor & WithId;
 type IListInstanceWithId  = IListInstance & WithId;
 type IActivityWithId  = IActivity & WithId;
 type IDetachedFileDescriptorWithId  = IDetachedFileDescriptor & WithId;
 type ITokenWithId  = IToken & WithId;
 type IFSMInstanceWithId  = IFSMInstance & WithId;
 type IAssignmentWithId  = IAssignment & WithId;
 type INumberInstanceWithId  = INumberInstance & WithId;
 type IPermissionWithId  = IPermission & WithId;
 type IWhQuestionDescriptorWithId  = IWhQuestionDescriptor & WithId;
 type ISurveyNumberDescriptorWithId  = ISurveyNumberDescriptor & WithId;
 type IWRequirementWithId  = IWRequirement & WithId;
 type ITextEvaluationInstanceWithId  = ITextEvaluationInstance & WithId;
 type ITaskInstanceWithId  = ITaskInstance & WithId;
 type ITranslationWithId  = ITranslation & WithId;
 type IAbstractContentDescriptorWithId  = IAbstractContentDescriptor & WithId;
 type ISurveyInputDescriptorWithId  = ISurveyInputDescriptor & WithId;
 type IGameModelWithId  = IGameModel & WithId;
 type ITransitionDependencyWithId  = ITransitionDependency & WithId;
 type IEvaluationDescriptorContainerWithId  = IEvaluationDescriptorContainer & WithId;
 type IGameAdminWithId  = IGameAdmin & WithId;
 type IPeerReviewInstanceWithId  = IPeerReviewInstance & WithId;
 type IGameWithId  = IGame & WithId;
 type IGameModelLanguageWithId  = IGameModelLanguage & WithId;
 type IAbstractEntityWithId  = IAbstractEntity & WithId;
 type IGameModelPropertiesWithId  = IGameModelProperties & WithId;
 type IInviteToJoinTokenWithId  = IInviteToJoinToken & WithId;
 type IBurndownInstanceWithId  = IBurndownInstance & WithId;
 type ISurveyChoicesDescriptorWithId  = ISurveyChoicesDescriptor & WithId;
 type IVariableInstanceWithId  = IVariableInstance & WithId;
 type IObjectDescriptorWithId  = IObjectDescriptor & WithId;
 type IPlayerScopeWithId  = IPlayerScope & WithId;
 type IAaiAccountWithId  = IAaiAccount & WithId;
 type IDirectoryDescriptorWithId  = IDirectoryDescriptor & WithId;
 type IDialogueDescriptorWithId  = IDialogueDescriptor & WithId;
 type IAchievementDescriptorWithId  = IAchievementDescriptor & WithId;
 type IStringDescriptorWithId  = IStringDescriptor & WithId;
 type IGuestJpaAccountWithId  = IGuestJpaAccount & WithId;
 type IChoiceDescriptorWithId  = IChoiceDescriptor & WithId;
 type IEvaluationDescriptorWithId  = IEvaluationDescriptor & WithId;
 type ISurveyInputInstanceWithId  = ISurveyInputInstance & WithId;
 type ITriggerStateWithId  = ITriggerState & WithId;
 type IPeerReviewDescriptorWithId  = IPeerReviewDescriptor & WithId;
 type IBooleanInstanceWithId  = IBooleanInstance & WithId;
 type ITeamWithId  = ITeam & WithId;
 type IDetachedContentDescriptorWithId  = IDetachedContentDescriptor & WithId;
 type IDebugGameWithId  = IDebugGame & WithId;
 type IIterationPeriodWithId  = IIterationPeriod & WithId;
 type IOccupationWithId  = IOccupation & WithId;
 type IWhQuestionInstanceWithId  = IWhQuestionInstance & WithId;
 type ITransitionWithId  = ITransition & WithId;
 type IReplyWithId  = IReply & WithId;
 type IDetachedDirectoryDescriptorWithId  = IDetachedDirectoryDescriptor & WithId;
 type IJpaAccountWithId  = IJpaAccount & WithId;
 type IResourceDescriptorWithId  = IResourceDescriptor & WithId;
 type ISurveyTokenWithId  = ISurveyToken & WithId;
 type IStaticTextDescriptorWithId  = IStaticTextDescriptor & WithId;
 type IAttachmentWithId  = IAttachment & WithId;
 type IResultWithId  = IResult & WithId;
 type IDebugTeamWithId  = IDebugTeam & WithId;
 type IIterationEventWithId  = IIterationEvent & WithId;
 type IDialogueStateWithId  = IDialogueState & WithId;
 type ISurveySectionDescriptorWithId  = ISurveySectionDescriptor & WithId;
 type IBurndownDescriptorWithId  = IBurndownDescriptor & WithId;
 type ITeamScopeWithId  = ITeamScope & WithId;
 type IGradeDescriptorWithId  = IGradeDescriptor & WithId;
 type IAccountDetailsWithId  = IAccountDetails & WithId;
 type IScriptWithId  = IScript & WithId;
 type IPlayerWithId  = IPlayer & WithId;
 type IAchievementInstanceWithId  = IAchievementInstance & WithId;
 type IAbstractAccountWithId  = IAbstractAccount & WithId;
 type IObjectInstanceWithId  = IObjectInstance & WithId;
 type ISurveyDescriptorWithId  = ISurveyDescriptor & WithId;
 type IAbstractStateMachineDescriptorWithId  = IAbstractStateMachineDescriptor & WithId;
 type IBooleanDescriptorWithId  = IBooleanDescriptor & WithId;
 type IGameModelContentWithId  = IGameModelContent & WithId;
 type ISurveySectionInstanceWithId  = ISurveySectionInstance & WithId;
 type IRoleWithId  = IRole & WithId;
 type IQuestionDescriptorWithId  = IQuestionDescriptor & WithId;
 type IStateWithId  = IState & WithId;
 type IGameTeamsWithId  = IGameTeams & WithId;
 type IAbstractStateWithId  = IAbstractState & WithId;
 type IEnumItemWithId  = IEnumItem & WithId;
 type ISurveyInstanceWithId  = ISurveyInstance & WithId;
 type IAbstractAssignementWithId  = IAbstractAssignement & WithId;
 type IFSMDescriptorWithId  = IFSMDescriptor & WithId;
 type IUserWithId  = IUser & WithId;
 type IMessageWithId  = IMessage & WithId;
 type IDestroyedEntityWithId  = IDestroyedEntity & WithId;
 type IShadowWithId  = IShadow & WithId;
 type IIterationWithId  = IIteration & WithId;
 type IReviewWithId  = IReview & WithId;
 type IVariableDescriptorWithId  = IVariableDescriptor & WithId;
 type INumberDescriptorWithId  = INumberDescriptor & WithId;
 type ITranslatableContentWithId  = ITranslatableContent & WithId;
 type IGradeInstanceWithId  = IGradeInstance & WithId;
 type IValidateAddressTokenWithId  = IValidateAddressToken & WithId;
 type IStringInstanceWithId  = IStringInstance & WithId;
 type IAbstractScopeWithId  = IAbstractScope & WithId;
 type IEvaluationInstanceWithId  = IEvaluationInstance & WithId;
 type ISurveyTextDescriptorWithId  = ISurveyTextDescriptor & WithId;
 type ITextInstanceWithId  = ITextInstance & WithId;
 type IResetPasswordTokenWithId  = IResetPasswordToken & WithId;
 type IStaticTextInstanceWithId  = IStaticTextInstance & WithId;
 type IFileDescriptorWithId  = IFileDescriptor & WithId;
 type ITriggerDescriptorWithId  = ITriggerDescriptor & WithId;
 type IDialogueTransitionWithId  = IDialogueTransition & WithId;
 type ITaskDescriptorWithId  = ITaskDescriptor & WithId;
 type IQuestionInstanceWithId  = IQuestionInstance & WithId;
 type IListDescriptorWithId  = IListDescriptor & WithId;
 type ICategorizedEvaluationDescriptorWithId  = ICategorizedEvaluationDescriptor & WithId;
 type IResourceInstanceWithId  = IResourceInstance & WithId;
 type IAbstractTransitionWithId  = IAbstractTransition & WithId;
 type IGameModelScopeWithId  = IGameModelScope & WithId;
 type ICategorizedEvaluationInstanceWithId  = ICategorizedEvaluationInstance & WithId;/*
 * IScript
 */
/**

 
*/
interface IScript extends IMergeable {
  readonly '@class':"Script"
  /**


*/
language: string;
  readonly parentType?: string;
  readonly parentId?: number;
  /**


*/
content: string;
}

/*
 * IDetachedContentDescriptor
 */
/**
 Represent a detached JCR file or directory.

 
*/
interface IDetachedContentDescriptor extends IMergeable {
  note?: string | null;
  readonly '@class':"DetachedDirectoryDescriptor" | "DetachedFileDescriptor"
  visibility?: 'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE' | null;
  description?: string | null;
  refId?: string;
  mimeType?: string | null;
  readonly parentType?: string;
  readonly parentId?: number;
}

/*
 * IDetachedFileDescriptor
 */
/**
 Represent a detached JCR file.
 "Detached" means this file is a copy of the JCR file.

 
*/
interface IDetachedFileDescriptor extends IDetachedContentDescriptor {
  readonly '@class':"DetachedFileDescriptor"
  dataLastModified?: number | null;
}

/*
 * IDetachedDirectoryDescriptor
 */
/**
 Represent a detached JCR directory.
 "Detached" means this directory is a copy of the JCR one.

 
*/
interface IDetachedDirectoryDescriptor extends IDetachedContentDescriptor {
  readonly '@class':"DetachedDirectoryDescriptor"
  children?: IDetachedContentDescriptor[] | null;
}

/*
 * IGameModelProperties
 */
/**

 
*/
interface IGameModelProperties extends IMergeable {
  /**


*/
pagesUri: string;
  readonly '@class':"GameModelProperties"
  /**


*/
scriptUri: string;
  /**


*/
freeForAll: boolean;
  readonly parentType?: string;
  readonly parentId?: number;
  /**


*/
cssUri: string;
  /**


*/
guestAllowed: boolean;
  /**


*/
clientScriptUri: string;
  /**


*/
websocket: string;
  /**


*/
logID: string;
  readonly refId?: string;
  /**


*/
iconUri: string;
}

/*
 * IAbstractEntity
 */
/**

 
*/
interface IAbstractEntity extends IMergeable {
  readonly '@class':"VariableDescriptor" | "Assignment" | "TextDescriptor" | "TextEvaluationDescriptor" | "ObjectDescriptor" | "AaiAccount" | "Iteration" | "WhQuestionInstance" | "ResetPasswordToken" | "PlayerScope" | "GameAdmin" | "ChoiceInstance" | "BurndownDescriptor" | "IterationEvent" | "SurveySectionInstance" | "DebugGame" | "InboxDescriptor" | "CategorizedEvaluationInstance" | "TaskDescriptor" | "TeamScope" | "SurveyInputDescriptor" | "Team" | "PeerReviewDescriptor" | "Transition" | "InboxInstance" | "AchievementInstance" | "IterationPeriod" | "StringDescriptor" | "FSMInstance" | "VariableInstance" | "Attachment" | "TriggerDescriptor" | "TranslatableContent" | "FSMDescriptor" | "DialogueTransition" | "BooleanInstance" | "TextEvaluationInstance" | "WRequirement" | "GameTeams" | "GameModelContent" | "SingleResultChoiceDescriptor" | "ChoiceDescriptor" | "AbstractScope" | "JpaAccount" | "NumberDescriptor" | "Player" | "InviteToJoinToken" | "AchievementDescriptor" | "DestroyedEntity" | "Activity" | "DebugTeam" | "AbstractStateMachineDescriptor" | "AbstractState" | "AbstractTransition" | "Role" | "WhQuestionDescriptor" | "SurveyInputInstance" | "ListDescriptor" | "Game" | "StaticTextDescriptor" | "Shadow" | "EvaluationInstance" | "ResourceDescriptor" | "TextInstance" | "StringInstance" | "DialogueDescriptor" | "BooleanDescriptor" | "Result" | "ObjectInstance" | "StaticTextInstance" | "GameModelLanguage" | "BurndownInstance" | "Occupation" | "GradeDescriptor" | "SurveyChoicesDescriptor" | "User" | "TransitionDependency" | "PeerReviewInstance" | "GameModelScope" | "DialogueState" | "EnumItem" | "ValidateAddressToken" | "Token" | "EvaluationDescriptorContainer" | "SurveyToken" | "SurveyInstance" | "TaskInstance" | "CategorizedEvaluationDescriptor" | "GradeInstance" | "SurveySectionDescriptor" | "SurveyNumberDescriptor" | "State" | "AccountDetails" | "Reply" | "AbstractAssignement" | "GuestJpaAccount" | "AbstractAccount" | "TriggerState" | "GameModel" | "QuestionDescriptor" | "Message" | "Permission" | "SurveyDescriptor" | "QuestionInstance" | "ListInstance" | "NumberInstance" | "Review" | "ResourceInstance" | "SurveyTextDescriptor" | "EvaluationDescriptor"
  readonly id?: number;
  refId?: string;
  readonly parentType?: string;
  readonly parentId?: number;
}

/*
 * IGameModelLanguage
 */
/**
 One could simply use a List of String annotated with @OrderColumn, but such a setup leads to incredible
 cache coordination bug (please re test with EE8)

 

*/
interface IGameModelLanguage extends IAbstractEntity {
  readonly '@class':"GameModelLanguage"
  /**
 short name like en, en_uk, or fr_ch

*/
code: string;
  visibility?: 'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE';
  active: boolean;
  readonly indexOrder?: number | null;
  readonly id?: number;
  /**
 Language name to display

*/
lang: string;
}

/*
 * IGame
 */
/**
  
*/
interface IGame extends IAbstractEntity {
  readonly '@class':"Game" | "DebugGame"
  /**


*/
access: 'OPEN' | 'CLOSE';
  /**
 @return the teams

*/
readonly teams: ITeam[];
  /**


*/
name: string;
  /**
 @return the createdTime

*/
readonly createdTime: number;
  readonly id?: number;
  /**
 @return id of the user who created this or null if user no longer exists

*/
readonly createdById?: number | null;
  readonly status: 'LIVE' | 'BIN' | 'DELETE' | 'SUPPRESSED';
  /**


*/
token: string;
}

/*
 * IDebugGame
 */
interface IDebugGame extends IGame {
  readonly '@class':"DebugGame"
}

/*
 * IGameAdmin
 */
/**
 To store game info required for invoicing.

 
*/
interface IGameAdmin extends IAbstractEntity {
  readonly gameId?: number | null;
  readonly creator?: string | null;
  readonly '@class':"GameAdmin"
  comments?: string | null;
  readonly gameName?: string | null;
  readonly gameStatus?: 'LIVE' | 'BIN' | 'DELETE' | 'SUPPRESSED' | null;
  readonly teamCount?: number | null;
  readonly createdTime?: number | null;
  readonly gameModelName?: string | null;
  readonly id?: number;
  status?: 'TODO' | 'PROCESSED' | 'CHARGED' | null;
}

/*
 * IEvaluationDescriptorContainer
 */
/**
 Simple wrapper to group several evaluation descriptor

  @see EvaluationDescriptor
 @see PeerReviewDescriptor

*/
interface IEvaluationDescriptorContainer extends IAbstractEntity {
  readonly '@class':"EvaluationDescriptorContainer"
  /**
 List of evaluations

*/
evaluations: IEvaluationDescriptor[];
  readonly id?: number;
}

/*
 * ITransitionDependency
 */
/**
 Indicated the result of a {@link AbstractTransition} condition depends on a variable

 
*/
interface ITransitionDependency extends IAbstractEntity {
  readonly '@class':"TransitionDependency"
  /**
 Name of the variable. This field is set when deserializing entities from clients and when a
 WegasPatch is applied.

*/
variableName: string;
  /**
 Scope of the dependency.

*/
scope: 'NONE' | 'SELF' | 'CHILDREN' | 'UNKNOWN';
  readonly id?: number;
}

/*
 * IGameModel
 */
/**
 
*/
interface IGameModel extends IAbstractEntity {
  readonly '@class':"GameModel"
  /**


*/
comments: string;
  languages: IGameModelLanguage[];
  readonly itemsIds: number[];
  /**


*/
description: string;
  readonly type: 'MODEL' | 'REFERENCE' | 'SCENARIO' | 'PLAY';
  readonly uiversion: number;
  /**


*/
name: string;
  /**
 @return the createdTime

*/
readonly createdTime: number;
  readonly id?: number;
  /**

 @return

*/
readonly basedOnId?: number | null;
  /**
 @return name of the user who created this or null if user no longer exists

*/
readonly createdById?: number | null;
  /**


*/
properties: IGameModelProperties;
  /**
 @return Current GameModel's status

*/
readonly status: 'LIVE' | 'BIN' | 'DELETE' | 'SUPPRESSED';
}

/*
 * IWRequirement
 */
/**

 
*/
interface IWRequirement extends IAbstractEntity {
  readonly '@class':"WRequirement"
  quantity: number;
  level: number;
  /**


*/
work: string;
  /**


*/
name?: string;
  /**


*/
limit: number;
  readonly id?: number;
  completeness: number;
  quality: number;
}

/*
 * IPermission
 */
/**

 
*/
interface IPermission extends IAbstractEntity {
  readonly '@class':"Permission"
  readonly id?: number;
  /**


*/
value: string;
}

/*
 * IToken
 */
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
interface IToken extends IAbstractEntity {
  /**
 Get the expiryDate. null means infinity

 @return the expiry date or null

*/
readonly expiryDate?: number | null;
  readonly '@class':"ResetPasswordToken" | "InviteToJoinToken" | "ValidateAddressToken" | "SurveyToken"
  /**
 Once consumed, redirect user to this location

 @return new client location

*/
readonly redirectTo?: string | null;
  readonly id?: number;
  readonly autoLogin: boolean;
  /**
 Get account linked to this token, if any

 @return the account or null

*/
readonly account?: IAbstractAccount | null;
}

/*
 * IResetPasswordToken
 */
interface IResetPasswordToken extends IToken {
  readonly '@class':"ResetPasswordToken"
  readonly redirectTo?: string | null;
}

/*
 * IValidateAddressToken
 */
interface IValidateAddressToken extends IToken {
  readonly '@class':"ValidateAddressToken"
  readonly redirectTo?: string | null;
}

/*
 * ISurveyToken
 */
interface ISurveyToken extends IToken {
  readonly '@class':"SurveyToken"
  readonly redirectTo?: string | null;
}

/*
 * IInviteToJoinToken
 */
interface IInviteToJoinToken extends IToken {
  readonly '@class':"InviteToJoinToken"
  readonly redirectTo?: string | null;
}

/*
 * IAbstractTransition
 */
/**
 
*/
interface IAbstractTransition extends IAbstractEntity {
  /**


*/
preStateImpact: IScript;
  /**


*/
triggerCondition: IScript;
  readonly '@class':"Transition" | "DialogueTransition"
  /**


*/
nextStateId: number;
  /**
 DependsOn strategy

*/
dependsOnStrategy?: 'AUTO' | 'MANUAL';
  /**


*/
index: number;
  readonly id?: number;
  version: number;
  readonly stateMachineId?: number | null;
  /**
 List of variable the condition depends on. Empty means the condition MUST be evaluated in all
 cases.

*/
dependencies: ITransitionDependency[];
}

/*
 * IDialogueTransition
 */
/**

 
*/
interface IDialogueTransition extends IAbstractTransition {
  actionText: ITranslatableContent;
  readonly '@class':"DialogueTransition"
}

/*
 * ITransition
 */
/**
 
*/
interface ITransition extends IAbstractTransition {
  readonly '@class':"Transition"
  /**


*/
label: string;
}

/*
 * IEvaluationInstance
 */
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
interface IEvaluationInstance extends IAbstractEntity {
  readonly '@class':"CategorizedEvaluationInstance" | "TextEvaluationInstance" | "GradeInstance"
  /**
 @Override
 @return index

*/
readonly index: number;
  readonly id?: number;
  descriptorName: string;
}

/*
 * IGradeInstance
 */
/**

 Grade evaluation instance

 
*/
interface IGradeInstance extends IEvaluationInstance {
  readonly '@class':"GradeInstance"
  /**
 given grade

*/
value?: number | null;
}

/*
 * ITextEvaluationInstance
 */
/**

 Textual evaluation instance

 
*/
interface ITextEvaluationInstance extends IEvaluationInstance {
  readonly '@class':"TextEvaluationInstance"
  /**
 the evaluation itself

*/
value?: string | null;
}

/*
 * ICategorizedEvaluationInstance
 */
/**
 Evaluation instance corresponding to CategorizedEvaluationDescriptor

 
*/
interface ICategorizedEvaluationInstance extends IEvaluationInstance {
  readonly '@class':"CategorizedEvaluationInstance"
  /**
 the chosen category (null means un-chosen)

*/
value: string;
}

/*
 * IAbstractScope
 */
interface IAbstractScope<T extends IInstanceOwner = IInstanceOwner> extends IAbstractEntity {
  readonly '@class':"PlayerScope" | "TeamScope" | "GameModelScope"
  readonly id?: number;
}

/*
 * ITeamScope
 */
interface ITeamScope extends IAbstractScope<ITeam> {
  readonly '@class':"TeamScope"
}

/*
 * IPlayerScope
 */
interface IPlayerScope extends IAbstractScope<IPlayer> {
  readonly '@class':"PlayerScope"
}

/*
 * IGameModelScope
 */
interface IGameModelScope extends IAbstractScope<IGameModel> {
  readonly '@class':"GameModelScope"
}

/*
 * ITranslatableContent
 */
/**

 
*/
interface ITranslatableContent extends IAbstractEntity {
  readonly '@class':"TranslatableContent"
  /**


*/
translations: {
  [key: string] :ITranslation
};
  readonly id?: number;
  version: number;
}

/*
 * IVariableDescriptor
 */
/**
 @param <T>

 
*/
interface IVariableDescriptor<T extends IVariableInstance = IVariableInstance> extends IAbstractEntity {
  readonly '@class':"TextDescriptor" | "ObjectDescriptor" | "BurndownDescriptor" | "InboxDescriptor" | "TaskDescriptor" | "SurveyInputDescriptor" | "PeerReviewDescriptor" | "StringDescriptor" | "TriggerDescriptor" | "FSMDescriptor" | "SingleResultChoiceDescriptor" | "ChoiceDescriptor" | "NumberDescriptor" | "AchievementDescriptor" | "AbstractStateMachineDescriptor" | "WhQuestionDescriptor" | "ListDescriptor" | "StaticTextDescriptor" | "ResourceDescriptor" | "DialogueDescriptor" | "BooleanDescriptor" | "SurveyChoicesDescriptor" | "SurveySectionDescriptor" | "SurveyNumberDescriptor" | "QuestionDescriptor" | "SurveyDescriptor" | "SurveyTextDescriptor"
  /**


*/
comments: string;
  visibility?: 'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE';
  scopeType?: 'PlayerScope' | 'TeamScope' | 'GameModelScope';
  broadcastScope?: 'PlayerScope' | 'TeamScope' | 'GameModelScope';
  /**

 The default instance for this variable.
 <p>
 According to WegasPatch spec, OVERRIDE should not be propagated to the instance when the
 descriptor is protected
 <p>
 Here we cannot use type T, otherwise jpa won't handle the db ref correctly

*/
defaultInstance: T;
  /**
 variable name: used as identifier

*/
name?: string;
  isolation?: 'OPEN' | 'SECURED' | 'HIDDEN';
  /**
 a token to prefix the label with. For editors only

*/
editorTag: string;
  readonly id?: number;
  /**
 Variable descriptor human readable name Player visible

*/
label: ITranslatableContent;
  version: number;
}

/*
 * IQuestionDescriptor
 */
/**

 
*/
interface IQuestionDescriptor extends IVariableDescriptor<IQuestionInstance> {
  /**
 Total number of replies allowed. No default value (means infinity).

*/
maxReplies?: number | null;
  readonly '@class':"QuestionDescriptor"
  readonly itemsIds: number[];
  /**
 Set this to true when the choice is to be self radio/checkbox

*/
cbx: boolean;
  /**


*/
description: ITranslatableContent;
  /**
 Determines if choices are presented horizontally in a tabular fashion

*/
tabular: boolean;
  /**
 Minimal number of replies required. Makes sense only with CBX-type questions. No default
 value.

*/
minReplies?: number | null;
  /**


*/
pictures: string[];
}

/*
 * IBooleanDescriptor
 */
/**

 
*/
interface IBooleanDescriptor extends IVariableDescriptor<IBooleanInstance> {
  readonly '@class':"BooleanDescriptor"
}

/*
 * IAbstractStateMachineDescriptor
 */
/**
  @param <T>
 @param <U>

*/
interface IAbstractStateMachineDescriptor<T extends IAbstractState = IAbstractState,U extends IAbstractTransition = IAbstractTransition> extends IVariableDescriptor<IFSMInstance> {
  readonly '@class':"TriggerDescriptor" | "FSMDescriptor" | "DialogueDescriptor"
  /**


*/
states: {
  [key: number] :T
};
}

/*
 * IDialogueDescriptor
 */
interface IDialogueDescriptor extends IAbstractStateMachineDescriptor<IDialogueState,IDialogueTransition> {
  readonly '@class':"DialogueDescriptor"
}

/*
 * ITriggerDescriptor
 */
/**
 
*/
interface ITriggerDescriptor extends IAbstractStateMachineDescriptor<ITriggerState,ITransition> {
  readonly '@class':"TriggerDescriptor"
  /**
 DependsOn strategy

*/
dependsOnStrategy?: 'AUTO' | 'MANUAL';
  /**


*/
triggerEvent: IScript;
  /**


*/
postTriggerEvent: IScript;
  /**


*/
disableSelf: boolean;
  /**


*/
oneShot: boolean;
  /**
 List of variable the condition depends on. Empty means the condition MUST be evaluated in all
 case

*/
dependencies: ITransitionDependency[];
}

/*
 * IFSMDescriptor
 */
interface IFSMDescriptor extends IAbstractStateMachineDescriptor<IState,ITransition> {
  readonly '@class':"FSMDescriptor"
}

/*
 * ISurveyDescriptor
 */
/**
 Descriptor of the Survey variable<br>

  @see SurveyDescriptor

*/
interface ISurveyDescriptor extends IVariableDescriptor<ISurveyInstance> {
  readonly '@class':"SurveyDescriptor"
  descriptionEnd: ITranslatableContent;
  readonly itemsIds: number[];
  /**
 True unless it should be hidden from trainer/scenarist listings.

*/
isPublished: boolean;
  description: ITranslatableContent;
}

/*
 * IBurndownDescriptor
 */
interface IBurndownDescriptor extends IVariableDescriptor<IBurndownInstance> {
  readonly '@class':"BurndownDescriptor"
}

/*
 * ISurveySectionDescriptor
 */
/**
 Wrapper for grouping input descriptors by theme

  @see SurveyInputDescriptor
 @see SurveyDescriptor

*/
interface ISurveySectionDescriptor extends IVariableDescriptor<ISurveySectionInstance> {
  readonly '@class':"SurveySectionDescriptor"
  readonly itemsIds: number[];
  /**
 Textual descriptor to be displayed to players

*/
description: ITranslatableContent;
}

/*
 * IStaticTextDescriptor
 */
/**
 Static text defines a text at the descriptor level. Its instance does not contains anything

 
*/
interface IStaticTextDescriptor extends IVariableDescriptor<IStaticTextInstance> {
  readonly '@class':"StaticTextDescriptor"
  /**


*/
text: ITranslatableContent;
}

/*
 * IResourceDescriptor
 */
/**

 
*/
interface IResourceDescriptor extends IVariableDescriptor<IResourceInstance> {
  readonly '@class':"ResourceDescriptor"
  /**


*/
description: ITranslatableContent;
  /**


*/
properties: {
  [key: string] :string
};
}

/*
 * IPeerReviewDescriptor
 */
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
interface IPeerReviewDescriptor extends IVariableDescriptor<IPeerReviewInstance> {
  /**
 List of evaluations that compose one feedback. Here, en empty list does
 not make any sense

*/
feedback: IEvaluationDescriptorContainer;
  readonly '@class':"PeerReviewDescriptor"
  /**
 Allow evicted users to receive something to review

*/
includeEvicted: boolean;
  /**
 List of evaluations that compose the feedbacks comments. Empty list is
 allowed

*/
fbComments: IEvaluationDescriptorContainer;
  description: ITranslatableContent;
  /**
 Expected number of reviews. The number of reviews may be smaller,
 especially is total number of team/player is too small
 <p>

*/
maxNumberOfReview: number;
  /**
 the name of the variable to review. Only used for JSON de serialisation

*/
toReviewName: string;
}

/*
 * IChoiceDescriptor
 */
/**

 
*/
interface IChoiceDescriptor extends IVariableDescriptor<IChoiceInstance> {
  /**


*/
duration?: number | null;
  /**
 Total number of replies allowed. No default value.

*/
maxReplies?: number | null;
  readonly '@class':"ChoiceDescriptor" | "SingleResultChoiceDescriptor"
  /**


*/
cost?: number | null;
  /**


*/
description: ITranslatableContent;
  /**


*/
results: IResult[];
}

/*
 * ISingleResultChoiceDescriptor
 */
interface ISingleResultChoiceDescriptor extends IChoiceDescriptor {
  readonly '@class':"SingleResultChoiceDescriptor"
}

/*
 * IStringDescriptor
 */
/**

 
*/
interface IStringDescriptor extends IVariableDescriptor<IStringInstance> {
  /**


*/
validationPattern?: string | null;
  /**
 List of allowed categories

*/
allowedValues: IEnumItem[];
  readonly '@class':"StringDescriptor"
  /**
 Maximum number of allowed values a user can select

*/
maxSelectable?: number | null;
  /**
 If several allowed values are selectable, is their order relevant ?

*/
sortable?: boolean | null;
}

/*
 * IAchievementDescriptor
 */
/**

 
*/
interface IAchievementDescriptor extends IVariableDescriptor<IAchievementInstance> {
  readonly '@class':"AchievementDescriptor"
  /**
 A HTM/hex color

*/
color: string;
  /**
 An icon name

*/
icon: string;
  /**
 Weight of the achievement. Used to compute compute quest completion.

*/
weight: number;
  /**
 Message to display when the achievement is unlocked

*/
message: ITranslatableContent;
  /**
 The quest this achievement is part of

*/
quest: string;
}

/*
 * IObjectDescriptor
 */
/**

 
*/
interface IObjectDescriptor extends IVariableDescriptor<IObjectInstance> {
  readonly '@class':"ObjectDescriptor"
  /**


*/
description: string;
  /**


*/
properties: {
  [key: string] :string
};
}

/*
 * ISurveyInputDescriptor
 */
/**

 A survey input descriptor is the abstract parent of different kinds of input descriptors.

 
*/
interface ISurveyInputDescriptor extends IVariableDescriptor<ISurveyInputInstance> {
  readonly '@class':"SurveyChoicesDescriptor" | "SurveyNumberDescriptor" | "SurveyTextDescriptor"
  /**
 Tells if a reply to this input/question is compulsory

*/
isCompulsory: boolean;
  /**
 Textual descriptor to be displayed to players

*/
description: ITranslatableContent;
}

/*
 * ISurveyNumberDescriptor
 */
/**
 Define an grade-like evaluation by defined a scale (min and max)

 
*/
interface ISurveyNumberDescriptor extends ISurveyInputDescriptor {
  minValue?: number | null;
  /**
 Optional measurement unit (years, percent, etc.) Player visible

*/
unit: ITranslatableContent;
  readonly '@class':"SurveyNumberDescriptor"
  maxValue?: number | null;
  /**
 Tells if this input should be presented as a scale

*/
isScale: boolean;
}

/*
 * ISurveyTextDescriptor
 */
interface ISurveyTextDescriptor extends ISurveyInputDescriptor {
  readonly '@class':"SurveyTextDescriptor"
}

/*
 * ISurveyChoicesDescriptor
 */
/**
 Define a survey input as a labeled choice. For instance : [ very bad ; bad ; acceptable ; good ;
 very good ], [true ; false]

  
*/
interface ISurveyChoicesDescriptor extends ISurveyInputDescriptor {
  readonly '@class':"SurveyChoicesDescriptor"
  /**
 Tells if these choices should be presented as an analog slider

*/
isSlider: boolean;
  /**
 Maximum number of allowed values a user can select

*/
maxSelectable?: number | null;
  /**
 Tells if these choices should be presented as a scale

*/
isScale: boolean;
  /**
 List of allowed choices

*/
choices: IEnumItem[];
}

/*
 * IWhQuestionDescriptor
 */
/**

 
*/
interface IWhQuestionDescriptor extends IVariableDescriptor<IWhQuestionInstance> {
  readonly '@class':"WhQuestionDescriptor"
  readonly itemsIds: number[];
  /**


*/
description: ITranslatableContent;
}

/*
 * ITextDescriptor
 */
/**

 
*/
interface ITextDescriptor extends IVariableDescriptor<ITextInstance> {
  readonly '@class':"TextDescriptor"
}

/*
 * IInboxDescriptor
 */
/**

 
*/
interface IInboxDescriptor extends IVariableDescriptor<IInboxInstance> {
  readonly '@class':"InboxDescriptor"
  /**
 Tells if the inbox has a capacity of just one message.

*/
capped: boolean;
}

/*
 * IListDescriptor
 */
/**

 
*/
interface IListDescriptor extends IVariableDescriptor<IListInstance> {
  /**
 List of allowed children types

*/
allowedTypes: string[];
  readonly '@class':"ListDescriptor"
  /**
 shortcut to show within (+) treeview button, must match allowedTypes

*/
addShortcut: string;
  readonly itemsIds: number[];
}

/*
 * ITaskDescriptor
 */
/**

 

*/
interface ITaskDescriptor extends IVariableDescriptor<ITaskInstance> {
  readonly '@class':"TaskDescriptor"
  /**


*/
description: ITranslatableContent;
  /**


*/
index: string;
  /**


*/
properties: {
  [key: string] :string
};
  /**


*/
predecessorNames: string[];
}

/*
 * INumberDescriptor
 */
/**

 
*/
interface INumberDescriptor extends IVariableDescriptor<INumberInstance> {
  /**


*/
minValue?: number | null;
  readonly '@class':"NumberDescriptor"
  /**

 @return the defaule value

*/
readonly defaultValue?: number;
  /**


*/
maxValue?: number | null;
  /**


*/
historySize?: number | null;
}

/*
 * IReview
 */
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
interface IReview extends IAbstractEntity {
  /**
 List of evaluation instances that compose the feedback (writable by 'reviewer' only)

*/
feedback: IEvaluationInstance[];
  readonly '@class':"Review"
  /**
 List of evaluation instances that compose the feedback evaluation (writable by 'author' only)

*/
comments: IEvaluationInstance[];
  readonly id?: number;
  /**
 Current review state

*/
reviewState: 'DISPATCHED' | 'REVIEWED' | 'NOTIFIED' | 'COMPLETED' | 'CLOSED';
}

/*
 * IIteration
 */
/**
 PMG Related !


 
*/
interface IIteration extends IAbstractEntity {
  /**
 SPI-like indicator, based on workloads. WSPI

*/
wspi: number;
  readonly '@class':"Iteration"
  taskNames: string[];
  /**
 Period number the iteration shall start on

*/
beginAt: number;
  /**
 Iteration Name

*/
name: string;
  /**


*/
createdTime: number;
  /**
 maps a period number with workload for past period and current one: indicates the total remaining workload for
 the corresponding period.

*/
periods: IIterationPeriod[];
  readonly id?: number;
  cpi: number;
}

/*
 * IShadow
 */
interface IShadow extends IAbstractEntity {
  readonly '@class':"Shadow"
  readonly id?: number;
}

/*
 * IDestroyedEntity
 */
interface IDestroyedEntity extends IAbstractEntity {
  readonly '@class':"DestroyedEntity"
  readonly id?: number;
}

/*
 * IMessage
 */
/**

 
*/
interface IMessage extends IAbstractEntity {
  /**
 Simulation date, for display purpose

*/
date: ITranslatableContent;
  readonly '@class':"Message"
  /**


*/
attachments: IAttachment[];
  /**


*/
unread: boolean;
  /**


*/
subject: ITranslatableContent;
  /**


*/
from: ITranslatableContent;
  readonly id?: number;
  /**
 real world time for sorting purpose

*/
time?: number;
  /**
 Message body

*/
body: ITranslatableContent;
  /**
 Kind of message identifier

*/
token: string;
}

/*
 * IUser
 */
/**
 
*/
interface IUser extends IAbstractEntity {
  readonly lastSeenAt?: number | null;
  readonly '@class':"User"
  /**
 Shortcut for getMainAccount().getName();

 @return main account name or unnamed if user doesn't have any account

*/
readonly name: string | null;
  readonly id?: number;
}

/*
 * IAbstractAssignement
 */
/**

 
*/
interface IAbstractAssignement extends IAbstractEntity {
  taskDescriptorName: string;
  readonly '@class':"Assignment" | "Activity"
}

/*
 * IAssignment
 */
interface IAssignment extends IAbstractAssignement {
  readonly '@class':"Assignment"
  readonly id?: number;
}

/*
 * IActivity
 */
/**

 
*/
interface IActivity extends IAbstractAssignement {
  requirementName: string;
  /**


*/
completion: number;
  readonly '@class':"Activity"
  /**
 Start time

*/
startTime: number;
  readonly id?: number;
  /**
 worked time ? strange spelling...

*/
time: number;
}

/*
 * IEnumItem
 */
/**

 
*/
interface IEnumItem extends IAbstractEntity {
  readonly '@class':"EnumItem"
  /**
 Internal identifier

*/
name?: string;
  readonly id?: number;
  label: ITranslatableContent;
}

/*
 * IAbstractState
 */
/**
 
*/
interface IAbstractState<T extends IAbstractTransition = IAbstractTransition> extends IAbstractEntity {
  readonly '@class':"DialogueState" | "State" | "TriggerState"
  /**


*/
"x": number;
  /**


*/
"y": number;
  /**


*/
index?: number;
  /**


*/
onEnterEvent: IScript;
  readonly id?: number;
  /**


*/
transitions: T[];
  version: number;
}

/*
 * IState
 */
/**
 
*/
interface IState extends IAbstractState<ITransition> {
  readonly '@class':"State"
  /**


*/
label: string;
}

/*
 * IDialogueState
 */
/**

 
*/
interface IDialogueState extends IAbstractState<IDialogueTransition> {
  readonly '@class':"DialogueState"
  /**


*/
text: ITranslatableContent;
}

/*
 * ITriggerState
 */
interface ITriggerState extends IAbstractState<ITransition> {
  readonly '@class':"TriggerState"
}

/*
 * IGameTeams
 */
interface IGameTeams extends IAbstractEntity {
  readonly '@class':"GameTeams"
  readonly id?: number;
}

/*
 * IRole
 */
/**
 
*/
interface IRole extends IAbstractEntity {
  readonly '@class':"Role"
  /**


*/
permissions: IPermission[];
  /**


*/
name: string;
  /**


*/
description: string;
  readonly id?: number;
  /**
 count the number of user with this role

 @return member's count

*/
readonly numberOfMember: number;
}

/*
 * IGameModelContent
 */
/**

 
*/
interface IGameModelContent extends IAbstractEntity {
  readonly contentKey: string;
  readonly '@class':"GameModelContent"
  visibility?: 'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE';
  readonly id?: number;
  /**
 MIME type. This is not the same as the library type. For instance one may define a
 type:ClientScript library with aa application/javascript MIME type and another ClientScript
 with application/typescript mimetype.

*/
contentType: string;
  version: number;
  /**


*/
content: string;
}

/*
 * IAbstractAccount
 */
/**
 
*/
interface IAbstractAccount extends IAbstractEntity {
  readonly emailDomain?: string | null;
  /**


*/
firstname: string;
  readonly '@class':"AaiAccount" | "JpaAccount" | "GuestJpaAccount"
  readonly verified?: boolean | null;
  /**
 Optional remarks only visible to admins

*/
comment: string;
  readonly id?: number;
  /**


*/
email: string;
  /**


*/
username: string;
  /**


*/
lastname: string;
  /**
 When the terms of use have been agreed to by the user (usually at signup, except for guests
 and long time users)

*/
agreedTime: number;
}

/*
 * IJpaAccount
 */
/**
 Simple class that represents any User domain entity in any application.

 
*/
interface IJpaAccount extends IAbstractAccount {
  /**


*/
password?: string | null;
  readonly '@class':"JpaAccount"
  /**
 Salt used by the client to hash its password. This is not the salt used to store the password
 in the database. The client hash its salted password using the
 {@link  #currentAuth mandatory hash method}. Then, this hash is salted and hashed again by
 {@link Shadow}

*/
readonly salt?: string | null;
  readonly verified?: boolean | null;
  /**
 if defined, this salt must be used to salt the password hashed with
 {@link #nextAuth optional hash method}

*/
readonly newSalt?: string | null;
}

/*
 * IGuestJpaAccount
 */
interface IGuestJpaAccount extends IAbstractAccount {
  readonly '@class':"GuestJpaAccount"
  readonly verified?: boolean | null;
}

/*
 * IAaiAccount
 */
/**
 
*/
interface IAaiAccount extends IAbstractAccount {
  persistentId: string;
  readonly '@class':"AaiAccount"
  homeOrg: string;
  readonly verified?: boolean | null;
}

/*
 * IPlayer
 */
/**

 
*/
interface IPlayer extends IAbstractEntity {
  readonly verifiedId: boolean;
  readonly queueSize?: number | null;
  readonly '@class':"Player"
  readonly homeOrg: string;
  /**
 @return the joinTime

*/
readonly joinTime?: number | null;
  /**
 @return the name

*/
readonly name: string;
  readonly id?: number;
  /**
 RefName of player preferred language

*/
lang: string;
  /**
 @return the userId

*/
readonly userId?: number | null;
  version: number;
  readonly status?: 'SURVEY' | 'WAITING' | 'RESCHEDULED' | 'PROCESSING' | 'SEC_PROCESSING' | 'INITIALIZING' | 'LIVE' | 'FAILED' | 'DELETED' | null;
}

/*
 * IAccountDetails
 */
interface IAccountDetails extends IAbstractEntity {
  readonly '@class':"AccountDetails"
  readonly id?: number;
}

/*
 * IIterationEvent
 */
/**
 PMG Related !

 
*/
interface IIterationEvent extends IAbstractEntity {
  readonly '@class':"IterationEvent"
  /**
 some payload

*/
data: string;
  /**
 Period subdivision step

*/
step: number;
  taskName: string;
  readonly id?: number;
  eventType: 'ADD_TASK' | 'REMOVE_TASK' | 'START_TASK' | 'COMPLETE_TASK' | 'WORKLOAD_ADJUSTMENT' | 'SPENT_ADJUSTMENT' | 'BUDGETED_ADJUSTMENT';
}

/*
 * IResult
 */
/**
 
*/
interface IResult extends IAbstractEntity {
  /**


*/
ignorationImpact: IScript;
  readonly '@class':"Result"
  /**
 Displayed answer when MCQ result not selected and validated

*/
ignorationAnswer: ITranslatableContent;
  /**
 Displayed answer when result selected and validated

*/
answer: ITranslatableContent;
  /**


*/
impact: IScript;
  /**
 Internal Name

*/
name?: string;
  files: string[];
  readonly id?: number;
  /**
 Displayed name

*/
label: ITranslatableContent;
  version: number;
}

/*
 * IAttachment
 */
/**

 
*/
interface IAttachment extends IAbstractEntity {
  readonly '@class':"Attachment"
  /**
 URI

*/
file: ITranslatableContent;
  readonly id?: number;
}

/*
 * IReply
 */
/**
 
*/
interface IReply extends IAbstractEntity {
  /**


*/
ignored: boolean;
  readonly ignorationAnswer?: ITranslatableContent | null;
  readonly '@class':"Reply"
  readonly answer?: ITranslatableContent | null;
  /**


*/
validated: boolean;
  choiceName: string;
  /**


*/
unread: boolean;
  readonly files?: string[] | null;
  createdTime: number;
  /**
 <p>

*/
startTime: number;
  readonly id?: number;
  resultName: string;
}

/*
 * IOccupation
 */
/**

 
*/
interface IOccupation extends IAbstractEntity {
  readonly '@class':"Occupation"
  /**


*/
editable: boolean;
  readonly id?: number;
  /**


*/
time: number;
}

/*
 * IIterationPeriod
 */
/**
 PMG Related !

 
*/
interface IIterationPeriod extends IAbstractEntity {
  /**
 delta period number

*/
periodNumber: number;
  /**
 actual cost

*/
ac: number;
  readonly '@class':"IterationPeriod"
  /**
 pw "done" during this period

*/
pw: number;
  /**
 workload to do adjustment

*/
deltaAtStart: number;
  /**
 AC adjustment at start

*/
deltaAc: number;
  /**
 Planned workload

*/
planned: number;
  /**
 Replanned workload

*/
replanned: number;
  /**
 earned value

*/
ev: number;
  /**
 earned workload "done" during this period

*/
ew: number;
  aw: number;
  /**
 Ev adjustment at start

*/
deltaEv: number;
  readonly id?: number;
  /**
 Period subdivision step

*/
lastWorkedStep: number;
  iterationEvents: IIterationEvent[];
}

/*
 * ITeam
 */
/**
 
*/
interface ITeam extends IAbstractEntity {
  readonly '@class':"Team" | "DebugTeam"
  /**


*/
notes?: string | null;
  readonly declaredSize?: number | null;
  /**
 @return the players

*/
readonly players: IPlayer[];
  /**


*/
name?: string | null;
  /**
 @return the game ui version

*/
readonly uiVersion?: number | null;
  readonly id?: number;
  readonly status?: 'SURVEY' | 'WAITING' | 'RESCHEDULED' | 'PROCESSING' | 'SEC_PROCESSING' | 'INITIALIZING' | 'LIVE' | 'FAILED' | 'DELETED' | null;
}

/*
 * IDebugTeam
 */
interface IDebugTeam extends ITeam {
  readonly '@class':"DebugTeam"
}

/*
 * IEvaluationDescriptor
 */
/**

 An evaluation descriptor is the abstract parent of different kind of
 evaluation description.
 <p>
 Such en evaluation is either one that compose a feedback (ie the review of a
 variable) or one that compose a feedback evaluation (ie the evaluation of a
 review of a variable)

  @param <T> corresponding Evaluation Instance

*/
interface IEvaluationDescriptor<T extends IEvaluationInstance = IEvaluationInstance> extends IAbstractEntity {
  readonly '@class':"TextEvaluationDescriptor" | "GradeDescriptor" | "CategorizedEvaluationDescriptor"
  /**
 Evaluation internal identifier

*/
name?: string;
  /**
 Textual descriptor to be displayed to players

*/
description: ITranslatableContent;
  readonly id?: number;
  /**
 Evaluation label as displayed to players

*/
label: ITranslatableContent;
}

/*
 * ITextEvaluationDescriptor
 */
interface ITextEvaluationDescriptor extends IEvaluationDescriptor<ITextEvaluationInstance> {
  readonly '@class':"TextEvaluationDescriptor"
}

/*
 * ICategorizedEvaluationDescriptor
 */
/**
 Define an evaluation as a categorisation. For instance : [ very bad ; bad ;
 acceptable ; good ; very good ], [true ; false], [off topic, irrelevant,
 relevant]


 
*/
interface ICategorizedEvaluationDescriptor extends IEvaluationDescriptor<ICategorizedEvaluationInstance> {
  readonly '@class':"CategorizedEvaluationDescriptor"
  /**
 List of allowed categories

*/
categories: IEnumItem[];
}

/*
 * IGradeDescriptor
 */
/**
 Define an grade-like evaluation by defined a scale (min and max)

 
*/
interface IGradeDescriptor extends IEvaluationDescriptor<IGradeInstance> {
  minValue?: number | null;
  readonly '@class':"GradeDescriptor"
  maxValue?: number | null;
}

/*
 * IVariableInstance
 */
/**
 
*/
interface IVariableInstance extends IAbstractEntity {
  readonly '@class':"WhQuestionInstance" | "ChoiceInstance" | "SurveySectionInstance" | "InboxInstance" | "AchievementInstance" | "FSMInstance" | "BooleanInstance" | "SurveyInputInstance" | "TextInstance" | "StringInstance" | "ObjectInstance" | "StaticTextInstance" | "BurndownInstance" | "PeerReviewInstance" | "SurveyInstance" | "TaskInstance" | "QuestionInstance" | "ListInstance" | "NumberInstance" | "ResourceInstance"
  readonly scopeKey?: number | null;
  readonly id?: number;
  version: number;
}

/*
 * IBurndownInstance
 */
/**
 
*/
interface IBurndownInstance extends IVariableInstance {
  readonly '@class':"BurndownInstance"
  iterations: IIteration[];
}

/*
 * IPeerReviewInstance
 */
/**
 Instance of the PeerReviewDescriptor variable Author:<br />
 - has to review several other authors: <code>toReview</code> Review
 list<br />
 - is reviewed by several other authors: <code>reviewed</code> Review list The
 review is in a specific state, see PeerReviewDescriptor

  @see PeerReviewDescriptor

*/
interface IPeerReviewInstance extends IVariableInstance {
  readonly '@class':"PeerReviewInstance"
  /**
 List of review that contains others feedback

*/
reviewed: IReview[];
  /**
 Current review state

*/
reviewState: 'DISCARDED' | 'EVICTED' | 'NOT_STARTED' | 'SUBMITTED' | 'DISPATCHED' | 'NOTIFIED' | 'COMPLETED';
  /**
 List of review that contains feedback written by player owning this

*/
toReview: IReview[];
}

/*
 * ITaskInstance
 */
/**

 
*/
interface ITaskInstance extends IVariableInstance {
  /**


*/
requirements: IWRequirement[];
  readonly '@class':"TaskInstance"
  /**


*/
active: boolean;
  /**


*/
properties: {
  [key: string] :string
};
  /**


*/
plannification: number[];
}

/*
 * INumberInstance
 */
/**
 
*/
interface INumberInstance extends IVariableInstance {
  readonly '@class':"NumberInstance"
  /**


*/
history: number[];
  /**


*/
value: number;
}

/*
 * IFSMInstance
 */
/**

 
*/
interface IFSMInstance extends IVariableInstance {
  readonly '@class':"FSMInstance"
  /**


*/
transitionHistory: number[];
  /**


*/
currentStateId: number;
  /**


*/
enabled: boolean;
}

/*
 * IListInstance
 */
interface IListInstance extends IVariableInstance {
  readonly '@class':"ListInstance"
}

/*
 * IChoiceInstance
 */
/**

 
*/
interface IChoiceInstance extends IVariableInstance {
  readonly '@class':"ChoiceInstance"
  /**


*/
replies: IReply[];
  /**


*/
currentResultName?: string | null;
  /**


*/
unread: boolean;
  /**


*/
active: boolean;
  /* @deprecated */
  currentResultIndex?: number | null;
}

/*
 * IInboxInstance
 */
/**
 
*/
interface IInboxInstance extends IVariableInstance {
  readonly '@class':"InboxInstance"
  /**
 @return unread message count

*/
readonly unreadCount?: number | null;
  /**


*/
messages: IMessage[];
}

/*
 * IResourceInstance
 */
/**

 
*/
interface IResourceInstance extends IVariableInstance {
  readonly '@class':"ResourceInstance"
  /**


*/
assignments: IAssignment[];
  /**


*/
activities: IActivity[];
  /**


*/
confidence?: number | null;
  /**


*/
active: boolean;
  /**


*/
occupations: IOccupation[];
  /**


*/
properties: {
  [key: string] :string
};
}

/*
 * IQuestionInstance
 */
/**
 
*/
interface IQuestionInstance extends IVariableInstance {
  readonly '@class':"QuestionInstance"
  /**
 False until the user has clicked on the global question-wide "submit" button.

*/
validated: boolean;
  /**


*/
unread: boolean;
  /**


*/
active: boolean;
}

/*
 * IStaticTextInstance
 */
interface IStaticTextInstance extends IVariableInstance {
  readonly '@class':"StaticTextInstance"
}

/*
 * ITextInstance
 */
/**
 
*/
interface ITextInstance extends IVariableInstance {
  readonly '@class':"TextInstance"
  /**


*/
trValue?: ITranslatableContent | null;
}

/*
 * IStringInstance
 */
/**
 
*/
interface IStringInstance extends IVariableInstance {
  readonly '@class':"StringInstance"
  /**


*/
trValue: ITranslatableContent;
}

/*
 * ISurveyInstance
 */
/**
 Instance of the SurveyDescriptor variable:<br>
 - keeps the list of questions/replies that are to be replied.

  @see SurveyDescriptor

*/
interface ISurveyInstance extends IVariableInstance {
  readonly '@class':"SurveyInstance"
  active: boolean;
  status: 'NOT_STARTED' | 'REQUESTED' | 'ONGOING' | 'COMPLETED' | 'CLOSED';
}

/*
 * ISurveySectionInstance
 */
/**
 Dummy instance for SurveySectionDescriptor.


*/
interface ISurveySectionInstance extends IVariableInstance {
  readonly '@class':"SurveySectionInstance"
  active: boolean;
}

/*
 * IObjectInstance
 */
/**

 
*/
interface IObjectInstance extends IVariableInstance {
  readonly '@class':"ObjectInstance"
  /**


*/
properties: {
  [key: string] :string
};
}

/*
 * IAchievementInstance
 */
/**

 
*/
interface IAchievementInstance extends IVariableInstance {
  readonly '@class':"AchievementInstance"
  /**


*/
achieved: boolean;
}

/*
 * IWhQuestionInstance
 */
/**
 
*/
interface IWhQuestionInstance extends IVariableInstance {
  /**


*/
feedback?: ITranslatableContent | null;
  readonly '@class':"WhQuestionInstance"
  /**
 False until the user has clicked on the global question-wide "submit"
 button.

*/
validated: boolean;
  /**


*/
unread: boolean;
  /**


*/
active: boolean;
}

/*
 * IBooleanInstance
 */
/**

 
*/
interface IBooleanInstance extends IVariableInstance {
  readonly '@class':"BooleanInstance"
  /**


*/
value: boolean;
}

/*
 * ISurveyInputInstance
 */
/**

 A survey input instance just stores the status replied/unreplied of the corresponding
 question/input descriptor.

 
*/
interface ISurveyInputInstance extends IVariableInstance {
  /**
 False until the user has replied at least once to this question/input.

*/
isReplied: boolean;
  readonly '@class':"SurveyInputInstance"
  active: boolean;
}

/*
 * IAbstractContentDescriptor
 */
/**
 
*/
interface IAbstractContentDescriptor extends IMergeable {
  /**
 @return path

*/
readonly path: string;
  /**
 Some internal comment

*/
note: string;
  readonly '@class':"FileDescriptor" | "DirectoryDescriptor"
  /**
 The so-called visibility

*/
visibility?: 'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE';
  /**
 @return node size

*/
readonly bytes: number;
  /**
 @return the name

*/
readonly name: string;
  /**
 Some public comment

*/
description: string;
  readonly refId?: string;
  /**
 MIME type

*/
mimeType: string;
  readonly parentType?: string;
  readonly parentId?: number;
}

/*
 * IFileDescriptor
 */
/**
 
*/
interface IFileDescriptor extends IAbstractContentDescriptor {
  readonly '@class':"FileDescriptor"
  readonly bytes: number;
  dataLastModified?: number | null;
}

/*
 * IDirectoryDescriptor
 */
/**

 
*/
interface IDirectoryDescriptor extends IAbstractContentDescriptor {
  readonly '@class':"DirectoryDescriptor"
  readonly bytes: number;
}

/*
 * ITranslation
 */
/**

 Based on VariableProperty but with @Lob

 
*/
interface ITranslation extends IMergeable {
  readonly '@class':"Translation"
  translation: string;
  readonly refId?: string;
  readonly lang: string;
  status: string | null;
}

/*
 * InstanceOwner
 */
interface IInstanceOwner{
}

