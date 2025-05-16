import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ImageVisualizerComponent } from './image-visualizer/image-visualizer.component';

export const routes: Routes = [
    {path: '', redirectTo: 'signup', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'signup', component: SignupComponent},
    {path: 'image-visualizer', component: ImageVisualizerComponent}
];
