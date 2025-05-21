import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  fromCity = new BehaviorSubject<string>('');
  toCity = new BehaviorSubject<string>('');
  date = new BehaviorSubject<Date | null>(null);
  constructor() {}
}
