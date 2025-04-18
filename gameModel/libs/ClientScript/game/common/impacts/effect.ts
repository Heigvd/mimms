import { IDescriptor, Tag, Uid } from '../interfaces';
import { Impact } from './impact';

export interface Effect extends IDescriptor {
  tag: Tag;
  parent: Uid;
  impacts: Impact[];
}
