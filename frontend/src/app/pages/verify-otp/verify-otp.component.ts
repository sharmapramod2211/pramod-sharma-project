import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-verify-otp',
  imports: [NgIf, FormsModule],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.css'
})
export class VerifyOtpComponent {
  otpData = {
    user_email: '',
    user_otp_verify: ''
  };
  errorMessage: string = '';

  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  router = inject(Router);

  
  onVerifyOtp() {
    this.http.post<any>('http://localhost:5000/v1/api/user/verify-otp', this.otpData).subscribe({
      next: (res) => {
        if (!res.error) {
          alert(res.message);
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = res.message;
          this.router.navigate(['/verify-otp'])
        }
      },
      error: () => {
        this.errorMessage = 'OTP verification failed. Please try again.';
      }
    });
  }
}
