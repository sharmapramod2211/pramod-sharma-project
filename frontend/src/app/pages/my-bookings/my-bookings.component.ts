import { DatePipe, NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-my-bookings',
  imports: [NgFor, NgIf, DatePipe],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.css'
})
export class MyBookingsComponent {
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  router = inject(Router);
  Data = inject(DataService);

  bookings: any[] = [];
  userId: number = 0;
  lastBooking: any = null;
  previousBookings: any[] = [];
  loading: boolean = true;

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      this.userId = parsedUser.id;
      this.getBookingHistory();
    } else {
      this.loading = false;
      console.error('User not logged in or missing from localStorage');
    }
  }

  getBookingHistory(): void {
    this.http.get<any>(`http://localhost:5000/v1/api/details/bookings/${this.userId}`)
      .subscribe({
        next: (res) => {
          if (res.status_code === '200') {
            const data = res.data || [];
            console.log("data", data);

            data.sort((a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            this.lastBooking = data.length > 0 ? data[0] : null;
            // console.log("lastBookings",this.lastBooking);
            this.previousBookings = data.length > 1 ? data.slice(1) : [];
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching bookings', err);
          this.loading = false;
        }
      });
  }

  cancelBooking(bookingId: number): void {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('User not logged in. Please login again.');
      this.router.navigate(['/login']);
      return;
    }

    if (confirm("Are you sure?")) {
      this.http.put('http://localhost:5000/v1/api/booking/delete', {
          booking_id: bookingId,
          user_id: this.userId
        })
        .subscribe({
          next: (res: any) => {
            alert("Booking cancelled successfully");
            this.getBookingHistory(); 
          },
          
          error: (err) => {
          console.error('Error fetching cancel bookings', err);
          this.loading = false;
        }
        });
    }
  }
}
