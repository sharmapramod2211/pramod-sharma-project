import { DatePipe, NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-search-result',
  imports: [NgFor, NgIf, DatePipe],
  templateUrl: './search-result.component.html',
  styleUrl: './search-result.component.css'
})
export class SearchResultComponent implements OnInit {
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  router = inject(Router);
  Data = inject(DataService);

  flights: any[] = [];
  cityList: any[] = [];
  searchResults: any[] = [];
  airplaneMap: { [id: number]: string } = {}; 
  fromCity: string = '';
  toCity: string = '';


  ngOnInit(): void {
    this.getAllCities();
  }

  getAllCities() {
    this.http.get('http://localhost:5000/v1/api/city/citys').subscribe((res: any) => {
      this.cityList = Object.values(res.data || {});
      this.getSearchData(); 
    });
  }

  getSearchData() {
    this.route.queryParams.subscribe(params => {
      const fromId = params['fromId'];
      const toId = params['toId'];
      const date = params['date'];
  
      if (fromId && toId) {
        const fromCityObj = this.cityList.find(city => city.id === +fromId);
        const toCityObj = this.cityList.find(city => city.id === +toId);

        this.fromCity = fromCityObj ? fromCityObj.city_name : 'Unknown';
        this.toCity = toCityObj ? toCityObj.city_name : 'Unknown';
        this.Data.fromCity.next(this.fromCity)
        this.Data.toCity.next(this.toCity)
        if (!this.fromCity || !this.toCity) {
          console.error('City name not found for the provided ID');
          return;
        }
        this.searchFlightSchedule(this.fromCity, this.toCity, date);
      }
    });
  }

  fetchAirplaneName(id: number): void {
    if (this.airplaneMap[id]) return;
  
    this.http.get<any>(`http://localhost:5000/v1/api/airplane/${id}`)
      .subscribe(res => {
        const airplane = res.data?.[0];
        this.airplaneMap[id] = airplane?.airplane_name || 'Unknown';
      });
  }

  getAirplaneName(id: number): string {
    return this.airplaneMap[id] || 'Loading...';
  }

  searchFlightSchedule(fromCityName: string, toCityName: string, date: string) {
    const body = {
      schedule_from_city: fromCityName,
      schedule_to_city: toCityName,
      date: date
    };

    this.http.post('http://localhost:5000/v1/api/flight-schedule/searchFlightSchedule', body)
      .subscribe((res: any) => {
        if (res.status_code === '200') {
          this.flights = res.data;
          this.flights.forEach(flight => this.fetchAirplaneName(flight.schedule_airplane_id));
        } else {
          console.log("res", res);
          console.error('Error fetching flight schedules:', res.message);
        }
      }, error => {
        console.error('API error:', error);
      });
  }

  onBookNow(flight: any) {
    const user = localStorage.getItem('user');
    if (!user) {
      alert('Please login to book your flight.');
      this.router.navigate(['/login']);
      return;
    }
  
    this.router.navigate(['/book-ticket', flight.id], {
      state: {
        flightDetails: {
          airplane_name: this.getAirplaneName(flight.schedule_airplane_id),
          date: flight.schedule_departure_time,
          departure: flight.schedule_departure_time,
          arrival: flight.schedule_arrival_time,
          from_city: flight.schedule_from_city,
          to_city: flight.schedule_to_city,
          duration: flight.schedule_duration,
          schedule_price: flight.schedule_price_per_seat 
        }
      }
    });
  }  
}
