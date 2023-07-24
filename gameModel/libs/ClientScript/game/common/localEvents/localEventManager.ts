import { localEventManagerLogger} from "../../../tools/logger";
import { SimTime } from "../baseTypes";
import { LocalEvent } from "./localEventBase";

export class LocalEventManager {

  private logger = localEventManagerLogger;
  // TODO figure out best data structure
  // TODO certainly one heap for pending and a record by ts for processed ones

  constructor() {

  }


  public addLocalEvent(event: LocalEvent){

  }

  public processPendingEvents(timeStamp : SimTime){
    // while there are pending events
    let safeguard = 0;
    let pending : LocalEvent[] = [];

    do{
      safeguard++;
      // TODO get main state apply to state

      pending = this.getPendingEvents(timeStamp);
    } while( safeguard <= 10 && pending.length >0)
    
    if(safeguard >= 10){
      this.logger.error('Too much event generations, might be an infinite event generation')
    }
  }

  private getPendingEvents(timeStamp: SimTime): LocalEvent[] {
    // TODO
    return [];
  }

}
