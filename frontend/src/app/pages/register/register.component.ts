import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [NgIf, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  user = {
    user_name: '',
    user_email: '',
    user_password: '',
    user_phone: '',
    user_aadhar: '',
  };

  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  router = inject(Router);

  errorMessage: string = '';

  onRegister(registerForm: any) {
    if (!registerForm.valid) {
      this.errorMessage = 'Please fix the validation errors in the form.';
      return; 
    }
    
    this.http.post<any>('http://localhost:5000/v1/api/user/register', this.user).subscribe({
      next: (res) => {
        alert(res.message || 'Registration successful, please verify your email.');
        if(res.message === 'User already registered, please login'){
          this.router.navigate(['/login']);
        } else
        this.router.navigate(['/verify-otp'], {
          queryParams: { email: this.user.user_email }
        });
      },
      error: (err) => {
        {
          this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
          console.error('HTTP error:', err);
        }
      }
    });
  }
  
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
