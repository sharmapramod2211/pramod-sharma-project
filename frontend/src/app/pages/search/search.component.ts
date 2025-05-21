import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface City {
  id: string;
  city_name: string;
}

@Component({
  selector: 'app-search',
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})


export class SearchComponent implements OnInit {
  
  constructor(private http: HttpClient, private router: Router) {}
  
  cityList: City[] = [];
  
  fromId: string = '';
  toId: string = '';
  fromCity: any;
  toCity: any;
  travelDate: string = '';
  minDate: string | undefined;
  filteredFromCities: any[] = [];
  filteredToCities: any[] = [];

  ngOnInit(): void {
    this.getAllCities();
    this.minDate = new Date().toISOString().split('T')[0]; 
  }

  getAllCities() {
    this.http.get("http://localhost:5000/v1/api/city/citys").subscribe((res: any) => {
      this.cityList = Object.values(res.data);
    });
  }

  onchange(event: any) {
    const { name, value } = event.target;
    if (name === 'fromId') {
      this.fromId = value;
    } else if (name === 'toId') {
      this.toId = value;
    }
  }

  searchFlights() {
    if (!this.fromId || !this.toId) {
      alert('Please select both From and To cities');
      return;
    }

    this.router.navigate(['/search-result'], {
      queryParams: {
        fromId: this.fromId,
        toId: this.toId,
        date: this.travelDate
      }
    });
  }

  

  filterCities(query: string, type: 'from' | 'to') {
    const filtered = this.cityList.filter(city => 
       city.city_name.length > 2 && city.city_name.toLowerCase().startsWith(query.toLowerCase())
    );
    
    if (type === 'from') {
      this.filteredFromCities = filtered;
    } else {
      this.filteredToCities = filtered;
    }
  }

  selectCity(city: any, type: 'from' | 'to') {
    if (type === 'from') {
      this.fromCity = city.city_name;
      this.fromId = city.id;
      this.filteredFromCities = [];
    } else {
      this.toCity = city.city_name;
      this.toId = city.id;
      this.filteredToCities = [];
    }
  }
}
