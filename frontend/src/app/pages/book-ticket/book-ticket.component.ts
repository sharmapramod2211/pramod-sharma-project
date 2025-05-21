import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-book-ticket',
  imports: [NgIf, FormsModule, NgFor, DatePipe],
  templateUrl: './book-ticket.component.html',
  styleUrl: './book-ticket.component.css'
})

export class BookTicketComponent {
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  router = inject(Router);
  Data = inject(DataService);

  flightScheduleId: any;
  flightDetails: any = {
    airplane_name: '',
    departure: '',
    arrival: '',
    from_city: '',
    to_city: '',
    duration: ''
  };

  seats: any[] = [];
  selectedSeats: string[] = [];
  seatRows: any[] = [];
  passengerDetails: { seat: string, name: string }[] = [];
  bookingId: any[] = [];

  baseFare: number = 0;
  tax: number = 0;
  totalAmount: number = 0;
  
  ngOnInit(): void {
    this.flightScheduleId = this.route.snapshot.paramMap.get('flightScheduleId') || '';
    const flightData = history.state?.flightDetails; 
    this.fetchSeatsAndRedirect();
      
    if (flightData) {
      this.flightDetails = flightData;
      this.Data.fromCity.subscribe(city => {
        console.log("FROM city from service:", city);
        this.flightDetails.from_city = city;
      });
      this.Data.toCity.subscribe(city => {
        console.log("To from service:", city);
        this.flightDetails.to_city = city;
      });
      this.Data.date.subscribe(date => {
        this.flightDetails.date = date;
      })
      this.baseFare = Number(flightData.schedule_price) || 0;
      this.recalculateTotal();
    } else if (this.flightScheduleId) {
      this.getFlightScheduleDetails();  
    }
  }

  getFlightScheduleDetails() {
    this.http.get(`http://localhost:5000/v1/api/flight-schedule/schedule/${this.flightScheduleId}`)
      .subscribe(async (res: any) => {
        const data = res?.data?.[0];
        // console.log('====================================');
        // console.log("flightdata234", data );
        // console.log('====================================');
        if (data) {

          const fromCityName = await this.getCityNameById(data.schedule_from_city_id);
          const toCityName = await this.getCityNameById(data.schedule_to_city_id);
  
          this.flightDetails = {
            airplane_name: data.airplane_name,
            date: data.schedule_date,
            departure: data.schedule_departure_time,
            arrival: data.schedule_arrival_time,
            from_city: fromCityName,
            to_city: toCityName,
            duration: data.schedule_duration
          };
  
          this.baseFare = Number(data.schedule_price_per_seat);
          this.recalculateTotal();
        }
        if (!this.flightDetails.from_city || !this.flightDetails.to_city) {
          alert("City names are still loading. Please wait a moment.");
          return;
        }
      });
  }  
  
  getCityNameById(id: number): Promise<string> {
    return this.http.get<any>(`http://localhost:5000/v1/api/city/${id}`)  
      .toPromise()
      .then(res => res?.data?.city_name || 'Unknown')
      .catch(() => 'Unknown');
  }

  fetchSeatsAndRedirect() {
  const timestamp = new Date().getTime();

  this.selectedSeats = [];
  this.passengerDetails = [];

  this.http.get(`http://localhost:5000/v1/api/flight-schedule/seats/${this.flightScheduleId}`)
    .subscribe((res: any) => {
      const allSeats = res?.data || [];
      const seatRows = [];

      for (let i = 0; i < allSeats.length; i += 6) {
        const rowSeats = allSeats.slice(i, i + 6).map((seat: any) => {
          const isBooked = seat.seat_is_booked === true;

          return {
            label: seat.seat_number,
            status: isBooked === true ? 'booked' : 'available'
          };
        });

        seatRows.push({
          label: `Row ${Math.floor(i / 6) + 1}`,
          left: rowSeats.slice(0, 3),
          right: rowSeats.slice(3, 6)
        });
      }

      this.seatRows = [...seatRows]; 
    });
  }

  toggleSeatSelection(seat: any) {
  if (seat.status === 'booked') return;

  if (seat.status === 'selected') {
    seat.status = 'available';

    this.selectedSeats = this.selectedSeats.filter(label => label !== seat.label);

    this.passengerDetails = this.passengerDetails.filter(p => p.seat !== seat.label);
  } 
  else if (seat.status === 'available') {
    seat.status = 'selected';
    this.selectedSeats.push(seat.label);
    this.passengerDetails.push({ seat: seat.label, name: '' });
  }

  this.recalculateTotal();
}


  recalculateTotal() {
    const seatCount = this.selectedSeats.length;
    const fare = this.baseFare * seatCount;
    this.tax = fare * 0.18; 
    this.totalAmount = fare + this.tax;
  }
  
  confirmBooking() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('User not logged in!');
      return;
    }
  
    const user = JSON.parse(userStr); 
    const user_id = user?.id;
    if (!user_id) {
      alert('Invalid user data!');
      return;
    }
  
    if (this.selectedSeats.length === 0) {
      alert('Please select at least one seat.');
      return;
    }

    const hasEmptyName = this.passengerDetails.some(p => !p.name || p.name.trim() === '');
    if (hasEmptyName) {
      alert('Please enter all passenger names.');
      return;
    }

    console.log("flightDetail",  this.flightDetails)
  
    const rawDate = new Date(this.flightDetails.departure);
    const formattedDate = rawDate.toISOString().replace('T', ' ').replace('Z', '');

    const selected_seats = this.passengerDetails.map(p => p.seat);
    const passengers = this.passengerDetails.map(p => ({ name: p.name }));

    const payload = {
      booking_user_id: user_id,
      booking_schedule_id: this.flightScheduleId,
      booking_schedule_date: formattedDate,
      schedule_from_city: this.flightDetails.from_city,
      schedule_to_city: this.flightDetails.to_city,
      schedule_total_price: this.totalAmount,
      selected_seats,
      passengers
    };
    console.log("payload ",payload);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('User not authenticated. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    this.http.post('http://localhost:5000/v1/api/booking/create', payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .subscribe({
      next: (res: any) => {
        console.log("res", res);
        alert('Booking successful! Please Make Payment');
        const bookingId = res?.data?.id;
        this.bookingId = bookingId;
        this.selectedSeats = [];
        this.passengerDetails = [];
        this.fetchSeatsAndRedirect();
        console.log(res.data);
        this.router.navigate(['/payment'], {
          state: {
            booking_user_id: user_id,
            booking_schedule_id: this.flightScheduleId,
            booking_schedule_date: formattedDate,
            schedule_from_city: this.flightDetails.from_city,
            schedule_to_city: this.flightDetails.to_city,
            schedule_total_price: this.totalAmount,
            selected_seats,
            passengers,
            booking_id: res?.data?.booking_id
          }
        });        
      },
      error: (err) => {
        console.error('Booking failed:', err);
        alert('Booking failed. Please try again.');
      }
    });
  }
} 
  



