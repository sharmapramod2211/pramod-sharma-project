import { Routes } from '@angular/router';
import {SearchComponent} from './pages/search/search.component';
import { SearchResultComponent } from './pages/search-result/search-result.component';
import { BookTicketComponent } from './pages/book-ticket/book-ticket.component';
import { MyBookingsComponent } from './pages/my-bookings/my-bookings.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { VerifyOtpComponent } from './pages/verify-otp/verify-otp.component';
import { PaymentComponent } from './pages/payment/payment.component';


export const routes: Routes = [
    {
        path: "",
        redirectTo: "search",
        pathMatch: "full"
    },
    {
       path: "search",
       component:SearchComponent
    },
    {
        path:"search-result",
        component:SearchResultComponent
    },
    {
        path:"book-ticket/:flightScheduleId",
        component:BookTicketComponent
    },
    {
        path:"my-bookings",
        component:MyBookingsComponent
    },
    {
        path:"login",
        component:LoginComponent
    },
    {
        path:"register",
        component:RegisterComponent
    },
    {
        path:"verify-otp",
        component:VerifyOtpComponent
    }, 
    {
        path:"payment",
        component: PaymentComponent
    }
];
