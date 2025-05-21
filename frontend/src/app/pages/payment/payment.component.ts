import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  imports: [],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {
  router = inject(Router);
  http = inject(HttpClient);

  paymentDetails: any = {
    booking_id: '',
    amount: 0
  };

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;
    if (state) {
      this.paymentDetails = {
        booking_id: state['booking_id'],
        amount: state['schedule_total_price']
        
      };
    }
  }

  payNow() {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      alert('User not logged in or token missing!');
      this.router.navigate(['/login']);
      return;
    }

    const payload = {
      payment_booking_id: this.paymentDetails.booking_id,
      payment_amount: this.paymentDetails.amount,
      payment_mode: 'online',
      payment_status: 'paid',
    };
    console.log('payload', payload);

    this.http.post('http://localhost:5000/v1/api/payment/add', payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (res: any) => {
        console.log(res);
        alert('Payment successful!');
        this.router.navigate(['/my-bookings']);
      },
      error: (err: any) => {
        console.error('Payment failed:', err);
        alert('Payment failed. Please try again.');
      }
    });
  }

}
