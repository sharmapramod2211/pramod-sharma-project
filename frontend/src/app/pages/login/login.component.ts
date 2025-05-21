import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [NgIf, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
}) 
export class LoginComponent {
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  router = inject(Router);

  user_email = '';
  user_password = '';
  errorMessage = '';
  successMessage = '';

  onLogin() {
    const body = {
      user_email: this.user_email,
      user_password: this.user_password,
    };

    this.http.post<any>('http://localhost:5000/v1/api/user/login', body).subscribe(
      (res) => {
        if (res.status_code == 200 || res.status_code == '200') {
          localStorage.setItem('user', JSON.stringify(res.data));
          localStorage.setItem('token', res.data.token);
          this.successMessage = 'Login successful!';
          this.errorMessage = '';
    
          this.router.navigate(['/search']).then(() => {
            console.log('Navigation successful');
          });
        } else {
          this.errorMessage = res.message || 'Invalid Credentials';
          this.successMessage = '';
        }
      },
      (err) => {
        this.errorMessage = 'Something went wrong. Please try again.';
        this.successMessage = '';
        console.error(err);
      }
    );    
  }

  onRegister() {
    this.router.navigate(['/register']);
  }
}
