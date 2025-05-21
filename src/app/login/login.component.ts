import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(private formBuilder: FormBuilder, private router: Router, private authService: AuthService) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      console.log(this.loginForm.value);
      this.authService.login(this.loginForm.value).subscribe((res: any) => {
        console.log(res);
        localStorage.setItem('user', JSON.stringify(res));
        this.isLoading = false;
        this.router.navigate(['/image-visualizer']);
      }, (err: any) => {
        this.errorMessage = err.error.message;
        this.isLoading = false;
      });
    } else {
      this.errorMessage = 'Invalid form data';
    }
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
