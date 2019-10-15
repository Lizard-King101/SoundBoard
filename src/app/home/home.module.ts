import { NgModule } from '@angular/core';
import { HomeComponent } from './home.page';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const Routes: Routes = [{
    path: '',
    component: HomeComponent
}];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(Routes)
    ],
    declarations: [
        HomeComponent
    ]
})
export class HomeModule{}